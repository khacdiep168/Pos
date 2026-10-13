'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Category,
  MenuItem,
  RestaurantTable,
  CartItem,
  MenuItemModifier,
  StationType,
} from '@/types';
import { initialCategories } from '@/database/mockData';
import { menuService } from '@/services/menuService';
import { orderService } from '@/services/orderService';
import { realtimeEngine } from '@/services/realtimeEngine';
import { CategoryNav } from './CategoryNav';
import { MenuGrid } from './MenuGrid';
import { ModifierModal } from './ModifierModal';
import { CartSidebar } from './CartSidebar';
import { ShoppingBag, ChevronRight, Sparkles } from 'lucide-react';
import { formatCurrencyVND } from '@/lib/utils';

export const FOHView: React.FC = () => {
  // Data Sources
  const [categories] = useState<Category[]>(initialCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => menuService.getMenuItems());
  const [tables, setTables] = useState<RestaurantTable[]>(() => orderService.getTables());

  const refreshMenuItems = useCallback(() => {
    setMenuItems(menuService.getMenuItems());
  }, []);

  const refreshTables = useCallback(() => {
    setTables(orderService.getTables());
  }, []);

  useEffect(() => {
    refreshMenuItems();
    refreshTables();

    const unsubOrder = realtimeEngine.subscribe('ORDER_UPDATED', () => {
      refreshMenuItems();
    });

    const unsubTable = realtimeEngine.subscribe('TABLE_STATUS_CHANGED', () => {
      refreshTables();
    });

    return () => {
      unsubOrder();
      unsubTable();
    };
  }, [refreshMenuItems, refreshTables]);

  // Filters State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<StationType | 'all'>('all');

  // Modal State
  const [activeItemForModal, setActiveItemForModal] = useState<MenuItem | null>(null);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(() => {
    const all = orderService.getTables();
    return all.find((t) => t.status === 'available' || t.status === 'reserved') || null;
  });
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

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
    // If has modifiers, open modal; otherwise open modal too so user can choose qty/notes
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
      {/* Left Column: Menu Browsing & Filtering */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="px-6 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-lg font-black tracking-tight text-stone-900 dark:text-white">
                VIBE TASTE POS <span className="text-amber-500 font-normal">| Đặt Món Trực Quan</span>
              </h1>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Phân hệ Khách hàng & Nhân viên phục vụ (Front-of-House)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Table indicator (mobile and desktop) */}
            {selectedTable && (
              <button
                onClick={() => setIsMobileCartOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold active:scale-95 transition-transform"
                title="Bấm để xem giỏ hàng / đổi bàn"
              >
                <span className="hidden xs:inline">Bàn:</span>
                <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-md text-[11px]">
                  {selectedTable.table_number}
                </span>
              </button>
            )}

            {/* Mobile quick cart icon */}
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="lg:hidden relative p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-amber-500"
              title="Mở giỏ hàng"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Menu Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <CategoryNav
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedStation={selectedStation}
            onStationChange={setSelectedStation}
          />

          <MenuGrid items={filteredItems} onSelectItem={handleSelectItem} />
        </div>
      </div>

      {/* Right Column: Cart Sidebar (Desktop) */}
      <div className="hidden lg:block w-96 xl:w-[420px] h-full shrink-0">
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

      {/* Mobile Floating Cart Button */}
      {totalCartCount > 0 && (
        <div className="lg:hidden fixed bottom-5 left-4 right-4 z-40">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full py-3.5 px-5 bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 font-bold rounded-2xl shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 dark:bg-stone-950 text-white dark:text-white text-xs flex items-center justify-center font-bold">
                {totalCartCount}
              </span>
              <span>Xem giỏ order</span>
            </div>
            <div className="flex items-center gap-2 font-extrabold">
              <span>{formatCurrencyVND(totalCartPrice)}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Cart Drawer */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileCartOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-md h-full z-10">
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
