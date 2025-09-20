"use client";
import React, { useState } from 'react';
import { X, Image as ImageIcon, Plus } from 'lucide-react';

export function PollPostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
    const [pollType, setPollType] = useState<'text' | 'image'>(data.pollType || 'text');
    const [options, setOptions] = useState<any[]>(data.options || [{ text: '' }, { text: '' }]);

    const updateOptions = (newOptions: any[]) => {
        setOptions(newOptions);
        onDataChange({ ...data, options: newOptions });
    };

    const handleOptionTextChange = (index: number, text: string) => {
        const newOptions = [...options];
        newOptions[index].text = text;
        updateOptions(newOptions);
    };
    
    const handleOptionImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const newOptions = [...options];
            newOptions[index].imageFile = e.target.files[0];
            newOptions[index].imagePreview = URL.createObjectURL(e.target.files[0]);
            updateOptions(newOptions);
        }
    };

    const addOption = () => {
        if (options.length < 4) {
            updateOptions([...options, { text: '' }]);
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            updateOptions(options.filter((_, i) => i !== index));
        }
    };
    
    const handlePollTypeChange = (type: 'text' | 'image') => {
        setPollType(type);
        // Reset options when changing type
        const newOptions = [{ text: '' }, { text: '' }];
        setOptions(newOptions);
        onDataChange({ ...data, pollType: type, options: newOptions });
    }

    return (
        <div className="flex flex-col gap-4">
            <input
                type="text"
                name="question"
                className="input-glass text-lg"
                placeholder="Ask a question..."
                value={data.question || ''}
                onChange={(e) => onDataChange({ ...data, question: e.target.value })}
            />
            <div className="flex gap-2 p-1 rounded-full bg-black/20 self-start">
                <button type="button" onClick={() => handlePollTypeChange('text')} className={`px-3 py-1 text-sm font-bold rounded-full ${pollType === 'text' ? 'bg-accent-cyan text-black' : 'text-gray-400'}`}>Text Poll</button>
                <button type="button" onClick={() => handlePollTypeChange('image')} className={`px-3 py-1 text-sm font-bold rounded-full ${pollType === 'image' ? 'bg-accent-cyan text-black' : 'text-gray-400'}`}>Image Poll</button>
            </div>
            
            <div className="space-y-3">
                {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                        {pollType === 'image' && (
                            <label className="w-24 h-16 bg-black/20 rounded-lg flex items-center justify-center text-gray-400 cursor-pointer overflow-hidden shrink-0">
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleOptionImageChange(index, e)} />
                                {option.imagePreview ? <img src={option.imagePreview} className="w-full h-full object-cover" /> : <ImageIcon />}
                            </label>
                        )}
                        <input
                            type="text"
                            className="input-glass flex-1"
                            placeholder={`Option ${index + 1}`}
                            value={option.text}
                            onChange={(e) => handleOptionTextChange(index, e.target.value)}
                        />
                        {options.length > 2 && (
                            <button type="button" onClick={() => removeOption(index)} className="p-2 text-red-400 hover:text-red-300">
                                <X size={20} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            
            {options.length < 4 && (
                <button type="button" onClick={addOption} className="btn-glass text-sm self-start flex items-center gap-2">
                    <Plus size={16} /> Add Option
                </button>
            )}
        </div>
    );
}
