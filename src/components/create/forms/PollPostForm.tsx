
"use client";
import React, { useState } from 'react';
import { X, Plus, MapPin, Smile } from 'lucide-react';

export function PollPostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
    const [options, setOptions] = useState<any[]>(data.options || [{ text: '' }, { text: '' }]);

    const updateOptions = (newOptions: any[]) => {
        setOptions(newOptions);
        onDataChange({ ...data, options: newOptions });
    };
    
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ ...data, [e.target.name]: e.target.value });
    };

    const handleOptionTextChange = (index: number, text: string) => {
        const newOptions = [...options];
        newOptions[index].text = text;
        updateOptions(newOptions);
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
    
    return (
        <div className="flex flex-col gap-4">
            <input
                type="text"
                name="question"
                className="input-glass text-lg"
                placeholder="Ask a question..."
                value={data.question || ''}
                onChange={handleTextChange}
            />
            
            <div className="space-y-3">
                {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
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

            <input type="text" name="hashtags" className="input-glass w-full mt-2" placeholder="Add #hashtags..." value={data.hashtags || ''} onChange={handleTextChange}/>

        </div>
    );
}
