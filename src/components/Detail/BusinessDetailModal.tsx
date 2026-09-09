'use client';

import React, { useState } from 'react';
import { BusinessPlace } from '@/types/business';
import {
  X,
  Sparkles,
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  Star,
  Clock,
  Navigation,
  Copy,
  Check,
  Share2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface BusinessDetailModalProps {
  business: BusinessPlace | null;
  onClose: () => void;
}

export const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({
  business,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!business) return null;

  const isOpportunity = !business.hasWebsite;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Extract photo URL if available
  let photoUrl: string | null = null;
  if (business.photos && business.photos.length > 0) {
    const firstPhoto = business.photos[0];
    if (typeof firstPhoto.getURI === 'function') {
      try {
        photoUrl = firstPhoto.getURI({ maxWidth: 800, maxHeight: 500 });
      } catch (e) {
        // fallback
      }
    } else if (firstPhoto.url) {
      photoUrl = firstPhoto.url;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Photo or Gradient Banner */}
        <div className="relative h-44 sm:h-52 w-full bg-slate-800 shrink-0 overflow-hidden">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 text-center">
              <div className="space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                  <MapPin className="w-6 h-6 text-brand-400" />
                </div>
                <p className="text-xs text-slate-400 font-medium">Local Business Profile</p>
              </div>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700 backdrop-blur-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Status Overlay Badge */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            {isOpportunity ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-opportunity-600/90 text-white font-extrabold text-xs shadow-glow-opportunity backdrop-blur-md border border-opportunity-400">
                <Sparkles className="w-3.5 h-3.5 fill-amber-200" />
                <span>HIGH OPPORTUNITY: NO WEBSITE</span>
              </div>
            ) : (
              <a
                href={business.websiteURI || '#'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 backdrop-blur-md"
              >
                <Globe className="w-3.5 h-3.5 text-brand-400" />
                <span>Visit Website</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}

            {business.rating && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 text-amber-400 font-bold text-xs border border-slate-700 backdrop-blur-md">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{business.rating.toFixed(1)}</span>
                <span className="text-slate-400 font-normal">
                  ({business.userRatingCount || 0})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Title and Category */}
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{business.name}</h2>
            <p className="text-xs font-semibold text-brand-400 mt-1 uppercase tracking-wider">
              {business.primaryTypeDisplayName || business.primaryType?.replace(/_/g, ' ') || 'Local Business'}
            </p>
          </div>

          {/* Opportunity Pitch Banner */}
          {isOpportunity && (
            <div className="p-4 rounded-2xl bg-opportunity-950/50 border border-opportunity-500/40 text-xs space-y-2">
              <div className="flex items-center gap-2 text-opportunity-300 font-bold">
                <Sparkles className="w-4 h-4 text-opportunity-400" />
                <span>Pitch Prospect Opportunity</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                This business is actively listed on Google Maps with customer reviews, but has no official website URL linked. Ideal target for custom web design, SEO, or online ordering solutions.
              </p>
            </div>
          )}

          {/* Key Details List */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            {/* Address */}
            {business.formattedAddress && (
              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5 text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{business.formattedAddress}</span>
                </div>
                <button
                  onClick={() => handleCopy(business.formattedAddress!, 'address')}
                  className="text-slate-400 hover:text-white shrink-0 p-1"
                  title="Copy address"
                >
                  {copiedField === 'address' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}

            {/* Phone */}
            {business.nationalPhoneNumber && (
              <div className="flex items-center justify-between gap-3 text-xs pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                  <a
                    href={`tel:${business.nationalPhoneNumber}`}
                    className="hover:text-brand-300 hover:underline font-mono"
                  >
                    {business.nationalPhoneNumber}
                  </a>
                </div>
                <button
                  onClick={() => handleCopy(business.nationalPhoneNumber!, 'phone')}
                  className="text-slate-400 hover:text-white shrink-0 p-1"
                  title="Copy phone"
                >
                  {copiedField === 'phone' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}

            {/* Website or Opportunity note */}
            <div className="flex items-center justify-between gap-3 text-xs pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                {business.websiteURI ? (
                  <a
                    href={business.websiteURI}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300 hover:underline truncate max-w-[260px]"
                  >
                    {business.websiteURI}
                  </a>
                ) : (
                  <span className="text-opportunity-400 font-bold">
                    No Website Listed (Opportunity)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Opening Hours if available */}
          {business.regularOpeningHours?.weekdayDescriptions && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
                <span>Opening Hours</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
                {business.regularOpeningHours.weekdayDescriptions.map((desc: string, idx: number) => (
                  <p key={idx} className="text-slate-300 flex justify-between">
                    <span>{desc}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {business.nationalPhoneNumber && (
              <a
                href={`tel:${business.nationalPhoneNumber}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>Call Business</span>
              </a>
            )}

            {business.googleMapsURI && (
              <a
                href={business.googleMapsURI}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all"
              >
                <Navigation className="w-4 h-4 text-brand-400" />
                <span>Google Maps</span>
              </a>
            )}
          </div>
        </div>

        {/* Modal Legal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Place data via Google Places API (New)</span>
          <span className="font-semibold text-slate-400">Google Maps</span>
        </div>
      </div>
    </div>
  );
};
