'use client';

import React, { useState } from 'react';
import { Supplier, PurchaseOrder, SupplierDebtTransaction } from '@/types';
import { formatCurrencyVND, formatDateTime } from '@/lib/utils';
import { inventoryService } from '@/services/inventoryService';
import { PaySupplierDebtModal } from './PaySupplierDebtModal';
import { EditSupplierModal } from '@/components/erp/EditSupplierModal';
import {
  X,
  Truck,
  Building2,
  Phone,
  MapPin,
  Mail,
  DollarSign,
  FileText,
  CreditCard,
  History,
  TrendingDown,
  TrendingUp,
  Plus,
  Edit3,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

interface SupplierDetailModalProps {
  supplier: Supplier;
  purchaseOrders: PurchaseOrder[];
  debtTransactions: SupplierDebtTransaction[];
  onClose: () => void;
  onRefresh: () => void;
}

export const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  supplier,
  purchaseOrders,
  debtTransactions,
  onClose,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'debt' | 'orders' | 'info'>('debt');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter for this supplier
  const supplierPOs = purchaseOrders.filter((po) => po.supplier_id === supplier.id);
  const supplierDebts = debtTransactions.filter((tx) => tx.supplier_id === supplier.id);

  const currentDebt = supplier.total_debt || 0;
  const totalPurchase =
    supplier.total_purchase ||
    supplierPOs.reduce((sum, po) => sum + (po.status !== 'cancelled' ? po.total_amount : 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-stone-900 dark:text-white leading-tight">
                  {supplier.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-500">
                  #{supplier.id}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {supplier.phone}
                </span>
                {supplier.address && (
                  <span className="hidden sm:flex items-center gap-1 truncate max-w-[260px]">
                    <MapPin className="w-3 h-3" />
                    {supplier.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
              title="Chỉnh sửa đối tác"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 shrink-0">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold block">
              Nợ hiện tại cần trả:
            </span>
            <div className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-400 font-mono">
              {formatCurrencyVND(currentDebt)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700">
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold block">
              Tổng mua lũy kế:
            </span>
            <div className="text-base sm:text-lg font-black text-stone-900 dark:text-white font-mono">
              {formatCurrencyVND(totalPurchase)}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center justify-end">
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
            >
              <DollarSign className="w-4 h-4" />
              <span>Thanh Toán Công Nợ</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900 shrink-0">
          <button
            onClick={() => setActiveTab('debt')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'debt'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Sổ Cái Công Nợ ({supplierDebts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'orders'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch Sử Nhập Hàng ({supplierPOs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'info'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Hồ Sơ Chi Tiết</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: SỔ CÔNG NỢ (DEBT LEDGER) */}
          {activeTab === 'debt' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-stone-900 dark:text-white">
                    Sổ Cái Chi Tiết Công Nợ Đối Tác
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Theo dõi các lần Nhập hàng (tăng nợ) và Chi thanh toán (giảm nợ)
                  </p>
                </div>
              </div>

              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 text-[11px] font-bold uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
                      <th className="py-3 px-3.5">Mã Giao Dịch</th>
                      <th className="py-3 px-3.5">Thời Gian</th>
                      <th className="py-3 px-3.5">Loại Giao Dịch</th>
                      <th className="py-3 px-3.5 text-right">Giá Trị</th>
                      <th className="py-3 px-3.5 text-right">Nợ Cần Trả</th>
                      <th className="py-3 px-3.5">Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {supplierDebts.length > 0 ? (
                      supplierDebts.map((tx) => {
                        const isPurchase = tx.type === 'purchase';

                        return (
                          <tr key={tx.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40">
                            <td className="py-3 px-3.5 font-mono font-bold text-stone-900 dark:text-white">
                              #{tx.id}
                            </td>
                            <td className="py-3 px-3.5 text-stone-500 whitespace-nowrap">
                              {formatDateTime(tx.created_at)}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {isPurchase ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  <ArrowUpRight className="w-3 h-3" />
                                  Nhập hàng (Tăng nợ)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <ArrowDownLeft className="w-3 h-3" />
                                  Thanh toán (Giảm nợ)
                                </span>
                              )}
                            </td>
                            <td
                              className={`py-3 px-3.5 text-right font-black font-mono whitespace-nowrap ${
                                isPurchase ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {isPurchase ? '+' : '-'}
                              {formatCurrencyVND(tx.amount)}
                            </td>
                            <td className="py-3 px-3.5 text-right font-mono font-bold text-stone-900 dark:text-white whitespace-nowrap">
                              {formatCurrencyVND(tx.balance)}
                            </td>
                            <td className="py-3 px-3.5 text-stone-500 text-[11px] max-w-[200px] truncate">
                              {tx.notes || '-'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-stone-400">
                          Chưa có phát sinh giao dịch công nợ nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: LỊCH SỬ NHẬP HÀNG (PO) */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-xs text-stone-900 dark:text-white">
                Danh Sách Phiếu Nhập Kho Từ Đối Tác
              </h4>

              <div className="space-y-3">
                {supplierPOs.length > 0 ? (
                  supplierPOs.map((po) => (
                    <div
                      key={po.id}
                      className="p-4 bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800 rounded-2xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            #{po.id}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            {formatDateTime(po.created_at)}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          Đã nhập kho
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] text-stone-600 dark:text-stone-300">
                        {po.items.map((it) => (
                          <div key={it.raw_material_id} className="flex justify-between">
                            <span>
                              • {it.raw_material_name} x{it.quantity}
                            </span>
                            <span className="font-mono font-semibold">
                              {formatCurrencyVND(it.total)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700 flex justify-between items-center font-bold">
                        <span>Tổng tiền phiếu nhập:</span>
                        <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">
                          {formatCurrencyVND(po.total_amount)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-stone-400 text-xs">
                    Chưa có phiếu nhập hàng nào từ nhà cung cấp này
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HỒ SƠ CHI TIẾT */}
          {activeTab === 'info' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-stone-400 text-[11px] block">Tên Công Ty / Nhà Cung Cấp:</span>
                    <span className="font-bold text-stone-900 dark:text-white text-sm">
                      {supplier.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 text-[11px] block">Số Điện Thoại:</span>
                    <a
                      href={`tel:${supplier.phone}`}
                      className="font-bold text-amber-600 font-mono text-sm hover:underline"
                    >
                      {supplier.phone}
                    </a>
                  </div>

                  <div>
                    <span className="text-stone-400 text-[11px] block">Email Liên Hệ:</span>
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                      {supplier.email || 'Chưa cập nhật'}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 text-[11px] block">Địa Chỉ Kho Hàng:</span>
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                      {supplier.address || 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 dark:border-stone-700 flex justify-end">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chỉnh Sửa Hồ Sơ</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Pay Supplier Debt Modal */}
      {isPayModalOpen && (
        <PaySupplierDebtModal
          supplier={supplier}
          onClose={() => setIsPayModalOpen(false)}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}

      {/* Edit Supplier Modal */}
      {isEditModalOpen && (
        <EditSupplierModal
          supplier={supplier}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
