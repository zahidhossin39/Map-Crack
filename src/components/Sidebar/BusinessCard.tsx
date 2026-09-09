'use client';

import React from 'react';
import { BusinessPlace } from '@/types/business';
import {
  Star,
  Sparkles,
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  ChevronRight,
  Navigation,
} from 'lucide-react';

interface BusinessCardProps {
  business: BusinessPlace;
  isSelected?: boolean;
  isHovered?: boolean;
  onSelect: (business: BusinessPlace) => void;
  onHover: (id: string | null) => void;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}) => {
  const isOpportunity = !business.hasWebsite;

  const formatDistance = (meters?: number) => {
    if (!meters) return null;
    if (meters < 1000) {
      return `${Math.round(meters)}m away`;
    }
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  return (
    <div
      onClick={() => onSelect(business)}
      onMouseEnter={() => onHover(business.id)}
      onMouseLeave={() => onHover(null)}
      className={`relative p-4 rounded-2xl transition-all duration-200 cursor-pointer border text-left ${
        isSelected
          ? 'bg-slate-800/95 border-brand-500 shadow-xl shadow-brand-500/10 ring-1 ring-brand-500'
          : isHovered
          ? 'bg-slate-800/80 border-slate-600 shadow-lg'
          : isOpportunity
          ? 'bg-slate-900/80 border-opportunity-500/30 hover:border-opportunity-500/60 hover:bg-slate-800/60'
          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
      }`}
    >
      {/* Top row: Name and Opportunity / Website Badge */}
      <div className="flex items-start justify-between gap-2.5 mb-1.5">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-slate-100 group-hover:text-white truncate">
            {business.name}
          </h3>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {business.primaryTypeDisplayName || business.primaryType?.replace(/_/g, ' ') || 'Local Business'}
          </p>
        </div>

        {isOpportunity ? (
          <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-opportunity-500/20 to-amber-500/20 border border-opportunity-500/40 text-opportunity-300 text-[10px] font-extrabold shadow-sm">
            <Sparkles className="w-3 h-3 text-opportunity-400 animate-pulse" />
            <span>NO WEBSITE</span>
          </div>
        ) : (
          <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-medium">
            <Globe className="w-3 h-3 text-slate-400" />
            <span>Website</span>
          </div>
        )}
      </div>

      {/* Ratings and Distance */}
      <div className="flex items-center gap-3 text-xs text-slate-300 mb-2.5">
        {business.rating ? (
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{business.rating.toFixed(1)}</span>
            <span className="text-slate-400 font-normal text-[11px]">
              ({business.userRatingCount || 0})
            </span>
          </div>
        ) : (
          <span className="text-slate-500 text-[11px]">No reviews yet</span>
        )}

        {business.distanceMeters !== undefined && (
          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
            <Navigation className="w-3 h-3 text-brand-400" />
            <span>{formatDistance(business.distanceMeters)}</span>
          </div>
        )}
      </div>

      {/* Address */}
      {business.formattedAddress && (
        <div className="flex items-start gap-1.5 text-xs text-slate-400 mb-2">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{business.formattedAddress}</span>
        </div>
      )}

      {/* Action footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          {business.nationalPhoneNumber && (
            <a
              href={`tel:${business.nationalPhoneNumber}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 hover:underline font-medium"
            >
              <Phone className="w-3 h-3" />
              <span>{business.nationalPhoneNumber}</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium group-hover:text-slate-200">
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
