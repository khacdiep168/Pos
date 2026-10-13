# STATE.md - Bộ nhớ ngắn hạn dự án Smart Restaurant POS

> **Mục đích**: Lưu trữ trạng thái ngữ cảnh, các quyết định kiến trúc và lộ trình triển khai của hệ thống POS Nhà Hàng Thông Minh. Tệp này được tự động cập nhật sau mỗi tính năng/module hoàn thành để tối ưu hóa tokens & context window.

---

## 1. Trạng thái hiện tại (Project Status)
* **Trạng thái tổng thể**: **HOÀN TẤT TOÀN DIỆN PHASE 1** (100% Cả 5 Module Cốt Lõi + Kiểm Thử Liên Thông End-to-End Simulation + Tối Ưu Hóa Responsive Mobile/Tablet + Lược Đồ Database Migration PostgreSQL/Supabase).
* **Kết quả Build**: `next build` biên dịch thành công 100% (Turbopack, TypeScript strict mode, 0 lint/type errors, 5 static routes sẵn sàng).
* **Thời gian cập nhật**: 2026-10-13

---

## 2. Các task đã hoàn thành (Completed Tasks)

- [x] **Khởi tạo nền tảng (Phase 0)**:
  - Next.js 16.4.0 (Turbopack, App Router, TypeScript strict mode, Tailwind CSS v4).
  - Cấu trúc thư mục chuẩn theo `CLAUDE.md`: `src/types`, `src/services`, `src/database`, `src/components/{foh, kds, cashier, erp, admin, ui}`, `src/lib`.
  - Schema types đầy đủ cho Table, Category, MenuItem, Order, OrderItem, RawMaterial, BOM, User, StoreSettings, Supplier, PurchaseOrder, Promotion.
  - Event Bus Realtime (`src/services/realtimeEngine.ts`) với BroadcastChannel `pos_realtime_events`.
  - Dữ liệu mẫu phong phú (`src/database/mockData.ts`).
  - Tiện ích định dạng tiền VND và thời gian (`src/lib/utils.ts`).

- [x] **Module 1: Front-of-House (FOH) Menu & Order Flow**:
  - `CategoryNav`, `MenuCard`, `MenuGrid`, `ModifierModal`, `TableSelector`, `CartSidebar`, `FOHView`.
  - Phát sự kiện `ORDER_CREATED` và lưu trữ qua `orderService`.
  - **Tối ưu Mobile Waiter Order**: Header bổ sung badge chọn bàn nhanh, nút mở Cart Drawer nổi bật, thao tác 1 chạm trên điện thoại di động.

- [x] **Module 2: Kitchen & Bar Display System (KDS & BDS Real-Time Kanban Board)**:
  - Trang `/kds` & Tab KDS in-app tối ưu màn hình ngang Desktop / Tablet (iPad landscape).
  - Bóc tách trạm Bếp (`kitchen`) và Bar (`bar`) tự động.
  - Kanban 3 cột: "Chờ xử lý" -> "Đang làm" -> "Hoàn thành".
  - Thẻ vé KDS với bộ đếm thời gian thực và cảnh báo khẩn cấp (>8m, >15m).
  - Web Audio API âm thanh chuông đôi (Chime) khi có order mới, không phụ thuộc file mp3 ngoài.
  - Tối ưu layout cuộn mượt mà trên Tablet xoay ngang hoặc xoay dọc.

- [x] **Module 3: Phân hệ Thu ngân & Quản lý Bàn (Cashier & Table Management)**:
  - Sơ đồ bàn trực quan (`TableMap.tsx`) với 4 màu trạng thái (Trống, Đang dùng, Chờ tính tiền, Đã đặt).
  - Cổng thanh toán đa kênh (`CheckoutPanel.tsx`): Tiền mặt có tính tiền thối lại, Dynamic VietQR (`VietQRCode.tsx`), Thẻ POS.
  - Luồng thanh toán ACID: chuyển order thành `completed`, giải phóng bàn về `available`, phát sự kiện `PAYMENT_COMPLETED`.
  - Hóa đơn in nhiệt khổ K80 chuẩn 80mm (`ReceiptModal.tsx`) với hỗ trợ in `window.print()`.
  - Tối ưu layout Tablet: side-by-side song song trên màn hình ngang, overlay drawer tiện lợi trên màn hình dọc.

- [x] **Module 4: ERP & Recipe BOM Auto-Deduct (Quản trị Kho & Định mức)**:
  - Trang `/erp` & Tab Kho in-app: Tồn kho (`InventoryTab.tsx`), Định mức (`RecipeBOMTab.tsx`), Nhập hàng (`ProcurementTab.tsx`).
  - Phân tích tài chính COGS & Biên lợi nhuận gộp Gross Profit Margin % cho từng món.
  - Bảng cảnh báo nhấp nháy `Low Stock` khi chạm ngưỡng tối thiểu.
  - Luồng ACID Auto-Deduct: tự động trừ tồn kho theo BOM khi nhận `PAYMENT_COMPLETED`, ghi log `InventoryTransactions` loại `'out'`.

