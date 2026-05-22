'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cog, Palette, Lock, MessageCircle, LogOut, AtSign, Mail, CheckCircle, ArrowLeft, Music, User, Archive, Zap } from 'lucide-react';
import Link from 'next/link';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/utils/firebaseClient';
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { subscribeToPush, unsubscribeFromPush } from '@/utils/pushNotifications';

export default function SettingsPage() {
    const [profile, setProfile] = useState<any>(null);
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        theme: 'system',
        simpleMode: false,
        dmPrivacy: 'everyone',
        tagPrivacy: 'everyone',
        pushNotifications: true,
        emailNotifications: false,
        disappearingMessages: 90, // default to 90 days
    });
    const [isSaving, setIsSaving] = useState(false);
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [browserPushBlocked, setBrowserPushBlocked] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const blocked = Notification.permission === 'denied';
        setBrowserPushBlocked(blocked);

        if (blocked && settings.pushNotifications) {
            setSettings(prev => ({ ...prev, pushNotifications: false }));
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                updateDoc(userDocRef, { 'settings.pushNotifications': false }).catch(() => null);
            }
        }
    }, [settings.pushNotifications, firebaseUser]);

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
                            theme: localStorage.getItem('theme') || 'system',
                            simpleMode: data.settings?.simpleMode || false,
                            dmPrivacy: data.settings?.dmPrivacy || 'everyone',
                            tagPrivacy: data.settings?.tagPrivacy || 'everyone',
                            pushNotifications: data.settings?.pushNotifications ?? true,
                            emailNotifications: data.settings?.emailNotifications ?? false,
                            disappearingMessages: data.settings?.disappearingMessages || 90,
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

    const handleSettingChange = async (key: string, value: any) => {
        setSettings(prev => ({...prev, [key]: value}));

        if (key === 'theme') {
            if (value === 'system') {
                localStorage.removeItem('theme');
            } else {
                localStorage.setItem('theme', value);
            }
            window.dispatchEvent(new Event('themeChange'));
            return;
        }

        if (key === 'pushNotifications' && firebaseUser) {
            setIsSaving(true);
            const userDocRef = doc(db, "users", firebaseUser.uid);
            let shouldWriteSetting = true;

            try {
                if (value) {
                    const token = await subscribeToPush(firebaseUser.uid);
                    if (!token) {
                        shouldWriteSetting = false;
                        await updateDoc(userDocRef, { [`settings.${key}`]: false });
                        setSettings(prev => ({ ...prev, pushNotifications: false }));
                    }
                } else {
                    await unsubscribeFromPush(firebaseUser.uid);
                }

                if (shouldWriteSetting) {
                    await updateDoc(userDocRef, { [`settings.${key}`]: value });
                }
            } catch (error) {
                console.error("Failed to update push notification setting:", error);
                if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
                    await updateDoc(userDocRef, { [`settings.${key}`]: false }).catch(() => null);
                    setSettings(prev => ({ ...prev, pushNotifications: false }));
                } else {
                    setSettings(prev => ({ ...prev, pushNotifications: !value }));
                }
            } finally {
                setIsSaving(false);
            }
            return;
        }

        // For other settings, save to Firestore
        setIsSaving(true);
        if (firebaseUser) {
            try {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                await updateDoc(userDocRef, { [`settings.${key}`]: value });
                if (key === 'simpleMode') {
                    localStorage.setItem('simpleMode', String(value));
                    window.dispatchEvent(new Event('themeChange'));
                }
            } catch (error) {
                console.error("Failed to save settings:", error);
            } finally {
                setIsSaving(false);
            }
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
                <div className="bg-white/20 rounded-xl p-4">
                    <Link href="/premium">
                        <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-accent-purple via-accent-pink to-brand-gold cursor-pointer mb-4">
                            <h4 className="font-headline font-bold text-on-solid">Manage Premium</h4>
                            <p className="text-xs text-on-solid-muted">Upgrade or manage your subscription.</p>
                        </div>
                    </Link>
                </div>

                {!profile.isSinger && (
                    <div className="bg-white/20 rounded-xl p-4">
                        <h3 className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><Music /> Creator Tools</h3>
                        <Link href="/signup/singer">
                            <div className="w-full p-4 rounded-2xl bg-accent-cyan/10 hover:bg-accent-cyan/20 cursor-pointer">
                                <h4 className="font-headline font-bold text-accent-cyan">Become a Singer</h4>
                                <p className="text-xs text-on-solid-muted">Upload your music and start earning.</p>
                            </div>
                        </Link>
                    </div>
                )}
                
                <div className="bg-white/20 rounded-xl p-4">
                    <h3 className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><Palette /> Theme & UI</h3>
                    <div className="flex items-center justify-between py-2">
                        <span>Theme</span>
                        <select value={settings.theme} onChange={(e) => handleSettingChange('theme', e.target.value)} className="input-glass text-sm">
                            <option value="system">System</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span>Simple Mode</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.simpleMode} onChange={(e) => handleSettingChange('simpleMode', e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-accent-cyan peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-cyan"></div>
                        </label>
                    </div>
                </div>

                <div className="bg-white/20 rounded-xl p-4">
                    <h3 className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><Zap /> Signal Optimization</h3>
                    <div className="flex items-center justify-between py-2">
                        <span>Disappearing Messages</span>
                        <select value={settings.disappearingMessages} onChange={(e) => handleSettingChange('disappearingMessages', parseInt(e.target.value, 10))} className="input-glass text-sm">
                            <option value={90}>90 days</option>
                            <option value={30}>30 days</option>
                            <option value={21}>21 days</option>
                            <option value={7}>7 days</option>
                            <option value={1}>1 day</option>
                        </select>
                    </div>
                    <Link href="/settings/archived-chats">
                        <div className="w-full p-4 rounded-2xl bg-accent-cyan/10 hover:bg-accent-cyan/20 cursor-pointer mt-4">
                            <h4 className="font-headline font-bold text-accent-cyan">Manage Archived Chats</h4>
                            <p className="text-xs text-on-solid-muted">View and unarchive your chats.</p>
                        </div>
                    </Link>
                </div>
                
                <div className="bg-white/20 rounded-xl p-4">
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
                <div className="flex flex-col gap-2 py-2">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><Zap /> Push Notifications</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={settings.pushNotifications} onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-accent-cyan peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-cyan"></div>
                        </label>
                    </div>
                    {browserPushBlocked && (
                        <p className="text-sm text-yellow-400">Browser notifications are blocked. Enable them in your browser settings to receive push notifications.</p>
                    )}
                </div>
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

                <div className="bg-white/20 rounded-xl p-4">
                    <h3 className="flex items-center gap-2 mb-2 font-bold text-accent-cyan"><User /> Account Information</h3>
                    <Link href="/settings/additional">
                        <div className="w-full p-4 rounded-2xl bg-accent-cyan/10 hover:bg-accent-cyan/20 cursor-pointer">
                            <h4 className="font-headline font-bold text-accent-cyan">Update Profile</h4>
                            <p className="text-xs text-on-solid-muted">Change your username, age, and gender.</p>
                        </div>
                    </Link>
                </div>

                <button className="btn-glass bg-accent-pink/20 text-accent-pink hover:bg-accent-pink/40 hover:text-white w-full mt-4" onClick={handleLogout}>
                <LogOut className="inline-block mr-2" /> Log Out
                </button>
            </div>
        </div>
    </>
    );
}
