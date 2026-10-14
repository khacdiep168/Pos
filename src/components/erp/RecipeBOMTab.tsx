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
  X,
} from 'lucide-react';
import { SearchableSelect, SearchableOption } from '@/components/ui/SearchableSelect';

import { SmartPricingSimulator } from './SmartPricingSimulator';

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

  // Local draft of current item's BOM for editing (with is_packaging flag)
  const [draftBOM, setDraftBOM] = useState<{ raw_material_id: string; quantity: number; is_packaging?: boolean }[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isMobileBOMModalOpen, setIsMobileBOMModalOpen] = useState(false);

  // Sync draft BOM when selectedItem changes
  React.useEffect(() => {
    if (selectedItem) {
      const itemBoms = recipes
        .filter((r) => r.menu_item_id === selectedItem.id)
        .map((r) => ({
          raw_material_id: r.raw_material_id,
          quantity: r.quantity,
          is_packaging: r.is_packaging,
        }));
      setDraftBOM(itemBoms);
      setIsSaved(false);
    }
  }, [selectedItem, recipes]);

  // Options for SearchableSelect
  const materialOptions: SearchableOption[] = materials.map((m) => ({
    value: m.id,
    label: m.name,
    subLabel: `${formatCurrencyVND(m.avg_cost)} / ${m.recipe_unit}`,
    badge: m.recipe_unit,
  }));

  // Separate Core Cost (vốn cốt pha chế) vs Packaging Cost (vốn bao bì mang về)
  const coreCost = draftBOM.reduce((sum, b) => {
    if (b.is_packaging) return sum;
    const mat = materials.find((m) => m.id === b.raw_material_id);
    return sum + (mat ? b.quantity * mat.avg_cost : 0);
  }, 0);

  const packagingCost = draftBOM.reduce((sum, b) => {
    if (!b.is_packaging) return sum;
    const mat = materials.find((m) => m.id === b.raw_material_id);
    return sum + (mat ? b.quantity * mat.avg_cost : 0);
  }, 0);

  const cogs = coreCost + packagingCost;
  const grossProfit = selectedItem ? selectedItem.price - cogs : 0;
  const profitMargin = selectedItem && selectedItem.price > 0 ? Math.round((grossProfit / selectedItem.price) * 100) : 0;

  // Handle adding an ingredient
  const handleAddIngredient = () => {
    const usedIds = new Set(draftBOM.map((b) => b.raw_material_id));
    const availableMat = materials.find((m) => !usedIds.has(m.id)) || materials[0];

    if (availableMat) {
      setDraftBOM([...draftBOM, { raw_material_id: availableMat.id, quantity: 50, is_packaging: false }]);
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

  // Handle toggling packaging flag
  const handleTogglePackaging = (index: number) => {
    const updated = [...draftBOM];
    updated[index].is_packaging = !updated[index].is_packaging;
    setDraftBOM(updated);
    setIsSaved(false);
  };

  // Handle removing ingredient
  const handleRemoveIngredient = (index: number) => {
    setDraftBOM(draftBOM.filter((_, idx) => idx !== index));
    setIsSaved(false);
  };

  const [priceNotice, setPriceNotice] = useState<string | null>(null);

  // Save BOM & sync multi-channel pricing
  const handleSaveBOM = () => {
    if (!selectedItem) return;
    inventoryService.saveRecipeBOM(selectedItem.id, draftBOM);

    const calculatedTakeaway = selectedItem.takeaway_price || (selectedItem.price + packagingCost);
    const calculatedDelivery = selectedItem.delivery_price || Math.round(((selectedItem.price + packagingCost) / 0.75) / 1000) * 1000;

    const updated = menuService.updateMenuItem(selectedItem.id, {
      packaging_cost: packagingCost,
      takeaway_price: calculatedTakeaway,
      delivery_price: calculatedDelivery,
    });

    if (updated) {
      setSelectedItem(updated);
      setMenuItems(menuService.getMenuItems());
    }

    onRefresh();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // 1-Click apply suggested prices from SmartPricingSimulator
  const handleApplyPrices = (prices: {
    dineInPrice: number;
    takeawayPrice: number;
    deliveryPrice: number;
    packagingCost: number;
    appCommissionRate: number;
  }) => {
    if (!selectedItem) return;
    const updated = menuService.updateMenuItem(selectedItem.id, {
      price: prices.dineInPrice,
      takeaway_price: prices.takeawayPrice,
      delivery_price: prices.deliveryPrice,
      packaging_cost: prices.packagingCost,
      app_commission_rate: prices.appCommissionRate,
    });
    if (updated) {
      setSelectedItem(updated);
      setMenuItems(menuService.getMenuItems());
      setPriceNotice('Đã áp dụng bảng giá 3 kênh thành công!');
      setTimeout(() => setPriceNotice(null), 3000);
    }
  };

  const handleApplySinglePrice = (channel: 'dine_in' | 'takeaway' | 'delivery', price: number) => {
    if (!selectedItem) return;
    const payload: Partial<MenuItem> = {};
    if (channel === 'dine_in') payload.price = price;
    if (channel === 'takeaway') payload.takeaway_price = price;
    if (channel === 'delivery') payload.delivery_price = price;
    const updated = menuService.updateMenuItem(selectedItem.id, payload);
    if (updated) {
      setSelectedItem(updated);
      setMenuItems(menuService.getMenuItems());
      const channelLabel = channel === 'takeaway' ? 'Mang Về' : channel === 'delivery' ? 'App Giao Hàng' : 'Tại Bàn';
      setPriceNotice(`Đã áp dụng giá ${channelLabel} (${formatCurrencyVND(price)}) thành công!`);
      setTimeout(() => setPriceNotice(null), 3000);
    }
  };

  return (
    <div className="h-full">
      {/* Mobile Dish Card List (lg:hidden) */}
      <div className="lg:hidden space-y-3 pb-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-amber-500" />
            <span>Định Mức Món Ăn ({menuItems.length} món)</span>
          </h3>
          <span className="text-[11px] text-stone-400">Chạm thẻ để sửa BOM</span>
        </div>

        <div className="space-y-2.5">
          {menuItems.map((item) => {
            const itemBoms = recipes.filter((r) => r.menu_item_id === item.id);
            const itemCogs = itemBoms.reduce((sum, b) => {
              const mat = materials.find((m) => m.id === b.raw_material_id);
              return sum + (mat ? b.quantity * mat.avg_cost : 0);
            }, 0);
            const itemGrossProfit = item.price - itemCogs;
            const itemMargin = Math.round((itemGrossProfit / item.price) * 100);

            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                  setIsMobileBOMModalOpen(true);
                }}
                className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-3.5 shadow-xs flex items-center gap-3 cursor-pointer active:scale-98 transition-all hover:border-amber-500/50"
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-14 h-14 rounded-xl object-cover bg-stone-100 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shrink-0 ${
                        item.station === 'kitchen' ? 'bg-orange-500' : 'bg-cyan-600'
                      }`}
                    >
                      {item.station === 'kitchen' ? (
                        <Flame className="w-2.5 h-2.5" />
                      ) : (
                        <Wine className="w-2.5 h-2.5" />
                      )}
                      {item.station === 'kitchen' ? 'Bếp' : 'Bar'}
                    </span>
                    <h4 className="font-extrabold text-xs text-stone-900 dark:text-stone-100 truncate">
                      {item.name}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <div>
                      <span>Giá: </span>
                      <strong className="text-amber-600 dark:text-amber-400 font-bold">
                        {formatCurrencyVND(item.price)}
                      </strong>
                    </div>
                    <div>
                      <span>COGS: </span>
                      <strong className="text-stone-900 dark:text-stone-200 font-mono font-bold">
                        {formatCurrencyVND(itemCogs)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-stone-100 dark:border-stone-800 text-[10px]">
                    <span className="text-stone-400">
                      {itemBoms.length} nguyên liệu
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full font-bold ${
                        itemMargin >= 60
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : itemMargin >= 40
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      Biên LN: {itemMargin}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop 2-Column Split View (hidden lg:grid) */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-5 h-full">
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
          <div className="grid grid-cols-4 gap-2.5">
            <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/60 text-xs">
              <span className="text-stone-500 text-[10px] block font-medium">Vốn cốt (Core):</span>
              <span className="text-xs font-black text-stone-900 dark:text-white mt-0.5 block">
                {formatCurrencyVND(coreCost)}
              </span>
            </div>

            <div className="p-2.5 bg-orange-50/60 dark:bg-orange-950/20 rounded-xl border border-orange-200/60 dark:border-orange-900/40 text-xs">
              <span className="text-orange-600 dark:text-orange-400 text-[10px] block font-medium">Bao bì (Ly/Túi):</span>
              <span className="text-xs font-black text-orange-700 dark:text-orange-300 mt-0.5 block">
                {formatCurrencyVND(packagingCost)}
              </span>
            </div>

            <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/60 text-xs">
              <span className="text-stone-500 text-[10px] block font-medium">Tổng vốn COGS:</span>
              <span className="text-xs font-black text-stone-900 dark:text-white mt-0.5 block">
                {formatCurrencyVND(cogs)}
              </span>
            </div>

            <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 text-[10px] block font-medium">Biên LN Gộp:</span>
              <span
                className={`text-xs font-black mt-0.5 block ${
                  profitMargin >= 60
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : profitMargin >= 40
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {profitMargin}% ({formatCurrencyVND(grossProfit)})
              </span>
            </div>
          </div>

          {/* Ingredients Breakdown Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Định mức thành phần & Bao bì (BOM):
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
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {draftBOM.map((bom, idx) => {
                  const mat = materials.find((m) => m.id === bom.raw_material_id);
                  const lineCost = mat ? bom.quantity * mat.avg_cost : 0;

                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 text-xs transition-colors ${
                        bom.is_packaging
                          ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/60'
                          : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/60'
                      }`}
                    >
                      {/* Material Selector with Instant Search */}
                      <div className="flex-1 min-w-[170px]">
                        <SearchableSelect
                          options={materialOptions}
                          value={bom.raw_material_id}
                          onChange={(val) => handleUpdateMaterial(idx, val)}
                          placeholder="-- Chọn nguyên liệu --"
                          searchPlaceholder="Tìm kiếm..."
                          buttonClassName="px-2 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold text-stone-900 dark:text-white"
                        />
                      </div>

                      {/* Packaging toggle button */}
                      <button
                        type="button"
                        onClick={() => handleTogglePackaging(idx)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                          bom.is_packaging
                            ? 'bg-orange-500 text-white shadow-2xs'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                        }`}
                        title="Bấm để chuyển đổi giữa Cốt món vs Bao bì mang về"
                      >
                        <span>🛍️</span>
                        <span className="hidden sm:inline">{bom.is_packaging ? 'Bao bì' : 'Cốt món'}</span>
                      </button>

                      {/* Quantity Input */}
                      <div className="flex items-center gap-1 w-28 shrink-0">
                        <input
                          type="number"
                          value={bom.quantity}
                          onChange={(e) => handleUpdateQuantity(idx, parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg font-mono font-bold text-xs"
                        />
                        <span className="text-[11px] text-stone-400 font-medium">
                          {mat?.recipe_unit || 'g'}
                        </span>
                      </div>

                      {/* Line Cost Preview */}
                      <div className="text-right w-20 shrink-0 font-bold text-stone-800 dark:text-stone-200 text-xs">
                        {formatCurrencyVND(lineCost)}
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleRemoveIngredient(idx)}
                        className="p-1 text-stone-400 hover:text-rose-500 transition-colors"
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

          {/* Smart Pricing Simulator Multi-Channel Matrix */}
          <div className="pt-2">
            <SmartPricingSimulator
              coreBomCost={coreCost}
              packagingCost={packagingCost}
              currentDineInPrice={selectedItem.price}
              currentTakeawayPrice={selectedItem.takeaway_price || selectedItem.price}
              currentDeliveryPrice={selectedItem.delivery_price || selectedItem.price}
              onApplyPrices={handleApplyPrices}
              onApplySinglePrice={handleApplySinglePrice}
            />
          </div>
        </div>

        {/* Footer Save Button */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between mt-4">
          <div className="flex flex-col gap-1">
            {priceNotice && (
              <span className="text-xs text-emerald-500 font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {priceNotice}
              </span>
            )}
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
          </div>

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

      {/* Mobile Modal for Editing BOM */}
      {isMobileBOMModalOpen && selectedItem && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileBOMModalOpen(false)}
          />
          <div className="relative w-full max-h-[92vh] bg-white dark:bg-stone-900 rounded-t-3xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  className="w-10 h-10 rounded-xl object-cover bg-stone-800 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shrink-0 ${
                        selectedItem.station === 'kitchen' ? 'bg-orange-500' : 'bg-cyan-600'
                      }`}
                    >
                      {selectedItem.station === 'kitchen' ? 'Bếp' : 'Bar'}
                    </span>
                    <h3 className="font-extrabold text-sm truncate text-white">
                      {selectedItem.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Giá niêm yết: <span className="font-bold text-amber-400">{formatCurrencyVND(selectedItem.price)}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsMobileBOMModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-stone-800 text-stone-300 flex items-center justify-center hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-stone-100 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-xs text-center shrink-0">
              <div className="p-2 bg-white dark:bg-stone-800 rounded-xl">
                <span className="text-stone-400 text-[10px] block">Giá vốn (COGS)</span>
                <span className="font-mono font-bold text-stone-900 dark:text-white mt-0.5 block">
                  {formatCurrencyVND(cogs)}
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-stone-800 rounded-xl">
                <span className="text-stone-400 text-[10px] block">Lợi nhuận gộp</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {formatCurrencyVND(grossProfit)}
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-stone-800 rounded-xl">
                <span className="text-stone-400 text-[10px] block">Biên LN</span>
                <span
                  className={`font-black mt-0.5 block ${
                    profitMargin >= 60 ? 'text-emerald-500' : profitMargin >= 40 ? 'text-amber-500' : 'text-rose-500'
                  }`}
                >
                  {profitMargin}%
                </span>
              </div>
            </div>

            {/* Ingredients Form */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-700 dark:text-stone-300">
                  Nguyên vật liệu cấu thành ({draftBOM.length})
                </span>
                <button
                  onClick={handleAddIngredient}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm nguyên liệu</span>
                </button>
              </div>

              {draftBOM.length === 0 ? (
                <div className="p-6 text-center text-stone-400 bg-stone-50 dark:bg-stone-800/40 rounded-xl">
                  Chưa có định mức BOM. Bấm &quot;Thêm nguyên liệu&quot; để thiết lập.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {draftBOM.map((bom, idx) => {
                    const mat = materials.find((m) => m.id === bom.raw_material_id);
                    const lineCost = mat ? mat.avg_cost * bom.quantity : 0;

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700/60 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <SearchableSelect
                              options={materialOptions}
                              value={bom.raw_material_id}
                              onChange={(val) => handleUpdateMaterial(idx, val)}
                              placeholder="-- Chọn nguyên liệu --"
                              searchPlaceholder="Gõ tên nguyên liệu..."
                              buttonClassName="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveIngredient(idx)}
                            className="p-2 text-stone-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/60 dark:border-stone-700/60 gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePackaging(idx)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shrink-0 ${
                              bom.is_packaging
                                ? 'bg-orange-500 text-white shadow-2xs'
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                            }`}
                          >
                            <span>🛍️</span>
                            <span>{bom.is_packaging ? 'Bao bì' : 'Cốt món'}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <span className="text-stone-400 text-[11px]">Định mức:</span>
                            <input
                              type="number"
                              value={bom.quantity}
                              onChange={(e) => handleUpdateQuantity(idx, parseFloat(e.target.value) || 0)}
                              className="w-16 px-1.5 py-1 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg font-mono font-bold text-xs"
                            />
                            <span className="text-stone-400 font-medium">
                              {mat?.recipe_unit || 'g'}
                            </span>
                          </div>

                          <div className="font-bold text-stone-800 dark:text-stone-200 font-mono text-xs">
                            {formatCurrencyVND(lineCost)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mobile Smart Pricing Simulator */}
              <div className="pt-2">
                <SmartPricingSimulator
                  coreBomCost={coreCost}
                  packagingCost={packagingCost}
                  currentDineInPrice={selectedItem.price}
                  currentTakeawayPrice={selectedItem.takeaway_price || selectedItem.price}
                  currentDeliveryPrice={selectedItem.delivery_price || selectedItem.price}
                  onApplyPrices={handleApplyPrices}
                  onApplySinglePrice={handleApplySinglePrice}
                  compact={true}
                />
              </div>
            </div>

            {/* Bottom Sheet Actions */}
            <div className="p-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-stone-400 truncate">
                {isSaved ? (
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Đã lưu thành công!
                  </span>
                ) : (
                  'Tự động trừ kho theo định mức'
                )}
              </span>

              <button
                onClick={handleSaveBOM}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Định Mức BOM</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
