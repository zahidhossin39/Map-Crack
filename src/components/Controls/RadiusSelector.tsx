'use client';

import React from 'react';
import { RADIUS_OPTIONS } from '@/lib/constants';
import { Disc } from 'lucide-react';

interface RadiusSelectorProps {
  selectedRadius: number;
  onRadiusChange: (radius: number) => void;
}

export const RadiusSelector: React.FC<RadiusSelectorProps> = ({
  selectedRadius,
  onRadiusChange,
}) => {
  return (
    <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-700/80 backdrop-blur-xl shadow-glass">
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-slate-400 text-xs font-medium">
        <Disc className="w-3.5 h-3.5 text-brand-400" />
        <span>Radius:</span>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {RADIUS_OPTIONS.map((option) => {
          const isSelected = selectedRadius === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onRadiusChange(option.value)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-brand-600 to-emerald-600 text-white shadow-md shadow-brand-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {option.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
};
