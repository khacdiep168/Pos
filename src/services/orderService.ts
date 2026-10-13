import { Order, OrderItem, RestaurantTable, PaymentMethod } from '@/types';
import { initialTables } from '@/database/mockData';
import { realtimeEngine } from './realtimeEngine';

const STORAGE_ORDERS_KEY = 'pos_orders_data';
const STORAGE_TABLES_KEY = 'pos_tables_data';

class OrderService {
  private orders: Order[] = [];
  private tables: RestaurantTable[] = [];

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
    } else {
      this.tables = [...initialTables];
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(this.orders));
      localStorage.setItem(STORAGE_TABLES_KEY, JSON.stringify(this.tables));
    }
  }

  public getOrders(): Order[] {
    return [...this.orders];
  }

  public getTables(): RestaurantTable[] {
    return [...this.tables];
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

    // Emit Realtime event
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

    // Check if all items are ready
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
      // Free the table
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

    // Free the table
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

    this.save();

    // Emit Real-time Events
    realtimeEngine.emit('PAYMENT_COMPLETED', { order, table });
    realtimeEngine.emit('TABLE_STATUS_CHANGED', table);
    realtimeEngine.emit('ORDER_STATUS_CHANGED', order);
    realtimeEngine.emit('ORDER_UPDATED', order);

    return { order, table };
  }

  public updateTableStatus(tableId: string, status: RestaurantTable['status']): RestaurantTable | null {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return null;
    table.status = status;
    this.save();
    realtimeEngine.emit('TABLE_STATUS_CHANGED', table);
    return table;
  }

  public getOrderByTableId(tableId: string): Order | null {
    return (
      this.orders.find(
        (o) => o.table_id === tableId && o.payment_status === 'unpaid' && o.order_status !== 'cancelled'
      ) || null
    );
  }
}

export const orderService = new OrderService();
