import { getFirestore } from '@/utils/firebaseAdmin';

export type UserProfile = {
  uid: string;
  username: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  accountType?: string;
  // Add other profile fields here
  [key: string]: any; // Allow other fields
};

// Helper to convert Firestore Timestamps
const convertTimestamps = (data: any) => {
  const newData: { [key: string]: any } = {};
  for (const key in data) {
    const value = data[key];
    if (value && typeof value.toMillis === 'function') {
      newData[key] = value.toMillis();
    } else {
      newData[key] = value;
    }
  }
  return newData;
};

export async function getUserByUsername(
  username: string
): Promise<UserProfile | null> {
  const normalized = username?.toLowerCase();

  if (!normalized) {
    console.error('Invalid username provided');
    return null;
  }

  const db = getFirestore();

  try {
    const snapshot = await db
      .collection('users')
      .where('username', '==', normalized)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    const profileData = convertTimestamps(data);

    return { uid: doc.id, ...profileData } as UserProfile;
  } catch (error) {
    console.error('Firestore query error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    return null;
  }
}
