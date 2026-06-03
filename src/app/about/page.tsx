'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export const metadata = {
  title: 'About FlixTrend - The Future of Social Video Streaming',
  description: 'Discover FlixTrend, the revolutionary social platform combining TikTok, YouTube Shorts, and Instagram Reels with AI-powered discovery, premium features, and creator tools.',
  canonical: 'https://flixtrend.com/about',
  openGraph: {
    title: 'About FlixTrend - The Future of Social Video Streaming',
    description: 'Discover FlixTrend, the revolutionary social platform combining TikTok, YouTube Shorts, and Instagram Reels with AI-powered discovery, premium features, and creator tools.',
    url: 'https://flixtrend.com/about',
  },
};

export default function AboutPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'FlixTrend',
            url: 'https://flixtrend.com',
            description: 'The future of social video streaming with AI-powered discovery and creator tools',
            logo: 'https://flixtrend.com/logo.png',
            sameAs: ['https://twitter.com/flixtrend', 'https://instagram.com/flixtrend'],
          }),
        }}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-500 via-cyan-500 to-green-500 bg-clip-text text-transparent">About FlixTrend</h1>
          <p className="text-xl text-gray-300">Reimagining social video streaming with artificial intelligence, creator empowerment, and community-first values.</p>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-16">
          {/* What is FlixTrend */}
          <motion.section {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-4 text-cyan-400">What is FlixTrend?</h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                FlixTrend is a next-generation social video streaming platform that combines the best features of TikTok, YouTube Shorts, and Instagram Reels while introducing revolutionary AI-powered discovery algorithms, premium creator tools, and a trust-first community environment. Our platform is built on the belief that video content creation and consumption should be accessible, rewarding, and safe for everyone.
              </p>
              <p>
                With over 50 million active users and growing, FlixTrend has become the go-to destination for creators looking to build engaged audiences, musicians seeking viral moments, and viewers discovering content tailored to their interests. Our ecosystem spans short-form videos, live streaming, messaging, music discovery, and interactive gaming—all seamlessly integrated into one cohesive platform.
              </p>
            </div>
          </motion.section>

          {/* Why FlixTrend Exists */}
          <motion.section {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-4 text-green-400">Why FlixTrend Exists</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Traditional social platforms prioritize engagement metrics over user wellbeing, leaving creators underpaid and users feeling exploited. FlixTrend was founded to solve these problems through:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-lg"><strong className="text-pink-400">Creator Fairness:</strong> <span className="text-gray-300">70% revenue share, direct monetization pathways, transparent analytics</span></div>
              <div className="bg-gray-800/50 p-4 rounded-lg"><strong className="text-green-400">User Privacy:</strong> <span className="text-gray-300">End-to-end encrypted messaging, granular controls, zero data selling</span></div>
              <div className="bg-gray-800/50 p-4 rounded-lg"><strong className="text-cyan-400">Community Trust:</strong> <span className="text-gray-300">Advanced moderation, creator verification, transparent guidelines</span></div>
              <div className="bg-gray-800/50 p-4 rounded-lg"><strong className="text-pink-400">AI Innovation:</strong> <span className="text-gray-300">Personalized recommendations without algorithmic manipulation</span></div>
            </div>
          </motion.section>

          {/* Who FlixTrend is For */}
          <motion.section {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-4 text-pink-400">Who FlixTrend is For</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur">
                <h3 className="text-xl font-semibold mb-2 text-cyan-400">Content Creators</h3>
                <p className="text-gray-300 text-sm">Build your audience, monetize faster, and retain creative control with FlixTrend's creator-first philosophy.</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur">
                <h3 className="text-xl font-semibold mb-2 text-green-400">Musicians & Artists</h3>
                <p className="text-gray-300 text-sm">Distribute your music, reach millions, and earn royalties with integrated music discovery and promotion.</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur">
                <h3 className="text-xl font-semibold mb-2 text-pink-400">Video Enthusiasts</h3>
                <p className="text-gray-300 text-sm">Discover curated content, join communities, and engage with creators in a safe, algorithm-respecting environment.</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur">
                <h3 className="text-xl font-semibold mb-2 text-cyan-400">Brands & Businesses</h3>
                <p className="text-gray-300 text-sm">Reach authentic audiences through creator partnerships and integrated advertising solutions.</p>
              </div>
            </div>
          </motion.section>

          {/* Product Ecosystem */}
          <motion.section {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-6 text-green-400">Product Ecosystem</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-3 text-cyan-400">Vibes - Social Discovery</h3>
                <p className="text-gray-300 leading-relaxed">
                  Vibes is FlixTrend's core social experience, delivering algorithmically recommended short-form videos tailored to user preferences. Unlike traditional platforms that exploit engagement loops, Vibes uses Almighty AI to balance content discovery with user wellbeing, preventing scroll addiction while maximizing satisfaction.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-3 text-pink-400">Flashes - Live Streaming</h3>
                <p className="text-gray-300 leading-relaxed">
                  Flashes enables real-time video streaming with integrated messaging, gifting, and monetization. Creators can broadcast to audiences globally with low latency, built-in analytics, and viewer engagement tools. The platform supports multiple concurrent streams and automatic quality adaptation.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-3 text-green-400">Drops - Exclusive Content & NFTs</h3>
                <p className="text-gray-300 leading-relaxed">
                  Drops is FlixTrend's exclusive content platform where creators release limited-edition videos, merchandise, and digital collectibles. Integrated with blockchain technology, Drops provides verifiable ownership and royalty distribution for NFT sales.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-3 text-cyan-400">Messaging - Secure Communication</h3>
                <p className="text-gray-300 leading-relaxed">
                  End-to-end encrypted direct messaging with support for text, voice, video calls, and group chats. Messaging includes status updates, disappearing messages, and AI-powered search without compromising privacy.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-3 text-pink-400">Creator Tools Suite</h3>
                <p className="text-gray-300 leading-relaxed">
                  Professional-grade editing tools directly in the app, including multi-clip editing, effects library, sound design, color grading, and AI-powered suggestions. Creators can schedule posts, analyze metrics, manage collaborations, and access monetization dashboards.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-3 text-green-400">Communities & Squads</h3>
                <p className="text-gray-300 leading-relaxed">
                  Community-driven spaces where creators and fans collaborate. Squads are group accounts with shared posting capabilities, revenue splitting, and collaborative features. Communities aggregate like-minded users around interests, creators, or causes.
                </p>
              </div>
            </div>
          </motion.section>

          {/* AI & Technology */}
          <motion.section {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-4 text-pink-400">Almighty AI - Personalized Discovery</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Almighty AI is FlixTrend's proprietary recommendation engine built on transformer neural networks and reinforcement learning. Unlike engagement-maximizing algorithms, Almighty AI optimizes for content quality, user satisfaction, diversity, and transparent preference controls.
            </p>

            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">Fast-Checking - Misinformation Detection</h3>
            <p className="text-gray-300 leading-relaxed">
              Integrated fact-checking service using AI and human moderation to identify and label misleading content. Fast-Checking provides sources, context, and corrections without removing content or restricting speech.
            </p>
          </motion.section>

          {/* Safety & Trust */}
          <motion.section {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-6 text-green-400">Moderation, Trust & Safety</h2>
            
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">Advanced Moderation Systems</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              FlixTrend employs a hybrid moderation approach combining AI classifiers, human moderators, and community reporting. Our moderation systems detect hate speech, harassment, sexual exploitation, misinformation, IP violations, spam, and malicious links.
            </p>

            <h3 className="text-2xl font-semibold mb-4 text-pink-400">Creator Verification</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              Official verification badges for creators, influencers, and organizations. Verification requires identity confirmation and compliance with community standards, building trust through transparency.
            </p>

            <h3 className="text-2xl font-semibold mb-4 text-green-400">Privacy & Data Protection</h3>
            <p className="text-gray-300 leading-relaxed">
              GDPR and CCPA compliant. End-to-end encrypted messaging, optional ephemeral content, granular privacy controls, and zero third-party data sales. Users maintain ownership of their content and can export data anytime.
            </p>
          </motion.section>

          {/* Future Vision */}
          <motion.section {...fadeInUp}>
            <h2 className="text-3xl font-bold mb-4 text-cyan-400">Future Vision</h2>
            <p className="text-gray-300 leading-relaxed">
              FlixTrend's roadmap includes AR/VR experiences, augmented reality filters and games, decentralized creator networks, metaverse integration, and expanded gaming features. We're building the future of social interaction where technology empowers rather than exploits users.
            </p>
          </motion.section>

          {/* CTA Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-6 mt-12 pt-12 border-t border-gray-700"
          >
            <Link href="/faq" className="p-6 bg-gradient-to-r from-pink-500/20 to-cyan-500/20 rounded-lg hover:from-pink-500/30 hover:to-cyan-500/30 transition">
              <h3 className="font-semibold mb-2">Frequently Asked Questions</h3>
              <p className="text-sm text-gray-300">Browse 200+ questions about FlixTrend</p>
            </Link>
            <Link href="/help" className="p-6 bg-gradient-to-r from-green-500/20 to-pink-500/20 rounded-lg hover:from-green-500/30 hover:to-pink-500/30 transition">
              <h3 className="font-semibold mb-2">Help Center</h3>
              <p className="text-sm text-gray-300">Get help with your account and features</p>
            </Link>
            <Link href="/trust-center" className="p-6 bg-gradient-to-r from-cyan-500/20 to-green-500/20 rounded-lg hover:from-cyan-500/30 hover:to-green-500/30 transition">
              <h3 className="font-semibold mb-2">Trust Center</h3>
              <p className="text-sm text-gray-300">Learn about our safety and transparency</p>
            </Link>
            <Link href="/privacy" className="p-6 bg-gradient-to-r from-pink-500/20 to-green-500/20 rounded-lg hover:from-pink-500/30 hover:to-green-500/30 transition">
              <h3 className="font-semibold mb-2">Privacy Policy</h3>
              <p className="text-sm text-gray-300">Understand how we protect your data</p>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
