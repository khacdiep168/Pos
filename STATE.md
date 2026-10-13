# STATE.md - Bộ nhớ ngắn hạn dự án Smart Restaurant POS

> **Mục đích**: Lưu trữ trạng thái ngữ cảnh, các quyết định kiến trúc và lộ trình triển khai của hệ thống POS Nhà Hàng Thông Minh. Tệp này được tự động cập nhật sau mỗi tính năng/module hoàn thành để tối ưu hóa tokens & context window.

---

## 1. Trạng thái hiện tại (Project Status)
* **Trạng thái tổng thể**: Hoàn thành Module 1 (FOH), Module 2 (KDS/BDS) & Module 3 (Cashier Desk & Table Management) - Chuyển sang Module 4 (ERP & Recipe BOM Auto-Deduct)
* **Thời gian cập nhật**: 2026-10-13

---

## 2. Các task đã hoàn thành (Completed Tasks)
- [x] **Khởi tạo nền tảng (Phase 0)**:
  - Next.js 16.4.0 (Turbopack, App Router, TypeScript strict mode, Tailwind CSS v4).
  - Cấu trúc thư mục chuẩn theo `CLAUDE.md`: `src/types`, `src/services`, `src/database`, `src/components/{foh, kds, cashier, erp, admin, ui}`, `src/lib`.
  - Schema types đầy đủ cho Table, Category, MenuItem, Order, OrderItem, RawMaterial, BOM, User, StoreSettings.
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
  - **Trang `/cashier` & Tab Thu Ngân in-app**:
    - Header thống kê doanh thu ca làm việc thời gian thực (`shiftRevenue`) và số lượng bill đã thanh toán.
  - **Sơ đồ bàn trực quan ([`TableMap.tsx`](file:///e:/Vibe%20Coding/POS/src/components/cashier/TableMap.tsx))**:
    - Hiển thị màu sắc trạng thái rõ ràng: Bàn trống (Xanh lá), Đang phục vụ (Vàng/Cam), Chờ tính tiền (Đỏ nhấp nháy), Đã đặt (Tím).
    - Bộ lọc nhanh theo trạng thái bàn kèm số lượng thống kê.
    - Hiển thị mã đơn, số lượng món và tổng tiền tạm tính trực tiếp trên thẻ bàn.
    - Lắng nghe sự kiện `ORDER_CREATED`, `ORDER_UPDATED`, `TABLE_STATUS_CHANGED`, `PAYMENT_COMPLETED` để tự động chuyển màu bàn tức thì.
  - **Cổng thanh toán đa kênh ([`CheckoutPanel.tsx`](file:///e:/Vibe%20Coding/POS/src/components/cashier/CheckoutPanel.tsx))**:
    - Mở chi tiết hóa đơn khi thu ngân click vào bàn có khách: danh sách món, topping, số lượng, đơn giá, tạm tính, thuế VAT 8%.
    - Bộ chiết khấu / giảm giá linh hoạt (0%, 5%, 10%, 15%).
    - Đa phương thức thanh toán:
      - **Tiền mặt (Cash)**: Ô nhập tiền khách đưa, tính tiền thối lại tự động, phím chọn nhanh mệnh giá (100k, 200k, 500k, 1tr, Đủ tiền).
      - **Chuyển khoản VietQR ([`VietQRCode.tsx`](file:///e:/Vibe%20Coding/POS/src/components/cashier/VietQRCode.tsx))**: Tạo mã Dynamic QR theo chuẩn VietQR QuickLink (MBBank/0901234567) chứa chính xác số tiền và nội dung chuyển khoản tự động; hỗ trợ nút sao chép nhanh STK, số tiền, nội dung.
      - **Thẻ POS / Ngân hàng**: Hướng dẫn quẹt thẻ chip Napas, Visa, Mastercard.
  - **Mock ACID Transaction Payment Flow**:
    - Bấm "Xác nhận Thanh toán": cập nhật trạng thái đơn thành `completed`, giải phóng bàn về `available` (`current_order_id: undefined`).
    - Phát (emit) sự kiện `PAYMENT_COMPLETED` và `TABLE_STATUS_CHANGED` qua `pos_realtime_events`.
  - **Hóa đơn in nhiệt 80mm ([`ReceiptModal.tsx`](file:///e:/Vibe%20Coding/POS/src/components/cashier/ReceiptModal.tsx))**:
    - Giao diện chuẩn bill in nhiệt nhà hàng: Thông tin quán, số hóa đơn, giờ in, bàn, thu ngân, bảng món, chiết khấu, VAT, tổng tiền, tiền khách đưa/tiền thừa, barcode mô phỏng và hỗ trợ lệnh `window.print()`.
  - Biên dịch kiểm tra tĩnh (`npm run build`) hoàn tất 100% sinh các routes `/`, `/kds`, `/cashier`.

---

## 3. Task đang làm hiện tại (WIP)
* **WIP**: **Module 4: ERP & Recipe BOM Auto-Deduct (Quản trị Kho & Định mức nguyên vật liệu)**
  - Quản lý danh mục nguyên vật liệu (`RawMaterials`): Đơn vị mua (`purchase_unit`: kg, lít), Đơn vị định mức (`recipe_unit`: gram, ml), Hệ số quy đổi (`conversion_factor`), Tồn kho hiện tại, Mức tồn kho an toàn, Giá vốn trung bình (`avg_cost`).
  - Thiết lập Định mức món ăn (`Recipe BOM`): Gắn các nguyên vật liệu và số lượng cần thiết cho từng món trong thực đơn (VD: Bò Wagyu tiêu đen -> 200g Thịt bò Wagyu, 15g Hạt tiêu đen...).
  - ACID Trigger trừ kho tự động (Auto-deduct): Ngay khi sự kiện `PAYMENT_COMPLETED` kích hoạt, tự động quét định mức BOM của toàn bộ món trong đơn hàng và ghi nhận giao dịch xuất kho (`InventoryTransactions: type = 'out'`).
  - Bảng cảnh báo nguyên vật liệu chạm ngưỡng tồn kho tối thiểu (Low Stock Alert).
  - Quản lý phiếu nhập kho (`PurchaseOrders`) và nhà cung cấp (`Suppliers`), tự động tính lại Moving Average Cost.

---

## 4. Các quyết định kỹ thuật quan trọng & Cấu trúc thư mục đã chốt

### 4.1. Kiến trúc & Công nghệ (Tech Stack)
* **Next.js 16.4.0 + Turbopack + React 19 + TypeScript + Tailwind CSS v4**.
* **Omnichannel Payment & VietQR**: Sinh Dynamic VietQR qua API chuẩn `https://img.vietqr.io/image/...` hỗ trợ quét bởi 40+ app ngân hàng và ví điện tử Việt Nam.
* **Thermal Receipt Format**: CSS `@media print` tối ưu cho máy in nhiệt khổ K80 (80mm).
* **Cross-Tab Real-time Synchronizer**:
  - `pos_realtime_events` kết nối 3 phân hệ cốt lõi:
    - Tab 1: FOH (`/`) chọn bàn và gửi món -> Bàn chuyển sang vàng cam.
    - Tab 2: KDS (`/kds`) kêu chuông bíp và nhảy thẻ vào Kanban.
    - Tab 3: Thu ngân (`/cashier`) thấy bàn có khách, mở tính tiền, thanh toán xong -> bàn đổi lại màu xanh trống trên cả 3 màn hình.

### 4.2. Cấu trúc thư mục hiện tại
```
POS/
├── .agents/                    # Bộ quy chuẩn Superpowers & Skills
├── public/                     # Tài nguyên tĩnh
├── src/
│   ├── app/                    # Next.js App Router (page.tsx, kds/page.tsx, cashier/page.tsx, layout.tsx, globals.css)
│   ├── components/
│   │   ├── admin/              # Module 5: Settings, HR/RBAC, Promotions
│   │   ├── cashier/            # Module 3: COMPLETED (TableMap, CheckoutPanel, VietQRCode, ReceiptModal, CashierView)
│   │   ├── erp/                # Module 4: WIP (Raw materials, BOM recipe, auto-deduct)
│   │   ├── foh/                # Module 1: COMPLETED (CategoryNav, MenuCard, MenuGrid, ModifierModal, TableSelector, CartSidebar, FOHView)
│   │   ├── kds/                # Module 2: COMPLETED (KDSTicketCard, KDSKanbanBoard, KDSView)
│   │   └── ui/                 # Atomic UI components
│   ├── database/               # mockData.ts
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # utils.ts, audioAlert.ts (Web Audio chime generator)
│   ├── services/               # realtimeEngine.ts, orderService.ts
│   └── types/                  # index.ts (Data models & interfaces)
├── CLAUDE.md                   # Đặc tả nghiệp vụ & yêu cầu kiến trúc gốc
├── STATE.md                    # BỘ NHỚ NGẮN HẠN CỦA DỰ ÁN
└── package.json
```

---

## 5. Các task tiếp theo cần làm (Backlog / Next Steps)
1. **Module 4 (WIP)**: ERP & Recipe BOM Auto-Deduct (Định mức nguyên liệu, trừ tồn kho tự động sau thanh toán ACID).
2. **Module 5**: Admin Dashboard, Thống kê doanh thu & Phân quyền RBAC.

---

## 6. Luật vận hành (Agent Working Rules)
- **Trước mỗi câu lệnh mới**: Luôn đọc `STATE.md` để nắm bắt ngay hiện trạng và quyết định kỹ thuật, không đọc lại toàn bộ code để tiết kiệm token.
- **Sau mỗi tính năng/task**: Tự động cập nhật `STATE.md` (đánh dấu hoàn thành, ghi lại WIP và các thay đổi quan trọng).
- **Kỷ luật chất lượng**: Tuân thủ TDD, modular components, phong cách giao diện hiện đại và an toàn dữ liệu.
