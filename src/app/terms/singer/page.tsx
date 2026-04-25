'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const SingerTermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Link href="/signup/singer" className="btn-glass mb-8 inline-flex items-center gap-2">
            <ArrowLeft /> Back to Application
        </Link>
        <h1 className="text-4xl font-headline font-bold text-accent-pink mb-6">Flixtrend Singer's Agreement</h1>
        <div className="prose prose-invert max-w-none bg-white/5 rounded-xl p-6">
          <h2 className="font-semibold">1. Introduction</h2>
          <p>
            This Singer's Agreement ("Agreement") is a legal contract between you ("you", "your", or "Singer") 
            and Flixtrend ("Flixtrend", "we", "us", or "our"). This Agreement governs your use of the Flixtrend 
            platform to upload, distribute, and monetize your music content. By clicking "I Agree" and creating a 
            Singer account, you agree to be bound by the terms of this Agreement.
          </p>

          <h2 className="font-semibold">2. Content Ownership and Rights</h2>
          <p>
            You retain all ownership rights to your music, lyrics, and any other content you upload ("Your Content").
            However, by uploading Your Content to Flixtrend, you grant us a worldwide, non-exclusive, royalty-free, 
            sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, 
            display, and perform Your Content in connection with the Flixtrend service and our business.
          </p>

          <h2 className="font-semibold">3. Royalties and Payments</h2>
          <p>
            Flixtrend offers various monetization options. You may choose to make Your Content available for free, 
            or set a price for users to purchase or stream your music. Royalty splits and payment terms will be 
            detailed in a separate Payment Addendum, which will be provided to you upon approval of your Singer 
            application. All payments are subject to applicable taxes and fees.
          </p>
          
          <h2 className="font-semibold">4. Prohibited Content</h2>
          <p>
            You may not upload any content that infringes on the intellectual property rights of others, is 
            defamatory, obscene, or otherwise violates our Community Guidelines. We reserve the right to remove any 
            content that violates this Agreement or our policies.
          </p>

          <h2 className="font-semibold">5. Termination</h2>
          <p>
            You may terminate this Agreement at any time by removing all of Your Content from Flixtrend and deleting 
            your Singer account. We may terminate this Agreement if you breach any of its terms. Upon termination, 
            the licenses granted herein will terminate, but our rights to any of Your Content that has been 
            incorporated into user-generated content (such as collaborations or duets) will survive.
          </p>

          <p className="mt-8 text-sm text-gray-400">
            This is a summary of the key terms. The full legal agreement will be provided upon application approval. 
            Please consult with a legal advisor if you have any questions.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SingerTermsPage;
