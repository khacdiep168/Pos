import {
  RestaurantTable,
  Zone,
  Category,
  MenuItem,
  StoreSettings,
  UserAccount,
  RawMaterial,
  Supplier,
  PurchaseOrder,
  RecipeBOM,
  Promotion,
  WorkShift,
  StockAuditReport,
  Order,
  Customer,
  SupplierDebtTransaction,
  CashbookTransaction,
} from '@/types';

export const initialStoreSettings: StoreSettings = {
  id: 'store-1',
  store_name: 'Nhà Hàng Vibe Taste & Bistro',
  business_name: 'HỘ KINH DOANH VIBE BISTRO',
  tax_code: '8329102834-001',
  owner_name: 'Nguyễn Văn A',
  registration_date: '2024-03-15',
  logo_url: '/logo.png',
  address: '123 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh',
  phone: '0901 234 567',
  business_hours: '08:00 - 23:00',
  tax_rate: 0.08,
  wifi_ssid: 'VIBE TASTE 5G',
  wifi_password: 'vibetaste_guest',
  bank_id: 'MB',
  bank_account_no: '0901234567',
  bank_account_name: 'VIBE TASTE RESTAURANT',
  is_demo_mode: true,
};

export const initialZones: Zone[] = [
  { id: 'zone-1', name: 'Tầng 1 (Khu Trệt)', description: 'Không gian mở, gần quầy bar và bếp chính', sort_order: 1 },
  { id: 'zone-2', name: 'Tầng 2 (Khu Lầu)', description: 'Không gian yên tĩnh, view cửa sổ lãng mạn', sort_order: 2 },
  { id: 'zone-3', name: 'Sân Vườn (Garden)', description: 'Không gian thoáng đãng, cây xanh ngoài trời', sort_order: 3 },
  { id: 'zone-4', name: 'Phòng VIP (Private)', description: 'Phòng tiệc riêng tư cách âm, sang trọng', sort_order: 4 },
];

export const initialTables: RestaurantTable[] = [
  // Tầng 1
  { id: 'tbl-1', table_number: 'Bàn 01', capacity: 4, status: 'available', zone_id: 'zone-1' },
  { id: 'tbl-2', table_number: 'Bàn 02', capacity: 2, status: 'available', zone_id: 'zone-1' },
  { id: 'tbl-3', table_number: 'Bàn 03', capacity: 4, status: 'occupied', zone_id: 'zone-1' },
  { id: 'tbl-4', table_number: 'Bàn 04', capacity: 6, status: 'available', zone_id: 'zone-1' },
  // Tầng 2
  { id: 'tbl-5', table_number: 'Bàn 05', capacity: 8, status: 'billing', zone_id: 'zone-2' },
  { id: 'tbl-6', table_number: 'Bàn 06', capacity: 4, status: 'available', zone_id: 'zone-2' },
  { id: 'tbl-7', table_number: 'Bàn 07', capacity: 2, status: 'available', zone_id: 'zone-2' },
  // Sân Vườn
  { id: 'tbl-8', table_number: 'Bàn SV 1', capacity: 4, status: 'available', zone_id: 'zone-3' },
  { id: 'tbl-9', table_number: 'Bàn SV 2', capacity: 6, status: 'available', zone_id: 'zone-3' },
  { id: 'tbl-10', table_number: 'Bàn SV 3', capacity: 4, status: 'reserved', zone_id: 'zone-3' },
  // Phòng VIP
  { id: 'tbl-11', table_number: 'Bàn VIP 1', capacity: 10, status: 'available', zone_id: 'zone-4' },
  { id: 'tbl-12', table_number: 'Bàn VIP 2', capacity: 12, status: 'reserved', zone_id: 'zone-4' },
];

export const initialCategories: Category[] = [
  { id: 'cat-food', name: 'Món Chính (Bếp)', type: 'food', icon: '🍲', sort_order: 1 },
  { id: 'cat-drink', name: 'Đồ Uống (Quầy Bar)', type: 'drink', icon: '🍹', sort_order: 2 },
  { id: 'cat-starter', name: 'Khai Vị', type: 'food', icon: '🥗', sort_order: 3 },
  { id: 'cat-dessert', name: 'Tráng Miệng', type: 'dessert', icon: '🍰', sort_order: 4 },
];