- [x] **Module 5: Admin Dashboard, Thống kê Doanh thu & Phân quyền HR RBAC**:
  - **Trang `/admin` & Tab Quản Trị in-app**:
    - **Executive Dashboard (`DashboardTab.tsx`)**: 4 KPI cards động, 2 biểu đồ Recharts (cột doanh thu theo giờ & donut tỷ trọng thanh toán), bảng xếp hạng Top 5 món bán chạy nhất.
    - **Quản lý Khuyến Mãi (`PromotionsTab.tsx`)**: Quản lý Voucher, Modal tạo khuyến mãi mới.
    - **Nhân Sự & Phân Quyền (`HRTab.tsx`)**: Quản lý tài khoản, gán quyền RBAC (Admin, Manager, Cashier, Chef, Barista, Waiter), Khóa/Mở tài khoản.
    - **Cấu hình Cửa hàng (`StoreSettingsTab.tsx`)**: Tên thương hiệu, VAT, Thông tin tài khoản ngân hàng VietQR, Wifi in trên bill.

- [x] **Quy Hoạch Quản Trị Dữ Liệu & Thực Đơn Tập Trung (Admin-Only Data Management)**:
  - **Tách biệt vai trò**: Đã xóa bỏ hoàn toàn các nút/modal "Thêm món mới" khỏi giao diện FOH (`/`). Giao diện FOH giữ đúng chức năng thuần túy cho Waiter & Khách gọi món.
  - **Quản lý thực đơn tại `/admin` (`MenuTab.tsx`)**: Bảng quản lý toàn bộ món ăn (đang bán/tạm ngưng, đổi giá, xóa món, lọc danh mục).
  - **Nâng cấp `AddMenuItemModal.tsx` tại `/admin`**:
    - **Tải ảnh từ thiết bị cục bộ**: Tích hợp `<input type="file" accept="image/*" />` với chuyển đổi Base64 và khung xem trước (Preview) ảnh mượt mà, hiển thị tên file.
    - **Cấu hình Định mức BOM ngay lúc tạo món**: Cho phép chọn nguyên liệu từ kho, nhập định mức tiêu hao, tự động tính giá vốn ước tính (COGS) và Tỷ suất lợi nhuận gộp Gross Margin %; tự động lưu vào `inventoryService.saveRecipeBOM()`.

- [x] **Quản Lý & Thêm Nhanh Nguyên Vật Liệu (Raw Material Management & Quick Add UX)**:
  - **Modal `AddRawMaterialModal.tsx`**: Khai báo đầy đủ tên, nhóm nguyên liệu, đơn vị mua (`purchase_unit`), đơn vị định mức (`recipe_unit`), hệ số quy đổi (`conversion_factor`), giá vốn trung bình và mức tồn kho an toàn tối thiểu.
  - **UX Thêm Nhanh Tại Phiếu Nhập Kho (`ProcurementTab.tsx`)**: Tích hợp nút **"+ Thêm nhanh nguyên liệu mới"** trực tiếp tại ô chọn nguyên liệu của form tạo Purchase Order, tự động chọn nguyên liệu mới vào đơn nhập hàng mà không cần thoát ra ngoài.
  - **Nút "+ Thêm Nguyên Liệu" tại Quản lý Tồn kho (`InventoryTab.tsx`)**: Hỗ trợ quản lý kho chủ động khai báo nguyên liệu mới mọi lúc.

- [x] **Hệ Thống Áp Dụng Khuyến Mãi & Voucher Đa Kênh (Omnichannel Promotions)**:
  - Dịch vụ `promotionService.ts`: xác thực điều kiện giá trị đơn tối thiểu (`min_order_value`), kiểm tra trạng thái kích hoạt, tính toán giảm theo % hoặc số tiền cố định.
  - Tích hợp hộp nhập mã & danh sách Voucher 1 chạm tại **Giỏ hàng FOH (`CartSidebar.tsx`)**: khách/waiter có thể nhập mã voucher (như `OPEN10`, `VIP50K`) hoặc bấm chọn nhanh các ưu đãi đang có, tự động trừ tiền chiết khấu và lưu vào đơn hàng.
  - Tích hợp tại **Màn hình Thu Ngân (`CheckoutPanel.tsx`)**: thu ngân có thể áp dụng voucher của quán, nhập mã ưu đãi khách mang đến hoặc chiết khấu % thủ công.
  - Hóa đơn in nhiệt K80 (`ReceiptModal.tsx`) tự động in dòng chiết khấu ưu đãi rõ ràng.

