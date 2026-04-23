
"use client";
import React, { useState, useRef } from 'react';
import { Radio, UploadCloud, X, MapPin, Hash, Locate, Loader } from 'lucide-react';
import { isAbusive } from '@/utils/moderation';

export function LivePostForm({ data, onDataChange, onError }: { data: any, onDataChange: (data: any) => void, onError: (error: string | null) => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(data.thumbnailUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const handleDataChange = (field: string, value: any) => {
    if (field === 'content' || field === 'hashtags') {
      if (isAbusive(value)) {
        onError('Your post contains inappropriate language and cannot be posted.');
      } else {
        onError(null);
      }
    }
    onDataChange({ ...data, [field]: value });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        onError('Thumbnail image must be less than 5MB.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        onError('Please select an image file.');
        return;
      }
      onError(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        onDataChange({ ...data, thumbnailFile: file, thumbnailUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveThumbnail = () => {
    setPreviewUrl(null);
    onDataChange({ ...data, thumbnailFile: null, thumbnailUrl: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleGetLocation = () => {
        if (!navigator.geolocation) { onError("Geolocation is not supported."); return; }
        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const locData = await response.json();
                const city = locData.address.city || locData.address.town || locData.address.village;
                const country = locData.address.country;
                handleDataChange('location', city && country ? `${city}, ${country}` : 'Unknown Location');
            } catch (error) { onError('Could not fetch location name.'); }
            finally { setIsFetchingLocation(false); }
        }, (error) => {
            onError(error.code === error.PERMISSION_DENIED ? 'Location permission denied.' : 'Could not get location.');
            setIsFetchingLocation(false);
        });
    };

  return (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-4 text-center">
            <Radio className="text-red-500 animate-pulse" size={48} />
            <h3 className="text-xl font-bold text-white">Set Up Your Live Stream</h3>
            <p className="text-sm text-gray-400">Add a title, thumbnail, and hashtags to attract viewers.</p>
        </div>

        {/* Thumbnail Uploader */}
        <div className="w-full">
            {previewUrl ? (
                <div className="relative group w-full aspect-video rounded-lg overflow-hidden border-2 border-dashed border-gray-600">
                    <img src={previewUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    <button onClick={handleRemoveThumbnail} className="absolute top-2 right-2 bg-black bg-opacity-50 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={18} />
                    </button>
                </div>
            ) : (
                <label htmlFor="thumbnail-upload" className="cursor-pointer w-full aspect-video bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-800/60 hover:border-gray-500 transition-colors">
                    <UploadCloud size={40} />
                    <span className="mt-2 text-sm font-semibold">Upload Thumbnail</span>
                    <span className="text-xs">Image (5MB Max)</span>
                </label>
            )}
            <input ref={fileInputRef} type="file" id="thumbnail-upload" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>

        {/* Title Input */}
        <input
            type="text"
            name="content"
            className="input-glass w-full mt-2"
            placeholder="Live Stream Title"
            value={data.content || ''}
            onChange={(e) => handleDataChange('content', e.target.value)}
        />
        
        {/* Hashtags Input */}
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            name="hashtags" 
            placeholder="#live #gaming #q&a" 
            className="input-glass w-full pl-10" 
            value={data.hashtags || ''} 
            onChange={(e) => handleDataChange('hashtags', e.target.value)}
          />
        </div>

        {/* Location Input */}
        <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              name="location" 
              placeholder="Add location..." 
              className="input-glass w-full pl-10" 
              value={data.location || ''} 
              onChange={(e) => handleDataChange('location', e.target.value)}
            />
            <button 
              type="button" 
              onClick={handleGetLocation} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent-cyan" 
              disabled={isFetchingLocation}
            >
                {isFetchingLocation ? <Loader className="animate-spin" size={16} /> : <Locate size={16} />}
            </button>
        </div>
    </div>
  );
}
