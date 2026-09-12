'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Crosshair,
  MapPin,
  Search,
  Filter,
  Download,
  Plus,
  Minus,
  Loader2,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  Star,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';
import { CategoryKey, SearchCenter } from '@/types/business';
import { CATEGORIES } from '@/lib/constants';
import { MAP_KEY_ITEMS } from '@/lib/pindropUtils';
import {
  RATING_FILTER_OPTIONS,
  REVIEW_COUNT_FILTER_OPTIONS,
} from '@/lib/ratingFilterUtils';

interface PindropTopBarProps {
  onPlaceSelect: (center: SearchCenter) => void;
  onLocateMe: () => void;
  isLocating: boolean;
  selectedCategory: CategoryKey;
  onCategoryChange: (category: CategoryKey) => void;
  opportunitiesOnly: boolean;
  onToggleOpportunitiesOnly: () => void;
  socialPageOnly?: boolean;
  onToggleSocialPageOnly?: () => void;
  selectedRatingRanges?: string[];
  onToggleRatingRange?: (key: string) => void;
  selectedReviewCountRanges?: string[];
  onToggleReviewCountRange?: (key: string) => void;
  onClearAdvancedFilters?: () => void;
  totalFilteredCount?: number;
  onExportCSV?: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  apiKey?: string;
}

