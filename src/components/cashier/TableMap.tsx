'use client';

import React, { useState } from 'react';
import { RestaurantTable, TableStatus, Order, Zone } from '@/types';
import { formatCurrencyVND } from '@/lib/utils';
import { orderService } from '@/services/orderService';
import { MoveMergeTableModal } from './MoveMergeTableModal';
import {
  Users,
  UtensilsCrossed,
  Receipt,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  MapPin,
  Layers,
} from 'lucide-react';

interface TableMapProps {
  tables: RestaurantTable[];
  orders: Order[];
  zones?: Zone[];
  selectedTableId: string | null;
  onSelectTable: (table: RestaurantTable) => void;
  onSetTableStatus?: (tableId: string, status: TableStatus) => void;
  onRefreshData?: () => void;
}

export const TableMap: React.FC<TableMapProps> = ({
  tables,
  orders,
  zones = [],
  selectedTableId,
  onSelectTable,
  onSetTableStatus,
  onRefreshData,
}) => {
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('all');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [moveMergeTable, setMoveMergeTable] = useState<RestaurantTable | null>(null);

  // Filter tables by status and zone
  const filteredTables = tables.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (selectedZoneId !== 'all' && t.zone_id !== selectedZoneId) return false;
    return true;
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

      {/* Zone Navigation Tabs */}
      {zones.length > 0 && (
        <div className="px-4 py-2 border-b border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-900/40 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-[11px] font-bold text-stone-400 shrink-0 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span>Khu vực:</span>
          </span>

          <button
            onClick={() => setSelectedZoneId('all')}
            className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-all ${
              selectedZoneId === 'all'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            Tất cả khu vực
          </button>

          {zones.map((z) => {
            const count = tables.filter((t) => t.zone_id === z.id).length;
            const hasOccupied = tables.some((t) => t.zone_id === z.id && t.status !== 'available');
            return (
              <button
                key={z.id}
                onClick={() => setSelectedZoneId(z.id)}
                className={`px-3 py-1 rounded-lg font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                  selectedZoneId === z.id
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                <span>{z.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                  hasOccupied
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bento Section: 🛍️ Đơn Mang Về Đang Chờ (Takeaway Queue) */}
      <div className="p-4 border-b border-stone-200/80 dark:border-stone-800 bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-transparent shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-base">🛍️</span>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-2">
                <span>Đơn Mang Về Đang Chờ (Takeaway Queue)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 font-mono tabular-nums">
                  {orders.filter(
                    (o) =>
                      (o.table_id === 'takeaway' || o.table_id?.startsWith('takeaway')) &&
                      o.payment_status === 'unpaid' &&
                      o.order_status !== 'cancelled'
                  ).length}{' '}
                  đơn
                </span>
              </h3>
              <p className="text-[10px] text-stone-400">
                Click vào thẻ để mở cổng thanh toán hoặc hủy đơn ngay lập tức
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              // Tạo nhanh một đơn mang về trống và mở checkout
              const { tableId, tableNumber } = orderService.generateNextTakeawayLabel();
              const takeawayTable: RestaurantTable = {
                id: tableId,
                table_number: tableNumber,
                capacity: 1,
                status: 'occupied',
              };
              onSelectTable(takeawayTable);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <span>+</span>
            <span className="hidden sm:inline">Tạo Đơn Mang Về</span>
            <span className="sm:hidden">Mang về</span>
          </button>
        </div>

        {/* Horizontal scrollable takeaway cards queue */}
        {(() => {
          const takeawayList = orders.filter(
            (o) =>
              (o.table_id === 'takeaway' || o.table_id?.startsWith('takeaway')) &&
              o.payment_status === 'unpaid' &&
              o.order_status !== 'cancelled'
          );

          if (takeawayList.length === 0) {
            return (
              <div className="p-3 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 text-center text-xs text-stone-400">
                Chưa có đơn mang về nào đang chờ thanh toán
              </div>
            );
          }

          return (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
              {takeawayList.map((tkOrder) => {
                const isSelected = selectedTableId === tkOrder.table_id;
                const itemCount = tkOrder.items.reduce((s, i) => s + i.quantity, 0);

                return (
                  <div
                    key={tkOrder.id}
                    onClick={() => {
                      onSelectTable({
                        id: tkOrder.table_id,
                        table_number: tkOrder.table_number || 'Mang Về',
                        capacity: 1,
                        status: 'occupied',
                      });
                    }}
                    className={`shrink-0 w-52 sm:w-56 p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 ring-2 ring-orange-500/30'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-orange-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                          <span>🛍️ {tkOrder.table_number}</span>
                          <span className="text-[10px] font-mono text-stone-400">
                            #{tkOrder.id.slice(-4)}
                          </span>
                        </div>
                        {tkOrder.customer_name && (
                          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold truncate max-w-[130px] mt-0.5">
                            👤 {tkOrder.customer_name}
                          </p>
                        )}
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                        {tkOrder.order_status === 'ready'
                          ? 'Sẵn sàng'
                          : tkOrder.order_status === 'cooking'
                          ? 'Đang làm'
                          : 'Đang chờ'}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                        {itemCount} món
                      </span>
                      <span className="text-xs font-black text-orange-600 dark:text-orange-400 tabular-nums">
                        {formatCurrencyVND(tkOrder.total_amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Grid of Tables */}
      <div className="flex-1 p-5 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredTables.map((table) => {
            const isSelected = selectedTableId === table.id;
            const zone = zones.find((z) => z.id === table.zone_id);

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
                label: 'Chờ tính tiền',
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
                className={`group relative rounded-2xl p-4 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[155px] shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                  statusConfig.bg
                } ${statusConfig.border} ${
                  isSelected ? 'ring-3 ring-amber-500 border-amber-500 shadow-lg' : ''
                }`}
              >
                {/* Top Row: Table Name + Zone & Status Badge */}
                <div className="flex items-start justify-between gap-1.5">
                  <div>
                    <h3 className="text-base font-black text-stone-900 dark:text-white leading-tight">
                      {table.table_number}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                      <span>{table.capacity} khách</span>
                      {zone && (
                        <span className="px-1.5 py-0.2 rounded bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold truncate max-w-[85px]">
                          {zone.name}
                        </span>
                      )}
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
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-amber-600 dark:text-amber-400 group-hover:underline flex items-center gap-1">
                        <Receipt className="w-3 h-3" />
                        Tính tiền
                      </span>

                      {/* Nút Chuyển/Gộp bàn */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMoveMergeTable(table);
                        }}
                        className="p-1 rounded-lg bg-stone-200/80 dark:bg-stone-800 hover:bg-amber-500 hover:text-white text-stone-600 dark:text-stone-300 transition-colors ml-1"
                        title="Chuyển hoặc Gộp bàn này"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-stone-400">
                      {table.status === 'reserved' ? 'Bàn đã đặt trước' : 'Bàn trống'}
                    </span>
                  )}

                  {table.status === 'available' && onSetTableStatus && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetTableStatus(table.id, 'reserved');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold hover:bg-purple-600 hover:text-white transition-colors shadow-2xs"
                      title="Đặt bàn trước (Reservation)"
                    >
                      Đặt bàn
                    </button>
                  )}

                  {table.status === 'reserved' && onSetTableStatus && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetTableStatus(table.id, 'available');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-[10px] font-bold hover:bg-stone-300 transition-colors"
                      title="Hủy đặt chỗ bàn này"
                    >
                      Hủy đặt
                    </button>
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

      {/* Move & Merge Table Modal */}
      {moveMergeTable && (
        <MoveMergeTableModal
          isOpen={!!moveMergeTable}
          onClose={() => setMoveMergeTable(null)}
          sourceTable={moveMergeTable}
          tables={tables}
          zones={zones}
          orders={orders}
          onSuccess={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}
    </div>
  );
};
