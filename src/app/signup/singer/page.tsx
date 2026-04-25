'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, Check, ChevronsUpDown, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from '@/utils/firebaseClient';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GENRES, LANGUAGES } from '@/constants/genres';

// Reusable MultiSelect Component
const MultiSelect = ({ options, selected, onChange, placeholder }: any) => {
  const [open, setOpen] = useState(false);
  const selectedLabels = useMemo(() => options.filter((opt: any) => selected.includes(opt.value)).map((opt: any) => opt.label), [options, selected]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between input-glass h-auto min-h-10">
          <div className="flex flex-wrap gap-1">
            {selectedLabels.length > 0 ? selectedLabels.map((label: string) => <Badge key={label} variant="secondary">{label}</Badge>) : placeholder}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 glass-card">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>Nothing found.</CommandEmpty>
            <CommandGroup>
              {options.map((option: any) => (
                <CommandItem key={option.value} onSelect={() => onChange(option.value)}>
                  <Check className={`mr-2 h-4 w-4 ${selected.includes(option.value) ? "opacity-100" : "opacity-0"}`} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default function SingerApplicationPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const auth = getAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({ singerName: '', artistBio: '' });
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const singerDocRef = doc(db, 'singers', currentUser.uid);
        
        const [userDoc, singerDoc] = await Promise.all([getDoc(userDocRef), getDoc(singerDocRef)]);
        
        // More robust check as you recommended
        if (singerDoc.exists() || userDoc.data()?.isSinger === true) {
          toast({ title: "Already an Artist", description: "Redirecting to your Creator Studio..." });
          router.push('/studio');
          return;
        }
        setLoading(false);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.singerName.length < 3) {
      setError("Artist name must be at least 3 characters long.");
      return;
    }
    if (selectedGenres.length === 0) {
      setError("Please select at least one genre.");
      return;
    }
    if (selectedLanguages.length === 0) {
      setError("Please select at least one language.");
      return;
    }

    setLoading(true);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const singerDocRef = doc(db, 'singers', user.uid);

      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
          throw new Error("User profile not found. Cannot create artist profile.");
      }
      const username = userDoc.data()?.username || '';
      const artistSlug = formData.singerName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const batch = writeBatch(db);

      batch.set(singerDocRef, {
        uid: user.uid,
        singerName: formData.singerName,
        usernameRef: username,
        artistSlug: artistSlug,
        artistBio: formData.artistBio,
        artistAvatar: user.photoURL || '', 
        artistBanner: '',
        genres: selectedGenres,
        languages: selectedLanguages,
        socialLinks: { instagram: '', youtube: '', spotify: '', website: '' },
        followers: 0, totalStreams: 0, monthlyListeners: 0, totalSongs: 0,
        artistTier: 'indie', isVerified: false, isMonetized: false, isActive: true,
        contentWarnings: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        debutReleaseDate: null,
        analytics: { last30DaysStreams: 0, topCountry: '', topSongId: '' }
      });

      batch.update(userDocRef, { isSinger: true });

      await batch.commit();

      setSuccess(true);
      toast({ title: "Welcome!", description: "Your artist profile is now live." });
      setTimeout(() => router.push('/studio'), 1500);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error("Artist Signup Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !success) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in bg-grid-pattern">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 w-full max-w-2xl flex flex-col gap-6">
        <h2 className="text-3xl font-headline font-bold text-accent-cyan mb-2 text-center"><Music className="inline-block mr-2" />Create Your Artist Profile</h2>
        {success ? (
          <div className="text-center py-8">
            <motion.div initial={{scale: 0.5, opacity: 0}} animate={{scale: 1, opacity: 1}}><CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-4" /></motion.div>
            <h3 className="text-2xl font-bold text-green-400">Welcome to the Community!</h3>
            <p className="text-gray-300 mt-2">Your artist profile is live. Redirecting to the Creator Studio...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-white">
            <p className="text-sm text-gray-400 text-center">Establish your public artist identity. This will be visible to everyone.</p>
            <div className="grid grid-cols-1 gap-4">
              <Input placeholder="Public Artist/Band Name" value={formData.singerName} onChange={(e) => setFormData({...formData, singerName: e.target.value})} required className="input-glass" />
              <Textarea placeholder="Your artist bio (e.g., Indie singer creating chill vibes 🎧)" value={formData.artistBio} onChange={(e) => setFormData({...formData, artistBio: e.target.value})} required className="input-glass" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect options={GENRES} selected={selectedGenres} onChange={(value: string) => setSelectedGenres(p => p.includes(value) ? p.filter(v => v !== value) : [...p, value])} placeholder="Select Genres..." />
                <MultiSelect options={LANGUAGES} selected={selectedLanguages} onChange={(value: string) => setSelectedLanguages(p => p.includes(value) ? p.filter(v => v !== value) : [...p, value])} placeholder="Select Languages..." />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="btn-primary w-full mt-4" disabled={loading}>
              {loading ? <><Loader2 className="animate-spin mr-2"/>Creating Profile...</> : 'Complete Artist Setup'}
            </motion.button>
          </form>
        )}
        {error && <div className="text-red-400 bg-red-900/30 p-3 rounded-lg text-center flex items-center justify-center gap-2 mt-2"><XCircle size={20}/><span>{error}</span></div>}
      </motion.div>
    </div>
  );
}
