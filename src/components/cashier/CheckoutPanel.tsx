'use client';

import React, { useState, useEffect } from 'react';
import { Order, RestaurantTable, PaymentMethod, Promotion, Customer } from '@/types';
import { formatCurrencyVND } from '@/lib/utils';
import { VietQRCode } from './VietQRCode';
import { ReceiptModal } from './ReceiptModal';
import { orderService } from '@/services/orderService';
import { promotionService } from '@/services/promotionService';
import { customerService } from '@/services/customerService';
import {
  Banknote,
  QrCode,
  CreditCard,
  Wallet,
  Receipt,
  CheckCircle2,
  Printer,
  X,
  Sparkles,
  Percent,
  Tag,
  Ticket,
  UserCheck,
  UserPlus,
  Phone,
  Search,
} from 'lucide-react';

interface CheckoutPanelProps {
  table: RestaurantTable;
  order: Order | null;
  onClose: () => void;
  onPaymentSuccess: (order: Order, table: RestaurantTable) => void;
}

export const CheckoutPanel: React.FC<CheckoutPanelProps> = ({
  table,
  order,
  onClose,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [showPromoPicker, setShowPromoPicker] = useState(false);
  const [cashGiven, setCashGiven] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paidOrder, setPaidOrder] = useState<Order | null>(null);

  // Customer CRM State
  const [customerPhone, setCustomerPhone] = useState(order?.customer_phone || '');
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(() => {
    if (order?.customer_id) {
      return customerService.getCustomerById(order.customer_id) || null;
    }
    if (order?.customer_phone) {
      return customerService.getCustomerByPhone(order.customer_phone) || null;
    }
    return null;
  });
  const [custLookupMsg, setCustLookupMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [showAddCustQuick, setShowAddCustQuick] = useState(false);
  const [quickCustName, setQuickCustName] = useState('');

  useEffect(() => {
    if (order) {
      setCustomerPhone(order.customer_phone || '');
      if (order.customer_id) {
        setCurrentCustomer(customerService.getCustomerById(order.customer_id) || null);
      } else if (order.customer_phone) {
        setCurrentCustomer(customerService.getCustomerByPhone(order.customer_phone) || null);
      } else {
        setCurrentCustomer(null);
      }
    }
  }, [order]);

  const handleAttachCustomerByPhone = () => {
    if (!order) return;
    const p = customerPhone.trim();
    if (!p) {
      setCustLookupMsg(null);
      return;
    }
    const found = customerService.getCustomerByPhone(p);
    if (found) {
      setCurrentCustomer(found);
      orderService.attachCustomerToOrder(order.id, {
        id: found.id,
        name: found.name,
        phone: found.phone,
      });
      setCustLookupMsg({ text: `Đã gắn: ${found.name}`, isError: false });
      setShowAddCustQuick(false);
    } else {
      setCustLookupMsg({ text: 'Số ĐT chưa có trong hệ thống', isError: true });
      setShowAddCustQuick(true);
    }
  };

  const handleCreateAndAttachQuickCust = () => {
    if (!order || !quickCustName.trim() || !customerPhone.trim()) return;
    const newCust = customerService.addCustomer({
      name: quickCustName.trim(),
      phone: customerPhone.trim(),
    });
    setCurrentCustomer(newCust);
    orderService.attachCustomerToOrder(order.id, {
      id: newCust.id,
      name: newCust.name,
      phone: newCust.phone,
    });
    setShowAddCustQuick(false);
    setQuickCustName('');
    setCustLookupMsg({ text: `Đã tạo & gắn: ${newCust.name}`, isError: false });
  };

  const handleRemoveCustomerFromOrder = () => {
    if (!order) return;
    setCurrentCustomer(null);
    setCustomerPhone('');
    setCustLookupMsg(null);
    setShowAddCustQuick(false);
    order.customer_id = undefined;
    order.customer_name = undefined;
    order.customer_phone = undefined;
  };

  // If no active order on this table
  if (!order) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 mb-3">
          <Receipt className="w-8 h-8 opacity-40" />
        </div>
        <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
          {table.table_number} chưa có hóa đơn mở
        </h3>
        <p className="text-xs text-stone-400 mt-1 max-w-xs mb-4">
          Bàn này hiện đang ở trạng thái {table.status === 'available' ? 'Trống' : table.status}. Vui lòng tạo order từ màn hình FOH.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-bold"
        >
          Đóng thanh toán
        </button>
      </div>
    );
  }

  // Price calculations
  const subtotal = order.subtotal;
  const taxAmount = order.tax_amount;

  // Calculate discount from selectedPromo, discountPercent, or existing order discount
  let discountAmount = 0;
  if (selectedPromo) {
    if (selectedPromo.discount_type === 'percent') {
      discountAmount = Math.round(subtotal * (selectedPromo.discount_value / 100));
    } else {
      discountAmount = Math.min(selectedPromo.discount_value, subtotal);
    }
  } else if (discountPercent > 0) {
    discountAmount = Math.round((subtotal * discountPercent) / 100);
  } else if (order.discount_amount && order.discount_amount > 0) {
    discountAmount = order.discount_amount;
  }

  const finalTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  // Cash change due calculation
  const numericCashGiven = parseFloat(cashGiven.replace(/\D/g, '')) || 0;
  const changeDue = Math.max(0, numericCashGiven - finalTotal);

  // Auto set exact cash amount on mount or price change
  useEffect(() => {
    setCashGiven(finalTotal.toString());
  }, [finalTotal]);

  const activePromos = promotionService.getActivePromotions();

  const handleApplyPromoCode = (code: string) => {
    const res = promotionService.applyPromotion(code, subtotal);
    if (res.success && res.promo) {
      setSelectedPromo(res.promo);
      setDiscountPercent(0);
      setPromoError('');
      setPromoCodeInput('');
      setShowPromoPicker(false);
    } else {
      setPromoError(res.message);
    }
  };

  const handleRemoveDiscount = () => {
    setSelectedPromo(null);
    setDiscountPercent(0);
    setPromoError('');
  };

  // Execute Mock ACID Payment Transaction
  const handleConfirmPayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      // Complete in orderService which commits ACID transaction:
      // 1. Sets order completed & payment paid
      // 2. Frees table to available
      // 3. Emits PAYMENT_COMPLETED, TABLE_STATUS_CHANGED, ORDER_UPDATED
      const result = orderService.completePayment(order.id, selectedMethod, discountAmount);

      if (result) {
        setPaidOrder(result.order);
        setIsProcessing(false);
        setShowReceiptModal(true);
        onPaymentSuccess(result.order, result.table);
      }
    }, 500);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Panel Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 bg-stone-900 text-white shrink-0">
        {/* Mobile Drag Indicator Bar */}
        <div className="w-12 h-1 bg-stone-700 rounded-full mx-auto mt-2 md:hidden" />

        <div className="p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold flex items-center gap-2 truncate">
                <span className="truncate">
                  THANH TOÁN: {table.zone_id ? `${orderService.getZones().find((z) => z.id === table.zone_id)?.name || ''} - ` : ''}{table.table_number}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-amber-400 shrink-0">
                  #{order.id.slice(-6)}
                </span>
              </h3>
              <p className="text-[11px] text-stone-400 truncate">
                Giờ vào: {new Date(order.created_at).toLocaleTimeString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Prominent Mobile Close (X) Button */}
          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center active:scale-95 transition-all shrink-0 shadow-xs"
            aria-label="Đóng ngăn kéo thanh toán"
            title="Đóng (Quay lại sơ đồ bàn)"
          >
            <X className="w-5 h-5 text-stone-200" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Order Items Table */}
        <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200/80 dark:border-stone-700/60 p-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-stone-500 dark:text-stone-400 pb-1.5 border-b border-stone-200 dark:border-stone-700">
            <span>Chi tiết món đã gọi ({order.items.reduce((s, i) => s + i.quantity, 0)})</span>
            <span>Đơn giá</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start text-xs">
                <div className="flex-1 pr-2">
                  <div className="font-bold text-stone-800 dark:text-stone-200">
                    <span className="text-amber-600 dark:text-amber-400 mr-1.5">
                      {item.quantity}x
                    </span>
                    {item.menu_item_name}
                  </div>
                  {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                    <div className="text-[10px] text-stone-500">
                      {item.selected_modifiers.map((m) => m.name).join(', ')}
                    </div>
                  )}
                </div>

                <div className="font-bold text-stone-900 dark:text-stone-100 text-right">
                  {formatCurrencyVND(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer CRM Attachment Block */}
        <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
              <UserCheck className="w-3.5 h-3.5" />
              Khách hàng thân thiết (CRM):
            </span>
            {currentCustomer && (
              <button
                type="button"
                onClick={handleRemoveCustomerFromOrder}
                className="text-[10px] text-stone-400 hover:text-red-500 font-bold transition-colors"
              >
                Gỡ khách
              </button>
            )}
          </div>

          {currentCustomer ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 dark:text-white">
                    {currentCustomer.name}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                      currentCustomer.membership_tier === 'diamond'
                        ? 'bg-purple-500 text-white'
                        : currentCustomer.membership_tier === 'gold'
                        ? 'bg-amber-400 text-stone-900'
                        : currentCustomer.membership_tier === 'silver'
                        ? 'bg-slate-300 text-stone-800'
                        : 'bg-amber-800/30 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {currentCustomer.membership_tier}
                  </span>
                </div>
                <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                  <span>{currentCustomer.phone}</span>
                  <span>•</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    Tích lũy: {currentCustomer.points} điểm ({formatCurrencyVND(currentCustomer.total_spent)})
                  </span>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="tel"
                    placeholder="Nhập số ĐT khách hàng..."
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (!e.target.value.trim()) {
                        setCustLookupMsg(null);
                        setShowAddCustQuick(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAttachCustomerByPhone();
                      }
                    }}
                    className="w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAttachCustomerByPhone}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                >
                  <Search className="w-3 h-3" />
                  <span>Gắn</span>
                </button>
              </div>

              {custLookupMsg && (
                <p
                  className={`text-[11px] px-1 font-medium ${
                    custLookupMsg.isError
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {custLookupMsg.text}
                </p>
              )}

              {showAddCustQuick && (
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <input
                    type="text"
                    placeholder="Nhập họ tên khách..."
                    value={quickCustName}
                    onChange={(e) => setQuickCustName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateAndAttachQuickCust();
                      }
                    }}
                    className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleCreateAndAttachQuickCust}
                    disabled={!quickCustName.trim()}
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

        {/* Discount & Promotion Selector */}
        <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Tag className="w-3.5 h-3.5" />
              Khuyến mãi & Chiết khấu:
            </span>

            <button
              type="button"
              onClick={() => setShowPromoPicker(!showPromoPicker)}
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <Ticket className="w-3 h-3" />
              {showPromoPicker ? 'Đóng' : 'Chọn Voucher'}
            </button>
          </div>

          {/* Active Promo or Discount Display */}
          {selectedPromo ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white font-mono font-bold text-[10px]">
                  {selectedPromo.promo_code}
                </span>
                <span className="text-emerald-800 dark:text-emerald-300 font-semibold truncate max-w-[150px]">
                  {selectedPromo.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  -{formatCurrencyVND(discountAmount)}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveDiscount}
                  className="p-1 rounded text-stone-400 hover:text-rose-500"
                  title="Gỡ bỏ mã"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Quick % buttons */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-stone-500">Giảm % trực tiếp:</span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setDiscountPercent(pct);
                        setSelectedPromo(null);
                        setPromoError('');
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        discountPercent === pct && !selectedPromo
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-amber-400'
                      }`}
                    >
                      {pct === 0 ? '0%' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Promo input field */}
              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => {
                    setPromoCodeInput(e.target.value.toUpperCase());
                    setPromoError('');
                  }}
                  placeholder="Nhập mã voucher (VD: OPEN10)"
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs uppercase font-mono font-bold placeholder:font-normal focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleApplyPromoCode(promoCodeInput)}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-700 hover:bg-stone-800 text-white text-xs font-bold transition-colors"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}

          {promoError && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{promoError}</p>
          )}

          {/* Voucher list dropdown */}
          {showPromoPicker && (
            <div className="pt-2 border-t border-stone-200 dark:border-stone-700/60 space-y-1.5 max-h-36 overflow-y-auto">
              <p className="text-[10px] text-stone-400 font-medium">Danh sách voucher của quán:</p>
              {activePromos.map((promo) => (
                <div
                  key={promo.id}
                  onClick={() => handleApplyPromoCode(promo.promo_code)}
                  className="p-1.5 rounded-lg border border-dashed border-stone-200 dark:border-stone-700 hover:border-amber-500 hover:bg-amber-500/10 cursor-pointer flex items-center justify-between text-xs transition-all"
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
              ))}
            </div>
          )}
        </div>

        {/* Bill Summary Calculations */}
        <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1.5 text-xs">
          <div className="flex justify-between text-stone-500 dark:text-stone-400">
            <span>Tạm tính</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {formatCurrencyVND(subtotal)}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
              <span>
                Giảm giá {selectedPromo ? `(${selectedPromo.promo_code})` : discountPercent > 0 ? `(${discountPercent}%)` : ''}
              </span>
              <span>-{formatCurrencyVND(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-stone-500 dark:text-stone-400">
            <span>Thuế VAT (8%)</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {formatCurrencyVND(taxAmount)}
            </span>
          </div>

          <div className="flex justify-between text-base font-extrabold pt-2 border-t border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white">
            <span>Tổng thanh toán:</span>
            <span className="text-lg text-amber-600 dark:text-amber-400 font-black">
              {formatCurrencyVND(finalTotal)}
            </span>
          </div>
        </div>

        {/* Payment Method Tabs */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
            Phương thức thanh toán
          </label>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedMethod('cash')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all font-bold text-xs ${
                selectedMethod === 'cash'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-400'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span>Tiền mặt</span>
            </button>

            <button
              onClick={() => setSelectedMethod('transfer_qr')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all font-bold text-xs ${
                selectedMethod === 'transfer_qr'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-emerald-500'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span>VietQR Động</span>
            </button>

            <button
              onClick={() => setSelectedMethod('card')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all font-bold text-xs ${
                selectedMethod === 'card'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-blue-500'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Thẻ POS</span>
            </button>
          </div>
        </div>

        {/* Method Specific Display */}
        {selectedMethod === 'transfer_qr' && (
          <VietQRCode
            amount={finalTotal}
            orderId={order.id}
            tableNumber={table.table_number}
          />
        )}

        {selectedMethod === 'cash' && (
          <div className="p-3.5 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-400">
                Tiền khách đưa (VND):
              </label>
              <input
                type="text"
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                placeholder="Nhập số tiền..."
                className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-xl font-bold text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            {/* Quick cash denomination buttons */}
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setCashGiven(finalTotal.toString())}
                className="px-2.5 py-1 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-xs font-semibold hover:border-amber-400"
              >
                Đủ tiền
              </button>
              {[100000, 200000, 500000, 1000000].map((val) => (
                <button
                  key={val}
                  onClick={() => setCashGiven(val.toString())}
                  className="px-2 py-1 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-xs font-semibold hover:border-amber-400"
                >
                  {val >= 1000000 ? `${val / 1000000}tr` : `${val / 1000}k`}
                </button>
              ))}
            </div>

            {/* Change due */}
            <div className="flex justify-between items-center pt-2 border-t border-stone-200 dark:border-stone-700 text-xs">
              <span className="font-bold text-stone-600 dark:text-stone-400">Tiền thối lại:</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatCurrencyVND(changeDue)}
              </span>
            </div>
          </div>
        )}

        {selectedMethod === 'card' && (
          <div className="p-4 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700 text-center space-y-2">
            <CreditCard className="w-8 h-8 text-blue-500 mx-auto" />
            <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
              Vui lòng quẹt thẻ trên máy POS ngân hàng
            </p>
            <p className="text-[11px] text-stone-400">
              Hỗ trợ thẻ chip Visa, MasterCard, JCB, Napas
            </p>
          </div>
        )}
      </div>

      {/* Panel Footer Actions */}
      <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex gap-2.5 shrink-0">
        <button
          onClick={() => {
            setPaidOrder(order);
            setShowReceiptModal(true);
          }}
          className="p-3 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          title="Xem trước hoặc in hóa đơn"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">In Tạm Tính</span>
        </button>

        <button
          onClick={handleConfirmPayment}
          disabled={isProcessing}
          className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
        >
          {isProcessing ? (
            <span className="animate-pulse">Đang hoàn tất giao dịch ACID...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>XÁC NHẬN THANH TOÁN ({formatCurrencyVND(finalTotal)})</span>
            </>
          )}
        </button>
      </div>

      {/* 80mm Receipt Modal */}
      <ReceiptModal
        order={paidOrder}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        cashGiven={selectedMethod === 'cash' ? numericCashGiven : undefined}
        changeDue={selectedMethod === 'cash' ? changeDue : undefined}
      />
    </div>
  );
};
