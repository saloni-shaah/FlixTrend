
"use client";
import React, { useState } from 'react';
import { MapPin, Smile } from 'lucide-react';

const backgroundColors = [
  '#ffffff', '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff',
  '#a0c4ff', '#bdb2ff', '#ffc6ff', '#fffffc', '#f1f1f1', '#e0e0e0'
];

const fontStyles = [
    { name: 'Default', style: 'font-body' },
    { name: 'Cursive', style: 'font-cursive' }, // You would need to add a cursive font to your project
    { name: 'Calligraphy', style: 'font-calligraphy' }, // And a calligraphy font
    { name: 'Italiano', style: 'font-italiano' }
];

export function TextPostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
    const [bgImage, setBgImage] = useState<string | null>(data.bgImage || null);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        onDataChange({ ...data, [e.target.name]: e.target.value });
    };

    const handleBgColorChange = (color: string) => {
        setBgImage(null); // Clear image if color is selected
        onDataChange({ ...data, backgroundColor: color, backgroundImage: null });
    };

    const handleImageBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            setBgImage(previewUrl);
            onDataChange({ ...data, backgroundImageFile: file, backgroundImage: previewUrl, backgroundColor: null });
        }
    };
    
    const handleFontStyleChange = (style: string) => {
        onDataChange({ ...data, fontStyle: style });
    }

    return (
        <div className="flex flex-col gap-4">
            <textarea
                name="content"
                className={`input-glass w-full min-h-[250px] text-2xl p-6 text-center flex items-center justify-center heptagon-clip ${data.fontStyle || 'font-body'}`}
                placeholder="What's on your mind?"
                value={data.content || ''}
                onChange={handleTextChange}
                style={{
                    backgroundColor: data.backgroundColor || 'transparent',
                    backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '0', // clip-path works best without border-radius
                }}
            />
            
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" name="location" className="w-full rounded-xl p-3 pl-10 bg-black/20 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="Add location..." value={data.location || ''} onChange={handleTextChange} />
            </div>
             <div className="relative">
                <Smile className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" name="mood" className="w-full rounded-xl p-3 pl-10 bg-black/20 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="How are you feeling?" value={data.mood || ''} onChange={handleTextChange} />
            </div>

            <div className="space-y-3">
                 <h4 className="font-bold text-sm text-accent-cyan">Font Style</h4>
                <div className="flex flex-wrap gap-2">
                    {fontStyles.map(font => (
                        <button key={font.name} type="button" onClick={() => handleFontStyleChange(font.style)} className={`btn-glass text-xs ${data.fontStyle === font.style ? 'bg-accent-cyan text-black' : ''}`}>
                            {font.name}
                        </button>
                    ))}
                </div>

                <h4 className="font-bold text-sm text-accent-cyan">Background Color</h4>
                <div className="flex flex-wrap gap-2">
                    {backgroundColors.map(color => (
                        <button type="button" key={color} onClick={() => handleBgColorChange(color)} className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: color, borderColor: data.backgroundColor === color ? 'var(--accent-pink)' : 'transparent' }} />
                    ))}
                </div>

                <h4 className="font-bold text-sm text-accent-cyan">Or Upload Background Image</h4>
                <input type="file" accept="image/*" onChange={handleImageBgChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-pink/20 file:text-accent-pink hover:file:bg-accent-pink/40"/>
            </div>
        </div>
    );
}
