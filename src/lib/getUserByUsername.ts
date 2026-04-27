import { getFirestore } from '@/utils/firebaseAdmin';

export type UserProfile = {
  username: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
};

export async function getUserByUsername(
  username: string
): Promise<UserProfile | null> {
  const normalized = username?.toLowerCase();

  if (!normalized) {
    console.error('Invalid username provided');
    return null;
  }

  let firestore;

  try {
    firestore = getFirestore();
  } catch (error) {
    console.error('Firestore init error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    return null;
  }

  try {
    const snapshot = await firestore
      .collection('users')
      .where('username', '==', normalized)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    return snapshot.docs[0].data() as UserProfile;
  } catch (error) {
    console.error('Firestore query error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    return null;
  }
}