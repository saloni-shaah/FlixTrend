
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getFirestore } from '@/utils/firebaseAdmin';

// Initialize Firebase Admin
getFirestore();

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    // Verify the ID token to get the user's UID.
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Create a custom token.
    const customToken = await admin.auth().createCustomToken(uid);

    // Send the custom token back to the client.
    return NextResponse.json({ customToken }, { status: 200 });

  } catch (error) {
    console.error('Error creating custom token:', error);
    // Respond with an error status.
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
