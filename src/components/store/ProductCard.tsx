
"use client";
import React from 'react';
import { motion } from 'framer-motion';

export function ProductCard({ product, onBuyNow }: { product: any, onBuyNow: (product: any) => void }) {
    return (
        <motion.div 
            className="glass-card flex flex-col overflow-hidden"
            whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)'}}
        >
            <div className="relative w-full aspect-square bg-black/20">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-lg text-accent-cyan truncate">{product.name}</h3>
                <p className="text-sm text-gray-400 mb-2 flex-1">{product.category}</p>
                <div className="flex justify-between items-center mt-4">
                    <span className="text-xl font-bold text-white">₹{product.price?.toLocaleString('en-IN') || '0.00'}</span>
                    <button 
                        onClick={() => onBuyNow(product)}
                        className="btn-glass bg-accent-pink text-white text-sm"
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
