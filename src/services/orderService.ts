import { Order, OrderItem, RestaurantTable, PaymentMethod, Zone, WorkShift } from '@/types';
import { initialTables, initialZones, initialOrders } from '@/database/mockData';
import { realtimeEngine } from './realtimeEngine';
import { supabase } from '@/lib/supabaseClient';

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
    this.syncFromSupabase();
  }

  private initStorage() {
    if (typeof window !== 'undefined') {
      const savedOrders = localStorage.getItem(STORAGE_ORDERS_KEY);
      if (savedOrders) {
        try {
          const parsed = JSON.parse(savedOrders);
          this.orders = parsed && parsed.length > 0 ? parsed : [...initialOrders];
        } catch {
          this.orders = [...initialOrders];
        }
      } else {
        this.orders = [...initialOrders];
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(this.orders));
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

  /**
   * Full 2-Way Sync with Supabase Cloud
   */
  public async syncFromSupabase(): Promise<void> {
    if (!supabase) return;

    try {
      // 1. Sync Zones
      const { data: zoneData, error: zoneErr } = await supabase
        .from('pos_zones')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!zoneErr && zoneData && zoneData.length > 0) {
        this.zones = zoneData.map((z: any) => ({
          id: z.id,
          name: z.name,
          description: z.description,
          sort_order: z.sort_order || 1,
        }));
      } else if (!zoneErr && (!zoneData || zoneData.length === 0)) {
        // Seed initial zones to Supabase
        await supabase.from('pos_zones').upsert(
          this.zones.map((z) => ({
            id: z.id,
            name: z.name,
            description: z.description,
            sort_order: z.sort_order,
          }))
        );
      }

      // 2. Sync Tables
      const { data: tableData, error: tableErr } = await supabase
        .from('pos_tables')
        .select('*');

      if (!tableErr && tableData && tableData.length > 0) {
        this.tables = tableData.map((t: any) => ({
          id: t.id,
          table_number: t.table_number,
          capacity: t.capacity || 4,
          status: t.status || 'available',
          zone_id: t.zone_id,
          current_order_id: t.current_order_id,
        }));
      } else if (!tableErr && (!tableData || tableData.length === 0)) {
        // Seed initial tables to Supabase
        await supabase.from('pos_tables').upsert(
          this.tables.map((t) => ({
            id: t.id,
            table_number: t.table_number,
            capacity: t.capacity,
            status: t.status,
            zone_id: t.zone_id,
            current_order_id: t.current_order_id,
          }))
        );
      }

      // 3. Sync Orders (recent active & completed)
      const { data: orderData, error: orderErr } = await supabase
        .from('pos_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!orderErr && orderData && orderData.length > 0) {
        this.orders = orderData.map((o: any) => ({
          id: o.id,
          table_id: o.table_id || 'tbl-default',
          table_number: o.table_number || 'Bàn',
          order_status: o.order_status,
          payment_status: o.payment_status,
          payment_method: o.payment_method,
          subtotal: Number(o.subtotal) || 0,
          discount_amount: Number(o.discount_amount) || 0,
          tax_amount: Number(o.tax_amount) || 0,
          total_amount: Number(o.total_amount) || 0,
          customer_id: o.customer_id,
          customer_name: o.customer_name,
          customer_phone: o.customer_phone,
          items: Array.isArray(o.items) ? o.items : [],
          notes: o.notes,
          created_at: o.created_at,
          updated_at: o.updated_at,
        }));
      }

      this.save();
      realtimeEngine.emit('TABLE_STATUS_CHANGED', {});
      realtimeEngine.emit('ORDER_UPDATED', { type: 'SUPABASE_SYNC_COMPLETED' });
    } catch (err) {
      console.warn('[OrderService] Error during Supabase cloud sync:', err);
    }
  }

  // Helper to upsert order to Supabase
  private async persistOrderToCloud(order: Order) {
    if (!supabase) return;
    try {
      await supabase.from('pos_orders').upsert({
        id: order.id,
        table_id: order.table_id,
        table_number: order.table_number,
        order_status: order.order_status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        subtotal: order.subtotal,
        discount_amount: order.discount_amount,
        tax_amount: order.tax_amount,
        total_amount: order.total_amount,
        customer_id: order.customer_id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        items: order.items,
        notes: order.notes,
        created_at: order.created_at,
        updated_at: order.updated_at || new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[OrderService] Cloud order upsert error:', e);
    }
  }

  // Helper to upsert table to Supabase
  private async persistTableToCloud(table: RestaurantTable) {
    if (!supabase || table.id === 'takeaway') return;
    try {
      await supabase.from('pos_tables').upsert({
        id: table.id,
        table_number: table.table_number,
        capacity: table.capacity,
        status: table.status,
        zone_id: table.zone_id,
        current_order_id: table.current_order_id,
      });
    } catch (e) {
      console.warn('[OrderService] Cloud table upsert error:', e);
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

    if (supabase) {
      supabase.from('pos_zones').upsert({
        id: newZone.id,
        name: newZone.name,
        description: newZone.description,
        sort_order: newZone.sort_order,
      }).then();
    }

    return newZone;
  }

  public updateZone(id: string, updates: Partial<Zone>): Zone | null {
    const idx = this.zones.findIndex((z) => z.id === id);
    if (idx === -1) return null;
    this.zones[idx] = { ...this.zones[idx], ...updates };
    this.save();

    if (supabase) {
      supabase.from('pos_zones').update({
        name: this.zones[idx].name,
        description: this.zones[idx].description,
        sort_order: this.zones[idx].sort_order,
      }).eq('id', id).then();
    }

    return this.zones[idx];
  }

  public deleteZone(id: string): boolean {
    const idx = this.zones.findIndex((z) => z.id === id);
    if (idx === -1) return false;
    this.zones.splice(idx, 1);
    this.tables.forEach((t) => {
      if (t.zone_id === id) t.zone_id = undefined;
    });
    this.save();

    if (supabase) {
      supabase.from('pos_zones').delete().eq('id', id).then();
    }

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
    this.persistTableToCloud(newTable);
    realtimeEngine.emit('TABLE_STATUS_CHANGED', newTable);
    return newTable;
  }

  public updateTable(id: string, updates: Partial<RestaurantTable>): RestaurantTable | null {
    const idx = this.tables.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.tables[idx] = { ...this.tables[idx], ...updates };
    this.save();
    this.persistTableToCloud(this.tables[idx]);
    realtimeEngine.emit('TABLE_STATUS_CHANGED', this.tables[idx]);
    return this.tables[idx];
  }

  public deleteTable(id: string): boolean {
    const idx = this.tables.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.tables.splice(idx, 1);
    this.save();

    if (supabase) {
      supabase.from('pos_tables').delete().eq('id', id).then();
    }

    return true;
  }

  public updateTableStatus(tableId: string, status: RestaurantTable['status']): RestaurantTable | null {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return null;
    table.status = status;
    this.save();
    this.persistTableToCloud(table);
    realtimeEngine.emit('TABLE_STATUS_CHANGED', table);
    return table;
  }

  // ==================== ORDERS & OPERATIONS ====================
  public getOrders(): Order[] {
    return [...this.orders];
  }

  public getOrderById(id: string): Order | null {
    return this.orders.find((o) => o.id === id) || null;
  }

  public cancelOrder(orderId: string, reason?: string): Order | null {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;
    order.order_status = 'cancelled';
    if (reason) {
      order.notes = [order.notes, `[Lý do hủy: ${reason}]`].filter(Boolean).join(' - ');
    }
    const now = new Date().toISOString();
    order.updated_at = now;

    // Set all items inside to cancelled
    if (Array.isArray(order.items)) {
      order.items.forEach((item) => {
        item.item_status = 'cancelled';
        item.updated_at = now;
      });
    }
    
    // Free table if this was the current order
    const table = this.tables.find((t) => t.id === order.table_id);
    if (table && table.current_order_id === orderId) {
      table.status = 'available';
      table.current_order_id = undefined;
      this.persistTableToCloud(table);
      realtimeEngine.emit('TABLE_STATUS_CHANGED', table);
    }
    
    this.save();
    this.persistOrderToCloud(order);
    realtimeEngine.emit('ORDER_STATUS_CHANGED', order);
    realtimeEngine.emit('ORDER_UPDATED', order);
    return order;
  }

  public getTakeawayOrders(): Order[] {
    return this.orders.filter(
      (o) =>
        (o.table_id === 'takeaway' || o.table_id?.startsWith('takeaway')) &&
        o.payment_status === 'unpaid' &&
        o.order_status !== 'cancelled'
    );
  }

  public generateNextTakeawayLabel(): { tableId: string; tableNumber: string } {
    const today = new Date().toISOString().split('T')[0];
    const todayTakeaways = this.orders.filter(
      (o) =>
        (o.table_id === 'takeaway' || o.table_id?.startsWith('takeaway') || o.order_channel === 'takeaway') &&
        o.created_at?.startsWith(today)
    );
    const count = todayTakeaways.length + 1;
    const formattedNum = count.toString().padStart(2, '0');
    const tableId = `takeaway-${Date.now().toString().slice(-4)}-${count}`;
    const tableNumber = `Mang Về #${formattedNum}`;
    return { tableId, tableNumber };
  }

  public generateNextDeliveryLabel(platform: 'grabfood' | 'shopeefood' | 'befood'): {
    tableId: string;
    tableNumber: string;
    platformName: string;
  } {
    const today = new Date().toISOString().split('T')[0];
    const todayDeliveries = this.orders.filter(
      (o) =>
        (o.table_id?.startsWith('delivery') || o.order_channel === 'delivery') &&
        o.created_at?.startsWith(today)
    );
    const count = todayDeliveries.length + 1;
    const formattedNum = count.toString().padStart(2, '0');
    const platformLabel = platform === 'grabfood' ? 'GrabFood' : platform === 'shopeefood' ? 'ShopeeFood' : 'BeFood';
    const tableId = `delivery-${platform}-${Date.now().toString().slice(-4)}-${count}`;
    const tableNumber = `${platformLabel} #${formattedNum}`;
    return { tableId, tableNumber, platformName: platformLabel };
  }

  public getActiveTakeawayAndDeliveryOrders(): Order[] {
    return this.orders.filter(
      (o) =>
        (o.order_channel === 'takeaway' ||
          o.order_channel === 'delivery' ||
          o.table_id === 'takeaway' ||
          o.table_id?.startsWith('takeaway') ||
          o.table_id?.startsWith('delivery') ||
          (o.table_number && (
            o.table_number.toLowerCase().includes('mang về') ||
            o.table_number.toLowerCase().includes('giao') ||
            o.table_number.toLowerCase().includes('grab') ||
            o.table_number.toLowerCase().includes('shopee') ||
            o.table_number.toLowerCase().includes('be')
          ))) &&
        o.order_status !== 'completed' &&
        o.order_status !== 'cancelled'
    );
  }

  public appendItemsToOrder(orderId: string, newItems: OrderItem[]): Order | null {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;

    if (!Array.isArray(order.items)) {
      order.items = [];
    }

    const now = new Date().toISOString();
    const formattedNewItems: OrderItem[] = newItems.map((item, index) => ({
      ...item,
      id: item.id || `item-addon-${Date.now()}-${index + 1}`,
      order_id: order.id,
      item_status: item.item_status || 'pending',
      created_at: item.created_at || now,
    }));

    order.items = [...order.items, ...formattedNewItems];

    // Recalculate financial totals
    const subtotal = order.items.reduce((sum, item) => {
      if (item.item_status === 'cancelled') return sum;
      return sum + item.price * item.quantity;
    }, 0);

    const discountAmount = Math.min(order.discount_amount || 0, subtotal);
    const taxAmount = Math.round(Math.max(0, subtotal - discountAmount) * 0.08);
    const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

    order.subtotal = subtotal;
    order.discount_amount = discountAmount;
    order.tax_amount = taxAmount;
    order.total_amount = totalAmount;

    // Reset status to cooking if it was ready/completed
    if (order.order_status === 'completed' || order.order_status === 'ready') {
      order.order_status = 'cooking';
    }

    order.updated_at = now;

    this.save();
    this.persistOrderToCloud(order);

    // Emit events for realtime KDS and UI
    realtimeEngine.emit('ORDER_UPDATED', order);
    formattedNewItems.forEach((item) => {
      realtimeEngine.emit('ITEM_STATUS_CHANGED', { orderId: order.id, item });
    });

    return order;
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

    // Update physical table status to occupied (ignore takeaway & delivery)
    const isVirtual =
      newOrder.order_channel === 'takeaway' ||
      newOrder.order_channel === 'delivery' ||
      newOrder.table_id === 'takeaway' ||
      newOrder.table_id?.startsWith('takeaway') ||
      newOrder.table_id?.startsWith('delivery');
    if (newOrder.table_id && !isVirtual) {
      const tableIndex = this.tables.findIndex((t) => t.id === newOrder.table_id);
      if (tableIndex !== -1) {
        this.tables[tableIndex].status = 'occupied';
        this.tables[tableIndex].current_order_id = newOrder.id;
        this.persistTableToCloud(this.tables[tableIndex]);
        realtimeEngine.emit('TABLE_STATUS_CHANGED', this.tables[tableIndex]);
      }
    }

    this.save();
    this.persistOrderToCloud(newOrder);
    realtimeEngine.emit('ORDER_CREATED', newOrder);
    return newOrder;
  }

  public attachCustomerToOrder(
    orderId: string,
    customer: { id: string; name: string; phone: string }
  ): Order | null {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;
    order.customer_id = customer.id;
    order.customer_name = customer.name;
    order.customer_phone = customer.phone;
    order.updated_at = new Date().toISOString();
    this.save();
    this.persistOrderToCloud(order);
    realtimeEngine.emit('ORDER_UPDATED', order);
    return order;
  }

  public updateItemStatus(
    orderId: string,
    itemId: string,
    newStatus: OrderItem['item_status']
  ): Order | null {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;
    if (!Array.isArray(order.items)) {
      order.items = [];
    }

    const item = order.items.find((i) => i.id === itemId);
    if (!item) return null;

    item.item_status = newStatus;
    item.updated_at = new Date().toISOString();

    const allCancelled = order.items.every((i) => i.item_status === 'cancelled');
    const allCompleted = order.items.every(
      (i) => i.item_status === 'served' || i.item_status === 'cancelled'
    );
    const anyCooking = order.items.some((i) => i.item_status === 'cooking');
    const anyReady = order.items.some((i) => i.item_status === 'ready');

    if (allCancelled) {
      order.order_status = 'cancelled';
    } else if (allCompleted) {
      order.order_status = 'completed';
    } else if (anyReady) {
      order.order_status = 'ready';
    } else if (anyCooking) {
      order.order_status = 'cooking';
    }

    order.updated_at = new Date().toISOString();
    this.save();
    this.persistOrderToCloud(order);

    realtimeEngine.emit('ITEM_STATUS_CHANGED', { orderId, item });
    realtimeEngine.emit('ORDER_STATUS_CHANGED', order);
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
    if (!Array.isArray(order.items)) {
      order.items = [];
    }

    order.items
      .filter((i) => i && i.station === station)
      .forEach((item) => {
        item.item_status = newStatus;
        item.updated_at = new Date().toISOString();
        realtimeEngine.emit('ITEM_STATUS_CHANGED', { orderId, item });
      });

    const hasCooking = order.items.some((i) => i && i.item_status === 'cooking');
    const allReady = order.items.every(
      (i) => i && (i.item_status === 'ready' || i.item_status === 'served' || i.item_status === 'cancelled')
    );

    if (allReady) {
      order.order_status = 'ready';
    } else if (hasCooking) {
      order.order_status = 'cooking';
    }

    order.updated_at = new Date().toISOString();
    this.save();
    this.persistOrderToCloud(order);
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
        this.persistTableToCloud(table);
        realtimeEngine.emit('TABLE_STATUS_CHANGED', table);
      }
    }

    this.save();
    this.persistOrderToCloud(order);
    realtimeEngine.emit('ORDER_STATUS_CHANGED', order);
    realtimeEngine.emit('ORDER_UPDATED', order);
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
    order.order_status = 'completed';
    order.discount_amount = discountAmount;
    order.total_amount = Math.max(0, order.subtotal + order.tax_amount - discountAmount);
    order.updated_at = new Date().toISOString();

    let table: RestaurantTable;
    const tableIndex = this.tables.findIndex((t) => t.id === order.table_id);
    if (tableIndex !== -1) {
      this.tables[tableIndex].status = 'available';
      this.tables[tableIndex].current_order_id = undefined;
      table = this.tables[tableIndex];
      this.persistTableToCloud(table);
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
    this.persistOrderToCloud(order);

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
    this.persistTableToCloud(fromTable);
    this.persistTableToCloud(toTable);
    this.persistOrderToCloud(currentOrder);

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
    this.persistTableToCloud(sourceTable);
    this.persistTableToCloud(targetTable);
    this.persistOrderToCloud(sourceOrder);
    this.persistOrderToCloud(targetOrder);

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

  /**
   * FACTORY RESET ORDERS & TRANSACTIONS
   * Wipes all test orders, shifts, and resets tables to available.
   * Keeps menu items, BOM, raw materials, zones, tables and users intact!
   */
  public async factoryResetOrders(): Promise<void> {
    this.orders = [];
    this.shiftsHistory = [];
    this.currentShift = null;

    // Reset all tables to available
    this.tables.forEach((t) => {
      t.status = 'available';
      t.current_order_id = undefined;
    });

    this.save();

    // Wipe orders and reset tables on Supabase Cloud
    if (supabase) {
      try {
        await supabase.from('pos_orders').delete().neq('id', '___non_existent___');
        await supabase.from('pos_tables').upsert(
          this.tables.map((t) => ({
            id: t.id,
            table_number: t.table_number,
            capacity: t.capacity,
            status: 'available',
            zone_id: t.zone_id,
            current_order_id: null,
          }))
        );
      } catch (e) {
        console.warn('[OrderService] Cloud factory reset error:', e);
      }
    }

    realtimeEngine.emit('TABLE_STATUS_CHANGED', {});
    realtimeEngine.emit('ORDER_UPDATED', { type: 'FACTORY_RESET_COMPLETED' });
    realtimeEngine.emit('PAYMENT_COMPLETED', { order: null, table: null });
  }
}

export const orderService = new OrderService();
