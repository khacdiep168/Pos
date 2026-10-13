# STATE.md - Bộ nhớ ngắn hạn dự án Smart Restaurant POS

> **Mục đích**: Lưu trữ trạng thái ngữ cảnh, các quyết định kiến trúc và lộ trình triển khai của hệ thống POS Nhà Hàng Thông Minh. Tệp này được tự động cập nhật sau mỗi tính năng/module hoàn thành để tối ưu hóa tokens & context window.

---

## 1. Trạng thái hiện tại (Project Status)
* **Trạng thái tổng thể**: Hoàn thành Module 1 (FOH), Module 2 (KDS/BDS), Module 3 (Cashier) & Module 4 (ERP & Recipe BOM Auto-Deduct) - Chuyển sang Module 5 (Admin Dashboard, Analytics & HR RBAC)
* **Thời gian cập nhật**: 2026-10-13

---

## 2. Các task đã hoàn thành (Completed Tasks)
- [x] **Khởi tạo nền tảng (Phase 0)**:
  - Next.js 16.4.0 (Turbopack, App Router, TypeScript strict mode, Tailwind CSS v4).
  - Cấu trúc thư mục chuẩn theo `CLAUDE.md`: `src/types`, `src/services`, `src/database`, `src/components/{foh, kds, cashier, erp, admin, ui}`, `src/lib`.
  - Schema types đầy đủ cho Table, Category, MenuItem, Order, OrderItem, RawMaterial, BOM, User, StoreSettings, Supplier, PurchaseOrder.
  - Event Bus Realtime (`src/services/realtimeEngine.ts`) với BroadcastChannel `pos_realtime_events`.
  - Dữ liệu mẫu phong phú (`src/database/mockData.ts`).
  - Tiện ích định dạng tiền VND và thời gian (`src/lib/utils.ts`).
- [x] **Module 1: Front-of-House (FOH) Menu & Order Flow**:
  - `CategoryNav`, `MenuCard`, `MenuGrid`, `ModifierModal`, `TableSelector`, `CartSidebar`, `FOHView`.
  - Phát sự kiện `ORDER_CREATED` và lưu trữ qua `orderService`.
- [x] **Module 2: Kitchen & Bar Display System (KDS & BDS Real-Time Kanban Board)**:
  - Trang `/kds` & Tab KDS in-app tối ưu màn hình ngang Desktop / Tablet.
  - Bóc tách trạm Bếp (`kitchen`) và Bar (`bar`) tự động.
  - Kanban 3 cột: "Chờ xử lý" -> "Đang làm" -> "Hoàn thành".
  - Thẻ vé KDS với bộ đếm thời gian thực và cảnh báo khẩn cấp (>8m, >15m).
  - Web Audio API âm thanh chuông đôi (Chime) khi có order mới.
- [x] **Module 3: Phân hệ Thu ngân & Quản lý Bàn (Cashier & Table Management)**:
  - Sơ đồ bàn trực quan (`TableMap.tsx`) với 4 màu trạng thái (Trống, Đang dùng, Chờ tính tiền, Đã đặt).
  - Cổng thanh toán đa kênh (`CheckoutPanel.tsx`): Tiền mặt có tính tiền thối lại, Dynamic VietQR (`VietQRCode.tsx`), Thẻ POS.
  - Luồng thanh toán ACID: chuyển order thành `completed`, giải phóng bàn về `available`, phát sự kiện `PAYMENT_COMPLETED`.
  - Hóa đơn in nhiệt khổ K80 chuẩn 80mm (`ReceiptModal.tsx`) với hỗ trợ in `window.print()`.
- [x] **Module 4: ERP & Recipe BOM Auto-Deduct (Quản trị Kho & Định mức)**:
  - **Trang `/erp` & Tab Kho in-app**: Giao diện với Sidebar 3 tab chuyên sâu:
    - **Tồn Kho (`InventoryTab.tsx`)**:
      - Bảng theo dõi nguyên vật liệu (`RawMaterials`): Tồn hiện tại, đơn vị mua/định mức, hệ số quy đổi, giá vốn TB (`avg_cost`), giá trị kho.
      - Bôi đỏ và gắn cảnh báo nhấp nháy `Low Stock` khi `current_stock < min_stock_level`.
      - Nhật ký xuất/nhập kho (`InventoryTransactions`): Ghi nhận toàn bộ biến động xuất/nhập với mã đơn hàng hoặc phiếu nhập liên quan.
    - **Định Mức (`RecipeBOMTab.tsx`)**:
      - Danh sách món ăn kèm trạm (Bếp/Bar), click để xem và cấu hình danh sách nguyên liệu cấu thành (BOM).
      - Phân tích tài chính & Giá vốn lý thuyết (COGS): Tính toán chi phí nguyên liệu cho 1 suất ăn, biên lợi nhuận gộp (`Gross Profit Margin %`) với màu chỉ báo tự động.
      - Trình chỉnh sửa BOM: Thêm nguyên liệu, điều chỉnh khối lượng tiêu hao (gram, ml), xóa, và lưu tức thì vào `inventoryService`.
    - **Nhập Hàng (`ProcurementTab.tsx`)**:
      - Quản lý hồ sơ nhà cung cấp (`Suppliers`), số điện thoại, địa chỉ và công nợ.
      - Lịch sử phiếu nhập kho (`PurchaseOrders`).
      - Modal tạo phiếu nhập mới: Tự động cộng tồn kho (`type: 'in'`) và tính lại giá vốn trung bình (Moving Average Cost) theo công thức tài chính.
  - **Luồng Trừ Kho Tự Động (ACID Auto-Deduct Trigger)**:
    - `inventoryService.ts` tự động lắng nghe sự kiện `PAYMENT_COMPLETED` từ `realtimeEngine.ts`.
    - Quét qua định mức BOM của tất cả món trong đơn hàng thanh toán, nhân với số lượng gọi, tự động trừ vào `current_stock` và sinh bản ghi giao dịch `InventoryTransaction` loại `'out'`.
    - Bắn cảnh báo `STOCK_ALERT` nếu nguyên vật liệu chạm ngưỡng tồn an toàn.
  - Biên dịch kiểm tra tĩnh (`npm run build`) hoàn tất 100% sinh các routes `/`, `/kds`, `/cashier`, `/erp`.

