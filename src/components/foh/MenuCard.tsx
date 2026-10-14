'use client';

import React from 'react';
import { MenuItem, OrderChannel } from '@/types';
import { formatCurrencyVND } from '@/lib/utils';
import { Flame, Wine, Plus, SlidersHorizontal, ShoppingBag, Bike, Utensils } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  viewMode?: 'grid' | 'list';
  orderChannel?: OrderChannel;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  item,
  onSelect,
  viewMode = 'grid',
  orderChannel = 'dine_in',
}) => {
  const hasModifiers = item.modifiers && item.modifiers.length > 0;

  // Determine active channel price
  const activePrice =
    orderChannel === 'takeaway'
      ? item.takeaway_price || item.price
      : orderChannel === 'delivery'
      ? item.delivery_price || item.price
      : item.price;

  const channelLabel =
    orderChannel === 'takeaway' ? 'Mang Về' : orderChannel === 'delivery' ? 'App Giao Hàng' : 'Tại Bàn';

  return (
    <>
      {/* 1. MOBILE COMPACT HORIZONTAL CARD (md:hidden) - Hiển thị 7-8 món/màn hình */}
      <div
        onClick={() => item.is_available && onSelect(item)}
        className={`md:hidden flex items-center gap-3 p-2.5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs transition-all active:scale-[0.99] ${
          item.is_available ? 'cursor-pointer hover:border-amber-500/40' : 'opacity-60 cursor-not-allowed'
        }`}
      >
        {/* Left Thumbnail (w-16 h-16 rounded-xl) */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />

          {/* Tiny Station Badge */}
          <span
            className={`absolute top-1 left-1 px-1 py-0.2 rounded text-[8px] font-black uppercase text-white shadow-xs ${
              item.station === 'kitchen' ? 'bg-orange-500/90' : 'bg-cyan-600/90'
            }`}
          >
            {item.station === 'kitchen' ? 'Bếp' : 'Bar'}
          </span>

          {!item.is_available && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-[8px] font-black text-white px-1 py-0.2 rounded bg-red-600">
                Hết
              </span>
            </div>
          )}
        </div>

        {/* Center Content: Name & Multi-Channel Pricing */}
        <div className="flex-1 min-w-0 pr-1 space-y-0.5">
          <div className="flex items-center gap-1">
            <h3 className="font-extrabold text-xs text-stone-900 dark:text-stone-100 truncate leading-tight">
              {item.name}
            </h3>
          </div>

          {/* Main Channel Price */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">
              {formatCurrencyVND(activePrice)}
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              {channelLabel}
            </span>
          </div>

          {/* Other Channels Comparison Line */}
          <div className="text-[9px] text-stone-400 font-mono truncate flex items-center gap-1.5 pt-0.5">
            {orderChannel !== 'takeaway' && item.takeaway_price && (
              <span>MV: {formatCurrencyVND(item.takeaway_price)}</span>
            )}
            {orderChannel !== 'takeaway' && item.takeaway_price && orderChannel !== 'delivery' && item.delivery_price && (
              <span>•</span>
            )}
            {orderChannel !== 'delivery' && item.delivery_price && (
              <span>App: {formatCurrencyVND(item.delivery_price)}</span>
            )}
            {orderChannel !== 'dine_in' && (
              <span>Quán: {formatCurrencyVND(item.price)}</span>
            )}
          </div>
        </div>

        {/* Right Add (+) Button */}
        <button
          type="button"
          disabled={!item.is_available}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-xs shrink-0 active:scale-95 ${
            item.is_available
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
              : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
          }`}
          aria-label="Thêm món"
        >
          {hasModifiers ? <SlidersHorizontal className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. DESKTOP BENTO CARD (hidden md:flex) */}
      <div
        onClick={() => item.is_available && onSelect(item)}
        className={`hidden md:flex group relative flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-amber-500/40 transition-all duration-300 ${
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
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-xs ${
                item.station === 'kitchen' ? 'bg-orange-500/90 text-white' : 'bg-cyan-600/90 text-white'
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
                <span>Tùy biến</span>
              </span>
            ) : null}
          </div>

          {/* Channel Price Badge Overlay */}
          <div className="absolute bottom-2 left-2 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-black/70 text-white backdrop-blur-md border border-white/20">
              {orderChannel === 'takeaway' ? (
                <ShoppingBag className="w-3 h-3 text-cyan-400" />
              ) : orderChannel === 'delivery' ? (
                <Bike className="w-3 h-3 text-emerald-400" />
              ) : (
                <Utensils className="w-3 h-3 text-amber-400" />
              )}
              <span>{channelLabel}</span>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 justify-between">
          <div>
            <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {item.name}
            </h3>
            {item.description && (
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>

          {/* Multi-Channel Pricing Comparison Pills */}
          <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                {formatCurrencyVND(activePrice)}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-stone-400 font-mono mt-0.5">
                {orderChannel !== 'dine_in' && (
                  <span>Tại quán: {formatCurrencyVND(item.price)}</span>
                )}
                {orderChannel !== 'takeaway' && item.takeaway_price && (
                  <span>MV: {formatCurrencyVND(item.takeaway_price)}</span>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={!item.is_available}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all shadow-xs shrink-0 ${
                item.is_available
                  ? 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-amber-500/20'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
              }`}
              aria-label="Thêm món"
            >
              {hasModifiers ? <SlidersHorizontal className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
