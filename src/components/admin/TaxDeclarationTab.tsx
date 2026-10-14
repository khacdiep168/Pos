'use client';

import React, { useState, useMemo } from 'react';
import {
  TaxConfiguration,
  TaxCalculationSummary,
  TaxRegimeMethod,
  Order,
} from '@/types';
import { cashbookService, defaultTaxConfig } from '@/services/cashbookService';
import { orderService } from '@/services/orderService';
import { inventoryService } from '@/services/inventoryService';
import { formatCurrencyVND } from '@/lib/utils';
import { exportToCSV } from '@/lib/exportUtils';
import {
  Scale,
  ShieldCheck,
  Building2,
  Store,
  Calendar,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Percent,
  FileCheck2,
  PieChart,
  HelpCircle,
  Landmark,
} from 'lucide-react';

export const TaxDeclarationTab: React.FC = () => {
  const [taxConfig, setTaxConfig] = useState<TaxConfiguration>(() =>
    cashbookService.getTaxConfiguration()
  );

  // Period Selector: Month, Q1, Q2, Q3, Q4, Year
  const [selectedPeriod, setSelectedPeriod] = useState<
    'this_month' | 'q1' | 'q2' | 'q3' | 'q4' | 'year'
  >('this_month');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Compute Start & End Date based on selected period in Year 2026
  const periodDateRange = useMemo(() => {
    const year = 2026;
    switch (selectedPeriod) {
      case 'this_month': {
        const d = new Date();
        const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
        return { startDate: start, endDate: end, label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}` };
      }
      case 'q1':
        return { startDate: `${year}-01-01`, endDate: `${year}-03-31`, label: `Quý 1/${year}` };
      case 'q2':
        return { startDate: `${year}-04-01`, endDate: `${year}-06-30`, label: `Quý 2/${year}` };
      case 'q3':
        return { startDate: `${year}-07-01`, endDate: `${year}-09-30`, label: `Quý 3/${year}` };
      case 'q4':
        return { startDate: `${year}-10-01`, endDate: `${year}-12-31`, label: `Quý 4/${year}` };
      case 'year':
        return { startDate: `${year}-01-01`, endDate: `${year}-12-31`, label: `Năm ${year}` };
    }
  }, [selectedPeriod]);

  // Compute Tax Summary
  const taxSummary: TaxCalculationSummary = useMemo(() => {
    return cashbookService.calculateTaxSummary(taxConfig, periodDateRange);
  }, [taxConfig, periodDateRange]);

  // Annual Revenue cumulative calculation for NĐ 254 threshold
  const annualTotalRevenue = useMemo(() => {
    const orders = orderService.getOrders();
    const currentYear = new Date().getFullYear();
    const paidOrdersYear = orders.filter((o) => {
      const year = new Date(o.created_at).getFullYear();
      return year === currentYear && (o.payment_status === 'paid' || o.order_status === 'completed');
    });
    return paidOrdersYear.reduce((s, o) => s + o.total_amount, 0);
  }, []);

  const thresholdPercent = Math.min(
    100,
    Math.round((annualTotalRevenue / taxConfig.annualRevenueThreshold) * 100)
  );

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopy = (text: string, key: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast(`Đã copy số: ${text}`);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleUpdateMethod = (method: TaxRegimeMethod) => {
    const updated = cashbookService.updateTaxConfiguration({ method });
    setTaxConfig(updated);
    showToast(
      method === 'revenue_percentage'
        ? 'Đã chuyển sang: Hộ Kinh Doanh F&B (Kê khai % Doanh thu)'
        : 'Đã chuyển sang: Hộ Kê Khai Khấu Trừ / Doanh Nghiệp F&B'
    );
  };

  // Record tax payment as cashbook expense
  const handleRecordTaxPayment = () => {
    if (taxSummary.totalTaxPayable <= 0) {
      alert('Không có nghĩa vụ thuế phát sinh trong kỳ này.');
      return;
    }

    if (
      confirm(
        `Xác nhận ghi nhận Phiếu Chi nộp tiền thuế ${formatCurrencyVND(
          taxSummary.totalTaxPayable
        )} vào Sổ Quỹ?`
      )
    ) {
      cashbookService.createManualTransaction({
        type: 'out',
        fund_type: 'bank',
        category: 'tax',
        amount: taxSummary.totalTaxPayable,
        description: `Nộp tiền thuế NSNN kỳ ${taxSummary.periodLabel} (GTGT ${taxConfig.vatRatePercent}% + TNCN ${taxConfig.personalIncomeTaxRatePercent}%)`,
        is_tax_valid: true,
        invoice_ref: `THUE-${selectedPeriod.toUpperCase()}-2026`,
      });
      showToast('Đã tự động tạo Phiếu Chi Nộp Thuế vào Sổ Quỹ Ngân Hàng!');
    }
  };

  // ==================== EXPORT REPORTS (CHUẨN TT 91 & NĐ 254) ====================

  // 1. Bảng Kê Chi Tiết Hóa Đơn Khởi Tạo Từ Máy Tính Tiền & Biên Bản Đơn Hủy (NĐ 254/2026/NĐ-CP)
  const handleExportND254 = () => {
    const orders = orderService.getOrders();
    const headers = [
      'STT',
      'Mã Đơn / Số HĐĐT Máy Tính Tiền',
      'Ngày Giờ Lập',
      'Bàn / Kênh Bán',
      'Trạng Thái',
      'Tổng Tiền (VNĐ)',
      'Thuế GTGT (3%)',
      'Hình Thức TT',
      'Lý Do Hủy (Nếu Có)',
      'Kiểm Toán Hủy Bởi',
    ];

    const rows = orders.map((o, idx) => [
      idx + 1,
      `HDMTT-${o.id.toUpperCase()}`,
      new Date(o.created_at).toLocaleString('vi-VN'),
      o.order_channel === 'delivery'
        ? `Giao Hàng (${(o.delivery_platform || 'App').toUpperCase()})`
        : o.order_channel === 'takeaway'
        ? 'Khách Mang Về'
        : o.table_number || 'Tại Bàn',
      o.order_status === 'completed' ? 'Hoàn tất' : o.order_status === 'cancelled' ? 'HỦY' : o.order_status,
      o.total_amount,
      Math.round(o.total_amount * 0.03),
      o.payment_method || 'Chưa TT',
      o.cancellation_reason || '',
      o.cancelled_by || '',
    ]);

    exportToCSV(`Bang_Ke_HDDT_May_Tinh_Tien_ND254_${selectedPeriod}.csv`, headers, rows);
    showToast('Đã xuất Bảng Kê Hóa Đơn Máy Tính Tiền (NĐ 254/2026/NĐ-CP)!');
  };

  // 2. Sổ Chi Tiết Doanh Thu Bán Hàng Hóa, Dịch Vụ (Mẫu S1 - TT 91/2026/TT-BTC)
  const handleExportMauS1 = () => {
    const orders = orderService.getOrders().filter((o) => o.payment_status === 'paid' || o.order_status === 'completed');
    const headers = [
      'Ngày Tháng',
      'Số Chứng Từ',
      'Diễn Giải',
      'Kênh Bán Hàng',
      'Doanh Thu Bán Hàng',
      'Thuế GTGT Phải Nộp (3%)',
      'Thuế TNCN Phải Nộp (1.5%)',
    ];

    const rows = orders.map((o) => [
      new Date(o.created_at).toLocaleDateString('vi-VN'),
      `PT-${o.id.slice(-6).toUpperCase()}`,
      `Doanh thu đơn ${o.table_number || ''}`,
      o.order_channel || 'dine_in',
      o.total_amount,
      Math.round(o.total_amount * 0.03),
      Math.round(o.total_amount * 0.015),
    ]);

    exportToCSV(`Mau_S1_So_Chi_Tiet_Doanh_Thu_TT91_${selectedPeriod}.csv`, headers, rows);
    showToast('Đã xuất Sổ Chi Tiết Doanh Thu (Mẫu S1 - TT 91/2026)!');
  };

  // 3. Sổ Chi Tiết Vật Liệu, Dụng Cụ, Sản Phẩm (Mẫu S2 - TT 91/2026/TT-BTC)
  const handleExportMauS2 = () => {
    const materials = inventoryService.getRawMaterials();
    const headers = [
      'Mã Nguyên Liệu',
      'Tên Nguyên Liệu / Vật Liệu',
      'Đơn Vị Tính',
      'Tồn Kho Hiện Tại',
      'Đơn Giá Bình Quân (VNĐ)',
      'Thành Tiền Tồn Kho (VNĐ)',
      'Phân Loại',
    ];

    const rows = materials.map((m) => [
      m.id,
      m.name,
      m.recipe_unit,
      m.current_stock,
      m.avg_cost,
      Math.round(m.current_stock * m.avg_cost),
      m.name.toLowerCase().includes('ly') || m.name.toLowerCase().includes('túi') ? 'Bao Bì' : 'Cốt Món',
    ]);

    exportToCSV(`Mau_S2_So_Nhap_Xuat_Ton_Kho_TT91.csv`, headers, rows);
    showToast('Đã xuất Sổ Nhập-Xuất-Tồn (Mẫu S2 - TT 91/2026)!');
  };

  // 4. Sổ Chi Phí Sản Xuất Kinh Doanh & Nghĩa Vụ Thuế (Mẫu S3 & S4 - TT 91/2026/TT-BTC)
  const handleExportMauS3 = () => {
    const expenses = cashbookService.getAllTransactions({ type: 'out' });
    const headers = [
      'Ngày Chi',
      'Số Phiếu Chi',
      'Nội Dung Chi Phí',
      'Hạng Mục',
      'Số Tiền (VNĐ)',
      'Số Hóa Đơn Hợp Lệ',
      'Khấu Trừ Thuế TT 91',
    ];

    const rows = expenses.map((e) => [
      new Date(e.created_at).toLocaleDateString('vi-VN'),
      e.code,
      e.description,
      e.category,
      e.amount,
      e.invoice_ref || '',
      e.is_tax_valid ? 'Được khấu trừ' : 'Không có HĐ',
    ]);

    exportToCSV(`Mau_S3_So_Chi_Phi_San_Xuat_Kinh_Doanh_TT91.csv`, headers, rows);
    showToast('Đã xuất Sổ Chi Phí Sản Xuất Kinh Doanh (Mẫu S3 - TT 91/2026)!');
  };

  // 5. Sổ Quỹ Tiền Mặt & Tiền Gửi Ngân Hàng (Mẫu S6 & S7 - TT 91/2026/TT-BTC)
  const handleExportMauS6 = () => {
    const txList = cashbookService.getAllTransactions();
    const headers = [
      'Ngày Tháng',
      'Số Phiếu',
      'Loại (Thu/Chi)',
      'Nguồn Quỹ',
      'Diễn Giải',
      'Số Tiền Thu (+)',
      'Số Tiền Chi (-)',
    ];

    const rows = txList.map((t) => [
      new Date(t.created_at).toLocaleString('vi-VN'),
      t.code,
      t.type === 'in' ? 'THU' : 'CHI',
      t.fund_type === 'cash' ? 'Két Tiền Mặt' : 'Tài Khoản NH',
      t.description,
      t.type === 'in' ? t.amount : 0,
      t.type === 'out' ? t.amount : 0,
    ]);

    exportToCSV(`Mau_S6_S7_So_Quy_Tien_Mat_Ngan_Hang_TT91.csv`, headers, rows);
    showToast('Đã xuất Sổ Quỹ Tiền Mặt & Ngân Hàng (Mẫu S6/S7 - TT 91/2026)!');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header with Legal Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-white tracking-tight">
              Trợ Lý Khai Thuế & Sổ Kế Toán Điện Tử F&B
            </h2>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Thiết kế riêng cho chủ quán không biết kế toán • Chuẩn hóa theo Nghị định 254/2026/NĐ-CP & Thông tư 91/2026/TT-BTC
          </p>
        </div>

        {/* Legal Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Nghị Định 254/2026/NĐ-CP (HĐĐT Máy Tính Tiền)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-bold">
            <FileSpreadsheet className="w-4 h-4 text-purple-500" />
            Thông Tư 91/2026/TT-BTC (Chế Độ Kế Toán)
          </span>
        </div>
      </div>

      {/* KHU VỰC 1: CẤU HÌNH CHẾ ĐỘ THUẾ & CẢNH BÁO DOANH THU NĂM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Tax Regime Method Switcher (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-500" />
              <span>Chế Độ Kê Khai Thuế Của Quán</span>
            </h3>
            <span className="text-[10px] text-stone-400 font-mono">1-Chạm Thay Đổi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Method 1: Hộ Kinh Doanh F&B (% Doanh thu) */}
            <div
              onClick={() => handleUpdateMethod('revenue_percentage')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                taxConfig.method === 'revenue_percentage'
                  ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/20 ring-2 ring-purple-600/30'
                  : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-purple-700 dark:text-purple-300">
                  <Store className="w-4 h-4" />
                  Hộ Kinh Doanh F&B
                </span>
                {taxConfig.method === 'revenue_percentage' && (
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                )}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                Tính theo <strong>Tỷ lệ % Doanh thu</strong> ngành Dịch vụ ăn uống:
              </p>
              <div className="mt-2.5 pt-2 border-t border-purple-100 dark:border-purple-900/40 flex items-center justify-between font-mono text-xs">
                <span className="text-stone-500">Thuế GTGT: <strong className="text-purple-600 font-bold">{taxConfig.vatRatePercent}%</strong></span>
                <span className="text-stone-500">Thuế TNCN: <strong className="text-purple-600 font-bold">{taxConfig.personalIncomeTaxRatePercent}%</strong></span>
              </div>
            </div>

            {/* Method 2: Hộ Kê Khai Khấu Trừ / Doanh Nghiệp */}
            <div
              onClick={() => handleUpdateMethod('deduction_method')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                taxConfig.method === 'deduction_method'
                  ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/20 ring-2 ring-purple-600/30'
                  : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-purple-700 dark:text-purple-300">
                  <Building2 className="w-4 h-4" />
                  Hộ Khấu Trừ / Doanh Nghiệp
                </span>
                {taxConfig.method === 'deduction_method' && (
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                )}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                Khấu trừ giá vốn BOM và chi phí vận hành có hóa đơn hợp lệ theo TT 91:
              </p>
              <div className="mt-2.5 pt-2 border-t border-purple-100 dark:border-purple-900/40 flex items-center justify-between font-mono text-xs">
                <span className="text-stone-500">GTGT Đầu Ra: <strong className="text-purple-600 font-bold">8% - 10%</strong></span>
                <span className="text-stone-500">Thuế TNDN: <strong className="text-purple-600 font-bold">20% Lãi</strong></span>
              </div>
            </div>
          </div>

          {/* Period Selection Bar */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 flex-wrap text-xs">
            <span className="text-stone-400 font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Chọn Kỳ Khai Thuế:
            </span>
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              {[
                { id: 'this_month', label: 'Tháng này' },
                { id: 'q1', label: 'Quý 1' },
                { id: 'q2', label: 'Quý 2' },
                { id: 'q3', label: 'Quý 3' },
                { id: 'q4', label: 'Quý 4' },
                { id: 'year', label: 'Năm 2026' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPeriod(p.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    selectedPeriod === p.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: NĐ 254 Threshold Gauge & Cancelled Audit (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Ngưỡng Bắt Buộc HĐĐT Máy Tính Tiền (NĐ 254)
              </span>
              <span className="text-[10px] font-mono font-bold text-stone-400">
                Mục tiêu 1 Tỷ / Năm
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-stone-900 dark:text-white font-mono tabular-nums">
                  {formatCurrencyVND(annualTotalRevenue)}
                </span>
                <span className="text-xs font-mono font-bold text-amber-600">
                  {thresholdPercent}% ngưỡng
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden mt-2">
                <div
                  style={{ width: `${thresholdPercent}%` }}
                  className={`h-full transition-all duration-500 ${
                    thresholdPercent >= 80 ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-500 to-amber-500'
                  }`}
                />
              </div>
            </div>

            <p className="text-[11px] text-stone-400">
              {thresholdPercent >= 100
                ? '⚠️ Quán đã vượt mốc 1 tỷ đồng/năm. Bắt buộc kết nối Hóa Đơn Điện Tử khởi tạo từ máy tính tiền theo NĐ 254/2026.'
                : '✅ Doanh thu an toàn dưới ngưỡng 1 tỷ đồng. Dữ liệu bán lẻ được lưu trữ sẵn sàng chuẩn dữ liệu kết nối.'}
            </p>
          </div>

          {/* Cancelled Invoices Audit Card */}
          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Hóa Đơn Hủy Trong Kỳ</span>
              <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                {taxSummary.cancelledOrdersCount} đơn hủy ({formatCurrencyVND(taxSummary.cancelledRevenue)})
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Đã có biên bản
            </span>
          </div>
        </div>
      </div>

      {/* KHU VỰC 2: BẢNG "COPY & DÁN TỜ KHAI THUẾ 1-CHẠM" (DÀNH CHO NGƯỜI KHÔNG BIẾT KẾ TOÁN) */}
      <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase">
                1-Chạm Khai Thuế
              </span>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                Bảng Copy & Dán Tờ Khai Thuế Điện Tử (eTax Mobile / thuedientu.gdt.gov.vn)
              </h3>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Chỉ cần bấm [Copy số] ở từng dòng và dán thẳng vào ô tương ứng trên Tờ khai thuế trực tuyến
            </p>
          </div>

          {/* Button: Ghi nhận nộp thuế vào Sổ Quỹ */}
          <button
            type="button"
            onClick={handleRecordTaxPayment}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Ghi Nhận Đã Nộp Thuế Vào Sổ Quỹ</span>
          </button>
        </div>

        {/* 4 Tax Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Indicator [28] */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 font-mono font-bold text-xs text-stone-700 dark:text-stone-300">
                  Chỉ tiêu [28]
                </span>
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  Doanh thu tính thuế GTGT
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Doanh thu bán hàng thực tế (đã trừ đơn hủy)</p>
              <div className="text-lg font-black font-mono text-stone-900 dark:text-white mt-1 tabular-nums">
                {formatCurrencyVND(taxSummary.netTaxableRevenue)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(taxSummary.netTaxableRevenue.toString(), '28')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-xs font-bold hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 transition-all cursor-pointer shadow-2xs"
            >
              {copiedKey === '28' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === '28' ? 'Đã Copy' : 'Copy Số'}</span>
            </button>
          </div>

          {/* Indicator [29] */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 font-mono font-bold text-xs">
                  Chỉ tiêu [29]
                </span>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                  Thuế GTGT phải nộp ({taxConfig.vatRatePercent}%)
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Nộp NSNN: 3% × Doanh thu tính thuế</p>
              <div className="text-lg font-black font-mono text-purple-600 dark:text-purple-400 mt-1 tabular-nums">
                {formatCurrencyVND(taxSummary.vatTaxAmount)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(taxSummary.vatTaxAmount.toString(), '29')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-xs font-bold hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 transition-all cursor-pointer shadow-2xs"
            >
              {copiedKey === '29' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === '29' ? 'Đã Copy' : 'Copy Số'}</span>
            </button>
          </div>

          {/* Indicator [30] */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 font-mono font-bold text-xs text-stone-700 dark:text-stone-300">
                  Chỉ tiêu [30]
                </span>
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  Doanh thu tính thuế TNCN
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Bằng tổng doanh thu dịch vụ ăn uống</p>
              <div className="text-lg font-black font-mono text-stone-900 dark:text-white mt-1 tabular-nums">
                {formatCurrencyVND(taxSummary.pitTaxableRevenue)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(taxSummary.pitTaxableRevenue.toString(), '30')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-xs font-bold hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 transition-all cursor-pointer shadow-2xs"
            >
              {copiedKey === '30' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === '30' ? 'Đã Copy' : 'Copy Số'}</span>
            </button>
          </div>

          {/* Indicator [31] */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 font-mono font-bold text-xs">
                  Chỉ tiêu [31]
                </span>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                  Thuế TNCN phải nộp ({taxConfig.personalIncomeTaxRatePercent}%)
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Nộp NSNN: 1.5% × Doanh thu tính thuế</p>
              <div className="text-lg font-black font-mono text-purple-600 dark:text-purple-400 mt-1 tabular-nums">
                {formatCurrencyVND(taxSummary.pitTaxAmount)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(taxSummary.pitTaxAmount.toString(), '31')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-xs font-bold hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 transition-all cursor-pointer shadow-2xs"
            >
              {copiedKey === '31' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === '31' ? 'Đã Copy' : 'Copy Số'}</span>
            </button>
          </div>
        </div>

        {/* Real P&L Summary for Owner */}
        <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 rounded-2xl border border-purple-200/70 dark:border-purple-800/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-purple-600" />
              Báo Cáo Lợi Nhuận Thực Tế (P&L Tóm Tắt Cho Chủ Quán)
            </span>
            <span className="text-xs font-bold text-purple-600 font-mono">
              Tổng Thuế Kỳ Này: {formatCurrencyVND(taxSummary.totalTaxPayable)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs font-mono">
            <div>
              <span className="text-stone-400 text-[10px] block font-sans">Doanh Thu Thuần</span>
              <span className="font-bold text-stone-900 dark:text-white">
                +{formatCurrencyVND(taxSummary.netTaxableRevenue)}
              </span>
            </div>
            <div>
              <span className="text-stone-400 text-[10px] block font-sans">Giá Vốn BOM (32%)</span>
              <span className="font-bold text-rose-500">
                -{formatCurrencyVND(taxSummary.totalCOGS)}
              </span>
            </div>
            <div>
              <span className="text-stone-400 text-[10px] block font-sans">Chi Phí Vận Hành</span>
              <span className="font-bold text-rose-500">
                -{formatCurrencyVND(taxSummary.validOperatingExpenses + taxSummary.invalidOperatingExpenses)}
              </span>
            </div>
            <div>
              <span className="text-stone-400 text-[10px] block font-sans">Thuế NSNN (4.5%)</span>
              <span className="font-bold text-purple-600">
                -{formatCurrencyVND(taxSummary.totalTaxPayable)}
              </span>
            </div>
            <div className="bg-white dark:bg-stone-900 p-2 rounded-xl border border-purple-200 dark:border-purple-800">
              <span className="text-emerald-600 font-sans text-[10px] block font-bold">💰 LÃI RÒNG THỰC BỎ TÚI</span>
              <span className={`text-sm font-black ${taxSummary.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {formatCurrencyVND(taxSummary.netProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KHU VỰC 3: TRUNG TÂM XUẤT BỘ SỔ KẾ TOÁN ĐIỆN TỬ (TT 91/2026 & NĐ 254/2026) */}
      <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">
                Bộ Sổ Kế Toán Điện Tử Chuẩn Pháp Lý (1-Click Xuất Excel / CSV)
              </h3>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Định dạng chuẩn font tiếng Việt (UTF-8 BOM), sẵn sàng nộp cơ quan thuế hoặc kiểm toán nội bộ
            </p>
          </div>
        </div>

        {/* 5 Bento Export Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {/* Card 1: NĐ 254 */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80 flex flex-col justify-between space-y-3">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Nghị Định 254/2026/NĐ-CP
              </span>
              <h4 className="font-extrabold text-xs text-stone-900 dark:text-white mt-1.5">
                Bảng Kê Hóa Đơn Khởi Tạo Từ Máy Tính Tiền & Hóa Đơn Hủy
              </h4>
              <p className="text-[11px] text-stone-400 mt-1">
                Chi tiết từng đơn hàng, tiền thuế GTGT và biên bản lý do hủy đơn.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportND254}
              className="w-full py-2 rounded-xl bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:bg-emerald-50 hover:text-emerald-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Bảng Kê NĐ 254</span>
            </button>
          </div>

          {/* Card 2: Mẫu S1 */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80 flex flex-col justify-between space-y-3">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                Mẫu S1 - TT 91/2026/TT-BTC
              </span>
              <h4 className="font-extrabold text-xs text-stone-900 dark:text-white mt-1.5">
                Sổ Chi Tiết Doanh Thu Bán Hàng Hóa, Dịch Vụ
              </h4>
              <p className="text-[11px] text-stone-400 mt-1">
                Ghi nhận từng chứng từ bán hàng, phân theo kênh và nghĩa vụ thuế.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportMauS1}
              className="w-full py-2 rounded-xl bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:bg-purple-50 hover:text-purple-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Sổ Doanh Thu S1</span>
            </button>
          </div>

          {/* Card 3: Mẫu S2 */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80 flex flex-col justify-between space-y-3">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                Mẫu S2 - TT 91/2026/TT-BTC
              </span>
              <h4 className="font-extrabold text-xs text-stone-900 dark:text-white mt-1.5">
                Sổ Chi Tiết Vật Liệu, Hàng Hóa Nhập - Xuất - Tồn
              </h4>
              <p className="text-[11px] text-stone-400 mt-1">
                Theo dõi tồn kho nguyên vật liệu cốt món và bao bì mang về.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportMauS2}
              className="w-full py-2 rounded-xl bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:bg-blue-50 hover:text-blue-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Sổ Kho S2</span>
            </button>
          </div>

          {/* Card 4: Mẫu S3 & S4 */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80 flex flex-col justify-between space-y-3">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Mẫu S3 & S4 - TT 91/2026/TT-BTC
              </span>
              <h4 className="font-extrabold text-xs text-stone-900 dark:text-white mt-1.5">
                Sổ Chi Phí Sản Xuất Kinh Doanh & Nghĩa Vụ Thuế
              </h4>
              <p className="text-[11px] text-stone-400 mt-1">
                Bóc tách chi phí hợp lệ có hóa đơn chứng từ được khấu trừ thuế.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportMauS3}
              className="w-full py-2 rounded-xl bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:bg-amber-50 hover:text-amber-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Sổ Chi Phí S3</span>
            </button>
          </div>

          {/* Card 5: Mẫu S6 & S7 */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80 flex flex-col justify-between space-y-3">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                Mẫu S6 & S7 - TT 91/2026/TT-BTC
              </span>
              <h4 className="font-extrabold text-xs text-stone-900 dark:text-white mt-1.5">
                Sổ Quỹ Tiền Mặt & Sổ Tiền Gửi Ngân Hàng
              </h4>
              <p className="text-[11px] text-stone-400 mt-1">
                Theo dõi lưu chuyển dòng tiền tại két tiền mặt và tài khoản ngân hàng.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportMauS6}
              className="w-full py-2 rounded-xl bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:bg-cyan-50 hover:text-cyan-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Sổ Quỹ S6/S7</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
