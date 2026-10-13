# STATE.md - Bộ nhớ ngắn hạn dự án Smart Restaurant POS

> **Mục đích**: Lưu trữ trạng thái ngữ cảnh, các quyết định kiến trúc và lộ trình triển khai của hệ thống POS Nhà Hàng Thông Minh. Tệp này được tự động cập nhật sau mỗi tính năng/module hoàn thành để tối ưu hóa tokens & context window.

---

## 1. Trạng thái hiện tại (Project Status)
* **Trạng thái tổng thể**: Hoàn thành Module 1 (Front-of-House Order Menu & Cart) - Chuyển sang Module 2 (KDS / Kitchen & Bar Display System)
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
  - `CategoryNav`: Thanh điều hướng phân loại món ăn (icon + pill buttons), tìm kiếm tức thì theo từ khóa, lọc theo trạm trù (Tất cả / Bếp / Quầy Bar).
  - `MenuCard`: Grid thẻ món ăn trực quan (ảnh, tên, giá VND, badge Bếp/Bar, trạng thái Còn/Hết món, nút tùy biến).
  - `MenuGrid`: Lưới thẻ responsive tự động co giãn theo kích thước màn hình với Empty state khi tìm kiếm không khớp.
  - `ModifierModal`: Hộp thoại tùy chọn đa dạng:
    - Nhóm tùy biến đơn (Radio) cho Độ chín / Mức đường / Mức đá.
    - Nhóm tùy biến bổ sung (Checkbox) cho Topping kèm phụ thu giá.
    - Nhập ghi chú riêng cho đầu bếp/pha chế.
    - Bộ đếm số lượng (+/-) và tính nhẩm tổng tiền tức thì.
  - `TableSelector`: Dropdown trực quan hiển thị danh sách bàn kèm trạng thái (Trống / Đang phục vụ / Chờ thanh toán) và số chỗ.
  - `CartSidebar`:
    - Quản lý giỏ hàng: Tên món, options, ghi chú, đơn giá, số lượng, xóa từng món, xóa tất cả.
    - Tóm tắt hóa đơn: Tạm tính, Thuế VAT 8%, Tổng thanh toán.
    - Nút "GỬI ORDER XUỐNG BẾP / BAR": Kiểm tra điều kiện (phải chọn bàn và giỏ không rỗng), sinh mã đơn hàng, cập nhật bàn sang trạng thái `occupied`.
    - Phát (emit) sự kiện `ORDER_CREATED` qua `realtimeEngine` và lưu vào `orderService`.
    - Modal popup thông báo gửi order thành công kèm chi tiết mã đơn.
  - `FOHView`: Layout chuẩn POS với cột trái hiển thị Menu + Lọc, cột phải cố định giỏ hàng trên desktop, hỗ trợ Drawer giỏ hàng nổi trên mobile/tablet.
  - Tích hợp điều hướng module tại thanh Navigation chính của ứng dụng (`src/app/page.tsx`).
  - Biên dịch kiểm tra tĩnh (`npm run build`) hoàn tất 100% không phát sinh lỗi.

---

## 3. Task đang làm hiện tại (WIP)
* **WIP**: **Module 2: Màn Hình Bếp & Quầy Bar (Kitchen / Bar Display System - KDS & BDS)**
  - Xây dựng giao diện KDS Board nhận order thời gian thực không cần tải lại trang (lắng nghe sự kiện `ORDER_CREATED` qua `pos_realtime_events`).
  - Bộ lọc định tuyến trạm (Station Routing): Tab Bếp (chỉ nhận món ăn `kitchen`), Tab Bar (chỉ nhận thức uống `bar`), Tab Tổng hợp (All).
  - Thẻ Order Card KDS: Hiển thị số bàn, mã đơn, thời gian gọi món (Time elapsed đếm phút), chi tiết món kèm Topping & Ghi chú của khách.
  - Tương tác trạng thái món: Nút chuyển đổi trạng thái "Đang làm" (Cooking) -> "Hoàn thành" (Ready) -> phát sự kiện `ITEM_STATUS_CHANGED` / `ORDER_STATUS_CHANGED`.
  - Hiệu ứng âm thanh thông báo chuông (Audio alert / Web Audio API) khi có order mới đổ về trạm.