export const initialMenuItems: MenuItem[] = [
  {
    id: 'item-1',
    category_id: 'cat-food',
    name: 'Bò Bít Tết Sốt Tiêu Đen (Wagyu)',
    price: 320000,
    takeaway_price: 325000,
    delivery_price: 433000,
    packaging_cost: 5000,
    app_commission_rate: 25,
    image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80',
    station: 'kitchen',
    is_available: true,
    description: 'Thịt bò Wagyu áp chảo, ăn kèm khoai tây nghiền và sốt tiêu đen hảo hạng',
    modifiers: [
      { id: 'mod-steak-1', name: 'Độ chín: Rare (Tái)', price_adjustment: 0, group_name: 'Độ chín' },
      { id: 'mod-steak-2', name: 'Độ chín: Medium (Vừa)', price_adjustment: 0, group_name: 'Độ chín' },
      { id: 'mod-steak-3', name: 'Độ chín: Well-done (Kỹ)', price_adjustment: 0, group_name: 'Độ chín' },
      { id: 'mod-steak-extra-sauce', name: 'Thêm sốt nấm phô mai (+25k)', price_adjustment: 25000, group_name: 'Topping' },
    ],
  },
  {
    id: 'item-2',
    category_id: 'cat-food',
    name: 'Mì Ý Hải Sản Tươi Sốt Cà Chua',
    price: 185000,
    takeaway_price: 190000,
    delivery_price: 253000,
    packaging_cost: 5000,
    app_commission_rate: 25,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    station: 'kitchen',
    is_available: true,
    description: 'Tôm sú, mực tươi và nghêu biển xào sốt marinara đậm đà',
  },
  {
    id: 'item-3',
    category_id: 'cat-drink',
    name: 'Trà Đào Cam Sả Tươi Mát',
    price: 55000,
    takeaway_price: 57000,
    delivery_price: 76000,
    packaging_cost: 2000,
    app_commission_rate: 25,
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    station: 'bar',
    is_available: true,
    description: 'Trà đen thơm lừng ủ lạnh, cam vàng mọng nước và miếng đào giòn ngọt',
    modifiers: [
      { id: 'mod-tea-ice-1', name: '100% Đá', price_adjustment: 0, group_name: 'Mức đá' },
      { id: 'mod-tea-ice-2', name: '50% Đá', price_adjustment: 0, group_name: 'Mức đá' },
      { id: 'mod-tea-sugar-1', name: '70% Đường', price_adjustment: 0, group_name: 'Mức đường' },
      { id: 'mod-tea-sugar-2', name: '30% Đường', price_adjustment: 0, group_name: 'Mức đường' },
      { id: 'mod-tea-top-aloe', name: 'Thêm Thạch Nha Đam (+10k)', price_adjustment: 10000, group_name: 'Topping' },
    ],
  },
  {
    id: 'item-4',
    category_id: 'cat-drink',
    name: 'Cà Phê Muối Kem Béo Huế',
    price: 45000,
    takeaway_price: 47000,
    delivery_price: 63000,
    packaging_cost: 2000,
    app_commission_rate: 25,
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    station: 'bar',
    is_available: true,
    description: 'Cà phê Robusta pha phin truyền thống phủ lớp kem mặn béo ngậy',
  },
  {
    id: 'item-5',
    category_id: 'cat-starter',
    name: 'Salad Hoàng Gia Sốt Caesar & Gà Nướng',
    price: 120000,
    takeaway_price: 125000,
    delivery_price: 167000,
    packaging_cost: 5000,
    app_commission_rate: 25,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    station: 'kitchen',
    is_available: true,
    description: 'Xà lách Romaine hữu cơ, bánh mì nướng tỏi, phô mai Parmesan bào',
  },
  {
    id: 'item-6',
    category_id: 'cat-dessert',
    name: 'Bánh Mousse Chanh Leo Phủ Dừa',
    price: 65000,
    takeaway_price: 68000,
    delivery_price: 91000,
    packaging_cost: 3000,
    app_commission_rate: 25,
    image_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
    station: 'bar',
    is_available: true,
    description: 'Vị chua ngọt thanh mát kết hợp lớp cốt bánh hạnh nhân mềm xốp',
  },
  {
    id: 'item-cafe-da',
    category_id: 'cat-drink',
    name: 'Cà phê đá',
    price: 25000,
    takeaway_price: 27000,
    delivery_price: 36000,
    packaging_cost: 2000,
    app_commission_rate: 25,
    image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    station: 'bar',
    is_available: true,
    description: 'Cà phê Robusta thơm nồng pha phin truyền thống, đá mát lạnh sảng khoái',
  },
  {
    id: 'item-008707',
    category_id: 'cat-drink',
    name: 'Cà phê sữa',
    price: 34000,
    takeaway_price: 36000,
    delivery_price: 47000,
    packaging_cost: 1500,
    app_commission_rate: 25,
    image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
    station: 'bar',
    is_available: true,
    description: 'Cà phê pha phin truyền thống hòa quyện cùng sữa đặc béo ngậy ngọt ngào',
  },
];

export const initialSuppliers: Supplier[] = [
  { id: 'sup-1', name: 'Công ty Thực Phẩm MeatWorld (Thịt Bò & Gia Súc)', phone: '0912 345 678', email: 'sales@meatworld.vn', address: 'Bình Tân, TP. HCM', total_debt: 25000000, total_purchase: 95000000 },
  { id: 'sup-2', name: 'Tổng kho Nông Sản & Trà Cao Nguyên', phone: '0933 888 999', email: 'contact@tra-caonguyen.vn', address: 'Bảo Lộc, Lâm Đồng', total_debt: 8500000, total_purchase: 42000000 },
  { id: 'sup-3', name: 'Hải Sản Đại Dương Xanh Phan Thiết', phone: '0909 777 666', email: 'haisanphan_thiet@gmail.com', address: 'Phan Thiết, Bình Thuận', total_debt: 12000000, total_purchase: 68000000 },
];

