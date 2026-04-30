
import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/utils/cloudinary';
import admin from 'firebase-admin';
import { getFirestore } from '@/utils/firebaseAdmin';

// Ensure Firebase Admin is initialized
getFirestore();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { public_id, idToken } = body;

    if (!public_id || !idToken) {
      return NextResponse.json({ error: 'Missing public_id or idToken' }, { status: 400 });
    }

    // Verify the Firebase ID token to authenticate the user
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Optional: Check if the user is authorized to delete the media.
    // This might involve checking a database record to see who owns the media.

    // Delete the media from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id, { resource_type: 'video' });

    if (result.result === 'ok') {
      return NextResponse.json({ message: 'Media deleted successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to delete media from Cloudinary' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in delete-cloudinary-media handler:', error);
    if (error instanceof Error && 'code' in error && error.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Authentication token has expired.' }, { status: 401 });
    } else if (error instanceof Error && 'code' in error && error.code === 'auth/argument-error') {
        return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
    } else {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
}
