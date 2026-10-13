'use client';

import React, { useState, useMemo } from 'react';
import { MenuItem, MenuItemModifier } from '@/types';
import { formatCurrencyVND } from '@/lib/utils';
import { X, Plus, Minus, Flame, Wine, Check } from 'lucide-react';

interface ModifierModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    selectedModifiers: MenuItemModifier[],
    notes: string
  ) => void;
}

export const ModifierModal: React.FC<ModifierModalProps> = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<MenuItemModifier[]>([]);
  const [notes, setNotes] = useState('');

  // Group modifiers by group_name
  const groupedModifiers = useMemo(() => {
    if (!item?.modifiers) return {};
    const groups: Record<string, MenuItemModifier[]> = {};
    item.modifiers.forEach((mod) => {
      if (!groups[mod.group_name]) {
        groups[mod.group_name] = [];
      }
      groups[mod.group_name].push(mod);
    });
    return groups;
  }, [item]);

  // Reset state on open
  React.useEffect(() => {
    if (item && isOpen) {
      setQuantity(1);
      setNotes('');
      // Set defaults for single-choice groups (e.g. first item of "Mức đá", "Mức đường", "Độ chín")
      const defaults: MenuItemModifier[] = [];
      if (item.modifiers) {
        const groups: Record<string, MenuItemModifier[]> = {};
        item.modifiers.forEach((m) => {
          if (!groups[m.group_name]) groups[m.group_name] = [];
          groups[m.group_name].push(m);
        });

        Object.entries(groups).forEach(([groupName, mods]) => {
          if (groupName !== 'Topping' && mods.length > 0) {
            defaults.push(mods[0]);
          }
        });
      }
      setSelectedModifiers(defaults);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  // Toggle modifier selection
  const handleToggleModifier = (modifier: MenuItemModifier, isMulti: boolean) => {
    if (isMulti) {
      // Checkbox behavior
      setSelectedModifiers((prev) => {
        const exists = prev.some((m) => m.id === modifier.id);
        if (exists) {
          return prev.filter((m) => m.id !== modifier.id);
        } else {
          return [...prev, modifier];
        }
      });
    } else {
      // Radio behavior (replace modifier with same group_name)
      setSelectedModifiers((prev) => {
        const filtered = prev.filter((m) => m.group_name !== modifier.group_name);
        return [...filtered, modifier];
      });
    }
  };

  const isSelected = (modId: string) => selectedModifiers.some((m) => m.id === modId);

  // Calculate unit price and total price
  const modifiersPrice = selectedModifiers.reduce((sum, m) => sum + m.price_adjustment, 0);
  const unitPrice = item.price + modifiersPrice;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    onAddToCart(item, quantity, selectedModifiers, notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="relative p-5 border-b border-stone-100 dark:border-stone-800 flex items-start gap-4">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-20 h-20 rounded-xl object-cover bg-stone-100 dark:bg-stone-800 shrink-0"
          />
          <div className="flex-1 pr-6">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${
                  item.station === 'kitchen' ? 'bg-orange-500' : 'bg-cyan-600'
                }`}
              >
                {item.station === 'kitchen' ? <Flame className="w-2.5 h-2.5" /> : <Wine className="w-2.5 h-2.5" />}
                {item.station === 'kitchen' ? 'Bếp' : 'Quầy Bar'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white leading-tight">
              {item.name}
            </h2>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-1">
              {formatCurrencyVND(item.price)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Modifiers Sections */}
          {Object.entries(groupedModifiers).map(([groupName, mods]) => {
            const isMultiSelect = groupName === 'Topping';

            return (
              <div key={groupName} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    {groupName}
                  </h4>
                  <span className="text-[11px] text-stone-400">
                    {isMultiSelect ? 'Chọn nhiều' : 'Chọn 1'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mods.map((mod) => {
                    const active = isSelected(mod.id);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => handleToggleModifier(mod, isMultiSelect)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                          active
                            ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 shadow-xs'
                            : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                              active
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'border-stone-300 dark:border-stone-600'
                            }`}
                          >
                            {active && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{mod.name}</span>
                        </div>
                        {mod.price_adjustment > 0 && (
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            +{formatCurrencyVND(mod.price_adjustment)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Special Instructions Note */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Ghi chú riêng cho món
            </label>
            <input
              type="text"
              placeholder="VD: Không lấy đá, ít cay, ăn kèm rau..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-stone-400"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-4">
          {/* Quantity Selector */}
          <div className="flex items-center bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-bold text-sm text-stone-900 dark:text-white">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-md shadow-amber-500/20"
          >
            <span>Thêm vào đơn</span>
            <span>•</span>
            <span className="font-bold">{formatCurrencyVND(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
