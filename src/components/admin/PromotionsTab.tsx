'use client';

import React, { useState } from 'react';
import { Promotion } from '@/types';
import { formatCurrencyVND } from '@/lib/utils';
import { adminService } from '@/services/adminService';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Percent,
  DollarSign,
  Ticket,
} from 'lucide-react';

interface PromotionsTabProps {
  promotions: Promotion[];
  onRefresh: () => void;
}

export const PromotionsTab: React.FC<PromotionsTabProps> = ({ promotions, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed_amount'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderValue, setMinOrderValue] = useState<number>(200000);

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !promoCode || discountValue <= 0) {
      alert('Vui lòng điền đầy đủ thông tin hợp lệ!');
      return;
    }

    adminService.addPromotion({
      name,
      promo_code: promoCode.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: discountValue,
      min_order_value: minOrderValue,
      is_active: true,
    });

    onRefresh();
    setIsModalOpen(false);
    setName('');
    setPromoCode('');
  };

  const handleToggle = (id: string) => {
    adminService.togglePromotion(id);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
      adminService.deletePromotion(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-4 h-4 text-amber-500" />
            <span>Chương Trình Khuyến Mãi & Voucher ({promotions.length})</span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Cấu hình mã giảm giá nhập tại màn hình Thu Ngân
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Khuyến Mãi Mới</span>
        </button>
      </div>

      {/* Promotions Table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-400 uppercase text-[11px] border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-3.5">Mã Voucher</th>
                <th className="p-3.5">Tên Chương Trình</th>
                <th className="p-3.5 text-center">Loại Giảm</th>
                <th className="p-3.5 text-right">Mức Giảm</th>
                <th className="p-3.5 text-right">Đơn Tối Thiểu</th>
                <th className="p-3.5 text-center">Trạng Thái</th>
                <th className="p-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
              {promotions.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                  <td className="p-3.5">
                    <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">
                      {p.promo_code}
                    </span>
                  </td>

                  <td className="p-3.5 font-bold text-stone-900 dark:text-white">
                    {p.name}
                  </td>

                  <td className="p-3.5 text-center">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {p.discount_type === 'percent' ? 'Phần trăm (%)' : 'Số tiền cố định'}
                    </span>
                  </td>

                  <td className="p-3.5 text-right font-extrabold text-amber-600 dark:text-amber-400 font-mono text-sm">
                    {p.discount_type === 'percent'
                      ? `${p.discount_value}%`
                      : formatCurrencyVND(p.discount_value)}
                  </td>

                  <td className="p-3.5 text-right font-bold text-stone-700 dark:text-stone-300">
                    {formatCurrencyVND(p.min_order_value)}
                  </td>

                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => handleToggle(p.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                        p.is_active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-400'
                      }`}
                    >
                      {p.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{p.is_active ? 'Đang bật' : 'Tắt'}</span>
                    </button>
                  </td>

                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      title="Xóa voucher"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Promotion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreatePromo}
            className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-5 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-500" />
                <span>Tạo Chương Trình Khuyến Mãi</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-600 dark:text-stone-400 block mb-1">
                  Tên chương trình:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tri ân khách hàng thân thiết"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-600 dark:text-stone-400 block mb-1">
                  Mã Voucher (Promo Code):
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: SALE20, TRIAN50K"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono uppercase font-black"
                />
              </div>

              <div>
                <label className="font-bold text-stone-600 dark:text-stone-400 block mb-1">
                  Hình thức giảm:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs ${
                      discountType === 'percent'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600'
                    }`}
                  >
                    Theo phần trăm (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed_amount')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs ${
                      discountType === 'fixed_amount'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600'
                    }`}
                  >
                    Tiền mặt (VND)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-600 dark:text-stone-400 block mb-1">
                    Giá trị giảm ({discountType === 'percent' ? '%' : 'VND'}):
                  </label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-600 dark:text-stone-400 block mb-1">
                    Đơn tối thiểu (VND):
                  </label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors"
              >
                Lưu Voucher
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
