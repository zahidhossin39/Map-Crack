'use client';

import React from 'react';
import { MapPin, Target, Sparkles, Navigation, Layers } from 'lucide-react';
import { MapTheme } from '@/types/business';

interface HeaderProps {
  mapTheme: MapTheme;
  onThemeToggle: () => void;
  onLocateMe: () => void;
  isLocating: boolean;
  totalBusinesses: number;
  opportunityCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  mapTheme,
  onThemeToggle,
  onLocateMe,
  isLocating,
  totalBusinesses,
  opportunityCount,
}) => {
  return (
    <header className="absolute top-4 left-4 z-40 flex items-center gap-3">
      <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 px-4 py-2.5 rounded-2xl shadow-glass">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-emerald-500 to-amber-500 flex items-center justify-center shadow-md shadow-brand-500/20 text-white">
            <Target className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1">
                Map Crack
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PROSPECT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Drop pin to discover local businesses
            </p>
          </div>
        </div>

        {totalBusinesses > 0 && (
          <div className="hidden lg:flex items-center gap-2 pl-3 ml-2 border-l border-slate-700/70">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 text-xs">
              <span className="text-slate-400">Total:</span>
              <span className="font-semibold text-white">{totalBusinesses}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-opportunity-500/20 border border-opportunity-500/40 text-xs text-opportunity-300">
              <Sparkles className="w-3 h-3 text-opportunity-400" />
              <span className="font-bold">{opportunityCount}</span>
              <span className="text-[11px]">No Website</span>
            </div>
          </div>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-xl border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white shadow-glass transition-all disabled:opacity-50"
          title="Center on my location"
        >
          <Navigation className={`w-3.5 h-3.5 text-brand-400 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'My Location'}</span>
        </button>

        <button
          onClick={onThemeToggle}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-xl border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white shadow-glass transition-all"
          title="Toggle map theme (Dark/Light)"
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span className="capitalize">{mapTheme} Mode</span>
        </button>
      </div>
    </header>
  );
};
