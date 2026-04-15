'use client';

import { useState, useEffect } from 'react';
import {
  getAuth,
  RecaptchaVerifier,
  linkWithPhoneNumber,
} from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import CountrySelector from '@/components/ui/CountrySelector';

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        initializeRecaptchaVerifier?: () => RecaptchaVerifier;
    }
}

export default function PhoneVerificationPage() {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();
  const functions = getFunctions();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.push('/signup');
      return;
    }

    window.initializeRecaptchaVerifier = () => {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
        });
      }
      return window.recaptchaVerifier;
    };

    return () => {
      window.recaptchaVerifier?.clear();
      window.recaptchaVerifier = undefined;
    };
  }, [auth, router]);

  const handleSendCode = async () => {
    setLoading(true);
    setError('');

    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to link a phone number.');
      setLoading(false);
      return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    try {
      const checkPhone = httpsCallable(functions, 'checkPhone');
      const result = await checkPhone({ phoneNumber: fullPhoneNumber });
      const data = result.data as { exists: boolean };

      if (data.exists) {
        setError('This phone number is already linked to another account.');
        setLoading(false);
        return;
      }
      
      const appVerifier = window.initializeRecaptchaVerifier!();
      const confirmation = await linkWithPhoneNumber(user, fullPhoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setCodeSent(true);
    } catch (error: any) {
      setError(error.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!confirmationResult) {
      setError('Something went wrong. Please try sending the code again.');
      return;
    }
    setVerifyLoading(true);
    setError('');

    try {
      await confirmationResult.confirm(code);
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          phoneNumber: `${countryCode}${phoneNumber}`,
        });
      }
      router.push('/signup/complete-profile');
    } catch (error: any) {
      if (error.code === 'auth/credential-already-in-use') {
        setError('This phone number is already linked to another account.');
      } else {
        setError(error.message || 'Failed to verify code.');
      }
    } finally {
        setVerifyLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-8 w-full max-w-md flex flex-col gap-6"
        >
            <div id="recaptcha-container"></div>
            <h2 className="text-3xl font-headline font-bold text-accent-pink mb-2 text-center">
                Link Your Phone
            </h2>
            {!codeSent ? (
                <form onSubmit={(e) => { e.preventDefault(); handleSendCode(); }} className="flex flex-col gap-4">
                    <CountrySelector onCountrySelect={setCountryCode} disabled={loading} />
                    <Input
                        type="tel"
                        placeholder="Phone Number"
                        className="input-glass w-full"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <motion.button
                        whileHover={{ scale: loading ? 1 : 1.05 }}
                        whileTap={{ scale: loading ? 1 : 0.95 }}
                        type="submit"
                        className="btn-glass mt-2 bg-accent-pink/80 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Sending Code...' : 'Send Code'}
                    </motion.button>
                </form>
            ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleVerifyCode(); }} className="flex flex-col gap-4">
                    <Input
                        type="text"
                        placeholder="Enter OTP"
                        className="input-glass w-full"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        disabled={verifyLoading}
                    />
                    <motion.button
                        whileHover={{ scale: verifyLoading ? 1 : 1.05 }}
                        whileTap={{ scale: verifyLoading ? 1 : 0.95 }}
                        type="submit"
                        className="btn-glass mt-2 bg-accent-pink/80 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={verifyLoading}
                    >
                        {verifyLoading ? 'Verifying...' : 'Verify & Link Account'}
                    </motion.button>
                </form>
            )}
            {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
        </motion.div>
    </div>
  );
}