- [x] **Kiểm thử Liên thông End-to-End (E2E Simulation Flow) & UI Runner**:
  - Dịch vụ kịch bản tự động `src/services/e2eSimulation.ts`: Giả lập khép kín 5 bước: Khách gọi món -> KDS nhận vé & reo chuông -> Bếp/Bar hoàn tất ra món -> Thu ngân quét VietQR tính tiền -> ERP trừ bột cafe & thịt bò -> Dashboard nảy số doanh thu.
  - UI Component `src/components/ui/E2ESimulationModal.tsx`: Nút "⚡ Giả Lập E2E" trên thanh điều hướng chính, thanh tiến trình mô phỏng 0-100%, timeline từng bước trực quan, nút mở nhanh 4 tab độc lập (`/`, `/kds`, `/cashier`, `/admin`).

- [x] **Kế hoạch Chuyển Đổi Database Thật (`DATABASE_MIGRATION.md`)**:
  - Tài liệu chi tiết [DATABASE_MIGRATION.md](file:///e:/Vibe%20Coding/POS/DATABASE_MIGRATION.md) gồm:
    - Sơ đồ quan hệ ERD thực tế.
    - Bộ câu lệnh SQL DDL đầy đủ (UUID, ENUMs, 9 bảng, Foreign Keys, Indexes, Constraints).
    - Stored Procedure & Trigger PostgreSQL ACID: `fn_handle_order_payment_and_deduct_stock()` tự động trừ tồn kho BOM và giải phóng bàn khi đơn chuyển sang `paid`.
    - Cấu hình Supabase Realtime Publication (`supabase_realtime`).
    - Row Level Security (RLS) policies bảo mật đa vai trò.

---

## 3. Cấu trúc thư mục hiện tại
```
POS/
├── .agents/                    # Bộ quy chuẩn Superpowers & Skills
├── public/                     # Tài nguyên tĩnh
├── src/
│   ├── app/                    # Next.js App Router (page.tsx, kds/, cashier/, erp/, admin/, layout.tsx, globals.css)
│   ├── components/
│   │   ├── admin/              # Module 5: COMPLETED (DashboardTab, PromotionsTab, HRTab, StoreSettingsTab, AdminView)
│   │   ├── cashier/            # Module 3: COMPLETED (TableMap, CheckoutPanel, VietQRCode, ReceiptModal, CashierView)
│   │   ├── erp/                # Module 4: COMPLETED (InventoryTab, RecipeBOMTab, ProcurementTab, ERPView)
│   │   ├── foh/                # Module 1: COMPLETED (CategoryNav, MenuCard, MenuGrid, ModifierModal, TableSelector, CartSidebar, FOHView)
│   │   ├── kds/                # Module 2: COMPLETED (KDSTicketCard, KDSKanbanBoard, KDSView)
│   │   └── ui/                 # E2ESimulationModal.tsx, UI dialogs
│   ├── database/               # mockData.ts (tables, categories, menuItems, rawMaterials, recipes, suppliers, purchaseOrders, users, promotions, settings)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # utils.ts, audioAlert.ts (Web Audio chime generator)
│   ├── services/               # realtimeEngine.ts, orderService.ts, inventoryService.ts, adminService.ts, e2eSimulation.ts
│   └── types/                  # index.ts (Data models & interfaces)
├── CLAUDE.md                   # Đặc tả nghiệp vụ & yêu cầu kiến trúc gốc
├── STATE.md                    # BỘ NHỚ NGẮN HẠN CỦA DỰ ÁN (Phase 1 COMPLETED)
├── DATABASE_MIGRATION.md       # LƯỢC ĐỒ & SQL SCRIPT CHUYỂN ĐỔI POSTGRESQL / SUPABASE
└── package.json
```

---

## 4. Các task tiếp theo cần làm (Phase 2 Roadmap)
1. Kết nối Backend API thật với Supabase Cloud Project (chạy file migration trong `DATABASE_MIGRATION.md`).
2. Tích hợp Webhook đồng bộ biến động số dư ngân hàng tự động (Cass.vn / SePay / PayOS API) cho cổng VietQR.
3. Đóng gói PWA (Progressive Web App) hỗ trợ cài đặt trên Tablet/Điện thoại và máy in Bluetooth/LAN.

---

## 5. Luật vận hành (Agent Working Rules)
- **Trước mỗi câu lệnh mới**: Luôn đọc `STATE.md` để nắm bắt ngay hiện trạng và quyết định kỹ thuật, không đọc lại toàn bộ code để tiết kiệm token.
- **Sau mỗi tính năng/task**: Tự động cập nhật `STATE.md`.
- **Kỷ luật chất lượng**: Tuân thủ TDD, modular components, phong cách giao diện hiện đại và an toàn dữ liệu.
