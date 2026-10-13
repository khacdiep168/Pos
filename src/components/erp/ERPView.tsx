'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RawMaterial, RecipeBOM, Supplier, PurchaseOrder, InventoryTransaction } from '@/types';
import { inventoryService } from '@/services/inventoryService';
import { realtimeEngine } from '@/services/realtimeEngine';
import { InventoryTab } from './InventoryTab';
import { RecipeBOMTab } from './RecipeBOMTab';
import { ProcurementTab } from './ProcurementTab';
import { AuditTab } from './AuditTab';
import { formatCurrencyVND } from '@/lib/utils';
import {
  Boxes,
  Layers,
  Truck,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ClipboardCheck,
} from 'lucide-react';

export const ERPView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'inventory' | 'recipes' | 'procurement' | 'audit'
  >('inventory');

  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [recipes, setRecipes] = useState<RecipeBOM[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  // Refresh data from inventoryService
  const refreshData = useCallback(() => {
    setMaterials(inventoryService.getRawMaterials());
    setRecipes(inventoryService.getRecipes());
    setSuppliers(inventoryService.getSuppliers());
    setPurchaseOrders(inventoryService.getPurchaseOrders());
    setTransactions(inventoryService.getTransactions());
  }, []);

  useEffect(() => {
    refreshData();

    // Listen to real-time events
    const unsubStockAlert = realtimeEngine.subscribe('STOCK_ALERT', () => {
      refreshData();
    });

    const unsubPayment = realtimeEngine.subscribe('PAYMENT_COMPLETED', () => {
      // Auto-deduct triggered in service, refresh state
      setTimeout(refreshData, 100);
    });

    return () => {
      unsubStockAlert();
      unsubPayment();
    };
  }, [refreshData]);

  // Overall Metrics
  const lowStockCount = materials.filter((m) => m.current_stock < m.min_stock_level).length;
  const totalStockValue = materials.reduce((s, m) => s + m.current_stock * m.avg_cost, 0);

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden font-sans">
      {/* Left Desktop Sidebar Navigation (Tabs) */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 p-4 flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-stone-900 dark:text-white leading-tight">
                ERP QUẢN TRỊ KHO
              </h2>
              <p className="text-[11px] text-stone-400">Inventory & Recipe BOM</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4" />
                <span>Tồn Kho (Inventory)</span>
              </div>
              {lowStockCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                    activeTab === 'inventory'
                      ? 'bg-white text-amber-700'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('recipes')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'recipes'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Định Mức (BOM)</span>
              </div>
              <span
                className={`text-[10px] ${
                  activeTab === 'recipes' ? 'text-white/80' : 'text-stone-400'
                }`}
              >
                {recipes.length} chỉ mục
              </span>
            </button>

            <button
              onClick={() => setActiveTab('procurement')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'procurement'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4" />
                <span>Nhập Hàng (PO)</span>
              </div>
              <span
                className={`text-[10px] ${
                  activeTab === 'procurement' ? 'text-white/80' : 'text-stone-400'
                }`}
              >
                {purchaseOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'audit'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ClipboardCheck className="w-4 h-4" />
                <span>Kiểm Kê Kho</span>
              </div>
              <span
                className={`text-[10px] ${
                  activeTab === 'audit' ? 'text-white/80' : 'text-stone-400'
                }`}
              >
                Cân bằng
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-800 text-[11px] space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Auto-Deduct Kích Hoạt</span>
          </div>
          <p className="text-stone-400 text-[10px] leading-tight">
            Kho tự động trừ theo định mức BOM ngay khi thu ngân bấm xác nhận thanh toán.
          </p>
        </div>
      </aside>

      {/* Mobile Fixed Top App Header for ERP */}
      <div className="md:hidden bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-3 py-2 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-black uppercase tracking-wide text-stone-900 dark:text-white truncate">
              Quản Trị Kho
            </h1>
            <p className="text-[10px] text-stone-400 truncate">Inventory & Recipe BOM</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-[11px]">
            <TrendingUp className="w-3 h-3 text-amber-500" />
            <span className="font-extrabold text-stone-900 dark:text-white">
              {formatCurrencyVND(totalStockValue)}
            </span>
          </div>

          {lowStockCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500 text-white animate-pulse">
              {lowStockCount} thiếu
            </span>
          )}

          <button
            onClick={refreshData}
            className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 active:scale-95 transition-all"
            title="Làm mới"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Scrollable Segmented Tab Bar for ERP */}
      <div className="flex md:hidden items-center gap-1.5 px-3 py-2 bg-stone-50 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            activeTab === 'inventory'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Tồn Kho</span>
          {lowStockCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-rose-500 text-white">
              {lowStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            activeTab === 'recipes'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Định Mức (BOM)</span>
        </button>

        <button
          onClick={() => setActiveTab('procurement')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            activeTab === 'procurement'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Nhập Hàng (PO)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            activeTab === 'audit'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Kiểm Kê Kho</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full min-w-0">
        {/* Top Header Metrics (Desktop only) */}
        <header className="hidden md:flex px-4 sm:px-6 py-2.5 sm:py-3.5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <h1 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white truncate">
              {activeTab === 'inventory' && 'Quản Lý Danh Mục Tồn Kho & Cảnh Báo'}
              {activeTab === 'recipes' && 'Cấu Hình Định Mức Món Ăn (Bill of Materials)'}
              {activeTab === 'procurement' && 'Hồ Sơ Nhà Cung Cấp & Phiếu Nhập Kho'}
              {activeTab === 'audit' && 'Kiểm Kê Kho Định Kỳ & Đối Soát Tồn Thực Tế'}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-stone-500 hidden sm:inline">Giá trị kho:</span>
              <span className="font-extrabold text-stone-900 dark:text-white">
                {formatCurrencyVND(totalStockValue)}
              </span>
            </div>

            {lowStockCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{lowStockCount} sắp hết</span>
              </div>
            )}

            <button
              onClick={refreshData}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors shrink-0"
              title="Làm mới"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Tab View Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {activeTab === 'inventory' && (
            <InventoryTab
              materials={materials}
              transactions={transactions}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'recipes' && (
            <RecipeBOMTab
              materials={materials}
              recipes={recipes}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'procurement' && (
            <ProcurementTab
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              materials={materials}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'audit' && (
            <AuditTab
              materials={materials}
              onRefresh={refreshData}
            />
          )}
        </div>
      </main>
    </div>
  );
};