---

## 4. Các quyết định kỹ thuật quan trọng & Cấu trúc thư mục đã chốt

### 4.1. Kiến trúc & Công nghệ (Tech Stack)
* **Next.js 16.4.0 + Turbopack + React 19 + TypeScript + Tailwind CSS v4**.
* **Order Persistence & State Layer**: `src/services/orderService.ts` quản lý dữ liệu đơn hàng và bàn ăn (localStorage / in-memory), tự động đồng bộ qua `realtimeEngine`.
* **Cơ chế Real-time Events**:
  - BroadcastChannel `pos_realtime_events` hỗ trợ giao tiếp cross-tab đa màn hình (màn hình FOH gửi đơn -> tab KDS Bếp nhận tức thì không giật lag).
  - Các sự kiện: `ORDER_CREATED`, `ORDER_STATUS_CHANGED`, `ITEM_STATUS_CHANGED`, `TABLE_STATUS_CHANGED`, `PAYMENT_COMPLETED`.
* **Quy tắc phân trạm (Routing)**:
  - Món trạm `kitchen` -> Bếp chính chế biến.
  - Món trạm `bar` -> Quầy pha chế xử lý.

### 4.2. Cấu trúc thư mục hiện tại
```
POS/
├── .agents/                    # Bộ quy chuẩn Superpowers & Skills
├── public/                     # Tài nguyên tĩnh
├── src/
│   ├── app/                    # Next.js App Router (page.tsx, layout.tsx, globals.css)
│   ├── components/
│   │   ├── admin/              # Module 5: Settings, HR/RBAC, Promotions
│   │   ├── cashier/            # Module 3: Table map, billing, VietQR
│   │   ├── erp/                # Module 4: Raw materials, BOM recipe
│   │   ├── foh/                # Module 1: COMPLETED (CategoryNav, MenuCard, MenuGrid, ModifierModal, TableSelector, CartSidebar, FOHView)
│   │   ├── kds/                # Module 2: WIP (Kitchen & Bar Display System)
│   │   └── ui/                 # Atomic UI components
│   ├── database/               # mockData.ts
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # utils.ts (formatCurrencyVND, formatDateTime, formatTimeAgo)
│   ├── services/               # realtimeEngine.ts, orderService.ts
│   └── types/                  # index.ts (Data models & interfaces)
├── CLAUDE.md                   # Đặc tả nghiệp vụ & yêu cầu kiến trúc gốc
├── STATE.md                    # BỘ NHỚ NGẮN HẠN CỦA DỰ ÁN
└── package.json
```

---

## 5. Các task tiếp theo cần làm (Backlog / Next Steps)
1. **Module 2 (WIP)**: Kitchen & Bar Display System (KDS/BDS) Real-time Board & Audio Alerts.
2. **Module 3**: Cashier & Table Management (Sơ đồ bàn, Thu ngân, VietQR động, In bill).
3. **Module 4**: ERP & Recipe BOM Auto-Deduct (Định mức nguyên liệu, trừ tồn kho tự động sau thanh toán ACID).
4. **Module 5**: Admin Dashboard, Thống kê doanh thu & Phân quyền RBAC.

---

## 6. Luật vận hành (Agent Working Rules)
- **Trước mỗi câu lệnh mới**: Luôn đọc `STATE.md` để nắm bắt ngay hiện trạng và quyết định kỹ thuật, không đọc lại toàn bộ code để tiết kiệm token.
- **Sau mỗi tính năng/task**: Tự động cập nhật `STATE.md` (đánh dấu hoàn thành, ghi lại WIP và các thay đổi quan trọng).
- **Kỷ luật chất lượng**: Tuân thủ TDD, modular components, phong cách giao diện hiện đại và an toàn dữ liệu.
