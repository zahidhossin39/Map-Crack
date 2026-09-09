'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X, Globe } from 'lucide-react';
import { SearchCenter } from '@/types/business';

interface PlaceAutocompleteProps {
  onPlaceSelect: (center: SearchCenter) => void;
  currentAddress?: string;
  apiKey?: string;
}

export const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  onPlaceSelect,
  currentAddress,
  apiKey,
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real Google Places matching text search
  useEffect(() => {
    if (!input.trim() || input.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/places/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: input.trim(),
            apiKey,
          }),
        });
        const data = await res.json();
        if (data.places && data.places.length > 0) {
          setSuggestions(data.places.slice(0, 7));
          setIsOpen(true);
        }
      } catch (err) {
        console.warn('Place search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [input, apiKey]);

  const handleSelectPlace = (place: any) => {
    if (!place?.location) return;

    const newCenter: SearchCenter = {
      lat: place.location.lat,
      lng: place.location.lng,
      address: place.formattedAddress || place.name || input,
    };

    setInput(place.name || place.formattedAddress || '');
    setIsOpen(false);
    setSuggestions([]);
    onPlaceSelect(newCenter);
  };

  // Direct Enter key search
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelectPlace(suggestions[0]);
        return;
      }

      if (!input.trim()) return;

      setIsLoading(true);
      try {
        const res = await fetch('/api/places/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: input.trim(),
            apiKey,
          }),
        });
        const data = await res.json();
        if (data.targetCenter) {
          onPlaceSelect(data.targetCenter);
          setIsOpen(false);
        } else if (data.places && data.places.length > 0) {
          handleSelectPlace(data.places[0]);
        }
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClear = () => {
    setInput('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={currentAddress ? `Near: ${currentAddress}` : 'Search any country, city, address, or business...'}
          className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 focus:bg-slate-900 border border-slate-700/80 text-white placeholder-slate-400 text-xs sm:text-sm font-medium shadow-glass backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
        />
        <div className="absolute right-3 flex items-center gap-1">
          {isLoading && <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />}
          {input && !isLoading && (
            <button
              onClick={handleClear}
              className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-50 animate-in fade-in duration-150">
          <div className="py-1.5 max-h-64 overflow-y-auto divide-y divide-slate-800/60">
            {suggestions.map((place, index) => (
              <button
                key={place.id || index}
                onClick={() => handleSelectPlace(place)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800/80 flex items-start gap-2.5 transition-colors group"
              >
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-100 truncate group-hover:text-brand-300">
                    {place.name}
                  </p>
                  {place.formattedAddress && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {place.formattedAddress}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="px-3 py-1 bg-slate-950/60 border-t border-slate-800 text-[10px] text-slate-500 text-right">
            Google Maps Global Search
          </div>
        </div>
      )}
    </div>
  );
};
