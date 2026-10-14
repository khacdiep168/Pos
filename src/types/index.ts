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
  order_channel?: OrderChannel;
  delivery_platform?: DeliveryPlatform;
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
  price: number; // Giá Tại Bàn (Dine-in) mặc định
  takeaway_price?: number; // Giá bán Mang về
  delivery_price?: number; // Giá bán trên App GrabFood/ShopeeFood
  packaging_cost?: number; // Chi phí bao bì/ly nhựa/túi mang đi ước tính
  app_commission_rate?: number; // % chiết khấu sàn giao đồ ăn, mặc định 25
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
export type PaymentMethod = 'cash' | 'transfer_qr' | 'e_wallet' | 'card' | 'vietqr';
export type OrderChannel = 'dine_in' | 'takeaway' | 'delivery';
export type DeliveryPlatform = 'grabfood' | 'shopeefood' | 'befood';

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
  order_channel?: OrderChannel;
  delivery_platform?: DeliveryPlatform;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// CRM & Customers
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  membership_tier?: 'bronze' | 'silver' | 'gold' | 'diamond';
  total_spent: number;
  points: number;
  created_at: string;
  notes?: string;
}

// Supplier Debt Ledger (Sổ Công Nợ Đối Tác)
export interface SupplierDebtTransaction {
  id: string;
  supplier_id: string;
  type: 'purchase' | 'payment';
  amount: number;
  balance: number; // Running balance after transaction
  created_at: string;
  notes?: string;
  reference_id?: string;
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
  is_packaging?: boolean; // Đánh dấu nguyên liệu này là Bao bì mang về (ly nhựa, ống hút, túi chữ T...)
}

export type BOMItem = RecipeBOM;

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  total_debt?: number;
  total_purchase?: number;
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
  password?: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  last_login?: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  business_name?: string; // Tên chính thức của Hộ kinh doanh / Công ty
  tax_code?: string; // Mã số thuế (MST) của quán
  owner_name?: string; // Tên chủ hộ kinh doanh / Đại diện pháp luật
  registration_date?: string; // Ngày cấp giấy phép đăng ký kinh doanh
  logo_url: string;
  address: string; // Địa chỉ đăng ký kinh doanh chính thức
  phone: string;
  business_hours: string;
  tax_rate: number; // e.g. 0.08 for 8%
  wifi_password?: string;
  wifi_ssid?: string;
  bank_id?: string;
  bank_account_no?: string;
  bank_account_name?: string;
  is_demo_mode?: boolean;
  enable_voice_alert?: boolean; // Bật/Tắt loa thông báo giọng nói tự động cho Bếp/Bar & Phục vụ
  tts_engine?: 'vieneu' | 'browser'; // Động cơ phát giọng nói: VieNeu-TTS AI (48kHz) hoặc Trình duyệt
  vieneu_voice?: string; // Giọng đọc VieNeu: 'Hải Đăng', 'Mai Anh', 'Thùy Dung', 'Thiện Minh', 'Trúc Ly', 'Quang Sơn', etc.
  vieneu_api_url?: string; // Endpoint VieNeu-TTS API (mặc định: http://127.0.0.1:8000/v1)
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

// ==========================================
// Phase 2.4: Smart Cashbook & Tax Declaration (NĐ 254/2026 & TT 91/2026)
// ==========================================
export type CashbookCategory =
  | 'sales'
  | 'supplier_payment'
  | 'rent'
  | 'utilities'
  | 'salary'
  | 'daily_supplies'
  | 'marketing'
  | 'tax'
  | 'other';

export type CashbookType = 'in' | 'out';
export type CashbookFundType = 'cash' | 'bank';

export interface CashbookTransaction {
  id: string;
  code: string; // PT-xxxx cho Phiếu Thu, PC-xxxx cho Phiếu Chi
  type: CashbookType;
  fund_type: CashbookFundType;
  category: CashbookCategory;
  amount: number;
  is_tax_valid: boolean; // Chi phí có hóa đơn/chứng từ hợp lệ theo Thông tư 91/2026/TT-BTC
  invoice_ref?: string; // Số hóa đơn / chứng từ kèm theo
  description: string;
  reference_id?: string;
  created_by?: string;
  created_at: string;
  is_auto: boolean; // Tự động sinh từ đơn hàng / trả NCC
}

export type TaxRegimeMethod = 'revenue_percentage' | 'deduction_method';

export interface TaxConfiguration {
  method: TaxRegimeMethod;
  vatRatePercent: number; // Mặc định 3% đối với HKD F&B, hoặc 8%/10% đối với DN
  personalIncomeTaxRatePercent: number; // Mặc định 1.5% đối với HKD F&B
  annualRevenueThreshold: number; // Ngưỡng doanh thu bắt buộc HĐĐT máy tính tiền theo NĐ 254 (1 tỷ đ)
}

export interface TaxCalculationSummary {
  periodLabel: string;
  totalGrossRevenue: number;
  cancelledRevenue: number;
  netTaxableRevenue: number; // Chỉ tiêu [28]
  vatTaxAmount: number; // Chỉ tiêu [29]
  pitTaxableRevenue: number; // Chỉ tiêu [30]
  pitTaxAmount: number; // Chỉ tiêu [31]
  totalTaxPayable: number;
  totalCOGS: number;
  validOperatingExpenses: number; // Chi phí hợp lệ khấu trừ
  invalidOperatingExpenses: number;
  totalExpenses: number;
  netProfit: number;
  cancelledOrdersCount: number;
}

