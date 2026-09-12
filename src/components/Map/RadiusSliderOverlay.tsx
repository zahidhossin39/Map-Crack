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
    <div className="flex flex-col justify-center bg-slate-950/85 border border-emerald-500/40 shadow-2xl backdrop-blur-md px-3.5 py-1.5 rounded-2xl w-52 sm:w-64 select-none pointer-events-auto">
      <div className="flex items-center justify-between px-0.5 mb-1">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 drop-shadow-sm">
          SEARCH RADIUS
        </span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] shadow-sm shadow-emerald-600/30">
          {miles} mi ({radiusMeters < 1000 ? `${radiusMeters}m` : `${(radiusMeters / 1000).toFixed(1)}km`})
        </span>
      </div>

      {/* Slider Track and Thumb */}
      <div className="relative flex items-center px-0.5">
        <input
          type="range"
          min="250"
          max="5000"
          step="50"
          value={radiusMeters}
          onChange={handleChange}
          className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
        />
      </div>
    </div>
  );
};
