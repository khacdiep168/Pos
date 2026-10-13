'use client';

import React from 'react';
import { Category, StationType } from '@/types';
import { Search, UtensilsCrossed, Wine, Flame, Sparkles } from 'lucide-react';

interface CategoryNavProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStation: StationType | 'all';
  onStationChange: (station: StationType | 'all') => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedStation,
  onStationChange,
}) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Top Filter Bar: Search + Station Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm món ăn, đồ uống, khai vị..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded-md"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Station Tabs (All, Kitchen, Bar) */}
        <div className="inline-flex p-1 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 self-start sm:self-auto">
          <button
            onClick={() => onStationChange('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedStation === 'all'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-semibold'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Tất cả
          </button>
          <button
            onClick={() => onStationChange('kitchen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedStation === 'kitchen'
                ? 'bg-orange-500 text-white shadow-xs font-semibold'
                : 'text-stone-500 hover:text-orange-600 dark:hover:text-orange-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Bếp
          </button>
          <button
            onClick={() => onStationChange('bar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedStation === 'bar'
                ? 'bg-cyan-600 text-white shadow-xs font-semibold'
                : 'text-stone-500 hover:text-cyan-600 dark:hover:text-cyan-400'
            }`}
          >
            <Wine className="w-3.5 h-3.5" />
            Quầy Bar
          </button>
        </div>
      </div>

      {/* Category Horizontal Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
            selectedCategoryId === null
              ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:border-amber-500 dark:text-stone-950 shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Tất cả danh mục</span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-amber-500/40'
              }`}
            >
              <span>{cat.icon || '🍽️'}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
