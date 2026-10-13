// Core Domain Types for Smart Restaurant POS & Real-Time Order System
// Derived from CLAUDE.md architecture

export type StationType = 'kitchen' | 'bar';

export type TableStatus = 'available' | 'occupied' | 'billing' | 'reserved';

export interface RestaurantTable {
  id: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
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
  supplier_id: string;
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

export interface InventoryTransaction {
  id: string;
  raw_material_id: string;
  type: 'in' | 'out' | 'waste' | 'adjustment';
  quantity_changed: number;
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
