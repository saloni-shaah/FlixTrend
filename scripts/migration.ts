
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize the Firebase Admin SDK
// Make sure to set the GOOGLE_APPLICATION_CREDENTIALS environment variable
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = getFirestore();

async function migrate() {
  const usersSnapshot = await db.collection('users').get();

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    console.log(`Processing user: ${userId}`);

    // Get follower, following, and post counts
    const followersSnapshot = await db.collection('users').doc(userId).collection('followers').get();
    const followingSnapshot = await db.collection('users').doc(userId).collection('following').get();
    const postsSnapshot = await db.collection('posts').where('userId', '==', userId).get();

    const Follower_Count = followersSnapshot.size;
    const Following_Count = followingSnapshot.size;
    const Posts_Count = postsSnapshot.size;

    // Update the user document with the new fields
    await db.collection('users').doc(userId).update({
      Follower_Count,
      Following_Count,
      Posts_Count,
    });

    console.log(`Updated user ${userId} with:
      Followers: ${Follower_Count}
      Following: ${Following_Count}
      Posts: ${Posts_Count}
    `);
  }

  console.log('Migration completed successfully!');
}

migrate().catch(console.error);
