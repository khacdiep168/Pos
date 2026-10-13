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
} from '@/types';

export const initialStoreSettings: StoreSettings = {
  id: 'store-1',
  store_name: 'Nhà Hàng Vibe Taste & Bistro',
  logo_url: '/logo.png',
  address: '123 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh',
  phone: '0901 234 567',
  business_hours: '08:00 - 23:00',
  tax_rate: 0.08,
  wifi_password: 'vibetaste_guest',
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
    image_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
    station: 'bar',
    is_available: true,
    description: 'Vị chua ngọt thanh mát kết hợp lớp cốt bánh hạnh nhân mềm xốp',
  },
];

export const initialSuppliers: Supplier[] = [
  { id: 'sup-1', name: 'Công ty Thực Phẩm MeatWorld (Thịt Bò & Gia Súc)', phone: '0912 345 678', address: 'Bình Tân, TP. HCM', total_debt: 25000000 },
  { id: 'sup-2', name: 'Tổng kho Nông Sản & Trà Cao Nguyên', phone: '0933 888 999', address: 'Bảo Lộc, Lâm Đồng', total_debt: 8500000 },
  { id: 'sup-3', name: 'Hải Sản Đại Dương Xanh Phan Thiết', phone: '0909 777 666', address: 'Phan Thiết, Bình Thuận', total_debt: 12000000 },
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
];

// Bill of Materials (BOM) Recipes for Menu Items
export const initialRecipes: RecipeBOM[] = [
  // item-1: Bò Bít Tết Sốt Tiêu Đen (Wagyu)
  { id: 'bom-1', menu_item_id: 'item-1', raw_material_id: 'raw-1', quantity: 200 }, // 200g Bò Wagyu
  { id: 'bom-2', menu_item_id: 'item-1', raw_material_id: 'raw-3', quantity: 150 }, // 150g Khoai tây
  { id: 'bom-3', menu_item_id: 'item-1', raw_material_id: 'raw-4', quantity: 15 },  // 15g Tiêu đen

  // item-2: Mì Ý Hải Sản Tươi Sốt Cà Chua
  { id: 'bom-4', menu_item_id: 'item-2', raw_material_id: 'raw-5', quantity: 120 }, // 120g Mì Ý
  { id: 'bom-5', menu_item_id: 'item-2', raw_material_id: 'raw-6', quantity: 100 }, // 100g Tôm sú
  { id: 'bom-6', menu_item_id: 'item-2', raw_material_id: 'raw-7', quantity: 80 },  // 80g Mực tươi

  // item-3: Trà Đào Cam Sả Tươi Mát
  { id: 'bom-7', menu_item_id: 'item-3', raw_material_id: 'raw-2', quantity: 15 },  // 15g Trà đen
  { id: 'bom-8', menu_item_id: 'item-3', raw_material_id: 'raw-8', quantity: 45 },  // 45g Đào ngâm
  { id: 'bom-9', menu_item_id: 'item-3', raw_material_id: 'raw-9', quantity: 60 },  // 60g Cam vàng

  // item-4: Cà Phê Muối Kem Béo Huế
  { id: 'bom-10', menu_item_id: 'item-4', raw_material_id: 'raw-10', quantity: 25 }, // 25g Cà phê hạt
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

export const initialUsers: UserAccount[] = [
  { id: 'usr-admin', full_name: 'Nguyễn Quản Trị', username: 'admin', role: 'admin', is_active: true },
  { id: 'usr-cashier', full_name: 'Trần Thu Ngân', username: 'cashier', role: 'cashier', is_active: true },
  { id: 'usr-kitchen', full_name: 'Lê Bếp Trưởng', username: 'chef', role: 'kitchen', is_active: true },
  { id: 'usr-bar', full_name: 'Phạm Bartender', username: 'bar', role: 'bar', is_active: true },
  { id: 'usr-waiter', full_name: 'Hoàng Phục Vụ', username: 'waiter', role: 'waiter', is_active: true },
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