---

## 3. Task đang làm hiện tại (WIP)
* **WIP**: **Module 5: Admin Dashboard, Thống kê Doanh thu & Phân quyền HR RBAC**
  - **Executive Dashboard**: Biểu đồ trực quan doanh thu theo giờ/ngày, tỷ trọng kênh thanh toán (Tiền mặt vs VietQR vs Thẻ), top 5 món bán chạy nhất.
  - **Cấu hình Thông tin Cửa hàng (Store Settings)**: Cho phép cập nhật tên quán, logo, địa chỉ, hotline, thuế suất VAT (8%), wifi.
  - **Quản lý Khuyến mãi & Voucher (Promotions)**: Thêm/sửa mã giảm giá (theo %, theo số tiền, điều kiện bill tối thiểu).
  - **Quản lý Nhân sự & Phân quyền (HR & RBAC)**: Danh sách nhân viên, tài khoản đăng nhập, gán vai trò (`admin`, `manager`, `cashier`, `kitchen`, `bar`, `waiter`) và trạng thái hoạt động.

---

## 4. Các quyết định kỹ thuật quan trọng & Cấu trúc thư mục đã chốt

### 4.1. Kiến trúc & Công nghệ (Tech Stack)
* **Next.js 16.4.0 + Turbopack + React 19 + TypeScript + Tailwind CSS v4**.
* **ACID Auto-Deduct Trigger**:
  - `PAYMENT_COMPLETED` (từ Thu Ngân) -> `inventoryService.deductStockForOrder` -> tự động trừ tồn kho theo cấu hình `RecipeBOM` -> ghi log `InventoryTransaction` loại `'out'` -> bắn `STOCK_ALERT` nếu thiếu hàng.
* **Moving Average Cost (Giá vốn trung bình gia quyền)**:
  - Khi tạo Purchase Order nhập kho: `avg_cost = (current_stock * old_cost + incoming_stock * new_unit_cost) / (current_stock + incoming_stock)`.
* **Cross-Tab Real-time Synchronizer**:
  - `pos_realtime_events` (BroadcastChannel) kết nối xuyên suốt 4 phân hệ (FOH -> KDS -> Cashier -> ERP Kho).

### 4.2. Cấu trúc thư mục hiện tại
```
POS/
├── .agents/                    # Bộ quy chuẩn Superpowers & Skills
├── public/                     # Tài nguyên tĩnh
├── src/
│   ├── app/                    # Next.js App Router (page.tsx, kds/page.tsx, cashier/page.tsx, erp/page.tsx, layout.tsx, globals.css)
│   ├── components/
│   │   ├── admin/              # Module 5: WIP (Dashboard charts, Settings, HR/RBAC, Promotions)
│   │   ├── cashier/            # Module 3: COMPLETED (TableMap, CheckoutPanel, VietQRCode, ReceiptModal, CashierView)
│   │   ├── erp/                # Module 4: COMPLETED (InventoryTab, RecipeBOMTab, ProcurementTab, ERPView)
│   │   ├── foh/                # Module 1: COMPLETED (CategoryNav, MenuCard, MenuGrid, ModifierModal, TableSelector, CartSidebar, FOHView)
│   │   ├── kds/                # Module 2: COMPLETED (KDSTicketCard, KDSKanbanBoard, KDSView)
│   │   └── ui/                 # Atomic UI components
│   ├── database/               # mockData.ts (tables, categories, menuItems, rawMaterials, recipes, suppliers, purchaseOrders, users, settings)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # utils.ts, audioAlert.ts (Web Audio chime generator)
│   ├── services/               # realtimeEngine.ts, orderService.ts, inventoryService.ts
│   └── types/                  # index.ts (Data models & interfaces)
├── CLAUDE.md                   # Đặc tả nghiệp vụ & yêu cầu kiến trúc gốc
├── STATE.md                    # BỘ NHỚ NGẮN HẠN CỦA DỰ ÁN
└── package.json
```

---

## 5. Các task tiếp theo cần làm (Backlog / Next Steps)
1. **Module 5 (WIP)**: Admin Executive Dashboard, Báo cáo tài chính, Store Settings & HR RBAC.
2. Kiểm thử liên thông End-to-End toàn diện từ Gọi món (FOH) -> Làm món (KDS) -> Thu tiền (Cashier) -> Trừ kho (ERP) -> Báo cáo doanh thu (Admin).

---

## 6. Luật vận hành (Agent Working Rules)
- **Trước mỗi câu lệnh mới**: Luôn đọc `STATE.md` để nắm bắt ngay hiện trạng và quyết định kỹ thuật, không đọc lại toàn bộ code để tiết kiệm token.
- **Sau mỗi tính năng/task**: Tự động cập nhật `STATE.md` (đánh dấu hoàn thành, ghi lại WIP và các thay đổi quan trọng).
- **Kỷ luật chất lượng**: Tuân thủ TDD, modular components, phong cách giao diện hiện đại và an toàn dữ liệu.
