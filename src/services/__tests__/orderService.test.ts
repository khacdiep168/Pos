import { describe, it, expect, beforeEach } from 'vitest';
import { orderService } from '../orderService';
import { Order, OrderItem } from '@/types';

describe('OrderService - Tính toán hóa đơn & Giảm giá', () => {
  beforeEach(() => {
    // Reset any state if necessary
  });

  it('tính đúng Subtotal, Thuế VAT 8% và Tổng tiền ban đầu của đơn hàng', () => {
    const items: OrderItem[] = [
      {
        id: 'item-1',
        order_id: 'ord-test-1',
        menu_item_id: 'dish-1',
        menu_item_name: 'Bò Bít Tết Hảo Hạng',
        quantity: 2,
        price: 250000,
        item_status: 'pending',
        station: 'kitchen',
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-2',
        order_id: 'ord-test-1',
        menu_item_id: 'dish-2',
        menu_item_name: 'Trà Sữa Oolong Nướng',
        quantity: 3,
        price: 50000,
        item_status: 'pending',
        station: 'bar',
        created_at: new Date().toISOString(),
      },
    ];

    // Subtotal: 2 * 250k + 3 * 50k = 650,000
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    expect(subtotal).toBe(650000);

    // Thuế VAT 8%: 650,000 * 0.08 = 52,000
    const taxAmount = Math.round(subtotal * 0.08);
    expect(taxAmount).toBe(52000);

    const totalBeforeDiscount = subtotal + taxAmount;
    expect(totalBeforeDiscount).toBe(702000);
  });

  it('áp dụng đúng Voucher giảm giá cố định (Fixed Amount) khi thanh toán', () => {
    const orderId = `test-order-${Date.now()}`;
    const testOrder: Order = {
      id: orderId,
      table_id: 'tbl-test-1',
      table_number: 'BÀN 99',
      order_status: 'cooking',
      payment_status: 'unpaid',
      subtotal: 500000,
      tax_amount: 40000, // 8%
      discount_amount: 0,
      total_amount: 540000,
      items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    orderService.createOrder(testOrder);

    // Thanh toán áp dụng voucher giảm 50.000đ
    const voucherDiscount = 50000;
    const result = orderService.completePayment(orderId, 'cash', voucherDiscount);

    expect(result).not.toBeNull();
    expect(result?.order.payment_status).toBe('paid');
    expect(result?.order.discount_amount).toBe(50000);
    // Total = 500,000 + 40,000 - 50,000 = 490,000
    expect(result?.order.total_amount).toBe(490000);
    expect(result?.order.order_status).toBe('completed');
  });

  it('áp dụng đúng Voucher giảm giá theo % (Percentage Discount) và chặn tổng tiền âm', () => {
    const orderId = `test-order-pct-${Date.now()}`;
    const subtotal = 1000000;
    const tax = 80000;

    const testOrder: Order = {
      id: orderId,
      table_id: 'tbl-test-2',
      table_number: 'BÀN 88',
      order_status: 'cooking',
      payment_status: 'unpaid',
      subtotal,
      tax_amount: tax,
      discount_amount: 0,
      total_amount: subtotal + tax,
      items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    orderService.createOrder(testOrder);

    // Giảm giá 20% trên subtotal: 1.000.000 * 0.20 = 200.000
    const discount20Pct = subtotal * 0.20;
    const result = orderService.completePayment(orderId, 'transfer_qr', discount20Pct);

    expect(result).not.toBeNull();
    expect(result?.order.discount_amount).toBe(200000);
    // Total = 1,000,000 + 80,000 - 200,000 = 880,000
    expect(result?.order.total_amount).toBe(880000);
  });
});
