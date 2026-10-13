'use client';

import React, { useState } from 'react';
import { RestaurantTable, TableStatus, Order } from '@/types';
import { formatCurrencyVND } from '@/lib/utils';
import {
  Users,
  UtensilsCrossed,
  Receipt,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface TableMapProps {
  tables: RestaurantTable[];
  orders: Order[];
  selectedTableId: string | null;
  onSelectTable: (table: RestaurantTable) => void;
  onSetTableStatus?: (tableId: string, status: TableStatus) => void;
}

export const TableMap: React.FC<TableMapProps> = ({
  tables,
  orders,
  selectedTableId,
  onSelectTable,
  onSetTableStatus,
}) => {
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('all');

  // Filter tables
  const filteredTables = tables.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  // Calculate table metrics
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const billingCount = tables.filter((t) => t.status === 'billing').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
      {/* Top Header & Status Filter Pills */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50 dark:bg-stone-900/50">
        <div>
          <h2 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <span>Sơ Đồ Bàn Ăn</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              {tables.length} bàn
            </span>
          </h2>
          <p className="text-xs text-stone-400">
            Click vào bàn đang có khách hoặc chờ tính tiền để mở cổng thanh toán
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-400'
            }`}
          >
            Tất cả ({tables.length})
          </button>

          <button
            onClick={() => setStatusFilter('occupied')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === 'occupied'
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Đang phục vụ ({occupiedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('billing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === 'billing'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span>Chờ tính tiền ({billingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('available')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Trống ({availableCount})</span>
          </button>
        </div>
      </div>

      {/* Grid of Tables */}
      <div className="flex-1 p-5 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredTables.map((table) => {
            const isSelected = selectedTableId === table.id;

            // Find active unpaid order for this table
            const activeOrder = orders.find(
              (o) =>
                o.table_id === table.id &&
                o.payment_status === 'unpaid' &&
                o.order_status !== 'cancelled'
            );

            // Styling based on status
            const statusConfig = {
              available: {
                bg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
                border: 'border-emerald-200 dark:border-emerald-800/60',
                badgeBg: 'bg-emerald-500 text-white',
                label: 'Trống',
                textColor: 'text-emerald-700 dark:text-emerald-300',
              },
              occupied: {
                bg: 'bg-amber-50/80 dark:bg-amber-950/30',
                border: 'border-amber-300 dark:border-amber-700/80',
                badgeBg: 'bg-amber-500 text-white',
                label: 'Đang dùng',
                textColor: 'text-amber-800 dark:text-amber-300',
              },
              billing: {
                bg: 'bg-rose-50 dark:bg-rose-950/40',
                border: 'border-rose-400 dark:border-rose-700',
                badgeBg: 'bg-rose-600 text-white animate-pulse',
                label: 'Chờ thanh toán',
                textColor: 'text-rose-700 dark:text-rose-300',
              },
              reserved: {
                bg: 'bg-purple-50/60 dark:bg-purple-950/20',
                border: 'border-purple-200 dark:border-purple-800',
                badgeBg: 'bg-purple-600 text-white',
                label: 'Đã đặt',
                textColor: 'text-purple-700 dark:text-purple-300',
              },
            }[table.status];

            return (
              <div
                key={table.id}
                onClick={() => onSelectTable(table)}
                className={`group relative rounded-2xl p-4 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[145px] shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                  statusConfig.bg
                } ${statusConfig.border} ${
                  isSelected ? 'ring-3 ring-amber-500 border-amber-500 shadow-lg' : ''
                }`}
              >
                {/* Top Row: Table Name + Status Badge */}
                <div className="flex items-start justify-between gap-1.5">
                  <div>
                    <h3 className="text-base font-black text-stone-900 dark:text-white leading-tight">
                      {table.table_number}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                      <Users className="w-3 h-3" />
                      <span>{table.capacity} khách</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs whitespace-nowrap ${statusConfig.badgeBg}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                {/* Middle Content: Order summary if active */}
                <div className="my-2">
                  {activeOrder ? (
                    <div className="space-y-1">
                      <div className="text-xs font-extrabold text-stone-900 dark:text-white">
                        {formatCurrencyVND(activeOrder.total_amount)}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                        {activeOrder.items.reduce((s, i) => s + i.quantity, 0)} món • #{activeOrder.id.slice(-4)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-stone-400 dark:text-stone-500 italic">
                      {table.status === 'available' ? 'Sẵn sàng đón khách' : 'Chưa có order'}
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Action prompt */}
                <div className="pt-2 border-t border-stone-200/50 dark:border-stone-800/60 flex items-center justify-between text-[11px]">
                  {activeOrder ? (
                    <span className="font-bold text-amber-600 dark:text-amber-400 group-hover:underline flex items-center gap-1">
                      <Receipt className="w-3 h-3" />
                      Tính tiền
                    </span>
                  ) : (
                    <span className="text-stone-400">Bàn trống</span>
                  )}

                  {table.status === 'occupied' && onSetTableStatus && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetTableStatus(table.id, 'billing');
                      }}
                      className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold hover:bg-rose-500 hover:text-white transition-colors"
                      title="Chuyển trạng thái yêu cầu tính tiền"
                    >
                      Báo bill
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
