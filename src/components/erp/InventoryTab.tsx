'use client';

import React, { useState } from 'react';
import { RawMaterial, InventoryTransaction } from '@/types';
import { formatCurrencyVND } from '@/lib/utils';
import { AddRawMaterialModal } from '@/components/admin/AddRawMaterialModal';
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  History,
  Boxes,
  ShieldAlert,
  Plus,
} from 'lucide-react';

interface InventoryTabProps {
  materials: RawMaterial[];
  transactions: InventoryTransaction[];
  onRefresh: () => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  materials,
  transactions,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low_stock' | 'safe'>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter materials
  const filteredMaterials = materials.filter((m) => {
    const isLow = m.current_stock < m.min_stock_level;
    if (filterMode === 'low_stock' && !isLow) return false;
    if (filterMode === 'safe' && isLow) return false;

    if (searchQuery.trim()) {
      return m.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    }
    return true;
  });

  const lowStockCount = materials.filter((m) => m.current_stock < m.min_stock_level).length;
  const totalStockValue = materials.reduce((s, m) => s + m.current_stock * m.avg_cost, 0);

  return (
    <div className="space-y-4">
      {/* Top Controls: Search, Filters & History Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm nguyên vật liệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex p-1 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Tất cả ({materials.length})
            </button>
            <button
              onClick={() => setFilterMode('low_stock')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterMode === 'low_stock'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cảnh báo thiếu ({lowStockCount})</span>
            </button>
          </div>

          {/* History Log Button */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              showHistory
                ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lịch sử trừ kho</span>
          </button>

          {/* Add Raw Material Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Nguyên Liệu</span>
          </button>
        </div>
      </div>

      {/* Main Raw Materials Table */}
      {!showHistory ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Nguyên Vật Liệu</th>
                  <th className="p-3.5 text-center">Tồn Kho Hiện Tại</th>
                  <th className="p-3.5 text-center">Mức An Toàn</th>
                  <th className="p-3.5 text-right">Giá Vốn TB (Recipe Unit)</th>
                  <th className="p-3.5 text-right">Tổng Giá Trị</th>
                  <th className="p-3.5 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/70 font-medium">
                {filteredMaterials.map((m) => {
                  const isLow = m.current_stock < m.min_stock_level;
                  const stockValue = m.current_stock * m.avg_cost;
                  const ratio = Math.min(100, Math.round((m.current_stock / (m.min_stock_level * 2)) * 100));

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors ${
                        isLow ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                          {m.name}
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5">
                          1 {m.purchase_unit} = {m.conversion_factor.toLocaleString()} {m.recipe_unit}
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-mono text-sm font-black ${
                              isLow ? 'text-rose-600 dark:text-rose-400' : 'text-stone-900 dark:text-white'
                            }`}
                          >
                            {m.current_stock.toLocaleString()} {m.recipe_unit}
                          </span>
                          <span className="text-[10px] text-stone-400 font-normal">
                            ≈ {(m.current_stock / m.conversion_factor).toFixed(1)} {m.purchase_unit}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 text-center font-mono text-stone-500">
                        {m.min_stock_level.toLocaleString()} {m.recipe_unit}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-stone-700 dark:text-stone-300">
                        {formatCurrencyVND(m.avg_cost)} / {m.recipe_unit}
                      </td>

                      <td className="p-3.5 text-right font-bold text-stone-900 dark:text-stone-100">
                        {formatCurrencyVND(stockValue)}
                      </td>

                      <td className="p-3.5 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Đủ dùng
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Inventory Transactions History Log */
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                Nhật Ký Xuất / Nhập Kho Tự Động ({transactions.length} giao dịch)
              </h3>
            </div>
            <p className="text-xs text-stone-400">
              Tự động ghi nhận khi thanh toán hóa đơn hoặc nhập hàng
            </p>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Boxes className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">Chưa có giao dịch biến động kho</p>
              <p className="text-[11px] text-stone-500 mt-1">
                Thực hiện thanh toán đơn hàng từ Thu Ngân để kiểm tra luồng trừ kho tự động.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-96 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        tx.type === 'in'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'in' ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 dark:text-stone-100">
                        {tx.raw_material_name || tx.raw_material_id}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {tx.created_by || 'Hệ thống'} • {new Date(tx.created_at).toLocaleTimeString('vi-VN')} {new Date(tx.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-sm ${
                        tx.type === 'in'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.quantity_changed > 0 ? `+${tx.quantity_changed.toLocaleString()}` : tx.quantity_changed.toLocaleString()} {tx.unit}
                    </span>
                    <div className="text-[10px] text-stone-400 uppercase font-mono">
                      {tx.reference_type} #{tx.reference_id?.slice(-6)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Raw Material Modal */}
      <AddRawMaterialModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onMaterialAdded={onRefresh}
      />
    </div>
  );
};
