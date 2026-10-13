'use client';

import React, { useState } from 'react';
import { Customer } from '@/types';
import { customerService } from '@/services/customerService';
import { X, UserPlus, Save, Phone, Mail, Award, FileText } from 'lucide-react';

interface AddEditCustomerModalProps {
  customer?: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddEditCustomerModal: React.FC<AddEditCustomerModalProps> = ({
  customer,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(customer);

  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [membershipTier, setMembershipTier] = useState<Customer['membership_tier']>(
    customer?.membership_tier || 'bronze'
  );
  const [notes, setNotes] = useState(customer?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập họ tên khách hàng!');
      return;
    }
    if (!phone.trim()) {
      alert('Vui lòng nhập số điện thoại!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && customer) {
        customerService.updateCustomer(customer.id, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          membership_tier: membershipTier,
          notes: notes.trim() || undefined,
        });
      } else {
        customerService.addCustomer({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          membership_tier: membershipTier,
          notes: notes.trim() || undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi lưu thông tin khách hàng!');
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
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white leading-tight">
                {isEdit ? 'CHỈNH SỬA KHÁCH HÀNG' : 'THÊM KHÁCH HÀNG MỚI'}
              </h3>
              <p className="text-[11px] text-stone-400">
                {isEdit ? `Mã: #${customer?.id}` : 'Đăng ký thành viên tích điểm CRM'}
              </p>
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
              Họ Và Tên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Nguyễn Văn Hùng"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs text-stone-900 dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
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
                  placeholder="0909123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs text-stone-900 dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="khachhang@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs text-stone-900 dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Hạng Thành Viên
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { key: 'bronze', label: 'Đồng', color: 'border-amber-700 text-amber-700' },
                { key: 'silver', label: 'Bạc', color: 'border-stone-400 text-stone-400' },
                { key: 'gold', label: 'Vàng', color: 'border-amber-500 text-amber-500' },
                { key: 'diamond', label: 'Kim Cương', color: 'border-cyan-500 text-cyan-500' },
              ].map((tier) => (
                <button
                  type="button"
                  key={tier.key}
                  onClick={() => setMembershipTier(tier.key as any)}
                  className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold border transition-all ${
                    membershipTier === tier.key
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 border-transparent text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Ghi Chú Đặc Biệt / Sở Thích
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Hay ngồi bàn ban công, thích uống ít đường..."
              className="w-full px-3.5 py-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs text-stone-900 dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 active:scale-98 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang Lưu...' : isEdit ? 'Lưu Thay Đổi' : 'Tạo Khách Hàng'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
