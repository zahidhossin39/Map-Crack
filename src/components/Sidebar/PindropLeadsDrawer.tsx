'use client';

import React, { useState, useEffect } from 'react';
import { BusinessPlace, LeadStatus } from '@/types/business';
import {
  isSocialPageOnly,
  isNoRealDomain,
  getAllLeadStatuses,
  getBusinessPinVisuals,
} from '@/lib/pindropUtils';
import { getAllSelectedIds, SELECTION_CHANGED_EVENT } from '@/lib/selection';
import { X, Download, Copy, Check, Sparkles, ExternalLink, Star, MapPin, Trash2 } from 'lucide-react';

interface PindropLeadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: BusinessPlace[];
  selectedBusinessId?: string | null;
  onBusinessSelect: (b: BusinessPlace) => void;
  onExportSelected: () => void;
  onExportLeads: () => void;
  onExportAll: () => void;
  onClearAll: () => void;
  onCopyClipboard: () => void;
  copied: boolean;
}

export const PindropLeadsDrawer: React.FC<PindropLeadsDrawerProps> = ({
  isOpen,
  onClose,
  businesses,
  selectedBusinessId,
  onBusinessSelect,
  onExportSelected,
  onExportLeads,
  onExportAll,
  onClearAll,
  onCopyClipboard,
  copied,
}) => {
  const [leadStatuses, setLeadStatuses] = useState<Record<string, LeadStatus>>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, true>>({});

  // Keep pipeline badges and stars in sync with changes made elsewhere (map, detail modal).
  useEffect(() => {
    const sync = () => {
      setLeadStatuses(getAllLeadStatuses());
      setSelectedIds(getAllSelectedIds());
    };
    sync();
    window.addEventListener('pindrop_lead_status_changed', sync);
    window.addEventListener(SELECTION_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('pindrop_lead_status_changed', sync);
      window.removeEventListener(SELECTION_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (!isOpen) return null;

  const noWebsiteList = businesses.filter((b) => !b.hasWebsite || !b.websiteURI);
  const socialOnlyList = businesses.filter((b) => isSocialPageOnly(b.websiteURI));
  const noDomainList = businesses.filter((b) => isNoRealDomain(b.websiteURI));
  // Must match isLead in page.tsx, or these counts would disagree with what exports.
  const opportunities = [...noWebsiteList, ...socialOnlyList, ...noDomainList];
  const selectedCount = businesses.filter((b) => selectedIds[b.id]).length;

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
            {noWebsiteList.length} no website • {socialOnlyList.length} social only ({businesses.length} total)
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
            onClick={onExportLeads}
            className="p-2 rounded-xl text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-xs font-semibold flex items-center gap-1"
            title="Export leads CSV"
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

      {/* Export Action Strip — three explicit scopes */}
      <div className="p-3 bg-amber-50 border-b border-amber-100 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-900 truncate">
              {selectedCount} selected • {opportunities.length} leads • {businesses.length} total
            </span>
          </div>
          <button
            onClick={onClearAll}
            disabled={businesses.length === 0}
            className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Clear all collected results and start a fresh sweep"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={onExportSelected}
            disabled={selectedCount === 0}
            className="px-2 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer"
            title="Export only the businesses you starred"
          >
            Selected ({selectedCount})
          </button>
          <button
            onClick={onExportLeads}
            disabled={opportunities.length === 0}
            className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer"
            title="Export every lead: no website, social page only, or no real domain"
          >
            Leads ({opportunities.length})
          </button>
          <button
            onClick={onExportAll}
            disabled={businesses.length === 0}
            className="px-2 py-1.5 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 border border-slate-300 font-bold text-[11px] shadow-sm transition-all cursor-pointer"
            title="Export everything currently on screen"
          >
            All ({businesses.length})
          </button>
        </div>
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
            const leadStatus = leadStatuses[b.id] || 'none';
            const visual = getBusinessPinVisuals(b, leadStatus);
            const isSelected = selectedBusinessId === b.id;

            return (
              <div
                key={b.id}
                onClick={() => onBusinessSelect(b)}
                className={`pt-2.5 p-2.5 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20'
                    : visual.category === 'no_website'
                    ? 'bg-amber-50/40 border-amber-200/80 hover:bg-amber-50'
                    : visual.category === 'social_page_only'
                    ? 'bg-pink-50/40 border-pink-200/80 hover:bg-pink-50'
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words">
                        {b.name}
                      </h4>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide border ${visual.badgeClass}`}>
                        {visual.badgeText}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1 leading-snug break-words">
                      {b.formattedAddress}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600 flex-wrap">
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
                        <span className="text-emerald-700 font-medium font-mono text-[11px]">
                          📞 {b.nationalPhoneNumber}
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
