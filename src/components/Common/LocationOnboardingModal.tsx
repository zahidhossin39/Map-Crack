'use client';

import React from 'react';
import { MapPin, X } from 'lucide-react';

interface LocationOnboardingModalProps {
  isOpen: boolean;
  onUseLocation: () => void;
  onSearchByAddress: () => void;
  isLocating?: boolean;
}

export const LocationOnboardingModal: React.FC<LocationOnboardingModalProps> = ({
  isOpen,
  onUseLocation,
  onSearchByAddress,
  isLocating,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onSearchByAddress}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-right close button */}
        <button
          onClick={onSearchByAddress}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Mint Pin Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-5">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shadow-sm">
            <MapPin className="w-5 h-5 text-white fill-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2.5">
          Find businesses in your area
        </h2>

        {/* Description */}
        <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto mb-6">
          Pindrop uses your location to show the businesses near you that still need a website.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onUseLocation}
            disabled={isLocating}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLocating ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <span>Use my location</span>
            )}
          </button>

          <div>
            <button
              onClick={onSearchByAddress}
              className="text-xs sm:text-sm text-slate-500 hover:text-slate-800 font-medium underline underline-offset-4 transition-colors py-1.5"
            >
              Not now, I&apos;ll search by address
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
