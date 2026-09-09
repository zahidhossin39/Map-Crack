'use client';

import React from 'react';
import { BusinessPlace } from '@/types/business';
import { X, Download, Copy, Check, Sparkles, ExternalLink, Phone, Star, MapPin, Globe } from 'lucide-react';

interface PindropLeadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: BusinessPlace[];
  selectedBusinessId?: string | null;
  onBusinessSelect: (b: BusinessPlace) => void;
  onExportCSV: () => void;
  onCopyClipboard: () => void;
  copied: boolean;
}

export const PindropLeadsDrawer: React.FC<PindropLeadsDrawerProps> = ({
  isOpen,
  onClose,
  businesses,
  selectedBusinessId,
  onBusinessSelect,
  onExportCSV,
  onCopyClipboard,
  copied,
}) => {
  if (!isOpen) return null;

  const opportunities = businesses.filter((b) => !b.hasWebsite);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-full sm:w-96 bg-white shadow-2xl border-r border-slate-200 flex flex-col animate-in slide-in-from-left duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h3 className="font-bold text-slate-900 text-base">Prospect Leads</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {opportunities.length} no-website opportunities ({businesses.length} total)
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onCopyClipboard}
            className="p-2 rounded-xl text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-xs font-semibold flex items-center gap-1"
            title="Copy leads"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onExportCSV}
            className="p-2 rounded-xl text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-xs font-semibold flex items-center gap-1"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Export Action Strip */}
      <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold text-amber-900">
            {opportunities.length} High-Value Targets
          </span>
        </div>
        <button
          onClick={onExportCSV}
          className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all"
        >
          Export CSV
        </button>
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100">
        {businesses.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No businesses found</p>
            <p className="text-xs text-slate-400 mt-1">
              Drop a pin in a populated commercial area and click &quot;Search this spot&quot;.
            </p>
          </div>
        ) : (
          businesses.map((b) => {
            const isOpportunity = !b.hasWebsite;
            const isSelected = selectedBusinessId === b.id;

            return (
              <div
                key={b.id}
                onClick={() => onBusinessSelect(b)}
                className={`pt-2.5 p-2.5 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20'
                    : isOpportunity
                    ? 'bg-amber-50/40 border-amber-200/80 hover:bg-amber-50'
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {b.name}
                      </h4>
                      {isOpportunity && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold tracking-wide">
                          OPPORTUNITY
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {b.formattedAddress}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600">
                      {b.rating && (
                        <span className="flex items-center gap-1 font-semibold text-amber-600">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{b.rating.toFixed(1)}</span>
                          {b.userRatingCount ? (
                            <span className="text-slate-400">({b.userRatingCount})</span>
                          ) : null}
                        </span>
                      )}

                      {b.distanceMeters !== undefined && (
                        <span className="text-slate-400">
                          {b.distanceMeters < 1000
                            ? `${Math.round(b.distanceMeters)}m`
                            : `${(b.distanceMeters / 1000).toFixed(1)}km`}
                        </span>
                      )}

                      {b.nationalPhoneNumber && (
                        <span className="hidden sm:inline text-slate-500 truncate">
                          {b.nationalPhoneNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-slate-400 mt-1">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
