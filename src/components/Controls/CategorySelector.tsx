'use client';

import React from 'react';
import { CATEGORIES } from '@/lib/constants';
import { CategoryKey } from '@/types/business';
import {
  Grid,
  Utensils,
  Coffee,
  ShoppingBag,
  Wrench,
  HeartPulse,
  Sparkles,
  Car,
  Hotel,
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Grid,
  Utensils,
  Coffee,
  ShoppingBag,
  Wrench,
  HeartPulse,
  Sparkles,
  Car,
  Hotel,
};

interface CategorySelectorProps {
  selectedCategory: CategoryKey;
  onCategoryChange: (category: CategoryKey) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat.key;
        const IconComponent = (cat.icon && ICON_MAP[cat.icon]) || Grid;

        return (
          <button
            key={cat.key}
            onClick={() => onCategoryChange(cat.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border backdrop-blur-xl ${
              isSelected
                ? 'bg-slate-100 text-slate-950 border-white shadow-md shadow-white/10'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white hover:border-slate-600'
            }`}
          >
            <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
