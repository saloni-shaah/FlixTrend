
"use client";
import React, { useState, useEffect } from 'react';
import { X, Plus, CheckCircle } from 'lucide-react';
import { isAbusive } from '@/utils/moderation';

export function PollPostForm({ data, onDataChange, onError }: { data: any, onDataChange: (data: any) => void, onError: (error: string | null) => void }) {
    const [options, setOptions] = useState<any[]>(data.options || [{ text: '' }, { text: '' }]);
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(data.correctAnswerIndex ?? null);

    const checkForAbuse = (checkData: {
        question?: string;
        options?: { text: string }[];
        hashtags?: string;
    }) => {
        const { question, options: pollOptions, hashtags } = { ...data, ...checkData };

        if (isAbusive(question || '')) {
            onError("The poll question contains inappropriate language.");
            return;
        }
        if (isAbusive(hashtags || '')) {
            onError("The hashtags contain inappropriate language.");
            return;
        }
        if (pollOptions && pollOptions.some((opt:any) => isAbusive(opt.text))) {
            onError("A poll option contains inappropriate language.");
            return;
        }

        onError(null); // No abuse found
    };

    // Sync parent data changes to local state
    useEffect(() => {
        const updatedData = { ...data, options, correctAnswerIndex };
        onDataChange(updatedData);
        checkForAbuse(updatedData);
    }, [options, correctAnswerIndex]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newData = { ...data, [name]: value };
        onDataChange(newData);
        checkForAbuse(newData);
    };

    const handleOptionTextChange = (index: number, text: string) => {
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], text };
        setOptions(newOptions);
        // The useEffect will handle data change and validation
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
