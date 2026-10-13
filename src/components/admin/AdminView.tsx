'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Order, RawMaterial, Promotion, UserAccount, StoreSettings } from '@/types';
import { orderService } from '@/services/orderService';
import { inventoryService } from '@/services/inventoryService';
import { adminService } from '@/services/adminService';
import { realtimeEngine } from '@/services/realtimeEngine';
import { DashboardTab } from './DashboardTab';
import { MenuTab } from './MenuTab';
import { PromotionsTab } from './PromotionsTab';
import { HRTab } from './HRTab';
import { StoreSettingsTab } from './StoreSettingsTab';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Ticket,
  Users,
  Settings,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'promotions' | 'hr' | 'settings'>(
    'dashboard'
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(adminService.getSettings());

  const refreshData = useCallback(() => {
    setOrders(orderService.getOrders());
    setMaterials(inventoryService.getRawMaterials());
    setPromotions(adminService.getPromotions());
    setUsers(adminService.getUsers());
    setSettings(adminService.getSettings());
  }, []);

  useEffect(() => {
    refreshData();

    const unsub1 = realtimeEngine.subscribe('ORDER_CREATED', refreshData);
    const unsub2 = realtimeEngine.subscribe('PAYMENT_COMPLETED', refreshData);
    const unsub3 = realtimeEngine.subscribe('STOCK_ALERT', refreshData);

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [refreshData]);

  return (
    <div className="flex h-full w-full bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden font-sans">
      {/* Admin Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-stone-900 dark:text-white leading-tight">
                TRUNG TÂM QUẢN TRỊ
              </h2>
              <p className="text-[11px] text-stone-400">Admin Control Center</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Tổng Quan (Dashboard)</span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'menu'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Quản Lý Thực Đơn</span>
            </button>

            <button
              onClick={() => setActiveTab('promotions')}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'promotions'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Khuyến Mãi ({promotions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('hr')}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'hr'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Nhân Sự ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Cấu Hình Cửa Hàng</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Branding */}
        <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-800 text-[11px] space-y-1">
          <div className="font-bold text-stone-900 dark:text-white truncate">
            {settings.store_name}
          </div>
          <p className="text-stone-400 text-[10px]">VAT: {settings.tax_rate * 100}% • POS v1.0</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="px-6 py-3.5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-extrabold text-stone-900 dark:text-white">
              {activeTab === 'dashboard' && 'Executive Business Dashboard & Analytics'}
              {activeTab === 'menu' && 'Quản Lý Thực Đơn, Món Ăn & Phân Trạm Chế Biến'}
              {activeTab === 'promotions' && 'Quản Lý Khuyến Mãi, Mã Giảm Giá & Voucher'}
              {activeTab === 'hr' && 'Quản Trị Nhân Sự & Phân Quyền Vai Trò (RBAC)'}
              {activeTab === 'settings' && 'Cấu Hình Thông Tin Thương Hiệu & Cửa Hàng'}
            </h1>
            <p className="text-xs text-stone-400">
              Dữ liệu được tổng hợp thời gian thực từ các phân hệ FOH, KDS, Thu Ngân và ERP
            </p>
          </div>

          <button
            onClick={refreshData}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </header>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && (
            <DashboardTab orders={orders} materials={materials} />
          )}

          {activeTab === 'menu' && <MenuTab onRefresh={refreshData} />}

          {activeTab === 'promotions' && (
            <PromotionsTab promotions={promotions} onRefresh={refreshData} />
          )}

          {activeTab === 'hr' && <HRTab users={users} onRefresh={refreshData} />}

          {activeTab === 'settings' && (
            <StoreSettingsTab settings={settings} onRefresh={refreshData} />
          )}
        </div>
      </main>
    </div>
  );
};
