'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  getAuth,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getFirestore, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';

// ─── DOB Helpers ─────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const getDaysInMonth = (month: number, year: number) =>
  new Date(year, month, 0).getDate();

const calculateAge = (day: string, month: string, year: string): number => {
  if (!day || !month || !year) return -1;
  const birth = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const buildISODate = (day: string, month: string, year: string) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

// ─── Username Validation ──────────────────────────────────────────────────────

const validateUsername = (value: string): string => {
  if (!value) return '';
  if (value.length > 30) return 'Username must be 30 characters or less.';
  if (/[^a-z0-9._]/.test(value)) return 'Only letters, numbers, periods (.) and underscores (_) are allowed.';
  if (value.startsWith('.') || value.endsWith('.')) return 'Username cannot start or end with a period.';
  if (value.startsWith('_') || value.endsWith('_')) return 'Username cannot start or end with an underscore.';
  if (/\.{2,}/.test(value)) return 'Username cannot have consecutive periods.';
  return '';
};

// ─── Underage Screen ──────────────────────────────────────────────────────────

function UnderageScreen({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      key="underage"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="glass-card p-8 w-full max-w-md flex flex-col items-center gap-6 text-center"
    >
      <motion.div
        animate={{ rotate: [0, -8, 8, -8, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        className="text-7xl select-none"
      >
        😔
      </motion.div>

      <h2 className="text-3xl font-headline font-bold text-accent-pink leading-tight">
        Oops, Not Quite Yet!
      </h2>

      <div className="flex flex-col gap-3 text-sm leading-relaxed text-gray-300">
        <p className="text-lg font-semibold text-accent-cyan">
          "Fake it till you make it" doesn't work here, little legend.
        </p>
        <p>
          We really, <span className="text-accent-pink font-bold">really</span> want you on FlixTrend.
          You clearly have great taste. 🔥
        </p>
        <p>
          But it's not us. It's not you either. <br />
          It's <span className="font-bold text-white">the government</span> —
          they made rules that say you need to be at least{' '}
          <span className="font-bold text-accent-cyan">13 years old</span> to
          join social platforms.
        </p>
        <p className="italic text-gray-400">
          We're genuinely sorry. Sit tight, keep creating, and we'll be right here
          waiting when the time comes. 🫶
        </p>
      </div>

      <div className="w-full rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-1">
        <p className="text-xs text-gray-500 uppercase tracking-widest">Until then...</p>
        <p className="text-accent-pink font-bold">✏️ Keep making stuff. Age up. Come back.</p>
        <p className="text-gray-400 text-xs">FlixTrend will be here.</p>
      </div>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onBack}
        className="btn-glass w-full mt-2 border border-accent-pink/40 text-accent-pink"
      >
        ← Go Back
      </motion.button>
    </motion.div>
  );
}

// ─── DOB Picker ───────────────────────────────────────────────────────────────

interface DOBPickerProps {
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  onDayChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onYearChange: (v: string) => void;
  disabled: boolean;
}

function DOBPicker({ dobDay, dobMonth, dobYear, onDayChange, onMonthChange, onYearChange, disabled }: DOBPickerProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const daysInMonth = useMemo(() => {
    if (dobMonth && dobYear) return getDaysInMonth(Number(dobMonth), Number(dobYear));
    return 31;
  }, [dobMonth, dobYear]);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectClass =
    'input-glass w-full appearance-none cursor-pointer bg-transparent text-white text-center focus:outline-none focus:ring-2 focus:ring-accent-pink/50 rounded-xl px-2 py-3';

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-accent-cyan tracking-wide">
        🎂 Date of Birth
      </label>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 text-center">Month</span>
          <select value={dobMonth} onChange={(e) => onMonthChange(e.target.value)} className={selectClass} disabled={disabled} required>
            <option value="">Month</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 text-center">Day</span>
          <select value={dobDay} onChange={(e) => onDayChange(e.target.value)} className={selectClass} disabled={disabled} required>
            <option value="">Day</option>
            {days.map((d) => (
              <option key={d} value={String(d)}>{d}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 text-center">Year</span>
          <select value={dobYear} onChange={(e) => onYearChange(e.target.value)} className={selectClass} disabled={disabled} required>
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Main Signup Page ─────────────────────────────────────────────────────────

export default function SignupPage() {
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUnderage, setShowUnderage] = useState(false);

  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();
  const functions = getFunctions();

  const age = useMemo(() => calculateAge(dobDay, dobMonth, dobYear), [dobDay, dobMonth, dobYear]);
  const dobComplete = !!(dobDay && dobMonth && dobYear);
  const isUnderage = dobComplete && age < 13;

  const handleDobChange = (field: 'day' | 'month' | 'year', value: string) => {
    const newDay   = field === 'day'   ? value : dobDay;
    const newMonth = field === 'month' ? value : dobMonth;
    const newYear  = field === 'year'  ? value : dobYear;

    if (field === 'day')   setDobDay(value);
    if (field === 'month') setDobMonth(value);
    if (field === 'year')  setDobYear(value);

    if (newDay && newMonth && newYear) {
      const computedAge = calculateAge(newDay, newMonth, newYear);
      if (computedAge < 13) setShowUnderage(true);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Force lowercase, strip spaces, cap at 30 chars as the user types
    const formatted = e.target.value
      .toLowerCase()
      .replace(/\s+/g, '')
      .slice(0, 30);
    setUsername(formatted);
    setUsernameError(validateUsername(formatted));
  };

  const handleBack = () => {
    setShowUnderage(false);
    setDobDay('');
    setDobMonth('');
    setDobYear('');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dobComplete) { setError('Please select your date of birth.'); return; }
    if (isUnderage) { setShowUnderage(true); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!username) { setError('Please enter a username.'); return; }

    const uErr = validateUsername(username);
    if (uErr) { setUsernameError(uErr); return; }

    setLoading(true);
    setError('');

    try {
      // Check username availability before creating the auth account
      const checkUsername = httpsCallable(functions, 'checkUsername');
      const result = await checkUsername({ username });
      if ((result.data as { exists: boolean }).exists) {
        throw new Error('This username is already taken.');
      }

      // Create auth account — Firebase throws auth/email-already-in-use if duplicate
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const batch = writeBatch(db);
      const premiumUntil = new Date();
      premiumUntil.setMonth(premiumUntil.getMonth() + 1);

      // /users/{uid}
      const userDocRef = doc(db, 'users', user.uid);
      batch.set(userDocRef, {
        email: user.email,
        username,
        provider: 'email',
        createdAt: serverTimestamp(),
        profileComplete: false,
        accolades: [],
        isPremium: true,
        premiumUntil: Timestamp.fromDate(premiumUntil),
        dob: buildISODate(dobDay, dobMonth, dobYear),
      });

      // /usernames/{username} — lowercase lock
      const usernameDocRef = doc(db, 'usernames', username);
      batch.set(usernameDocRef, { uid: user.uid });

      await batch.commit();

      router.push('/signup/phone-verification');

    } catch (error: any) {
      const user = auth.currentUser;

      const msg =
        error.code === 'auth/email-already-in-use'
          ? 'This email is already in use.'
          : error.message || 'An unexpected error occurred.';
      setError(msg);

      if (user) {
        try {
          const deleteUserAccount = httpsCallable(functions, 'deleteUserAccount');
          await deleteUserAccount();
          setError(msg + ' (Your incomplete account has been safely removed. Please try again.)');
        } catch (cleanupError: any) {
          setError('A critical error occurred. Please contact support.');
          console.error('CRITICAL: Failed to clean up orphaned user account:', user.uid, cleanupError);
        }
      }

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <AnimatePresence mode="wait">
        {showUnderage ? (
          <UnderageScreen key="underage" onBack={handleBack} />
        ) : (
          <motion.div
            key="signup"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-8 w-full max-w-md flex flex-col gap-6"
          >
            <h2 className="text-3xl font-headline font-bold text-accent-pink mb-2 text-center">
              Create Your Account
            </h2>

            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <DOBPicker
                dobDay={dobDay}
                dobMonth={dobMonth}
                dobYear={dobYear}
                onDayChange={(v) => handleDobChange('day', v)}
                onMonthChange={(v) => handleDobChange('month', v)}
                onYearChange={(v) => handleDobChange('year', v)}
                disabled={loading}
              />

              {dobComplete && !isUnderage && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-accent-cyan text-center -mt-1"
                >
                  🎉 Age verified — you're good to go!
                </motion.p>
              )}

              <Input
                type="email"
                placeholder="Email"
                className="input-glass w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />

              {/* Username with inline validation feedback */}
              <div className="flex flex-col gap-1">
                <Input
                  type="text"
                  placeholder="Username"
                  className={`input-glass w-full ${usernameError ? 'border-red-500' : ''}`}
                  value={username}
                  onChange={handleUsernameChange}
                  required
                  disabled={loading}
                  maxLength={30}
                />
                {usernameError ? (
                  <p className="text-red-400 text-xs px-1">{usernameError}</p>
                ) : username && !usernameError ? (
                  <p className="text-accent-cyan text-xs px-1">✓ Username looks good</p>
                ) : null}
                <p className="text-gray-500 text-xs px-1">
                  Letters, numbers, . and _ only · No spaces · Max 30 chars
                </p>
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="input-glass w-full pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  className="input-glass w-full pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <motion.button
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
                type="submit"
                className="btn-glass mt-2 bg-accent-pink/80 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !!isUnderage || !!usernameError}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </motion.button>
            </form>

            {error && (
              <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>
            )}

            <div className="text-center mt-2">
              <span className="text-gray-400">Already have an account? </span>
              <Link href="/login" className="text-accent-cyan hover:underline">Log in</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}