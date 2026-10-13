# STATE.md - Bộ nhớ ngắn hạn dự án Smart Restaurant POS

> **Mục đích**: Lưu trữ trạng thái ngữ cảnh, các quyết định kiến trúc và lộ trình triển khai của hệ thống POS Nhà Hàng Thông Minh. Tệp này được tự động cập nhật sau mỗi tính năng/module hoàn thành để tối ưu hóa tokens & context window.

---

## 1. Trạng thái hiện tại (Project Status)
* **Trạng thái tổng thể**: Hoàn thành toàn diện 5 Phân hệ cốt lõi (Module 1 FOH, Module 2 KDS/BDS, Module 3 Cashier, Module 4 ERP, Module 5 Admin) - Sẵn sàng cho Kiểm thử liên thông End-to-End
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
  - Trang `/erp` & Tab Kho in-app: Tồn kho (`InventoryTab.tsx`), Định mức (`RecipeBOMTab.tsx`), Nhập hàng (`ProcurementTab.tsx`).
  - Phân tích tài chính COGS & Biên lợi nhuận gộp Gross Profit Margin % cho từng món.
  - Bảng cảnh báo nhấp nháy `Low Stock` khi chạm ngưỡng tối thiểu.
  - Luồng ACID Auto-Deduct: tự động trừ tồn kho theo BOM khi nhận `PAYMENT_COMPLETED`, ghi log `InventoryTransactions` loại `'out'`.
- [x] **Module 5: Admin Dashboard, Thống kê Doanh thu & Phân quyền HR RBAC**:
  - **Trang `/admin` & Tab Quản Trị in-app**: Sidebar điều hướng 4 phân hệ quản lý:
    - **Executive Dashboard (`DashboardTab.tsx`)**:
      - 4 thẻ KPI động: Doanh thu thực tế, Số lượng đơn hàng, Giá trị trung bình mỗi đơn (AOV), Cảnh báo nguyên liệu thiếu hàng.
      - 2 biểu đồ trực quan Recharts: Biểu đồ cột phân bố doanh thu theo khung giờ trong ngày và Biểu đồ tròn/Donut tỷ trọng các kênh thanh toán (VietQR, Tiền mặt, Thẻ).
      - Bảng xếp hạng Top 5 món ăn bán chạy nhất (Best Sellers) kèm hình ảnh, trạm, số lượng đã bán và tổng doanh thu.
    - **Quản lý Khuyến Mãi (`PromotionsTab.tsx`)**:
      - Danh sách Voucher: Mã giảm giá, Loại giảm (% hoặc số tiền), Giá trị, Đơn tối thiểu, Thao tác Bật/Tắt và Xóa.
      - Modal tạo chương trình khuyến mãi mới.
    - **Nhân Sự & Phân Quyền (`HRTab.tsx`)**:
      - Danh sách tài khoản nhân viên kèm badge vai trò chuẩn RBAC: `Admin`, `Manager`, `Cashier`, `Kitchen`, `Bar`, `Waiter`.
      - Nút chuyển đổi trạng thái Hoạt động / Khóa tài khoản.
      - Modal tạo tài khoản nhân sự mới gán quyền hệ thống.
    - **Cấu hình Cửa hàng (`StoreSettingsTab.tsx`)**:
      - Form quản lý thông tin nhà hàng: Tên thương hiệu, Logo URL, Địa chỉ, Hotline, Khung giờ hoạt động, Thuế suất VAT (%), và Mật khẩu Wifi cho khách (tự động đồng bộ sang hóa đơn in nhiệt 80mm).
  - Biên dịch kiểm tra tĩnh (`npm run build`) hoàn tất 100% sinh các routes `/`, `/kds`, `/cashier`, `/erp`, `/admin`.

---

