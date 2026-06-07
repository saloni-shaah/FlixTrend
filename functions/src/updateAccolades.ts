import * as v1 from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

const db = admin.firestore();

const followerTiers = [
  { name: "legend", count: 10000000 },
  { name: "icon", count: 1000000 },
  { name: "force", count: 100000 },
  { name: "storm", count: 10000 },
  { name: "hype", count: 1000 },
  { name: "wave", count: 100 },
  { name: "buzz", count: 50 },
  { name: "spark", count: 10 },
];

const likeTiers = [
  { name: "phenomenon", count: 1000000 },
  { name: "sensation", count: 100000 },
  { name: "viral", count: 10000 },
  { name: "adored", count: 1000 },
  { name: "liked", count: 100 },
];

const leaderboardAccolades = [
  "top_1_follower",
  "top_2_follower",
  "top_3_follower",
  "top_4_follower",
  "top_5_follower",
];

function getThresholdAccolades(userData: any): string[] {
  const followerCount = Number(userData.Follower_Count ?? 0);
  const totalLikes = Number(userData.Total_likes ?? 0);

  return [
    ...followerTiers.filter(tier => followerCount >= tier.count).map(tier => tier.name),
    ...likeTiers.filter(tier => totalLikes >= tier.count).map(tier => tier.name),
  ];
}

export const updateAccolades = v1.pubsub
  .schedule("36 23 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async () => {
    logger.info("Starting scheduled accolade reconciliation.");

    try {
      const [topUsersSnap, usersSnap] = await Promise.all([
        db.collection("users").orderBy("Follower_Count", "desc").limit(5).get(),
        db.collection("users").get(),
      ]);

      const leaderboardMap = new Map<string, string>();
      topUsersSnap.docs.forEach((doc, index) => {
        leaderboardMap.set(doc.id, leaderboardAccolades[index]);
      });

      const batchSize = 450;
      let batch = db.batch();
      let writes = 0;
      let updatedUsers = 0;

      const flushBatch = async () => {
        if (writes === 0) return;
        await batch.commit();
        batch = db.batch();
        writes = 0;
      };

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const currentAccolades: string[] = Array.isArray(userData.accolades) ? userData.accolades : [];
        const thresholdAccolades = getThresholdAccolades(userData);
        const nonLeaderboardAccolades = currentAccolades.filter(
          badge => !leaderboardAccolades.includes(badge)
        );
        const desiredAccolades = new Set<string>([
          ...nonLeaderboardAccolades,
          ...thresholdAccolades,
        ]);

        const leaderboardBadge = leaderboardMap.get(userDoc.id);
        if (leaderboardBadge) {
          desiredAccolades.add(leaderboardBadge);
        }

        const nextAccolades = [...desiredAccolades].sort();
        const currentSorted = [...currentAccolades].sort();
        const needsUpdate = nextAccolades.length !== currentSorted.length
          || nextAccolades.some((badge, index) => badge !== currentSorted[index]);

        if (!needsUpdate) continue;

        batch.update(userDoc.ref, {
          accolades: nextAccolades,
        });
        writes += 1;
        updatedUsers += 1;

        if (writes >= batchSize) {
          await flushBatch();
        }
      }

      await flushBatch();
      logger.info(`Scheduled accolade reconciliation complete. Updated ${updatedUsers} users.`);
      return null;
    } catch (error) {
      logger.error("Error in scheduled accolade reconciliation:", error);
      return null;
    }
  });
