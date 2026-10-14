'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Category,
  MenuItem,
  RestaurantTable,
  CartItem,
  MenuItemModifier,
  StationType,
  Zone,
} from '@/types';
import { initialCategories } from '@/database/mockData';
import { menuService } from '@/services/menuService';
import { orderService } from '@/services/orderService';
import { realtimeEngine } from '@/services/realtimeEngine';
import { CategoryNav } from './CategoryNav';
import { MenuGrid } from './MenuGrid';
import { ModifierModal } from './ModifierModal';
import { CartSidebar } from './CartSidebar';
import { TableSelector } from './TableSelector';
import { playReadySound } from '@/lib/audioAlert';
import {
  ShoppingBag,
  ChevronRight,
  ChevronDown,
  MapPin,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { formatCurrencyVND } from '@/lib/utils';

export const FOHView: React.FC = () => {
  // Data Sources
  const [categories, setCategories] = useState<Category[]>(() => menuService.getCategories());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => menuService.getMenuItems());
  const [tables, setTables] = useState<RestaurantTable[]>(() => orderService.getTables());
  const [zones, setZones] = useState<Zone[]>(() => orderService.getZones());

  const refreshMenuItems = useCallback(() => {
    setMenuItems(menuService.getMenuItems());
    setCategories(menuService.getCategories());
  }, []);

  const refreshTablesAndZones = useCallback(() => {
    setTables(orderService.getTables());
    setZones(orderService.getZones());
  }, []);

  useEffect(() => {
    refreshMenuItems();
    refreshTablesAndZones();

    // Tự động kéo dữ liệu thực tế từ Supabase Cloud (đảm bảo điện thoại có ngay món mới tạo từ máy tính)
    menuService.syncFromSupabase().then(() => {
      refreshMenuItems();
    });

    const unsubOrder = realtimeEngine.subscribe('ORDER_UPDATED', () => {
      refreshMenuItems();
    });

    const unsubTable = realtimeEngine.subscribe('TABLE_STATUS_CHANGED', () => {
      refreshTablesAndZones();
    });

    // Lắng nghe khi Bếp/Bar hoàn thành món -> Chuông Ting thanh thoát cho phục vụ
    const unsubItemReady = realtimeEngine.subscribe<{ orderId: string; item: any }>(
      'ITEM_STATUS_CHANGED',
      (payload) => {
        if (payload?.item?.item_status === 'ready') {
          playReadySound();
        }
      }
    );

    return () => {
      unsubOrder();
      unsubTable();
      unsubItemReady();
    };
  }, [refreshMenuItems, refreshTablesAndZones]);

  // Filters State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<StationType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal State
  const [activeItemForModal, setActiveItemForModal] = useState<MenuItem | null>(null);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(() => {
    const all = orderService.getTables();
    return all.find((t) => t.status === 'available' || t.status === 'reserved') || null;
  });
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Find active zone for selected table
  const selectedZone = selectedTable?.zone_id
    ? zones.find((z) => z.id === selectedTable.zone_id)
    : undefined;

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category match
      if (selectedCategoryId && item.category_id !== selectedCategoryId) {
        return false;
      }
      // Station match
      if (selectedStation !== 'all' && item.station !== selectedStation) {
        return false;
      }
      // Search query match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategoryId, selectedStation, searchQuery]);

  // Click on menu item handler
  const handleSelectItem = (item: MenuItem) => {
    setActiveItemForModal(item);
    setIsModifierModalOpen(true);
  };

  // Add customized item to cart
  const handleAddToCart = (
    item: MenuItem,
    quantity: number,
    selectedModifiers: MenuItemModifier[],
    notes: string
  ) => {
    const modifierIds = selectedModifiers.map((m) => m.id).sort().join('-');
    const cartItemId = `${item.id}_${modifierIds}_${notes.trim()}`;

    const modifiersPrice = selectedModifiers.reduce((sum, m) => sum + m.price_adjustment, 0);
    const unitPrice = item.price + modifiersPrice;
    const totalPrice = unitPrice * quantity;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          total_price: existing.unit_price * newQty,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          menuItem: item,
          quantity,
          selected_modifiers: selectedModifiers,
          unit_price: unitPrice,
          total_price: totalPrice,
          notes,
        };
        return [...prev, newItem];
      }
    });
  };

  // Update item quantity
  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              total_price: item.unit_price * newQty,
            };
          }
          return item;
        })
        .filter((i): i is CartItem => i !== null);
    });
  };

  // Remove item
  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  // Clear cart
  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const totalCartPrice = cartItems.reduce((s, i) => s + i.total_price, 0);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* Main Column: Menu Browsing & Filtering (Full width on Mobile, Flexible on Desktop) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="px-4 sm:px-6 py-3.5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-base sm:text-lg font-black tracking-tight text-stone-900 dark:text-white truncate">
                VIBE TASTE POS <span className="text-amber-500 font-normal hidden sm:inline">| Đặt Món Trực Quan</span>
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-400 mt-0.5 truncate hidden xs:block">
              Phân hệ Phục vụ & Khách hàng (Front-of-House)
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Smart Table Indicator Button (KiotViet Inspiration) */}
            <button
              type="button"
              onClick={() => setIsTableModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-black active:scale-95 transition-all shadow-2xs cursor-pointer"
              title="Bấm để chọn hoặc đổi bàn phục vụ"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              {selectedTable ? (
                <span className="flex items-center gap-1">
                  <span className="hidden sm:inline font-bold text-stone-500 dark:text-stone-400">
                    {selectedZone ? `${selectedZone.name} •` : ''}
                  </span>
                  <span>Bàn {selectedTable.table_number}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                      selectedTable.status === 'reserved'
                        ? 'bg-purple-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {selectedTable.status === 'reserved' ? 'Đã đặt' : 'Trống'}
                  </span>
                </span>
              ) : (
                <span className="text-rose-500 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Chọn bàn</span>
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* Mobile Header Quick Cart Icon */}
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="md:hidden relative p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-amber-500 active:scale-95 transition-all cursor-pointer"
              title="Mở giỏ hàng"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shadow-2xs">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Menu Content (Extra bottom padding on mobile for Floating Cart Bar & Fixed Bottom Nav) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-44 md:pb-6">
          <CategoryNav
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedStation={selectedStation}
            onStationChange={setSelectedStation}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          <MenuGrid items={filteredItems} onSelectItem={handleSelectItem} viewMode={viewMode} />
        </div>

        {/* Mobile Fixed Floating Cart Bar: elevated to bottom-16 above the Thumb-Friendly Bottom Nav */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 p-2.5 sm:p-3 shadow-2xl">
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            {/* Left side: Cart Info & Total */}
            <div
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 active:opacity-80 transition-opacity"
            >
              <div className="relative w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30 shrink-0">
                <ShoppingBag className="w-5 h-5" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-stone-900 shadow-2xs tabular-nums">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium truncate">
                  {totalCartCount > 0 ? (
                    <span><strong className="tabular-nums">{totalCartCount}</strong> món • Bàn {selectedTable?.table_number || '?'}</span>
                  ) : (
                    <span>Giỏ hàng đang trống</span>
                  )}
                </div>
                <div className="text-sm font-black text-stone-900 dark:text-white truncate tabular-nums">
                  {formatCurrencyVND(totalCartPrice)}
                </div>
              </div>
            </div>

            {/* Right side: Open Cart Drawer Button */}
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 text-xs font-black flex items-center gap-1.5 active:scale-95 shadow-md transition-all shrink-0 cursor-pointer"
            >
              <span>Xem Giỏ Hàng</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Cart Sidebar (Desktop & Tablet Landscape md: and above) */}
      <div className="hidden md:block w-80 lg:w-96 xl:w-[420px] h-full shrink-0">
        <CartSidebar
          items={cartItems}
          tables={tables}
          selectedTable={selectedTable}
          onSelectTable={setSelectedTable}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
        />
      </div>

      {/* Mobile Cart Drawer (Slide-in Drawer with Close Button X) */}
      {isMobileCartOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileCartOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-md h-full z-10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <CartSidebar
              items={cartItems}
              tables={tables}
              selectedTable={selectedTable}
              onSelectTable={(table) => {
                setSelectedTable(table);
              }}
              onTableSelected={() => {
                // Auto-collapse / close cart drawer when table is picked on mobile!
                setIsMobileCartOpen(false);
              }}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onClose={() => setIsMobileCartOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Dedicated Smart Table Selector Modal (Triggered by Top Header Button) */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-5 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                    Chọn Bàn Phục Vụ
                  </h3>
                  <p className="text-xs text-stone-400">
                    Chọn khu vực và bàn ăn để lên order
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTableModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <TableSelector
              tables={tables}
              selectedTableId={selectedTable?.id || null}
              onSelectTable={(table) => {
                setSelectedTable(table);
                // Auto close modal immediately so staff can start tapping items on MenuGrid!
                setIsTableModalOpen(false);
              }}
              collapsible={false}
            />
          </div>
        </div>
      )}

      {/* Modifier Customizer Modal */}
      <ModifierModal
        item={activeItemForModal}
        isOpen={isModifierModalOpen}
        onClose={() => setIsModifierModalOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};
