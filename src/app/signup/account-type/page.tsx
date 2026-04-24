"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import { Sparkles, User, ArrowRight, Users as UsersIcon, Brush, Gamepad2, GraduationCap, Popcorn } from 'lucide-react';

const creatorCategories = [
    { id: 'daily', name: 'Daily', icon: <UsersIcon className="w-4 h-4 mr-2"/>, sub: ['Vlogs', 'Moments', 'Travel', 'Self'] },
    { id: 'creative', name: 'Creative', icon: <Brush className="w-4 h-4 mr-2"/>, sub: ['Art', 'Photos', 'Design', 'Writing'] },
    { id: 'play', name: 'Play', icon: <Gamepad2 className="w-4 h-4 mr-2"/>, sub: ['Gaming', 'Challenges', 'Comedy', 'Reactions'] },
    { id: 'learn', name: 'Learn', icon: <GraduationCap className="w-4 h-4 mr-2"/>, sub: ['Tips', 'Tech', 'Study', 'Explainers'] },
    { id: 'culture', name: 'Culture', icon: <Popcorn className="w-4 h-4 mr-2"/>, sub: ['Music', 'Movies', 'Trends', 'Community'] },
];

export default function AccountTypePage() {
    const [step, setStep] = useState('choose'); // 'choose' or 'details'
    const [creatorType, setCreatorType] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const auth = getAuth();
    const db = getFirestore();

    const handleUserSelection = async () => {
        setLoading(true);
        setError('');
        const user = auth.currentUser;
        if (!user) {
            setError("You gotta be logged in to do that, fam.");
            router.push('/login');
            return;
        }

        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { accountType: 'user', creatorType: null });
            router.push('/signup/avatar-banner');
        } catch (err) {
            setError("Oof, something went sideways. Try again?");
            setLoading(false);
        }
    };

    const handleCreatorSelection = () => {
        setStep('details');
    };

    const handleCreatorDetailsSubmit = async () => {
        if (!creatorType) {
            setError("Spill the tea, what's your niche?");
            return;
        }
        setLoading(true);
        setError('');
        const user = auth.currentUser;
        if (!user) {
            setError("Hold up, you ain't logged in.");
            router.push('/login');
            return;
        }

        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { accountType: 'creator', creatorType: creatorType });
            router.push('/signup/avatar-banner');
        } catch (err) {
            setError("Major L. Something went wrong.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-animated-gradient p-4 flex items-center justify-center">
            {step === 'choose' ? (
                <motion.div
                    key="choose"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-4xl mx-auto"
                >
                    <h1 className="text-4xl md:text-5xl font-headline font-bold text-center mb-4 text-white">What's your vibe?</h1>
                    <p className="text-center text-gray-300 mb-12">Choose your journey. No wrong answers, we promise.</p>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Creator Card */}
                        <motion.div 
                            whileHover={{ y: -5, boxShadow: '0px 10px 20px rgba(255, 59, 172, 0.2)'}} 
                            className="glass-card p-8 rounded-2xl flex flex-col justify-between cursor-pointer border-2 border-accent-pink/20"
                            onClick={handleCreatorSelection}
                        >
                            <div>
                                <Sparkles className="w-12 h-12 text-accent-pink mb-4" />
                                <h2 className="text-3xl font-bold mb-2 text-white">Join as a Creator</h2>
                                <p className="text-gray-300">You're the main character. Get the keys to our studio with pro tools, analytics, and all the support to pop off and build your empire. It's giving boss.</p>
                            </div>
                        </motion.div>

                        {/* User Card */}
                        <motion.div 
                            whileHover={{ y: -5, boxShadow: '0px 10px 20px rgba(0, 240, 255, 0.2)' }} 
                            className="glass-card p-8 rounded-2xl flex flex-col justify-between cursor-pointer border-2 border-accent-cyan/20"
                            onClick={() => !loading && handleUserSelection()}
                        >
                            <div>
                                <User className="w-12 h-12 text-accent-cyan mb-4" />
                                <h2 className="text-3xl font-bold mb-2 text-white">Join as a User</h2>
                                <p className="text-gray-300">Here for the vibes? We gotchu. Get a feed that's all you and get lost in an endless doom scroll of fire content. It's your world to explore.</p>
                            </div>
                        </motion.div>
                    </div>
                    {error && <p className="text-red-400 text-center mt-8 animate-bounce">{error}</p>}
                </motion.div>
            ) : (
                <motion.div
                    key="details"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="glass-card p-8 w-full max-w-md flex flex-col gap-6"
                >
                    <h2 className="text-3xl font-headline font-bold text-accent-pink mb-2 text-center">Bet. Now what's your niche?</h2>
                    <p className="text-center text-gray-400 -mt-4 mb-4">Pick the category that best fits your content vibe.</p>
                    
                    <Select onValueChange={setCreatorType} value={creatorType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your creator type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {creatorCategories.map(category => (
                          <SelectGroup key={category.id}>
                            <SelectLabel>{category.name}</SelectLabel>
                            <SelectItem value={category.name.toLowerCase()} className="font-bold">
                              <div className="flex items-center">{category.icon} Mix of All {category.name}</div>
                            </SelectItem>
                            {category.sub.map(subType => (
                              <SelectItem key={subType} value={subType.toLowerCase()}>
                                {subType}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>

                    <motion.button
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                      onClick={handleCreatorDetailsSubmit}
                      className="btn-accent w-full flex items-center justify-center gap-2 disabled:opacity-50"
                      disabled={loading || !creatorType}
                    >
                      {loading ? 'Saving...' : 'Finish Signup'} <ArrowRight />
                    </motion.button>
                    
                    {error && <div className="text-red-400 text-center animate-bounce mt-2">{error}</div>}
                </motion.div>
            )}
        </div>
    );
}