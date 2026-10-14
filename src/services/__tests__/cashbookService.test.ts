import { describe, it, expect, beforeEach } from 'vitest';
import { cashbookService } from '../cashbookService';
import { orderService } from '../orderService';
import { inventoryService } from '../inventoryService';
import { Order, CartItem } from '@/types';

describe('CashbookService & Tax Assistant (Nghị định 254/2026 & Thông tư 91/2026)', () => {
  beforeEach(() => {
    // Reset test orders and manual cashbook transactions if needed
  });

  it('tự động phân loại đơn hàng đã thanh toán vào Quỹ Tiền Mặt và Quỹ Ngân Hàng (Zero-Entry Accounting)', () => {
    const now = new Date().toISOString();
    // Create a cash order
    const cashOrder = orderService.createOrder({
      id: `ord-test-cash-${Date.now()}`,
      table_id: 'tbl-1',
      table_number: 'Bàn 01',
      order_status: 'pending',
      payment_status: 'unpaid',
      subtotal: 50000,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: 50000,
      items: [
        {
          id: 'item-1',
          order_id: 'ord-test-cash',
          menu_item_id: 'item-cafe-da',
          menu_item_name: 'Cà phê đá',
          quantity: 2,
          price: 25000,
          item_status: 'served',
          station: 'bar',
          created_at: now,
        },
      ],
      created_at: now,
      updated_at: now,
    });

    // Pay cash
    orderService.completePayment(cashOrder.id, 'cash');

    // Create a QR / Bank order
    const bankOrder = orderService.createOrder({
      id: `ord-test-bank-${Date.now()}`,
      table_id: 'tbl-2',
      table_number: 'Bàn 02',
      order_status: 'pending',
      payment_status: 'unpaid',
      subtotal: 102000,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: 102000,
      items: [
        {
          id: 'item-2',
          order_id: 'ord-test-bank',
          menu_item_id: 'item-008707',
          menu_item_name: 'Cà phê sữa',
          quantity: 3,
          price: 34000,
          item_status: 'served',
          station: 'bar',
          created_at: now,
        },
      ],
      created_at: now,
      updated_at: now,
    });

    // Pay vietqr
    orderService.completePayment(bankOrder.id, 'vietqr');

    const transactions = cashbookService.getAllTransactions();

    // Verify cash transaction exists
    const cashTx = transactions.find((t) => t.reference_id === cashOrder.id);
    expect(cashTx).toBeDefined();
    expect(cashTx?.type).toBe('in');
    expect(cashTx?.fund_type).toBe('cash');
    expect(cashTx?.category).toBe('sales');
    expect(cashTx?.is_auto).toBe(true);

    // Verify bank transaction exists
    const bankTx = transactions.find((t) => t.reference_id === bankOrder.id);
    expect(bankTx).toBeDefined();
    expect(bankTx?.type).toBe('in');
    expect(bankTx?.fund_type).toBe('bank');
    expect(bankTx?.category).toBe('sales');
    expect(bankTx?.is_auto).toBe(true);
  });

  it('lập Phiếu Chi thủ công và cập nhật chính xác số dư quỹ tiền mặt và ngân hàng', () => {
    const summaryBefore = cashbookService.getBalanceSummary();

    // Lập phiếu chi tiền mặt: Mua đá 100.000đ
    const expenseCash = cashbookService.createManualTransaction({
      type: 'out',
      fund_type: 'cash',
      category: 'daily_supplies',
      amount: 100000,
      description: 'Mua đá bi & túi mang về',
      is_tax_valid: false,
    });

    expect(expenseCash.code).toMatch(/^PC-\d{8}-\d{3}$/);
    expect(expenseCash.amount).toBe(100000);

    // Lập phiếu chi ngân hàng: Trả tiền điện 2.000.000đ (có hóa đơn hợp lệ)
    const expenseBank = cashbookService.createManualTransaction({
      type: 'out',
      fund_type: 'bank',
      category: 'utilities',
      amount: 2000000,
      description: 'Tiền điện sinh hoạt',
      is_tax_valid: true,
      invoice_ref: 'EVN-2026-999',
    });

    const summaryAfter = cashbookService.getBalanceSummary();

    expect(summaryAfter.cashOut).toBe(summaryBefore.cashOut + 100000);
    expect(summaryAfter.cashBalance).toBe(summaryBefore.cashBalance - 100000);

    expect(summaryAfter.bankOut).toBe(summaryBefore.bankOut + 2000000);
    expect(summaryAfter.bankBalance).toBe(summaryBefore.bankBalance - 2000000);
  });

  it('tính toán chính xác nghĩa vụ thuế GTGT (3%) & TNCN (1.5%) theo Nghị định 254/2026 & Thông tư 91/2026', () => {
    const config = cashbookService.getTaxConfiguration();
    expect(config.method).toBe('revenue_percentage');
    expect(config.vatRatePercent).toBe(3.0);
    expect(config.personalIncomeTaxRatePercent).toBe(1.5);

    const summary = cashbookService.calculateTaxSummary(config);

    // Giả sử doanh thu tính thuế GTGT (Chỉ tiêu [28])
    const revenue = summary.netTaxableRevenue;

    // Chỉ tiêu [29] - GTGT 3%
    const expectedVAT = Math.round(revenue * 0.03);
    expect(summary.vatTaxAmount).toBe(expectedVAT);

    // Chỉ tiêu [31] - TNCN 1.5%
    const expectedPIT = Math.round(revenue * 0.015);
    expect(summary.pitTaxAmount).toBe(expectedPIT);

    // Tổng thuế = 4.5%
    expect(summary.totalTaxPayable).toBe(expectedVAT + expectedPIT);

    // Chi phí hợp lệ vs không hợp lệ được bóc tách rõ ràng
    expect(summary.validOperatingExpenses).toBeGreaterThanOrEqual(0);
    expect(summary.invalidOperatingExpenses).toBeGreaterThanOrEqual(0);
    expect(summary.totalExpenses).toBe(
      summary.totalCOGS + summary.validOperatingExpenses + summary.invalidOperatingExpenses
    );
  });
});
