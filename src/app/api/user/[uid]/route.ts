

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from '@/utils/firebaseAdmin';
import { getFirestore as getClientFirestore, doc, getDoc } from 'firebase-admin/firestore';
import { redisClient } from '@/utils/redis';

export async function GET(req: NextRequest, { params }: { params: { uid: string } }) {
  const { uid } = params;
  const cacheKey = `user:${uid}`;

  try {
    const cachedUser = await redisClient.get(cacheKey);
    if (cachedUser) {
      return NextResponse.json(JSON.parse(cachedUser));
    }
  } catch (err) {
    console.warn('Redis cache read error', err);
  }

  try {
    const firestore = getFirestore();
    const userDoc = await getDoc(doc(firestore, 'users', uid));

    if (userDoc.exists()) {
      const user = { ...userDoc.data(), id: userDoc.id };
      await redisClient.set(cacheKey, JSON.stringify(user), 'EX', 3600); // Cache for 1 hour
      return NextResponse.json(user);
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Error fetching user ${uid}:`, error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
