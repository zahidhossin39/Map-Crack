'use client';

import React from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { BusinessPlace } from '@/types/business';

interface CustomMarkerLayerProps {
  centerPin: { lat: number; lng: number; address?: string };
  businesses: BusinessPlace[];
  selectedBusinessId?: string | null;
  hoveredBusinessId?: string | null;
  onBusinessSelect: (business: BusinessPlace) => void;
  onBusinessHover: (id: string | null) => void;
}

export const CustomMarkerLayer: React.FC<CustomMarkerLayerProps> = ({
  centerPin,
  businesses,
  selectedBusinessId,
  hoveredBusinessId,
  onBusinessSelect,
  onBusinessHover,
}) => {
  return (
    <>
      {/* 3D Center Dropped Pin with blue direction cone */}
      <AdvancedMarker
        position={{ lat: centerPin.lat, lng: centerPin.lng }}
        title="Search Spot"
        zIndex={1000}
      >
        <div className="relative flex flex-col items-center justify-center -translate-y-full cursor-pointer select-none">
          {/* Main 3D Pin Head */}
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-1 shadow-2xl flex items-center justify-center border-2 border-white ring-4 ring-emerald-500/30 animate-pulse-subtle">
            <div className="w-3.5 h-3.5 rounded-full bg-white shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </div>
            {/* Blue orientation wedge */}
            <div className="absolute -right-1 top-0 w-3 h-3 bg-blue-500 rounded-tr-md rotate-45 border border-white shadow-sm" />
          </div>

          {/* Stem & Ground Shadow */}
          <div className="w-1 h-3 bg-gradient-to-b from-teal-600 to-slate-800 -mt-0.5 rounded-b-full shadow-md" />
          <div className="w-3 h-1.5 bg-black/40 rounded-full blur-[1px] mt-0.5" />
        </div>
      </AdvancedMarker>

      {/* Business Pins (Exact Replica of Pindrop Image 1) */}
      {businesses.map((business) => {
        const isOpportunity = !business.hasWebsite;
        const isSelected = selectedBusinessId === business.id;
        const isHovered = hoveredBusinessId === business.id;

        // Render dot indicator string (e.g. "●●●●") based on rating
        const ratingDots = business.rating
          ? '●'.repeat(Math.min(5, Math.max(1, Math.round(business.rating))))
          : isOpportunity
          ? '●●●●'
          : '';

        return (
          <AdvancedMarker
            key={business.id}
            position={{
              lat: business.location.lat,
              lng: business.location.lng,
            }}
            title={business.name}
            zIndex={isSelected ? 999 : isOpportunity ? 600 : 200}
            onClick={() => onBusinessSelect(business)}
          >
            <div
              onMouseEnter={() => onBusinessHover(business.id)}
              onMouseLeave={() => onBusinessHover(null)}
              className={`group relative flex flex-col items-center cursor-pointer -translate-y-1/2 transition-all duration-200 ${
                isSelected
                  ? 'scale-125 z-50'
                  : isHovered
                  ? 'scale-115 z-40'
                  : 'scale-100 hover:scale-110'
              }`}
            >
              {/* Circular Icon Pin */}
              {isOpportunity ? (
                /* ORANGE PIN (NO WEBSITE - OPPORTUNITY) */
                <div className="relative flex items-center justify-center">
                  {/* Glowing amber aura */}
                  <div className="absolute -inset-1 rounded-full bg-amber-400 opacity-60 blur-[3px] group-hover:opacity-90 animate-pulse" />
                  <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white shadow-md flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white/90 shadow-sm" />
                  </div>
                </div>
              ) : (
                /* GREEN PIN (HAS WEBSITE) */
                <div className="relative flex items-center justify-center">
                  <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-white shadow-md flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white/90 shadow-sm" />
                  </div>
                </div>
              )}

              {/* Business Name Label with Rating Dots (Below pin, matching screenshot) */}
              <div className="mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm border border-slate-700/60 shadow-lg pointer-events-none max-w-[140px]">
                <span
                  className={`text-[11px] font-bold truncate leading-none ${
                    isOpportunity ? 'text-amber-200' : 'text-emerald-200'
                  }`}
                >
                  {business.name}
                </span>
                {ratingDots && (
                  <span
                    className={`text-[8px] tracking-tighter shrink-0 ${
                      isOpportunity ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {ratingDots}
                  </span>
                )}
              </div>
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
};
