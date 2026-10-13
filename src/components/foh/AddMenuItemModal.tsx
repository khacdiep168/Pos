'use client';

import React, { useState } from 'react';
import { Category, StationType, MenuItem } from '@/types';
import { menuService } from '@/services/menuService';
import { X, Plus, Utensils, Sparkles, Image as ImageIcon } from 'lucide-react';

interface AddMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onItemAdded?: (item: MenuItem) => void;
}

const PRESET_IMAGES = [
  {
    name: 'Cơm Chiên Hải Sản',
    url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Mì Trộn Xá Xíu',
    url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Sinh Tố Bơ Dừa',
    url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Cocktail Nhiệt Đới',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Soup Nấm Bào Ngư',
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Bánh Mousse Socola',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
  },
];

export const AddMenuItemModal: React.FC<AddMenuItemModalProps> = ({
  isOpen,
  onClose,
  categories,
  onItemAdded,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-food');
  const [price, setPrice] = useState('');
  const [station, setStation] = useState<StationType>('kitchen');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên món ăn/thức uống!');
      return;
    }

    const numPrice = parseFloat(price.replace(/\D/g, ''));
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Vui lòng nhập giá bán hợp lệ (> 0đ)!');
      return;
    }

    const newItem = menuService.addMenuItem({
      name: name.trim(),
      category_id: categoryId,
      price: numPrice,
      station,
      description: description.trim() || undefined,
      image_url: imageUrl.trim() || PRESET_IMAGES[0].url,
      is_available: true,
    });

    if (onItemAdded) {
      onItemAdded(newItem);
    }

    // Reset form
    setName('');
    setPrice('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                Thêm Món Mới Vào Thực Đơn
              </h3>
              <p className="text-xs text-stone-400">
                Món mới sẽ đồng bộ ngay lập tức sang FOH, KDS và Quản trị Kho ERP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* Tên món */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Tên món ăn / Đồ uống *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="VD: Cơm Chiên Bò Wagyu Kim Chi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Danh mục & Trạm chế biến */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Danh mục thực đơn *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Trạm chế biến (KDS) *
              </label>
              <select
                value={station}
                onChange={(e) => setStation(e.target.value as StationType)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="kitchen">🍲 Bếp (Kitchen / Food)</option>
                <option value="bar">🍹 Quầy Bar (Bar / Drink)</option>
              </select>
            </div>
          </div>

          {/* Giá bán */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Giá bán (VNĐ) *
            </label>
            <div className="relative">
              <input
                type="text"
                value={price}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPrice(val ? parseInt(val, 10).toLocaleString('vi-VN') : '');
                  setError('');
                }}
                placeholder="VD: 85.000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden pr-12"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                VNĐ
              </span>
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Mô tả thành phần / Hương vị (Tùy chọn)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Cơm dẻo chiên giòn, thịt bò mềm sốt cay nhẹ kèm kim chi truyền thống..."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-normal focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Hình ảnh */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center justify-between">
              <span>Hình ảnh món ăn</span>
              <span className="text-[10px] text-stone-400 font-normal">
                Dán URL hoặc chọn mẫu bên dưới
              </span>
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-mono mb-2 focus:outline-hidden"
            />

            {/* Ảnh mẫu chọn nhanh */}
            <div className="grid grid-cols-3 gap-2">
              {PRESET_IMAGES.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setImageUrl(img.url)}
                  className={`relative rounded-lg overflow-hidden border-2 h-14 group transition-all ${
                    imageUrl === img.url
                      ? 'border-amber-500 ring-2 ring-amber-500/30'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] text-white truncate px-1 py-0.5 text-center">
                    {img.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Xác Nhận Thêm Món</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
