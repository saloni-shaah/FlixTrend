import admin from 'firebase-admin';

function initializeApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing');
  }

  let serviceAccount;

  try {
    serviceAccount = JSON.parse(key);
  } catch {
    try {
      // Fix for escaped newlines in Vercel
      serviceAccount = JSON.parse(key.replace(/\\n/g, '\n'));
    } catch {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
    }
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// ✅ Always returns a working Firestore instance or throws
export function getFirestore() {
  const app = initializeApp();
  return admin.firestore(app);
}