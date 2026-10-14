import {
  CashbookTransaction,
  CashbookCategory,
  CashbookType,
  CashbookFundType,
  TaxConfiguration,
  TaxCalculationSummary,
  Order,
} from '@/types';
import { initialManualCashbookTransactions } from '@/database/mockData';
import { orderService } from './orderService';
import { inventoryService } from './inventoryService';
import { realtimeEngine } from './realtimeEngine';
import { supabase } from '@/lib/supabaseClient';

const STORAGE_MANUAL_CASHBOOK = 'pos_cashbook_manual';
const STORAGE_TAX_CONFIG = 'pos_tax_config';

export const defaultTaxConfig: TaxConfiguration = {
  method: 'revenue_percentage', // Hộ KD theo % Doanh thu
  vatRatePercent: 3.0, // 3% GTGT ngành ăn uống
  personalIncomeTaxRatePercent: 1.5, // 1.5% TNCN ngành ăn uống
  annualRevenueThreshold: 1000000000, // 1 tỷ VNĐ / năm bắt buộc HĐĐT máy tính tiền theo NĐ 254
};

export interface CashbookFilter {
  startDate?: string;
  endDate?: string;
  fundType?: 'all' | 'cash' | 'bank';
  type?: 'all' | 'in' | 'out';
  category?: 'all' | CashbookCategory;
  searchQuery?: string;
}

export interface CashbookBalanceSummary {
  cashIn: number;
  cashOut: number;
  cashBalance: number;
  bankIn: number;
  bankOut: number;
  bankBalance: number;
  totalIn: number;
  totalOut: number;
  netCashflow: number;
  cashInPercent: number;
  bankInPercent: number;
}

