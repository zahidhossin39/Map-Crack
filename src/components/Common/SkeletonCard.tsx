import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40 backdrop-blur-md animate-pulse space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-700/70 rounded-md w-3/4"></div>
          <div className="h-3 bg-slate-700/50 rounded-md w-1/2"></div>
        </div>
        <div className="h-5 bg-slate-700/60 rounded-full w-20"></div>
      </div>
      <div className="h-3 bg-slate-700/40 rounded-md w-5/6"></div>
      <div className="flex items-center gap-2 pt-1">
        <div className="h-6 bg-slate-700/50 rounded-lg w-16"></div>
        <div className="h-6 bg-slate-700/40 rounded-lg w-20"></div>
      </div>
    </div>
  );
};
