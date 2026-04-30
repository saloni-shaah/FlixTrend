
import { NextRequest, NextResponse } from 'next/server';
import admin, { auth as adminAuth, firestore } from 'firebase-admin';
import { getFirestore } from '@/utils/firebaseAdmin';

// Initialize Firebase Admin
getFirestore();

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    // Verify the ID token to get the user's UID.
    const decodedToken = await adminAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Create a session cookie.
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn });

    // Set cookie policy for session cookie.
    const options = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    // Create a response with the session cookie.
    const response = NextResponse.json({ status: 'success' }, { status: 200 });
    response.cookies.set(options);

    return response;

  } catch (error) {
    console.error('Error creating session cookie:', error);
    // Respond with an error status.
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
