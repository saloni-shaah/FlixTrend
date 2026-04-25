'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MusicUploadForm } from './MusicUploadForm';
import { MusicList } from './MusicList';

export const MusicManagement = () => {
  // This state is used to trigger a re-fetch in the MusicList component
  const [uploadCount, setUploadCount] = useState(0);

  const handleUploadSuccess = useCallback(() => {
    setUploadCount(prev => prev + 1);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-8"
    >
      <h2 className="text-3xl font-bold mb-6 text-white">Your Music</h2>
      
      {/* We will pass the handleUploadSuccess callback to the form */}
      <MusicUploadForm onUploadSuccess={handleUploadSuccess} />
      
      {/* The MusicList will now re-render when a new song is uploaded */}
      <MusicList key={uploadCount} />
    </motion.div>
  );
};
