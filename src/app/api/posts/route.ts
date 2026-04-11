
import { NextRequest, NextResponse } from 'next/server';
import { initAdmin } from '@/utils/firebaseAdmin';
import { getFirestore, collection, query, orderBy, limit, startAfter, getDocs, where, Timestamp } from 'firebase-admin/firestore';
import { redisClient } from '@/utils/redis';

initAdmin();
const db = getFirestore();
const POSTS_PER_PAGE = 5;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const subCategory = searchParams.get('subCategory');
    const lastVisibleJson = searchParams.get('lastVisible');

    const cacheKey = `posts:${category || 'all'}:${subCategory || 'all'}:${lastVisibleJson || 'first'}`;

    try {
        const cachedPosts = await redisClient.get(cacheKey);
        if (cachedPosts) {
            return NextResponse.json(cachedPosts);
        }

        const baseQuery = collection(db, "posts");
        let constraints: any[] = [orderBy("publishAt", "desc")];

        if (subCategory) {
            constraints.unshift(where("creatorType", "==", subCategory.toLowerCase()));
        } else if (category) {
            constraints.unshift(where("category", "==", category));
        }

        let lastVisible: any = null;
        if (lastVisibleJson) {
            const lastVisibleData = JSON.parse(lastVisibleJson);
            // Firestore timestamps need to be re-created from the serialized data
            lastVisible = {
                ...lastVisibleData,
                publishAt: new Timestamp(lastVisibleData.publishAt._seconds, lastVisibleData.publishAt._nanoseconds),
            }
            constraints.push(startAfter(lastVisible));
        }
        
        constraints.push(limit(POSTS_PER_PAGE));
        
        const postQuery = query(baseQuery, ...constraints);
        const documentSnapshots = await getDocs(postQuery);

        const newPosts = documentSnapshots.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                // Convert Timestamps to JSON-serializable format
                publishAt: data.publishAt.toDate().toISOString(),
                createdAt: data.createdAt.toDate().toISOString(),
            };
        });
        
        const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
        
        // Caching is only applied to the first page for simplicity
        if (!lastVisibleJson) {
             const response = { posts: newPosts, lastVisible: lastDoc?.data() };
             await redisClient.set(cacheKey, JSON.stringify(response), { ex: 300 }); // Cache for 5 minutes
             return NextResponse.json(response);
        }
       
        const response = { posts: newPosts, lastVisible: lastDoc?.data() };
        return NextResponse.json(response);

    } catch (error) {
        console.error("Error fetching posts: ", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
