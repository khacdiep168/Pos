import React, { useState } from 'react';
import { CartItem, RestaurantTable, Order, OrderItem, Promotion, Customer } from '@/types';
import { formatCurrencyVND } from '@/lib/utils';
import { TableSelector } from './TableSelector';
import { orderService } from '@/services/orderService';
import { promotionService } from '@/services/promotionService';
import { customerService } from '@/services/customerService';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Send,
  Flame,
  Wine,
  CheckCircle,
  Receipt,
  Tag,
  Ticket,
  X,
  UserCheck,
  UserPlus,
  Phone,
  Search,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';

interface CartSidebarProps {
  items: CartItem[];
  tables: RestaurantTable[];
  selectedTable: RestaurantTable | null;
  onSelectTable: (table: RestaurantTable) => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onClose?: () => void;
  onTableSelected?: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  items,
  tables,
  selectedTable,
  onSelectTable,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onClose,
  onTableSelected,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [isAddonSuccess, setIsAddonSuccess] = useState(false);
  const [showExistingItems, setShowExistingItems] = useState(false);

  // Check if selected table already has an active unpaid order (Add-on Order scenario)
  const activeExistingOrder = selectedTable
    ? orderService.getOrderByTableId(selectedTable.id)
    : null;

  // Customer CRM State
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [attachedCustomer, setAttachedCustomer] = useState<Customer | null>(null);
  const [customerLookupMsg, setCustomerLookupMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [showAddCustomerQuick, setShowAddCustomerQuick] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState('');

  // Promotion Voucher State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [showVoucherList, setShowVoucherList] = useState(false);

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);

