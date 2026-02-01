
"use client";
import React, { useState, useEffect } from 'react';
import { X, Plus, CheckCircle } from 'lucide-react';

export function PollPostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
    const [options, setOptions] = useState<any[]>(data.options || [{ text: '' }, { text: '' }]);
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(data.correctAnswerIndex ?? null);

    // Sync parent data changes to local state
    useEffect(() => {
        onDataChange({ ...data, options, correctAnswerIndex });
    }, [options, correctAnswerIndex]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ ...data, [e.target.name]: e.target.value });
    };

    const handleOptionTextChange = (index: number, text: string) => {
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], text };
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length < 6) {
            setOptions([...options, { text: '' }]);
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
            
            // Adjust correct answer index if necessary
            if (correctAnswerIndex === index) {
                setCorrectAnswerIndex(null);
            } else if (correctAnswerIndex !== null && correctAnswerIndex > index) {
                setCorrectAnswerIndex(correctAnswerIndex - 1);
            }
        }
    };

    const toggleCorrectAnswer = (index: number) => {
        // If clicking the already correct answer, un-set it. Otherwise, set it.
        setCorrectAnswerIndex(prevIndex => prevIndex === index ? null : index);
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
                <p className="text-sm text-gray-400">Provide 2-6 options. You can optionally select one correct answer for a quiz.</p>
                {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                         <button 
                            type="button"
                            onClick={() => toggleCorrectAnswer(index)}
                            title="Mark as correct answer"
                            className={`p-2 rounded-full transition-colors ${correctAnswerIndex === index ? 'text-green-400 bg-green-500/20' : 'text-gray-500 hover:bg-gray-700'}`}>
                            <CheckCircle size={20} />
                        </button>
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
            
            {options.length < 6 && (
                <button type="button" onClick={addOption} className="btn-glass text-sm self-start flex items-center gap-2">
                    <Plus size={16} /> Add Option
                </button>
            )}

            <input type="text" name="hashtags" className="input-glass w-full mt-2" placeholder="Add #hashtags (e.g. #quiz #tech)" value={data.hashtags || ''} onChange={handleTextChange}/>

        </div>
    );
}
