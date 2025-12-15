
"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const filters = [
    { name: 'None', style: 'none' },
    { name: 'Vintage', style: 'sepia(0.6) saturate(1.4) contrast(0.8)' },
    { name: 'Mono', style: 'grayscale(1)' },
    { name: 'Dreamy', style: 'saturate(1.8) brightness(1.1) contrast(0.9)' },
    { name: 'Sunset', style: 'hue-rotate(-20deg) saturate(1.5)' },
    { name: 'Matrix', style: 'contrast(1.5) saturate(1.8) hue-rotate(90deg)' }
];

// This is a new special filter type that will overlay an image
const overlayFilters = [
    { name: 'Sunglasses', icon: '/filters/sunglasses.png' } // Corrected path
];

export default function Step2({ onNext, onBack, postData, onDataChange }: { onNext: (data: any) => void; onBack: () => void; postData: any, onDataChange: (data: any) => void }) {
    const [selectedFilter, setSelectedFilter] = useState(postData.filter || 'none');
    const [selectedOverlay, setSelectedOverlay] = useState(postData.overlay || 'none');
    
    const mediaPreview = postData.mediaPreviews?.[0];

    const handleSelectFilter = (filterStyle: string) => {
        setSelectedFilter(filterStyle);
        setSelectedOverlay('none'); // Clear overlay when a CSS filter is chosen
        onDataChange({ ...postData, filter: filterStyle, overlay: 'none' });
    };
    
    const handleSelectOverlay = (overlayName: string) => {
        const iconPath = overlayFilters.find(f => f.name === overlayName)?.icon || 'none';
        setSelectedOverlay(iconPath);
        setSelectedFilter('none'); // Clear CSS filter when an overlay is chosen
        onDataChange({ ...postData, overlay: iconPath, filter: 'none' });
    };

    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
            <div className="glass-card p-4 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                
                {/* Image Preview */}
                <div className="w-full md:w-1/2 relative aspect-square flex items-center justify-center">
                    {mediaPreview ? (
                        <div className="relative w-full h-full">
                            <img 
                                src={mediaPreview} 
                                alt="Preview" 
                                className="w-full h-full object-contain rounded-lg"
                                style={{ filter: selectedFilter }}
                            />
                            {selectedOverlay !== 'none' && (
                                <img
                                    src={selectedOverlay}
                                    alt="Overlay"
                                    className="absolute top-0 left-0 w-full h-full object-contain"
                                />
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full bg-black/20 rounded-lg flex items-center justify-center text-gray-400">
                           No image to preview
                        </div>
                    )}
                </div>

                {/* Filter Selection */}
                <div className="w-full md:w-1/2">
                    <h2 className="text-xl font-headline text-accent-cyan mb-4">Choose a Filter</h2>
                    <div className="grid grid-cols-3 gap-2">
                        {filters.map(f => (
                            <button 
                                key={f.name}
                                onClick={() => handleSelectFilter(f.style)}
                                className={`aspect-square flex items-center justify-center text-xs font-bold rounded-lg border-2 ${selectedFilter === f.style ? 'border-accent-pink' : 'border-transparent'}`}
                            >
                                <div className="w-16 h-16 bg-cover bg-center rounded" style={{ backgroundImage: `url(${mediaPreview})`, filter: f.style }}></div>
                                <span className="absolute">{f.name}</span>
                            </button>
                        ))}
                    </div>
                     <h2 className="text-xl font-headline text-accent-cyan mt-6 mb-4">Overlays</h2>
                     <div className="grid grid-cols-4 gap-2">
                        {overlayFilters.map(f => (
                            <button
                                key={f.name}
                                onClick={() => handleSelectOverlay(f.name)}
                                className={`aspect-square flex flex-col items-center justify-center text-xs font-bold rounded-lg border-2 ${selectedOverlay === f.icon ? 'border-accent-pink' : 'border-transparent'}`}
                            >
                                <img src={f.icon} alt={f.name} className="w-12 h-12" />
                                {f.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button className="btn-glass flex items-center gap-2" onClick={onBack}>
                    <ArrowLeft /> Back
                </button>
                <button className="btn-glass bg-accent-cyan text-black flex items-center gap-2" onClick={() => onNext({})}>
                    Next <ArrowRight />
                </button>
            </div>
        </motion.div>
    );
}
