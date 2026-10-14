'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  CashbookTransaction,
  CashbookCategory,
  CashbookType,
  CashbookFundType,
} from '@/types';
import { cashbookService, CashbookFilter } from '@/services/cashbookService';
import { formatCurrencyVND } from '@/lib/utils';
import { exportToCSV } from '@/lib/exportUtils';
import { realtimeEngine } from '@/services/realtimeEngine';
import {
  Wallet,
  Landmark,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Search,
  Calendar,
  CheckCircle2,
  FileCheck2,
  AlertCircle,
  Building,
  Zap,
  Users2,
  Package,
  Megaphone,
  Scale,
  Receipt,
  Trash2,
  X,
  CreditCard,
  Banknote,
  DollarSign,
} from 'lucide-react';

const categoryLabels: Record<CashbookCategory, { label: string; icon: any; color: string }> = {
  sales: { label: 'Doanh thu bán hàng', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' },
  supplier_payment: { label: 'Trả tiền hàng NCC', icon: Package, color: 'text-blue-500 bg-blue-500/10' },
  rent: { label: 'Tiền thuê mặt bằng', icon: Building, color: 'text-indigo-500 bg-indigo-500/10' },
  utilities: { label: 'Điện / Nước / Wifi', icon: Zap, color: 'text-amber-500 bg-amber-500/10' },
  salary: { label: 'Lương & Thưởng nhân viên', icon: Users2, color: 'text-purple-500 bg-purple-500/10' },
  daily_supplies: { label: 'Mua đá / Gas / Đồ vặt', icon: Banknote, color: 'text-cyan-500 bg-cyan-500/10' },
  marketing: { label: 'Quảng cáo & Phí sàn App', icon: Megaphone, color: 'text-orange-500 bg-orange-500/10' },
  tax: { label: 'Nộp tiền thuế NSNN', icon: Scale, color: 'text-rose-500 bg-rose-500/10' },
  other: { label: 'Thu / Chi khác', icon: Receipt, color: 'text-stone-500 bg-stone-500/10' },
};

export const CashbookTab: React.FC = () => {
  const [filterFund, setFilterFund] = useState<'all' | 'cash' | 'bank'>('all');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | CashbookCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [periodPreset, setPeriodPreset] = useState<'all' | 'today' | 'this_month' | 'custom'>('this_month');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<CashbookType>('out');
  const [modalFund, setModalFund] = useState<CashbookFundType>('cash');
  const [modalCategory, setModalCategory] = useState<CashbookCategory>('daily_supplies');
  const [modalAmount, setModalAmount] = useState<number>(0);
  const [modalDesc, setModalDesc] = useState('');
  const [modalTaxValid, setModalTaxValid] = useState(true);
  const [modalInvoiceRef, setModalInvoiceRef] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Trigger refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const unsub1 = realtimeEngine.subscribe('CASHBOOK_UPDATED', () => setRefreshTrigger((p) => p + 1));
    const unsub2 = realtimeEngine.subscribe('PAYMENT_COMPLETED', () => setRefreshTrigger((p) => p + 1));
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  // Filter Object
  const currentFilter: CashbookFilter = useMemo(() => {
    let start = startDate;
    let end = endDate;

    if (periodPreset === 'today') {
      const today = new Date().toISOString().slice(0, 10);
      start = today;
      end = today;
    } else if (periodPreset === 'all') {
      start = '';
      end = '';
    }

    return {
      startDate: start || undefined,
      endDate: end || undefined,
      fundType: filterFund,
      type: filterType,
      category: filterCategory,
      searchQuery,
    };
  }, [startDate, endDate, periodPreset, filterFund, filterType, filterCategory, searchQuery]);

  // Data
  const transactions = useMemo(() => {
    return cashbookService.getAllTransactions(currentFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilter, refreshTrigger]);

  const summary = useMemo(() => {
    return cashbookService.getBalanceSummary(currentFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilter, refreshTrigger]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Submit new transaction
  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalAmount <= 0) {
      alert('Vui lòng nhập số tiền lớn hơn 0đ');
      return;
    }
    if (!modalDesc.trim()) {
      alert('Vui lòng nhập lý do / diễn giải');
      return;
    }

    cashbookService.createManualTransaction({
      type: modalType,
      fund_type: modalFund,
      category: modalCategory,
      amount: modalAmount,
      description: modalDesc,
      is_tax_valid: modalTaxValid,
      invoice_ref: modalInvoiceRef,
    });

    setIsModalOpen(false);
    setModalAmount(0);
    setModalDesc('');
    setModalInvoiceRef('');
    showToast(modalType === 'in' ? 'Đã lập Phiếu Thu thành công!' : 'Đã lập Phiếu Chi thành công!');
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phiếu này khỏi sổ quỹ?')) {
      cashbookService.deleteManualTransaction(id);
      showToast('Đã xóa phiếu thành công');
    }
  };

  // Export functions (UTF-8 BOM)
  const handleExportCashbook = (targetFund?: 'cash' | 'bank') => {
    const list = targetFund
      ? transactions.filter((t) => t.fund_type === targetFund)
      : transactions;

    const headers = [
      'Mã Phiếu',
      'Ngày Giờ',
      'Loại Giao Dịch',
      'Nguồn Quỹ',
      'Hạng Mục',
      'Số Tiền (VNĐ)',
      'Hóa Đơn Kèm Theo',
      'Hợp Lệ TT 91/2026',
      'Diễn Giải',
      'Người Lập',
    ];

    const rows = list.map((t) => [
      t.code,
      new Date(t.created_at).toLocaleString('vi-VN'),
      t.type === 'in' ? 'THU' : 'CHI',
      t.fund_type === 'cash' ? 'Két Tiền Mặt' : 'Tài Khoản Ngân Hàng',
      categoryLabels[t.category]?.label || t.category,
      t.amount,
      t.invoice_ref || '',
      t.is_tax_valid ? 'Hợp lệ' : 'Không có HĐ',
      t.description,
      t.created_by || '',
    ]);

    const filename =
      targetFund === 'cash'
        ? `So_Quy_Tien_Mat_${new Date().toISOString().slice(0, 10)}.csv`
        : targetFund === 'bank'
        ? `So_Tien_Gui_Ngan_Hang_${new Date().toISOString().slice(0, 10)}.csv`
        : `So_Quy_Thu_Chi_${new Date().toISOString().slice(0, 10)}.csv`;

    const reportTitle =
      targetFund === 'cash'
        ? 'SỔ QUỸ TIỀN MẶT (MẪU S6 - THÔNG TƯ 91/2026/TT-BTC)'
        : targetFund === 'bank'
        ? 'SỔ TIỀN GỬI NGÂN HÀNG (MẪU S7 - THÔNG TƯ 91/2026/TT-BTC)'
        : 'SỔ QUỸ THU & CHI TIỀN MẶT - NGÂN HÀNG (TT 91/2026/TT-BTC)';

    exportToCSV(filename, headers, rows, {
      reportTitle,
      periodText: `Thời điểm xuất: ${new Date().toLocaleDateString('vi-VN')}`,
    });
    showToast(`Đã xuất file ${filename} (Chuẩn TT 91/2026/TT-BTC)!`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Wallet className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-white tracking-tight">
              Sổ Quỹ Thu & Chi (Smart Cashbook)
            </h2>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Tự động liên thông toàn bộ tiền bán hàng và thanh toán NCC • Quản trị dòng tiền thực tế
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setModalType('in');
              setModalCategory('sales');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Lập Phiếu Thu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalType('out');
              setModalCategory('daily_supplies');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Lập Phiếu Chi</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportCashbook()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-bold transition-all text-stone-700 dark:text-stone-300"
            title="Xuất file CSV chuẩn Excel"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất Sổ Quỹ</span>
          </button>
        </div>
      </div>

      {/* 4 BENTO CARDS: CASHFLOW OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bento 1: Két Tiền Mặt */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-500" />
              Tồn Két Tiền Mặt
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Tại Quầy
            </span>
          </div>

          <div>
            <div className={`text-2xl font-black font-mono tabular-nums ${summary.cashBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrencyVND(summary.cashBalance)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1 font-mono">
              <span>Thu: +{formatCurrencyVND(summary.cashIn)}</span>
              <span>Chi: -{formatCurrencyVND(summary.cashOut)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleExportCashbook('cash')}
            className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 pt-1 border-t border-stone-100 dark:border-stone-800 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Xuất Sổ Quỹ Tiền Mặt</span>
          </button>
        </div>

        {/* Bento 2: Tài Khoản Ngân Hàng */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-cyan-500" />
              Số Dư Ngân Hàng
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              VietQR / Thẻ
            </span>
          </div>

          <div>
            <div className={`text-2xl font-black font-mono tabular-nums ${summary.bankBalance >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrencyVND(summary.bankBalance)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1 font-mono">
              <span>Thu: +{formatCurrencyVND(summary.bankIn)}</span>
              <span>Chi: -{formatCurrencyVND(summary.bankOut)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleExportCashbook('bank')}
            className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1 pt-1 border-t border-stone-100 dark:border-stone-800 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Xuất Sổ Tiền Gửi NH</span>
          </button>
        </div>

        {/* Bento 3: Tổng Thu Trong Kỳ */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Tổng Thu Trong Kỳ
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              Toàn bộ nguồn
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-stone-900 dark:text-white font-mono tabular-nums">
              {formatCurrencyVND(summary.totalIn)}
            </div>
            {/* Split bar: Cash vs Bank */}
            <div className="mt-2 space-y-1">
              <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden flex">
                <div style={{ width: `${summary.cashInPercent}%` }} className="bg-emerald-500 h-full" title={`Tiền mặt ${summary.cashInPercent}%`} />
                <div style={{ width: `${summary.bankInPercent}%` }} className="bg-cyan-500 h-full" title={`Chuyển khoản ${summary.bankInPercent}%`} />
              </div>
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>💵 TM: {summary.cashInPercent}%</span>
                <span>🏦 NH: {summary.bankInPercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento 4: Tổng Chi & Dòng Tiền Ròng */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              Tổng Chi & Dòng Ròng
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${summary.netCashflow >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
              {summary.netCashflow >= 0 ? 'Dương tiền' : 'Âm tiền'}
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-stone-400 font-medium">Tổng Chi:</span>
              <span className="text-sm font-black text-rose-500 font-mono tabular-nums">
                -{formatCurrencyVND(summary.totalOut)}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-stone-100 dark:border-stone-800">
              <span className="text-xs text-stone-400 font-bold">Dòng Tiền Ròng:</span>
              <span className={`text-xl font-black font-mono tabular-nums ${summary.netCashflow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {summary.netCashflow > 0 ? '+' : ''}{formatCurrencyVND(summary.netCashflow)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Period Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-stone-400 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5" />
              Kỳ:
            </span>
            {[
              { id: 'today', label: 'Hôm nay' },
              { id: 'this_month', label: 'Tháng này' },
              { id: 'all', label: 'Tất cả' },
              { id: 'custom', label: 'Tùy chọn' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodPreset(p.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  periodPreset === p.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm mã phiếu, hóa đơn, diễn giải..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Secondary Filter Row: Fund & Type & Custom Dates */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
          {/* Fund type */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterFund('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterFund === 'all' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs' : 'text-stone-500'
              }`}
            >
              Tất Cả Quỹ
            </button>
            <button
              type="button"
              onClick={() => setFilterFund('cash')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterFund === 'cash' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-stone-500'
              }`}
            >
              💵 Tiền Mặt
            </button>
            <button
              type="button"
              onClick={() => setFilterFund('bank')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterFund === 'bank' ? 'bg-cyan-600 text-white shadow-2xs' : 'text-stone-500'
              }`}
            >
              🏦 Ngân Hàng
            </button>
          </div>

          {/* Type */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterType === 'all' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs' : 'text-stone-500'
              }`}
            >
              Tất Cả Phiếu
            </button>
            <button
              type="button"
              onClick={() => setFilterType('in')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterType === 'in' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-stone-500'
              }`}
            >
              📈 Thu
            </button>
            <button
              type="button"
              onClick={() => setFilterType('out')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterType === 'out' ? 'bg-rose-600 text-white shadow-2xs' : 'text-stone-500'
              }`}
            >
              📉 Chi
            </button>
          </div>

          {/* Custom Date Pickers */}
          {periodPreset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono"
              />
              <span className="text-stone-400">đến</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono"
              />
            </div>
          )}

          <div className="ml-auto text-xs text-stone-400 font-mono">
            Hiển thị: <strong>{transactions.length}</strong> giao dịch
          </div>
        </div>
      </div>

      {/* DATA GRID (DESKTOP) & CARD LIST (MOBILE) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-3 px-4">Mã Phiếu</th>
                <th className="py-3 px-3">Thời Gian</th>
                <th className="py-3 px-3">Hạng Mục</th>
                <th className="py-3 px-3">Nguồn Quỹ</th>
                <th className="py-3 px-3">Hóa Đơn / TT 91</th>
                <th className="py-3 px-4">Diễn Giải</th>
                <th className="py-3 px-4 text-right">Số Tiền (VNĐ)</th>
                <th className="py-3 px-3 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-mono">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400 font-sans">
                    Không có giao dịch nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const cat = categoryLabels[t.category] || categoryLabels.other;
                  const Icon = cat.icon;
                  const isPositive = t.type === 'in';

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      {/* Code */}
                      <td className="py-3 px-4 font-bold">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                        }`}>
                          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {t.code}
                        </span>
                        {t.is_auto && (
                          <span className="ml-1 text-[9px] font-sans font-bold px-1 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">
                            Tự động
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-stone-500 text-[11px]">
                        {new Date(t.created_at).toLocaleString('vi-VN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 font-sans">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold ${cat.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{cat.label}</span>
                        </span>
                      </td>

                      {/* Fund */}
                      <td className="py-3 px-3 font-sans">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          t.fund_type === 'cash'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300'
                        }`}>
                          {t.fund_type === 'cash' ? '💵 Két Tiền Mặt' : '🏦 Ngân Hàng'}
                        </span>
                      </td>

                      {/* Tax Invoice Ref */}
                      <td className="py-3 px-3">
                        {t.invoice_ref ? (
                          <div className="flex items-center gap-1 text-[11px] text-stone-700 dark:text-stone-300">
                            <Receipt className="w-3 h-3 text-purple-500" />
                            <span>{t.invoice_ref}</span>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-[10px]">—</span>
                        )}
                        <div>
                          {t.is_tax_valid ? (
                            <span className="text-[10px] font-sans font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                              <FileCheck2 className="w-2.5 h-2.5" /> Hợp lệ TT 91
                            </span>
                          ) : (
                            <span className="text-[10px] font-sans text-stone-400">Không có HĐ</span>
                          )}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 font-sans text-stone-700 dark:text-stone-300 max-w-xs truncate" title={t.description}>
                        {t.description}
                      </td>

                      {/* Amount */}
                      <td className={`py-3 px-4 text-right text-sm font-black tabular-nums ${
                        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isPositive ? '+' : '-'}{formatCurrencyVND(t.amount)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        {!t.is_auto ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="p-1 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Xóa phiếu này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-stone-300 dark:text-stone-600 font-sans">Khóa</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="md:hidden divide-y divide-stone-100 dark:divide-stone-800">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              Không có giao dịch nào phù hợp.
            </div>
          ) : (
            transactions.map((t) => {
              const cat = categoryLabels[t.category] || categoryLabels.other;
              const isPositive = t.type === 'in';

              return (
                <div key={t.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {t.code}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(t.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className={`text-sm font-black font-mono tabular-nums ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isPositive ? '+' : '-'}{formatCurrencyVND(t.amount)}
                    </div>
                  </div>

                  <p className="text-xs text-stone-800 dark:text-stone-200 line-clamp-2">
                    {t.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-50 dark:border-stone-800">
                    <span className="flex items-center gap-1">
                      <span>{t.fund_type === 'cash' ? '💵 Tiền Mặt' : '🏦 Ngân Hàng'}</span>
                      <span>•</span>
                      <span>{cat.label}</span>
                    </span>

                    {!t.is_auto && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="text-stone-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: + LẬP PHIẾU THU / PHIẾU CHI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl text-white ${modalType === 'in' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                  {modalType === 'in' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                    {modalType === 'in' ? 'Lập Phiếu Thu Tiền' : 'Lập Phiếu Chi Tiền'}
                  </h3>
                  <p className="text-xs text-stone-400">Ghi nhận dòng tiền thực tế vào Sổ Quỹ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction} className="space-y-4 text-xs">
              {/* Type Toggle: Thu vs Chi */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setModalType('in')}
                  className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    modalType === 'in' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Phiếu Thu (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalType('out')}
                  className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    modalType === 'out' ? 'bg-rose-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Phiếu Chi (-)</span>
                </button>
              </div>

              {/* Fund Selector: Két tiền mặt vs Ngân hàng */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Nguồn Quỹ Giao Dịch
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalFund('cash')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      modalFund === 'cash'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-bold">Két Tiền Mặt</div>
                      <div className="text-[10px] text-stone-400 font-mono">Tồn: {formatCurrencyVND(summary.cashBalance)}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalFund('bank')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      modalFund === 'bank'
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-300 ring-2 ring-cyan-500/20'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <Landmark className="w-5 h-5 text-cyan-500 shrink-0" />
                    <div>
                      <div className="font-bold">Tài Khoản NH</div>
                      <div className="text-[10px] text-stone-400 font-mono">Dư: {formatCurrencyVND(summary.bankBalance)}</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Category Quick Selector */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Hạng Mục Thu / Chi (1-Chạm)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(Object.keys(categoryLabels) as CashbookCategory[]).map((catKey) => {
                    if (modalType === 'in' && catKey !== 'sales' && catKey !== 'other') return null;
                    const cat = categoryLabels[catKey];
                    const Icon = cat.icon;
                    const isSelected = modalCategory === catKey;

                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setModalCategory(catKey)}
                        className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-bold ring-2 ring-purple-500/20'
                            : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span className="text-[11px] leading-tight line-clamp-1">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Input with Quick Pills */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Số Tiền (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={modalAmount || ''}
                    onChange={(e) => setModalAmount(Number(e.target.value) || 0)}
                    placeholder="Ví dụ: 500000"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-base font-black text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">
                    đ
                  </span>
                </div>

                {/* Quick amount pills */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {[100000, 200000, 500000, 1000000, 2000000, 5000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setModalAmount(amt)}
                      className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono text-[10px] font-bold hover:bg-stone-200"
                    >
                      {formatCurrencyVND(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Invoice & Tax Valid Switch */}
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-500" />
                    <div>
                      <span className="font-bold text-stone-800 dark:text-stone-200 block">
                        Có Hóa Đơn / Chứng Từ Hợp Lệ
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Được trừ chi phí tính thuế theo TT 91/2026/TT-BTC
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={modalTaxValid}
                    onChange={(e) => setModalTaxValid(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>

                {modalTaxValid && (
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 block mb-0.5">
                      Số Hóa Đơn / Phiếu Kèm Theo
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: HD-EVN-09881, Mua đá #281..."
                      value={modalInvoiceRef}
                      onChange={(e) => setModalInvoiceRef(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Description Input */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Lý Do / Diễn Giải <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  placeholder="Ghi rõ lý do chi tiêu hoặc nguồn thu..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-bold hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-bold transition-all shadow-md active:scale-95 ${
                    modalType === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {modalType === 'in' ? 'Xác Nhận Tạo Phiếu Thu' : 'Xác Nhận Tạo Phiếu Chi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
