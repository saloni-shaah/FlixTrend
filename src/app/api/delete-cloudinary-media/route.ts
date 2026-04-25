
import { NextResponse } from 'next/server';
import cloudinary from '@/utils/cloudinary';
import admin from 'firebase-admin';
import { initAdmin } from '@/utils/firebaseAdmin';

// Ensure Firebase Admin is initialized
initAdmin();

export async function POST(request: Request) {
  const { publicIds, songId, userId } = await request.json();

  const authToken = request.headers.get('Authorization');
  if (!authToken || !authToken.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idToken = authToken.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (decodedToken.uid !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!Array.isArray(publicIds) || publicIds.length === 0) {
      return NextResponse.json({ error: 'Invalid public_ids provided' }, { status: 400 });
    }

    // This deletes the resources from Cloudinary
    // The resource_type is automatically determined by Cloudinary
    const deletePromises = publicIds.map(publicId => {
        if (!publicId) return Promise.resolve(null); // Skip if publicId is empty
        return cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
    });
    
    await Promise.all(deletePromises);

    return NextResponse.json({ success: true, message: 'Media deleted successfully' });

  } catch (error: any) {
    console.error('Error in delete-cloudinary-media:', error);
     // Handle Firebase token verification errors
     if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
        return NextResponse.json({ error: 'Authentication token is invalid or expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
