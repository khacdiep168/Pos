'use client';

import React, { useState } from 'react';
import { StoreSettings } from '@/types';
import { adminService } from '@/services/adminService';
import {
  Store,
  Save,
  CheckCircle2,
  MapPin,
  Phone,
  Clock,
  Percent,
  Wifi,
  Image,
} from 'lucide-react';

interface StoreSettingsTabProps {
  settings: StoreSettings;
  onRefresh: () => void;
}

export const StoreSettingsTab: React.FC<StoreSettingsTabProps> = ({
  settings,
  onRefresh,
}) => {
  const [storeName, setStoreName] = useState(settings.store_name);
  const [logoUrl, setLogoUrl] = useState(settings.logo_url);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [businessHours, setBusinessHours] = useState(settings.business_hours);
  const [taxRate, setTaxRate] = useState(settings.tax_rate * 100);
  const [wifiPassword, setWifiPassword] = useState(settings.wifi_password || '');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    adminService.updateSettings({
      store_name: storeName,
      logo_url: logoUrl,
      address,
      phone,
      business_hours: businessHours,
      tax_rate: taxRate / 100,
      wifi_password: wifiPassword,
    });

    onRefresh();
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2500);
  };

  return (
    <div className="max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="pb-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-500" />
            <span>Cấu Hình Thông Tin Nhà Hàng & Hóa Đơn</span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Thông tin sẽ tự động hiển thị trên Hóa đơn in K80, Menu và toàn bộ ứng dụng
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Tên Quán */}
        <div>
          <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
            Tên thương hiệu nhà hàng:
          </label>
          <input
            type="text"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        {/* Logo URL */}
        <div>
          <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
            Đường dẫn Logo URL:
          </label>
          <div className="relative">
            <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono"
            />
          </div>
        </div>

        {/* Địa chỉ & Hotline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Địa chỉ:
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Hotline liên hệ:
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Giờ mở cửa & Thuế VAT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Khung giờ mở cửa:
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Thuế suất GTGT VAT (%):
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="number"
                step="1"
                min="0"
                max="30"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Mật khẩu Wifi */}
        <div>
          <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
            Mật khẩu Wifi cho khách (In trên Bill):
          </label>
          <div className="relative">
            <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-mono"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div>
            {isSuccess && (
              <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Đã lưu cấu hình cửa hàng thành công!
              </span>
            )}
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Thay Đổi</span>
          </button>
        </div>
      </form>
    </div>
  );
};