export const initialRawMaterials: RawMaterial[] = [
  {
    id: 'raw-1',
    name: 'Thịt Bò Wagyu A4',
    supplier_id: 'sup-1',
    purchase_unit: 'kg',
    recipe_unit: 'gram',
    conversion_factor: 1000,
    current_stock: 12500, // 12.5 kg
    min_stock_level: 4000,
    avg_cost: 950, // 950 VND / gram
  },
  {
    id: 'raw-2',
    name: 'Trà Đen Thượng Hạng',
    supplier_id: 'sup-2',
    purchase_unit: 'kg',
    recipe_unit: 'gram',
    conversion_factor: 1000,
    current_stock: 8000,
    min_stock_level: 2000,
    avg_cost: 150,
  },
  {
    id: 'raw-3',
    name: 'Khoai Tây Nghiền Đà Lạt',
    supplier_id: 'sup-2',
    purchase_unit: 'kg',
    recipe_unit: 'gram',
    conversion_factor: 1000,
    current_stock: 18000,
    min_stock_level: 5000,
    avg_cost: 45,
  },
  {
    id: 'raw-4',
    name: 'Hạt Tiêu Đen Phú Quốc',
    supplier_id: 'sup-2',
    purchase_unit: 'kg',
    recipe_unit: 'gram',
    conversion_factor: 1000,
    current_stock: 2500,
    min_stock_level: 1000,
    avg_cost: 180,
  },
  {
    id: 'raw-5',
    name: 'Mì Ý Barilla Spaghetti',
    supplier_id: 'sup-1',
    purchase_unit: 'kg',
    recipe_unit: 'gram',
    conversion_factor: 1000,
    current_stock: 15000,
    min_stock_level: 3000,
    avg_cost: 65,
  },
  {
    id: 'raw-6',
    name: 'Tôm Sú Biển Tươi Cấp Đông',
    supplier_id: 'sup-3',
    purchase_unit: 'kg',
    recipe_unit: 'gram',
    conversion_factor: 1000,
    current_stock: 3500, // Low stock alert! (min is 5000)
    min_stock_level: 5000,
    avg_cost: 380,
  },
  {
    id: 'raw-7',
    name: 'Mực Ống Tươi Côn Đảo',
    supplier_id: 'sup-3',
    purchase_unit: 'kg',
    recipe_unit: 'gram',
    conversion_factor: 1000,
    current_stock: 6000,
    min_stock_level: 3000,
    avg_cost: 290,
  },
  {
    id: 'raw-8',
    name: 'Đào Ngâm Miếng Hộp Golden',
    supplier_id: 'sup-2',
    purchase_unit: 'hộp',
    recipe_unit: 'gram',
    conversion_factor: 800,
    current_stock: 6400,
    min_stock_level: 2000,
    avg_cost: 95,
  },
  {
    id: 'raw-9',
    name: 'Cam Vàng Tươi Mọng Nước',
    supplier_id: 'sup-2',
    purchase_unit: 'kg',
    recipe_unit: 'gram',
    conversion_factor: 1000,
    current_stock: 9000,
    min_stock_level: 3000,
    avg_cost: 40,
  },
  {
    id: 'raw-10',
    name: 'Cà Phê Hạt Robusta Buôn Ma Thuột',
    supplier_id: 'sup-2',
    purchase_unit: 'kg',
    recipe_unit: 'gram',
    conversion_factor: 1000,
    current_stock: 7500,
    min_stock_level: 2500,
    avg_cost: 160,
  },
  // Packaging Raw Materials (Vật tư bao bì mang về / delivery)
  {
    id: 'raw-pkg-1',
    name: 'Ly Nhựa PP 500ml & Nắp Cầu Mang Về',
    supplier_id: 'sup-2',
    category: 'Bao bì',
    purchase_unit: 'lốc',
    recipe_unit: 'cái',
    conversion_factor: 50,
    current_stock: 500,
    min_stock_level: 100,
    avg_cost: 1200, // 1.200đ / cái
  },
  {
    id: 'raw-pkg-2',
    name: 'Ống Hút Giấy & Muỗng Gỗ Tiệt Trùng',
    supplier_id: 'sup-2',
    category: 'Bao bì',
    purchase_unit: 'gói',
    recipe_unit: 'cái',
    conversion_factor: 100,
    current_stock: 800,
    min_stock_level: 200,
    avg_cost: 300, // 300đ / cái
  },
  {
    id: 'raw-pkg-3',
    name: 'Túi Chữ T Tự Hủy Đựng 1 Ly',
    supplier_id: 'sup-2',
    category: 'Bao bì',
    purchase_unit: 'kg',
    recipe_unit: 'cái',
    conversion_factor: 250,
    current_stock: 1200,
    min_stock_level: 300,
    avg_cost: 500, // 500đ / cái
  },
  {
    id: 'raw-pkg-4',
    name: 'Hộp Giấy Bã Mía Sinh Thái (Steak / Mì)',
    supplier_id: 'sup-2',
    category: 'Bao bì',
    purchase_unit: 'thùng',
    recipe_unit: 'cái',
    conversion_factor: 100,
    current_stock: 350,
    min_stock_level: 80,
    avg_cost: 3500, // 3.500đ / cái
  },
  {
    id: 'raw-pkg-5',
    name: 'Bộ Dao Muỗng Nĩa Gỗ & Khăn Lạnh Mang Về',
    supplier_id: 'sup-2',
    category: 'Bao bì',
    purchase_unit: 'set',
    recipe_unit: 'bộ',
    conversion_factor: 1,
    current_stock: 400,
    min_stock_level: 100,
    avg_cost: 1500, // 1.500đ / bộ
  },
];

