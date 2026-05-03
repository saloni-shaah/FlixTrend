import * as v1 from "firebase-functions/v1";
import { Change, EventContext } from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

const followerTiers = [
    { name: 'legend', count: 10000000 },
    { name: 'icon',   count: 1000000  },
    { name: 'force',  count: 100000   },
    { name: 'storm',  count: 10000    },
    { name: 'hype',   count: 1000     },
    { name: 'wave',   count: 100      },
    { name: 'buzz',   count: 50       },
    { name: 'spark',  count: 10       },
];

const likeTiers = [
    { name: 'phenomenon', count: 1000000 },
    { name: 'sensation',  count: 100000  },
    { name: 'viral',      count: 10000   },
    { name: 'adored',     count: 1000    },
    { name: 'liked',      count: 100     },
];

export const onUserUpdate = v1.firestore
    .document('users/{userId}')
    .onUpdate(async (change: Change<v1.firestore.DocumentSnapshot>, context: EventContext) => {

    const before = change.before.data();
    const after  = change.after.data();

    if (!before || !after) {
        logger.info("User data is missing, skipping update.");
        return null;
    }

    const accoladesToAward: string[] = [];

    // 1. Check Follower_Count changes
    const beforeFollowers = before.Follower_Count ?? 0;
    const afterFollowers  = after.Follower_Count  ?? 0;
    if (beforeFollowers !== afterFollowers) {
        logger.info(`Follower count changed for ${context.params.userId}.`);
        followerTiers
            .filter(tier => afterFollowers >= tier.count)
            .forEach(tier => accoladesToAward.push(tier.name));
    }

    // 2. Check Total_likes changes
    const beforeLikes = before.Total_likes ?? 0;
    const afterLikes  = after.Total_likes  ?? 0;
    if (beforeLikes !== afterLikes) {
        logger.info(`Total likes changed for ${context.params.userId}.`);
        likeTiers
            .filter(tier => afterLikes >= tier.count)
            .forEach(tier => accoladesToAward.push(tier.name));
    }

    if (accoladesToAward.length === 0) return null;

    // 3. KEY FIX: Only write if there are actually NEW accolades not already on the doc.
    //    This prevents the infinite re-trigger loop from the accolades write itself.
    const currentAccolades: string[] = after.accolades ?? [];
    const newAccolades = accoladesToAward.filter(a => !currentAccolades.includes(a));

    if (newAccolades.length === 0) {
        logger.info(`No new accolades to award for ${context.params.userId}. Skipping write.`);
        return null;
    }

    logger.info(`Awarding ${newAccolades.length} new accolades to ${context.params.userId}: ${newAccolades.join(', ')}`);
    return change.after.ref.update({
        accolades: admin.firestore.FieldValue.arrayUnion(...newAccolades)
    });
});