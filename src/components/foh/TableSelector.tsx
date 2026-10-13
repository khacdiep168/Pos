'use client';

import React from 'react';
import { RestaurantTable } from '@/types';
import { Users, CheckCircle2, AlertCircle } from 'lucide-react';

interface TableSelectorProps {
  tables: RestaurantTable[];
  selectedTableId: string | null;
  onSelectTable: (table: RestaurantTable) => void;
}

export const TableSelector: React.FC<TableSelectorProps> = ({
  tables,
  selectedTableId,
  onSelectTable,
}) => {
  const selectedTable = tables.find((t) => t.id === selectedTableId);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-400">
        <span>Chọn bàn phục vụ</span>
        {selectedTable && (
          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã chọn: {selectedTable.table_number}
          </span>
        )}
      </div>

      <div className="relative">
        <select
          value={selectedTableId || ''}
          onChange={(e) => {
            const table = tables.find((t) => t.id === e.target.value);
            if (table) onSelectTable(table);
          }}
          className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 rounded-xl text-sm font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all cursor-pointer"
        >
          <option value="" disabled>
            -- Vui lòng chọn số bàn --
          </option>
          {tables.map((t) => {
            const statusLabel =
              t.status === 'available'
                ? '🟢 Trống'
                : t.status === 'occupied'
                ? '🟠 Đang có khách'
                : t.status === 'billing'
                ? '🔴 Chờ tính tiền'
                : '🟡 Đã đặt';

            return (
              <option key={t.id} value={t.id}>
                {t.table_number} ({t.capacity} chỗ) - {statusLabel}
              </option>
            );
          })}
        </select>
      </div>

      {!selectedTableId && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3 h-3" />
          Cần chọn số bàn trước khi gửi order xuống bếp
        </p>
      )}
    </div>
  );
};
