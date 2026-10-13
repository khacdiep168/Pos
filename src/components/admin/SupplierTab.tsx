'use client';

import React, { useState, useMemo } from 'react';
import { Supplier, PurchaseOrder, SupplierDebtTransaction } from '@/types';
import { formatCurrencyVND } from '@/lib/utils';
import { inventoryService } from '@/services/inventoryService';
import { SupplierDetailModal } from './SupplierDetailModal';
import { AddSupplierModal } from '@/components/erp/AddSupplierModal';
import { EditSupplierModal } from '@/components/erp/EditSupplierModal';
import { PaySupplierDebtModal } from './PaySupplierDebtModal';
import {
  Building2,
  Plus,
  Search,
  Phone,
  MapPin,
  Mail,
  DollarSign,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Eye,
  Edit3,
  Trash2,
  FileText,
  Filter,
  CheckCircle2,
  AlertCircle,
  Truck,
} from 'lucide-react';

interface SupplierTabProps {
  onRefresh?: () => void;
}

export const SupplierTab: React.FC<SupplierTabProps> = ({ onRefresh }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => inventoryService.getSuppliers());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() =>
    inventoryService.getPurchaseOrders()
  );
  const [debtTransactions, setDebtTransactions] = useState<SupplierDebtTransaction[]>(() =>
    inventoryService.getSupplierDebtTransactions()
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDebt, setFilterDebt] = useState<'all' | 'has_debt' | 'zero_debt'>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);

  const refreshLocalData = () => {
    setSuppliers(inventoryService.getSuppliers());
    setPurchaseOrders(inventoryService.getPurchaseOrders());
    setDebtTransactions(inventoryService.getSupplierDebtTransactions());
    if (onRefresh) onRefresh();
  };

  // Top Metrics
  const totalDebt = useMemo(
    () => suppliers.reduce((sum, s) => sum + (s.total_debt || 0), 0),
    [suppliers]
  );

  const totalPurchase = useMemo(
    () =>
      suppliers.reduce((sum, s) => {
        if (s.total_purchase) return sum + s.total_purchase;
        const pos = purchaseOrders.filter((po) => po.supplier_id === s.id && po.status !== 'cancelled');
        return sum + pos.reduce((pSum, po) => pSum + po.total_amount, 0);
      }, 0),
    [suppliers, purchaseOrders]
  );

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((sup) => {
      // Debt filter
      const debt = sup.total_debt || 0;
      if (filterDebt === 'has_debt' && debt <= 0) return false;
      if (filterDebt === 'zero_debt' && debt > 0) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = sup.name.toLowerCase().includes(q);
        const matchPhone = sup.phone.toLowerCase().includes(q);
        const matchAddr = sup.address?.toLowerCase().includes(q);
        const matchId = sup.id.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchAddr && !matchId) return false;
      }

      return true;
    });
  }, [suppliers, filterDebt, searchQuery]);

  const handleDeleteSupplier = (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${name}"?`)) {
      inventoryService.deleteSupplier(id);
      refreshLocalData();
    }
  };

  return (
    <div className="space-y-5">
      {/* 3 Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Tổng NCC */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Đối Tác Cung Ứng</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-stone-900 dark:text-white">
            {suppliers.length} <span className="text-xs font-normal text-stone-400">nhà cung cấp</span>
          </div>
          <p className="text-[11px] text-stone-400">Hợp đồng & chuỗi cung ứng nguyên liệu</p>
        </div>

        {/* Metric 2: Tổng Công Nợ Cần Trả */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Tổng Nợ Cần Trả Đối Tác</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {formatCurrencyVND(totalDebt)}
          </div>
          <p className="text-[11px] text-stone-400">Sổ cái công nợ đang ghi nhận</p>
        </div>

        {/* Metric 3: Tổng Mua Hàng */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Tổng Mua Hàng Lũy Kế</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-stone-900 dark:text-white font-mono">
            {formatCurrencyVND(totalPurchase)}
          </div>
          <p className="text-[11px] text-stone-400">Tổng giá trị phiếu nhập kho đã tạo</p>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên nhà cung cấp, SĐT, địa chỉ kho..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-100 dark:bg-stone-800 border-none rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Filter Controls & Add Button */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
            <button
              onClick={() => setFilterDebt('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterDebt === 'all'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setFilterDebt('has_debt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterDebt === 'has_debt'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
              }`}
            >
              Còn Nợ
            </button>
            <button
              onClick={() => setFilterDebt('zero_debt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterDebt === 'zero_debt'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
              }`}
            >
              Hết Nợ
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 active:scale-98 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Nhà Cung Cấp</span>
          </button>
        </div>
      </div>

      {/* Master Container (Table on Desktop, Card List on Mobile) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Desktop Table (md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Mã NCC</th>
                <th className="py-3 px-4">Tên Nhà Cung Cấp</th>
                <th className="py-3 px-4">Điện Thoại</th>
                <th className="py-3 px-4">Địa Chỉ Kho</th>
                <th className="py-3 px-4 text-right">Nợ Hiện Tại</th>
                <th className="py-3 px-4 text-right">Tổng Mua</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((sup) => {
                  const debt = sup.total_debt || 0;
                  const purchase = sup.total_purchase || 0;

                  return (
                    <tr
                      key={sup.id}
                      onClick={() => setSelectedSupplier(sup)}
                      className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 cursor-pointer transition-colors group"
                    >
                      {/* Mã */}
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900 dark:text-white">
                        <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                          #{sup.id}
                        </span>
                      </td>

                      {/* Tên */}
                      <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>{sup.name}</span>
                        </div>
                      </td>

                      {/* SĐT */}
                      <td className="py-3.5 px-4 text-stone-600 dark:text-stone-400 font-mono whitespace-nowrap">
                        {sup.phone}
                      </td>

                      {/* Địa chỉ */}
                      <td className="py-3.5 px-4 text-stone-500 max-w-[200px] truncate">
                        {sup.address || '-'}
                      </td>

                      {/* Nợ hiện tại */}
                      <td
                        className={`py-3.5 px-4 text-right font-black font-mono whitespace-nowrap ${
                          debt > 0 ? 'text-rose-600 dark:text-rose-400 text-sm' : 'text-stone-400'
                        }`}
                      >
                        {formatCurrencyVND(debt)}
                      </td>

                      {/* Tổng mua */}
                      <td className="py-3.5 px-4 text-right font-bold text-stone-900 dark:text-white font-mono whitespace-nowrap">
                        {formatCurrencyVND(purchase)}
                      </td>

                      {/* Thao tác */}
                      <td
                        className="py-3.5 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedSupplier(sup)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-white text-[11px] font-bold transition-all"
                            title="Xem sổ cái công nợ"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Sổ nợ</span>
                          </button>

                          <button
                            onClick={() => setPayingSupplier(sup)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white text-[11px] font-bold transition-all"
                            title="Thanh toán nợ"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Trả nợ</span>
                          </button>

                          <button
                            onClick={() => setEditingSupplier(sup)}
                            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                            title="Sửa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                            className="p-1 rounded-lg text-stone-400 hover:text-rose-600 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400 space-y-2">
                    <Building2 className="w-10 h-10 mx-auto opacity-30 text-stone-500" />
                    <p className="font-semibold text-xs text-stone-500">
                      Không tìm thấy nhà cung cấp nào phù hợp
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List (< md - Native Mobile KiotViet-like) */}
        <div className="md:hidden flex flex-col divide-y divide-stone-100 dark:divide-stone-800">
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map((sup) => {
              const debt = sup.total_debt || 0;
              const purchase = sup.total_purchase || 0;

              return (
                <div
                  key={sup.id}
                  onClick={() => setSelectedSupplier(sup)}
                  className="p-4 bg-white dark:bg-stone-900 flex flex-col gap-2.5 cursor-pointer active:bg-stone-50 dark:active:bg-stone-800/60 transition-colors"
                >
                  {/* Top Row: Tên NCC, SĐT, Mã */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-sm text-stone-900 dark:text-white">
                          {sup.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-500">
                          #{sup.id}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 font-mono mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{sup.phone}</span>
                        {sup.email && <span className="truncate">• {sup.email}</span>}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                        debt > 0
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {debt > 0 ? 'Còn nợ' : 'Hết nợ'}
                    </span>
                  </div>

                  {/* Middle Row: Nợ hiện tại & Tổng mua */}
                  <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Nợ cần trả:</span>
                      <span
                        className={`font-black font-mono text-xs ${
                          debt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {formatCurrencyVND(debt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block">Tổng mua hàng:</span>
                      <span className="font-bold font-mono text-stone-700 dark:text-stone-300 text-xs">
                        {formatCurrencyVND(purchase)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Nút Thao tác & Thanh toán */}
                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-0.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Xem sổ cái công nợ</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {debt > 0 && (
                        <button
                          onClick={() => setPayingSupplier(sup)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Trả nợ</span>
                        </button>
                      )}
                      <button
                        onClick={() => setEditingSupplier(sup)}
                        className="p-1 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        title="Sửa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                        className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-stone-400 space-y-2 p-4">
              <Building2 className="w-10 h-10 mx-auto opacity-30 text-stone-500" />
              <p className="font-semibold text-xs text-stone-500">
                Không tìm thấy nhà cung cấp nào
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Supplier Master-Detail Modal (KiotViet style) */}
      {selectedSupplier && (
        <SupplierDetailModal
          supplier={selectedSupplier}
          purchaseOrders={purchaseOrders}
          debtTransactions={debtTransactions}
          onClose={() => setSelectedSupplier(null)}
          onRefresh={refreshLocalData}
        />
      )}

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <AddSupplierModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={refreshLocalData}
        />
      )}

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <EditSupplierModal
          supplier={editingSupplier}
          onClose={() => setEditingSupplier(null)}
          onSuccess={refreshLocalData}
        />
      )}

      {/* Quick Pay Modal */}
      {payingSupplier && (
        <PaySupplierDebtModal
          supplier={payingSupplier}
          onClose={() => setPayingSupplier(null)}
          onSuccess={refreshLocalData}
        />
      )}
    </div>
  );
};
