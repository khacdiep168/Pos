import { Order, OrderItem, RestaurantTable, PaymentMethod, Zone, WorkShift } from '@/types';
import { initialTables, initialZones } from '@/database/mockData';
import { realtimeEngine } from './realtimeEngine';

const STORAGE_ORDERS_KEY = 'pos_orders_data';
const STORAGE_TABLES_KEY = 'pos_tables_data';
const STORAGE_ZONES_KEY = 'pos_zones_data';
const STORAGE_SHIFTS_KEY = 'pos_shifts_history';
const STORAGE_CURRENT_SHIFT_KEY = 'pos_current_shift';

class OrderService {
  private orders: Order[] = [];
  private tables: RestaurantTable[] = [];
  private zones: Zone[] = [];
  private currentShift: WorkShift | null = null;
  private shiftsHistory: WorkShift[] = [];

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    if (typeof window !== 'undefined') {
      const savedOrders = localStorage.getItem(STORAGE_ORDERS_KEY);
      if (savedOrders) {
        try {
          this.orders = JSON.parse(savedOrders);
        } catch {
          this.orders = [];
        }
      }

      const savedZones = localStorage.getItem(STORAGE_ZONES_KEY);
      if (savedZones) {
        try {
          this.zones = JSON.parse(savedZones);
        } catch {
          this.zones = [...initialZones];
        }
      } else {
        this.zones = [...initialZones];
        localStorage.setItem(STORAGE_ZONES_KEY, JSON.stringify(this.zones));
      }

      const savedTables = localStorage.getItem(STORAGE_TABLES_KEY);
      if (savedTables) {
        try {
          this.tables = JSON.parse(savedTables);
        } catch {
          this.tables = [...initialTables];
        }
      } else {
        this.tables = [...initialTables];
        localStorage.setItem(STORAGE_TABLES_KEY, JSON.stringify(this.tables));
      }

      const savedCurrentShift = localStorage.getItem(STORAGE_CURRENT_SHIFT_KEY);
      if (savedCurrentShift) {
        try {
          this.currentShift = JSON.parse(savedCurrentShift);
        } catch {
          this.currentShift = null;
        }
      }

      const savedShiftsHistory = localStorage.getItem(STORAGE_SHIFTS_KEY);
      if (savedShiftsHistory) {
        try {
          this.shiftsHistory = JSON.parse(savedShiftsHistory);
        } catch {
          this.shiftsHistory = [];
        }
      }
    } else {
      this.tables = [...initialTables];
      this.zones = [...initialZones];
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(this.orders));
      localStorage.setItem(STORAGE_TABLES_KEY, JSON.stringify(this.tables));
      localStorage.setItem(STORAGE_ZONES_KEY, JSON.stringify(this.zones));
      if (this.currentShift) {
        localStorage.setItem(STORAGE_CURRENT_SHIFT_KEY, JSON.stringify(this.currentShift));
      } else {
        localStorage.removeItem(STORAGE_CURRENT_SHIFT_KEY);
      }
      localStorage.setItem(STORAGE_SHIFTS_KEY, JSON.stringify(this.shiftsHistory));
    }
  }

  // ==================== ZONES MANAGEMENT ====================
  public getZones(): Zone[] {
    return [...this.zones];
  }

  public addZone(zone: Omit<Zone, 'id'>): Zone {
    const newZone: Zone = {
      ...zone,
      id: `zone-${Date.now().toString().slice(-6)}`,
    };
    this.zones.push(newZone);
    this.save();
    return newZone;
  }

  public updateZone(id: string, updates: Partial<Zone>): Zone | null {
    const idx = this.zones.findIndex((z) => z.id === id);
    if (idx === -1) return null;
    this.zones[idx] = { ...this.zones[idx], ...updates };
    this.save();
    return this.zones[idx];
  }

  public deleteZone(id: string): boolean {
    const idx = this.zones.findIndex((z) => z.id === id);
    if (idx === -1) return false;
    this.zones.splice(idx, 1);
    // Unassign zone from tables
    this.tables.forEach((t) => {
      if (t.zone_id === id) t.zone_id = undefined;
    });
    this.save();
    return true;
  }

  // ==================== TABLES MANAGEMENT ====================
  public getTables(): RestaurantTable[] {
    return [...this.tables];
  }

  public addTable(table: Omit<RestaurantTable, 'id' | 'status'>): RestaurantTable {
    const newTable: RestaurantTable = {
      ...table,
      id: `tbl-${Date.now().toString().slice(-6)}`,
      status: 'available',
    };
    this.tables.push(newTable);
    this.save();
    realtimeEngine.emit('TABLE_STATUS_CHANGED', newTable);
    return newTable;
  }

  public updateTable(id: string, updates: Partial<RestaurantTable>): RestaurantTable | null {
    const idx = this.tables.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.tables[idx] = { ...this.tables[idx], ...updates };
    this.save();
    realtimeEngine.emit('TABLE_STATUS_CHANGED', this.tables[idx]);
    return this.tables[idx];
  }

  public deleteTable(id: string): boolean {
    const idx = this.tables.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.tables.splice(idx, 1);
    this.save();
    return true;
  }

  public updateTableStatus(tableId: string, status: RestaurantTable['status']): RestaurantTable | null {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return null;
    table.status = status;
    this.save();
    realtimeEngine.emit('TABLE_STATUS_CHANGED', table);
    return table;
  }

  // ==================== ORDERS & OPERATIONS ====================
  public getOrders(): Order[] {
    return [...this.orders];
  }

  public getOrderByTableId(tableId: string): Order | null {
    return (
      this.orders.find(
        (o) => o.table_id === tableId && o.payment_status === 'unpaid' && o.order_status !== 'cancelled'
      ) || null
    );
  }

  public createOrder(newOrder: Order): Order {
    this.orders.unshift(newOrder);

    // Update table status to occupied
    const tableIndex = this.tables.findIndex((t) => t.id === newOrder.table_id);
    if (tableIndex !== -1) {
      this.tables[tableIndex].status = 'occupied';
      this.tables[tableIndex].current_order_id = newOrder.id;
      realtimeEngine.emit('TABLE_STATUS_CHANGED', this.tables[tableIndex]);
    }

    this.save();
    realtimeEngine.emit('ORDER_CREATED', newOrder);
    return newOrder;
  }

  public updateItemStatus(
    orderId: string,
    itemId: string,
    newStatus: OrderItem['item_status']
  ): Order | null {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;

    const item = order.items.find((i) => i.id === itemId);
    if (!item) return null;

    item.item_status = newStatus;
    item.updated_at = new Date().toISOString();

    const allReady = order.items.every(
      (i) => i.item_status === 'ready' || i.item_status === 'served' || i.item_status === 'cancelled'
    );
    if (allReady && order.order_status === 'cooking') {
      order.order_status = 'ready';
      realtimeEngine.emit('ORDER_STATUS_CHANGED', order);
    }

    this.save();
    realtimeEngine.emit('ITEM_STATUS_CHANGED', { orderId, item });
    realtimeEngine.emit('ORDER_UPDATED', order);
    return order;
  }

  public updateStationItemsStatus(
    orderId: string,
    station: 'kitchen' | 'bar',
    newStatus: OrderItem['item_status']
  ): Order | null {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;

    order.items
      .filter((i) => i.station === station)
      .forEach((item) => {
        item.item_status = newStatus;
        item.updated_at = new Date().toISOString();
      });

    const hasCooking = order.items.some((i) => i.item_status === 'cooking');
    const allReady = order.items.every(
      (i) => i.item_status === 'ready' || i.item_status === 'served' || i.item_status === 'cancelled'
    );

    if (allReady) {
      order.order_status = 'ready';
    } else if (hasCooking) {
      order.order_status = 'cooking';
    }

    order.updated_at = new Date().toISOString();
    this.save();
    realtimeEngine.emit('ORDER_UPDATED', order);
    realtimeEngine.emit('ORDER_STATUS_CHANGED', order);
    return order;
  }

  public updateOrderStatus(orderId: string, newStatus: Order['order_status']): Order | null {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;

    order.order_status = newStatus;
    order.updated_at = new Date().toISOString();

    if (newStatus === 'completed') {
      const table = this.tables.find((t) => t.id === order.table_id);
      if (table) {
        table.status = 'available';
        table.current_order_id = undefined;
        realtimeEngine.emit('TABLE_STATUS_CHANGED', table);
      }
    }

    this.save();
    realtimeEngine.emit('ORDER_STATUS_CHANGED', order);
    return order;
  }

  public completePayment(
    orderId: string,
    paymentMethod: PaymentMethod,
    discountAmount: number = 0
  ): { order: Order; table: RestaurantTable } | null {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;

    order.payment_status = 'paid';
    order.payment_method = paymentMethod;
    order.discount_amount = discountAmount;
    order.total_amount = Math.max(0, order.subtotal + order.tax_amount - discountAmount);
    order.order_status = 'completed';
    order.updated_at = new Date().toISOString();

    const tableIndex = this.tables.findIndex((t) => t.id === order.table_id);
    let table: RestaurantTable;
    if (tableIndex !== -1) {
      this.tables[tableIndex].status = 'available';
      this.tables[tableIndex].current_order_id = undefined;
      table = this.tables[tableIndex];
    } else {
      table = {
        id: order.table_id,
        table_number: order.table_number,
        capacity: 4,
        status: 'available',
      };
    }

    // Update active shift stats if open
    if (this.currentShift && this.currentShift.status === 'open') {
      this.currentShift.total_orders_count += 1;
      if (paymentMethod === 'cash') {
        this.currentShift.total_cash_sales += order.total_amount;
      } else if (paymentMethod === 'transfer_qr') {
        this.currentShift.total_qr_sales += order.total_amount;
      } else if (paymentMethod === 'card') {
        this.currentShift.total_card_sales += order.total_amount;
      }
    }

    this.save();

    realtimeEngine.emit('PAYMENT_COMPLETED', { order, table });
    realtimeEngine.emit('TABLE_STATUS_CHANGED', table);
    realtimeEngine.emit('ORDER_STATUS_CHANGED', order);
    realtimeEngine.emit('ORDER_UPDATED', order);

    return { order, table };
  }

  // ==================== MOVE & MERGE TABLE (CHUYỂN & GỘP BÀN) ====================
  public moveTable(
    fromTableId: string,
    toTableId: string
  ): { success: boolean; message: string; fromTable?: RestaurantTable; toTable?: RestaurantTable } {
    if (fromTableId === toTableId) {
      return { success: false, message: 'Bàn chuyển đến phải khác bàn hiện tại!' };
    }

    const fromTable = this.tables.find((t) => t.id === fromTableId);
    const toTable = this.tables.find((t) => t.id === toTableId);

    if (!fromTable || !toTable) {
      return { success: false, message: 'Không tìm thấy bàn yêu cầu!' };
    }

    if (toTable.status !== 'available') {
      return {
        success: false,
        message: `${toTable.table_number} hiện không trống (đang ${toTable.status}). Vui lòng chọn tính năng Gộp Bàn nếu muốn gộp chung!`,
      };
    }

    const currentOrder = this.getOrderByTableId(fromTableId);
    if (!currentOrder) {
      return { success: false, message: `${fromTable.table_number} chưa có order nào để chuyển!` };
    }

    // Transfer order to new table
    currentOrder.table_id = toTable.id;
    currentOrder.table_number = toTable.table_number;
    currentOrder.updated_at = new Date().toISOString();

    // Update tables
    fromTable.status = 'available';
    fromTable.current_order_id = undefined;

    toTable.status = 'occupied';
    toTable.current_order_id = currentOrder.id;

    this.save();

    // Realtime notification
    realtimeEngine.emit('TABLE_STATUS_CHANGED', fromTable);
    realtimeEngine.emit('TABLE_STATUS_CHANGED', toTable);
    realtimeEngine.emit('ORDER_UPDATED', currentOrder);

    return {
      success: true,
      message: `Đã chuyển toàn bộ order từ ${fromTable.table_number} sang ${toTable.table_number} thành công!`,
      fromTable,
      toTable,
    };
  }

  public mergeTable(
    sourceTableId: string,
    targetTableId: string
  ): { success: boolean; message: string; sourceTable?: RestaurantTable; targetTable?: RestaurantTable } {
    if (sourceTableId === targetTableId) {
      return { success: false, message: 'Bàn gộp phải khác nhau!' };
    }

    const sourceTable = this.tables.find((t) => t.id === sourceTableId);
    const targetTable = this.tables.find((t) => t.id === targetTableId);

    if (!sourceTable || !targetTable) {
      return { success: false, message: 'Không tìm thấy thông tin bàn!' };
    }

    const sourceOrder = this.getOrderByTableId(sourceTableId);
    const targetOrder = this.getOrderByTableId(targetTableId);

    if (!sourceOrder) {
      return { success: false, message: `${sourceTable.table_number} không có đơn hàng để gộp!` };
    }

    if (!targetOrder) {
      // Target table doesn't have an order yet -> Just move
      return this.moveTable(sourceTableId, targetTableId);
    }

    // Merge items into targetOrder
    targetOrder.items = [...targetOrder.items, ...sourceOrder.items];
    targetOrder.subtotal = targetOrder.items.reduce((s, it) => s + it.price * it.quantity, 0);
    targetOrder.tax_amount = Math.round(targetOrder.subtotal * 0.08);
    targetOrder.total_amount = targetOrder.subtotal + targetOrder.tax_amount - targetOrder.discount_amount;
    targetOrder.notes = [
      targetOrder.notes,
      `[Gộp từ ${sourceTable.table_number} #${sourceOrder.id.slice(-6)}]`,
    ]
      .filter(Boolean)
      .join(' - ');
    targetOrder.updated_at = new Date().toISOString();

    // Close source order
    sourceOrder.order_status = 'cancelled';
    sourceOrder.notes = `Đã gộp vào đơn #${targetOrder.id} (${targetTable.table_number})`;
    sourceOrder.updated_at = new Date().toISOString();

    // Release source table
    sourceTable.status = 'available';
    sourceTable.current_order_id = undefined;

    this.save();

    realtimeEngine.emit('TABLE_STATUS_CHANGED', sourceTable);
    realtimeEngine.emit('TABLE_STATUS_CHANGED', targetTable);
    realtimeEngine.emit('ORDER_UPDATED', targetOrder);
    realtimeEngine.emit('ORDER_UPDATED', sourceOrder);

    return {
      success: true,
      message: `Đã gộp thành công đơn từ ${sourceTable.table_number} vào ${targetTable.table_number}!`,
      sourceTable,
      targetTable,
    };
  }

  // ==================== SHIFT MANAGEMENT (QUẢN LÝ CA) ====================
  public getCurrentShift(): WorkShift | null {
    return this.currentShift;
  }

  public openShift(cashierId: string, cashierName: string, initialCash: number): WorkShift {
    const newShift: WorkShift = {
      id: `shift-${Date.now().toString().slice(-6)}`,
      cashier_id: cashierId,
      cashier_name: cashierName,
      start_time: new Date().toISOString(),
      initial_cash: initialCash,
      total_cash_sales: 0,
      total_qr_sales: 0,
      total_card_sales: 0,
      total_orders_count: 0,
      status: 'open',
    };
    this.currentShift = newShift;
    this.save();
    return newShift;
  }

  public closeShift(actualCashEnd: number, notes?: string): WorkShift | null {
    if (!this.currentShift) return null;

    const expectedCash = this.currentShift.initial_cash + this.currentShift.total_cash_sales;
    const difference = actualCashEnd - expectedCash;

    this.currentShift.end_time = new Date().toISOString();
    this.currentShift.actual_cash_end = actualCashEnd;
    this.currentShift.difference_cash = difference;
    this.currentShift.status = 'closed';
    this.currentShift.notes = notes;

    const finishedShift = { ...this.currentShift };
    this.shiftsHistory.unshift(finishedShift);
    this.currentShift = null;
    this.save();
    return finishedShift;
  }

  public getShiftHistory(): WorkShift[] {
    return [...this.shiftsHistory];
  }
}

export const orderService = new OrderService();
