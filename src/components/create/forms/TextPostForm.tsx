
"use client";
import React, { useState } from 'react';
import { MapPin, Smile, Locate, Loader } from 'lucide-react';

const backgroundColors = [
  '#ffffff', '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff',
  '#a0c4ff', '#bdb2ff', '#ffc6ff', '#fffffc', '#f1f1f1', '#e0e0e0'
];

const fontStyles = [
    { name: 'Default', style: 'font-body' },
    { name: 'Cursive', style: 'font-cursive' },
    { name: 'Calligraphy', style: 'font-calligraphy' },
    { name: 'Italiano', style: 'font-italiano' }
];

export function TextPostForm({ data, onDataChange }: { data: any, onDataChange: (data: any) => void }) {
    const [bgImage, setBgImage] = useState<string | null>(data.backgroundImage || null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    
    // Ensure backgroundColor has a default value
    const currentBgColor = data.backgroundColor || '#ffffff';

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        onDataChange({ ...data, [e.target.name]: e.target.value });
    };

    const handleBgColorChange = (color: string) => {
        setBgImage(null); // Clear image if color is selected
        onDataChange({ ...data, backgroundColor: color, backgroundImage: null, backgroundImageFile: null });
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

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            setIsFetchingLocation(true);
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const locationData = await response.json();
                    const city = locationData.address.city || locationData.address.town || locationData.address.village;
                    const country = locationData.address.country;
                    if(city && country){
                        onDataChange({ ...data, location: `${city}, ${country}` });
                    } else {
                         onDataChange({ ...data, location: 'Unknown Location' });
                    }
                } catch (error) {
                    console.error("Error fetching location name:", error);
                    onDataChange({ ...data, location: 'Could not fetch name' });
                } finally {
                    setIsFetchingLocation(false);
                }
            }, (error) => {
                console.error("Geolocation error:", error.message);
                if (error.code !== error.PERMISSION_DENIED) {
                    alert("Could not get location. Please enable location services for this site.");
                }
                setIsFetchingLocation(false);
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <textarea
                name="content"
                className={`input-glass w-full min-h-[250px] text-2xl p-6 text-center flex items-center justify-center rounded-2xl ${data.fontStyle || 'font-body'}`}
                placeholder="What's on your mind?"
                value={data.content || ''}
                onChange={handleTextChange}
                style={{
                    backgroundColor: bgImage ? 'transparent' : currentBgColor,
                    backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" name="location" className="w-full rounded-xl p-3 pl-10 bg-black/20 text-white border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink" placeholder="Add location..." value={data.location || ''} onChange={handleTextChange} />
                 <button type="button" onClick={handleGetLocation} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent-cyan" disabled={isFetchingLocation}>
                    {isFetchingLocation ? <Loader className="animate-spin" size={16} /> : <Locate size={16} />}
                </button>
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
                        <button type="button" key={color} onClick={() => handleBgColorChange(color)} className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: color, borderColor: currentBgColor === color ? 'var(--accent-pink)' : 'transparent' }} />
                    ))}
                </div>

                <h4 className="font-bold text-sm text-accent-cyan">Or Upload Background Image</h4>
                <input type="file" accept="image/*" onChange={handleImageBgChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-pink/20 file:text-accent-pink hover:file:bg-accent-pink/40"/>
            </div>
        </div>
    );
}
