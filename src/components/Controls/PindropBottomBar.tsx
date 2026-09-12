'use client';

import React from 'react';
import {
  MapPin,
  Search,
  FolderKanban,
  User,
  Sun,
  Moon,
  Navigation,
  MessageSquare,
} from 'lucide-react';

import { MapTheme, ExploreMode } from '@/types/business';
import { RadiusSliderOverlay } from '@/components/Map/RadiusSliderOverlay';

interface PindropBottomBarProps {
  activeTab: 'drop' | 'leads' | 'sites' | 'you';
  onTabChange: (tab: 'drop' | 'leads' | 'sites' | 'you') => void;
  onSearchThisSpot: () => void;
  isSearching: boolean;
  onOpenSettings?: () => void;
  radiusMeters?: number;
  onRadiusChange?: (radius: number) => void;
  mapTheme?: MapTheme;
  onToggleTheme?: () => void;
  exploreMode?: ExploreMode;
  onExploreModeChange?: (mode: ExploreMode) => void;
}

export const PindropBottomBar: React.FC<PindropBottomBarProps> = ({
  activeTab,
  onTabChange,
  onSearchThisSpot,
  isSearching,
  onOpenSettings,
  radiusMeters,
  onRadiusChange,
  mapTheme,
  onToggleTheme,
  exploreMode = 'pin',
  onExploreModeChange,
}) => {
  return (
    <footer className="absolute bottom-6 left-4 right-4 z-30 flex items-center justify-between pointer-events-none select-none">
      {/* Left spacer to keep center controls balanced */}
      <div className="w-12 h-12 hidden md:block pointer-events-none" />

      {/* Center: Floating Navigation Island (Image 2) */}
      <div className="flex items-center gap-2 pointer-events-auto mx-auto">
        <nav className="flex items-center bg-white/95 rounded-full px-3 py-1.5 shadow-2xl border border-slate-100/90 backdrop-blur-md">
          {/* Drop Tab */}
          <button
            onClick={() => onTabChange('drop')}
            className={`flex flex-col items-center px-4 py-1 rounded-full transition-all ${
              activeTab === 'drop'
                ? 'text-emerald-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-[11px] mt-0.5">Drop</span>
          </button>

          {/* Leads Tab */}
          <button
            onClick={() => onTabChange('leads')}
            className={`flex flex-col items-center px-4 py-1 rounded-full transition-all ${
              activeTab === 'leads'
                ? 'text-emerald-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="text-[11px] mt-0.5">Leads</span>
          </button>

          {/* Sites Tab */}
          <button
            onClick={() => onTabChange('sites')}
            className={`flex flex-col items-center px-4 py-1 rounded-full transition-all ${
              activeTab === 'sites'
                ? 'text-emerald-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span className="text-[11px] mt-0.5">Sites</span>
          </button>

          {/* You Tab */}
          <button
            onClick={() => {
              onTabChange('you');
              if (onOpenSettings) onOpenSettings();
            }}
            className={`flex flex-col items-center px-4 py-1 rounded-full transition-all ${
              activeTab === 'you'
                ? 'text-emerald-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[11px] mt-0.5">You</span>
          </button>
        </nav>

        {/* Action Mode Buttons */}
        <div className="hidden sm:flex items-center gap-1 bg-white/95 rounded-full p-1.5 shadow-2xl border border-slate-100">
          {/* Day / Night Theme Switch Button */}
          <button
            onClick={onToggleTheme}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              mapTheme === 'dark'
                ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50/80'
                : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/80'
            }`}
            title={mapTheme === 'dark' ? 'Switch to Day Theme' : 'Switch to Night Theme'}
            aria-label="Toggle map theme"
          >
            {mapTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-500 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
            )}
          </button>
          {/* Drop Pin Mode Button */}
          <button
            onClick={() => onExploreModeChange?.('pin')}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              exploreMode === 'pin'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Drop Pin Mode (Click map to drop radius pin)"
            aria-label="Drop pin mode"
          >
            <MapPin className="w-4 h-4" />
          </button>

          {/* Free Roam / Direction Mode Button */}
          <button
            onClick={() => onExploreModeChange?.('roam')}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              exploreMode === 'roam'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Free Roam Mode (Freely explore the map & hover over businesses)"
            aria-label="Free roam mode"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>

        {/* Big Green CTA: "Search this spot" or "Scan visible area" */}
        <button
          onClick={onSearchThisSpot}
          disabled={isSearching}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          {exploreMode === 'roam' ? (
            <Navigation className="w-4 h-4 fill-white" />
          ) : (
            <MapPin className="w-4 h-4 fill-white" />
          )}
          <span>
            {isSearching
              ? 'Searching...'
              : exploreMode === 'roam'
              ? 'Scan visible area'
              : 'Search this spot'}
          </span>
        </button>

        {/* Search Radius Slider (in Pin mode) or Roam Indicator (in Roam mode) */}
        {exploreMode === 'roam' ? (
          <div className="flex items-center gap-2 bg-slate-950/85 border border-emerald-500/40 shadow-2xl backdrop-blur-md px-3.5 py-2 rounded-2xl select-none pointer-events-auto text-xs text-white">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="font-extrabold uppercase tracking-wider text-emerald-300 text-[10px]">
              FREE ROAM MODE
            </span>
            <span className="text-slate-400 text-[11px] hidden md:inline">
              • Pan map freely to explore
            </span>
          </div>
        ) : (
          radiusMeters !== undefined && onRadiusChange && (
            <RadiusSliderOverlay
              radiusMeters={radiusMeters}
              onRadiusChange={onRadiusChange}
            />
          )
        )}
      </div>

      {/* Right: Floating Chat / Help Bubble */}
      <div className="flex items-center pointer-events-auto">
        <button
          onClick={() => onTabChange('leads')}
          className="w-12 h-12 rounded-full bg-white/95 text-emerald-600 hover:bg-white shadow-2xl border border-slate-100 flex items-center justify-center active:scale-95 transition-all"
          title="Open leads list"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
    </footer>
  );
};
