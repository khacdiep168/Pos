'use client';

import React, { useState } from 'react';
import { MenuItem, RawMaterial, RecipeBOM } from '@/types';
import { menuService } from '@/services/menuService';
import { realtimeEngine } from '@/services/realtimeEngine';
import { formatCurrencyVND } from '@/lib/utils';
import { inventoryService } from '@/services/inventoryService';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  TrendingUp,
  Flame,
  Wine,
  Percent,
  DollarSign,
  Layers,
} from 'lucide-react';

interface RecipeBOMTabProps {
  materials: RawMaterial[];
  recipes: RecipeBOM[];
  onRefresh: () => void;
}

export const RecipeBOMTab: React.FC<RecipeBOMTabProps> = ({
  materials,
  recipes,
  onRefresh,
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => menuService.getMenuItems());
  const [selectedItem, setSelectedItem] = useState<MenuItem>(() => menuService.getMenuItems()[0] || null);

  React.useEffect(() => {
    const unsub = realtimeEngine.subscribe('ORDER_UPDATED', () => {
      setMenuItems(menuService.getMenuItems());
    });
    return () => unsub();
  }, []);

  // Local draft of current item's BOM for editing
  const [draftBOM, setDraftBOM] = useState<{ raw_material_id: string; quantity: number }[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  // Sync draft BOM when selectedItem changes
  React.useEffect(() => {
    if (selectedItem) {
      const itemBoms = recipes
        .filter((r) => r.menu_item_id === selectedItem.id)
        .map((r) => ({ raw_material_id: r.raw_material_id, quantity: r.quantity }));
      setDraftBOM(itemBoms);
      setIsSaved(false);
    }
  }, [selectedItem, recipes]);

  // Calculate COGS and Gross Margin for selected item
  const cogs = draftBOM.reduce((sum, b) => {
    const mat = materials.find((m) => m.id === b.raw_material_id);
    return sum + (mat ? b.quantity * mat.avg_cost : 0);
  }, 0);

  const grossProfit = selectedItem.price - cogs;
  const profitMargin = Math.round((grossProfit / selectedItem.price) * 100);

  // Handle adding an ingredient
  const handleAddIngredient = () => {
    // Pick first unused material
    const usedIds = new Set(draftBOM.map((b) => b.raw_material_id));
    const availableMat = materials.find((m) => !usedIds.has(m.id)) || materials[0];

    if (availableMat) {
      setDraftBOM([...draftBOM, { raw_material_id: availableMat.id, quantity: 50 }]);
      setIsSaved(false);
    }
  };

  // Handle changing quantity
  const handleUpdateQuantity = (index: number, quantity: number) => {
    const updated = [...draftBOM];
    updated[index].quantity = Math.max(1, quantity);
    setDraftBOM(updated);
    setIsSaved(false);
  };

  // Handle changing material selection
  const handleUpdateMaterial = (index: number, raw_material_id: string) => {
    const updated = [...draftBOM];
    updated[index].raw_material_id = raw_material_id;
    setDraftBOM(updated);
    setIsSaved(false);
  };

  // Handle removing ingredient
  const handleRemoveIngredient = (index: number) => {
    setDraftBOM(draftBOM.filter((_, idx) => idx !== index));
    setIsSaved(false);
  };

  // Save BOM
  const handleSaveBOM = () => {
    inventoryService.saveRecipeBOM(selectedItem.id, draftBOM);
    onRefresh();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
      {/* Left Column: Menu Items List (5 Cols) */}
      <div className="lg:col-span-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-col overflow-hidden shadow-xs">
        <div className="pb-3 border-b border-stone-200 dark:border-stone-800">
          <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-amber-500" />
            <span>Danh Sách Thực Đơn ({menuItems.length} món)</span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Chọn món để xem và thiết lập định mức cấu thành (BOM)
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 mt-2 space-y-1">
          {menuItems.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const itemRecipeCount = recipes.filter((r) => r.menu_item_id === item.id).length;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/30'
                    : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                }`}
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover bg-stone-100 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.station === 'kitchen' ? 'bg-orange-500' : 'bg-cyan-500'
                      }`}
                    />
                    <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">
                      {item.name}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-1 text-stone-500">
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrencyVND(item.price)}
                    </span>
                    <span className="px-1.5 py-0.2 bg-stone-100 dark:bg-stone-800 rounded font-medium">
                      {itemRecipeCount} nguyên liệu
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: BOM Editor & COGS Margin Analysis (7 Cols) */}
      <div className="lg:col-span-7 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
        <div className="space-y-4">
          {/* Header & Item Summary */}
          <div className="flex items-start justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                    selectedItem.station === 'kitchen' ? 'bg-orange-500' : 'bg-cyan-600'
                  }`}
                >
                  {selectedItem.station === 'kitchen' ? <Flame className="w-2.5 h-2.5" /> : <Wine className="w-2.5 h-2.5" />}
                  {selectedItem.station === 'kitchen' ? 'Bếp' : 'Bar'}
                </span>
                <span className="text-xs text-stone-400">Mã: {selectedItem.id}</span>
              </div>
              <h2 className="text-base font-extrabold text-stone-900 dark:text-white">
                {selectedItem.name}
              </h2>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-stone-400 block">Giá niêm yết</span>
              <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                {formatCurrencyVND(selectedItem.price)}
              </span>
            </div>
          </div>

          {/* Financial & COGS Analytics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/60 text-xs">
              <span className="text-stone-500 text-[11px] block">Giá vốn (COGS):</span>
              <span className="text-sm font-black text-stone-900 dark:text-white mt-0.5 block">
                {formatCurrencyVND(cogs)}
              </span>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/60 text-xs">
              <span className="text-stone-500 text-[11px] block">Lợi nhuận gộp:</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {formatCurrencyVND(grossProfit)}
              </span>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/60 text-xs">
              <span className="text-stone-500 text-[11px] block">Biên LN gộp:</span>
              <span
                className={`text-sm font-black mt-0.5 block ${
                  profitMargin >= 60
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : profitMargin >= 40
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {profitMargin}%
              </span>
            </div>
          </div>

          {/* Ingredients Breakdown Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Định mức thành phần (BOM):
              </span>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm nguyên liệu</span>
              </button>
            </div>

            {draftBOM.length === 0 ? (
              <div className="p-8 text-center text-stone-400 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-xs">
                Chưa có định mức BOM cho món này. Bấm "Thêm nguyên liệu" để cấu hình.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {draftBOM.map((bom, idx) => {
                  const mat = materials.find((m) => m.id === bom.raw_material_id);
                  const lineCost = mat ? bom.quantity * mat.avg_cost : 0;

                  return (
                    <div
                      key={idx}
                      className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700/60 flex items-center justify-between gap-3 text-xs"
                    >
                      {/* Material Selector */}
                      <div className="flex-1">
                        <select
                          value={bom.raw_material_id}
                          onChange={(e) => handleUpdateMaterial(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg font-bold text-xs text-stone-900 dark:text-white focus:outline-none"
                        >
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.recipe_unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Input */}
                      <div className="flex items-center gap-1.5 w-32 shrink-0">
                        <input
                          type="number"
                          value={bom.quantity}
                          onChange={(e) => handleUpdateQuantity(idx, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg font-mono font-bold text-xs"
                        />
                        <span className="text-stone-400 font-medium">
                          {mat?.recipe_unit || 'g'}
                        </span>
                      </div>

                      {/* Line Cost Preview */}
                      <div className="text-right w-24 shrink-0 font-bold text-stone-800 dark:text-stone-200">
                        {formatCurrencyVND(lineCost)}
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleRemoveIngredient(idx)}
                        className="p-1.5 text-stone-400 hover:text-rose-500 transition-colors"
                        title="Xóa nguyên liệu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Save Button */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between mt-4">
          <span className="text-xs text-stone-400">
            {isSaved ? (
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã lưu định mức thành công!
              </span>
            ) : (
              'Thay đổi sẽ áp dụng ngay vào luồng trừ kho tự động'
            )}
          </span>

          <button
            onClick={handleSaveBOM}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Định Mức BOM</span>
          </button>
        </div>
      </div>
    </div>
  );
};
