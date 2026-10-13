'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RestaurantTable, Order, TableStatus, Zone, WorkShift } from '@/types';
import { orderService } from '@/services/orderService';
import { realtimeEngine } from '@/services/realtimeEngine';
import { TableMap } from './TableMap';
import { CheckoutPanel } from './CheckoutPanel';
import { ShiftManagementModal } from './ShiftManagementModal';
import { formatCurrencyVND } from '@/lib/utils';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  CheckCircle2,
  RefreshCw,
  Clock,
  Lock,
  Unlock,
} from 'lucide-react';

export const CashierView: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [currentShift, setCurrentShift] = useState<WorkShift | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  // Sync state from orderService
  const refreshData = useCallback(() => {
    setTables(orderService.getTables());
    setOrders(orderService.getOrders());
    setZones(orderService.getZones());
    setCurrentShift(orderService.getCurrentShift());
  }, []);

  useEffect(() => {
    refreshData();

    // Subscribe to real-time events
    const unsubOrderCreated = realtimeEngine.subscribe('ORDER_CREATED', () => {
      refreshData();
    });

    const unsubOrderUpdated = realtimeEngine.subscribe('ORDER_UPDATED', () => {
      refreshData();
    });

    const unsubTableStatus = realtimeEngine.subscribe('TABLE_STATUS_CHANGED', () => {
      refreshData();
    });

    const unsubPaymentCompleted = realtimeEngine.subscribe('PAYMENT_COMPLETED', () => {
      refreshData();
    });

    return () => {
      unsubOrderCreated();
      unsubOrderUpdated();
      unsubTableStatus();
      unsubPaymentCompleted();
    };
  }, [refreshData]);

  // Handle table selection
  const handleSelectTable = (table: RestaurantTable) => {
    setSelectedTable(table);
  };

  // Set table status (e.g. from occupied -> billing)
  const handleSetTableStatus = (tableId: string, status: TableStatus) => {
    orderService.updateTableStatus(tableId, status);
    refreshData();
  };

  // Payment success handler
  const handlePaymentSuccess = (paidOrder: Order, freedTable: RestaurantTable) => {
    refreshData();
    // Keep or clear selected table
    setSelectedTable(null);
  };

  // Find active unpaid order for selected table
  const selectedOrder = selectedTable
    ? orders.find(
        (o) =>
          o.table_id === selectedTable.id &&
          o.payment_status === 'unpaid' &&
          o.order_status !== 'cancelled'
      ) || null
    : null;

  // Daily Shift Revenue Metrics
  const completedOrders = orders.filter((o) => o.payment_status === 'paid');
  const shiftRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="flex flex-col h-full w-full bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden">
      {/* Mobile Fixed Top App Header for Cashier (md:hidden) */}
      <div className="md:hidden bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-3 py-2 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-wide text-stone-900 dark:text-white">
              Thu Ngân
            </h1>
            <p className="text-[10px] text-stone-400">Sơ đồ bàn & Thanh toán</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsShiftModalOpen(true)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${
              currentShift && currentShift.status === 'open'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
            }`}
          >
            {currentShift && currentShift.status === 'open'
              ? `Ca: ${currentShift.cashier_name.split(' ').pop()}`
              : 'Mở Ca'}
          </button>

          <div className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px]">
            {formatCurrencyVND(shiftRevenue)}
          </div>

          <button
            onClick={refreshData}
            className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 active:scale-95 transition-all"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top Shift Metrics Bar (Desktop only: hidden md:flex) */}
      <header className="hidden md:flex px-4 sm:px-6 py-2.5 sm:py-3.5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white leading-tight truncate">
              QUẦY THU NGÂN & ĐIỀU PHỐI BÀN
            </h1>
            <p className="text-[11px] sm:text-xs text-stone-400 truncate">
              Quản lý thanh toán, hóa đơn và doanh thu thời gian thực
            </p>
          </div>
        </div>

        {/* Shift Revenue Badges & Shift Manager Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Shift Manager Toggle Button */}
          <button
            onClick={() => setIsShiftModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border active:scale-95 ${
              currentShift && currentShift.status === 'open'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {currentShift && currentShift.status === 'open'
                ? `Ca: ${currentShift.cashier_name.split(' ').pop()} (Mở)`
                : 'Chưa Mở Ca'}
            </span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-stone-500 dark:text-stone-400 hidden sm:inline">Doanh thu ca:</span>
            <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm">
              {formatCurrencyVND(shiftRevenue)}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-300">
            <Receipt className="w-3.5 h-3.5 text-stone-400" />
            <span>Đã thanh toán:</span>
            <span className="font-bold text-stone-900 dark:text-white">
              {completedOrders.length} bill
            </span>
          </div>

          <button
            onClick={refreshData}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors shrink-0"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Layout Area: Table Map + Responsive Checkout Panel */}
      <div className="flex-1 flex overflow-hidden p-3 md:p-4 gap-4 relative">
        {/* Table Map Area (Full width on mobile, flexible on desktop) */}
        <div className="flex-1 h-full overflow-hidden">
          <TableMap
            tables={tables}
            orders={orders}
            zones={zones}
            selectedTableId={selectedTable?.id || null}
            onSelectTable={handleSelectTable}
            onSetTableStatus={handleSetTableStatus}
            onRefreshData={refreshData}
          />
        </div>

        {/* Checkout Panel Area */}
        {selectedTable && (
          <>
            {/* Desktop / Tablet Landscape side-by-side */}
            <div className="hidden md:block w-96 xl:w-[440px] h-full shrink-0 animate-fade-in">
              <CheckoutPanel
                table={selectedTable}
                order={selectedOrder}
                onClose={() => setSelectedTable(null)}
                onPaymentSuccess={handlePaymentSuccess}
              />
            </div>

            {/* Mobile Bottom Sheet Slide-up (fixed inset-x-0 bottom-0 top-12 z-50) */}
            <div className="md:hidden fixed inset-0 z-50">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                onClick={() => setSelectedTable(null)}
              />
              <div className="fixed inset-x-0 bottom-0 top-12 z-50 bg-white dark:bg-stone-900 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
                <CheckoutPanel
                  table={selectedTable}
                  order={selectedOrder}
                  onClose={() => setSelectedTable(null)}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Shift Management Modal */}
      <ShiftManagementModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        onShiftUpdated={refreshData}
      />
    </div>
  );
};
