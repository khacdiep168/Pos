'use client';

import React, { useState } from 'react';
import { Supplier } from '@/types';
import { inventoryService } from '@/services/inventoryService';
import { X, Truck, Plus, Phone, MapPin, Mail, DollarSign } from 'lucide-react';

interface AddSupplierModalProps {
  onClose: () => void;
  onSuccess: (newSupplier: Supplier) => void;
}

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [totalDebt, setTotalDebt] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên nhà cung cấp!');
      return;
    }
    if (!phone.trim()) {
      alert('Vui lòng nhập số điện thoại liên hệ!');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = inventoryService.addSupplier({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        email: email.trim() || undefined,
        total_debt: Number(totalDebt) || 0,
      });

      onSuccess(created);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi thêm nhà cung cấp!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-850">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white leading-tight">
                THÊM NHÀ CUNG CẤP
              </h3>
              <p className="text-[11px] text-stone-400">Đăng ký thông tin đối tác cung ứng mới</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Tên Nhà Cung Cấp / Công Ty <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Công ty Thực Phẩm MeatWorld"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs text-stone-900 dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Số Điện Thoại <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="0912 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs text-stone-900 dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Email Liên Hệ
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="sales@meatworld.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs text-stone-900 dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Địa Chỉ Kho Hàng / Văn Phòng
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="VD: 45 Đường Số 7, Phường An Lạc, Bình Tân, TP. HCM"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs text-stone-900 dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Công Nợ Ban Đầu (VNĐ)
            </label>
            <div className="relative">
              <DollarSign className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                step="10000"
                placeholder="0"
                value={totalDebt}
                onChange={(e) => setTotalDebt(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs text-stone-900 dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono font-bold"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Số tiền nhà hàng đang nợ nhà cung cấp này tính đến hiện tại
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 active:scale-98 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang Lưu...' : 'Thêm Nhà Cung Cấp'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
