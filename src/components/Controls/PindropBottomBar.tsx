'use client';

import React from 'react';
import {
  MapPin,
  Search,
  FolderKanban,
  User,
  Clock,
  Navigation,
  Car,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface PindropBottomBarProps {
  activeTab: 'drop' | 'leads' | 'sites' | 'you';
  onTabChange: (tab: 'drop' | 'leads' | 'sites' | 'you') => void;
  onSearchThisSpot: () => void;
  isSearching: boolean;
  onTiltUp?: () => void;
  onTiltDown?: () => void;
  onOpenSettings?: () => void;
}

export const PindropBottomBar: React.FC<PindropBottomBarProps> = ({
  activeTab,
  onTabChange,
  onSearchThisSpot,
  isSearching,
  onTiltUp,
  onTiltDown,
  onOpenSettings,
}) => {
  return (
    <footer className="absolute bottom-6 left-4 right-4 z-30 flex items-center justify-between pointer-events-none select-none">
      {/* Left: 3D Compass Tilt Controller */}
      <div className="hidden md:flex flex-col items-center p-1.5 rounded-full bg-white/95 shadow-xl border border-slate-100 backdrop-blur-md pointer-events-auto">
        <button
          onClick={onTiltUp}
          className="w-7 h-7 flex items-center justify-center text-slate-700 hover:text-emerald-600 active:scale-95 transition-all"
          title="Tilt view"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1">
          <button
            className="w-7 h-7 flex items-center justify-center text-slate-700 hover:text-emerald-600 active:scale-95 transition-all"
            title="Pan left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-6 h-6 rounded-full bg-emerald-500 shadow-sm" />
          <button
            className="w-7 h-7 flex items-center justify-center text-slate-700 hover:text-emerald-600 active:scale-95 transition-all"
            title="Pan right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={onTiltDown}
          className="w-7 h-7 flex items-center justify-center text-slate-700 hover:text-emerald-600 active:scale-95 transition-all"
          title="Reset tilt"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

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
        <div className="hidden lg:flex items-center gap-1 bg-white/95 rounded-full p-1.5 shadow-2xl border border-slate-100">
          <button
            className="w-9 h-9 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
            title="Recent searches"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            className="w-9 h-9 rounded-full bg-emerald-600 text-white shadow-md flex items-center justify-center"
            title="Drop pin mode"
          >
            <MapPin className="w-4 h-4" />
          </button>
          <button
            className="w-9 h-9 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
            title="Direction"
          >
            <Navigation className="w-4 h-4" />
          </button>
          <button
            className="w-9 h-9 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
            title="Drive mode"
          >
            <Car className="w-4 h-4" />
          </button>
        </div>

        {/* Big Green CTA: "Search this spot" (Matching Image 2) */}
        <button
          onClick={onSearchThisSpot}
          disabled={isSearching}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
        >
          <MapPin className="w-4 h-4 fill-white" />
          <span>{isSearching ? 'Searching...' : 'Search this spot'}</span>
        </button>
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
