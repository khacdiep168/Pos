import {
  RestaurantTable,
  Category,
  MenuItem,
  StoreSettings,
  UserAccount,
  RawMaterial,
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

export const initialTables: RestaurantTable[] = [
  { id: 'tbl-1', table_number: 'Bàn 01', capacity: 4, status: 'available' },
  { id: 'tbl-2', table_number: 'Bàn 02', capacity: 2, status: 'available' },
  { id: 'tbl-3', table_number: 'Bàn 03', capacity: 4, status: 'occupied' },
  { id: 'tbl-4', table_number: 'Bàn 04', capacity: 6, status: 'available' },
  { id: 'tbl-5', table_number: 'Bàn 05', capacity: 8, status: 'billing' },
  { id: 'tbl-6', table_number: 'Bàn VIP 1', capacity: 10, status: 'available' },
  { id: 'tbl-7', table_number: 'Bàn VIP 2', capacity: 12, status: 'reserved' },
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

export const initialRawMaterials: RawMaterial[] = [
  {
    id: 'raw-1',
    name: 'Thịt Bò Wagyu A4',
    supplier_id: 'sup-1',
    purchase_unit: 'kg',
    recipe_unit: 'gram',
    conversion_factor: 1000,
    current_stock: 12500, // 12.5 kg
    min_stock_level: 3000,
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
];

export const initialUsers: UserAccount[] = [
  { id: 'usr-admin', full_name: 'Nguyễn Quản Trị', username: 'admin', role: 'admin', is_active: true },
  { id: 'usr-cashier', full_name: 'Trần Thu Ngân', username: 'cashier', role: 'cashier', is_active: true },
  { id: 'usr-kitchen', full_name: 'Lê Bếp Trưởng', username: 'chef', role: 'kitchen', is_active: true },
  { id: 'usr-bar', full_name: 'Phạm Bartender', username: 'bar', role: 'bar', is_active: true },
  { id: 'usr-waiter', full_name: 'Hoàng Phục Vụ', username: 'waiter', role: 'waiter', is_active: true },
];
