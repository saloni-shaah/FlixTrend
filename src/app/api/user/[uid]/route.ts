
import { NextRequest, NextResponse } from 'next/server';
import { initAdmin } from '@/utils/firebaseAdmin';
import { getFirestore, doc, getDoc } from 'firebase-admin/firestore';
import { redisClient } from '@/utils/redis';

initAdmin();
const db = getFirestore();

export async function GET(req: NextRequest, { params }: { params: { uid: string } }) {
    const { uid } = params;

    if (!uid) {
        return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    const cacheKey = `user:${uid}`;

    try {
        const cachedProfile = await redisClient.get(cacheKey);

        if (cachedProfile) {
            return NextResponse.json(cachedProfile);
        }

        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userProfile = { id: userDoc.id, ...userDoc.data() };
        
        await redisClient.set(cacheKey, JSON.stringify(userProfile), { ex: 3600 }); // Cache for 1 hour

        return NextResponse.json(userProfile);
    } catch (error) {
        console.error(`Error fetching profile for ${uid}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
