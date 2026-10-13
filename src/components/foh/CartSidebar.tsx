'use client';

import React, { useState } from 'react';
import { CartItem, RestaurantTable, Order, OrderItem, Promotion } from '@/types';
import { formatCurrencyVND } from '@/lib/utils';
import { TableSelector } from './TableSelector';
import { orderService } from '@/services/orderService';
import { promotionService } from '@/services/promotionService';
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
} from 'lucide-react';

interface CartSidebarProps {
  items: CartItem[];
  tables: RestaurantTable[];
  selectedTable: RestaurantTable | null;
  onSelectTable: (table: RestaurantTable) => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  items,
  tables,
  selectedTable,
  onSelectTable,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

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

    // Save order and emit ORDER_CREATED event
    orderService.createOrder(newOrder);

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessOrder(newOrder);
      onClearCart();
    }, 400);
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

        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs text-stone-400 hover:text-red-500 flex items-center gap-1 transition-colors p-1"
            title="Xóa tất cả"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa hết</span>
          </button>
        )}
      </div>

      {/* Table Selector Box */}
      <div className="p-4 bg-stone-50/70 dark:bg-stone-800/40 border-b border-stone-200 dark:border-stone-800">
        <TableSelector
          tables={tables}
          selectedTableId={selectedTable?.id || null}
          onSelectTable={onSelectTable}
        />
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

          <button
            onClick={handleSendOrder}
            disabled={isSubmitting || !selectedTable}
            className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-white transition-all shadow-md ${
              !selectedTable
                ? 'bg-stone-400 dark:bg-stone-700 cursor-not-allowed opacity-75'
                : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] shadow-emerald-600/20'
            }`}
          >
            {isSubmitting ? (
              <span className="animate-pulse">Đang định tuyến đơn...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>GỬI ORDER XUỐNG BẾP / BAR</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Success Notification Modal */}
      {successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-sm w-full p-6 text-center border border-emerald-500/30 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                Gửi Order Thành Công!
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Đơn hàng đã được định tuyến trực tiếp xuống Màn hình Bếp & Bar theo thời gian thực.
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
                <span className="text-stone-500">Số lượng món:</span>
                <span className="text-stone-900 dark:text-stone-200">
                  {successOrder.items.reduce((s, i) => s + i.quantity, 0)} món
                </span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white">
                <span>Tổng tiền:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">
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
