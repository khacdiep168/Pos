'use client';

import React, { useState } from 'react';
import { RawMaterial } from '@/types';
import { inventoryService } from '@/services/inventoryService';
import { X, Plus, Boxes, Sparkles } from 'lucide-react';

interface AddRawMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMaterialAdded?: (material: RawMaterial) => void;
}

export const AddRawMaterialModal: React.FC<AddRawMaterialModalProps> = ({
  isOpen,
  onClose,
  onMaterialAdded,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Đồ uống / Pha chế');
  const [purchaseUnit, setPurchaseUnit] = useState('hộp');
  const [recipeUnit, setRecipeUnit] = useState('ml');
  const [conversionFactor, setConversionFactor] = useState('1000');
  const [avgCost, setAvgCost] = useState('35'); // Giá vốn mỗi recipe_unit
  const [currentStock, setCurrentStock] = useState('0');
  const [minStockLevel, setMinStockLevel] = useState('500');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên nguyên vật liệu!');
      return;
    }

    const conv = parseFloat(conversionFactor) || 1;
    const cost = parseFloat(avgCost) || 0;
    const stock = parseFloat(currentStock) || 0;
    const minStock = parseFloat(minStockLevel) || 0;

    const newMaterial = inventoryService.addRawMaterial({
      name: name.trim(),
      category: category.trim(),
      supplier_id: 'sup-1',
      purchase_unit: purchaseUnit.trim() || 'kg',
      recipe_unit: recipeUnit.trim() || 'g',
      conversion_factor: conv,
      avg_cost: cost,
      current_stock: stock,
      min_stock_level: minStock,
    });

    if (onMaterialAdded) {
      onMaterialAdded(newMaterial);
    }

    // Reset form
    setName('');
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
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                Thêm Nguyên Vật Liệu Mới
              </h3>
              <p className="text-xs text-stone-400">
                Khai báo danh mục nguyên liệu phục vụ Nhập Kho & Định mức BOM
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

          {/* Tên nguyên liệu */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Tên nguyên vật liệu *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="VD: Sữa Tươi Thanh Trùng DalatMilk"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Phân loại danh mục */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Phân loại nhóm nguyên liệu *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="Thịt & Hải sản">🥩 Thịt & Hải sản</option>
              <option value="Rau củ & Nông sản">🥬 Rau củ & Nông sản</option>
              <option value="Gia vị & Sốt">🧂 Gia vị & Sốt</option>
              <option value="Đồ uống / Pha chế">☕ Đồ uống / Pha chế</option>
              <option value="Đồ khô & Đóng hộp">📦 Đồ khô & Đóng hộp</option>
            </select>
          </div>

          {/* Đơn vị mua & Đơn vị định mức */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Đơn vị mua (Purchase Unit) *
              </label>
              <input
                type="text"
                value={purchaseUnit}
                onChange={(e) => setPurchaseUnit(e.target.value)}
                placeholder="VD: kg, hộp, thùng, bao"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-medium focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Đơn vị định mức (Recipe Unit) *
              </label>
              <input
                type="text"
                value={recipeUnit}
                onChange={(e) => setRecipeUnit(e.target.value)}
                placeholder="VD: g, ml, shot, lát"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-medium focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Hệ số quy đổi */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Hệ số quy đổi (1 {purchaseUnit || 'đơn vị mua'} = ? {recipeUnit || 'định mức'}) *
            </label>
            <input
              type="number"
              value={conversionFactor}
              onChange={(e) => setConversionFactor(e.target.value)}
              placeholder="VD: 1000"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-mono font-bold focus:outline-hidden"
              required
            />
            <p className="text-[10px] text-stone-400 mt-1">
              Ví dụ: Mua theo 1 kg ➔ Định mức trừ 1000g; Mua 1 chai ➔ Định mức 750ml.
            </p>
          </div>

          {/* Giá vốn & Tồn tối thiểu */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Giá vốn ước tính (VNĐ/{recipeUnit}) *
              </label>
              <input
                type="number"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                placeholder="VD: 40"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-mono font-bold focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Tồn kho an toàn tối thiểu ({recipeUnit}) *
              </label>
              <input
                type="number"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value)}
                placeholder="VD: 500"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-mono font-bold focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Tồn ban đầu */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Số lượng tồn ban đầu ({recipeUnit})
            </label>
            <input
              type="number"
              value={currentStock}
              onChange={(e) => setCurrentStock(e.target.value)}
              placeholder="VD: 0"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-mono font-bold focus:outline-hidden"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Xác Nhận Thêm Nguyên Liệu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