export const PindropTopBar: React.FC<PindropTopBarProps> = ({
  onPlaceSelect,
  onLocateMe,
  isLocating,
  selectedCategory,
  onCategoryChange,
  opportunitiesOnly,
  onToggleOpportunitiesOnly,
  socialPageOnly,
  onToggleSocialPageOnly,
  selectedRatingRanges = [],
  onToggleRatingRange,
  selectedReviewCountRanges = [],
  onToggleReviewCountRange,
  onClearAdvancedFilters,
  totalFilteredCount,
  onExportCSV,
  onZoomIn,
  onZoomOut,
  apiKey,
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showMapKey, setShowMapKey] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const advancedFilterRef = useRef<HTMLDivElement>(null);
  const mapKeyRef = useRef<HTMLDivElement>(null);

  const activeRatingCount = selectedRatingRanges.length;
  const activeReviewCount = selectedReviewCountRanges.length;
  const totalActiveAdvancedFilters = activeRatingCount + activeReviewCount;

  // Close suggestions or dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (advancedFilterRef.current && !advancedFilterRef.current.contains(e.target as Node)) {
        setShowAdvancedFilter(false);
      }
      if (mapKeyRef.current && !mapKeyRef.current.contains(e.target as Node)) {
        setShowMapKey(false);
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

    // Guards against an earlier request resolving after a later one and overwriting it
    // with stale suggestions for a query the user has already moved on from.
    let cancelled = false;

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
        if (cancelled) return;

        const places = data.places || [];
        setSuggestions(places.slice(0, 7));
        if (places.length > 0) setIsOpen(true);
      } catch (err) {
        if (!cancelled) console.warn('Place search error:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
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

          {/* Map Key Popover & Toggle Button (Exact Replica of Image 2) */}
          <div ref={mapKeyRef} className="relative pointer-events-auto">
            <button
              onClick={() => setShowMapKey(!showMapKey)}
              className={`w-11 h-11 rounded-2xl bg-white shadow-lg border flex items-center justify-center transition-all cursor-pointer ${
                showMapKey
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
              title="Map Key"
            >
              {/* Two dots: Orange and Green (matching Image 2) */}
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
              </div>
            </button>

            {/* MAP KEY Popover Card (Exact Replica of Image 2) */}
            {showMapKey && (
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-slate-100/90 p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3.5">
                  MAP KEY
                </p>

                <div className="space-y-3.5">
                  {MAP_KEY_ITEMS.map((item) => (
                    <div key={item.key} className="flex items-start gap-3 text-left">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-slate-900 leading-snug">
                          {item.label}
                        </p>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Search Bar + Funnel Filter Button + Export Button (Matching pindrop.host exactly) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Search Input Box */}
          <div ref={containerRef} className="relative w-64 sm:w-80 md:w-96">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl border border-slate-100/90 pl-4 pr-3 py-2 transition-all focus-within:ring-2 focus-within:ring-emerald-500">
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

              {isLoading ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin mr-1" />
              ) : (
                <button
                  onClick={() => handleKeyDown({ key: 'Enter', preventDefault: () => {} } as any)}
                  className="text-slate-700 hover:text-slate-900 p-1 transition-colors"
                  title="Search"
                >
                  <Search className="w-4 h-4 text-slate-700" />
                </button>
              )}
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

          {/* Standalone Filter Funnel Button & Dropdown (Matching Screenshots 1, 2, 3, 4) */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-xl border cursor-pointer ${
                showFilterDropdown || opportunitiesOnly || socialPageOnly || selectedCategory !== 'all'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-100/90'
              }`}
              title="Filter options"
            >
              <Filter className="w-4 h-4 text-slate-700" />
            </button>

            {/* Pindrop Filter Dropdown Menu */}
            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-100/90 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="relative">
                  {/* Top scroll indicator arrow */}
                  <div className="flex justify-end pr-1 text-slate-400 -mt-1 mb-0.5 pointer-events-none">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </div>

                  {/* Scrollable list of filters */}
                  <div className="max-h-[380px] overflow-y-auto pindrop-dropdown-scroll pr-1 space-y-0.5">
                    {/* 1. No website only */}
                    <button
                      onClick={onToggleOpportunitiesOnly}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[14px] font-semibold transition-colors cursor-pointer ${
                        opportunitiesOnly
                          ? 'bg-amber-50/80 text-amber-700 font-bold'
                          : 'text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#f59e0b' }} />
                        <span>No website only</span>
                      </div>
                      {opportunitiesOnly && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                    </button>

                    {/* 2. Social page only */}
                    <button
                      onClick={onToggleSocialPageOnly}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[14px] font-semibold transition-colors cursor-pointer ${
                        socialPageOnly
                          ? 'bg-pink-50/80 text-pink-600 font-bold'
                          : 'text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#ec4899' }} />
                        <span>Social page only</span>
                      </div>
                      {socialPageOnly && <Check className="w-4 h-4 text-pink-600 shrink-0" />}
                    </button>

                    {/* Divider */}
                    <div className="h-px bg-slate-100 my-1 mx-1.5" />

                    {/* 4. All businesses */}
                    <button
                      onClick={() => {
                        onCategoryChange('all');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[14px] font-semibold transition-colors cursor-pointer ${
                        selectedCategory === 'all'
                          ? 'bg-emerald-50/80 text-emerald-600 font-bold'
                          : 'text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span>All businesses</span>
                      {selectedCategory === 'all' && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>

                    {/* 5-28. All 24 categories in exact screenshot order */}
                    {CATEGORIES.map((cat) => {
                      const isActive = selectedCategory === cat.key;
                      return (
                        <button
                          key={cat.key}
                          onClick={() => {
                            onCategoryChange(cat.key);
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[14px] font-semibold transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-emerald-50/80 text-emerald-600 font-bold'
                              : 'text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <span>{cat.label}</span>
                          {isActive && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom scroll indicator arrow */}
                  <div className="flex justify-end pr-1 text-slate-400 mt-0.5 pointer-events-none">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Standalone Advanced Filter Button & Popover (Review Ratings & Review Counts) */}
          <div ref={advancedFilterRef} className="relative">
            <button
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-xl border cursor-pointer relative ${
                showAdvancedFilter || totalActiveAdvancedFilters > 0
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-100/90'
              }`}
              title="Advanced rating & review filters"
            >
              <SlidersHorizontal
                className={`w-4 h-4 transition-colors ${
                  totalActiveAdvancedFilters > 0 ? 'text-emerald-600' : 'text-slate-700'
                }`}
              />
              {totalActiveAdvancedFilters > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-md border-2 border-white animate-in zoom-in">
                  {totalActiveAdvancedFilters}
                </span>
              )}
            </button>

            {/* Advanced Filters Popover Card */}
            {showAdvancedFilter && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100/90 p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      ADVANCED FILTERS
                    </p>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      Ratings & Reviews
                    </h3>
                  </div>

                  {totalActiveAdvancedFilters > 0 && onClearAdvancedFilters && (
                    <button
                      onClick={onClearAdvancedFilters}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset all
                    </button>
                  )}
                </div>

                {/* Section 1: Review Ratings */}
                <div className="pt-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>Review Ratings</span>
                    </div>
                    {activeRatingCount > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {activeRatingCount} selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Select one or more rating ranges (Multi-select)
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {RATING_FILTER_OPTIONS.map((opt) => {
                      const isSelected = selectedRatingRanges?.includes(opt.key);
                      return (
                        <button
                          key={opt.key}
                          onClick={() => onToggleRatingRange?.(opt.key)}
                          className={`px-3 py-2 rounded-xl text-left border text-xs transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-1 ring-emerald-500/30 font-bold shadow-xs'
                              : 'bg-slate-50/70 hover:bg-slate-100/80 text-slate-700 border-slate-200/70 font-medium'
                          } ${opt.key === 'unrated' ? 'col-span-2' : ''}`}
                        >
                          <div className="flex items-center gap-1.5">
                            {opt.key !== 'unrated' && (
                              <Star
                                className={`w-3 h-3 ${
                                  isSelected
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-amber-300/80 text-amber-400'
                                }`}
                              />
                            )}
                            <span>{opt.label}</span>
                          </div>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-normal">
                              {opt.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 my-4" />

                {/* Section 2: Review Counts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                      <span>Review Counts</span>
                    </div>
                    {activeReviewCount > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {activeReviewCount} selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Select one or more review volume ranges (Multi-select)
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {REVIEW_COUNT_FILTER_OPTIONS.map((opt) => {
                      const isSelected = selectedReviewCountRanges?.includes(opt.key);
                      return (
                        <button
                          key={opt.key}
                          onClick={() => onToggleReviewCountRange?.(opt.key)}
                          className={`px-3 py-2 rounded-xl text-left border text-xs transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-1 ring-emerald-500/30 font-bold shadow-xs'
                              : 'bg-slate-50/70 hover:bg-slate-100/80 text-slate-700 border-slate-200/70 font-medium'
                          } ${opt.key === '200+' ? 'col-span-2' : ''}`}
                        >
                          <span className="font-semibold">{opt.label}</span>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-normal">
                              {opt.subtitle}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {totalFilteredCount !== undefined
                      ? `${totalFilteredCount} matching places`
                      : 'Live filtering active'}
                  </span>
                  <button
                    onClick={() => setShowAdvancedFilter(false)}
                    className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="w-11 h-11 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-600 shadow-xl border border-slate-100/90 flex items-center justify-center transition-all shrink-0 cursor-pointer"
              title="Export leads CSV"
            >
              <Download className="w-4 h-4 text-slate-700" />
            </button>
          )}
        </div>

        {/* Right Side: Zoom Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
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
