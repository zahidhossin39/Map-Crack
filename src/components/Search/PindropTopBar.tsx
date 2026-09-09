'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Crosshair, MapPin, Search, SlidersHorizontal, Plus, Minus, Loader2, X, Check } from 'lucide-react';
import { SearchCenter, CategoryKey } from '@/types/business';
import { CATEGORIES } from '@/lib/constants';

interface PindropTopBarProps {
  currentAddress?: string;
  opportunityCount: number;
  onPlaceSelect: (center: SearchCenter) => void;
  onLocateMe: () => void;
  isLocating?: boolean;
  selectedCategory: CategoryKey;
  onCategoryChange: (category: CategoryKey) => void;
  opportunitiesOnly: boolean;
  onToggleOpportunitiesOnly: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  apiKey?: string;
}

export const PindropTopBar: React.FC<PindropTopBarProps> = ({
  currentAddress,
  opportunityCount,
  onPlaceSelect,
  onLocateMe,
  isLocating,
  selectedCategory,
  onCategoryChange,
  opportunitiesOnly,
  onToggleOpportunitiesOnly,
  onZoomIn,
  onZoomOut,
  apiKey,
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close suggestions or dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
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
  };

  return (
    <>
      {/* Top Floating Header Bar */}
      <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        {/* Left Side: GPS Button & Pin Status */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Crosshair / Locate Me Button */}
          <button
            onClick={onLocateMe}
            disabled={isLocating}
            className="w-11 h-11 rounded-2xl bg-white text-slate-700 hover:text-emerald-600 hover:bg-slate-50 active:scale-95 shadow-lg border border-slate-100 flex items-center justify-center transition-all disabled:opacity-50"
            title="Locate me"
          >
            {isLocating ? (
              <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
            ) : (
              <Crosshair className="w-5 h-5" />
            )}
          </button>

          {/* Green dot pin status */}
          <div className="hidden sm:flex w-11 h-11 rounded-2xl bg-white text-emerald-600 shadow-lg border border-slate-100 items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          </div>
        </div>

        {/* Center: Search Input Bar (Matching Image 1 & 2) */}
        <div ref={containerRef} className="relative w-full max-w-lg mx-2 pointer-events-auto">
          <div className="relative flex items-center bg-white rounded-2xl shadow-xl border border-slate-100/90 pl-3.5 pr-2 py-1.5 transition-all focus-within:ring-2 focus-within:ring-emerald-500">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setIsOpen(true);
              }}
              placeholder="Search a business, address, or city"
              className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none pr-2"
            />

            {/* Clear Input */}
            {input && !isLoading && (
              <button
                onClick={handleClear}
                className="text-slate-400 hover:text-slate-600 p-1 mr-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {isLoading && (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin mr-2" />
            )}

            {/* Magnifier Search Button */}
            <button
              onClick={() => handleKeyDown({ key: 'Enter', preventDefault: () => {} } as any)}
              className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors mr-1 shrink-0"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Filter Funnel Button */}
            <div ref={filterRef} className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                  showFilterDropdown || opportunitiesOnly || selectedCategory !== 'all'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
                title="Filter options"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Filter Dropdown Menu */}
              {showFilterDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95">
                  <p className="text-xs font-bold text-slate-900 mb-2">Category Filters</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => {
                          onCategoryChange(cat.key);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                          selectedCategory === cat.key
                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{cat.label}</span>
                        {selectedCategory === cat.key && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 my-2 pt-2">
                    <button
                      onClick={onToggleOpportunitiesOnly}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        opportunitiesOnly
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>No Website Only</span>
                      {opportunitiesOnly && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in">
              <div className="py-1 max-h-60 overflow-y-auto divide-y divide-slate-100">
                {suggestions.map((place, idx) => (
                  <button
                    key={place.id || idx}
                    onClick={() => handleSelectPlace(place)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-start gap-2.5 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {place.name}
                      </p>
                      {place.formattedAddress && (
                        <p className="text-[11px] text-slate-500 truncate">
                          {place.formattedAddress}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Opportunity Counter Pill & Zoom Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Opportunity Counter Pill */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-100 shadow-lg text-emerald-700 font-bold text-xs sm:text-sm">
            <MapPin className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            <span>{opportunityCount}</span>
          </div>

          {/* Vertical Zoom Controls ([ + ] and [ - ]) */}
          <div className="flex flex-col bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <button
              onClick={onZoomIn}
              className="p-2 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              title="Zoom in"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="w-full h-px bg-slate-100" />
            <button
              onClick={onZoomOut}
              className="p-2 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              title="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
