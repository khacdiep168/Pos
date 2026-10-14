'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Category, StationType, MenuItem, RawMaterial } from '@/types';
import { menuService } from '@/services/menuService';
import { inventoryService } from '@/services/inventoryService';
import { formatCurrencyVND } from '@/lib/utils';
import {
  X,
  Save,
  Upload,
  Image as ImageIcon,
  Trash2,
  Boxes,
  Plus,
  Percent,
} from 'lucide-react';
import { SearchableSelect, SearchableOption } from '@/components/ui/SearchableSelect';

import { SmartPricingSimulator } from '@/components/erp/SmartPricingSimulator';

interface EditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  categories: Category[];
  onItemUpdated?: (item: MenuItem) => void;
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

export const EditMenuItemModal: React.FC<EditMenuItemModalProps> = ({
  isOpen,
  onClose,
  item,
  categories,
  onItemUpdated,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [takeawayPrice, setTakeawayPrice] = useState('');
  const [deliveryPrice, setDeliveryPrice] = useState('');
  const [station, setStation] = useState<StationType>('kitchen');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  // Local File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // BOM Configuration State (with is_packaging flag)
  const [rawMaterials] = useState<RawMaterial[]>(() => inventoryService.getRawMaterials());
  const [bomItems, setBomItems] = useState<{ raw_material_id: string; quantity: number; is_packaging?: boolean }[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [materialQty, setMaterialQty] = useState('');
  const [isPackagingItem, setIsPackagingItem] = useState(false);

  // Pre-fill form when item changes
  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategoryId(item.category_id);
      setPrice(item.price.toLocaleString('vi-VN'));
      setTakeawayPrice(item.takeaway_price ? item.takeaway_price.toLocaleString('vi-VN') : '');
      setDeliveryPrice(item.delivery_price ? item.delivery_price.toLocaleString('vi-VN') : '');
      setStation(item.station);
      setDescription(item.description || '');
      setImageUrl(item.image_url || '');
      setUploadedFileName('');
      setError('');

      // Load existing BOM items
      const existingBoms = inventoryService.getRecipesByMenuItem(item.id);
      setBomItems(
        existingBoms.map((b) => ({
          raw_material_id: b.raw_material_id,
          quantity: b.quantity,
          is_packaging: b.is_packaging,
        }))
      );

      if (rawMaterials.length > 0) {
        setSelectedMaterialId(rawMaterials[0].id);
      }
    }
  }, [item, rawMaterials]);

  if (!isOpen || !item) return null;

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

  // Add ingredient to BOM
  const handleAddBomItem = () => {
    if (!selectedMaterialId) return;
    const qty = parseFloat(materialQty);
    if (isNaN(qty) || qty <= 0) {
      setError('Vui lòng nhập định mức hợp lệ (> 0)!');
      return;
    }

    const existingIdx = bomItems.findIndex((b) => b.raw_material_id === selectedMaterialId);
    if (existingIdx > -1) {
      const updated = [...bomItems];
      updated[existingIdx].quantity += qty;
      updated[existingIdx].is_packaging = isPackagingItem;
      setBomItems(updated);
    } else {
      setBomItems([
        ...bomItems,
        { raw_material_id: selectedMaterialId, quantity: qty, is_packaging: isPackagingItem },
      ]);
    }

    setMaterialQty('');
    setIsPackagingItem(false);
    setError('');
  };

  const handleTogglePackaging = (materialId: string) => {
    setBomItems(
      bomItems.map((b) =>
        b.raw_material_id === materialId ? { ...b, is_packaging: !b.is_packaging } : b
      )
    );
  };

  const handleRemoveBomItem = (materialId: string) => {
    setBomItems(bomItems.filter((b) => b.raw_material_id !== materialId));
  };

  // Calculate COGS separated into Core Cost vs Packaging Cost
  const coreBomCost = bomItems.reduce((sum, b) => {
    if (b.is_packaging) return sum;
    const mat = rawMaterials.find((m) => m.id === b.raw_material_id);
    return sum + (mat ? b.quantity * mat.avg_cost : 0);
  }, 0);

  const packagingBomCost = bomItems.reduce((sum, b) => {
    if (!b.is_packaging) return sum;
    const mat = rawMaterials.find((m) => m.id === b.raw_material_id);
    return sum + (mat ? b.quantity * mat.avg_cost : 0);
  }, 0);

  const estimatedCOGS = coreBomCost + packagingBomCost;
  const numPrice = parseFloat(price.replace(/\D/g, '')) || 0;
  const numTakeawayPrice = parseFloat(takeawayPrice.replace(/\D/g, '')) || undefined;
  const numDeliveryPrice = parseFloat(deliveryPrice.replace(/\D/g, '')) || undefined;
  const estimatedGrossProfit = numPrice - estimatedCOGS;
  const estimatedMargin = numPrice > 0 ? Math.round((estimatedGrossProfit / numPrice) * 100) : 0;

  const handleApplySimulatedPrices = (prices: {
    dineInPrice: number;
    takeawayPrice: number;
    deliveryPrice: number;
    packagingCost: number;
    appCommissionRate: number;
  }) => {
    setPrice(prices.dineInPrice.toLocaleString('vi-VN'));
    setTakeawayPrice(prices.takeawayPrice.toLocaleString('vi-VN'));
    setDeliveryPrice(prices.deliveryPrice.toLocaleString('vi-VN'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên món ăn!');
      return;
    }

    if (numPrice <= 0) {
      setError('Vui lòng nhập giá bán tại bàn hợp lệ (> 0đ)!');
      return;
    }

    // 1. Update Menu Item in menuService with multi-channel pricing
    const updated = menuService.updateMenuItem(item.id, {
      name: name.trim(),
      category_id: categoryId,
      price: numPrice,
      takeaway_price: numTakeawayPrice,
      delivery_price: numDeliveryPrice,
      packaging_cost: packagingBomCost > 0 ? packagingBomCost : undefined,
      app_commission_rate: 25,
      station,
      description: description.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
    });

    // 2. Save Updated BOM in inventoryService
    inventoryService.saveRecipeBOM(item.id, bomItems);

    if (updated && onItemUpdated) {
      onItemUpdated(updated);
    }

    onClose();
  };

  const currentSelectedMaterial = rawMaterials.find((m) => m.id === selectedMaterialId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                Chỉnh Sửa Món Ăn & Định Mức BOM
              </h3>
              <p className="text-xs text-stone-400">
                Cập nhật thông tin, thay ảnh món ăn và điều chỉnh công thức nguyên vật liệu
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              1. Thông tin món ăn
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>

            {/* 3-Channel Pricing Bento Grid */}
            <div className="p-3 bg-stone-50/70 dark:bg-stone-800/40 rounded-2xl border border-stone-200 dark:border-stone-700/80 space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300">
                💰 Thiết Lập Giá Bán Đa Kênh (Multi-Channel)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Dine-in Price */}
                <div className="p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-amber-300 dark:border-amber-700/80 shadow-2xs">
                  <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1">
                    <span>🍽️ Tại Bàn (Mặc định) *</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={price}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPrice(val ? parseInt(val, 10).toLocaleString('vi-VN') : '');
                        setError('');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold pr-10 focus:outline-hidden"
                      required
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">
                      đ
                    </span>
                  </div>
                </div>

                {/* 2. Takeaway Price */}
                <div className="p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-orange-300 dark:border-orange-700/80 shadow-2xs">
                  <div className="text-[11px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1 mb-1">
                    <span>🛍️ Khách Mang Về</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={takeawayPrice}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setTakeawayPrice(val ? parseInt(val, 10).toLocaleString('vi-VN') : '');
                      }}
                      placeholder="Tự động theo giá bàn"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold pr-10 focus:outline-hidden"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">
                      đ
                    </span>
                  </div>
                </div>

                {/* 3. Delivery Price */}
                <div className="p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-emerald-300 dark:border-emerald-700/80 shadow-2xs">
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1">
                    <span>🛵 App Giao Hàng</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={deliveryPrice}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setDeliveryPrice(val ? parseInt(val, 10).toLocaleString('vi-VN') : '');
                      }}
                      placeholder="Gross-up bảo toàn lãi"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold pr-10 focus:outline-hidden"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">
                      đ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Mô tả thành phần / Hương vị
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs focus:outline-hidden"
              />
            </div>
          </div>

          {/* Section 2: Hình ảnh (Upload Đè Ảnh Cũ + Preview) */}
          <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-stone-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              2. Hình ảnh món ăn (Tải ảnh mới từ thiết bị)
            </h4>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 shrink-0 shadow-sm flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-stone-400" />
                )}
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono">
                  Current
                </span>
              </div>

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
                    className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Duyệt Ảnh Mới Từ Thiết Bị (Local)</span>
                  </button>

                  {uploadedFileName && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-xs">
                      ✓ Đã chọn: {uploadedFileName}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-stone-400">
                  Hoặc chọn nhanh từ mẫu ẩm thực có sẵn:
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
                          ? 'border-amber-500 ring-2 ring-amber-500/40 scale-105'
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

          {/* Section 3: Chỉnh Sửa Định Mức BOM Trực Tiếp */}
          <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-amber-500" />
                <span>3. Chỉnh sửa Thành phần Nguyên Liệu (Recipe BOM)</span>
              </h4>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                {bomItems.length} nguyên liệu
              </span>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-700/80 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-7">
                  <label className="block text-[11px] font-bold text-stone-500 mb-1">
                    Thêm nguyên vật liệu (Tìm nhanh)
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
                <div className="sm:col-span-12 flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-600 dark:text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPackagingItem}
                      onChange={(e) => setIsPackagingItem(e.target.checked)}
                      className="accent-orange-500 rounded"
                    />
                    <span>🛍️ Đánh dấu là Bao Bì Mang Về (Ly, túi chữ T, nắp, ống hút...)</span>
                  </label>
                </div>
              </div>

              {/* Current BOM Items Table */}
              {bomItems.length > 0 ? (
                <div className="space-y-1.5 pt-2 border-t border-stone-200 dark:border-stone-700">
                  {bomItems.map((item) => {
                    const mat = rawMaterials.find((m) => m.id === item.raw_material_id);
                    if (!mat) return null;
                    const lineCost = item.quantity * mat.avg_cost;

                    return (
                      <div
                        key={item.raw_material_id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                          item.is_packaging
                            ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/60'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePackaging(item.raw_material_id)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                              item.is_packaging
                                ? 'bg-orange-500 text-white'
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                            }`}
                            title="Bấm để đổi Cốt món vs Bao bì"
                          >
                            <span>🛍️</span>
                            <span>{item.is_packaging ? 'Bao bì' : 'Cốt món'}</span>
                          </button>

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

                  {/* COGS Summary */}
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300 mt-2">
                    <div>
                      <span>Vốn cốt: {formatCurrencyVND(coreBomCost)} | Bao bì: {formatCurrencyVND(packagingBomCost)}</span>
                      <span className="font-mono block text-[10px] opacity-80">Tổng vốn COGS: {formatCurrencyVND(estimatedCOGS)}</span>
                    </div>
                    {numPrice > 0 && (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <span>Biên LN:</span>
                        <span>{estimatedMargin}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-stone-400 italic">
                  Chưa cấu hình nguyên liệu nào cho món này. Thêm nguyên liệu để hệ thống tự động trừ kho khi bán!
                </div>
              )}
            </div>

            {/* Smart Pricing Simulator */}
            <div className="pt-2">
              <SmartPricingSimulator
                coreBomCost={coreBomCost}
                packagingCost={packagingBomCost}
                currentDineInPrice={numPrice}
                currentTakeawayPrice={numTakeawayPrice}
                currentDeliveryPrice={numDeliveryPrice}
                onApplyPrices={handleApplySimulatedPrices}
                compact={true}
              />
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
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Cập Nhật Món & Định Mức</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
