'use client';

import React from 'react';
import { MenuItem } from '@/types';
import { formatCurrencyVND } from '@/lib/utils';
import { Flame, Wine, Plus, SlidersHorizontal } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  viewMode?: 'grid' | 'list';
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onSelect, viewMode = 'grid' }) => {
  const hasModifiers = item.modifiers && item.modifiers.length > 0;

  // COMPACT HORIZONTAL LAYOUT (Cho chế độ List hoặc Mobile Compact View)
  if (viewMode === 'list') {
    return (
      <div
        onClick={() => item.is_available && onSelect(item)}
        className={`group relative flex items-center gap-3 p-2.5 sm:p-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs hover:shadow-md hover:border-amber-500/40 transition-all duration-200 ${
          item.is_available ? 'cursor-pointer active:scale-[0.99]' : 'opacity-60 cursor-not-allowed'
        }`}
      >
        {/* Compact Square Thumbnail */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Station Badge (Tiny icon on corner) */}
          <span
            className={`absolute top-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold backdrop-blur-md shadow-2xs ${
              item.station === 'kitchen' ? 'bg-orange-500/90 text-white' : 'bg-cyan-600/90 text-white'
            }`}
          >
            {item.station === 'kitchen' ? 'Bếp' : 'Bar'}
          </span>

          {!item.is_available && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center">
              <span className="text-[9px] font-black text-white px-1 py-0.5 rounded bg-red-600">
                Hết
              </span>
            </div>
          )}
        </div>

        {/* Center Content: Name & Price */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 line-clamp-2 leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {item.name}
            </h3>
          </div>

          {hasModifiers && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-stone-400 mt-0.5">
              <SlidersHorizontal className="w-2.5 h-2.5" />
              <span>Tùy biến món</span>
            </span>
          )}

          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {formatCurrencyVND(item.price)}
            </span>
          </div>
        </div>

        {/* Quick Add Button (+) */}
        <button
          type="button"
          disabled={!item.is_available}
          className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all shadow-xs shrink-0 active:scale-95 ${
            item.is_available
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
              : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
          }`}
          aria-label="Thêm món"
        >
          {hasModifiers ? <SlidersHorizontal className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  // STANDARD / RESPONSIVE GRID LAYOUT
  // Trên mobile (< md) tự động chuyển sang layout compact 2 cột gọn gàng với ảnh nhỏ
  return (
    <div
      onClick={() => item.is_available && onSelect(item)}
      className={`group relative flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-amber-500/40 transition-all duration-300 ${
        item.is_available ? 'cursor-pointer hover:-translate-y-1' : 'opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Image Container with Badges (Gọn gàng trên Mobile) */}
      <div className="relative aspect-4/3 md:aspect-4/3 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
        <img
          src={item.image_url}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold backdrop-blur-md shadow-xs ${
              item.station === 'kitchen' ? 'bg-orange-500/90 text-white' : 'bg-cyan-600/90 text-white'
            }`}
          >
            {item.station === 'kitchen' ? (
              <>
                <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Bếp</span>
              </>
            ) : (
              <>
                <Wine className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Bar</span>
              </>
            )}
          </span>

          {!item.is_available ? (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-600/90 text-white backdrop-blur-md">
              Hết món
            </span>
          ) : hasModifiers ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white backdrop-blur-md">
              <SlidersHorizontal className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">Tùy biến</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-base line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {item.name}
          </h3>
          {item.description && (
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 line-clamp-1 sm:line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Price & Add Button */}
        <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider hidden sm:inline">Đơn giá</span>
            <span className="text-xs sm:text-base font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {formatCurrencyVND(item.price)}
            </span>
          </div>

          <button
            type="button"
            disabled={!item.is_available}
            className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all shadow-xs shrink-0 ${
              item.is_available
                ? 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-amber-500/20'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
            }`}
            aria-label="Thêm món"
          >
            {hasModifiers ? <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