// Bill of Materials (BOM) Recipes for Menu Items
export const initialRecipes: RecipeBOM[] = [
  // item-1: Bò Bít Tết Sốt Tiêu Đen (Wagyu)
  { id: 'bom-1', menu_item_id: 'item-1', raw_material_id: 'raw-1', quantity: 200 }, // 200g Bò Wagyu (vốn cốt)
  { id: 'bom-2', menu_item_id: 'item-1', raw_material_id: 'raw-3', quantity: 150 }, // 150g Khoai tây (vốn cốt)
  { id: 'bom-3', menu_item_id: 'item-1', raw_material_id: 'raw-4', quantity: 15 },  // 15g Tiêu đen (vốn cốt)
  { id: 'bom-1-pkg1', menu_item_id: 'item-1', raw_material_id: 'raw-pkg-4', quantity: 1, is_packaging: true }, // Hộp bã mía mang về
  { id: 'bom-1-pkg2', menu_item_id: 'item-1', raw_material_id: 'raw-pkg-5', quantity: 1, is_packaging: true }, // Bộ dao nĩa gỗ

  // item-2: Mì Ý Hải Sản Tươi Sốt Cà Chua
  { id: 'bom-4', menu_item_id: 'item-2', raw_material_id: 'raw-5', quantity: 120 }, // 120g Mì Ý (vốn cốt)
  { id: 'bom-5', menu_item_id: 'item-2', raw_material_id: 'raw-6', quantity: 100 }, // 100g Tôm sú (vốn cốt)
  { id: 'bom-6', menu_item_id: 'item-2', raw_material_id: 'raw-7', quantity: 80 },  // 80g Mực tươi (vốn cốt)
  { id: 'bom-2-pkg1', menu_item_id: 'item-2', raw_material_id: 'raw-pkg-4', quantity: 1, is_packaging: true }, // Hộp bã mía
  { id: 'bom-2-pkg2', menu_item_id: 'item-2', raw_material_id: 'raw-pkg-5', quantity: 1, is_packaging: true }, // Dao nĩa

  // item-3: Trà Đào Cam Sả Tươi Mát
  { id: 'bom-7', menu_item_id: 'item-3', raw_material_id: 'raw-2', quantity: 15 },  // 15g Trà đen (vốn cốt)
  { id: 'bom-8', menu_item_id: 'item-3', raw_material_id: 'raw-8', quantity: 45 },  // 45g Đào ngâm (vốn cốt)
  { id: 'bom-9', menu_item_id: 'item-3', raw_material_id: 'raw-9', quantity: 60 },  // 60g Cam vàng (vốn cốt)
  { id: 'bom-3-pkg1', menu_item_id: 'item-3', raw_material_id: 'raw-pkg-1', quantity: 1, is_packaging: true }, // Ly nhựa PP
  { id: 'bom-3-pkg2', menu_item_id: 'item-3', raw_material_id: 'raw-pkg-2', quantity: 1, is_packaging: true }, // Ống hút
  { id: 'bom-3-pkg3', menu_item_id: 'item-3', raw_material_id: 'raw-pkg-3', quantity: 1, is_packaging: true }, // Túi chữ T

  // item-4: Cà Phê Muối Kem Béo Huế
  { id: 'bom-10', menu_item_id: 'item-4', raw_material_id: 'raw-10', quantity: 25 }, // 25g Cà phê hạt (vốn cốt)
  { id: 'bom-4-pkg1', menu_item_id: 'item-4', raw_material_id: 'raw-pkg-1', quantity: 1, is_packaging: true }, // Ly nhựa
  { id: 'bom-4-pkg2', menu_item_id: 'item-4', raw_material_id: 'raw-pkg-2', quantity: 1, is_packaging: true }, // Ống hút
  { id: 'bom-4-pkg3', menu_item_id: 'item-4', raw_material_id: 'raw-pkg-3', quantity: 1, is_packaging: true }, // Túi chữ T
];

export const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-101',
    supplier_id: 'sup-1',
    supplier_name: 'Công ty Thực Phẩm MeatWorld',
    total_amount: 19000000,
    status: 'received',
    items: [
      { raw_material_id: 'raw-1', raw_material_name: 'Thịt Bò Wagyu A4', quantity: 20, unit_price: 950000, total: 19000000 }
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'po-102',
    supplier_id: 'sup-3',
    supplier_name: 'Hải Sản Đại Dương Xanh Phan Thiết',
    total_amount: 7600000,
    status: 'received',
    items: [
      { raw_material_id: 'raw-6', raw_material_name: 'Tôm Sú Biển Tươi', quantity: 20, unit_price: 380000, total: 7600000 }
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
  }
];


