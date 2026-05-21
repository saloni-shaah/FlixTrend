import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

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

export const onUserUpdate = functions
  .firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!before || !after) return null;

    if (
      before.Follower_Count === after.Follower_Count &&
      before.Total_likes === after.Total_likes
    ) {
      return null;
    }

    const currentAccolades: string[] = Array.isArray(after.accolades)
      ? after.accolades
      : [];

    const foundAccolades: string[] = [];

    const beforeFollowers = before.Follower_Count || 0;
    const afterFollowers = after.Follower_Count || 0;

    if (afterFollowers > beforeFollowers) {
      for (const tier of followerTiers) {
        if (
          beforeFollowers < tier.count &&
          afterFollowers >= tier.count &&
          !currentAccolades.includes(tier.name)
        ) {
          foundAccolades.push(tier.name);
        }
      }
    }

    const beforeLikes = before.Total_likes || 0;
    const afterLikes = after.Total_likes || 0;

    if (afterLikes > beforeLikes) {
      for (const tier of likeTiers) {
        if (
          beforeLikes < tier.count &&
          afterLikes >= tier.count &&
          !currentAccolades.includes(tier.name)
        ) {
          foundAccolades.push(tier.name);
        }
      }
    }

    const newAccolades = [...new Set(foundAccolades)];

    if (newAccolades.length === 0) return null;

    functions.logger.info(
      `Awarding accolades to ${context.params.userId}`,
      newAccolades
    );

    await change.after.ref.update({
      accolades: admin.firestore.FieldValue.arrayUnion(...newAccolades),
    });

    return null;
  });