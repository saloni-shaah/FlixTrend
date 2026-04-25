'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from "@/utils/firebaseClient";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Link as LinkIcon, Save, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export const StudioSettings = () => {
  const [supportLinks, setSupportLinks] = useState<{ title: string; url: string }[]>([]);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
        setLoading(false);
        setError("User not authenticated.");
        return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setSupportLinks(data.supportLinks || []);
        }
      } catch (err: any) {
        console.error("Error fetching settings:", err);
        setError("Could not load your settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleAddLink = () => {
    if (newLink.title && newLink.url) {
      if (!newLink.url.startsWith('http')) {
          toast({ title: "Invalid URL", description: "Please enter a full URL including http:// or https://", variant: "destructive" });
          return;
      }
      setSupportLinks([...supportLinks, newLink]);
      setNewLink({ title: '', url: '' });
    }
  };

  const handleRemoveLink = (index: number) => {
    const updatedLinks = supportLinks.filter((_, i) => i !== index);
    setSupportLinks(updatedLinks);
  };

  const handleSave = async () => {
    if (!user) {
        toast({ title: "Save Failed", description: "You are not authenticated.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        supportLinks: supportLinks
      });
      toast({ title: "Settings Saved!", description: "Your support links have been updated." });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Error", description: "Could not save your settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const containerVariants = {
      hidden: { opacity: 0, y: 15 },
      visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
      hidden: { opacity: 0, x: -10 },
      visible: { opacity: 1, x: 0 }
  };

  if (loading) {
    return <div className="p-8 flex justify-center items-center"><Loader2 className="animate-spin"/></div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-400 flex flex-col items-center gap-2"><AlertTriangle/> {error}</div>;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-4 sm:p-6 md:p-8">
      <h2 className="text-3xl font-bold mb-8 text-white/90">Creator Settings</h2>
      
      <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2 text-white/80"><LinkIcon size={22} className="text-accent-cyan"/> Support Links</h3>
        <p className="text-gray-400 mb-6 text-sm">Add links to your Patreon, Ko-fi, or personal website.</p>
        
        <div className="space-y-3 mb-6">
            <AnimatePresence>
            {supportLinks.map((link, index) => (
                <motion.div 
                    key={index} 
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between bg-white/5 p-3 rounded-lg"
                >
                    <div className="flex items-center space-x-4 truncate">
                        <span className="font-semibold text-white truncate">{link.title}</span>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-accent-cyan text-sm hover:underline truncate">{link.url}</a>
                    </div>
                    <motion.button whileHover={{scale: 1.1}} whileTap={{scale: 0.9}} onClick={() => handleRemoveLink(index)} className="text-red-500 hover:text-red-400 ml-4">
                        <Trash2 size={18}/>
                    </motion.button>
                </motion.div>
            ))}
             </AnimatePresence>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
            <input 
                type="text" 
                placeholder="Title (e.g., Patreon)" 
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                className="input-glass w-full sm:w-1/3"
            />
            <input 
                type="url" 
                placeholder="https://your-link.com"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                className="input-glass w-full sm:flex-1"
            />
            <motion.button onClick={handleAddLink} whileTap={{scale:0.95}} className="btn-secondary bg-accent-cyan/10 hover:bg-accent-cyan/20 w-full sm:w-auto">
                <Plus/>
            </motion.button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-8 flex justify-end">
        <motion.button onClick={handleSave} className="btn-primary flex items-center gap-2" disabled={isSaving}  whileHover={{ scale: isSaving ? 1 : 1.05 }} whileTap={{ scale: isSaving ? 1 : 0.95 }}>
            {isSaving ? (<><Loader2 size={18} className="animate-spin"/><span>Saving...</span></>) : (<><Save size={18}/><span>Save Changes</span></>)}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