export const initialPromotions: Promotion[] = [
  {
    id: 'promo-1',
    name: 'Khuyến mãi Khai Trương Giảm 10%',
    promo_code: 'OPEN10',
    discount_type: 'percent',
    discount_value: 10,
    min_order_value: 200000,
    is_active: true,
  },
  {
    id: 'promo-2',
    name: 'Giảm 50.000đ Cho Hóa Đơn Lớn',
    promo_code: 'VIP50K',
    discount_type: 'fixed_amount',
    discount_value: 50000,
    min_order_value: 500000,
    is_active: true,
  },
  {
    id: 'promo-3',
    name: 'Happy Hour Giảm 15% Đồ Uống',
    promo_code: 'HAPPY15',
    discount_type: 'percent',
    discount_value: 15,
    min_order_value: 150000,
    is_active: false,
  },
];

// Helper functions for direct supplier array mutation in mockData (Requirement 2)
export const getMockSuppliers = (): Supplier[] => [...initialSuppliers];
export const addMockSupplier = (newSup: Supplier) => {
  initialSuppliers.push(newSup);
};
export const updateMockSupplier = (id: string, updates: Partial<Supplier>) => {
  const idx = initialSuppliers.findIndex((s) => s.id === id);
  if (idx !== -1) {
    initialSuppliers[idx] = { ...initialSuppliers[idx], ...updates };
  }
};
export const deleteMockSupplier = (id: string) => {
  const idx = initialSuppliers.findIndex((s) => s.id === id);
  if (idx !== -1) {
    initialSuppliers.splice(idx, 1);
  }
};