## 3. Task đang làm hiện tại (WIP)
* **WIP**: **Kiểm thử liên thông End-to-End toàn diện (E2E Multi-Display Flow)**
  - Xác thực luồng nghiệp vụ khép kín:
    1. Khách/Phục vụ gọi món tại FOH (`/`), chọn bàn, tùy chỉnh topping -> Bấm gửi Order -> Bàn chuyển sang vàng cam.
    2. Màn hình Bếp/Bar KDS (`/kds`) kêu chuông bíp, tự bóc tách món ăn về thẻ Bếp và nước về thẻ Bar -> Đầu bếp nhận làm -> Bấm hoàn thành.
    3. Thu ngân tại Cashier (`/cashier`) thấy bàn có khách -> Mở thanh toán -> Quét VietQR động / Nhận tiền mặt -> Bấm xác nhận thanh toán -> In bill 80mm -> Bàn trở lại màu xanh trống.
    4. Quản trị Kho ERP (`/erp`) tự động trừ tồn kho theo định mức BOM và ghi nhật ký xuất kho `InventoryTransactions`.
    5. Admin Dashboard (`/admin`) cập nhật doanh thu, tỷ trọng kênh thanh toán và xếp hạng Best Sellers theo thời gian thực.

---

## 4. Các quyết định kỹ thuật quan trọng & Cấu trúc thư mục đã chốt

### 4.1. Kiến trúc & Công nghệ (Tech Stack)
* **Next.js 16.4.0 + Turbopack + React 19 + TypeScript + Tailwind CSS v4 + Recharts**.
* **Omnichannel POS Architecture**:
  - Giao tiếp thời gian thực không độ trễ giữa các tab/thiết bị qua `BroadcastChannel` (`pos_realtime_events`).
  - Hỗ trợ thanh toán VietQR động theo chuẩn QuickLink liên ngân hàng.
  - Hóa đơn nhiệt chuẩn K80 tương thích máy in hóa đơn.
  - Định mức nguyên liệu BOM và trừ kho tự động khi hoàn tất giao dịch tài chính.

### 4.2. Cấu trúc thư mục hiện tại
```
POS/
├── .agents/                    # Bộ quy chuẩn Superpowers & Skills
├── public/                     # Tài nguyên tĩnh
├── src/
│   ├── app/                    # Next.js App Router (page.tsx, kds/page.tsx, cashier/page.tsx, erp/page.tsx, admin/page.tsx, layout.tsx, globals.css)
│   ├── components/
│   │   ├── admin/              # Module 5: COMPLETED (DashboardTab, PromotionsTab, HRTab, StoreSettingsTab, AdminView)
│   │   ├── cashier/            # Module 3: COMPLETED (TableMap, CheckoutPanel, VietQRCode, ReceiptModal, CashierView)
│   │   ├── erp/                # Module 4: COMPLETED (InventoryTab, RecipeBOMTab, ProcurementTab, ERPView)
│   │   ├── foh/                # Module 1: COMPLETED (CategoryNav, MenuCard, MenuGrid, ModifierModal, TableSelector, CartSidebar, FOHView)
│   │   ├── kds/                # Module 2: COMPLETED (KDSTicketCard, KDSKanbanBoard, KDSView)
│   │   └── ui/                 # Atomic UI components
│   ├── database/               # mockData.ts (tables, categories, menuItems, rawMaterials, recipes, suppliers, purchaseOrders, users, promotions, settings)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # utils.ts, audioAlert.ts (Web Audio chime generator)
│   ├── services/               # realtimeEngine.ts, orderService.ts, inventoryService.ts, adminService.ts
│   └── types/                  # index.ts (Data models & interfaces)
├── CLAUDE.md                   # Đặc tả nghiệp vụ & yêu cầu kiến trúc gốc
├── STATE.md                    # BỘ NHỚ NGẮN HẠN CỦA DỰ ÁN
└── package.json
```

---

## 5. Các task tiếp theo cần làm (Backlog / Next Steps)
1. **Kiểm thử liên thông End-to-End toàn diện (WIP)**: Chạy thử toàn bộ luồng nghiệp vụ trên nhiều tab trình duyệt song song.
2. Tối ưu hóa UI/UX và chuẩn bị triển khai Backend API thật (PostgreSQL / Supabase Realtime).

---

## 6. Luật vận hành (Agent Working Rules)
- **Trước mỗi câu lệnh mới**: Luôn đọc `STATE.md` để nắm bắt ngay hiện trạng và quyết định kỹ thuật, không đọc lại toàn bộ code để tiết kiệm token.
- **Sau mỗi tính năng/task**: Tự động cập nhật `STATE.md` (đánh dấu hoàn thành, ghi lại WIP và các thay đổi quan trọng).
- **Kỷ luật chất lượng**: Tuân thủ TDD, modular components, phong cách giao diện hiện đại và an toàn dữ liệu.
