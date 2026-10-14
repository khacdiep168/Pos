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
import { InvoiceHistoryTab } from './InvoiceHistoryTab';
import { SupplierTab } from './SupplierTab';
import { CustomerTab } from './CustomerTab';
import { ReportTab } from './ReportTab';
import { CashbookTab } from './CashbookTab';
import { TaxDeclarationTab } from './TaxDeclarationTab';
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
  Receipt,
  Building2,
  UserCheck,
  FileBarChart,
  Boxes,
  ArrowLeft,
  ChevronRight,
  Wallet,
  Scale,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'cashbook'
    | 'tax'
    | 'invoices'
    | 'suppliers'
    | 'customers'
    | 'reports'
    | 'menu'
    | 'tables'
    | 'promotions'
    | 'hr'
    | 'settings'
    | 'more'
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
              onClick={() => setActiveTab('cashbook')}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'cashbook'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Sổ Quỹ (Thu / Chi)</span>
            </button>

            <button
              onClick={() => setActiveTab('tax')}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tax'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Thuế & Kế Toán (TT 91)</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'reports'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <FileBarChart className="w-4 h-4" />
              <span>Báo Cáo (Reports)</span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'invoices'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4" />
                <span>Lịch Sử Hóa Đơn</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 font-mono">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'customers'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Khách Hàng (CRM)</span>
            </button>

            <button
              onClick={() => setActiveTab('suppliers')}
              className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'suppliers'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Đối Tác (Suppliers)</span>
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

      {/* Native Mobile App Header (Fixed Top - Only on Mobile < md) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 px-4 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          {['suppliers', 'customers', 'tables', 'promotions', 'hr', 'settings'].includes(activeTab) ? (
            <button
              onClick={() => setActiveTab('more')}
              className="p-1.5 -ml-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition-colors flex items-center gap-1 text-xs font-bold shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Nhiều hơn</span>
            </button>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          )}
          <h1 className="text-sm font-extrabold text-stone-900 dark:text-white truncate">
            {activeTab === 'dashboard' && 'Tổng Quan'}
            {activeTab === 'cashbook' && 'Sổ Quỹ (Thu / Chi)'}
            {activeTab === 'tax' && 'Thuế & Kế Toán (TT 91)'}
            {activeTab === 'invoices' && 'Hóa Đơn'}
            {activeTab === 'menu' && 'Thực Đơn'}
            {activeTab === 'reports' && 'Báo Cáo'}
            {activeTab === 'customers' && 'Khách Hàng'}
            {activeTab === 'suppliers' && 'Đối Tác & Công Nợ'}
            {activeTab === 'tables' && 'Sơ Đồ Bàn'}
            {activeTab === 'promotions' && 'Khuyến Mãi'}
            {activeTab === 'hr' && 'Nhân Sự'}
            {activeTab === 'settings' && 'Cài Đặt'}
            {activeTab === 'more' && 'Nhiều Hơn'}
          </h1>
        </div>

        <button
          onClick={refreshData}
          className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors shrink-0"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full min-w-0 bg-stone-100 dark:bg-stone-950">
        {/* Desktop Top Header (Hidden on Mobile) */}
        <header className="hidden md:flex px-4 sm:px-6 py-2.5 sm:py-3.5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 items-center justify-between shrink-0 gap-2">
          <div className="min-w-0 pr-2">
            <h1 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white truncate">
              {activeTab === 'dashboard' && 'Tổng Quan Kinh Doanh & Phân Tích (Dashboard)'}
              {activeTab === 'cashbook' && 'Sổ Quỹ Thu & Chi (Smart Cashbook & Dòng Tiền)'}
              {activeTab === 'tax' && 'Trợ Lý Khai Thuế & Sổ Kế Toán (NĐ 254/2026 & TT 91/2026)'}
              {activeTab === 'reports' && 'Trung Tâm Báo Cáo Doanh Thu (Z-Report) & Tồn Kho'}
              {activeTab === 'invoices' && 'Quản Lý Lịch Sử Hóa Đơn & Đối Soát Giao Dịch'}
              {activeTab === 'customers' && 'Quản Trị Khách Hàng Thân Thiết (CRM & Tích Điểm)'}
              {activeTab === 'suppliers' && 'Quản Lý Đối Tác Nhà Cung Cấp & Sổ Cái Công Nợ'}
              {activeTab === 'menu' && 'Quản Lý Thực Đơn & Phân Trạm KDS'}
              {activeTab === 'tables' && 'Quản Lý Sơ Đồ Bàn Ăn & Phân Khu Vực'}
              {activeTab === 'promotions' && 'Quản Lý Khuyến Mãi & Voucher'}
              {activeTab === 'hr' && 'Quản Trị Nhân Sự & Phân Quyền (RBAC)'}
              {activeTab === 'settings' && 'Cấu Hình Thông Tin Thương Hiệu & Cửa Hàng'}
              {activeTab === 'more' && 'Trung Tâm Tính Năng Quản Trị Mở Rộng'}
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

        {/* Tab Content Body (Scrollable with mobile header & bottom nav paddings) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 pt-16 pb-20 md:pt-6 md:pb-6">
          {activeTab === 'dashboard' && (
            <DashboardTab orders={orders} materials={materials} />
          )}

          {activeTab === 'cashbook' && (
            <CashbookTab />
          )}

          {activeTab === 'tax' && (
            <TaxDeclarationTab />
          )}

          {activeTab === 'reports' && (
            <ReportTab orders={orders} materials={materials} />
          )}

          {activeTab === 'invoices' && (
            <InvoiceHistoryTab orders={orders} onRefresh={refreshData} />
          )}

          {activeTab === 'customers' && (
            <CustomerTab />
          )}

          {activeTab === 'suppliers' && (
            <SupplierTab />
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

          {/* Screen "Nhiều Hơn" (Grid App Menu - chuẩn KiotViet Mobile App) */}
          {activeTab === 'more' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="px-1">
                <h2 className="text-base font-extrabold text-stone-900 dark:text-white">
                  Tính năng quản trị khác
                </h2>
                <p className="text-xs text-stone-400">
                  Lựa chọn phân hệ quản trị để xem và thiết lập chuyên sâu
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* 0. Sổ Quỹ Thu Chi */}
                <button
                  onClick={() => setActiveTab('cashbook')}
                  className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all text-left flex flex-col justify-between h-32 active:scale-98 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-stone-900 dark:text-white leading-tight">
                      Sổ Quỹ Thu & Chi
                    </h3>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Tiền mặt & Ngân hàng</p>
                  </div>
                </button>

                {/* 0.1 Thuế & Kế Toán */}
                <button
                  onClick={() => setActiveTab('tax')}
                  className="p-4 bg-purple-50/60 dark:bg-purple-950/20 rounded-2xl border border-purple-200/80 dark:border-purple-800/50 shadow-xs hover:border-purple-500/50 hover:shadow-md transition-all text-left flex flex-col justify-between h-32 active:scale-98 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-stone-900 dark:text-white leading-tight">
                      Thuế & Kế Toán
                    </h3>
                    <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5">NĐ 254 & TT 91</p>
                  </div>
                </button>

                {/* 1. Khách Hàng CRM */}
                <button
                  onClick={() => setActiveTab('customers')}
                  className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-purple-500/50 hover:shadow-md transition-all text-left flex flex-col justify-between h-32 active:scale-98 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-stone-900 dark:text-white leading-tight">
                      Khách Hàng (CRM)
                    </h3>
                    <p className="text-[11px] text-stone-400 mt-0.5">Tích điểm & hạng VIP</p>
                  </div>
                </button>

                {/* 2. Đối Tác & Công Nợ */}
                <button
                  onClick={() => setActiveTab('suppliers')}
                  className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-purple-500/50 hover:shadow-md transition-all text-left flex flex-col justify-between h-32 active:scale-98 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-stone-900 dark:text-white leading-tight">
                      Đối Tác (NCC)
                    </h3>
                    <p className="text-[11px] text-stone-400 mt-0.5">Sổ cái công nợ</p>
                  </div>
                </button>

                {/* 3. Sơ Đồ Bàn */}
                <button
                  onClick={() => setActiveTab('tables')}
                  className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-purple-500/50 hover:shadow-md transition-all text-left flex flex-col justify-between h-32 active:scale-98 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-stone-900 dark:text-white leading-tight">
                      Sơ Đồ Bàn & Khu Vực
                    </h3>
                    <p className="text-[11px] text-stone-400 mt-0.5">Quản lý tầng & phòng</p>
                  </div>
                </button>

                {/* 4. Khuyến Mãi */}
                <button
                  onClick={() => setActiveTab('promotions')}
                  className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-purple-500/50 hover:shadow-md transition-all text-left flex flex-col justify-between h-32 active:scale-98 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-stone-900 dark:text-white leading-tight">
                      Khuyến Mãi ({promotions.length})
                    </h3>
                    <p className="text-[11px] text-stone-400 mt-0.5">Voucher & chiết khấu</p>
                  </div>
                </button>

                {/* 5. Nhân Sự */}
                <button
                  onClick={() => setActiveTab('hr')}
                  className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-purple-500/50 hover:shadow-md transition-all text-left flex flex-col justify-between h-32 active:scale-98 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-stone-900 dark:text-white leading-tight">
                      Nhân Sự ({users.length})
                    </h3>
                    <p className="text-[11px] text-stone-400 mt-0.5">Phân quyền RBAC</p>
                  </div>
                </button>

                {/* 6. ERP Quản Trị Kho */}
                <button
                  onClick={() => {
                    window.location.href = '/erp';
                  }}
                  className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-purple-500/50 hover:shadow-md transition-all text-left flex flex-col justify-between h-32 active:scale-98 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-stone-900 dark:text-white leading-tight">
                      ERP Quản Trị Kho
                    </h3>
                    <p className="text-[11px] text-stone-400 mt-0.5">Tồn kho & Định mức BOM</p>
                  </div>
                </button>

                {/* 7. Cài Đặt Cửa Hàng (full width) */}
                <button
                  onClick={() => setActiveTab('settings')}
                  className="col-span-2 p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-purple-500/50 hover:shadow-md transition-all text-left flex items-center justify-between active:scale-98 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-500/10 text-stone-600 dark:text-stone-300 flex items-center justify-center">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-stone-900 dark:text-white leading-tight">
                        Cấu Hình Cửa Hàng
                      </h3>
                      <p className="text-[11px] text-stone-400 mt-0.5">Thương hiệu, VAT, tài khoản VietQR</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Native Mobile Bottom Navigation Bar (Fixed Bottom - Only on Mobile < md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 flex justify-around items-center px-1 py-1.5 shadow-lg pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'dashboard'
              ? 'text-purple-600 dark:text-purple-400 font-bold scale-105'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-600'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Tổng quan</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
            activeTab === 'invoices'
              ? 'text-purple-600 dark:text-purple-400 font-bold scale-105'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-600'
          }`}
        >
          <div className="relative">
            <Receipt className="w-5 h-5 mb-0.5" />
            {orders.length > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-purple-600 text-white text-[9px] rounded-full font-mono">
                {orders.length > 99 ? '99+' : orders.length}
              </span>
            )}
          </div>
          <span className="text-[10px]">Hóa đơn</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'menu'
              ? 'text-purple-600 dark:text-purple-400 font-bold scale-105'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-600'
          }`}
        >
          <UtensilsCrossed className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Thực đơn</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'reports'
              ? 'text-purple-600 dark:text-purple-400 font-bold scale-105'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-600'
          }`}
        >
          <FileBarChart className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Báo cáo</span>
        </button>

        <button
          onClick={() => setActiveTab('more')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'more' || ['suppliers', 'customers', 'tables', 'promotions', 'hr', 'settings', 'cashbook', 'tax'].includes(activeTab)
              ? 'text-purple-600 dark:text-purple-400 font-bold scale-105'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-600'
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Nhiều hơn</span>
        </button>
      </nav>
    </div>
  );
};
