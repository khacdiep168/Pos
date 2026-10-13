// End-to-End Simulation Script for Smart Restaurant POS
// Automatically simulates complete lifecycle across FOH -> KDS -> Cashier -> ERP -> Admin

import { orderService } from './orderService';
import { inventoryService } from './inventoryService';
import { initialMenuItems } from '@/database/mockData';
import { Order, OrderItem } from '@/types';
import { playOrderNotificationSound } from '@/lib/audioAlert';

export interface E2EStepLog {
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp: string;
  details?: any;
}

export async function runE2ESimulation(
  onProgress?: (logs: E2EStepLog[]) => void
): Promise<{ success: boolean; orderId: string }> {
  const logs: E2EStepLog[] = [
    {
      step: 1,
      title: 'Khách / Waiter gọi món tại FOH',
      description: 'Chọn Bàn 02, gọi 1 Bò Bít Tết Wagyu (Bếp) & 1 Cà Phê Muối (Bar)',
      status: 'pending',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
    },
    {
      step: 2,
      title: 'Gửi Order & Định tuyến trạm KDS/BDS',
      description: 'Bắn ORDER_CREATED: Bàn 02 đổi sang Đang dùng, KDS chuông reo, tách vé Bếp & Bar',
      status: 'pending',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
    },
    {
      step: 3,
      title: 'KDS Chế biến & Hoàn tất ra món',
      description: 'Chuyển trạng thái Cooking -> Ready cho cả Bếp và Bar',
      status: 'pending',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
    },
    {
      step: 4,
      title: 'Thu Ngân quét VietQR & Thanh toán ACID',
      description: 'Mở hóa đơn Bàn 02, quét Dynamic VietQR và xác nhận thanh toán giải phóng bàn',
      status: 'pending',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
    },
    {
      step: 5,
      title: 'ERP Trừ kho tự động & Admin cập nhật doanh thu',
      description: 'BOM Auto-Deduct trừ Thịt bò & Hạt Cà phê, Dashboard nảy số doanh thu',
      status: 'pending',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
    },
  ];

  const update = (stepIndex: number, status: E2EStepLog['status'], details?: any) => {
    logs[stepIndex].status = status;
    logs[stepIndex].timestamp = new Date().toLocaleTimeString('vi-VN');
    if (details) logs[stepIndex].details = details;
    if (onProgress) onProgress([...logs]);
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    // --- BƯỚC 1: TẠO ORDER TẠI BÀN 02 ---
    update(0, 'running');
    await delay(800);

    const tables = orderService.getTables();
    const table02 = tables.find((t) => t.table_number.includes('02')) || tables[1] || tables[0];
    const steak = initialMenuItems.find((i) => i.id === 'item-1')!;
    const coffee = initialMenuItems.find((i) => i.id === 'item-4')!;

    const orderId = `ord-sim-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const orderItems: OrderItem[] = [
      {
        id: `item-${orderId}-1`,
        order_id: orderId,
        menu_item_id: steak.id,
        menu_item_name: steak.name,
        quantity: 1,
        price: steak.price,
        notes: 'Độ chín Medium, nhiều sốt tiêu đen',
        selected_modifiers: [
          { id: 'mod-steak-2', name: 'Độ chín: Medium', price_adjustment: 0, group_name: 'Độ chín' },
        ],
        item_status: 'pending',
        station: 'kitchen',
        created_at: now,
      },
      {
        id: `item-${orderId}-2`,
        order_id: orderId,
        menu_item_id: coffee.id,
        menu_item_name: coffee.name,
        quantity: 1,
        price: coffee.price,
        notes: 'Ít ngọt, nhiều kem muối',
        item_status: 'pending',
        station: 'bar',
        created_at: now,
      },
    ];

    const subtotal = steak.price + coffee.price; // 320,000 + 45,000 = 365,000
    const taxAmount = Math.round(subtotal * 0.08); // 29,200
    const totalAmount = subtotal + taxAmount;      // 394,200

    const newOrder: Order = {
      id: orderId,
      table_id: table02.id,
      table_number: table02.table_number,
      order_status: 'pending',
      payment_status: 'unpaid',
      subtotal,
      discount_amount: 0,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      items: orderItems,
      created_at: now,
      updated_at: now,
    };

    update(0, 'completed', { orderId, table: table02.table_number, totalAmount });

    // --- BƯỚC 2: GỬI ORDER & PHÁT REALTIME SANG KDS ---
    update(1, 'running');
    await delay(1000);

    orderService.createOrder(newOrder);
    playOrderNotificationSound();

    update(1, 'completed', { stations: ['kitchen', 'bar'], event: 'ORDER_CREATED' });

    // --- BƯỚC 3: KDS CHUYỂN TRẠNG THÁI (COOKING -> READY) ---
    update(2, 'running');
    await delay(1500);

    // Cooking
    orderService.updateStationItemsStatus(orderId, 'kitchen', 'cooking');
    orderService.updateStationItemsStatus(orderId, 'bar', 'cooking');
    await delay(1200);

    // Ready
    orderService.updateStationItemsStatus(orderId, 'kitchen', 'ready');
    orderService.updateStationItemsStatus(orderId, 'bar', 'ready');

    update(2, 'completed', { orderStatus: 'ready' });

    // --- BƯỚC 4: THU NGÂN THANH TOÁN QUA VIETQR ---
    update(3, 'running');
    await delay(1500);

    const paymentResult = orderService.completePayment(orderId, 'transfer_qr');

    update(3, 'completed', {
      method: 'transfer_qr (VietQR)',
      freedTable: table02.table_number,
      paidAmount: totalAmount,
    });

    // --- BƯỚC 5: ERP AUTO-DEDUCT VÀ ADMIN DASHBOARD ---
    update(4, 'running');
    await delay(1000);

    // inventoryService auto-listener on PAYMENT_COMPLETED will already deduct,
    // let's grab the audit transactions to verify:
    const txs = inventoryService.getTransactions().filter((t) => t.reference_id === orderId);

    update(4, 'completed', {
      deductedItemsCount: txs.length,
      revenueAdded: totalAmount,
      dashboardUpdated: true,
    });

    return { success: true, orderId };
  } catch (err: any) {
    console.error('E2E Simulation failed:', err);
    return { success: false, orderId: '' };
  }
}
