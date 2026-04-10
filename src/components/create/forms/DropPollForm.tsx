"use client";
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";

export function DropPollForm({ onSubmit, isSubmitting }: { onSubmit: (data: any) => void; isSubmitting: boolean }) {
    const [question, setQuestion] = useState("What should be tomorrow's prompt?");
    const [options, setOptions] = useState([{ text: '' }, { text: '' }]);

    const addOption = () => {
        if (options.length < 6) {
            setOptions([...options, { text: '' }]);
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        setOptions(newOptions);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const pollData = {
            question,
            options,
            type: 'drop_poll',
        };
        onSubmit(pollData);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto p-4 md:p-6 lg:p-8 space-y-6 bg-gray-900/50 rounded-2xl shadow-lg">
            <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Create a New Drop Poll</h2>
                <p className="text-sm md:text-base text-gray-400 mt-2">The winning option will become the official prompt for the next drop.</p>
            </div>
            
            <div className="space-y-2">
                <label htmlFor="question" className="text-sm font-medium text-gray-300">Poll Question</label>
                <Input
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500"
                    placeholder="e.g., What should be tomorrow's prompt?"
                />
            </div>

            <div className="space-y-4">
                <label className="text-sm font-medium text-gray-300">Prompt Options</label>
                {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            type="text"
                            value={option.text}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            required
                            className="flex-grow bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500"
                        />
                        {options.length > 2 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(index)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            {options.length < 6 && (
                <Button type="button" variant="outline" onClick={addOption} className="w-full border-dashed border-gray-600 text-gray-400 hover:bg-gray-800/70 hover:text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                </Button>
            )}

            <div className="pt-4">
                <Button type="submit" disabled={isSubmitting || options.some(o => !o.text.trim())} className="w-full bg-accent-green text-black hover:bg-accent-green/80 text-lg font-bold py-3">
                    {isSubmitting ? 'Submitting...' : 'Launch Poll'}
                </Button>
            </div>
        </form>
    );
}
