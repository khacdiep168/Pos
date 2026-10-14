'use client';

import React, { useState, useMemo } from 'react';
import { Order } from '@/types';
import { formatCurrencyVND, formatDateTime } from '@/lib/utils';
import { exportToCSV } from '@/lib/exportUtils';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import {
  Search,
  Receipt,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Clock,
  Eye,
  Banknote,
  QrCode,
  CreditCard,
  Wallet,
  Calendar,
  Filter,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react';

interface InvoiceHistoryTabProps {
  orders: Order[];
  onRefresh?: () => void;
}

const PM_ICONS: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  cash: {
    label: 'Tiền mặt',
    icon: Banknote,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
  },
  transfer_qr: {
    label: 'VietQR',
    icon: QrCode,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
  },
  card: {
    label: 'Thẻ POS',
    icon: CreditCard,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
  },
  e_wallet: {
    label: 'Ví điện tử',
    icon: Wallet,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10 dark:bg-violet-500/20',
  },
};

export const InvoiceHistoryTab: React.FC<InvoiceHistoryTabProps> = ({ orders }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Counters
  const completedCount = useMemo(
    () => orders.filter((o) => o.order_status === 'completed' || o.payment_status === 'paid').length,
    [orders]
  );

  const cancelledCount = useMemo(
    () => orders.filter((o) => o.order_status === 'cancelled').length,
    [orders]
  );

  const totalPaidRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.payment_status === 'paid' && o.order_status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_amount, 0),
    [orders]
  );

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter === 'completed') {
        const isSuccess = order.order_status === 'completed' || order.payment_status === 'paid';
        if (!isSuccess || order.order_status === 'cancelled') return false;
      } else if (statusFilter === 'cancelled') {
        if (order.order_status !== 'cancelled') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = order.id.toLowerCase().includes(q);
        const matchTable = order.table_number.toLowerCase().includes(q);
        const matchNotes = order.notes?.toLowerCase().includes(q);
        const matchItems = order.items.some((it) => it.menu_item_name.toLowerCase().includes(q));
        if (!matchId && !matchTable && !matchNotes && !matchItems) return false;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const handleExportInvoices = () => {
    const headers = [
      'Mã Đơn',
      'Thời Gian',
      'Bàn',
      'Khách Hàng',
      'Số Điện Thoại',
      'Tiền Món (Subtotal)',
      'Giảm Giá',
      'Thuế VAT',
      'Tổng Tiền (VNĐ)',
      'Hình Thức Thanh Toán',
      'Trạng Thái Đơn',
      'Chi Tiết Món',
      'Ghi Chú / Lý Do Hủy',
    ];

    const rows = filteredOrders.map((o) => [
      o.id,
      formatDateTime(o.created_at),
      o.table_number,
      o.customer_name || 'Khách vãng lai',
      o.customer_phone || '',
      o.subtotal,
      o.discount_amount,
      o.tax_amount,
      o.total_amount,
      o.payment_method === 'cash'
        ? 'Tiền mặt'
        : o.payment_method === 'transfer_qr'
        ? 'VietQR'
        : o.payment_method === 'card'
        ? 'Thẻ POS'
        : 'Khác',
      o.order_status === 'completed'
        ? 'Hoàn tất'
        : o.order_status === 'cancelled'
        ? 'Đã hủy'
        : o.order_status,
      o.items.map((i) => `${i.quantity}x ${i.menu_item_name}`).join('; '),
      o.notes || '',
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    exportToCSV(`Danh_Sach_Hoa_Don_${dateStr}`, headers, rows, {
      reportTitle: 'BẢNG KÊ TOÀN BỘ HÓA ĐƠN BÁN HÀNG & DỊCH VỤ',
      periodText: `Thời điểm xuất: ${new Date().toLocaleDateString('vi-VN')}`,
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Tổng Hóa Đơn Lưu Trữ</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-stone-900 dark:text-white">
            {orders.length} <span className="text-xs font-normal text-stone-400">hóa đơn</span>
          </div>
          <p className="text-[11px] text-stone-400">Toàn bộ lịch sử giao dịch POS</p>
        </div>

        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Doanh Thu Đã Thu</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrencyVND(totalPaidRevenue)}
          </div>
          <p className="text-[11px] text-stone-400">{completedCount} hóa đơn thành công</p>
        </div>

        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Hóa Đơn Bị Hủy (Đối soát)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400">
            {cancelledCount} <span className="text-xs font-normal text-stone-400">đơn hủy</span>
          </div>
          <p className="text-[11px] text-rose-500/80 font-medium">Giám sát chống thất thoát / gian lận</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Mã đơn, Tên bàn, Món ăn hoặc Ghi chú..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-100 dark:bg-stone-800 border-none rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl shrink-0 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
            }`}
          >
            Tất Cả ({orders.length})
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Thành Công ({completedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'cancelled'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Hóa Đơn Bị Hủy ({cancelledCount})</span>
          </button>
        </div>

        {/* Export Excel Button */}
        <button
          onClick={handleExportInvoices}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all shrink-0"
          title="Xuất file Excel CSV có dấu tiếng Việt chuẩn"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất Excel Hóa Đơn ({filteredOrders.length})</span>
        </button>
      </div>

      {/* Invoices Container (Table on Desktop, Card List on Mobile) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Desktop Table (md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Mã Đơn Hàng</th>
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4">Bàn Phục Vụ</th>
                <th className="py-3 px-4">Món Ăn</th>
                <th className="py-3 px-4 text-right">Tổng Tiền</th>
                <th className="py-3 px-4 text-center">HT Thanh Toán</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const isPaid = order.payment_status === 'paid';
                  const isCancelled = order.order_status === 'cancelled';
                  const pm = order.payment_method ? PM_ICONS[order.payment_method] : null;
                  const PmIcon = pm ? pm.icon : Banknote;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-purple-50/40 dark:hover:bg-stone-800/40 cursor-pointer transition-colors group"
                    >
                      {/* Mã đơn */}
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>#{order.id}</span>
                        </div>
                      </td>

                      {/* Thời gian */}
                      <td className="py-3.5 px-4 text-stone-500 dark:text-stone-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{formatDateTime(order.created_at)}</span>
                        </div>
                      </td>

                      {/* Bàn phục vụ */}
                      <td className="py-3.5 px-4 font-semibold text-stone-800 dark:text-stone-200 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                          {order.table_number}
                        </span>
                      </td>

                      {/* Tóm tắt món */}
                      <td className="py-3.5 px-4 text-stone-600 dark:text-stone-400 max-w-[220px] truncate">
                        {order.items.map((it) => `${it.menu_item_name} (x${it.quantity})`).join(', ')}
                      </td>

                      {/* Tổng tiền */}
                      <td className="py-3.5 px-4 text-right font-black text-stone-900 dark:text-white whitespace-nowrap">
                        {formatCurrencyVND(order.total_amount)}
                      </td>

                      {/* Hình thức thanh toán */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {pm ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${pm.bg} ${pm.color}`}
                          >
                            <PmIcon className="w-3 h-3" />
                            {pm.label}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[11px] italic">Chưa TT</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3" />
                            Bị hủy
                          </span>
                        ) : isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Hoàn tất
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            {order.order_status}
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-600 text-purple-600 dark:text-purple-400 hover:text-white text-[11px] font-bold transition-all"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400 space-y-2">
                    <Receipt className="w-10 h-10 mx-auto opacity-30 text-stone-500" />
                    <p className="font-semibold text-xs text-stone-500">
                      Không tìm thấy hóa đơn nào phù hợp với bộ lọc
                    </p>
                    <p className="text-[11px]">Thử điều chỉnh từ khóa tìm kiếm hoặc chọn bộ lọc Tất Cả</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List (< md - Native Mobile KiotViet-like) */}
        <div className="md:hidden flex flex-col divide-y divide-stone-100 dark:divide-stone-800">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const isPaid = order.payment_status === 'paid';
              const isCancelled = order.order_status === 'cancelled';
              const pm = order.payment_method ? PM_ICONS[order.payment_method] : null;

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="p-4 bg-white dark:bg-stone-900 flex items-center justify-between cursor-pointer active:bg-stone-50 dark:active:bg-stone-800/60 transition-colors"
                >
                  {/* Left Column: Mã HĐ, Tên Bàn/Khách, Giờ */}
                  <div className="min-w-0 pr-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-stone-900 dark:text-white">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        {order.table_number}
                      </span>
                    </div>

                    <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                      {order.customer_name ? (
                        <span>Khách: <strong className="text-stone-700 dark:text-stone-300">{order.customer_name}</strong></span>
                      ) : (
                        <span>{order.items.length} món • Khách lẻ</span>
                      )}
                    </div>

                    <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{formatDateTime(order.created_at)}</span>
                      {pm && (
                        <>
                          <span>•</span>
                          <span className={pm.color}>{pm.label}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Tổng tiền VNĐ, Trạng thái */}
                  <div className="text-right shrink-0 space-y-1">
                    <div className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
                      {formatCurrencyVND(order.total_amount)}
                    </div>

                    <div>
                      {isCancelled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <XCircle className="w-2.5 h-2.5" />
                          Đã hủy
                        </span>
                      ) : isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Hoàn tất
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Clock className="w-2.5 h-2.5" />
                          Chờ TT
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-stone-400 space-y-2 p-4">
              <Receipt className="w-10 h-10 mx-auto opacity-30 text-stone-500" />
              <p className="font-semibold text-xs text-stone-500">
                Không tìm thấy hóa đơn nào phù hợp với bộ lọc
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedOrder && (
        <InvoiceDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};
