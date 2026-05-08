
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from '@/utils/firebaseAdmin';
import { getFirestore as getClientFirestore, collection, query, orderBy, limit, startAfter, getDocs, doc, getDoc } from 'firebase/firestore';
import { redisClient } from '@/utils/redis';
import { viewRateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const { success } = await viewRateLimit.limit(req.ip ?? "anon");
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const firestore = getFirestore();
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const limitParam = searchParams.get('limit') || '10';

  const q = cursor
    ? query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'), startAfter(cursor), limit(parseInt(limitParam)))
    : query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'), limit(parseInt(limitParam)));

  try {
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    return NextResponse.json({ posts, cursor: lastVisible?.id });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
