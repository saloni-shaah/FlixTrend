
"use client";
import React from 'react';
import { Radio } from 'lucide-react';

export function LivePostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDataChange({ ...data, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-4 text-center">
            <Radio className="text-red-500 animate-pulse" size={48} />
            <h3 className="text-xl font-bold text-white">You're about to go live!</h3>
            <p className="text-sm text-gray-400">Give your stream a title to let people know what's up.</p>
            <input
                type="text"
                name="title"
                className="input-glass w-full"
                placeholder="Live Stream Title (e.g., Sunset Vibes, Q&A)"
                value={data.title || ''}
                onChange={handleChange}
            />
        </div>
        <div className="mt-6">
            <h4 className="font-bold text-accent-cyan mb-2">Scheduling</h4>
            <p className="text-gray-400 text-sm">You'll be able to schedule your live event and generate a countdown for your followers in a future update!</p>
        </div>
    </div>
  );
}
