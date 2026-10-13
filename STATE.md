# STATE.md - Bộ nhớ ngắn hạn dự án Smart Restaurant POS

> **Mục đích**: Lưu trữ trạng thái ngữ cảnh, các quyết định kiến trúc và lộ trình triển khai của hệ thống POS Nhà Hàng Thông Minh. Tệp này được tự động cập nhật sau mỗi tính năng/module hoàn thành để tối ưu hóa tokens & context window.

---

## 1. Trạng thái hiện tại (Project Status)
* **Trạng thái tổng thể**: Hoàn thành Module 1 (FOH) & Module 2 (KDS/BDS Real-time Kanban) - Chuyển sang Module 3 (Cashier Desk & Table Management)
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
  - **Trang `/kds` & Tab KDS in-app**: Xây dựng màn hình ngang tối ưu cho Desktop / Tablet hiển thị trong bếp hoặc quầy pha chế.
  - **Bóc tách trạm tự động (Station Splitting)**:
    - Khi nhận order mới qua `ORDER_CREATED`, hệ thống tự động tách nhóm: món ăn trạm `kitchen` đổ về thẻ Bếp, đồ uống trạm `bar` đổ về thẻ Bar.
  - **3 cột Kanban chuẩn quy trình**:
    - "CHỜ XỬ LÝ (MỚI)" (`pending`): Đón nhận đơn mới, có nút "BẮT ĐẦU CHẾ BIẾN".
    - "ĐANG CHẾ BIẾN" (`cooking`): Theo dõi thời gian chờ thực tế, nút "HOÀN TẤT & RA MÓN" hoặc nút hoàn tác.
    - "HOÀN THÀNH & SẴN SÀNG" (`ready`): Món đã xong báo cho nhân viên chạy bàn nhận món.
  - **Thẻ KDS Ticket Card**:
    - Hiển thị số bàn to rõ ràng, mã đơn rút gọn.
    - Bộ đếm thời gian thực (Elapsed timer theo phút) với cảnh báo màu: > 8 phút (vàng), > 15 phút (đỏ nhấp nháy khẩn cấp).
    - Chi tiết món: Tên món, số lượng nổi bật `2x`, Topping/Độ ngọt/Độ đá và Ghi chú riêng của khách.
    - Checkbox tương tác riêng từng món để đầu bếp/bartender gạch đầu dòng khi làm xong từng món.
  - **Âm thanh thông báo chuông (Audio Alert)**:
    - Bộ tạo âm thanh chuẩn Web Audio API (`src/lib/audioAlert.ts`) không phụ thuộc file mp3 bên ngoài, phát chuông đôi 2 âm sắc thanh thoát khi có order mới.
    - Điều khiển bật/tắt chuông (Mute/Unmute) và nút "Thử chuông".
  - **Đồng bộ sự kiện chéo (Cross-Sync)**:
    - Emit sự kiện `ORDER_UPDATED`, `ITEM_STATUS_CHANGED`, `ORDER_STATUS_CHANGED` qua `pos_realtime_events` để màn hình FOH và Thu ngân nắm bắt trạng thái món tức thì.
  - Biên dịch kiểm tra tĩnh (`npm run build`) hoàn tất 100% sinh thành công các route `/` và `/kds`.

---

## 3. Task đang làm hiện tại (WIP)
* **WIP**: **Module 3: Phân hệ Thu ngân & Quản lý Bàn (Cashier & Table Management)**
  - Thiết kế Sơ đồ bàn (Table Management Map) trực quan theo khu vực hoặc dạng lưới: Trạng thái Bàn trống (xanh), Đang phục vụ (vàng cam), Chờ tính tiền (đỏ), Đã đặt (tím).
  - Màn hình Thanh toán (Checkout & Billing):
    - Tổng hợp các món đã gọi của bàn (tổng tiền, giảm giá/khuyến mãi, thuế VAT 8%).
    - Đa phương thức thanh toán: Tiền mặt, Chuyển khoản VietQR động (Dynamic QR có sẵn số tiền & nội dung đơn hàng), Ví điện tử, Thẻ POS.
  - Giao diện Hóa đơn / In bill (Receipt view).
  - Kích hoạt sự kiện `PAYMENT_COMPLETED` và giải phóng bàn ăn (`available`).

---

## 4. Các quyết định kỹ thuật quan trọng & Cấu trúc thư mục đã chốt

### 4.1. Kiến trúc & Công nghệ (Tech Stack)
* **Next.js 16.4.0 + Turbopack + React 19 + TypeScript + Tailwind CSS v4**.
* **Audio Alerts**: Pure Web Audio API synthesized chime (`src/lib/audioAlert.ts`), không phát sinh lỗi 404 mạng.
* **Order & Ticket Routing**:
  - `Order` được bóc tách theo Station (`kitchen` vs `bar`) thành các `KDSTicket` độc lập.
  - Sự kiện `ORDER_CREATED` kích hoạt chuông và đẩy vé vào cột "Chờ xử lý".
  - Chuyển trạng thái vé kích hoạt `ORDER_UPDATED` và `ITEM_STATUS_CHANGED`.
* **Kênh Real-time**: `pos_realtime_events` (BroadcastChannel) đảm bảo đa màn hình (FOH - KDS - Cashier) trên các tab hoặc thiết bị khác nhau tự động đồng bộ 100%.

### 4.2. Cấu trúc thư mục hiện tại
```
POS/
├── .agents/                    # Bộ quy chuẩn Superpowers & Skills
├── public/                     # Tài nguyên tĩnh
├── src/
│   ├── app/                    # Next.js App Router (page.tsx, kds/page.tsx, layout.tsx, globals.css)
│   ├── components/
│   │   ├── admin/              # Module 5: Settings, HR/RBAC, Promotions
│   │   ├── cashier/            # Module 3: WIP (Table map, billing, VietQR, invoice)
│   │   ├── erp/                # Module 4: Raw materials, BOM recipe
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
1. **Module 3 (WIP)**: Cashier Desk, Table Map & Omnichannel Checkout (VietQR động).
2. **Module 4**: ERP & Recipe BOM Auto-Deduct (Định mức nguyên liệu, trừ tồn kho tự động sau thanh toán ACID).
3. **Module 5**: Admin Dashboard, Thống kê doanh thu & Phân quyền RBAC.

---

## 6. Luật vận hành (Agent Working Rules)
- **Trước mỗi câu lệnh mới**: Luôn đọc `STATE.md` để nắm bắt ngay hiện trạng và quyết định kỹ thuật, không đọc lại toàn bộ code để tiết kiệm token.
- **Sau mỗi tính năng/task**: Tự động cập nhật `STATE.md` (đánh dấu hoàn thành, ghi lại WIP và các thay đổi quan trọng).
- **Kỷ luật chất lượng**: Tuân thủ TDD, modular components, phong cách giao diện hiện đại và an toàn dữ liệu.
