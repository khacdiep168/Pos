'use client';

import React from 'react';
import { MenuItem } from '@/types';
import { formatCurrencyVND } from '@/lib/utils';
import { Flame, Wine, Plus, SlidersHorizontal } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onSelect }) => {
  const hasModifiers = item.modifiers && item.modifiers.length > 0;

  return (
    <div
      onClick={() => item.is_available && onSelect(item)}
      className={`group relative flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-amber-500/40 transition-all duration-300 ${
        item.is_available ? 'cursor-pointer hover:-translate-y-1' : 'opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Image Container with Badges */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
        <img
          src={item.image_url}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {/* Station Badge (Kitchen or Bar) */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-xs ${
              item.station === 'kitchen'
                ? 'bg-orange-500/90 text-white'
                : 'bg-cyan-600/90 text-white'
            }`}
          >
            {item.station === 'kitchen' ? (
              <>
                <Flame className="w-3 h-3" />
                <span>Bếp</span>
              </>
            ) : (
              <>
                <Wine className="w-3 h-3" />
                <span>Quầy Bar</span>
              </>
            )}
          </span>

          {/* Availability Badge */}
          {!item.is_available ? (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-600/90 text-white backdrop-blur-md">
              Hết món
            </span>
          ) : hasModifiers ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/60 text-white backdrop-blur-md">
              <SlidersHorizontal className="w-2.5 h-2.5" />
              Tùy biến
            </span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-base line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {item.name}
          </h3>
          {item.description && (
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Price & Add Button */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-stone-400 font-medium uppercase tracking-wider">Đơn giá</span>
            <span className="text-base font-bold text-amber-600 dark:text-amber-400">
              {formatCurrencyVND(item.price)}
            </span>
          </div>

          <button
            type="button"
            disabled={!item.is_available}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all shadow-xs ${
              item.is_available
                ? 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
            }`}
            aria-label="Thêm món"
          >
            {hasModifiers ? <SlidersHorizontal className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