// ==================== CUSTOMERS (CRM) MOCK DATA ====================
export const initialCustomers: Customer[] = [
  {
    id: 'cus-1',
    name: 'Nguyễn Văn Hùng',
    phone: '0909123456',
    email: 'hung.nguyen@gmail.com',
    membership_tier: 'diamond',
    total_spent: 12500000,
    points: 1250,
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
    notes: 'Khách VIP quen, thích ngồi Tầng 2 cạnh cửa sổ',
  },
  {
    id: 'cus-2',
    name: 'Trần Thị Thu Mai',
    phone: '0988654321',
    email: 'thumai.tran@yahoo.com',
    membership_tier: 'gold',
    total_spent: 6800000,
    points: 680,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    notes: 'Hay đi ăn cuối tuần cùng gia đình',
  },
  {
    id: 'cus-3',
    name: 'Lê Hoàng Minh',
    phone: '0918777888',
    email: 'minh.le@outlook.com',
    membership_tier: 'silver',
    total_spent: 3200000,
    points: 320,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'cus-4',
    name: 'Phạm Quỳnh Như',
    phone: '0933222111',
    membership_tier: 'bronze',
    total_spent: 850000,
    points: 85,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

// Helper functions for Customers
export const getMockCustomers = (): Customer[] => [...initialCustomers];
export const addMockCustomer = (newCus: Customer) => {
  initialCustomers.unshift(newCus);
};
export const updateMockCustomer = (id: string, updates: Partial<Customer>) => {
  const idx = initialCustomers.findIndex((c) => c.id === id);
  if (idx !== -1) {
    initialCustomers[idx] = { ...initialCustomers[idx], ...updates };
  }
};
export const deleteMockCustomer = (id: string) => {
  const idx = initialCustomers.findIndex((c) => c.id === id);
  if (idx !== -1) {
    initialCustomers.splice(idx, 1);
  }
};

// ==================== SUPPLIER DEBT TRANSACTIONS (SỔ CÔNG NỢ) ====================
export const initialSupplierDebtTransactions: SupplierDebtTransaction[] = [
  // sup-1 (MeatWorld)
  {
    id: 'tx-debt-101',
    supplier_id: 'sup-1',
    type: 'purchase',
    amount: 19000000,
    balance: 45000000,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    notes: 'Nhập lô Thịt Bò Wagyu A4 (PO-101)',
    reference_id: 'po-101',
  },
  {
    id: 'tx-debt-102',
    supplier_id: 'sup-1',
    type: 'payment',
    amount: 20000000,
    balance: 25000000,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    notes: 'Thanh toán chuyển khoản VietQR đợt 1',
    reference_id: 'pay-201',
  },
  // sup-2 (Trà & Nông Sản)
  {
    id: 'tx-debt-103',
    supplier_id: 'sup-2',
    type: 'purchase',
    amount: 15500000,
    balance: 18500000,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    notes: 'Nhập trà đen & rau củ quả',
    reference_id: 'po-099',
  },
  {
    id: 'tx-debt-104',
    supplier_id: 'sup-2',
    type: 'payment',
    amount: 10000000,
    balance: 8500000,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    notes: 'Thanh toán tiền mặt kế toán duyệt',
    reference_id: 'pay-202',
  },
  // sup-3 (Đại Dương Xanh)
  {
    id: 'tx-debt-105',
    supplier_id: 'sup-3',
    type: 'purchase',
    amount: 7600000,
    balance: 17000000,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    notes: 'Nhập lô Tôm sú & Mực tươi (PO-102)',
    reference_id: 'po-102',
  },
  {
    id: 'tx-debt-106',
    supplier_id: 'sup-3',
    type: 'payment',
    amount: 5000000,
    balance: 12000000,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    notes: 'Chuyển khoản thanh toán công nợ hải sản',
    reference_id: 'pay-203',
  },
];

export const getMockSupplierDebtTransactions = (): SupplierDebtTransaction[] => [
  ...initialSupplierDebtTransactions,
];
export const addMockSupplierDebtTransaction = (tx: SupplierDebtTransaction) => {
  initialSupplierDebtTransactions.unshift(tx);
};

// Rich Mock Orders History for Invoice & Dashboard Analytics
const now = new Date();
const todayISO = (hour: number, minute: number = 0) => {
  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
const daysAgoISO = (days: number, hour: number, minute: number = 0) => {
  const d = new Date(now.getTime() - days * 86400000);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const initialOrders: Order[] = [
  {
    id: 'ORD-20261013-001',
    table_id: 'tbl-1',
    table_number: 'Bàn 01',
    order_status: 'completed',
    payment_status: 'paid',
    payment_method: 'transfer_qr',
    subtotal: 375000,
    discount_amount: 0,
    tax_amount: 30000,
    total_amount: 405000,
    notes: 'Khách thanh toán quét mã VietQR thành công',
    created_at: todayISO(11, 45),
    updated_at: todayISO(12, 30),
    items: [
      {
        id: 'ord-it-1',
        order_id: 'ORD-20261013-001',
        menu_item_id: 'item-1',
        menu_item_name: 'Bò Bít Tết Sốt Tiêu Đen (Wagyu)',
        quantity: 1,
        price: 320000,
        selected_modifiers: [
          { id: 'mod-steak-2', name: 'Độ chín: Medium (Vừa)', price_adjustment: 0, group_name: 'Độ chín' },
        ],
        item_status: 'served',
        station: 'kitchen',
        created_at: todayISO(11, 45),
      },
      {
        id: 'ord-it-2',
        order_id: 'ORD-20261013-001',
        menu_item_id: 'item-3',
        menu_item_name: 'Trà Đào Cam Sả Tươi Mát',
        quantity: 1,
        price: 55000,
        selected_modifiers: [
          { id: 'mod-tea-ice-2', name: '50% Đá', price_adjustment: 0, group_name: 'Mức đá' },
        ],
        item_status: 'served',
        station: 'bar',
        created_at: todayISO(11, 45),
      },
    ],
  },
  {
    id: 'ORD-20261013-002',
    table_id: 'tbl-2',
    table_number: 'Bàn 02',
    order_status: 'completed',
    payment_status: 'paid',
    payment_method: 'cash',
    subtotal: 230000,
    discount_amount: 0,
    tax_amount: 18400,
    total_amount: 248400,
    notes: 'Tiền mặt trả đủ',
    created_at: todayISO(12, 15),
    updated_at: todayISO(13, 0),
    items: [
      {
        id: 'ord-it-3',
        order_id: 'ORD-20261013-002',
        menu_item_id: 'item-2',
        menu_item_name: 'Mì Ý Hải Sản Tươi Sốt Cà Chua',
        quantity: 1,
        price: 185000,
        item_status: 'served',
        station: 'kitchen',
        created_at: todayISO(12, 15),
      },
      {
        id: 'ord-it-4',
        order_id: 'ORD-20261013-002',
        menu_item_id: 'item-4',
        menu_item_name: 'Cà Phê Muối Kem Béo Huế',
        quantity: 1,
        price: 45000,
        item_status: 'served',
        station: 'bar',
        created_at: todayISO(12, 15),
      },
    ],
  },
  {
    id: 'ORD-20261013-003',
    table_id: 'tbl-3',
    table_number: 'Bàn 03',
    order_status: 'cooking',
    payment_status: 'unpaid',
    subtotal: 440000,
    discount_amount: 0,
    tax_amount: 35200,
    total_amount: 475200,
    notes: 'Khách đang dùng bữa',
    created_at: todayISO(14, 10),
    updated_at: todayISO(14, 20),
    items: [
      {
        id: 'ord-it-5',
        order_id: 'ORD-20261013-003',
        menu_item_id: 'item-1',
        menu_item_name: 'Bò Bít Tết Sốt Tiêu Đen (Wagyu)',
        quantity: 1,
        price: 320000,
        item_status: 'cooking',
        station: 'kitchen',
        created_at: todayISO(14, 10),
      },
      {
        id: 'ord-it-6',
        order_id: 'ORD-20261013-003',
        menu_item_id: 'item-5',
        menu_item_name: 'Salad Hoàng Gia Sốt Caesar & Gà Nướng',
        quantity: 1,
        price: 120000,
        item_status: 'ready',
        station: 'kitchen',
        created_at: todayISO(14, 10),
      },
    ],
  },
  {
    id: 'ORD-20261013-004',
    table_id: 'tbl-5',
    table_number: 'Bàn 05',
    order_status: 'cancelled',
    payment_status: 'unpaid',
    subtotal: 120000,
    discount_amount: 0,
    tax_amount: 9600,
    total_amount: 129600,
    notes: 'Khách có việc đột xuất xin hủy đơn trước khi ra món',
    created_at: todayISO(10, 15),
    updated_at: todayISO(10, 20),
    items: [
      {
        id: 'ord-it-7',
        order_id: 'ORD-20261013-004',
        menu_item_id: 'item-5',
        menu_item_name: 'Salad Hoàng Gia Sốt Caesar & Gà Nướng',
        quantity: 1,
        price: 120000,
        item_status: 'cancelled',
        station: 'kitchen',
        created_at: todayISO(10, 15),
      },
    ],
  },
  {
    id: 'ORD-20261012-005',
    table_id: 'tbl-11',
    table_number: 'Bàn VIP 1',
    order_status: 'completed',
    payment_status: 'paid',
    payment_method: 'card',
    subtotal: 1365000,
    discount_amount: 50000,
    tax_amount: 105200,
    total_amount: 1420200,
    notes: 'Áp voucher VIP50K, quẹt thẻ Visa',
    created_at: daysAgoISO(1, 19, 30),
    updated_at: daysAgoISO(1, 21, 15),
    items: [
      {
        id: 'ord-it-8',
        order_id: 'ORD-20261012-005',
        menu_item_id: 'item-1',
        menu_item_name: 'Bò Bít Tết Sốt Tiêu Đen (Wagyu)',
        quantity: 3,
        price: 320000,
        item_status: 'served',
        station: 'kitchen',
        created_at: daysAgoISO(1, 19, 30),
      },
      {
        id: 'ord-it-9',
        order_id: 'ORD-20261012-005',
        menu_item_id: 'item-5',
        menu_item_name: 'Salad Hoàng Gia Sốt Caesar & Gà Nướng',
        quantity: 2,
        price: 120000,
        item_status: 'served',
        station: 'kitchen',
        created_at: daysAgoISO(1, 19, 30),
      },
      {
        id: 'ord-it-10',
        order_id: 'ORD-20261012-005',
        menu_item_id: 'item-3',
        menu_item_name: 'Trà Đào Cam Sả Tươi Mát',
        quantity: 3,
        price: 55000,
        item_status: 'served',
        station: 'bar',
        created_at: daysAgoISO(1, 19, 30),
      },
    ],
  },
  {
    id: 'ORD-20261011-006',
    table_id: 'tbl-9',
    table_number: 'Bàn SV 2',
    order_status: 'completed',
    payment_status: 'paid',
    payment_method: 'transfer_qr',
    subtotal: 460000,
    discount_amount: 46000,
    tax_amount: 33120,
    total_amount: 447120,
    notes: 'Khuyến mãi Khai Trương 10% (OPEN10)',
    created_at: daysAgoISO(2, 18, 0),
    updated_at: daysAgoISO(2, 19, 30),
    items: [
      {
        id: 'ord-it-11',
        order_id: 'ORD-20261011-006',
        menu_item_id: 'item-2',
        menu_item_name: 'Mì Ý Hải Sản Tươi Sốt Cà Chua',
        quantity: 2,
        price: 185000,
        item_status: 'served',
        station: 'kitchen',
        created_at: daysAgoISO(2, 18, 0),
      },
      {
        id: 'ord-it-12',
        order_id: 'ORD-20261011-006',
        menu_item_id: 'item-4',
        menu_item_name: 'Cà Phê Muối Kem Béo Huế',
        quantity: 2,
        price: 45000,
        item_status: 'served',
        station: 'bar',
        created_at: daysAgoISO(2, 18, 0),
      },
    ],
  },
  {
    id: 'ORD-20261010-007',
    table_id: 'tbl-4',
    table_number: 'Bàn 04',
    order_status: 'cancelled',
    payment_status: 'unpaid',
    subtotal: 185000,
    discount_amount: 0,
    tax_amount: 14800,
    total_amount: 199800,
    notes: 'Order nhầm bàn, phục vụ đã hủy đơn và tạo lại',
    created_at: daysAgoISO(3, 12, 30),
    updated_at: daysAgoISO(3, 12, 35),
    items: [
      {
        id: 'ord-it-13',
        order_id: 'ORD-20261010-007',
        menu_item_id: 'item-2',
        menu_item_name: 'Mì Ý Hải Sản Tươi Sốt Cà Chua',
        quantity: 1,
        price: 185000,
        item_status: 'cancelled',
        station: 'kitchen',
        created_at: daysAgoISO(3, 12, 30),
      },
    ],
  },
  {
    id: 'ORD-20261005-008',
    table_id: 'tbl-12',
    table_number: 'Bàn VIP 2',
    order_status: 'completed',
    payment_status: 'paid',
    payment_method: 'card',
    subtotal: 1540000,
    discount_amount: 50000,
    tax_amount: 119200,
    total_amount: 1609200,
    notes: 'Tiệc họp gia đình, thẻ Mastercard',
    created_at: daysAgoISO(8, 20, 0),
    updated_at: daysAgoISO(8, 22, 15),
    items: [
      {
        id: 'ord-it-14',
        order_id: 'ORD-20261005-008',
        menu_item_id: 'item-1',
        menu_item_name: 'Bò Bít Tết Sốt Tiêu Đen (Wagyu)',
        quantity: 4,
        price: 320000,
        item_status: 'served',
        station: 'kitchen',
        created_at: daysAgoISO(8, 20, 0),
      },
      {
        id: 'ord-it-15',
        order_id: 'ORD-20261005-008',
        menu_item_id: 'item-6',
        menu_item_name: 'Bánh Mousse Chanh Leo Phủ Dừa',
        quantity: 4,
        price: 65000,
        item_status: 'served',
        station: 'bar',
        created_at: daysAgoISO(8, 20, 0),
      },
    ],
  },
  {
    id: 'ORD-20260920-009',
    table_id: 'tbl-6',
    table_number: 'Bàn 06',
    order_status: 'completed',
    payment_status: 'paid',
    payment_method: 'cash',
    subtotal: 610000,
    discount_amount: 0,
    tax_amount: 48800,
    total_amount: 658800,
    notes: 'Tháng trước - Tiền mặt',
    created_at: daysAgoISO(23, 19, 0),
    updated_at: daysAgoISO(23, 20, 10),
    items: [
      {
        id: 'ord-it-16',
        order_id: 'ORD-20260920-009',
        menu_item_id: 'item-2',
        menu_item_name: 'Mì Ý Hải Sản Tươi Sốt Cà Chua',
        quantity: 2,
        price: 185000,
        item_status: 'served',
        station: 'kitchen',
        created_at: daysAgoISO(23, 19, 0),
      },
      {
        id: 'ord-it-17',
        order_id: 'ORD-20260920-009',
        menu_item_id: 'item-5',
        menu_item_name: 'Salad Hoàng Gia Sốt Caesar & Gà Nướng',
        quantity: 2,
        price: 120000,
        item_status: 'served',
        station: 'kitchen',
        created_at: daysAgoISO(23, 19, 0),
      },
    ],
  },
];

export const initialUsers: UserAccount[] = [
  {
    id: 'usr-admin',
    full_name: 'Nguyễn Quản Trị',
    username: 'admin',
    password: 'password123',
    role: 'admin',
    is_active: true,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
  },
  {
    id: 'usr-manager',
    full_name: 'Lê Quản Lý',
    username: 'manager',
    password: 'password123',
    role: 'manager',
    is_active: true,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
  },
  {
    id: 'usr-cashier',
    full_name: 'Trần Thị Mai (Thu Ngân)',
    username: 'cashier',
    password: 'password123',
    role: 'cashier',
    is_active: true,
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
  },
  {
    id: 'usr-chef',
    full_name: 'Lê Văn Hùng (Bếp Trưởng)',
    username: 'chef',
    password: 'password123',
    role: 'kitchen',
    is_active: true,
    avatar_url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100&q=80',
  },
  {
    id: 'usr-bar',
    full_name: 'Phạm Minh Tuấn (Pha Chế Bar)',
    username: 'bartender',
    password: 'password123',
    role: 'bar',
    is_active: true,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
  },
  {
    id: 'usr-waiter',
    full_name: 'Nguyễn Văn An (Phục Vụ)',
    username: 'waiter',
    password: 'password123',
    role: 'waiter',
    is_active: true,
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&q=80',
  },
];

export const initialManualCashbookTransactions: CashbookTransaction[] = [
  {
    id: 'cb-init-1',
    code: 'PC-202610-001',
    type: 'out',
    fund_type: 'bank',
    category: 'rent',
    amount: 15000000,
    is_tax_valid: true,
    invoice_ref: 'HD-MB-10/2026',
    description: 'Thanh toán tiền thuê mặt bằng kinh doanh Tháng 10/2026',
    created_by: 'Nguyễn Quản Trị',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    is_auto: false,
  },
  {
    id: 'cb-init-2',
    code: 'PC-202610-002',
    type: 'out',
    fund_type: 'bank',
    category: 'utilities',
    amount: 3250000,
    is_tax_valid: true,
    invoice_ref: 'EVN-HCM-882190',
    description: 'Tiền điện & Nước sinh hoạt quán Tháng 10/2026',
    created_by: 'Nguyễn Quản Trị',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    is_auto: false,
  },
  {
    id: 'cb-init-3',
    code: 'PC-202610-003',
    type: 'out',
    fund_type: 'cash',
    category: 'daily_supplies',
    amount: 450000,
    is_tax_valid: false,
    description: 'Mua đá bi & đồ dùng phụ trợ quầy bar',
    created_by: 'Trần Thị Mai (Thu Ngân)',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    is_auto: false,
  },
  {
    id: 'cb-init-4',
    code: 'PC-202610-004',
    type: 'out',
    fund_type: 'bank',
    category: 'marketing',
    amount: 1200000,
    is_tax_valid: true,
    invoice_ref: 'INV-GRAB-09341',
    description: 'Phí kích hoạt gian hàng & chạy quảng cáo App GrabFood',
    created_by: 'Nguyễn Quản Trị',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    is_auto: false,
  },
];

