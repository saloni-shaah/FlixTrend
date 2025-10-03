
"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from '@/components/store/ProductCard';
import { CheckoutForm } from '@/components/store/CheckoutForm';
import { ShoppingBag, Loader } from 'lucide-react';
import { getFirestore, collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';


const db = getFirestore(app);

export default function StorePage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [orderComplete, setOrderComplete] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        },
        async (serverError) => {
            console.error("Firestore onSnapshot error:", serverError);
            const permissionError = new FirestorePermissionError({
              path: 'products',
              operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleSelectProduct = (product: any) => {
        setSelectedProduct(product);
        setOrderComplete(false);
    };

    const handleBackToStore = () => {
        setSelectedProduct(null);
    };

    const handleOrderComplete = () => {
        setOrderComplete(true);
        setSelectedProduct(null);
    }

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center p-4 min-h-screen">
            <div className="text-center mb-12">
                 <h1 className="text-4xl md:text-5xl font-headline font-bold bg-gradient-to-r from-accent-pink to-accent-cyan bg-clip-text text-transparent mb-2 flex items-center gap-4 justify-center">
                    <ShoppingBag size={48} />
                    FlixTrend Store
                </h1>
                <p className="text-gray-400">Exclusive merch for the FlixTrend community.</p>
            </div>

            <AnimatePresence mode="wait">
                {selectedProduct ? (
                    <motion.div
                        key="checkout"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-4xl"
                    >
                        <CheckoutForm product={selectedProduct} onBack={handleBackToStore} onOrderComplete={handleOrderComplete} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="products"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full"
                    >
                        {orderComplete && (
                             <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-green-500/20 border border-green-500 text-green-300 p-4 rounded-lg mb-8 text-center"
                            >
                                <h3 className="font-bold">Order Placed Successfully!</h3>
                                <p className="text-sm">Thank you for your purchase. A confirmation has been sent to your email.</p>
                            </motion.div>
                        )}
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader className="animate-spin text-accent-cyan" size={48} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {products.map(product => (
                                    <ProductCard key={product.id} product={product} onBuyNow={handleSelectProduct} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
