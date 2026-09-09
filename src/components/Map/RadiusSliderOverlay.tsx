'use client';

import React from 'react';

interface RadiusSliderOverlayProps {
  radiusMeters: number;
  onRadiusChange: (radius: number) => void;
}

export const RadiusSliderOverlay: React.FC<RadiusSliderOverlayProps> = ({
  radiusMeters,
  onRadiusChange,
}) => {
  // Convert meters to miles/km for display
  const miles = (radiusMeters / 1609.34).toFixed(2);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onRadiusChange(Number(e.target.value));
  };

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-12 z-20 pointer-events-auto w-72 sm:w-80 select-none">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 drop-shadow-md">
          SEARCH RADIUS
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30">
          {miles} mi ({radiusMeters < 1000 ? `${radiusMeters}m` : `${(radiusMeters / 1000).toFixed(1)}km`})
        </span>
      </div>

      {/* Slider Track and Thumb */}
      <div className="relative flex items-center bg-slate-950/70 p-2 rounded-2xl backdrop-blur-md border border-emerald-500/40 shadow-xl">
        <input
          type="range"
          min="250"
          max="5000"
          step="50"
          value={radiusMeters}
          onChange={handleChange}
          className="w-full h-1.5 bg-white/40 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
        />
      </div>
    </div>
  );
};