class CashbookService {
  private manualTransactions: CashbookTransaction[] = [];
  private taxConfig: TaxConfiguration = { ...defaultTaxConfig };

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_MANUAL_CASHBOOK);
        if (saved) {
          this.manualTransactions = JSON.parse(saved);
        } else {
          this.manualTransactions = [...initialManualCashbookTransactions];
          localStorage.setItem(STORAGE_MANUAL_CASHBOOK, JSON.stringify(this.manualTransactions));
        }

        const savedTax = localStorage.getItem(STORAGE_TAX_CONFIG);
        if (savedTax) {
          this.taxConfig = { ...defaultTaxConfig, ...JSON.parse(savedTax) };
        }
      } catch {
        this.manualTransactions = [...initialManualCashbookTransactions];
      }
    } else {
      this.manualTransactions = [...initialManualCashbookTransactions];
    }
  }

  private saveManual() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_MANUAL_CASHBOOK, JSON.stringify(this.manualTransactions));
      } catch (e) {
        console.warn('Could not save cashbook to localStorage:', e);
      }
    }
  }

  // ==================== AUTO INTER-LINKING (ZERO-ENTRY ACCOUNTING) ====================

  /**
   * Tự động sinh giao dịch Thu từ các đơn hàng đã thanh toán
   */
  private generateSalesTransactions(): CashbookTransaction[] {
    const orders = orderService.getOrders();
    const paidOrders = orders.filter(
      (o) => o.payment_status === 'paid' || o.order_status === 'completed'
    );

    return paidOrders.map((o) => {
      const isCash = o.payment_method === 'cash';
      const channelLabel =
        o.order_channel === 'takeaway'
          ? 'Mang về'
          : o.order_channel === 'delivery'
          ? `Giao hàng (${(o.delivery_platform || 'App').toUpperCase()})`
          : 'Tại bàn';

      return {
        id: `cb-ord-${o.id}`,
        code: `PT-ORD-${o.id.replace(/\D/g, '').slice(-4) || o.id.slice(-4)}`,
        type: 'in',
        fund_type: isCash ? 'cash' : 'bank',
        category: 'sales',
        amount: o.total_amount,
        is_tax_valid: true,
        invoice_ref: `HD-${o.id.slice(-6).toUpperCase()}`,
        description: `Doanh thu đơn ${o.table_number || ''} (#${o.id.slice(-4)}) • ${channelLabel}`,
        reference_id: o.id,
        created_by: 'Thu Ngân',
        created_at: o.created_at,
        is_auto: true,
      };
    });
  }

  /**
   * Tự động sinh giao dịch Chi từ các khoản thanh toán công nợ Nhà Cung Cấp
   */
  private generateSupplierPaymentTransactions(): CashbookTransaction[] {
    const debtTxList = inventoryService.getSupplierDebtTransactions();
    const payments = debtTxList.filter((tx) => tx.type === 'payment');

    return payments.map((tx) => ({
      id: `cb-debt-${tx.id}`,
      code: `PC-SUP-${tx.id.replace(/\D/g, '').slice(-4) || tx.id.slice(-4)}`,
      type: 'out',
      fund_type: 'bank', // Thanh toán nhà cung cấp mặc định chuyển khoản
      category: 'supplier_payment',
      amount: tx.amount,
      is_tax_valid: true,
      invoice_ref: tx.reference_id || `NCC-${tx.supplier_id}`,
      description: tx.notes || 'Thanh toán tiền công nợ hàng hóa NCC',
      reference_id: tx.id,
      created_by: 'Quản Trị Viên',
      created_at: tx.created_at,
      is_auto: true,
    }));
  }

  // ==================== QUERIES & BALANCE ====================

  /**
   * Lấy toàn bộ giao dịch Sổ Quỹ (Hợp nhất Tự Động + Thủ Công)
   */
  public getAllTransactions(filter?: CashbookFilter): CashbookTransaction[] {
    const salesTx = this.generateSalesTransactions();
    const supplierTx = this.generateSupplierPaymentTransactions();
    let all = [...salesTx, ...supplierTx, ...this.manualTransactions];

    // Sort by created_at descending
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (!filter) return all;

    return all.filter((tx) => {
      // Date range filter
      if (filter.startDate) {
        const start = new Date(filter.startDate);
        start.setHours(0, 0, 0, 0);
        if (new Date(tx.created_at) < start) return false;
      }
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(tx.created_at) > end) return false;
      }

      // Fund type filter
      if (filter.fundType && filter.fundType !== 'all') {
        if (tx.fund_type !== filter.fundType) return false;
      }

      // Type filter
      if (filter.type && filter.type !== 'all') {
        if (tx.type !== filter.type) return false;
      }

      // Category filter
      if (filter.category && filter.category !== 'all') {
        if (tx.category !== filter.category) return false;
      }

      // Search query
      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase().trim();
        const matchCode = tx.code.toLowerCase().includes(q);
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchInv = tx.invoice_ref?.toLowerCase().includes(q);
        if (!matchCode && !matchDesc && !matchInv) return false;
      }

      return true;
    });
  }

  /**
   * Tính toán 4 Thẻ Bento Tổng Quan Dòng Tiền
   */
  public getBalanceSummary(filter?: CashbookFilter): CashbookBalanceSummary {
    const transactions = this.getAllTransactions(filter);

    let cashIn = 0;
    let cashOut = 0;
    let bankIn = 0;
    let bankOut = 0;

    for (const tx of transactions) {
      if (tx.type === 'in') {
        if (tx.fund_type === 'cash') cashIn += tx.amount;
        else bankIn += tx.amount;
      } else {
        if (tx.fund_type === 'cash') cashOut += tx.amount;
        else bankOut += tx.amount;
      }
    }

    const totalIn = cashIn + bankIn;
    const totalOut = cashOut + bankOut;
    const cashBalance = cashIn - cashOut;
    const bankBalance = bankIn - bankOut;
    const netCashflow = totalIn - totalOut;

    const cashInPercent = totalIn > 0 ? Math.round((cashIn / totalIn) * 100) : 0;
    const bankInPercent = totalIn > 0 ? 100 - cashInPercent : 0;

    return {
      cashIn,
      cashOut,
      cashBalance,
      bankIn,
      bankOut,
      bankBalance,
      totalIn,
      totalOut,
      netCashflow,
      cashInPercent,
      bankInPercent,
    };
  }

  // ==================== MANUAL TRANSACTIONS CRUD ====================

  /**
   * Tạo Phiếu Thu / Phiếu Chi thủ công
   */
  public createManualTransaction(input: {
    type: CashbookType;
    fund_type: CashbookFundType;
    category: CashbookCategory;
    amount: number;
    description: string;
    is_tax_valid: boolean;
    invoice_ref?: string;
    created_by?: string;
    created_at?: string;
  }): CashbookTransaction {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = input.type === 'in' ? 'PT' : 'PC';
    const rand = Math.floor(100 + Math.random() * 900);
    const code = `${prefix}-${dateStr}-${rand}`;

    const newTx: CashbookTransaction = {
      id: `cb-man-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code,
      type: input.type,
      fund_type: input.fund_type,
      category: input.category,
      amount: Math.max(0, input.amount),
      is_tax_valid: input.is_tax_valid,
      invoice_ref: input.invoice_ref?.trim() || undefined,
      description: input.description.trim(),
      created_by: input.created_by || 'Quản Trị Viên',
      created_at: input.created_at || now.toISOString(),
      is_auto: false,
    };

    this.manualTransactions.unshift(newTx);
    this.saveManual();
    realtimeEngine.emit('CASHBOOK_UPDATED', newTx);
    return newTx;
  }

  public deleteManualTransaction(id: string): boolean {
    const initLen = this.manualTransactions.length;
    this.manualTransactions = this.manualTransactions.filter((tx) => tx.id !== id);

    if (this.manualTransactions.length !== initLen) {
      this.saveManual();
      realtimeEngine.emit('CASHBOOK_UPDATED', { type: 'DELETED', id });
      return true;
    }
    return false;
  }

  // ==================== TAX REGIME CONFIG & CALCULATION ====================

  public getTaxConfiguration(): TaxConfiguration {
    return { ...this.taxConfig };
  }

  public updateTaxConfiguration(config: Partial<TaxConfiguration>): TaxConfiguration {
    this.taxConfig = { ...this.taxConfig, ...config };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_TAX_CONFIG, JSON.stringify(this.taxConfig));
      } catch (e) {
        console.warn('Could not save tax config:', e);
      }
    }
    realtimeEngine.emit('TAX_CONFIG_UPDATED', this.taxConfig);
    return this.taxConfig;
  }

  /**
   * Tính toán nghĩa vụ thuế & Báo cáo P&L chuẩn Nghị định 254/2026 & TT 91/2026
   */
  public calculateTaxSummary(
    config: TaxConfiguration = this.taxConfig,
    filter?: { startDate?: string; endDate?: string; periodLabel?: string }
  ): TaxCalculationSummary {
    const orders = orderService.getOrders();
    const periodLabel = filter?.periodLabel || 'Kỳ Kê Khai Hiện Tại';

    // Filter orders by period if specified
    const periodOrders = orders.filter((o) => {
      if (filter?.startDate) {
        const start = new Date(filter.startDate);
        start.setHours(0, 0, 0, 0);
        if (new Date(o.created_at) < start) return false;
      }
      if (filter?.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(o.created_at) > end) return false;
      }
      return true;
    });

    // 1. Phân tích doanh thu & hóa đơn hủy
    const completedOrders = periodOrders.filter(
      (o) => o.payment_status === 'paid' || o.order_status === 'completed'
    );
    const cancelledOrders = periodOrders.filter((o) => o.order_status === 'cancelled');

    const totalGrossRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const cancelledRevenue = cancelledOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const cancelledOrdersCount = cancelledOrders.length;

    // Doanh thu tính thuế GTGT (Chỉ tiêu [28]): Doanh thu thực thu, đã loại trừ các đơn hủy có lý do
    const netTaxableRevenue = totalGrossRevenue;

    // 2. Tính thuế theo chế độ pháp lý
    let vatTaxAmount = 0;
    let pitTaxAmount = 0;

    if (config.method === 'revenue_percentage') {
      // Chuẩn Hộ kinh doanh F&B: 3% GTGT + 1.5% TNCN
      vatTaxAmount = Math.round(netTaxableRevenue * (config.vatRatePercent / 100));
      pitTaxAmount = Math.round(netTaxableRevenue * (config.personalIncomeTaxRatePercent / 100));
    } else {
      // Phương pháp khấu trừ / Doanh nghiệp: Thuế GTGT 8%/10%
      vatTaxAmount = Math.round(netTaxableRevenue * (config.vatRatePercent / 100));
      pitTaxAmount = 0; // Doanh nghiệp nộp TNDN sau khi trừ chi phí
    }

    const totalTaxPayable = vatTaxAmount + pitTaxAmount;

    // 3. Tính chi phí vận hành & Giá vốn BOM
    const cashbookFilter: CashbookFilter = {
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      type: 'out',
    };
    const expenses = this.getAllTransactions(cashbookFilter).filter(
      (tx) => tx.category !== 'tax' // Loại trừ khoản nộp thuế để không tính trùng
    );

    let validOperatingExpenses = 0;
    let invalidOperatingExpenses = 0;

    for (const exp of expenses) {
      if (exp.is_tax_valid) {
        validOperatingExpenses += exp.amount;
      } else {
        invalidOperatingExpenses += exp.amount;
      }
    }

    // Giá vốn nguyên liệu ước tính (BOM Food Cost ~ 32% doanh thu)
    const totalCOGS = Math.round(netTaxableRevenue * 0.32);
    const totalExpenses = totalCOGS + validOperatingExpenses + invalidOperatingExpenses;
    const netProfit = netTaxableRevenue - totalExpenses - totalTaxPayable;

    return {
      periodLabel,
      totalGrossRevenue,
      cancelledRevenue,
      netTaxableRevenue,
      vatTaxAmount,
      pitTaxableRevenue: netTaxableRevenue,
      pitTaxAmount,
      totalTaxPayable,
      totalCOGS,
      validOperatingExpenses,
      invalidOperatingExpenses,
      totalExpenses,
      netProfit,
      cancelledOrdersCount,
    };
  }
}

export const cashbookService = new CashbookService();
