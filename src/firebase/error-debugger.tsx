'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';
import { auth } from '@/utils/firebaseClient';

interface DebugInfo {
  error: FirestorePermissionError;
  user: User | null;
  rules: string;
}

export function FirebaseErrorDebugger() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
        // For now, we will just log the error to the console.
        // In a real app, you might fetch and display the rules here.
        console.error("Caught a permission error:", { 
            details: error.details, 
            currentUser: user ? { uid: user.uid, email: user.email } : null
        });
        setDebugInfo({ error, user, rules: 'rules_version = \'2\';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /users/{userId} {\n      allow read, write: if request.auth != null && request.auth.uid == userId;\n    }\n    match /prompts/current {\n      allow read: if true;\n      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == \'founder\';\n    }\n  }\n}' });
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [user]);

  if (!debugInfo) {
    return null;
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2>Firestore Security Rule Debugger</h2>
          <button onClick={() => setDebugInfo(null)} style={styles.closeButton}>&times;</button>
        </div>
        <div style={styles.content}>
            <Section title="Error">
                <p><strong>{debugInfo.error.name}:</strong> {debugInfo.error.message}</p>
            </Section>
            <Section title="Request Details">
                <pre>{JSON.stringify(debugInfo.error.details, null, 2)}</pre>
            </Section>
            <Section title="Authentication State (request.auth)">
                {debugInfo.user ? (
                    <pre>{JSON.stringify({ uid: debugInfo.user.uid, token: { email: debugInfo.user.email, email_verified: debugInfo.user.emailVerified } }, null, 2)}</pre>
                ) : (
                    <p>Not Authenticated</p>
                )}
            </Section>
            <Section title="Firestore Security Rules (firestore.rules)">
                <pre style={styles.rulesBox}>{debugInfo.rules}</pre>
            </Section>
        </div>
      </div>
    </div>
  );
}

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{title}</h3>
        {children}
    </div>
)


const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#2d2d2d',
        color: '#f1f1f1',
        borderRadius: '8px',
        width: '80%',
        maxWidth: '800px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #444',
    },
    closeButton: {
        background: 'transparent',
        border: 'none',
        color: '#f1f1f1',
        fontSize: '24px',
        cursor: 'pointer',
    },
    content: {
        padding: '16px',
        overflowY: 'auto',
    },
    section: {
        marginBottom: '16px',
    },
    sectionTitle: {
        fontWeight: 'bold',
        fontSize: '1.1em',
        borderBottom: '1px solid #555',
        paddingBottom: '8px',
        marginBottom: '8px',
    },
    rulesBox: {
        backgroundColor: '#1e1e1e',
        padding: '16px',
        borderRadius: '4px',
        whiteSpace: 'pre-wrap',
    },
};
