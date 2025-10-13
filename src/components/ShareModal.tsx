
"use client";

import React, { useEffect } from 'react';
import { Copy, X, MessageSquare, Code } from 'lucide-react';
import { FaWhatsapp, FaTelegramPlane, FaFacebook } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { motion } from 'framer-motion';

export function ShareModal({ url, title, isVideo, onSignalShare, onClose }: { url: string; title?: string; isVideo?: boolean; onSignalShare: () => void; onClose: () => void }) {
  const [copied, setCopied] = React.useState(false);
  const [showEmbed, setShowEmbed] = React.useState(false);

  const shareText = title ? `Check out this vibe on FlixTrend: ${title}` : "Check out this vibe on FlixTrend!";
  const embedCode = `<iframe src="${url.replace('/post/', '/embed/')}" width="100%" height="450" style="border:none;overflow:hidden;" scrolling="no" frameborder="0" allowTransparency="true" allow="encrypted-media" allowFullScreen="true"></iframe>`;

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const socialShares = [
    { name: 'WhatsApp', icon: <FaWhatsapp />, url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${url}`)}` },
    { name: 'X', icon: <FaXTwitter />, url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}` },
    { name: 'Facebook', icon: <FaFacebook />, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: 'Telegram', icon: <FaTelegramPlane />, url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}` },
  ]

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-card p-6 w-full max-w-sm relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h3 className="text-xl font-headline font-bold mb-4 text-brand-gold">{showEmbed ? "Embed Video" : "Share Vibe"}</h3>

        {!showEmbed ? (
          <>
            <button 
                className="w-full btn-glass bg-accent-purple/20 text-accent-purple font-bold flex items-center justify-center gap-3 mb-4"
                onClick={onSignalShare}
            >
                <MessageSquare /> Share in Signal
            </button>
            
            <div className="flex justify-around items-center my-4">
                {socialShares.map(social => (
                     <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-gray-300 hover:text-accent-cyan transition-colors">
                        <span className="text-4xl">{social.icon}</span>
                        <span className="text-xs">{social.name}</span>
                     </a>
                ))}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input type="text" value={url} readOnly className="input-glass flex-1 text-sm" />
              <button onClick={() => handleCopy(url)} className="btn-glass px-4 py-2">
                <Copy size={18} />
              </button>
            </div>

            {isVideo && (
                <button onClick={() => setShowEmbed(true)} className="text-xs text-accent-cyan hover:underline mt-4 flex items-center gap-2 mx-auto">
                    <Code size={14}/> Get Embed Code
                </button>
            )}
          </>
        ) : (
           <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-400">Copy this code and paste it into your website's HTML where you want the video to appear.</p>
                <textarea
                    readOnly
                    className="input-glass w-full rounded-lg text-xs h-32 font-mono"
                    value={embedCode}
                />
                <button onClick={() => handleCopy(embedCode)} className="btn-glass bg-accent-cyan text-black">
                    {copied ? "Copied!" : "Copy Code"}
                </button>
                 <button onClick={() => setShowEmbed(false)} className="text-xs text-accent-cyan hover:underline mt-2">
                    Back to sharing options
                </button>
           </div>
        )}
        {copied && !showEmbed && <p className="text-accent-cyan text-sm mt-2 text-center">Link copied!</p>}
      </motion.div>
    </div>
  );
}
