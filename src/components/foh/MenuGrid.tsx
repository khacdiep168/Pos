'use client';

import React from 'react';
import { MenuItem } from '@/types';
import { MenuCard } from './MenuCard';
import { UtensilsCrossed } from 'lucide-react';

interface MenuGridProps {
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ items, onSelectItem }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
        <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 mb-3">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h4 className="font-bold text-stone-800 dark:text-stone-200 text-base">
          Không tìm thấy món ăn nào
        </h4>
        <p className="text-xs text-stone-400 mt-1 max-w-xs">
          Thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác để xem thực đơn.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <MenuCard key={item.id} item={item} onSelect={onSelectItem} />
      ))}
    </div>
  );
};
