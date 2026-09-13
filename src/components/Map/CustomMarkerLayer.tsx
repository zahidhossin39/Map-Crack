'use client';

import React from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { Star } from 'lucide-react';
import { BusinessPlace, ExploreMode, LeadStatus } from '@/types/business';
import { getBusinessPinVisuals } from '@/lib/pindropUtils';

interface CustomMarkerLayerProps {
  centerPin: { lat: number; lng: number; address?: string };
  businesses: BusinessPlace[];
  selectedBusinessId?: string | null;
  hoveredBusinessId?: string | null;
  onBusinessSelect: (business: BusinessPlace) => void;
  onBusinessHover: (id: string | null) => void;
  exploreMode?: ExploreMode;
  leadStatuses?: Record<string, LeadStatus>;
  selectedIds?: Record<string, true>;
  onToggleSelect?: (id: string) => void;
}

export const CustomMarkerLayer: React.FC<CustomMarkerLayerProps> = ({
  centerPin,
  businesses,
  selectedBusinessId,
  hoveredBusinessId,
  onBusinessSelect,
  onBusinessHover,
  exploreMode = 'pin',
  leadStatuses,
  selectedIds,
  onToggleSelect,
}) => {
  return (
    <>
      {/* 3D Center Dropped Pin with blue direction cone (Hidden in Roam mode) */}
      {exploreMode !== 'roam' && (
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
      )}

      {/* Business Pins (Exact Replica of Pindrop Map Key & Pins) */}
      {businesses.map((business) => {
        const leadStatus = leadStatuses?.[business.id] || business.leadStatus || 'none';
        const visual = getBusinessPinVisuals(business, leadStatus);
        const isSelected = selectedBusinessId === business.id;
        const isHovered = hoveredBusinessId === business.id;
        const isStarred = selectedIds?.[business.id] === true;

        // Render dot indicator string (e.g. "●●●●") based on rating
        const ratingDots = business.rating
          ? '●'.repeat(Math.min(5, Math.max(1, Math.round(business.rating))))
          : visual.category === 'no_website' || visual.category === 'social_page_only'
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
            zIndex={
              isHovered
                ? 10000
                : isSelected
                ? 999
                : visual.category === 'client'
                ? 700
                : visual.category === 'talking'
                ? 650
                : visual.category === 'no_website' || visual.category === 'social_page_only'
                ? 600
                : 200
            }
            onClick={() => onBusinessSelect(business)}
          >
            <div
              onMouseEnter={() => onBusinessHover(business.id)}
              onMouseLeave={() => onBusinessHover(null)}
              className={`group relative flex flex-col items-center cursor-pointer -translate-y-1/2 transition-all duration-200 ${
                isSelected
                  ? 'scale-125 z-50'
                  : isHovered
                  ? 'scale-115 z-[5]'
                  : 'scale-100 hover:scale-110'
              }`}
            >
              {/* Circular Icon Pin (Matching Map Key Colors) */}
              <div className="relative flex items-center justify-center">
                {/* Glowing aura */}
                <div
                  className={`absolute -inset-1 rounded-full ${visual.auraColor} opacity-60 blur-[3px] group-hover:opacity-90 animate-pulse`}
                  style={visual.category === 'social_page_only' ? { backgroundColor: '#ec4899' } : undefined}
                />
                <div
                  className={`relative w-6 h-6 rounded-full bg-gradient-to-br ${visual.pinGradient} border-2 border-white shadow-md flex items-center justify-center`}
                  style={visual.category === 'social_page_only' ? { background: 'linear-gradient(135deg, #f472b6, #ec4899)' } : undefined}
                >
                  <div className="w-2 h-2 rounded-full bg-white/90 shadow-sm" />
                </div>
              </div>

              {/* Hover card. The outer wrapper's pb-3 keeps the 12px gap inside the hovered
                  element, so the pointer can travel from pin to card without the card
                  closing out from under it. */}
              {isHovered && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 z-[5] pb-3 pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
                  style={{ zIndex: 5 }}
                >
                <div className="w-72 p-3.5 rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl shadow-black ring-1 ring-white/10 text-left">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-white text-xs leading-snug break-words flex-1">
                      {business.name}
                    </h4>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full border text-[9px] font-extrabold tracking-wide uppercase shadow-sm ${visual.badgeClass}`}
                      style={visual.category === 'social_page_only' ? { borderColor: '#ec4899', color: '#f472b6', backgroundColor: 'rgba(236, 72, 153, 0.2)' } : undefined}
                    >
                      {visual.badgeText}
                    </span>
                  </div>

                  {/* Rating & Category & Open Status */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-300 mb-2 flex-wrap">
                    {business.rating ? (
                      <span className="flex items-center gap-1 font-bold text-amber-400">
                        ★ {business.rating.toFixed(1)}
                        {business.userRatingCount ? (
                          <span className="text-slate-400 font-normal text-[10px]">
                            ({business.userRatingCount})
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">No ratings</span>
                    )}

                    {business.primaryTypeDisplayName && (
                      <span className="text-[10px] text-slate-300 font-medium">
                        • {business.primaryTypeDisplayName}
                      </span>
                    )}

                    {business.regularOpeningHours?.openNow !== undefined && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          business.regularOpeningHours.openNow
                            ? 'text-emerald-300 bg-emerald-950/70 border border-emerald-500/40'
                            : 'text-rose-300 bg-rose-950/70 border border-rose-500/40'
                        }`}
                      >
                        {business.regularOpeningHours.openNow ? 'Open Now' : 'Closed'}
                      </span>
                    )}
                  </div>

                  {/* Formatted Address (Full, never hidden) */}
                  {business.formattedAddress && (
                    <div className="text-[11px] text-slate-300 leading-snug mb-2 flex items-start gap-1.5">
                      <span className="shrink-0 text-slate-400">📍</span>
                      <span className="break-words">{business.formattedAddress}</span>
                    </div>
                  )}

                  {/* Phone Number (Direct Contact, never hidden) */}
                  {business.nationalPhoneNumber && (
                    <div className="text-[11px] text-slate-300 mb-2 flex items-center gap-1.5">
                      <span className="shrink-0 text-slate-400">📞</span>
                      <span className="font-mono font-medium text-emerald-300">
                        {business.nationalPhoneNumber}
                      </span>
                    </div>
                  )}

                  {/* Website info or Opportunity hint */}
                  {visual.category === 'no_website' ? (
                    <div className="p-2.5 rounded-xl bg-[#221508] border border-amber-500/40 text-amber-200 text-[10px] flex items-center gap-1.5 mb-2 shadow-sm">
                      <span>🚀</span>
                      <span className="font-semibold">No website yet • Pitch opportunity</span>
                    </div>
                  ) : visual.category === 'social_page_only' ? (
                    <div className="p-2.5 rounded-xl bg-[#280c1d] border border-pink-500/50 text-pink-200 text-[10px] space-y-1 mb-2 shadow-sm">
                      <div className="flex items-center gap-1.5 font-bold text-pink-400">
                        <span>🌸</span>
                        <span>Social page only (No real site)</span>
                      </div>
                      {business.websiteURI && (
                        <div className="text-[10px] text-pink-300/90 break-all underline">
                          {business.websiteURI.replace(/^https?:\/\/(www\.)?/, '')}
                        </div>
                      )}
                    </div>
                  ) : (
                    business.websiteURI && (
                      <div className="text-[10px] text-emerald-400 break-all flex items-center gap-1.5 mb-2">
                        <span>🌐</span>
                        <span className="underline">{business.websiteURI.replace(/^https?:\/\/(www\.)?/, '')}</span>
                      </div>
                    )
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-800/90 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        // The marker itself opens the detail modal on click.
                        e.stopPropagation();
                        onToggleSelect?.(business.id);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        isStarred
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                      }`}
                      title={isStarred ? 'Remove from your list' : 'Save to your list'}
                    >
                      <Star className={`w-3 h-3 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      <span>{isStarred ? 'Selected' : 'Select'}</span>
                    </button>
                    <span className="text-[9px] text-emerald-400 font-bold">Details →</span>
                  </div>
                </div>
                </div>
              )}

              {/* Business Name Label with Rating Dots */}
              <div className="mt-1 flex flex-col items-center pointer-events-none max-w-[200px] text-center transition-all duration-150">
                <div
                  className={`px-2 py-0.5 rounded-full backdrop-blur-md shadow-md flex items-center justify-center gap-1.5 border transition-all bg-slate-950/85 group-hover:bg-slate-950 ${visual.labelBorderClass}`}
                >
                  <span className="text-[11px] font-bold leading-tight whitespace-normal break-words text-center">
                    {business.name}
                  </span>
                  {ratingDots && (
                    <span
                      className={`text-[8px] tracking-tighter shrink-0 font-mono font-bold ${visual.labelTextClass}`}
                    >
                      {ratingDots}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
};
