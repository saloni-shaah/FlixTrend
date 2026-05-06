import admin from 'firebase-admin';

function fixPrivateKey(key: string): string {
  return key
    .replace(/\\\\n/g, '\n')  // double-escaped \\n → newline
    .replace(/\\n/g, '\n')    // single-escaped \n → newline
    .trim();
}

function initializeApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing');

  let serviceAccount: any;

  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    try {
      serviceAccount = JSON.parse(raw.replace(/\\n/g, '\n'));
    } catch {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON');
    }
  }

  if (!serviceAccount.private_key) {
    throw new Error('private_key missing from service account');
  }

  serviceAccount.private_key = fixPrivateKey(serviceAccount.private_key);

  if (!serviceAccount.private_key.includes('-----BEGIN')) {
    throw new Error(
      `private_key still malformed. Starts with: "${serviceAccount.private_key.slice(0, 60)}"`
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export function getFirestore() {
  const app = initializeApp();
  return admin.firestore(app);
}