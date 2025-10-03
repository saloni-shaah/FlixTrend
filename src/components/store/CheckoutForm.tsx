
"use client";
import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Lock } from 'lucide-react';

export function CheckoutForm({ product, onBack, onOrderComplete }: { product: any, onBack: () => void, onOrderComplete: () => void }) {
    const [form, setForm] = useState({
        name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'India',
        cardNumber: '',
        expiry: '',
        cvc: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        // Simulate payment processing
        setTimeout(() => {
            setIsProcessing(false);
            onOrderComplete();
        }, 2000);
    }

    return (
        <div className="w-full">
            <button onClick={onBack} className="btn-glass flex items-center gap-2 mb-8">
                <ArrowLeft /> Back to Store
            </button>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="glass-card p-6">
                    <h2 className="text-2xl font-headline font-bold text-accent-pink mb-4">Order Summary</h2>
                    <div className="flex items-center gap-4">
                        <img src={product.imageUrl} alt={product.name} className="w-24 h-24 rounded-lg object-cover" />
                        <div>
                            <h3 className="font-bold text-lg text-accent-cyan">{product.name}</h3>
                            <p className="text-xl font-bold text-white">₹{product.price.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                    <hr className="border-glass-border my-4" />
                    <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>₹{product.price.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h2 className="text-2xl font-headline font-bold text-accent-cyan mb-6">Shipping & Payment</h2>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <h3 className="font-bold mb-2">Shipping Address</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input type="text" name="name" placeholder="Full Name" className="input-glass sm:col-span-2" required onChange={handleChange} />
                                <input type="text" name="address" placeholder="Address" className="input-glass sm:col-span-2" required onChange={handleChange} />
                                <input type="text" name="city" placeholder="City" className="input-glass" required onChange={handleChange} />
                                <input type="text" name="zip" placeholder="PIN Code" className="input-glass" required onChange={handleChange} />
                                <input type="text" name="state" placeholder="State" className="input-glass" required onChange={handleChange} />
                                <input type="text" name="country" placeholder="Country" className="input-glass" value={form.country} onChange={handleChange} required />
                            </div>
                        </div>
                         <div>
                            <h3 className="font-bold mb-2 mt-4">Payment Details</h3>
                            <div className="relative mb-3">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                                <input type="text" name="cardNumber" placeholder="Card Number" className="input-glass w-full pl-10" required onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" name="expiry" placeholder="MM / YY" className="input-glass" required onChange={handleChange} />
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                    <input type="text" name="cvc" placeholder="CVC" className="input-glass w-full pl-10" required onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="btn-glass bg-accent-pink text-white w-full mt-4"
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Processing...' : `Pay ₹${product.price.toLocaleString('en-IN')}`}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
