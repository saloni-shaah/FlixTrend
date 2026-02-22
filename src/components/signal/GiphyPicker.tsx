'use client';
import React, { useContext, useState, useEffect } from 'react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid, SearchBar, SearchContext, SearchContextManager } from '@giphy/react-components';
import { IGif } from '@giphy/js-types';

// This is a separate component that will be wrapped with the SearchContextManager
const GiphyPickerWithContext: React.FC<{ onGifClick: (gif: IGif) => void }> = ({ onGifClick }) => {
    const { fetchGifs, searchKey } = useContext(SearchContext);

    return (
        <div className="w-full h-96 flex flex-col bg-gray-900 rounded-t-xl p-2">
            {/* The SearchBar component updates the context, triggering a search */}
            <SearchBar className="w-full mb-2 bg-gray-800 text-white rounded-md" placeholder="Search for GIFs" />

            {/* The Grid component consumes the context to display search results or trending GIFs */}
            <div className="flex-1 overflow-y-auto">
                <Grid
                    key={searchKey} // The context provides a key that changes on search
                    width={400} // This can be adjusted based on the container width
                    columns={3}
                    gutter={6}
                    fetchGifs={fetchGifs}
                    onGifClick={(gif, e) => {
                        e.preventDefault(); // Prevent any default browser action
                        onGifClick(gif);
                    }}
                    hideAttribution
                    noResultsText="No GIFs found."
                    backgroundColor="#111827" // gray-900
                />
            </div>
        </div>
    );
}

// The main export component now fetches the API key and manages the search state
export const GiphyPicker: React.FC<{ onGifClick: (gif: IGif) => void }> = ({ onGifClick }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch('/api/giphy-key');
        if (!response.ok) {
          throw new Error('Failed to fetch Giphy API key');
        }
        const data = await response.json();
        setApiKey(data.apiKey);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      }
    };

    fetchApiKey();
  }, []);

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (!apiKey) {
    return <div className="p-4 text-center text-white">Loading Giphy...</div>;
  }

  return (
    <SearchContextManager apiKey={apiKey}>
        <GiphyPickerWithContext onGifClick={onGifClick} />
    </SearchContextManager>
  );
};
