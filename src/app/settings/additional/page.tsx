'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, writeBatch, updateDoc, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db } from '@/utils/firebaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Cake, VenetianMask, Trash2, Fingerprint, Copy, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { DeleteAccountModal } from '@/components/squad/DeleteAccountModal';

const PREDEFINED_GENDERS = [
    "prefer-not-to-say",
    "male",
    "female",
    "agender", "androgyne", "bigender", "cisgender",
    "demiboy", "demigirl", "genderfluid", "gender-nonconforming",
    "genderqueer", "gender-questioning", "intersex", "non-binary",
    "pangender", "polygender", "transgender", "two-spirit"
];

function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
    return age;
};

const isOldEnough = (dob: string) => calculateAge(dob) >= 13;
const sanitizeUsername = (username: string) => username.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');

export default function AdditionalSettingsPage() {
    const router = useRouter();
    const user = auth.currentUser;
    const functions = getFunctions();
    const checkUsernameCallable = httpsCallable(functions, 'checkUsername');

    const [initialProfile, setInitialProfile] = useState({ username: '', dob: '', gender: '' });
    const [profile, setProfile] = useState<any>(null);
    
    const [username, setUsername] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('prefer-not-to-say');
    const [customGender, setCustomGender] = useState('');

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<'username' | 'dob' | 'gender' | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [usernameChangeLimit, setUsernameChangeLimit] = useState(5);
    const [resetTimestamp, setResetTimestamp] = useState<Timestamp | null>(null);
    const [countdown, setCountdown] = useState('');

    const [error, setError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [ageError, setAgeError] = useState('');

    const fetchProfile = useCallback(async () => {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                let currentLimit = data.usernameChangeLimit ?? 5;
                let currentResetTime = data.limitResetTimestamp as Timestamp | null;

                if (currentResetTime && Timestamp.now().toMillis() > currentResetTime.toMillis()) {
                    await updateDoc(userDocRef, { usernameChangeLimit: 5, limitResetTimestamp: null });
                    currentLimit = 5;
                    currentResetTime = null;
                }

                setUsernameChangeLimit(currentLimit);
                setResetTimestamp(currentResetTime);
                
                setProfile({ uid: docSnap.id, ...data });
                setInitialProfile({ username: data.username || '', dob: data.dob || '', gender: data.gender || 'prefer-not-to-say' });
                setUsername(data.username || '');
                setDob(data.dob || '');
                if ([...PREDEFINED_GENDERS, 'other'].includes(data.gender)) { setGender(data.gender); } 
                else if (data.gender) { setGender('other'); setCustomGender(data.gender); }
            }
        } catch (e) {
            console.error("Error fetching profile:", e);
            setError("Could not load your profile data.");
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (user) { fetchProfile(); } else { router.push('/login'); }
    }, [user, router, fetchProfile]);

    useEffect(() => {
        if (!resetTimestamp) { setCountdown(''); return; }

        const intervalId = setInterval(() => {
            const now = Date.now();
            const resetMillis = resetTimestamp.toMillis();
            const remaining = resetMillis - now;

            if (remaining <= 0) {
                setCountdown('');
                clearInterval(intervalId);
                fetchProfile(); // Refetch profile to reset limit
                return;
            }

            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            setCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [resetTimestamp, fetchProfile]);

    const checkUsernameAvailability = useCallback(debounce(async (newUsername: string) => {
        if (newUsername === initialProfile.username) { setUsernameError(''); setIsCheckingUsername(false); return; }
        if (newUsername.length < 3) { setUsernameError("Username must be 3+ characters"); setIsCheckingUsername(false); return; }
        try {
            const result = await checkUsernameCallable({ username: newUsername });
            if ((result.data as { exists: boolean }).exists) { setUsernameError('Username is already taken.'); } else { setUsernameError(''); }
        } catch (error) { setUsernameError('Could not verify username.');
        } finally { setIsCheckingUsername(false); }
    }, 500), [initialProfile.username, checkUsernameCallable]);

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitized = sanitizeUsername(e.target.value);
        setUsername(sanitized);
        setUsernameError('');
        if (sanitized !== initialProfile.username) { setIsCheckingUsername(true); checkUsernameAvailability(sanitized); }
    };
    
    const handleCopyUid = () => { if (user?.uid) { navigator.clipboard.writeText(user.uid); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); } };

    const handleSave = async (field: 'username' | 'dob' | 'gender') => {
        if (!user) return;
        setIsSaving(field);
        setError('');
        const userDocRef = doc(db, 'users', user.uid);

        try {
            if (field === 'username') {
                if (usernameChangeLimit <= 0) throw new Error(`No changes left. Resets in ${countdown}.`);
                if (usernameError || isCheckingUsername || username.length < 3) throw new Error(usernameError || "Invalid username.");
                if (username === initialProfile.username) return;
                
                const batch = writeBatch(db);
                if (initialProfile.username) {
                    const oldUsernameRef = doc(db, 'usernames', initialProfile.username);
                    batch.delete(oldUsernameRef);
                }
                const newUsernameRef = doc(db, 'usernames', username);
                const newLimit = usernameChangeLimit - 1;
                const newResetTimestamp = Timestamp.fromMillis(Date.now() + 3 * 60 * 60 * 1000);

                batch.set(newUsernameRef, { uid: user.uid });
                batch.update(userDocRef, { username, usernameChangeLimit: newLimit, limitResetTimestamp: newResetTimestamp });
                
                await batch.commit();
                await fetchProfile(); // Force re-fetch to guarantee UI consistency

            } else if (field === 'dob') {
                if (ageError) throw new Error(ageError);
                await updateDoc(userDocRef, { dob });
                await fetchProfile();
            } else if (field === 'gender') {
                const genderToSave = gender === 'other' ? customGender : gender;
                await updateDoc(userDocRef, { gender: genderToSave });
                await fetchProfile();
            }
        } catch (err: any) { setError(err.message || `Failed to update ${field}.`);
        } finally { setIsSaving(null); }
    };

    if (loading) { return <div className="flex items-center justify-center min-h-screen text-accent-cyan">Loading...</div>; }

    const renderSaveButton = (field: 'username' | 'dob' | 'gender', isChanged: boolean, hasError: boolean) => {
        const isDisabled = isSaving === field || (field === 'username' && (isCheckingUsername || usernameChangeLimit <= 0));
        if (!isChanged || hasError) return null;

        return (
            <button onClick={() => handleSave(field)} disabled={isDisabled} className="btn-glass bg-accent-pink/80 w-full mt-2 disabled:bg-gray-600/50 disabled:cursor-not-allowed">
                {isSaving === field ? 'Saving...' : 'Save Changes'}
            </button>
        );
    }

    return (
    <>
        <div className="w-full max-w-lg mx-auto p-4">
            <Link href="/settings" className="btn-glass mb-8 inline-flex items-center gap-2"> <ArrowLeft /> Back to Settings </Link>
            <h2 className="text-2xl font-headline font-bold mb-6 text-accent-cyan">Account Details</h2>
            <div className="flex flex-col gap-4">
                <div className="glass-card p-6"><label className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><Fingerprint /> User ID</label><div className="relative"><input type="text" value={user?.uid || ''} readOnly className="input-glass w-full pr-10 bg-black/20 cursor-not-allowed"/><button onClick={handleCopyUid} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"> {isCopied ? <Check size={20} className='text-green-400'/> : <Copy size={20} />} </button></div></div>
                
                <div className="glass-card p-6">
                    <label className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><User /> Username</label>
                    <div className="relative">
                        <input type="text" value={username} onChange={handleUsernameChange} className={`input-glass w-full ${usernameError ? 'border-red-500' : ''}`} placeholder="Enter a unique username" disabled={usernameChangeLimit <= 0} />
                        {isCheckingUsername && <Loader2 size={20} className='absolute right-3 top-1/2 -translate-y-1/2 animate-spin'/>}
                    </div>
                    {usernameError && <p className="text-red-400 text-xs mt-1">{usernameError}</p>}
                    
                    {usernameChangeLimit > 0 ? (
                        <p className="text-xs text-gray-500 mt-1">Changes remaining: {usernameChangeLimit}</p>
                    ) : (
                        <p className="text-xs text-yellow-400 mt-1">Limit resets in: {countdown}</p>
                    )}
                    
                    {renderSaveButton('username', username !== initialProfile.username, !!usernameError)}
                </div>

                <div className="glass-card p-6"><div className='flex justify-between items-center mb-2'><label className="flex items-center gap-2 font-bold text-accent-cyan"><Cake /> Date of Birth</label><span className='text-sm text-gray-400'>Age: {calculateAge(dob)}</span></div><input type="date" value={dob} onChange={(e) => { setDob(e.target.value); setAgeError(!isOldEnough(e.target.value) ? 'You must be at least 13 years old.' : ''); }} className={`input-glass w-full ${ageError ? 'border-red-500' : ''}`}/>{ageError && <p className="text-red-400 text-xs mt-1">{ageError}</p>}{renderSaveButton('dob', dob !== initialProfile.dob, !!ageError)}</div>
                
                <div className="glass-card p-6">
                    <label className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><VenetianMask /> Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="input-glass w-full">
                        {PREDEFINED_GENDERS.map(g => <option key={g} value={g}>{g.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                        <option value="other">Other...</option>
                    </select>
                     {gender === 'other' && (<div className="relative mt-2"><input type="text" value={customGender} onChange={(e) => setCustomGender(e.target.value)} className="input-glass w-full" placeholder="Please specify"/></div>)}
                     {renderSaveButton('gender', gender !== initialProfile.gender || (gender === 'other' && customGender !== initialProfile.gender), false)}
                </div>

                {error && <p className="text-red-400 text-center p-2 bg-red-500/10 rounded-lg">{error}</p>}
                 
                <div className="glass-card p-6 mt-8"><h3 className="flex items-center gap-2 mb-2 font-bold text-red-400">Danger Zone</h3><button className="btn-glass bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-white w-full mt-2" onClick={() => setShowDeleteModal(true)}><Trash2 className="inline-block mr-2" /> Permanently Delete Account</button></div>
            </div>
        </div>
        {showDeleteModal && profile && <DeleteAccountModal profile={profile} onClose={() => setShowDeleteModal(false)} />}
    </>
    );
}
