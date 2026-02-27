
import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth } from 'firebase-admin';
import { initAdmin } from '@/utils/firebaseAdmin';

initAdmin();

export async function GET(req: NextRequest) {
  const idToken = req.headers.get('authorization')?.split('Bearer ')[1];

  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify the ID token from the main domain.
    const decodedToken = await adminAuth().verifyIdToken(idToken);
    // Create a new custom token for the same user.
    const customToken = await adminAuth().createCustomToken(decodedToken.uid);
    
    return NextResponse.json({ sessionToken: customToken });
  } catch (error) {
    console.error('Error creating session token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
