'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RestaurantTable, Zone, TableStatus, Order } from '@/types';
import { orderService } from '@/services/orderService';
import { realtimeEngine } from '@/services/realtimeEngine';
import { formatCurrencyVND } from '@/lib/utils';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  MapPin,
  CalendarCheck,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Receipt,
  UtensilsCrossed,
  Clock,
  Sparkles,
} from 'lucide-react';

interface TableSelectorProps {
  tables: RestaurantTable[];
  selectedTableId: string | null;
  onSelectTable: (table: RestaurantTable) => void;
  onTableStatusChange?: (tableId: string, newStatus: TableStatus) => void;
  collapsible?: boolean;
  onAfterSelect?: () => void;
}

export const TableSelector: React.FC<TableSelectorProps> = ({
  tables,
  selectedTableId,
  onSelectTable,
  onTableStatusChange,
  collapsible = false,
  onAfterSelect,
}) => {
  const [zones, setZones] = useState<Zone[]>(() => orderService.getZones());
  const [orders, setOrders] = useState<Order[]>(() => orderService.getOrders());

  // Channel Mode: 'dine_in' | 'takeaway' | 'delivery'
  const [selectedChannel, setSelectedChannel] = useState<'dine_in' | 'takeaway' | 'delivery'>(() => {
    if (selectedTableId?.startsWith('delivery')) return 'delivery';
    if (selectedTableId?.startsWith('takeaway')) return 'takeaway';
    return 'dine_in';
  });

  // Dual Tabs for Dine-in: Mở Đơn Mới vs Đang Phục Vụ
  const [activeTab, setActiveTab] = useState<'new_order' | 'serving'>('new_order');

  // Listen to zone/table/order updates
  useEffect(() => {
    const unsubTable = realtimeEngine.subscribe('TABLE_STATUS_CHANGED', () => {
      setZones(orderService.getZones());
      setOrders(orderService.getOrders());
    });
    const unsubOrder = realtimeEngine.subscribe('ORDER_UPDATED', () => {
      setOrders(orderService.getOrders());
    });
    return () => {
      unsubTable();
      unsubOrder();
    };
  }, []);

  const selectedTable = tables.find((t) => t.id === selectedTableId) || (
    selectedTableId?.startsWith('delivery')
      ? {
          id: selectedTableId,
          table_number: orders.find((o) => o.table_id === selectedTableId)?.table_number || 'Đơn App Giao Hàng',
          capacity: 1,
          status: 'occupied' as TableStatus,
          order_channel: 'delivery' as const,
        }
      : selectedTableId?.startsWith('takeaway')
      ? {
          id: selectedTableId,
          table_number: orders.find((o) => o.table_id === selectedTableId)?.table_number || 'Mang Về',
          capacity: 1,
          status: 'occupied' as TableStatus,
          order_channel: 'takeaway' as const,
        }
      : null
  );

  // Initialize selected zone with the selected table's zone, or first available zone
  const [selectedZoneId, setSelectedZoneId] = useState<string>(() => {
    if (selectedTable?.zone_id) return selectedTable.zone_id;
    return zones[0]?.id || '';
  });

  // Collapsible state (if collapsible is true and a table is already selected, start collapsed)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (collapsible && selectedTableId) return false;
    return true;
  });

  // Keep selected zone in sync if selectedTable changes from outside
  useEffect(() => {
    if (selectedTable?.zone_id && selectedTable.zone_id !== selectedZoneId) {
      setSelectedZoneId(selectedTable.zone_id);
    }
    if (selectedTableId?.startsWith('delivery')) {
      setSelectedChannel('delivery');
    } else if (selectedTableId?.startsWith('takeaway')) {
      setSelectedChannel('takeaway');
    } else if (selectedTableId) {
      setSelectedChannel('dine_in');
    }
  }, [selectedTable?.zone_id, selectedTableId]);

  // Handle setting table to reserved or available
  const handleToggleReservation = (e: React.MouseEvent, table: RestaurantTable) => {
    e.stopPropagation();
    const newStatus: TableStatus = table.status === 'reserved' ? 'available' : 'reserved';
    if (onTableStatusChange) {
      onTableStatusChange(table.id, newStatus);
    } else {
      orderService.updateTableStatus(table.id, newStatus);
    }
  };

  const handleSelect = (table: RestaurantTable) => {
    onSelectTable(table);
    if (collapsible) {
      setIsExpanded(false);
    }
    onAfterSelect?.();
  };

  // Tab 1: Available & Reserved tables in zone
  const eligibleTablesInZone = useMemo(() => {
    return tables.filter((t) => {
      if (selectedZoneId && t.zone_id !== selectedZoneId) return false;
      return t.status === 'available' || t.status === 'reserved';
    });
  }, [tables, selectedZoneId]);

  // Tab 2: Occupied & Billing tables (Serving) across all zones or selected zone
  const occupiedTables = useMemo(() => {
    return tables.filter((t) => {
      if (t.status !== 'occupied' && t.status !== 'billing') return false;
      if (selectedZoneId && t.zone_id !== selectedZoneId) return false;
      return true;
    });
  }, [tables, selectedZoneId]);

  // Active Takeaway and Delivery orders list
  const activeTakeawayOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.order_channel === 'takeaway' || o.table_id?.startsWith('takeaway')) &&
        o.payment_status === 'unpaid' &&
        o.order_status !== 'cancelled'
    );
  }, [orders]);

  const activeDeliveryOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.order_channel === 'delivery' || o.table_id?.startsWith('delivery')) &&
        o.payment_status === 'unpaid' &&
        o.order_status !== 'cancelled'
    );
  }, [orders]);

  // Calculate available/reserved count per zone for badges
  const zoneStats = useMemo(() => {
    const stats: Record<string, { available: number; reserved: number; occupied: number }> = {};
    zones.forEach((z) => {
      const zTables = tables.filter((t) => t.zone_id === z.id);
      const avail = zTables.filter((t) => t.status === 'available').length;
      const res = zTables.filter((t) => t.status === 'reserved').length;
      const occ = zTables.filter((t) => t.status === 'occupied' || t.status === 'billing').length;
      stats[z.id] = {
        available: avail,
        reserved: res,
        occupied: occ,
      };
    });
    return stats;
  }, [tables, zones]);

  const activeZone = zones.find((z) => z.id === selectedZoneId);

  // Overall counts for tabs
  const totalAvailableCount = tables.filter((t) => t.status === 'available' || t.status === 'reserved').length;
  const totalOccupiedCount = tables.filter((t) => t.status === 'occupied' || t.status === 'billing').length;

  // Active order for selected table (if occupied)
  const activeExistingOrder = selectedTable
    ? orders.find(
        (o) =>
          o.table_id === selectedTable.id &&
          o.payment_status === 'unpaid' &&
          o.order_status !== 'cancelled'
      ) || null
    : null;

  // If collapsible and not expanded, render compact view
  if (collapsible && !isExpanded && selectedTable) {
    const isDelivery = selectedTable.order_channel === 'delivery' || selectedTable.id.startsWith('delivery');
    const isTakeaway = selectedTable.order_channel === 'takeaway' || selectedTable.id.startsWith('takeaway');
    const tableZone = zones.find((z) => z.id === selectedTable.zone_id);

    return (
      <div className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 shadow-xs ${
        activeExistingOrder
          ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
          : isDelivery
          ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500/30'
          : isTakeaway
          ? 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-500/30'
          : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500/30'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
            activeExistingOrder ? 'bg-rose-600 text-white' : isDelivery ? 'bg-emerald-600 text-white' : isTakeaway ? 'bg-orange-500 text-white' : 'bg-amber-500 text-white'
          }`}>
            {isDelivery ? <span>🛵</span> : isTakeaway ? <span>🛍️</span> : <CheckCircle2 className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-stone-900 dark:text-white truncate flex items-center gap-1.5">
              <span>
                {isDelivery
                  ? selectedTable.table_number || 'Đơn App Giao Hàng'
                  : isTakeaway
                  ? selectedTable.table_number || 'Khách Mang Về'
                  : `${tableZone ? `${tableZone.name} - ` : ''}Bàn ${selectedTable.table_number}`}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                  activeExistingOrder
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                    : isDelivery
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                    : isTakeaway
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300'
                    : selectedTable.status === 'reserved'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                }`}
              >
                {activeExistingOrder
                  ? 'Đang phục vụ'
                  : isDelivery
                  ? 'App Giao Hàng'
                  : isTakeaway
                  ? 'Mang về'
                  : selectedTable.status === 'reserved'
                  ? 'Đã đặt'
                  : 'Trống'}
              </span>
            </div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
              {activeExistingOrder
                ? `Đang có đơn #${activeExistingOrder.id.slice(-4)} (${activeExistingOrder.items.reduce((s, i) => s + i.quantity, 0)} món) • Gọi thêm món`
                : isDelivery
                ? 'Đơn giao hàng App • Bấm để đổi kênh phục vụ'
                : isTakeaway
                ? 'Đơn mang về • Bấm để đổi sang bàn'
                : `${selectedTable.capacity} chỗ ngồi • Bấm để đổi bàn`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 hover:border-amber-500 transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
        >
          <span>Đổi kênh / bàn</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 3 Serving Mode Channels (Bento Tab bar) */}
      <div className="grid grid-cols-3 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl gap-1 border border-stone-200/60 dark:border-stone-700/60">
        <button
          type="button"
          onClick={() => setSelectedChannel('dine_in')}
          className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            selectedChannel === 'dine_in'
              ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-sm border border-stone-200/50 dark:border-stone-700'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <span>🍽️</span>
          <span className="truncate">Tại Bàn</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedChannel('takeaway')}
          className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            selectedChannel === 'takeaway'
              ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-sm border border-stone-200/50 dark:border-stone-700'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <span>🛍️</span>
          <span className="truncate">Mang Về</span>
          {activeTakeawayOrders.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
              {activeTakeawayOrders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSelectedChannel('delivery')}
          className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            selectedChannel === 'delivery'
              ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-stone-200/50 dark:border-stone-700'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <span>🛵</span>
          <span className="truncate">App Giao</span>
          {activeDeliveryOrders.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
              {activeDeliveryOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* CHANNEL 2: KHÁCH MANG VỀ (TAKEAWAY) */}
      {selectedChannel === 'takeaway' && (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => {
              const { tableId, tableNumber } = orderService.generateNextTakeawayLabel();
              const takeawayTable: RestaurantTable = {
                id: tableId,
                table_number: tableNumber,
                capacity: 1,
                status: 'available',
                order_channel: 'takeaway',
              };
              handleSelect(takeawayTable);
            }}
            className="w-full p-3 rounded-2xl border-2 border-orange-500 bg-gradient-to-r from-orange-500 to-amber-500 text-white transition-all flex items-center justify-between shadow-md active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🛍️</span>
              <div className="text-left">
                <div className="text-xs font-black flex items-center gap-1.5">
                  <span>+ Tạo Đơn Mang Về Mới</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-extrabold uppercase">
                    Bán Nhanh
                  </span>
                </div>
                <p className="text-[10px] text-white/90 mt-0.5">
                  Áp dụng giá mang về & trừ nguyên liệu bao bì (ly/túi/hộp)
                </p>
              </div>
            </div>
            <div className="text-xs font-black px-3 py-1 rounded-xl bg-white text-orange-700 shadow-xs shrink-0">
              Tạo đơn ngay
            </div>
          </button>

          {/* Active takeaway orders list if any */}
          {activeTakeawayOrders.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                Các đơn mang về đang chờ xử lý ({activeTakeawayOrders.length}):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-0.5">
                {activeTakeawayOrders.map((ord) => {
                  const isSelected = selectedTableId === ord.table_id;
                  const itemCount = ord.items.reduce((s, i) => s + i.quantity, 0);
                  return (
                    <div
                      key={ord.id}
                      onClick={() => {
                        handleSelect({
                          id: ord.table_id,
                          table_number: ord.table_number || 'Mang Về',
                          capacity: 1,
                          status: 'occupied',
                          order_channel: 'takeaway',
                        });
                      }}
                      className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 ring-2 ring-orange-500/20'
                          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-orange-400'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-black text-stone-900 dark:text-white">
                          🛍️ {ord.table_number}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {itemCount} món • {formatCurrencyVND(ord.total_amount)}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                        {isSelected ? '✓ Đang chọn' : '+ Gọi thêm'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHANNEL 3: ĐƠN APP GIAO HÀNG (DELIVERY) */}
      {selectedChannel === 'delivery' && (
        <div className="space-y-2.5">
          <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
            Chọn nền tảng giao hàng để mở đơn mới:
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'grabfood', name: 'GrabFood', icon: '🟢', bg: 'hover:border-emerald-500 border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30' },
              { id: 'shopeefood', name: 'ShopeeFood', icon: '🟠', bg: 'hover:border-orange-500 border-orange-300 dark:border-orange-800/80 bg-orange-50/50 dark:bg-orange-950/30' },
              { id: 'befood', name: 'BeFood', icon: '🟡', bg: 'hover:border-yellow-500 border-yellow-300 dark:border-yellow-800/80 bg-yellow-50/50 dark:bg-yellow-950/30' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  const { tableId, tableNumber } = orderService.generateNextDeliveryLabel(p.id as any);
                  const deliveryTable: RestaurantTable = {
                    id: tableId,
                    table_number: tableNumber,
                    capacity: 1,
                    status: 'available',
                    order_channel: 'delivery',
                    delivery_platform: p.id as any,
                  };
                  handleSelect(deliveryTable);
                }}
                className={`p-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center gap-1 active:scale-95 shadow-2xs ${p.bg}`}
              >
                <span className="text-xl">{p.icon}</span>
                <span className="text-xs font-black text-stone-900 dark:text-white">{p.name}</span>
                <span className="text-[9px] text-stone-400 uppercase font-bold">+ Mở Đơn</span>
              </button>
            ))}
          </div>

          {/* Active delivery orders list */}
          {activeDeliveryOrders.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                Các đơn App đang xử lý ({activeDeliveryOrders.length}):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-0.5">
                {activeDeliveryOrders.map((ord) => {
                  const isSelected = selectedTableId === ord.table_id;
                  const itemCount = ord.items.reduce((s, i) => s + i.quantity, 0);
                  const platform = ord.delivery_platform || 'grabfood';
                  const platformLabel = platform === 'grabfood' ? 'Grab' : platform === 'shopeefood' ? 'Shopee' : 'Be';

                  return (
                    <div
                      key={ord.id}
                      onClick={() => {
                        handleSelect({
                          id: ord.table_id,
                          table_number: ord.table_number || 'Đơn App',
                          capacity: 1,
                          status: 'occupied',
                          order_channel: 'delivery',
                          delivery_platform: ord.delivery_platform,
                        });
                      }}
                      className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-emerald-400'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-1">
                          <span>🛵 [{platformLabel}] {ord.table_number}</span>
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {itemCount} món • {formatCurrencyVND(ord.total_amount)}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {isSelected ? '✓ Đang chọn' : '+ Thêm món'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHANNEL 1: TẠI BÀN (DINE-IN) */}
      {selectedChannel === 'dine_in' && (
        <div className="space-y-3">
          {/* Dual Tabs for Dine-in */}
          <div className="grid grid-cols-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('new_order')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'new_order'
                  ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Bàn Trống ({totalAvailableCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('serving')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'serving'
                  ? 'bg-white dark:bg-stone-900 text-rose-700 dark:text-rose-400 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Đang Phục Vụ ({totalOccupiedCount})</span>
            </button>
          </div>

          {/* Chọn Khu Vực (Zone) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
              <span>Khu Vực (Zone):</span>
              <span className="text-stone-400 font-normal">
                {activeZone ? activeZone.name : 'Tất cả'}
              </span>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
          {zones.map((zone) => {
            const isSelected = zone.id === selectedZoneId;
            const stats = zoneStats[zone.id] || { available: 0, reserved: 0, occupied: 0 };
            const count = activeTab === 'new_order' ? stats.available + stats.reserved : stats.occupied;

            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZoneId(zone.id)}
                className={`px-2 py-1.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? activeTab === 'new_order'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs ring-2 ring-amber-500/20 font-bold'
                      : 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-600/20 font-bold'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                }`}
              >
                <div className="truncate text-xs leading-tight">{zone.name}</div>
                <div
                  className={`text-[10px] mt-0.5 tabular-nums ${
                    isSelected ? 'text-white/80 font-medium' : 'text-stone-400 dark:text-stone-500'
                  }`}
                >
                  {count} bàn
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* DANH SÁCH BÀN TƯƠNG ỨNG THEO TAB */}
      <div>
        {activeTab === 'new_order' ? (
          // TAB 1: BÀN TRỐNG / ĐẶT TRƯỚC
          eligibleTablesInZone.length === 0 ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Khu vực này hiện không còn bàn trống!
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Tất cả các bàn tại {activeZone?.name || 'khu vực này'} đang có khách. Chọn tab "Đang Phục Vụ" để gọi thêm món hoặc chọn khu vực khác.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-0.5">
              {eligibleTablesInZone.map((table) => {
                const isSelected = table.id === selectedTableId;
                const isReserved = table.status === 'reserved';

                return (
                  <div
                    key={table.id}
                    onClick={() => handleSelect(table)}
                    className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left relative group ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-500/20 shadow-xs'
                        : isReserved
                        ? 'border-purple-200 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/20 hover:border-purple-400'
                        : 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs text-stone-900 dark:text-white leading-tight">
                        {table.table_number}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          isReserved
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                        }`}
                      >
                        {isReserved ? 'Đã đặt' : 'Trống'}
                      </span>
                    </div>

                    <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1 font-medium tabular-nums">
                      <Users className="w-2.5 h-2.5" />
                      <span>{table.capacity} chỗ ngồi</span>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-stone-200/50 dark:border-stone-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-400 group-hover:text-amber-600 transition-colors">
                        {isSelected ? '✓ Đang chọn' : 'Bấm chọn'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleToggleReservation(e, table)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 transition-all active:scale-95 ${
                          isReserved
                            ? 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-300'
                            : 'bg-purple-600 text-white hover:bg-purple-500 shadow-2xs'
                        }`}
                        title={isReserved ? 'Hủy trạng thái đặt chỗ' : 'Chuyển sang trạng thái Đặt trước (Reserved)'}
                      >
                        {isReserved ? (
                          <>
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Hủy đặt</span>
                          </>
                        ) : (
                          <>
                            <CalendarCheck className="w-2.5 h-2.5" />
                            <span>Đặt bàn</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // TAB 2: ĐANG PHỤC VỤ (GỌI THÊM / XEM ĐƠN)
          occupiedTables.length === 0 ? (
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-dashed border-stone-200 dark:border-stone-700 text-center space-y-1">
              <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Không có bàn nào đang phục vụ tại khu vực này
              </p>
              <p className="text-[11px] text-stone-400">
                Chọn tab "Bàn Trống" để mở order bàn mới cho khách.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-0.5">
              {occupiedTables.map((table) => {
                const isSelected = table.id === selectedTableId;
                const order = orders.find(
                  (o) =>
                    o.table_id === table.id &&
                    o.payment_status === 'unpaid' &&
                    o.order_status !== 'cancelled'
                );
                const itemCount = order ? order.items.reduce((s, i) => s + i.quantity, 0) : 0;

                return (
                  <div
                    key={table.id}
                    onClick={() => handleSelect(table)}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left shadow-xs hover:shadow-md ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-500/20'
                        : 'border-rose-200 dark:border-rose-800/70 bg-white dark:bg-stone-900 hover:border-rose-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-extrabold text-xs text-stone-900 dark:text-white flex items-center gap-1.5">
                          <span>Bàn {table.table_number}</span>
                          {order && (
                            <span className="text-[10px] font-mono font-semibold px-1 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-amber-600 dark:text-amber-400">
                              #{order.id.slice(-4)}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5 tabular-nums">
                          {table.capacity} chỗ ngồi • {order ? `${itemCount} món` : 'Đang bận'}
                        </div>
                      </div>

                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                        {table.status === 'billing' ? 'Chờ thanh toán' : 'Đang dùng'}
                      </span>
                    </div>

                    {order && (
                      <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                        <span className="font-black text-rose-600 dark:text-rose-400 tabular-nums">
                          {formatCurrencyVND(order.total_amount)}
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <span>+ Gọi thêm món</span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
      </div>
      )}

      {!selectedTableId && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Vui lòng chọn bàn hoặc kênh phục vụ trước khi gửi order</span>
        </p>
      )}
    </div>
  );
};
