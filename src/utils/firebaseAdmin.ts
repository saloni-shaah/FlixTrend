
import admin from 'firebase-admin';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let serviceAccount;

if (serviceAccountKey) {
  try {
    // Vercel automatically escapes the secret, so we need to parse it correctly
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    // Fallback for local dev where it might not be a JSON string
    if (typeof serviceAccountKey === 'string' && serviceAccountKey.startsWith("{")) {
        try {
            serviceAccount = JSON.parse(JSON.parse(serviceAccountKey));
        } catch(e) {}
    }
  }
}

// Initialize Firebase Admin SDK
if (!admin.apps.length && serviceAccount) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK Initialized.');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
} else {
    if (!serviceAccount) {
        console.log('FIREBASE_SERVICE_ACCOUNT_KEY not found. Admin SDK not initialized.');
    }
}

// Export the initialized firestore instance
const firestore = admin.firestore();

export { firestore };

// Redundant initAdmin, kept for compatibility, but the top-level execution handles initialization now.
export const initAdmin = () => {
  if (!admin.apps.length && serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
};
