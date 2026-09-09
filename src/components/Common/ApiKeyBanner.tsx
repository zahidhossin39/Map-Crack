'use client';

import React, { useState } from 'react';
import { Key, AlertTriangle, CheckCircle2, ExternalLink, X, ChevronRight, HelpCircle } from 'lucide-react';

interface ApiKeyBannerProps {
  currentKey: string;
  onKeyChange: (newKey: string) => void;
}

export const ApiKeyBanner: React.FC<ApiKeyBannerProps> = ({ currentKey, onKeyChange }) => {
  const [isOpen, setIsOpen] = useState(!currentKey);
  const [tempKey, setTempKey] = useState(currentKey);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempKey.trim()) {
      onKeyChange(tempKey.trim());
      setIsOpen(false);
    }
  };

  if (!isOpen && currentKey) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-glass backdrop-blur-md text-xs font-medium transition-all"
        title="Google Maps API Key Settings"
      >
        <Key className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">API Key: Active</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      </button>
    );
  }

  return (
    <div className="fixed inset-x-4 top-4 md:inset-x-auto md:right-4 md:max-w-md z-50 animate-in fade-in slide-in-from-top duration-300">
      <div className="rounded-2xl bg-slate-900/95 border border-slate-700/90 shadow-2xl p-4 md:p-5 backdrop-blur-xl text-white">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${currentKey ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                Google Maps API Setup
                {currentKey ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Key Required
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Live Places API search & opportunity finder
              </p>
            </div>
          </div>
          {currentKey && (
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              API Key (or set <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>)
            </label>
            <input
              type="text"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!tempKey.trim()}
              className="flex-1 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Save & Apply Key</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="How to get an API Key"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </form>

        {showInstructions && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs space-y-2 text-slate-300 animate-in fade-in">
            <p className="font-semibold text-slate-200">Required Google Cloud APIs:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li><strong className="text-slate-200">Maps JavaScript API</strong> (Interactive map & pins)</li>
              <li><strong className="text-slate-200">Places API (New)</strong> (Live nearby business search)</li>
            </ul>
            <div className="pt-1 flex items-center justify-between">
              <a
                href="https://console.cloud.google.com/google/maps-apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                Get Key in Google Cloud <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://mapsplatform.google.com/maps-demo-key"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 hover:underline"
              >
                Maps Demo Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
