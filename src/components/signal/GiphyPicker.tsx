'use client';
import React, { useContext } from 'react';
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

// The main export component now manages the search state
export const GiphyPicker: React.FC<{ onGifClick: (gif: IGif) => void }> = ({ onGifClick }) => {
  return (
    <SearchContextManager apiKey={'dp0YAd3ECkOnvMrIJqEXigXPFnkBnmxc'}>
        <GiphyPickerWithContext onGifClick={onGifClick} />
    </SearchContextManager>
  );
};
