'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RestaurantTable, Zone, TableStatus } from '@/types';
import { orderService } from '@/services/orderService';
import { realtimeEngine } from '@/services/realtimeEngine';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  MapPin,
  CalendarCheck,
  RotateCcw,
  ChevronDown,
  ChevronUp,
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

  // Listen to zone/table updates
  useEffect(() => {
    const unsub = realtimeEngine.subscribe('TABLE_STATUS_CHANGED', () => {
      setZones(orderService.getZones());
    });
    return () => unsub();
  }, []);

  const selectedTable = tables.find((t) => t.id === selectedTableId);

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
  }, [selectedTable?.zone_id]);

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

  // Filter tables: Step 1 must match selectedZoneId,
  // Step 2: ONLY show tables that are 'available' or 'reserved' (hide occupied and billing completely)
  const eligibleTablesInZone = useMemo(() => {
    return tables.filter((t) => {
      // Must match selected zone
      if (selectedZoneId && t.zone_id !== selectedZoneId) return false;
      // Must only be available or reserved (hide occupied & billing)
      return t.status === 'available' || t.status === 'reserved';
    });
  }, [tables, selectedZoneId]);

  // Calculate available/reserved count per zone for badges
  const zoneStats = useMemo(() => {
    const stats: Record<string, { available: number; reserved: number; totalEligible: number }> = {};
    zones.forEach((z) => {
      const zTables = tables.filter((t) => t.zone_id === z.id);
      const avail = zTables.filter((t) => t.status === 'available').length;
      const res = zTables.filter((t) => t.status === 'reserved').length;
      stats[z.id] = {
        available: avail,
        reserved: res,
        totalEligible: avail + res,
      };
    });
    return stats;
  }, [tables, zones]);

  const activeZone = zones.find((z) => z.id === selectedZoneId);

  // If collapsible and not expanded, render compact view
  if (collapsible && !isExpanded && selectedTable) {
    const tableZone = zones.find((z) => z.id === selectedTable.zone_id);
    return (
      <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-stone-900 dark:text-white truncate flex items-center gap-1.5">
              <span>{tableZone ? `${tableZone.name} - ` : ''}Bàn {selectedTable.table_number}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                  selectedTable.status === 'reserved'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                }`}
              >
                {selectedTable.status === 'reserved' ? 'Đã đặt' : 'Trống'}
              </span>
            </div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400">
              {selectedTable.capacity} chỗ ngồi • Bấm để đổi bàn
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-amber-500/40 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shrink-0 flex items-center gap-1"
        >
          <span>Đổi bàn</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-400">
        <span className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200">
          <MapPin className="w-3.5 h-3.5 text-amber-500" />
          <span>Luồng chọn bàn 2 bước</span>
        </span>
        <div className="flex items-center gap-1.5">
          {selectedTable && (
            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/20 text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Bàn: {selectedTable.table_number}
            </span>
          )}
          {collapsible && selectedTable && (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              title="Thu gọn"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* BƯỚC 1: Chọn Khu Vực (Zone) Trước */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
          <span>Bước 1: Chọn Khu Vực (Zone) *</span>
          <span className="text-stone-400 font-normal">
            {activeZone ? activeZone.name : 'Chưa chọn'}
          </span>
        </div>
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
          {zones.map((zone) => {
            const isSelected = zone.id === selectedZoneId;
            const stats = zoneStats[zone.id] || { available: 0, reserved: 0, totalEligible: 0 };

            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZoneId(zone.id)}
                className={`px-2 py-1.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs ring-2 ring-amber-500/20 font-bold'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                }`}
              >
                <div className="truncate text-xs leading-tight">{zone.name}</div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    isSelected ? 'text-amber-100 font-medium' : 'text-stone-400 dark:text-stone-500'
                  }`}
                >
                  {stats.totalEligible > 0 ? (
                    <span>{stats.totalEligible} bàn nhận</span>
                  ) : (
                    <span className="text-rose-500 dark:text-rose-400 font-medium">Hết bàn</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* BƯỚC 2: Chọn Bàn Khả Dụng (Trống hoặc Đã Đặt) */}
      <div className="space-y-1.5 pt-1 border-t border-stone-200/60 dark:border-stone-800">
        <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
          <span>Bước 2: Chọn Bàn Khả Dụng ({eligibleTablesInZone.length} bàn) *</span>
          <span className="text-[10px] text-stone-400 italic">Ẩn bàn đang dùng & chờ tính</span>
        </div>

        {eligibleTablesInZone.length === 0 ? (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
              Khu vực này hiện không còn bàn trống!
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Tất cả các bàn tại {activeZone?.name || 'khu vực này'} đang có khách hoặc đang thanh toán. Vui lòng chọn khu vực khác.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-0.5">
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
                  {/* Top: Table Number & Status Indicator */}
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

                  {/* Middle: Capacity */}
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1 font-medium">
                    <Users className="w-2.5 h-2.5" />
                    <span>{table.capacity} chỗ ngồi</span>
                  </div>

                  {/* Bottom: Fast Action Button (Đặt bàn / Hủy đặt) */}
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
        )}
      </div>

      {!selectedTableId && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Vui lòng chọn số bàn trước khi gửi order xuống bếp</span>
        </p>
      )}
    </div>
  );
};
