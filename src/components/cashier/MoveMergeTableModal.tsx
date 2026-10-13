'use client';

import React, { useState } from 'react';
import { RestaurantTable, Order, Zone } from '@/types';
import { orderService } from '@/services/orderService';
import { formatCurrencyVND } from '@/lib/utils';
import {
  ArrowRightLeft,
  Merge,
  MoveRight,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  Receipt,
} from 'lucide-react';

interface MoveMergeTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceTable: RestaurantTable | null;
  tables: RestaurantTable[];
  zones: Zone[];
  orders: Order[];
  onSuccess: () => void;
}

export const MoveMergeTableModal: React.FC<MoveMergeTableModalProps> = ({
  isOpen,
  onClose,
  sourceTable,
  tables,
  zones,
  orders,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'move' | 'merge'>('move');
  const [targetTableId, setTargetTableId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen || !sourceTable) return null;

  const sourceOrder = orders.find(
    (o) => o.table_id === sourceTable.id && o.payment_status === 'unpaid' && o.order_status !== 'cancelled'
  );

  // Available candidate tables for moving: only available tables
  const availableTables = tables.filter((t) => t.id !== sourceTable.id && t.status === 'available');

  // Candidate tables for merging: tables that currently have an active order or are occupied
  const occupiedTables = tables.filter((t) => t.id !== sourceTable.id && (t.status === 'occupied' || t.status === 'billing'));

  const candidateTables = mode === 'move' ? availableTables : occupiedTables;

  const targetTable = tables.find((t) => t.id === targetTableId);
  const targetOrder = targetTable ? orders.find(
    (o) => o.table_id === targetTable.id && o.payment_status === 'unpaid' && o.order_status !== 'cancelled'
  ) : null;

  const handleExecute = () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!targetTableId) {
      setErrorMsg('Vui lòng chọn bàn đích!');
      return;
    }

    if (mode === 'move') {
      const res = orderService.moveTable(sourceTable.id, targetTableId);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.message);
      }
    } else {
      const res = orderService.mergeTable(sourceTable.id, targetTableId);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                Chuyển Bàn / Gộp Bàn Phục Vụ
              </h3>
              <p className="text-xs text-stone-400">
                Thao tác từ: <span className="font-bold text-amber-600 dark:text-amber-400">{sourceTable.table_number}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl gap-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('move');
              setTargetTableId('');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all ${
              mode === 'move'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <MoveRight className="w-4 h-4 text-emerald-500" />
            <span>Chuyển Bàn (Sang bàn trống)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('merge');
              setTargetTableId('');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all ${
              mode === 'merge'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Merge className="w-4 h-4 text-amber-500" />
            <span>Gộp Bàn (Vào bàn đang có khách)</span>
          </button>
        </div>

        {/* Source Table Summary */}
        <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700/80 space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-stone-400 font-semibold">Bàn nguồn hiện tại:</span>
            <span className="font-extrabold text-sm text-stone-900 dark:text-white">
              {sourceTable.table_number} ({sourceTable.capacity} chỗ)
            </span>
          </div>
          {sourceOrder ? (
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-stone-500 font-medium">
                Hóa đơn: #{sourceOrder.id.slice(-6)} ({sourceOrder.items.reduce((s, it) => s + it.quantity, 0)} món)
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                {formatCurrencyVND(sourceOrder.total_amount)}
              </span>
            </div>
          ) : (
            <div className="text-rose-500 text-[11px] font-semibold">
              ⚠️ Bàn này chưa có order nào đang hoạt động để chuyển/gộp.
            </div>
          )}
        </div>

        {/* Target Table Dropdown */}
        <div className="space-y-1.5 text-xs">
          <label className="font-bold text-stone-700 dark:text-stone-300 block">
            {mode === 'move' ? 'Chọn bàn trống để chuyển đến:' : 'Chọn bàn có khách để gộp chung đơn:'}
          </label>
          <select
            value={targetTableId}
            onChange={(e) => setTargetTableId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="">-- Chọn bàn đích --</option>
            {candidateTables.map((t) => {
              const zone = zones.find((z) => z.id === t.zone_id);
              return (
                <option key={t.id} value={t.id}>
                  {t.table_number} [{zone ? zone.name : 'Chưa phân khu'}] - {t.capacity} chỗ ({t.status === 'available' ? 'Bàn trống' : 'Đang phục vụ'})
                </option>
              );
            })}
          </select>
        </div>

        {/* Target Table Preview if Merge */}
        {mode === 'merge' && targetTable && targetOrder && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs space-y-1">
            <div className="font-bold text-amber-800 dark:text-amber-300">
              Dự kiến sau khi gộp vào {targetTable.table_number}:
            </div>
            <div className="flex justify-between text-[11px] text-stone-600 dark:text-stone-400">
              <span>Tổng số món mới:</span>
              <span className="font-bold">
                {(targetOrder.items.length + (sourceOrder?.items.length || 0))} món
              </span>
            </div>
            <div className="flex justify-between text-xs font-bold text-stone-900 dark:text-white pt-1 border-t border-amber-500/20">
              <span>Tổng thanh toán mới:</span>
              <span className="text-amber-600 dark:text-amber-400 font-mono">
                {formatCurrencyVND((targetOrder.total_amount + (sourceOrder?.total_amount || 0)))}
              </span>
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold text-xs"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={!targetTableId || !sourceOrder}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-95 ${
              !targetTableId || !sourceOrder
                ? 'bg-stone-300 dark:bg-stone-700 cursor-not-allowed'
                : mode === 'move'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
            }`}
          >
            {mode === 'move' ? 'Xác Nhận Chuyển Bàn' : 'Xác Nhận Gộp Bàn'}
          </button>
        </div>
      </div>
    </div>
  );
};
