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

  it('tạo và quản lý nhiều Đơn Mang Về (Takeaway) với số thứ tự tăng dần', () => {
    const takeaway1 = orderService.generateNextTakeawayLabel();
    expect(takeaway1.tableId).toContain('takeaway-');
    expect(takeaway1.tableNumber).toMatch(/Mang Về #\d{2}/);

    const order1Id = `ord-takeaway-${Date.now()}`;
    const order1: Order = {
      id: order1Id,
      table_id: takeaway1.tableId,
      table_number: takeaway1.tableNumber,
      order_status: 'pending',
      payment_status: 'unpaid',
      subtotal: 60000,
      tax_amount: 4800,
      discount_amount: 0,
      total_amount: 64800,
      items: [
        {
          id: 'item-takeaway-1',
          order_id: order1Id,
          menu_item_id: 'dish-cafe',
          menu_item_name: 'Cà Phê Sữa Đá',
          quantity: 2,
          price: 30000,
          item_status: 'pending',
          station: 'bar',
          created_at: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    orderService.createOrder(order1);

    const activeTakeaways = orderService.getTakeawayOrders();
    const found = activeTakeaways.find((o) => o.id === order1Id);
    expect(found).toBeDefined();
    expect(found?.table_number).toBe(takeaway1.tableNumber);
  });

  it('gọi thêm món (appendItemsToOrder) vào đơn đang phục vụ và cập nhật lại toàn bộ tổng tiền', () => {
    const orderId = `ord-addon-test-${Date.now()}`;
    const initialOrder: Order = {
      id: orderId,
      table_id: 'tbl-test-addon',
      table_number: 'BÀN 05',
      order_status: 'cooking',
      payment_status: 'unpaid',
      subtotal: 100000,
      tax_amount: 8000,
      discount_amount: 0,
      total_amount: 108000,
      items: [
        {
          id: 'item-init-1',
          order_id: orderId,
          menu_item_id: 'dish-pho',
          menu_item_name: 'Phở Bò Tái Lăn',
          quantity: 1,
          price: 100000,
          item_status: 'cooking',
          station: 'kitchen',
          created_at: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    orderService.createOrder(initialOrder);

    // Khách gọi thêm 1 Trà Đào (45.000đ)
    const newAddonItems: OrderItem[] = [
      {
        id: `item-addon-${Date.now()}`,
        order_id: orderId,
        menu_item_id: 'dish-tra-dao',
        menu_item_name: 'Trà Đào Cam Sả',
        quantity: 1,
        price: 45000,
        item_status: 'pending',
        station: 'bar',
        created_at: new Date().toISOString(),
      },
    ];

    const updated = orderService.appendItemsToOrder(orderId, newAddonItems);
    expect(updated).not.toBeNull();
    expect(updated?.items.length).toBe(2);
    // Subtotal mới = 100,000 + 45,000 = 145,000
    expect(updated?.subtotal).toBe(145000);
    // VAT 8% = 145,000 * 0.08 = 11,600
    expect(updated?.tax_amount).toBe(11600);
    // Total mới = 145,000 + 11,600 = 156,600
    expect(updated?.total_amount).toBe(156600);
  });

  it('hủy đơn hàng (cancelOrder) kèm lý do, chuyển order status thành cancelled và giải phóng bàn', () => {
    const tableId = 'tbl-test-cancel';
    const orderId = `ord-cancel-test-${Date.now()}`;

    // Tạo bàn giả lập nếu chưa có
    const testOrder: Order = {
      id: orderId,
      table_id: tableId,
      table_number: 'BÀN 12',
      order_status: 'pending',
      payment_status: 'unpaid',
      subtotal: 200000,
      tax_amount: 16000,
      discount_amount: 0,
      total_amount: 216000,
      items: [
        {
          id: 'item-cancel-1',
          order_id: orderId,
          menu_item_id: 'dish-steak',
          menu_item_name: 'Bò Bít Tết',
          quantity: 1,
          price: 200000,
          item_status: 'pending',
          station: 'kitchen',
          created_at: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    orderService.createOrder(testOrder);

    const cancelReason = 'Khách mang về không đợi được';
    const cancelled = orderService.cancelOrder(orderId, cancelReason);

    expect(cancelled).not.toBeNull();
    expect(cancelled?.order_status).toBe('cancelled');
    expect(cancelled?.notes).toContain(cancelReason);
    expect(cancelled?.items[0].item_status).toBe('cancelled');

    // Kiểm tra order không còn xuất hiện trong getOrderByTableId
    const activeOrderForTable = orderService.getOrderByTableId(tableId);
    expect(activeOrderForTable).toBeNull();
  });
});
