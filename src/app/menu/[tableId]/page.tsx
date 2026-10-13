'use client';

import React, { useState, useEffect, use } from 'react';
import {
  MenuItem,
  Category,
  RestaurantTable,
  CartItem,
  Order,
  OrderItem,
  Zone,
  MenuItemModifier,
} from '@/types';
import { orderService } from '@/services/orderService';
import { menuService } from '@/services/menuService';
import { realtimeEngine } from '@/services/realtimeEngine';
import { formatCurrencyVND } from '@/lib/utils';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  ShoppingBag,
  Sparkles,
  Clock,
  CheckCircle2,
  ChefHat,
  Flame,
  Wine,
  Wifi,
  BellRing,
  ArrowLeft,
  X,
  MapPin,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Suspense } from 'react';

interface PageProps {
  params: Promise<{ tableId: string }>;
}

function CustomerSelfOrderContent({ params }: PageProps) {
  const unwrappedParams = use(params);
  const tableId = unwrappedParams.tableId;

  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedMenuItemForModal, setSelectedMenuItemForModal] = useState<MenuItem | null>(null);

  // Modifier Customization in modal
  const [selectedModifiers, setSelectedModifiers] = useState<MenuItemModifier[]>([]);
  const [itemNotes, setItemNotes] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  // Active / Submitted Order State for Tracking
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderSentSuccess, setOrderSentSuccess] = useState(false);
  const [callStaffSuccess, setCallStaffSuccess] = useState(false);

  // Load Initial Data
  const loadInitialData = () => {
    const allTables = orderService.getTables();
    const currentTable = allTables.find((t) => t.id === tableId || t.table_number.toLowerCase() === tableId.toLowerCase()) || {
      id: tableId,
      table_number: `Bàn ${tableId.replace(/[^0-9]/g, '') || '01'}`,
      capacity: 4,
      status: 'available',
    };
    setTable(currentTable);

    if (currentTable.zone_id) {
      const allZones = orderService.getZones();
      const z = allZones.find((item) => item.id === currentTable.zone_id);
      setZone(z || null);
    }

    const items = menuService.getMenuItems().filter((m: MenuItem) => m.is_available);
    setMenuItems(items);

    const cats = menuService.getCategories();
    setCategories(cats);

    // Check if table currently has an active order
    const existingOrder = orderService.getOrderByTableId(currentTable.id);
    if (existingOrder) {
      setActiveOrder(existingOrder);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Subscribe to order status updates
    const unsubOrderUpdated = realtimeEngine.subscribe('ORDER_UPDATED', (updated: Order) => {
      if (updated && table && updated.table_id === table.id) {
        if (updated.payment_status === 'paid' || updated.order_status === 'cancelled') {
          setActiveOrder(null);
        } else {
          setActiveOrder(updated);
        }
      }
    });

    const unsubPayment = realtimeEngine.subscribe('PAYMENT_COMPLETED', (payload: { table: RestaurantTable }) => {
      if (payload && payload.table && payload.table.id === tableId) {
        setActiveOrder(null);
        setOrderSentSuccess(false);
      }
    });

    return () => {
      unsubOrderUpdated();
      unsubPayment();
    };
  }, [tableId]);

  // Filter Menu
  const filteredMenuItems = menuItems.filter((m) => {
    if (selectedCategoryId !== 'all' && m.category_id !== selectedCategoryId) return false;
    if (searchQuery.trim()) {
      return (
        m.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    }
    return true;
  });

  // Open Modifier Customization
  const handleOpenCustomize = (item: MenuItem) => {
    setSelectedMenuItemForModal(item);
    setSelectedModifiers([]);
    setItemNotes('');
    setItemQuantity(1);
  };

  // Add Item to Cart
  const handleAddToCart = () => {
    if (!selectedMenuItemForModal) return;

    const modifierPriceAdj = selectedModifiers.reduce((s, m) => s + m.price_adjustment, 0);
    const unitPrice = selectedMenuItemForModal.price + modifierPriceAdj;
    const totalPrice = unitPrice * itemQuantity;

    const newCartItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menuItem: selectedMenuItemForModal,
      quantity: itemQuantity,
      selected_modifiers: [...selectedModifiers],
      unit_price: unitPrice,
      total_price: totalPrice,
      notes: itemNotes.trim(),
    };

    setCartItems((prev) => [...prev, newCartItem]);
    setSelectedMenuItemForModal(null);
  };

  // Update Cart Quantity
  const handleUpdateCartQty = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return {
              ...item,
              quantity: newQty,
              total_price: item.unit_price * newQty,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Total Calculations
  const totalCartQty = cartItems.reduce((s, it) => s + it.quantity, 0);
  const cartSubtotal = cartItems.reduce((s, it) => s + it.total_price, 0);
  const cartTax = Math.round(cartSubtotal * 0.08);
  const cartTotal = cartSubtotal + cartTax;

  // Send Order to Kitchen/Bar
  const handleSendOrderToKitchen = () => {
    if (cartItems.length === 0 || !table) return;

    const now = new Date().toISOString();
    const orderId = `ord-${Date.now().toString().slice(-6)}`;

    const orderItems: OrderItem[] = cartItems.map((c, index) => ({
      id: `item-${Date.now()}-${index}`,
      order_id: orderId,
      menu_item_id: c.menuItem.id,
      menu_item_name: c.menuItem.name,
      quantity: c.quantity,
      price: c.unit_price,
      notes: c.notes || undefined,
      selected_modifiers: c.selected_modifiers,
      item_status: 'pending',
      station: c.menuItem.station,
      created_at: now,
    }));

    const newOrder: Order = {
      id: orderId,
      table_id: table.id,
      table_number: table.table_number,
      order_status: 'pending',
      payment_status: 'unpaid',
      subtotal: cartSubtotal,
      discount_amount: 0,
      tax_amount: cartTax,
      total_amount: cartTotal,
      notes: 'Khách tự order tại bàn qua QR Code Mobile',
      items: orderItems,
      created_at: now,
      updated_at: now,
    };

    // Dispatch via orderService -> Emits ORDER_CREATED Realtime!
    const created = orderService.createOrder(newOrder);

    setActiveOrder(created);
    setCartItems([]);
    setIsCartOpen(false);
    setOrderSentSuccess(true);
  };

  // Call Staff Chime
  const handleCallStaff = () => {
    setCallStaffSuccess(true);
    realtimeEngine.emit('CALL_WAITER', { tableNumber: table?.table_number, tableId: table?.id });
    setTimeout(() => setCallStaffSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 max-w-md mx-auto shadow-2xl relative select-none">
      {/* Top Mobile App Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 p-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-2xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-sm text-stone-900 dark:text-white leading-tight">
                  {table?.table_number || 'Bàn Đang Chọn'}
                </h1>
                {zone && (
                  <span className="px-1.5 py-0.2 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 text-[10px] font-semibold">
                    {zone.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400 font-medium">Vibe Taste & Bistro • Self-Order</p>
            </div>
          </div>

          {/* Quick Actions: Call Staff & Wi-Fi */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCallStaff}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs ${
                callStaffSuccess
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white'
              }`}
              title="Gọi nhân viên phục vụ"
            >
              <BellRing className="w-4 h-4 animate-bounce" />
              <span className="text-[10px]">{callStaffSuccess ? 'Đã gọi!' : 'Gọi bàn'}</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-2.5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm món ăn, đồ uống, tráng miệng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40 border border-transparent"
          />
        </div>

        {/* Category Filter Pills Horizontal Scroll */}
        <div className="flex items-center gap-2 mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategoryId === 'all'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategoryId(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategoryId === c.id
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
              }`}
            >
              {c.icon && <span className="mr-1">{c.icon}</span>}
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 p-3.5 pb-28 space-y-3">
        {/* Banner theo dõi đơn đã gửi (Nếu có) */}
        {activeOrder && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-emerald-600 animate-spin" />
                <div>
                  <h4 className="font-extrabold text-xs text-emerald-800 dark:text-emerald-300">
                    Bếp Đang Nấu Cho Bàn (#{activeOrder.id.slice(-6)})
                  </h4>
                  <p className="text-[10px] text-stone-500">
                    Trạng thái: <span className="font-bold uppercase text-emerald-600">{activeOrder.order_status}</span> • {activeOrder.items.length} món
                  </p>
                </div>
              </div>
              <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-300">
                {formatCurrencyVND(activeOrder.total_amount)}
              </span>
            </div>

            <div className="divide-y divide-emerald-500/10 text-[11px] pt-1">
              {activeOrder.items.map((it) => (
                <div key={it.id} className="py-1 flex items-center justify-between">
                  <span>{it.quantity}x {it.menu_item_name}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    it.item_status === 'ready' ? 'bg-emerald-500 text-white' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  }`}>
                    {it.item_status === 'ready' ? 'Đã xong' : it.item_status === 'cooking' ? 'Đang làm' : 'Chờ làm'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items List */}
        <div className="space-y-3">
          {filteredMenuItems.map((item) => {
            const isFood = item.station === 'kitchen';
            return (
              <div
                key={item.id}
                onClick={() => handleOpenCustomize(item)}
                className="p-3 bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl flex items-center gap-3 shadow-2xs active:scale-98 transition-all cursor-pointer hover:border-amber-500/40"
              >
                {/* Food Image */}
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover shrink-0 bg-stone-100 dark:bg-stone-800"
                />

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        isFood ? 'bg-orange-500/10 text-orange-600' : 'bg-cyan-500/10 text-cyan-600'
                      }`}>
                        {isFood ? 'Bếp' : 'Bar'}
                      </span>
                      <h3 className="font-extrabold text-xs text-stone-900 dark:text-white truncate">
                        {item.name}
                      </h3>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5 font-normal">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-extrabold text-xs text-amber-600 dark:text-amber-400 font-mono">
                      {formatCurrencyVND(item.price)}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCustomize(item);
                      }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs active:scale-90 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Chọn món</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-3 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-stone-400 font-bold uppercase">
                {totalCartQty} món đang chọn
              </div>
              <div className="font-black text-base text-amber-600 dark:text-amber-400 font-mono">
                {formatCurrencyVND(cartTotal)}
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Xem Giỏ Hàng & Gửi Bếp</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL TÙY BIẾN MÓN (Modifier & Notes) */}
      {selectedMenuItemForModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-black text-sm text-stone-900 dark:text-white">
                  {selectedMenuItemForModal.name}
                </h3>
                <span className="font-mono font-bold text-amber-600 text-xs">
                  {formatCurrencyVND(selectedMenuItemForModal.price)}
                </span>
              </div>
              <button
                onClick={() => setSelectedMenuItemForModal(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modifiers List (Nếu có) */}
            {selectedMenuItemForModal.modifiers && selectedMenuItemForModal.modifiers.length > 0 && (
              <div className="space-y-2 text-xs">
                <label className="font-bold text-stone-700 dark:text-stone-300 block">
                  Tùy chọn thêm (Topping / Độ chín / Đường đá):
                </label>
                <div className="space-y-1.5">
                  {selectedMenuItemForModal.modifiers.map((mod) => {
                    const isSelected = selectedModifiers.some((m) => m.id === mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedModifiers((prev) => prev.filter((m) => m.id !== mod.id));
                          } else {
                            setSelectedModifiers((prev) => [...prev, mod]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 font-bold'
                            : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <span>{mod.name}</span>
                        <span className="font-mono text-[11px]">
                          {mod.price_adjustment > 0 ? `+${formatCurrencyVND(mod.price_adjustment)}` : 'Miễn phí'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ghi chú món */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-stone-700 dark:text-stone-300 block">
                Ghi chú cho bếp/bar:
              </label>
              <input
                type="text"
                placeholder="VD: Không cay, ít ngọt, nhiều đá..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
              />
            </div>

            {/* Quantity Selector & Add Button */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-stone-700 flex items-center justify-center font-bold text-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-sm w-6 text-center">{itemQuantity}</span>
                <button
                  type="button"
                  onClick={() => setItemQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-stone-700 flex items-center justify-center font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                Thêm vào giỏ (
                {formatCurrencyVND(
                  (selectedMenuItemForModal.price +
                    selectedModifiers.reduce((s, m) => s + m.price_adjustment, 0)) *
                    itemQuantity
                )}
                )
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER / SHEET */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-t-3xl max-w-md w-full p-5 border-t border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-white">
                  Đơn Hàng Của Bàn ({table?.table_number})
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-60 overflow-y-auto pr-1">
              {cartItems.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold text-stone-900 dark:text-white">
                      {c.menuItem.name}
                    </div>
                    {c.selected_modifiers.length > 0 && (
                      <div className="text-[10px] text-stone-400">
                        + {c.selected_modifiers.map((m) => m.name).join(', ')}
                      </div>
                    )}
                    {c.notes && (
                      <div className="text-[10px] text-amber-600 italic">
                        Ghi chú: {c.notes}
                      </div>
                    )}
                    <div className="font-mono text-stone-500 text-[11px] mt-0.5">
                      {formatCurrencyVND(c.unit_price)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
                      <button
                        onClick={() => handleUpdateCartQty(c.id, -1)}
                        className="w-6 h-6 rounded bg-white dark:bg-stone-700 flex items-center justify-center font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold w-4 text-center">{c.quantity}</span>
                      <button
                        onClick={() => handleUpdateCartQty(c.id, 1)}
                        className="w-6 h-6 rounded bg-white dark:bg-stone-700 flex items-center justify-center font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleUpdateCartQty(c.id, -c.quantity)}
                      className="p-1.5 text-stone-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Tạm tính:</span>
                <span className="font-mono">{formatCurrencyVND(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Thuế VAT (8%):</span>
                <span className="font-mono">{formatCurrencyVND(cartTax)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-stone-900 dark:text-white pt-1 border-t border-stone-200 dark:border-stone-800">
                <span>Tổng cộng:</span>
                <span className="font-mono text-base text-amber-600 dark:text-amber-400">
                  {formatCurrencyVND(cartTotal)}
                </span>
              </div>
            </div>

            {/* Send Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSendOrderToKitchen}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Flame className="w-4 h-4" />
                <span>GỬI BẾP & QUẦY BAR NGAY</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerSelfOrderPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-100 dark:bg-stone-950 text-stone-600 dark:text-stone-300">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
          <p className="text-xs font-bold">Đang tải thực đơn của bàn...</p>
        </div>
      }
    >
      <CustomerSelfOrderContent params={params} />
    </Suspense>
  );
}
