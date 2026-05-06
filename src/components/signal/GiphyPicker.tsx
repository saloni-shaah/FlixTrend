'use client';
import React, { useContext, useState, useEffect } from 'react';
import { SearchBar, SearchContext, SearchContextManager, Grid } from '@giphy/react-components';
import { IGif } from '@giphy/js-types';

// Inner component consumes SearchContext provided by SearchContextManager
const GiphyPickerInner: React.FC<{ onGifClick: (gif: IGif) => void }> = ({ onGifClick }) => {
  const { fetchGifs, searchKey } = useContext(SearchContext);

  return (
    <div className="w-full flex flex-col bg-black/70 backdrop-blur-2xl border-t border-white/[0.06] rounded-t-2xl overflow-hidden">
      <div className="p-2 border-b border-white/[0.06]">
        <SearchBar
          className="w-full bg-white/[0.07] text-white rounded-xl px-3 py-2 text-sm focus:outline-none placeholder-gray-600"
          placeholder="Search GIFs…"
        />
      </div>
      <div
        className="h-72 overflow-y-auto p-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
      >
        <Grid
          key={searchKey}
          width={340}
          columns={3}
          gutter={4}
          fetchGifs={fetchGifs}
          onGifClick={(gif, e) => { e.preventDefault(); onGifClick(gif); }}
          hideAttribution
          noResultsText="No GIFs found 💀"
          backgroundColor="transparent"
        />
      </div>
    </div>
  );
};

export const GiphyPicker: React.FC<{ onGifClick: (gif: IGif) => void }> = ({ onGifClick }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/giphy-key')
      .then(r => { if (!r.ok) throw new Error('Failed to load'); return r.json(); })
      .then(d => setApiKey(d.apiKey))
      .catch(e => setError(e.message));
  }, []);

  if (error)   return <div className="p-4 text-center text-red-400 text-sm">{error}</div>;
  if (!apiKey) return (
    <div className="p-6 text-center text-white/40 text-sm bg-black/60 backdrop-blur-2xl rounded-t-2xl">
      Loading GIFs…
    </div>
  );

  return (
    <SearchContextManager apiKey={apiKey}>
      <GiphyPickerInner onGifClick={onGifClick} />
    </SearchContextManager>
  );
};