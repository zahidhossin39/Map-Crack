'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BusinessPlace, SearchCenter } from '@/types/business';
import { BusinessCard } from '@/components/Sidebar/BusinessCard';
import { OpportunityStatsCard } from '@/components/Sidebar/OpportunityStatsCard';
import { SkeletonCard } from '@/components/Common/SkeletonCard';
import {
  ChevronUp,
  ChevronDown,
  Sparkles,
  MapPin,
  Search,
  ArrowUpDown,
  Download,
  Copy,
} from 'lucide-react';

interface MobileBottomSheetProps {
  businesses: BusinessPlace[];
  isSearching: boolean;
  centerPin: SearchCenter;
  selectedBusinessId?: string | null;
  hoveredBusinessId?: string | null;
  onBusinessSelect: (business: BusinessPlace) => void;
  onBusinessHover: (id: string | null) => void;
  onExportCSV: () => void;
  onCopyClipboard: () => void;
  copied: boolean;
}

type SheetState = 'peek' | 'half' | 'full';

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  businesses,
  isSearching,
  centerPin,
  selectedBusinessId,
  hoveredBusinessId,
  onBusinessSelect,
  onBusinessHover,
  onExportCSV,
  onCopyClipboard,
  copied,
}) => {
  const [sheetState, setSheetState] = useState<SheetState>('peek');
  const [activeTab, setActiveTab] = useState<'all' | 'opportunities'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const opportunities = businesses.filter((b) => !b.hasWebsite);

  let filtered = activeTab === 'opportunities' ? opportunities : businesses;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.formattedAddress?.toLowerCase().includes(q) ||
        b.primaryTypeDisplayName?.toLowerCase().includes(q)
    );
  }

  const heightClasses: Record<SheetState, string> = {
    peek: 'h-[84px]',
    half: 'h-[50vh]',
    full: 'h-[88vh]',
  };

  const toggleExpand = () => {
    if (sheetState === 'peek') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
    else setSheetState('peek');
  };

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-700/80 rounded-t-3xl shadow-2xl transition-all duration-300 flex flex-col ${heightClasses[sheetState]}`}
    >
      {/* Top draggable handle bar */}
      <div
        onClick={toggleExpand}
        className="p-3 flex flex-col items-center justify-center cursor-pointer select-none shrink-0"
      >
        <div className="w-12 h-1.5 rounded-full bg-slate-600 mb-1.5" />
        <div className="w-full flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              {businesses.length} Businesses Nearby
            </span>
            {opportunities.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-opportunity-500/20 text-opportunity-300 border border-opportunity-500/40">
                <Sparkles className="w-3 h-3 text-opportunity-400" />
                {opportunities.length} Leads
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
            <span>{sheetState === 'peek' ? 'Swipe up' : sheetState === 'half' ? 'Full view' : 'Minimize'}</span>
            {sheetState === 'full' ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded contents */}
      {sheetState !== 'peek' && (
        <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4 space-y-3">
          {/* Quick tab toggle */}
          <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              All ({businesses.length})
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'opportunities'
                  ? 'bg-gradient-to-r from-opportunity-600 to-amber-600 text-white'
                  : 'text-opportunity-400'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>No Website ({opportunities.length})</span>
            </button>
          </div>

          {/* Quick search input */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this list..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Business scroll list */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {isSearching ? (
              <div className="space-y-2.5">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((b) => (
                <BusinessCard
                  key={b.id}
                  business={b}
                  isSelected={selectedBusinessId === b.id}
                  isHovered={hoveredBusinessId === b.id}
                  onSelect={(place) => {
                    onBusinessSelect(place);
                    setSheetState('half');
                  }}
                  onHover={onBusinessHover}
                />
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No matching businesses found.
              </div>
            )}
          </div>

          {/* Mobile footer attribution */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
            <span>Tap any place to inspect</span>
            <span className="font-semibold text-slate-400">Google Maps</span>
          </div>
        </div>
      )}
    </div>
  );
};
