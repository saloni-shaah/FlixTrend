
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { countries, Country } from '@/lib/countries';

interface CountrySelectorProps {
  onCountrySelect: (dialCode: string) => void;
}

// Function to convert country code to flag emoji
const countryCodeToEmoji = (code: string) => {
  const OFFSET = 127397;
  const chars = [...code.toUpperCase()].map(char => String.fromCodePoint(char.charCodeAt(0) + OFFSET));
  return chars.join('');
};

export default function CountrySelector({ onCountrySelect }: CountrySelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries.find(c => c.code === 'IN')!);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Set default country on initial render
    onCountrySelect(selectedCountry.dial_code);
  }, []);

  const filteredCountries = useMemo(() => 
    countries.filter(country => 
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      country.dial_code.includes(searchTerm)
    ), [searchTerm]);

  const handleSelect = (country: Country) => {
    setSelectedCountry(country);
    onCountrySelect(country.dial_code);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="input-glass w-full flex items-center justify-between p-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2 text-white">
            <span className="text-xl">{countryCodeToEmoji(selectedCountry.code)}</span>
            <span>{selectedCountry.dial_code}</span>
        </span>
        <svg className={`w-5 h-5 transition-transform text-gray-400 ${isOpen ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-lg">
          <div className="p-2">
            <input 
              type="text"
              placeholder="Search country..."
              className="input-glass w-full bg-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {filteredCountries.map((country) => (
              <li
                key={country.code}
                className="px-4 py-2 cursor-pointer hover:bg-gray-700 flex items-center gap-3"
                onClick={() => handleSelect(country)}
              >
                <span className="text-xl">{countryCodeToEmoji(country.code)}</span>
                <span className="text-gray-300 flex-grow">{country.name}</span>
                <span className="text-gray-400">{country.dial_code}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
