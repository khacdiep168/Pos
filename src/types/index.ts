// Core Domain Types for Smart Restaurant POS & Real-Time Order System
// Derived from CLAUDE.md architecture

export type StationType = 'kitchen' | 'bar';

export type TableStatus = 'available' | 'occupied' | 'billing' | 'reserved';

export interface Zone {
  id: string;
  name: string; // Tầng 1, Tầng 2, Sân vườn, Phòng VIP...
  description?: string;
  sort_order: number;
}

export interface RestaurantTable {
  id: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
  zone_id?: string;
  current_order_id?: string;
}

export type CategoryType = 'food' | 'drink' | 'dessert' | 'other';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string;
  sort_order: number;
}

export interface MenuItemModifier {
  id: string;
  name: string;
  price_adjustment: number;
  group_name: string; // e.g. "Topping", "Size", "Mức đường", "Mức đá"
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  price: number;
  image_url: string;
  station: StationType; // 'kitchen' or 'bar' for real-time routing
  is_available: boolean;
  description?: string;
  modifiers?: MenuItemModifier[];
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  selected_modifiers: MenuItemModifier[];
  unit_price: number;
  total_price: number;
  notes: string;
}

export type OrderStatus = 'pending' | 'cooking' | 'ready' | 'completed' | 'cancelled';
export type ItemStatus = 'pending' | 'cooking' | 'ready' | 'served' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'transfer_qr' | 'e_wallet' | 'card';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  price: number;
  notes?: string;
  selected_modifiers?: MenuItemModifier[];
  item_status: ItemStatus;
  station: StationType;
  created_at: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  table_id: string;
  table_number: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// ERP & Inventory
export interface RawMaterial {
  id: string;
  name: string;
  supplier_id?: string;
  category?: string;
  purchase_unit: string; // kg, lít, hộp
  recipe_unit: string; // gram, ml, cái
  conversion_factor: number; // 1 purchase_unit = X recipe_units
  current_stock: number;
  min_stock_level: number;
  avg_cost: number;
}

export interface RecipeBOM {
  id: string;
  menu_item_id: string;
  raw_material_id: string;
  quantity: number; // in recipe_unit
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  total_debt?: number;
}

export interface PurchaseOrderItem {
  raw_material_id: string;
  raw_material_name: string;
  quantity: number; // in purchase_unit
  unit_price: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  supplier_name: string;
  total_amount: number;
  status: 'pending' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  created_at: string;
}

export interface InventoryTransaction {
  id: string;
  raw_material_id: string;
  raw_material_name?: string;
  type: 'in' | 'out' | 'waste' | 'adjustment';
  quantity_changed: number;
  unit: string;
  reference_type: 'order' | 'purchase_order' | 'audit' | 'manual';
  reference_id: string;
  created_at: string;
  created_by?: string;
}

// Admin & Settings
export type UserRole = 'admin' | 'manager' | 'cashier' | 'kitchen' | 'bar' | 'waiter';

export interface UserAccount {
  id: string;
  full_name: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  last_login?: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  logo_url: string;
  address: string;
  phone: string;
  business_hours: string;
  tax_rate: number; // e.g. 0.08 for 8%
  wifi_password?: string;
}

export interface Promotion {
  id: string;
  name: string;
  promo_code: string;
  discount_type: 'percent' | 'fixed_amount';
  discount_value: number;
  min_order_value: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

// Inventory Stock Reconciliation (Kiểm Kê Định Kỳ)
export interface StockAuditItem {
  raw_material_id: string;
  raw_material_name: string;
  recipe_unit: string;
  system_stock: number;
  actual_stock: number;
  difference: number; // actual_stock - system_stock
  unit_cost: number;
  difference_value: number; // difference * unit_cost
  note?: string;
}

export interface StockAuditReport {
  id: string;
  audit_date: string;
  performed_by: string;
  items: StockAuditItem[];
  total_difference_value: number;
  status: 'completed';
  notes?: string;
}

// Cashier Shift Management (Quản Lý Ca Làm Việc)
export interface WorkShift {
  id: string;
  cashier_id: string;
  cashier_name: string;
  start_time: string;
  end_time?: string;
  initial_cash: number; // Tiền mặt ban đầu
  actual_cash_end?: number; // Tiền mặt đếm thực tế
  total_cash_sales: number; // Doanh thu tiền mặt
  total_qr_sales: number; // Doanh thu VietQR
  total_card_sales: number; // Doanh thu quẹt thẻ
  total_orders_count: number;
  difference_cash?: number; // Chênh lệch thừa / thiếu
  status: 'open' | 'closed';
  notes?: string;
}