  // Calculate discount amount based on applied promo
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discount_type === 'percent') {
      discountAmount = Math.round(subtotal * (appliedPromo.discount_value / 100));
    } else {
      discountAmount = Math.min(appliedPromo.discount_value, subtotal);
    }
  }

  const taxRate = 0.08; // 8% VAT
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableAmount * taxRate);
  const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

  // Active promotions available
  const availablePromos = promotionService.getActivePromotions();

  const handleApplyPromo = (code: string) => {
    if (!code.trim()) {
      setPromoMessage({ text: 'Vui lòng nhập mã ưu đãi!', isError: true });
      return;
    }
    const res = promotionService.applyPromotion(code, subtotal);
    if (res.success && res.promo) {
      setAppliedPromo(res.promo);
      setPromoMessage({ text: res.message, isError: false });
      setPromoCodeInput('');
      setShowVoucherList(false);
    } else {
      setPromoMessage({ text: res.message, isError: true });
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoMessage(null);
  };

  const handleLookupCustomer = (phoneToSearch?: string) => {
    const p = (phoneToSearch !== undefined ? phoneToSearch : customerPhoneInput).trim();
    if (!p) {
      setCustomerLookupMsg(null);
      return;
    }
    const found = customerService.getCustomerByPhone(p);
    if (found) {
      setAttachedCustomer(found);
      setCustomerLookupMsg({ text: `Đã gắn: ${found.name} (${(found.membership_tier || 'bronze').toUpperCase()})`, isError: false });
      setShowAddCustomerQuick(false);
    } else {
      setCustomerLookupMsg({ text: 'Chưa có thông tin. Có thể tạo mới!', isError: true });
      setShowAddCustomerQuick(true);
    }
  };

  const handleCreateQuickCustomer = () => {
    if (!quickCustomerName.trim() || !customerPhoneInput.trim()) return;
    const newCust = customerService.addCustomer({
      name: quickCustomerName.trim(),
      phone: customerPhoneInput.trim(),
    });
    setAttachedCustomer(newCust);
    setShowAddCustomerQuick(false);
    setQuickCustomerName('');
    setCustomerLookupMsg({ text: `Đã tạo & gắn: ${newCust.name}`, isError: false });
  };

  const handleRemoveCustomer = () => {
    setAttachedCustomer(null);
    setCustomerPhoneInput('');
    setCustomerLookupMsg(null);
    setShowAddCustomerQuick(false);
  };

  const handleSendOrder = () => {
    if (!selectedTable) {
      alert('Vui lòng chọn số bàn trước khi gửi order!');
      return;
    }
    if (items.length === 0) {
      alert('Giỏ hàng đang trống!');
      return;
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();

    if (activeExistingOrder) {
      // LUỒNG 1: KHÁCH GỌI THÊM MÓN (ADD-ON ORDER) VÀO BÀN HIỆN TẠI
      const newItems: OrderItem[] = items.map((cartItem, index) => ({
        id: `item-addon-${Date.now()}-${index + 1}`,
        order_id: activeExistingOrder.id,
        menu_item_id: cartItem.menuItem.id,
        menu_item_name: cartItem.menuItem.name,
        quantity: cartItem.quantity,
        price: cartItem.unit_price,
        notes: cartItem.notes,
        selected_modifiers: cartItem.selected_modifiers,
        item_status: 'pending',
        station: cartItem.menuItem.station,
        created_at: now,
      }));

      const updated = orderService.appendItemsToOrder(activeExistingOrder.id, newItems);

      setTimeout(() => {
        setIsSubmitting(false);
        setIsAddonSuccess(true);
        setSuccessOrder(updated || activeExistingOrder);
        setAttachedCustomer(null);
        setCustomerPhoneInput('');
        setCustomerLookupMsg(null);
        setShowAddCustomerQuick(false);
        onClearCart();
      }, 400);
    } else {
      // LUỒNG 2: MỞ ĐƠN HÀNG MỚI CHO BÀN TRỐNG / ĐƠN MANG VỀ
      const orderId = `ord-${Date.now()}`;
      const orderItems: OrderItem[] = items.map((cartItem, index) => ({
        id: `item-${orderId}-${index + 1}`,
        order_id: orderId,
        menu_item_id: cartItem.menuItem.id,
        menu_item_name: cartItem.menuItem.name,
        quantity: cartItem.quantity,
        price: cartItem.unit_price,
        notes: cartItem.notes,
        selected_modifiers: cartItem.selected_modifiers,
        item_status: 'pending',
        station: cartItem.menuItem.station,
        created_at: now,
      }));

      const newOrder: Order = {
        id: orderId,
        table_id: selectedTable.id,
        table_number: selectedTable.table_number,
        customer_id: attachedCustomer?.id,
        customer_name: attachedCustomer?.name,
        customer_phone: attachedCustomer?.phone,
        order_status: 'pending',
        payment_status: 'unpaid',
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        items: orderItems,
        created_at: now,
        updated_at: now,
      };

      orderService.createOrder(newOrder);

      setTimeout(() => {
        setIsSubmitting(false);
        setIsAddonSuccess(false);
        setSuccessOrder(newOrder);
        setAttachedCustomer(null);
        setCustomerPhoneInput('');
        setCustomerLookupMsg(null);
        setShowAddCustomerQuick(false);
        onClearCart();
      }, 400);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-xl">
      {/* Sidebar Header */}
      <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-white">Giỏ Order Món</h2>
            <p className="text-xs text-stone-400">
              {items.length === 0 ? 'Chưa có món nào' : `${items.length} loại món đã chọn`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Xác nhận xóa toàn bộ món trong giỏ hàng?')) {
                  onClearCart();
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Hủy đơn / Xóa toàn bộ giỏ hàng"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Xóa hết</span>
            </button>
          )}

          {/* Nút Đóng (X) to rõ ràng khi ở chế độ Mobile Drawer */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Đóng giỏ hàng (Quay lại danh sách món)"
            >
              <X className="w-5 h-5" />
              <span className="hidden xs:inline">Đóng</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Selector Box (Collapsible) */}
      <div className="p-3 sm:p-4 bg-stone-50/70 dark:bg-stone-800/40 border-b border-stone-200 dark:border-stone-800">
        <TableSelector
          tables={tables}
          selectedTableId={selectedTable?.id || null}
          onSelectTable={onSelectTable}
          collapsible={true}
          onAfterSelect={onTableSelected}
          onTableStatusChange={(tableId, newStatus) => {
            orderService.updateTableStatus(tableId, newStatus);
          }}
        />

        {/* Banner: Bàn Đang Phục Vụ & Xem Món Đã Gọi */}
        {activeExistingOrder && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Bàn đang có đơn #{activeExistingOrder.id.slice(-4)}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowExistingItems(!showExistingItems)}
                className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
              >
                {showExistingItems ? 'Thu gọn' : `Xem đã gọi (${activeExistingOrder.items.reduce((s, i) => s + i.quantity, 0)} món)`}
              </button>
            </div>

            {showExistingItems && (
              <div className="p-2 rounded-lg bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 max-h-36 overflow-y-auto space-y-1">
                {activeExistingOrder.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-[11px]">
                    <span className="text-stone-700 dark:text-stone-300">
                      <strong className="text-amber-600 dark:text-amber-400 tabular-nums">{it.quantity}x</strong> {it.menu_item_name}
                    </span>
                    <span className="text-stone-500 font-mono tabular-nums">
                      {formatCurrencyVND(it.price * it.quantity)}
                    </span>
                  </div>
                ))}
                <div className="pt-1 border-t border-stone-100 dark:border-stone-800 flex justify-between font-bold text-[11px] text-stone-900 dark:text-white">
                  <span>Tổng bill trước:</span>
                  <span className="tabular-nums">{formatCurrencyVND(activeExistingOrder.total_amount)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer CRM Attachment Bar */}
      <div className="px-3 sm:px-4 py-2.5 bg-stone-50/50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        {attachedCustomer ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-stone-900 dark:text-white truncate">
                    {attachedCustomer.name}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                      attachedCustomer.membership_tier === 'diamond'
                        ? 'bg-purple-500 text-white'
                        : attachedCustomer.membership_tier === 'gold'
                        ? 'bg-amber-400 text-stone-900'
                        : attachedCustomer.membership_tier === 'silver'
                        ? 'bg-slate-300 text-stone-800'
                        : 'bg-amber-800/30 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {attachedCustomer.membership_tier}
                  </span>
                </div>
                <div className="text-[11px] text-stone-400 flex items-center gap-2">
                  <span>{attachedCustomer.phone}</span>
                  <span>•</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    {attachedCustomer.points} điểm
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveCustomer}
              className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              title="Gỡ khách hàng"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="tel"
                  placeholder="Số ĐT khách hàng (CRM)..."
                  value={customerPhoneInput}
                  onChange={(e) => {
                    setCustomerPhoneInput(e.target.value);
                    if (!e.target.value.trim()) {
                      setCustomerLookupMsg(null);
                      setShowAddCustomerQuick(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLookupCustomer();
                    }
                  }}
                  className="w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleLookupCustomer()}
                className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
              >
                <Search className="w-3 h-3" />
                <span>Gắn</span>
              </button>
            </div>

            {customerLookupMsg && (
              <p
                className={`text-[11px] px-1 font-medium ${
                  customerLookupMsg.isError
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {customerLookupMsg.text}
              </p>
            )}

            {showAddCustomerQuick && (
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <input
                  type="text"
                  placeholder="Nhập tên khách mới..."
                  value={quickCustomerName}
                  onChange={(e) => setQuickCustomerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateQuickCustomer();
                    }
                  }}
                  className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleCreateQuickCustomer}
                  disabled={!quickCustomerName.trim()}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Lưu & Gắn</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Item List (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
            <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3">
              <ShoppingBag className="w-8 h-8 opacity-40" />
            </div>
            <p className="font-medium text-sm text-stone-600 dark:text-stone-300">
              Giỏ order đang trống
            </p>
            <p className="text-xs text-stone-400 mt-1 max-w-[200px]">
              Chọn món từ danh mục bên trái để thêm vào đơn phục vụ bàn.
            </p>
          </div>
        ) : (
          items.map((cartItem) => (
            <div
              key={cartItem.id}
              className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/60 flex flex-col gap-2 transition-all hover:border-amber-500/40"
            >
              {/* Top row: Name, station tag, delete */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white ${
                        cartItem.menuItem.station === 'kitchen' ? 'bg-orange-500' : 'bg-cyan-600'
                      }`}
                    >
                      {cartItem.menuItem.station === 'kitchen' ? (
                        <Flame className="w-2.5 h-2.5" />
                      ) : (
                        <Wine className="w-2.5 h-2.5" />
                      )}
                      {cartItem.menuItem.station === 'kitchen' ? 'Bếp' : 'Bar'}
                    </span>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight">
                      {cartItem.menuItem.name}
                    </h4>
                  </div>

                  {/* Modifiers List */}
                  {cartItem.selected_modifiers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {cartItem.selected_modifiers.map((mod) => (
                        <span
                          key={mod.id}
                          className="text-[11px] px-1.5 py-0.5 bg-stone-200/80 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded font-medium"
                        >
                          {mod.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {cartItem.notes && (
                    <p className="text-xs text-amber-700 dark:text-amber-400/90 italic mt-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200/50 dark:border-amber-900/40">
                      Ghi chú: {cartItem.notes}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onRemoveItem(cartItem.id)}
                  className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom row: Quantity buttons & line price */}
              <div className="flex items-center justify-between pt-1 border-t border-stone-200/50 dark:border-stone-700/40 mt-1">
                <div className="flex items-center bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 p-0.5">
                  <button
                    onClick={() => onUpdateQuantity(cartItem.id, -1)}
                    className="w-6 h-6 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-bold text-xs text-stone-900 dark:text-white">
                    {cartItem.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(cartItem.id, 1)}
                    className="w-6 h-6 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-stone-900 dark:text-white">
                    {formatCurrencyVND(cartItem.total_price)}
                  </div>
                  {cartItem.quantity > 1 && (
                    <div className="text-[10px] text-stone-400">
                      {formatCurrencyVND(cartItem.unit_price)} / món
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bill Summary & Order Button */}
      {items.length > 0 && (
        <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 space-y-3">
          {/* Voucher Promotion Box */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Tag className="w-3.5 h-3.5" />
                Khuyến mãi / Voucher
              </span>
              <button
                type="button"
                onClick={() => setShowVoucherList(!showVoucherList)}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <Ticket className="w-3 h-3" />
                {showVoucherList ? 'Đóng' : 'Xem Voucher'}
              </button>
            </div>

            {/* Applied Promo Badge */}
            {appliedPromo ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white font-mono font-bold text-[10px]">
                    {appliedPromo.promo_code}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold truncate max-w-[160px]">
                    {appliedPromo.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    -{formatCurrencyVND(discountAmount)}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="p-1 rounded-md text-stone-400 hover:text-rose-500 hover:bg-white dark:hover:bg-stone-800 transition-colors"
                    title="Gỡ bỏ mã này"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => {
                    setPromoCodeInput(e.target.value.toUpperCase());
                    setPromoMessage(null);
                  }}
                  placeholder="Nhập mã (VD: OPEN10, VIP50K)"
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs uppercase font-mono font-semibold placeholder:font-normal focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleApplyPromo(promoCodeInput)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 text-white text-xs font-bold transition-colors"
                >
                  Áp dụng
                </button>
              </div>
            )}

            {/* Error or Success feedback message */}
            {promoMessage && (
              <p
                className={`text-[11px] ${
                  promoMessage.isError
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400 font-medium'
                }`}
              >
                {promoMessage.text}
              </p>
            )}

            {/* Quick Available Vouchers list */}
            {showVoucherList && (
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-1.5 max-h-36 overflow-y-auto">
                <p className="text-[10px] text-stone-400 font-medium">Bấm để áp dụng nhanh:</p>
                {availablePromos.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">Chưa có voucher khả dụng</p>
                ) : (
                  availablePromos.map((promo) => (
                    <div
                      key={promo.id}
                      onClick={() => handleApplyPromo(promo.promo_code)}
                      className="p-1.5 rounded-lg border border-dashed border-stone-200 dark:border-stone-700 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 cursor-pointer flex items-center justify-between text-xs transition-all"
                    >
                      <div>
                        <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                          <span className="px-1 py-0.5 rounded bg-amber-500 text-white text-[9px] font-mono">
                            {promo.promo_code}
                          </span>
                          <span className="text-[11px]">{promo.name}</span>
                        </div>
                        {promo.min_order_value && (
                          <div className="text-[10px] text-stone-400">
                            Đơn từ {formatCurrencyVND(promo.min_order_value)}
                          </div>
                        )}
                      </div>
                      <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">
                        {promo.discount_type === 'percent'
                          ? `-${promo.discount_value}%`
                          : `-${formatCurrencyVND(promo.discount_value)}`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-500 dark:text-stone-400">
              <span>Tạm tính</span>
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                {formatCurrencyVND(subtotal)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Ưu đãi / Giảm giá</span>
                <span>-{formatCurrencyVND(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-stone-500 dark:text-stone-400">
              <span>Thuế VAT (8%)</span>
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                {formatCurrencyVND(taxAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-stone-900 dark:text-white pt-2 border-t border-stone-200 dark:border-stone-800">
              <span>Tổng thanh toán</span>
              <span className="text-base text-amber-600 dark:text-amber-400 font-extrabold">
                {formatCurrencyVND(totalAmount)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn hủy đơn và xóa toàn bộ món trong giỏ hàng?')) {
                  onClearCart();
                }
              }}
              className="py-3.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-rose-300 dark:hover:border-rose-800 bg-stone-50 dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Hủy đơn & Xóa sạch giỏ"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Hủy đơn</span>
            </button>

            <button
              onClick={handleSendOrder}
              disabled={isSubmitting || !selectedTable}
              className={`flex-1 py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-black text-sm text-white transition-all shadow-md active:scale-[0.98] ${
                !selectedTable
                  ? 'bg-stone-400 dark:bg-stone-700 cursor-not-allowed opacity-75'
                  : activeExistingOrder
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
              }`}
            >
              {isSubmitting ? (
                <span className="animate-pulse">Đang định tuyến đơn...</span>
              ) : activeExistingOrder ? (
                <>
                  <Send className="w-4 h-4" />
                  <span>GỬI BẾP (GỌI THÊM {items.reduce((s, i) => s + i.quantity, 0)} MÓN)</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>GỬI ORDER XUỐNG BẾP / BAR</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-sm w-full p-6 text-center border border-emerald-500/30 shadow-2xl space-y-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
              isAddonSuccess ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                {isAddonSuccess ? 'Gọi Thêm Món Thành Công!' : 'Gửi Order Thành Công!'}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                {isAddonSuccess
                  ? 'Món gọi thêm đã được cộng dồn vào đơn và phát tín hiệu chuông xuống Bếp / Bar.'
                  : 'Đơn hàng đã được định tuyến trực tiếp xuống Màn hình Bếp & Bar theo thời gian thực.'}
              </p>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/80 p-3.5 rounded-xl text-left space-y-1.5 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-stone-500">Mã đơn:</span>
                <span className="text-stone-900 dark:text-stone-200">#{successOrder.id.slice(-6)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-stone-500">Bàn phục vụ:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  {successOrder.table_number}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-stone-500">Tổng số món trong đơn:</span>
                <span className="text-stone-900 dark:text-stone-200 tabular-nums">
                  {successOrder.items.reduce((s, i) => s + i.quantity, 0)} món
                </span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white">
                <span>Tổng tiền sau cộng dồn:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                  {formatCurrencyVND(successOrder.total_amount)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSuccessOrder(null)}
              className="w-full py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Tiếp tục gọi món
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
