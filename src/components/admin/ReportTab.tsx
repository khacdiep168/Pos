'use client';

import React, { useState, useMemo } from 'react';
import { Order, RawMaterial, WorkShift } from '@/types';
import { formatCurrencyVND, formatDateTime } from '@/lib/utils';
import { orderService } from '@/services/orderService';
import { inventoryService } from '@/services/inventoryService';
import {
  FileText,
  DollarSign,
  TrendingUp,
  Boxes,
  Printer,
  Calendar,
  CreditCard,
  QrCode,
  Banknote,
  Wallet,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface ReportTabProps {
  orders: Order[];
  materials: RawMaterial[];
}

export const ReportTab: React.FC<ReportTabProps> = ({ orders, materials }) => {
  const [reportSubTab, setReportSubTab] = useState<'z_report' | 'inventory_report'>('z_report');
  const [selectedShiftDate, setSelectedShiftDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const shifts = useMemo(() => orderService.getShiftHistory(), []);
  const currentShift = orderService.getCurrentShift();

  // 1. Z-REPORT METRICS
  const completedOrders = useMemo(
    () => orders.filter((o) => o.payment_status === 'paid' && o.order_status !== 'cancelled'),
    [orders]
  );

  const cancelledOrders = useMemo(
    () => orders.filter((o) => o.order_status === 'cancelled'),
    [orders]
  );

  const grossSales = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.subtotal, 0),
    [completedOrders]
  );

  const totalDiscount = useMemo(
    () => completedOrders.reduce((sum, o) => sum + (o.discount_amount || 0), 0),
    [completedOrders]
  );

  const totalTax = useMemo(
    () => completedOrders.reduce((sum, o) => sum + (o.tax_amount || 0), 0),
    [completedOrders]
  );

  const netRevenue = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.total_amount, 0),
    [completedOrders]
  );

  // Payment Breakdown
  const paymentSummary = useMemo(() => {
    let cash = 0;
    let qr = 0;
    let card = 0;
    let ewallet = 0;

    completedOrders.forEach((o) => {
      if (o.payment_method === 'cash') cash += o.total_amount;
      else if (o.payment_method === 'transfer_qr') qr += o.total_amount;
      else if (o.payment_method === 'card') card += o.total_amount;
      else if (o.payment_method === 'e_wallet') ewallet += o.total_amount;
      else qr += o.total_amount;
    });

    return { cash, qr, card, ewallet };
  }, [completedOrders]);

  // 2. INVENTORY REPORT METRICS
  const totalStockValue = useMemo(
    () => materials.reduce((sum, m) => sum + m.current_stock * m.avg_cost, 0),
    [materials]
  );

  const lowStockMaterials = useMemo(
    () => materials.filter((m) => m.current_stock < m.min_stock_level),
    [materials]
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Trung Tâm Báo Cáo Quản Trị</span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Báo cáo tài chính bán hàng cuối ngày (Z-Report) và đối soát giá trị kho
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
            <button
              onClick={() => setReportSubTab('z_report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                reportSubTab === 'z_report'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
              }`}
            >
              Báo Cáo Bán Hàng (Z-Report)
            </button>
            <button
              onClick={() => setReportSubTab('inventory_report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                reportSubTab === 'inventory_report'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
              }`}
            >
              Báo Cáo Kho Hàng
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold transition-all shrink-0"
            title="In báo cáo"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">In Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* ==================== SUB-TAB 1: BÁO CÁO BÁN HÀNG (Z-REPORT) ==================== */}
      {reportSubTab === 'z_report' && (
        <div className="space-y-5">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
              <span className="text-xs text-stone-400 font-semibold">Doanh Thu Thuần (Net Sales)</span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrencyVND(netRevenue)}
              </div>
              <p className="text-[11px] text-stone-400">
                {completedOrders.length} hóa đơn thành công
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
              <span className="text-xs text-stone-400 font-semibold">Tiền Hàng Gộp (Gross)</span>
              <div className="text-xl font-black text-stone-900 dark:text-white font-mono">
                {formatCurrencyVND(grossSales)}
              </div>
              <p className="text-[11px] text-stone-400">Chưa trừ chiết khấu & thuế</p>
            </div>

            <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
              <span className="text-xs text-stone-400 font-semibold">Khuyến Mãi & Giảm Giá</span>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
                -{formatCurrencyVND(totalDiscount)}
              </div>
              <p className="text-[11px] text-stone-400">Voucher & chiết khấu đã áp dụng</p>
            </div>

            <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
              <span className="text-xs text-stone-400 font-semibold">Thuế GTGT (VAT 8%)</span>
              <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                +{formatCurrencyVND(totalTax)}
              </div>
              <p className="text-[11px] text-stone-400">Thuế nộp ngân sách nhà nước</p>
            </div>
          </div>

          {/* Detailed Financial & Payment Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Payment Method Breakdown Card */}
            <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <h4 className="font-extrabold text-xs text-stone-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span>Chi Tiết Theo Phương Thức Thanh Toán</span>
                </h4>
                <span className="text-[11px] font-mono text-stone-400">Tổng thu thực</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    <span className="font-bold">VietQR Chuyển Khoản:</span>
                  </div>
                  <span className="font-mono font-black text-sm">
                    {formatCurrencyVND(paymentSummary.qr)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4" />
                    <span className="font-bold">Tiền Mặt (Cash):</span>
                  </div>
                  <span className="font-mono font-black text-sm">
                    {formatCurrencyVND(paymentSummary.cash)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-bold">Thẻ Ngân Hàng (POS):</span>
                  </div>
                  <span className="font-mono font-black text-sm">
                    {formatCurrencyVND(paymentSummary.card)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    <span className="font-bold">Ví Điện Tử (Momo/ZaloPay):</span>
                  </div>
                  <span className="font-mono font-black text-sm">
                    {formatCurrencyVND(paymentSummary.ewallet)}
                  </span>
                </div>
              </div>
            </div>

            {/* Z-Report Shift Reconciliation Card */}
            <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <h4 className="font-extrabold text-xs text-stone-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Đối Soát Ca Làm Việc (Z-Report)</span>
                </h4>
                <span className="text-[11px] font-mono text-stone-400">
                  {currentShift ? 'Ca đang mở' : 'Đã đóng ca'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {currentShift ? (
                  <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl space-y-2 border border-stone-200/60 dark:border-stone-700">
                    <div className="flex justify-between font-bold text-stone-900 dark:text-white">
                      <span>Thu ngân phụ trách:</span>
                      <span>{currentShift.cashier_name}</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Thời gian mở ca:</span>
                      <span className="font-mono">{formatDateTime(currentShift.start_time)}</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Tiền mặt đầu ca:</span>
                      <span className="font-mono">{formatCurrencyVND(currentShift.initial_cash)}</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Doanh số tiền mặt trong ca:</span>
                      <span className="font-mono text-emerald-600 font-bold">
                        +{formatCurrencyVND(currentShift.total_cash_sales)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between font-black">
                      <span>Tiền mặt dự kiến két:</span>
                      <span className="font-mono text-amber-600 text-sm">
                        {formatCurrencyVND(currentShift.initial_cash + currentShift.total_cash_sales)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl text-center text-stone-400 text-xs">
                    Hiện tại chưa có ca làm việc nào đang mở. Quầy thu ngân sẽ tạo ca mới khi bắt đầu phiên làm việc.
                  </div>
                )}

                {/* Audit fraud control note */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-[11px] border border-rose-200 dark:border-rose-900">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Kiểm soát chống gian lận:</span>
                    Có {cancelledOrders.length} hóa đơn bị hủy ghi nhận trong hệ thống. Quản lý cần đối chiếu lý do hủy đơn định kỳ.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 2: BÁO CÁO KHO HÀNG (INVENTORY REPORT) ==================== */}
      {reportSubTab === 'inventory_report' && (
        <div className="space-y-5">
          {/* Top Stock Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
              <span className="text-xs text-stone-400 font-semibold">Tổng Giá Trị Kho Hiện Tại</span>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatCurrencyVND(totalStockValue)}
              </div>
              <p className="text-[11px] text-stone-400">
                Tính theo Giá vốn trung bình MAC ({materials.length} nguyên liệu)
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
              <span className="text-xs text-stone-400 font-semibold">Cảnh Báo Sắp Hết Hàng</span>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                {lowStockMaterials.length} <span className="text-xs font-normal text-stone-400">mặt hàng</span>
              </div>
              <p className="text-[11px] text-rose-500 font-medium">Chạm ngưỡng tồn an toàn (Min Stock)</p>
            </div>

            <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs space-y-1">
              <span className="text-xs text-stone-400 font-semibold">Tình Trạng Kho</span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" />
                <span>Ổn Định</span>
              </div>
              <p className="text-[11px] text-stone-400">Sẵn sàng phục vụ thực đơn</p>
            </div>
          </div>

          {/* Materials Stock Value Table */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-stone-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-500" />
                <span>Bảng Kê Chi Tiết Giá Trị Tồn Kho Từng Nguyên Liệu</span>
              </h4>
              <span className="text-[11px] text-stone-400 font-mono">
                {materials.length} nguyên vật liệu
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50/80 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 text-[11px] font-bold uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
                    <th className="py-3 px-4">Mã</th>
                    <th className="py-3 px-4">Tên Nguyên Liệu</th>
                    <th className="py-3 px-4 text-center">ĐVT Định Mức</th>
                    <th className="py-3 px-4 text-right">Tồn Hiện Tại</th>
                    <th className="py-3 px-4 text-right">Tồn An Toàn</th>
                    <th className="py-3 px-4 text-right">Giá Vốn Cơ Sở</th>
                    <th className="py-3 px-4 text-right">Tổng Giá Trị</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {materials.map((mat) => {
                    const isLow = mat.current_stock < mat.min_stock_level;
                    const lineValue = mat.current_stock * mat.avg_cost;

                    return (
                      <tr key={mat.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-900 dark:text-white">
                          #{mat.id}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-white">
                          {mat.name}
                        </td>
                        <td className="py-3.5 px-4 text-center text-stone-500">
                          {mat.recipe_unit}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900 dark:text-white">
                          {mat.current_stock.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-stone-500">
                          {mat.min_stock_level.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-stone-600 dark:text-stone-400">
                          {formatCurrencyVND(mat.avg_cost)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-amber-600 dark:text-amber-400">
                          {formatCurrencyVND(lineValue)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              Sắp hết
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              An toàn
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
        </div>
      )}
    </div>
  );
};
