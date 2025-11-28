"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cog, Palette, Lock, MessageCircle, LogOut, Trash2, AtSign, Mail, CheckCircle, UserX, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/utils/firebaseClient';
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { DeleteAccountModal } from '@/components/squad/DeleteAccountModal';
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from '@/utils/firebaseClient';

const functions = getFunctions(app);

export default function SettingsPage() {
    const [profile, setProfile] = useState<any>(null);
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        darkMode: false,
        simpleMode: false,
        accentColor: '#00F0FF',
        dmPrivacy: 'everyone',
        tagPrivacy: 'everyone',
        pushNotifications: true,
        emailNotifications: false,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
    const router = useRouter();

    const toggleAccountStatusCallable = httpsCallable(functions, 'toggleAccountStatus');
    
    useEffect(() => {
        const unsub = auth.onAuthStateChanged(user => {
            if(user) {
                setFirebaseUser(user);
                const userDocRef = doc(db, 'users', user.uid);
                const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setProfile({ uid: docSnap.id, ...data });
                        setSettings({
                            darkMode: localStorage.getItem('theme') === 'dark',
                            simpleMode: localStorage.getItem('simpleMode') === 'true',
                            accentColor: data.settings?.accentColor || '#00F0FF',
                            dmPrivacy: data.settings?.dmPrivacy || 'everyone',
                            tagPrivacy: data.settings?.tagPrivacy || 'everyone',
                            pushNotifications: data.settings?.pushNotifications ?? true,
                            emailNotifications: data.settings?.emailNotifications ?? false,
                        });
                    }
                     setLoading(false);
                });
                return () => unsubProfile();
            } else {
                router.push('/login');
            }
        });
        return () => unsub();
    }, [router]);

    const handleSettingChange = async (key: keyof typeof settings, value: any) => {
        setIsSaving(true);
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        if (key === 'darkMode') {
          document.documentElement.classList.toggle('dark', value);
          localStorage.setItem('theme', value ? 'dark' : 'light');
        }
        if (key === 'simpleMode') {
          document.documentElement.classList.toggle('simple', value);
          localStorage.setItem('simpleMode', String(value));
        }
        if (key === 'accentColor') {
          localStorage.setItem('accentColor', value);
          document.documentElement.style.setProperty('--accent-cyan', value);
          document.documentElement.style.setProperty('--brand-saffron', value);
        }
        
        try {
            if(firebaseUser) {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                await updateDoc(userDocRef, {
                    [`settings.${key}`]: value
                });
            }
        } catch (error) {
            console.error("Failed to save settings:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleAccountStatus = async () => {
        if (!firebaseUser) return;
        const action = firebaseUser.disabled ? "re-enable" : "disable";
        if (!window.confirm(`Are you sure you want to ${action} your account? You will be logged out.`)) return;

        setIsSaving(true);
        try {
            await toggleAccountStatusCallable({ uid: firebaseUser.uid, disable: !firebaseUser.disabled });
            alert(`Account successfully ${action}d.`);
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error(`Failed to ${action} account:`, error);
            alert(`Could not ${action} your account. Please try again.`);
        } finally {
            setIsSaving(false);
        }
    };


    const handleResendVerification = async () => {
        if (firebaseUser) {
            setResendStatus('sending');
            try {
                await sendEmailVerification(firebaseUser);
                setResendStatus('sent');
                setTimeout(() => setResendStatus('idle'), 3000);
            } catch (error) {
                console.error("Error resending verification email:", error);
                setResendStatus('idle');
            }
        }
    };
  
    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };
    
    if (loading || !profile || !firebaseUser) {
        return <div className="text-center text-accent-cyan">Loading settings...</div>;
    }

    return (
    <>
        <div className="w-full max-w-lg mx-auto p-4">
            <Link href="/squad" className="btn-glass mb-8 inline-flex items-center gap-2">
                <ArrowLeft /> Back to Profile
            </Link>
            <h2 className="text-2xl font-headline font-bold mb-6 text-accent-cyan flex items-center gap-2"><Cog /> Settings</h2>
            
            <div className="flex flex-col gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                    <Link href="/premium">
                        <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-accent-purple via-accent-pink to-brand-gold cursor-pointer mb-4">
                            <h4 className="font-headline font-bold text-white">Manage Premium</h4>
                            <p className="text-xs text-white/80">Upgrade or manage your subscription.</p>
                        </div>
                    </Link>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                <h3 className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><Palette /> Theme & UI</h3>
                <div className="flex items-center justify-between py-2">
                    <span>Dark Mode</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.darkMode} onChange={(e) => handleSettingChange('darkMode', e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-accent-cyan peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-cyan"></div>
                    </label>
                </div>
                <div className="flex items-center justify-between py-2">
                    <span>Simple Mode (B&W)</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.simpleMode} onChange={(e) => handleSettingChange('simpleMode', e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-accent-cyan peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-cyan"></div>
                    </label>
                </div>
                <div className="flex items-center justify-between py-2">
                    <span>Accent Color</span>
                    <input type="color" value={settings.accentColor} onChange={(e) => handleSettingChange('accentColor', e.target.value)} className="w-10 h-10 bg-transparent border-none rounded-full cursor-pointer"/>
                </div>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4">
                <h3 className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><Lock /> Privacy & Security</h3>
                    {firebaseUser?.emailVerified ? (
                        <div className="flex items-center justify-between py-2 text-green-400">
                            <span className="flex items-center gap-2"><Mail /> Email Verified</span>
                            <CheckCircle />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between py-2">
                            <span className="flex items-center gap-2 text-yellow-400"><Mail /> Email not verified</span>
                            <button 
                                className="btn-glass text-xs"
                                onClick={handleResendVerification}
                                disabled={resendStatus !== 'idle'}
                            >
                                {resendStatus === 'sending' ? 'Sending...' : resendStatus === 'sent' ? 'Sent!' : 'Resend Email'}
                            </button>
                        </div>
                    )}
                <div className="flex items-center justify-between py-2">
                    <span><MessageCircle className="inline-block mr-2"/> Who can DM you?</span>
                    <select value={settings.dmPrivacy} onChange={(e) => handleSettingChange('dmPrivacy', e.target.value)} className="input-glass text-sm">
                    <option value="everyone">Everyone</option>
                    <option value="mutuals">Mutuals</option>
                    <option value="none">No one</option>
                    </select>
                </div>
                <div className="flex items-center justify-between py-2">
                    <span><AtSign className="inline-block mr-2"/> Who can tag you?</span>
                    <select value={settings.tagPrivacy} onChange={(e) => handleSettingChange('tagPrivacy', e.target.value)} className="input-glass text-sm">
                    <option value="everyone">Following</option>
                    <option value="following">Following</option>
                    <option value="none">No one</option>
                    </select>
                </div>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4">
                <h3 className="flex items-center gap-2 mb-2 font-bold text-accent-cyan">Account Actions</h3>
                <button 
                    className={`btn-glass w-full mt-2 ${firebaseUser.disabled ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}
                    onClick={handleToggleAccountStatus} 
                    disabled={isSaving}
                >
                    <UserX className="inline-block mr-2" /> {firebaseUser.disabled ? 'Re-enable Account' : 'Disable Account'}
                </button>
                <button className="btn-glass bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-white w-full mt-4" onClick={() => setShowDeleteModal(true)}>
                    <Trash2 className="inline-block mr-2" /> Permanently Delete Account
                </button>
                </div>

                <button className="btn-glass bg-accent-pink/20 text-accent-pink hover:bg-accent-pink/40 hover:text-white w-full mt-4" onClick={handleLogout}>
                <LogOut className="inline-block mr-2" /> Log Out
                </button>
            </div>
        </div>
        {showDeleteModal && (
            <DeleteAccountModal 
                profile={profile}
                onClose={() => setShowDeleteModal(false)}
            />
        )}
    </>
    );
}