'use client';

import React from 'react';
import { PlaceAutocomplete } from '@/components/Search/PlaceAutocomplete';
import { RadiusSelector } from '@/components/Controls/RadiusSelector';
import { CategorySelector } from '@/components/Controls/CategorySelector';
import { SearchCenter, CategoryKey } from '@/types/business';
import { Sparkles, RefreshCw, Download, Copy, Check, Filter } from 'lucide-react';

interface FilterBarProps {
  apiKey?: string;
  currentAddress?: string;
  onPlaceSelect: (center: SearchCenter) => void;
  selectedRadius: number;
  onRadiusChange: (radius: number) => void;
  selectedCategory: CategoryKey;
  onCategoryChange: (category: CategoryKey) => void;
  opportunitiesOnly: boolean;
  onToggleOpportunitiesOnly: () => void;
  onSearchThisArea: () => void;
  isSearching: boolean;
  onExportCSV: () => void;
  onCopyClipboard: () => void;
  copied: boolean;
  opportunityCount: number;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  apiKey,
  currentAddress,
  onPlaceSelect,
  selectedRadius,
  onRadiusChange,
  selectedCategory,
  onCategoryChange,
  opportunitiesOnly,
  onToggleOpportunitiesOnly,
  onSearchThisArea,
  isSearching,
  onExportCSV,
  onCopyClipboard,
  copied,
  opportunityCount,
  totalCount,
}) => {
  return (
    <div className="absolute top-20 left-4 right-4 md:right-auto md:w-[680px] z-30 space-y-2 pointer-events-none">
      {/* Top search and radius row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pointer-events-auto">
        <div className="flex-1">
          <PlaceAutocomplete
            apiKey={apiKey}
            onPlaceSelect={onPlaceSelect}
            currentAddress={currentAddress}
          />
        </div>

        <RadiusSelector
          selectedRadius={selectedRadius}
          onRadiusChange={onRadiusChange}
        />
      </div>

      {/* Category and action chips row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-1">
        {/* Opportunities Only toggle badge */}
        <button
          onClick={onToggleOpportunitiesOnly}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shadow-glass backdrop-blur-xl ${
            opportunitiesOnly
              ? 'bg-gradient-to-r from-opportunity-600 to-amber-600 text-white border-opportunity-400 shadow-glow-opportunity'
              : 'bg-slate-900/90 text-opportunity-300 border-opportunity-500/40 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>No Website Only ({opportunityCount})</span>
        </button>

        {/* Re-search area button */}
        <button
          onClick={onSearchThisArea}
          disabled={isSearching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 shadow-glass backdrop-blur-xl disabled:opacity-50"
          title="Search around map center"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-brand-400 ${isSearching ? 'animate-spin' : ''}`} />
          <span>Search Area</span>
        </button>

        {/* Export options */}
        {totalCount > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-glass backdrop-blur-xl"
              title="Export all found businesses to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={onCopyClipboard}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-glass backdrop-blur-xl"
              title="Copy opportunity leads to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Leads</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Category selector row */}
      <div className="pointer-events-auto">
        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
        />
      </div>
    </div>
  );
};
