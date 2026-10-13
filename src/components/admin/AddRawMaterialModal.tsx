'use client';

import React, { useState } from 'react';
import { RawMaterial } from '@/types';
import { inventoryService } from '@/services/inventoryService';
import { STANDARD_UNIT_PRESETS, UnitPairPreset } from '@/lib/unitPresets';
import { X, Plus, Boxes, Sparkles, Scale } from 'lucide-react';

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
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [purchaseUnit, setPurchaseUnit] = useState(STANDARD_UNIT_PRESETS[0].purchase_unit);
  const [recipeUnit, setRecipeUnit] = useState(STANDARD_UNIT_PRESETS[0].recipe_unit);
  const [conversionFactor, setConversionFactor] = useState(STANDARD_UNIT_PRESETS[0].default_conversion.toString());
  const [purchasePrice, setPurchasePrice] = useState('130000'); // Giá mua vào cho 1 Đơn vị mua
  const [avgCost, setAvgCost] = useState('130'); // Giá vốn mỗi recipe_unit (auto calculated)
  const [currentStock, setCurrentStock] = useState('0');
  const [minStockLevel, setMinStockLevel] = useState('500');
  const [error, setError] = useState('');

  // Tự động quy đổi Giá vốn ước tính (avgCost) = Giá mua vào / Hệ số quy đổi
  React.useEffect(() => {
    const pPrice = parseFloat(purchasePrice);
    const conv = parseFloat(conversionFactor);
    if (!isNaN(pPrice) && !isNaN(conv) && conv > 0) {
      const calculated = Math.round((pPrice / conv) * 100) / 100;
      setAvgCost(calculated.toString());
    } else {
      setAvgCost('0');
    }
  }, [purchasePrice, conversionFactor]);

  const handlePresetChange = (idx: number) => {
    setSelectedPresetIndex(idx);
    const p = STANDARD_UNIT_PRESETS[idx];
    if (p) {
      setPurchaseUnit(p.purchase_unit);
      setRecipeUnit(p.recipe_unit);
      setConversionFactor(p.default_conversion.toString());
    }
  };

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

          {/* Quy chuẩn Đơn vị tính (Dropdown Chuẩn Hóa) */}
          <div className="space-y-3 p-3.5 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-750">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Scale className="w-3.5 h-3.5" />
                  Quy chuẩn Đơn vị tính (Chuẩn hóa) *
                </span>
                <span className="text-[10px] text-stone-400 font-normal">
                  Chọn cặp đơn vị tương ứng
                </span>
              </label>
              <select
                value={selectedPresetIndex}
                onChange={(e) => handlePresetChange(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              >
                {STANDARD_UNIT_PRESETS.map((p, idx) => (
                  <option key={idx} value={idx}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-stone-400 mt-1 italic">
                {STANDARD_UNIT_PRESETS[selectedPresetIndex]?.description}
              </p>
            </div>

            {/* Chi tiết đơn vị & Hệ số quy đổi */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-stone-200 dark:border-stone-700">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 mb-1">
                  Đơn vị Mua:
                </label>
                <div className="px-3 py-2 rounded-lg bg-stone-200/60 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-mono font-bold uppercase text-center border border-stone-300 dark:border-stone-700">
                  {purchaseUnit}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 mb-1">
                  Định Mức (BOM):
                </label>
                <div className="px-3 py-2 rounded-lg bg-stone-200/60 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-mono font-bold uppercase text-center border border-stone-300 dark:border-stone-700">
                  {recipeUnit}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 mb-1">
                  1 {purchaseUnit} = ? {recipeUnit}:
                </label>
                <input
                  type="number"
                  value={conversionFactor}
                  onChange={(e) => setConversionFactor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-mono font-bold text-center focus:outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          {/* Giá mua vào theo Đơn vị mua */}
          <div className="p-3.5 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-750 space-y-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Giá mua vào (theo 1 {purchaseUnit}) (VNĐ) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="VD: 130000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-stone-400">
                  VNĐ / {purchaseUnit}
                </span>
              </div>

              {/* Dynamic Helper Text nổi bật màu đỏ theo mockup */}
              {parseFloat(purchasePrice) > 0 && parseFloat(conversionFactor) > 0 && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1.5 animate-fade-in">
                  <span>⚡ 1 {purchaseUnit} = {Number(purchasePrice).toLocaleString()} VNĐ thì giá vốn ước tính tự động quy đổi: {Number(avgCost).toLocaleString()} VNĐ/{recipeUnit}</span>
                </p>
              )}
            </div>

            {/* Giá vốn ước tính (Tự động điền & Khóa sửa Disable / Read-only) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center justify-between">
                  <span>Giá vốn ước tính ({recipeUnit}) *</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded-full">
                    Khóa sửa
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={avgCost}
                    disabled
                    readOnly
                    placeholder="Tự động tính"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-mono font-bold cursor-not-allowed select-none opacity-90"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-stone-400">
                    VNĐ/{recipeUnit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Tồn an toàn tối thiểu ({recipeUnit}) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={minStockLevel}
                    onChange={(e) => setMinStockLevel(e.target.value)}
                    placeholder="VD: 500"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-mono font-bold focus:outline-hidden"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-stone-400">
                    {recipeUnit}
                  </span>
                </div>
              </div>
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
