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
import { ZoneTableTab } from './ZoneTableTab';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Ticket,
  Users,
  Settings,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'menu' | 'tables' | 'promotions' | 'hr' | 'settings'
  >('dashboard');

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
    <div className="flex flex-col md:flex-row h-full w-full bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden font-sans">
      {/* Desktop Admin Sidebar Navigation */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 p-4 flex-col justify-between shrink-0">
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
              onClick={() => setActiveTab('tables')}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tables'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Sơ Đồ & Khu Vực</span>
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

      {/* Mobile Sub-Navigation Bar for Admin */}
      <div className="flex md:hidden items-center gap-1.5 px-3 py-2 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            activeTab === 'dashboard'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Tổng Quan</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            activeTab === 'menu'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Thực Đơn</span>
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            activeTab === 'tables'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Sơ Đồ Bàn</span>
        </button>

        <button
          onClick={() => setActiveTab('promotions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            activeTab === 'promotions'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Khuyến Mãi ({promotions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hr')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            activeTab === 'hr'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Nhân Sự ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            activeTab === 'settings'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Cài Đặt</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full min-w-0">
        {/* Top Header */}
        <header className="px-4 sm:px-6 py-2.5 sm:py-3.5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0 gap-2">
          <div className="min-w-0 pr-2">
            <h1 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white truncate">
              {activeTab === 'dashboard' && 'Tổng Quan Kinh Doanh & Phân Tích (Dashboard)'}
              {activeTab === 'menu' && 'Quản Lý Thực Đơn & Phân Trạm KDS'}
              {activeTab === 'tables' && 'Quản Lý Sơ Đồ Bàn Ăn & Phân Khu Vực'}
              {activeTab === 'promotions' && 'Quản Lý Khuyến Mãi & Voucher'}
              {activeTab === 'hr' && 'Quản Trị Nhân Sự & Phân Quyền (RBAC)'}
              {activeTab === 'settings' && 'Cấu Hình Thông Tin Thương Hiệu & Cửa Hàng'}
            </h1>
            <p className="text-[11px] sm:text-xs text-stone-400 truncate hidden sm:block">
              Dữ liệu được tổng hợp thời gian thực từ các phân hệ FOH, KDS, Thu Ngân và ERP
            </p>
          </div>

          <button
            onClick={refreshData}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors shrink-0"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </header>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {activeTab === 'dashboard' && (
            <DashboardTab orders={orders} materials={materials} />
          )}

          {activeTab === 'menu' && <MenuTab onRefresh={refreshData} />}

          {activeTab === 'tables' && <ZoneTableTab />}

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
