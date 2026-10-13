'use client';

import React, { useState, useRef } from 'react';
import { Category, StationType, MenuItem, RawMaterial } from '@/types';
import { menuService } from '@/services/menuService';
import { inventoryService } from '@/services/inventoryService';
import { formatCurrencyVND } from '@/lib/utils';
import {
  X,
  Plus,
  Utensils,
  Upload,
  Image as ImageIcon,
  Trash2,
  Boxes,
  Percent,
  Sparkles,
} from 'lucide-react';
import { SearchableSelect, SearchableOption } from '@/components/ui/SearchableSelect';

interface AddMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onItemAdded?: (item: MenuItem) => void;
}

const PRESET_IMAGES = [
  {
    name: 'Cơm Chiên',
    url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Mì Trộn',
    url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Sinh Tố Bơ',
    url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Cocktail',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Soup Nấm',
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Bánh Mousse',
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

  // Local File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // BOM Configuration State
  const [rawMaterials] = useState<RawMaterial[]>(() => inventoryService.getRawMaterials());
  const [bomItems, setBomItems] = useState<{ raw_material_id: string; quantity: number }[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState(rawMaterials[0]?.id || '');
  const [materialQty, setMaterialQty] = useState('');

  if (!isOpen) return null;

  // Handle local file upload with Base64 preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP)!');
        return;
      }
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
          setError('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add an ingredient to BOM draft
  const handleAddBomItem = () => {
    if (!selectedMaterialId) return;
    const qty = parseFloat(materialQty);
    if (isNaN(qty) || qty <= 0) {
      setError('Vui lòng nhập định mức nguyên liệu hợp lệ (> 0)!');
      return;
    }

    const existingIdx = bomItems.findIndex((b) => b.raw_material_id === selectedMaterialId);
    if (existingIdx > -1) {
      const updated = [...bomItems];
      updated[existingIdx].quantity += qty;
      setBomItems(updated);
    } else {
      setBomItems([...bomItems, { raw_material_id: selectedMaterialId, quantity: qty }]);
    }

    setMaterialQty('');
    setError('');
  };

  const handleRemoveBomItem = (materialId: string) => {
    setBomItems(bomItems.filter((b) => b.raw_material_id !== materialId));
  };

  // Calculate estimated COGS
  const estimatedCOGS = bomItems.reduce((sum, item) => {
    const mat = rawMaterials.find((m) => m.id === item.raw_material_id);
    return sum + (mat ? item.quantity * mat.avg_cost : 0);
  }, 0);

  const numPrice = parseFloat(price.replace(/\D/g, '')) || 0;
  const estimatedGrossProfit = numPrice - estimatedCOGS;
  const estimatedMargin = numPrice > 0 ? Math.round((estimatedGrossProfit / numPrice) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên món ăn/thức uống!');
      return;
    }

    if (numPrice <= 0) {
      setError('Vui lòng nhập giá bán hợp lệ (> 0đ)!');
      return;
    }

    // 1. Create Menu Item
    const newItem = menuService.addMenuItem({
      name: name.trim(),
      category_id: categoryId,
      price: numPrice,
      station,
      description: description.trim() || undefined,
      image_url: imageUrl.trim() || PRESET_IMAGES[0].url,
      is_available: true,
    });

    // 2. Save Recipe BOM for this new item if configured
    if (bomItems.length > 0) {
      inventoryService.saveRecipeBOM(newItem.id, bomItems);
    }

    if (onItemAdded) {
      onItemAdded(newItem);
    }

    // Reset form
    setName('');
    setPrice('');
    setDescription('');
    setBomItems([]);
    setError('');
    onClose();
  };

  const currentSelectedMaterial = rawMaterials.find((m) => m.id === selectedMaterialId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                Thêm Món Mới & Cấu Hình Định Mức BOM
              </h3>
              <p className="text-xs text-stone-400">
                Khai báo thông tin món, tải ảnh từ thiết bị và gắn công thức nguyên liệu tự trừ kho
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

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* Section 1: Thông tin cơ bản */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
              <span>1. Thông tin món ăn</span>
            </h4>

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
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Danh mục thực đơn *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-medium focus:outline-hidden"
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
                  Trạm KDS *
                </label>
                <select
                  value={station}
                  onChange={(e) => setStation(e.target.value as StationType)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-medium focus:outline-hidden"
                >
                  <option value="kitchen">🍲 Bếp (Kitchen / Food)</option>
                  <option value="bar">🍹 Quầy Bar (Bar / Drink)</option>
                </select>
              </div>

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
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold pr-12 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">
                    VNĐ
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Mô tả thành phần / Hương vị (Tùy chọn)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Thịt bò Wagyu áp chảo mềm mọng, xào cùng cơm dẻo kim chi cay nhẹ..."
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs focus:outline-hidden"
              />
            </div>
          </div>

          {/* Section 2: Hình ảnh (Upload File Cục Bộ + Preview) */}
          <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-stone-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              2. Hình ảnh món ăn (Chọn từ thiết bị / URL)
            </h4>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Image Preview Box */}
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 shrink-0 shadow-sm flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-stone-400" />
                )}
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono">
                  Preview
                </span>
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2.5 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Duyệt Ảnh Từ Thiết Bị (Local)</span>
                  </button>

                  {uploadedFileName && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-xs">
                      ✓ Đã tải: {uploadedFileName}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-stone-400">
                  Hoặc chọn nhanh ảnh mẫu chất lượng cao:
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {PRESET_IMAGES.map((img, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => {
                        setImageUrl(img.url);
                        setUploadedFileName('');
                      }}
                      className={`relative rounded-lg overflow-hidden border h-10 group transition-all ${
                        imageUrl === img.url
                          ? 'border-purple-500 ring-2 ring-purple-500/40 scale-105'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Cấu Hình Định Mức BOM Ngay Lúc Tạo Món */}
          <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-purple-500" />
                <span>3. Cấu hình Định Mức Nguyên Liệu (Recipe BOM)</span>
              </h4>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                {bomItems.length} nguyên liệu được chọn
              </span>
            </div>

            {/* Selector Row */}
            <div className="p-3 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-700/80 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-7">
                  <label className="block text-[11px] font-bold text-stone-500 mb-1">
                    Chọn nguyên vật liệu từ kho (Tìm nhanh)
                  </label>
                  <SearchableSelect
                    options={rawMaterials.map((m) => ({
                      value: m.id,
                      label: m.name,
                      subLabel: `${formatCurrencyVND(m.avg_cost)} / ${m.recipe_unit}`,
                      badge: m.recipe_unit,
                    }))}
                    value={selectedMaterialId}
                    onChange={(val) => setSelectedMaterialId(val)}
                    placeholder="-- Tìm hoặc chọn nguyên liệu --"
                    searchPlaceholder="Gõ tên nguyên liệu (VD: Thịt, Sữa, Cà phê...)"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-stone-500 mb-1">
                    Định mức ({currentSelectedMaterial?.recipe_unit || 'đv'})
                  </label>
                  <input
                    type="number"
                    value={materialQty}
                    onChange={(e) => setMaterialQty(e.target.value)}
                    placeholder="VD: 150"
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono font-bold text-stone-900 dark:text-white focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <button
                    type="button"
                    onClick={handleAddBomItem}
                    className="w-full py-2 px-3 rounded-lg bg-stone-900 dark:bg-stone-700 hover:bg-stone-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>

              {/* Added BOM Items Table */}
              {bomItems.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-stone-200 dark:border-stone-700">
                  {bomItems.map((item) => {
                    const mat = rawMaterials.find((m) => m.id === item.raw_material_id);
                    if (!mat) return null;
                    const lineCost = item.quantity * mat.avg_cost;

                    return (
                      <div
                        key={item.raw_material_id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            {mat.name}
                          </span>
                          <span className="text-stone-400 text-[11px]">
                            ({item.quantity} {mat.recipe_unit})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-stone-600 dark:text-stone-300 text-[11px]">
                            ~{formatCurrencyVND(lineCost)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBomItem(item.raw_material_id)}
                            className="p-1 rounded text-stone-400 hover:text-rose-500"
                            title="Xóa nguyên liệu này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* COGS & Margin Summary */}
                  <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-300 mt-2">
                    <div>
                      <span>Giá vốn ước tính (COGS): </span>
                      <span className="font-mono">{formatCurrencyVND(estimatedCOGS)}</span>
                    </div>
                    {numPrice > 0 && (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <span>Lợi nhuận gộp:</span>
                        <span>{estimatedMargin}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/25 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Lưu Món Mới & Định Mức</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
