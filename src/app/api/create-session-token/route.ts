
import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth, firestore } from 'firebase-admin';
import { initAdmin } from '@/utils/firebaseAdmin';

// Initialize Firebase Admin
initAdmin();
const db = firestore();

export async function GET(req: NextRequest) {
  const idToken = req.headers.get('authorization')?.split('Bearer ')[1];

  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
  }

  try {
    // 1. Verify the user's ID token to get their UID.
    const decodedToken = await adminAuth().verifyIdToken(idToken);
    const { uid } = decodedToken;

    // 2. Use the UID to get the user's document from Firestore.
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    // 3. Check if the user exists and has the 'creator' accountType.
    if (!userDoc.exists || userDoc.data()?.accountType !== 'creator') {
      // If not, deny access. This is the crucial server-side check.
      return NextResponse.json({ error: 'Forbidden: You do not have creator access.' }, { status: 403 });
    }

    // 4. If they are a creator, create a custom token for them to sign into the studio.
    const customToken = await adminAuth().createCustomToken(uid);
    
    return NextResponse.json({ customToken });

  } catch (error: any) {
    console.error('Error creating custom token:', error);
    // Differentiate between auth errors and other errors
    if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Unauthorized: Token has expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
