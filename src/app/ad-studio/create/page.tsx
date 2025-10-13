
"use client";
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, UploadCloud, Eye, FileVideo, Gamepad2, Sparkles, X, DollarSign, Target, MousePointerClick, BarChart, Monitor } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/utils/firebaseClient';
import { useRouter } from 'next/navigation';
import { VibeSpaceLoader } from '@/components/VibeSpaceLoader';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { uploadFileToFirebaseStorage } from '@/app/actions';


const AdPlacementCard = ({ icon, title, description, selected, onSelect }: any) => (
  <div 
    className={`glass-card p-4 text-center cursor-pointer border-2 transition-colors ${selected ? 'border-accent-cyan' : 'border-transparent'}`}
    onClick={onSelect}
  >
    <div className="text-accent-pink mx-auto mb-2 w-12 h-12 flex items-center justify-center bg-accent-pink/10 rounded-full">{icon}</div>
    <h4 className="font-bold text-accent-cyan">{title}</h4>
    <p className="text-xs text-gray-400 mt-1">{description}</p>
  </div>
);

const AdPreview = ({ creative }: any) => {
    return (
        <div className="w-full max-w-[280px] h-[500px] bg-black rounded-3xl border-4 border-gray-700 shadow-2xl overflow-hidden relative p-2">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 h-4 w-20 bg-gray-800 rounded-full"></div>
            <div className="w-full h-full bg-gray-900 rounded-2xl overflow-y-auto">
                <div className="p-4 space-y-4">
                     <p className="text-xs text-gray-500 text-center mb-4">Ad Preview</p>
                    <div className="glass-card p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-accent-purple"></div>
                            <span className="text-sm font-bold">your_brand</span>
                            <span className="text-xs text-gray-500 ml-auto">Sponsored</span>
                        </div>
                        {creative.mediaUrl && creative.type === 'image' && <img src={creative.mediaUrl} className="rounded-lg w-full" />}
                        {creative.mediaUrl && creative.type === 'video' && <video src={creative.mediaUrl} className="rounded-lg w-full" controls />}
                        <p className="text-sm mt-2"><strong className="font-bold">{creative.headline}</strong> {creative.body}</p>
                        <button className="text-xs text-accent-cyan mt-2">{creative.callToAction || 'Learn More'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function CreateAdPage() {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [step, setStep] = useState(1);

    const [campaignDetails, setCampaignDetails] = useState({ name: '', budget: 10000, biddingStrategy: 'cpm' });
    const [adCreative, setAdCreative] = useState({ headline: '', body: '', callToAction: 'Learn More', callToActionUrl: '', mediaUrl: '', type: 'image' });
    const [placements, setPlacements] = useState<string[]>([]);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    
    if (loading) {
        return <VibeSpaceLoader />;
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    const handleCampaignChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCampaignDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCreativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAdCreative(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setMediaFile(file);
            setAdCreative(prev => ({
                ...prev,
                mediaUrl: URL.createObjectURL(file),
                type: file.type.startsWith('video') ? 'video' : 'image'
            }));
        }
    }

    const togglePlacement = (placement: string) => {
        setPlacements(prev => 
            prev.includes(placement) ? prev.filter(p => p !== placement) : [...prev, placement]
        );
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);
    
    const handleSubmit = async () => {
        setIsProcessing(true);
        setError('');

        if (!mediaFile || !user) {
            setError("Ad creative (image or video) and user authentication are required.");
            setIsProcessing(false);
            return;
        }

        try {
            // 1. Upload media file
            const formData = new FormData();
            formData.append('file', mediaFile);
            formData.append('userId', user.uid);
            const uploadResult = await uploadFileToFirebaseStorage(formData);
            if (!uploadResult.success?.url) {
                throw new Error(uploadResult.failure || "Failed to upload ad creative.");
            }
            const finalMediaUrl = uploadResult.success.url;

            // 2. Create Campaign Doc
            const campaignDocRef = await addDoc(collection(db, 'adCampaigns'), {
                ...campaignDetails,
                budget: Number(campaignDetails.budget),
                advertiserId: user.uid,
                status: 'active',
                placements: placements,
                createdAt: serverTimestamp(),
            });

            // 3. Create Creative Doc
            await addDoc(collection(db, 'adCampaigns', campaignDocRef.id, 'creatives'), {
                ...adCreative,
                mediaUrl: finalMediaUrl,
                campaignId: campaignDocRef.id,
                createdAt: serverTimestamp(),
            });

            alert('Campaign created successfully!');
            router.push('/ad-studio');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    }

    const renderStep = () => {
        switch(step) {
            case 1: // Campaign Details & Creative
                return (
                    <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-8 items-start">
                        <div>
                             <h3 className="text-xl font-bold text-accent-pink mb-4">1. Ad Creative</h3>
                             <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-video bg-black/20 rounded-lg border-2 border-dashed border-gray-500 flex flex-col items-center justify-center cursor-pointer mb-4"
                            >
                                {adCreative.mediaUrl ? (
                                    adCreative.type === 'image' ? 
                                    <img src={adCreative.mediaUrl} className="w-full h-full object-contain"/> :
                                    <video src={adCreative.mediaUrl} className="w-full h-full object-contain" />
                                ) : (
                                    <>
                                        <UploadCloud />
                                        <p>Upload Image/Video</p>
                                    </>
                                )}
                             </div>
                             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*"/>
                             <input type="text" name="headline" placeholder="Headline" value={adCreative.headline} onChange={handleCreativeChange} className="input-glass w-full mb-3" />
                             <input type="text" name="body" placeholder="Body Text" value={adCreative.body} onChange={handleCreativeChange} className="input-glass w-full mb-3" />
                             <input type="text" name="callToActionUrl" placeholder="https://yourwebsite.com" value={adCreative.callToActionUrl} onChange={handleCreativeChange} className="input-glass w-full" />
                        </div>
                        <div className="flex justify-center">
                            <AdPreview creative={adCreative} />
                        </div>
                    </motion.div>
                );
            case 2: // Targeting & Placements
                return (
                     <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="text-xl font-bold text-accent-pink mb-4">2. Ad Placements</h3>
                        <p className="text-gray-400 mb-6">Choose where your ads will appear on FlixTrend.</p>
                        <div className="grid md:grid-cols-3 gap-4">
                           <AdPlacementCard icon={<Monitor/>} title="VibeSpace Feed" description="Native ad within the main scrolling feed." selected={placements.includes('vibes_feed')} onSelect={() => togglePlacement('vibes_feed')} />
                           <AdPlacementCard icon={<Sparkles/>} title="Flashes" description="Full-screen, skippable ad between user Flashes." selected={placements.includes('flashes')} onSelect={() => togglePlacement('flashes')} />
                           <AdPlacementCard icon={<FileVideo/>} title="Scope Videos" description="Short skippable video ad between Scope clips." selected={placements.includes('scope')} onSelect={() => togglePlacement('scope')} />
                           <AdPlacementCard icon={<Gamepad2/>} title="Game Start" description="Non-skippable ad shown before a game starts." selected={placements.includes('games')} onSelect={() => togglePlacement('games')} />
                        </div>
                    </motion.div>
                );
            case 3: // Budget & Bidding
                 return (
                     <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                         <h3 className="text-xl font-bold text-accent-pink mb-4">3. Budget & Bidding</h3>
                         <div className="glass-card p-6 flex flex-col gap-6">
                            <div>
                                <label className="font-bold text-accent-cyan">Campaign Name</label>
                                <input type="text" name="name" value={campaignDetails.name} onChange={handleCampaignChange} className="input-glass w-full mt-2" placeholder="e.g. Summer Sale 2025" />
                            </div>
                            <div>
                                <label className="font-bold text-accent-cyan">Total Budget (INR)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                    <input type="number" name="budget" value={campaignDetails.budget} onChange={handleCampaignChange} className="input-glass w-full pl-10" min="1000"/>
                                </div>
                            </div>
                            <div>
                                <label className="font-bold text-accent-cyan">Bidding Strategy</label>
                                <div className="flex flex-col md:flex-row gap-2 mt-2">
                                     <button type="button" onClick={() => handleCampaignChange({ target: { name: 'biddingStrategy', value: 'cpm' } } as any)} className={`btn-glass text-sm flex-1 ${campaignDetails.biddingStrategy === 'cpm' ? 'bg-accent-cyan text-black' : ''}`}><BarChart className="inline mr-2"/>CPM (Cost per 1000 Impressions)</button>
                                     <button type="button" onClick={() => handleCampaignChange({ target: { name: 'biddingStrategy', value: 'cpc' } } as any)} className={`btn-glass text-sm flex-1 ${campaignDetails.biddingStrategy === 'cpc' ? 'bg-accent-cyan text-black' : ''}`}><MousePointerClick className="inline mr-2"/>CPC (Cost per Click)</button>
                                     <button type="button" onClick={() => handleCampaignChange({ target: { name: 'biddingStrategy', value: 'cpv' } } as any)} className={`btn-glass text-sm flex-1 ${campaignDetails.biddingStrategy === 'cpv' ? 'bg-accent-cyan text-black' : ''}`}><Eye className="inline mr-2"/>CPV (Cost per View)</button>
                                </div>
                            </div>
                         </div>
                     </motion.div>
                );
            default: return null;
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center p-4">
             <h2 className="text-3xl font-headline font-bold text-accent-pink mb-6 text-center">Create Your Ad Campaign</h2>

            <div className="w-full bg-black/20 rounded-full h-2.5 mb-8">
                <motion.div 
                    className="bg-gradient-to-r from-accent-pink to-accent-cyan h-2.5 rounded-full"
                    animate={{ width: `${(step / 3) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
            </div>

             <AnimatePresence mode="wait">
                {renderStep()}
             </AnimatePresence>

             {error && <div className="text-red-400 text-center animate-bounce mt-4">{error}</div>}

            <div className="flex justify-between items-center mt-8 w-full">
                {step > 1 ? (
                    <button type="button" className="btn-glass flex items-center gap-2" onClick={prevStep} disabled={isProcessing}>
                        <ArrowLeft size={16} /> Back
                    </button>
                ) : <div />}

                {step < 3 ? (
                    <button type="button" className="btn-glass bg-accent-pink flex items-center gap-2" onClick={nextStep}>
                        Next <ArrowRight size={16} />
                    </button>
                ) : (
                    <button type="submit" className="btn-glass bg-green-500 text-white flex items-center gap-2" disabled={isProcessing} onClick={handleSubmit}>
                        {isProcessing ? 'Publishing...' : 'Publish Campaign'}
                    </button>
                )}
            </div>
        </div>
    );
}
