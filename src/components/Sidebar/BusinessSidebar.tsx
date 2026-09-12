'use client';

import React, { useState } from 'react';
import { BusinessPlace, SearchCenter } from '@/types/business';
import { isValidBusinessPlace } from '@/lib/businessValidation';
import { BusinessCard } from '@/components/Sidebar/BusinessCard';
import { OpportunityStatsCard } from '@/components/Sidebar/OpportunityStatsCard';
import { SkeletonCard } from '@/components/Common/SkeletonCard';
import {
  Sparkles,
  Layers,
  ArrowUpDown,
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

interface BusinessSidebarProps {
  businesses: BusinessPlace[];
  isSearching: boolean;
  centerPin: SearchCenter;
  radiusMeters: number;
  selectedBusinessId?: string | null;
  hoveredBusinessId?: string | null;
  onBusinessSelect: (business: BusinessPlace) => void;
  onBusinessHover: (id: string | null) => void;
  onExportCSV: () => void;
  onCopyClipboard: () => void;
  copied: boolean;
}

export const BusinessSidebar: React.FC<BusinessSidebarProps> = ({
  businesses,
  isSearching,
  centerPin,
  radiusMeters,
  selectedBusinessId,
  hoveredBusinessId,
  onBusinessSelect,
  onBusinessHover,
  onExportCSV,
  onCopyClipboard,
  copied,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'opportunities'>('all');
  const [sortBy, setSortBy] = useState<'opportunities' | 'rating' | 'reviews' | 'distance'>(
    'opportunities'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const validBusinesses = businesses.filter(isValidBusinessPlace);
  const opportunities = validBusinesses.filter((b) => !b.hasWebsite);

  // Filter based on active tab and search query
  let filtered = activeTab === 'opportunities' ? opportunities : validBusinesses;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.formattedAddress?.toLowerCase().includes(q) ||
        b.primaryTypeDisplayName?.toLowerCase().includes(q)
    );
  }

  // Apply sorting
  const sortedBusinesses = [...filtered].sort((a, b) => {
    if (sortBy === 'opportunities') {
      if (!a.hasWebsite && b.hasWebsite) return -1;
      if (a.hasWebsite && !b.hasWebsite) return 1;
      return (a.distanceMeters || 0) - (b.distanceMeters || 0);
    }
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === 'reviews') {
      return (b.userRatingCount || 0) - (a.userRatingCount || 0);
    }
    if (sortBy === 'distance') {
      return (a.distanceMeters || 0) - (b.distanceMeters || 0);
    }
    return 0;
  });

  return (
    <aside
      className={`hidden md:flex flex-col fixed top-0 right-0 bottom-0 z-30 transition-all duration-300 ${
        isCollapsed ? 'translate-x-[calc(100%-48px)]' : 'translate-x-0'
      }`}
      style={{ width: '420px' }}
    >
      {/* Collapse Toggle Handle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-1/2 -left-4 -translate-y-1/2 z-40 p-1.5 rounded-l-xl bg-slate-900/95 border-l border-y border-slate-700 text-slate-300 hover:text-white shadow-xl backdrop-blur-xl"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      <div className="flex-1 flex flex-col h-full bg-slate-950/90 backdrop-blur-2xl border-l border-slate-800/90 shadow-2xl overflow-hidden">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-brand-500/20 text-brand-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Local Businesses</h2>
                <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                  {centerPin.address || `${centerPin.lat.toFixed(4)}, ${centerPin.lng.toFixed(4)}`}
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {businesses.length} Found
            </span>
          </div>

          {/* Prospecting Stats Card */}
          <OpportunityStatsCard
            businesses={validBusinesses}
            onExportCSV={onExportCSV}
            onCopyClipboard={onCopyClipboard}
            copied={copied}
          />

          {/* Tab switches */}
          <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Businesses ({validBusinesses.length})
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'opportunities'
                  ? 'bg-gradient-to-r from-opportunity-600 to-amber-600 text-white shadow-md shadow-opportunity-600/20'
                  : 'text-opportunity-400 hover:text-opportunity-300'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>No Website ({opportunities.length})</span>
            </button>
          </div>

          {/* Quick Search and Sort Controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name or type..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-2.5 pr-7 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="opportunities">Opportunities First</option>
                <option value="rating">Highest Rating</option>
                <option value="reviews">Most Reviews</option>
                <option value="distance">Nearest First</option>
              </select>
              <ArrowUpDown className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Business List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isSearching ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : sortedBusinesses.length > 0 ? (
            sortedBusinesses.map((b) => (
              <BusinessCard
                key={b.id}
                business={b}
                isSelected={selectedBusinessId === b.id}
                isHovered={hoveredBusinessId === b.id}
                onSelect={onBusinessSelect}
                onHover={onBusinessHover}
              />
            ))
          ) : (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">No businesses found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Try widening your search radius or click anywhere on the map to drop a pin in a busier commercial area.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Legal and compliance footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-600" />
            <span>Click card to inspect lead details</span>
          </span>
          <span className="font-semibold text-slate-400">Google Maps</span>
        </div>
      </div>
    </aside>
  );
};
