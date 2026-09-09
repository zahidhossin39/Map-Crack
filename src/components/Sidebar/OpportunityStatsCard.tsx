'use client';

import React from 'react';
import { Sparkles, Download, Copy, Check, TrendingUp, HelpCircle } from 'lucide-react';
import { BusinessPlace } from '@/types/business';

interface OpportunityStatsCardProps {
  businesses: BusinessPlace[];
  onExportCSV: () => void;
  onCopyClipboard: () => void;
  copied: boolean;
}

export const OpportunityStatsCard: React.FC<OpportunityStatsCardProps> = ({
  businesses,
  onExportCSV,
  onCopyClipboard,
  copied,
}) => {
  const total = businesses.length;
  const opportunities = businesses.filter((b) => !b.hasWebsite);
  const oppCount = opportunities.length;
  const oppPercentage = total > 0 ? Math.round((oppCount / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-opportunity-950/40 border border-opportunity-500/30 shadow-glass backdrop-blur-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-opportunity-500/20 text-opportunity-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Prospecting Intel
            </h4>
            <p className="text-[11px] text-slate-400">
              Web development & marketing targets
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg font-black text-opportunity-400">{oppCount}</span>
          <span className="text-xs text-slate-400"> / {total}</span>
        </div>
      </div>

      {/* Progress / Opportunity Ratio */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-300 font-medium">Opportunity Density</span>
          <span className="text-opportunity-300 font-bold">{oppPercentage}% No Website</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-opportunity-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${oppPercentage}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onExportCSV}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export CSV</span>
        </button>

        <button
          onClick={onCopyClipboard}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-opportunity-600 to-amber-600 hover:from-opportunity-500 hover:to-amber-500 text-white text-xs font-semibold shadow-md shadow-opportunity-600/20 transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Leads</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
