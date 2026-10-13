'use client';

import React, { useState } from 'react';
import { MenuItem, Category } from '@/types';
import { menuService } from '@/services/menuService';
import { formatCurrencyVND } from '@/lib/utils';
import { AddMenuItemModal } from './AddMenuItemModal';
import { EditMenuItemModal } from './EditMenuItemModal';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Flame,
  Wine,
  Search,
  Pencil,
} from 'lucide-react';

interface MenuTabProps {
  onRefresh?: () => void;
}

export const MenuTab: React.FC<MenuTabProps> = ({ onRefresh }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => menuService.getMenuItems());
  const [categories] = useState<Category[]>(() => menuService.getCategories());
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const refreshList = () => {
    setMenuItems(menuService.getMenuItems());
    if (onRefresh) onRefresh();
  };

  const handleToggleAvailable = (id: string, current: boolean) => {
    menuService.updateMenuItem(id, { is_available: !current });
    refreshList();
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa món này khỏi thực đơn?')) {
      menuService.deleteMenuItem(id);
      refreshList();
    }
  };

  const filteredItems = menuItems.filter((item) => {
    if (selectedCat !== 'all' && item.category_id !== selectedCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <span>Quản Lý Thực Đơn & Món Ăn</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
              {menuItems.length} món
            </span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Thêm mới món ăn, tùy chỉnh giá bán, bật/tắt trạng thái món và phân luồng trạm KDS
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Món Mới</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm món ăn, đồ uống theo tên..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              selectedCat === 'all'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-purple-400'
            }`}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedCat === c.id
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-purple-400'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850/50 text-stone-500 dark:text-stone-400 font-bold">
                <th className="p-3.5">Món Ăn</th>
                <th className="p-3.5">Danh Mục</th>
                <th className="p-3.5">Trạm KDS</th>
                <th className="p-3.5">Giá Bán</th>
                <th className="p-3.5 text-center">Trạng Thái</th>
                <th className="p-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">
                    Không tìm thấy món ăn nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const cat = categories.find((c) => c.id === item.category_id);
                  const isFood = item.station === 'kitchen';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-stone-50/50 dark:hover:bg-stone-850/30 transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-stone-200 dark:border-stone-700"
                          />
                          <div>
                            <div className="font-extrabold text-stone-900 dark:text-white">
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="text-[11px] text-stone-400 truncate max-w-xs">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-stone-600 dark:text-stone-300">
                        {cat ? `${cat.icon} ${cat.name}` : item.category_id}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            isFood
                              ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                              : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                          }`}
                        >
                          {isFood ? <Flame className="w-3 h-3" /> : <Wine className="w-3 h-3" />}
                          <span>{isFood ? 'Bếp (Kitchen)' : 'Quầy Bar (Bar)'}</span>
                        </span>
                      </td>
                      <td className="p-3.5 font-extrabold text-stone-900 dark:text-white">
                        {formatCurrencyVND(item.price)}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleAvailable(item.id, item.is_available)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                            item.is_available
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-stone-500/15 text-stone-500 dark:text-stone-400 border border-stone-500/30'
                          }`}
                          title="Click để đổi trạng thái"
                        >
                          {item.is_available ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Đang bán</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-stone-400" />
                              <span>Tạm ngưng</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors mr-1"
                          title="Sửa thông tin món & định mức BOM"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Xóa món"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      <AddMenuItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        onItemAdded={refreshList}
      />

      {/* Edit Item Modal */}
      <EditMenuItemModal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        categories={categories}
        onItemUpdated={refreshList}
      />
    </div>
  );
};
