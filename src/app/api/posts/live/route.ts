
import { NextResponse } from 'next/server';
import { firestore } from '@/utils/firebaseAdmin';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(req: Request) {
  try {
    const { title, thumbnailUrl, authorId, authorName, authorAvatar } = await req.json();

    if (!title || !thumbnailUrl || !authorId) {
      return NextResponse.json({ error: 'Missing required fields: title, thumbnailUrl, authorId' }, { status: 400 });
    }

    // 1. Generate a unique room name
    const roomName = `${authorId}-${Date.now()}`;

    // 2. Create a new post document in Firestore
    const postRef = firestore.collection('posts').doc();
    const newPost = {
      id: postRef.id,
      title,
      type: 'live',
      thumbnailUrl,
      authorId,
      authorName: authorName || 'Anonymous',
      authorAvatar: authorAvatar || '/default-avatar.png',
      createdAt: new Date(),
      liveStatus: 'live', // 'live', 'ended'
      roomName,
      viewCount: 0, // CORRECTED to match existing schema
      likes: 0,
    };

    await postRef.set(newPost);

    console.log(`Live post created successfully: ${postRef.id}, Room: ${roomName}`);

    // 3. Return the room name to the client
    return NextResponse.json({ roomName });

  } catch (error) {
    console.error('Error creating live stream:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
