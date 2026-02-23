'use client';

import React, { useState, useEffect } from 'react';
import { auth, app } from "@/utils/firebaseClient";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Plus, Trash2, Link as LinkIcon, Save } from 'lucide-react';

const db = getFirestore(app);

export const StudioSettings = () => {
  const [supportLinks, setSupportLinks] = useState<{ title: string; url: string }[]>([]);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setSupportLinks(data.supportLinks || []);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleAddLink = () => {
    if (newLink.title && newLink.url) {
      setSupportLinks([...supportLinks, newLink]);
      setNewLink({ title: '', url: '' });
    }
  };

  const handleRemoveLink = (index: number) => {
    const updatedLinks = supportLinks.filter((_, i) => i !== index);
    setSupportLinks(updatedLinks);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        supportLinks: supportLinks
      });
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
      <h2 className="text-3xl font-bold mb-6">Creator Settings</h2>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4 flex items-center"><LinkIcon className="mr-2"/> Support Links</h3>
        <p className="text-gray-400 mb-4 text-sm">Add links to your Patreon, Ko-fi, or personal site.</p>
        
        <div className="space-y-3 mb-6">
            {supportLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                    <div className="flex items-center space-x-3">
                        <span className="font-semibold text-white">{link.title}</span>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-sm hover:underline">{link.url}</a>
                    </div>
                    <button onClick={() => handleRemoveLink(index)} className="text-red-500 hover:text-red-400">
                        <Trash2 size={20}/>
                    </button>
                </div>
            ))}
        </div>

        <div className="flex items-center space-x-2">
            <input 
                type="text" 
                placeholder="Title (e.g., Patreon)" 
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                className="input-glass flex-1"
            />
            <input 
                type="url" 
                placeholder="https://..."
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                className="input-glass flex-1"
            />
            <button onClick={handleAddLink} className="btn-glass bg-purple-600"><Plus/></button>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={handleSave} className="btn-primary flex items-center space-x-2" disabled={isSaving}>
            {isSaving ? (<span>Saving...</span>) : (<><Save size={20}/><span>Save Changes</span></>)}
        </button>
      </div>
    </motion.div>
  );
};
