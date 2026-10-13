'use client';

import React, { useState, useEffect } from 'react';
import { RawMaterial, Supplier } from '@/types';
import { inventoryService } from '@/services/inventoryService';
import { STANDARD_UNIT_PRESETS, getPresetByUnits } from '@/lib/unitPresets';
import { formatCurrencyVND } from '@/lib/utils';
import {
  X,
  Edit3,
  Layers,
  Scale,
  DollarSign,
  AlertTriangle,
  Building,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';

interface EditRawMaterialModalProps {
  material: RawMaterial | null;
  isOpen: boolean;
  onClose: () => void;
  onMaterialUpdated?: (updated: RawMaterial) => void;
}

export const EditRawMaterialModal: React.FC<EditRawMaterialModalProps> = ({
  material,
  isOpen,
  onClose,
  onMaterialUpdated,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Đồ uống / Pha chế');
  const [supplierId, setSupplierId] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('kg-g');
  const [customConversionFactor, setCustomConversionFactor] = useState(1000);
  const [minStockLevel, setMinStockLevel] = useState(500);
  const [avgCost, setAvgCost] = useState(0);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSuppliers(inventoryService.getSuppliers());
    }
  }, [isOpen]);

  useEffect(() => {
    if (material && isOpen) {
      setName(material.name);
      setCategory(material.category || 'Đồ uống / Pha chế');
      setSupplierId(material.supplier_id || '');
      setMinStockLevel(material.min_stock_level);
      setAvgCost(material.avg_cost);
      setCustomConversionFactor(material.conversion_factor);

      const matchedPreset = getPresetByUnits(material.purchase_unit, material.recipe_unit);
      if (matchedPreset) {
        setSelectedPresetId(matchedPreset.id);
      } else {
        setSelectedPresetId('kg-g');
      }
    }
  }, [material, isOpen]);

  if (!isOpen || !material) return null;

  const currentPreset =
    STANDARD_UNIT_PRESETS.find((p) => p.id === selectedPresetId) || STANDARD_UNIT_PRESETS[0];

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = STANDARD_UNIT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setCustomConversionFactor(preset.defaultConversionFactor);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên nguyên vật liệu!');
      return;
    }

    const updates: Partial<RawMaterial> = {
      name: name.trim(),
      category,
      purchase_unit: currentPreset.purchaseUnit,
      recipe_unit: currentPreset.recipeUnit,
      conversion_factor: customConversionFactor > 0 ? customConversionFactor : 1,
      min_stock_level: minStockLevel >= 0 ? minStockLevel : 0,
      avg_cost: avgCost >= 0 ? avgCost : 0,
      supplier_id: supplierId || undefined,
    };

    const updated = inventoryService.updateRawMaterial(material.id, updates);
    if (updated) {
      if (onMaterialUpdated) {
        onMaterialUpdated(updated);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                Chỉnh Sửa Nguyên Vật Liệu
              </h3>
              <p className="text-xs text-stone-400">
                Mã: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">#{material.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tên & Phân loại */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Tên nguyên vật liệu <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Cà phê hạt Arabica Cầu Đất"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Phân loại danh mục:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
              >
                <option value="Đồ uống / Pha chế">Đồ uống / Pha chế</option>
                <option value="Thực phẩm / Bếp">Thực phẩm / Bếp</option>
                <option value="Gia vị / Phụ liệu">Gia vị / Phụ liệu</option>
                <option value="Bao bì / Vật tư đóng gói">Bao bì / Vật tư đóng gói</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          {/* Nhà Cung Cấp */}
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 mb-1">
              <Building className="w-3.5 h-3.5 text-stone-400" />
              <span>Nhà cung cấp chính:</span>
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
            >
              <option value="">-- Chưa gán nhà cung cấp --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.phone})
                </option>
              ))}
            </select>
          </div>

          {/* CHUẨN HÓA ĐƠN VỊ TÍNH (Dropdown Selection) */}
          <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-500" />
                <span>Chuẩn hóa Cặp Đơn Vị Tính (Dropdown):</span>
              </label>
              <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                Quy chuẩn hệ thống
              </span>
            </div>

            <select
              value={selectedPresetId}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-800 border border-amber-500/30 dark:border-amber-500/40 rounded-xl font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/40 focus:outline-none text-xs"
            >
              {STANDARD_UNIT_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label} — [1 {preset.purchaseUnit} = {preset.defaultConversionFactor.toLocaleString()} {preset.recipeUnit}]
                </option>
              ))}
            </select>

            {/* Chi tiết đơn vị mua & đơn vị định mức */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 bg-white dark:bg-stone-800/80 rounded-xl border border-stone-200/80 dark:border-stone-700">
                <div className="text-[10px] text-stone-400 font-medium">Đơn vị mua (PO)</div>
                <div className="font-bold text-sm text-stone-900 dark:text-white">
                  {currentPreset.purchaseUnit}
                </div>
              </div>

              <div className="p-2.5 bg-white dark:bg-stone-800/80 rounded-xl border border-stone-200/80 dark:border-stone-700">
                <div className="text-[10px] text-stone-400 font-medium">Đơn vị định mức (BOM)</div>
                <div className="font-bold text-sm text-stone-900 dark:text-white">
                  {currentPreset.recipeUnit}
                </div>
              </div>

              <div className="p-2.5 bg-white dark:bg-stone-800/80 rounded-xl border border-stone-200/80 dark:border-stone-700">
                <div className="text-[10px] text-stone-400 font-medium">Hệ số quy đổi</div>
                <div className="flex items-center gap-1 font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                  <span>×</span>
                  <input
                    type="number"
                    min="1"
                    value={customConversionFactor}
                    onChange={(e) => setCustomConversionFactor(parseFloat(e.target.value) || 1)}
                    className="w-full bg-transparent border-b border-amber-500/40 focus:outline-none text-right font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                1 {currentPreset.purchaseUnit} = {customConversionFactor.toLocaleString()} {currentPreset.recipeUnit}.
              </span>
            </div>
          </div>

          {/* Mức tồn an toàn & Giá vốn cơ sở */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Mức tồn an toàn ({currentPreset.recipeUnit}):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={minStockLevel}
                  onChange={(e) => setMinStockLevel(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold text-stone-900 dark:text-white"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-stone-400 font-medium">
                  {currentPreset.recipeUnit}
                </span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Hệ thống báo đỏ khi tồn kho dưới mức này.</p>
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Giá vốn cơ sở (VND / {currentPreset.recipeUnit}):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={avgCost}
                  onChange={(e) => setAvgCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold text-stone-900 dark:text-white"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-stone-400 font-medium">
                  đ / {currentPreset.recipeUnit}
                </span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                Tương đương: {formatCurrencyVND(avgCost * customConversionFactor)} / {currentPreset.purchaseUnit}
              </p>
            </div>
          </div>

          {/* Current Stock Preview */}
          <div className="p-3 bg-stone-100 dark:bg-stone-800/50 rounded-xl flex items-center justify-between text-xs">
            <span className="text-stone-500 dark:text-stone-400">Tồn kho hiện thời:</span>
            <span className="font-mono font-black text-stone-900 dark:text-white">
              {material.current_stock.toLocaleString()} {material.recipe_unit} (≈ {(material.current_stock / material.conversion_factor).toFixed(2)} {material.purchase_unit})
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 font-bold text-xs transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-amber-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
