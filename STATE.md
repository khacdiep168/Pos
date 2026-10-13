# STATE.md - Bộ nhớ ngắn hạn dự án Smart Restaurant POS

> **Mục đích**: Lưu trữ trạng thái ngữ cảnh, các quyết định kiến trúc và lộ trình triển khai của hệ thống POS Nhà Hàng Thông Minh. Tệp này được tự động cập nhật sau mỗi tính năng/module hoàn thành để tối ưu hóa tokens & context window.

---

## 1. Trạng thái hiện tại (Project Status)
* **Trạng thái tổng thể**: **HOÀN TẤT TOÀN DIỆN PHASE 1, PHASE 1.9 & PHASE 1.10 - NATIVE MOBILE APP REDESIGN** (100% Giao diện Mobile Admin & ERP chuẩn KiotViet App: Bottom Navigation Bar 5 tabs, App Header cố định, Màn hình "Nhiều hơn" Grid App Menu, và Hệ thống Mobile Card List cho Hóa đơn, Khách hàng & Đối tác).
* **Kết quả Build**: `next build` và `npx tsc --noEmit` biên dịch thành công 100% (Turbopack, TypeScript strict mode, 0 lỗi type/lint/prerender).
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

### Nâng Cấp Quản Trị Dữ Liệu & Auto-Calculation (COMPLETED - 13/10/2026):
1. **Chỉnh sửa Món Ăn (Edit Menu Item)**:
   - Tích hợp nút "Sửa" (`Pencil`) trên từng dòng món ăn trong [MenuTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/MenuTab.tsx).
   - Modal [EditMenuItemModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/EditMenuItemModal.tsx) cho phép chỉnh sửa: Tên món, Giá bán, Danh mục, Trạm làm việc (Bếp/Bar), Mô tả, Upload đè ảnh mới (FileReader Base64 preview) và **chỉnh sửa trực tiếp thành phần định mức nguyên liệu (BOM)** kèm tính tự động Giá vốn COGS & Biên lợi nhuận (Gross Margin %).
2. **Chỉnh sửa Nguyên Vật Liệu (Edit Raw Material)**:
   - Tích hợp nút "Sửa" (`Pencil`) trên từng dòng nguyên liệu tại bảng Tồn kho [InventoryTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/InventoryTab.tsx).
   - Modal [EditRawMaterialModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/EditRawMaterialModal.tsx) cho phép cập nhật: Tên nguyên liệu, Phân loại danh mục, Nhà cung cấp, Cặp đơn vị chuẩn hóa, Hệ số quy đổi, Mức tồn an toàn và Giá vốn cơ sở.
3. **Chuẩn Hóa Đơn Vị Tính (Dropdown Selection)**:
   - Xóa bỏ nhập text tự do cho `purchase_unit` và `recipe_unit`.
   - Cung cấp module [unitPresets.ts](file:///e:/Vibe%20Coding/POS/src/lib/unitPresets.ts) với 9 cặp quy chuẩn hệ thống: (Kg - Gram), (Lít - ml), (Chai - ml), (Thùng - Lon), (Hộp - Cái/Miếng), (Bao - Kg), (Gói - Gram), (Quả - Lát), (Cái - Cái).
   - Tự động điền hệ số quy đổi mặc định và khóa đơn vị mua / định mức theo preset đã chọn.
4. **Thuật Toán Tự Động Quy Đổi Giá Vốn (Unit Cost Conversion)**:
   - Triển khai công thức: `avg_cost (đơn vị định mức) = (Tổng tiền / Số lượng mua) / Hệ số quy đổi`.
   - Ví dụ: Mua 2 Kg thịt ba rọi với tổng tiền 230.000 VND => `(230.000 / 2 kg) / 1000 = 115 VND / 1 gram`.
   - [ProcurementTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/ProcurementTab.tsx) cho phép nhập 2 chiều linh hoạt (nhập Tổng tiền hoặc Đơn giá mua), hiển thị box giải thích thuật toán trực quan và lưu giá trị `avg_cost` chuẩn xác vào hệ thống kho.

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

## 4. Trạng Thái Hiện Tại: PHASE 1.5 (Advanced Ops & UX) - COMPLETED (13/10/2026)
Đã hoàn thiện xuất sắc và đồng bộ Real-time 4 hạng mục chuyên sâu:

1. **Sơ đồ Bàn & Khu vực (Zone/Table Management)**:
   - Cập nhật data model `RestaurantTable` thêm `zone_id` và bảng `Zone` (Tầng 1, Tầng 2, Sân vườn, Phòng VIP).
   - Component quản lý danh mục Khu vực & Bàn ăn: [ZoneTableTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/ZoneTableTab.tsx) tích hợp trong `/admin`.
   - Bảng sơ đồ bàn [TableMap.tsx](file:///e:/Vibe%20Coding/POS/src/components/cashier/TableMap.tsx) tại `/cashier` hỗ trợ lọc theo Zone, đếm số bàn có khách theo từng khu vực, giữ nguyên 4 màu trạng thái (Trống, Đang dùng, Chờ tính tiền, Đã đặt).

2. **Nghiệp vụ Vận hành Thu ngân (Cashier & Ops)**:
   - **Chuyển Bàn & Gộp Bàn (Move & Merge)**: [MoveMergeTableModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/cashier/MoveMergeTableModal.tsx) cho phép chuyển order sang bàn trống hoặc gộp chung hóa đơn vào bàn đang có khách, tự động tính lại tổng tiền/món và giải phóng bàn cũ real-time.
   - **Quản lý Ca làm việc (Shift Management)**: [ShiftManagementModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/cashier/ShiftManagementModal.tsx) cho phép Mở ca (nhập tiền mặt ban đầu), theo dõi phân loại doanh thu trong ca (Tiền mặt, VietQR, Thẻ), và Kết ca với đối soát két tiền thực tế, in phiếu Z-Report.

3. **Quản trị Kho nâng cao (Stock Reconciliation)**:
   - Tab kiểm kê định kỳ: [AuditTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/AuditTab.tsx) tích hợp trong `/erp`.
   - Cho phép thủ kho nhập số lượng thực tế đếm tay, hệ thống tự động so sánh với `current_stock` sổ sách để tính độ chênh lệch và giá trị chênh lệch.
   - Khi xác nhận, tự động cân bằng lại kho và sinh lịch sử `InventoryTransaction` (loại `adjustment`, reference `audit`).

4. **Trải nghiệm Khách hàng (Self-Ordering QR Web App)**:
   - Route Mobile-First: [src/app/menu/[tableId]/page.tsx](file:///e:/Vibe%20Coding/POS/src/app/menu/%5BtableId%5D/page.tsx).
   - Thực khách quét QR tại bàn để xem menu, lọc món, tùy biến modifier/topping, nhập ghi chú, và bấm **"Gửi Bếp"**.
   - Bắn trực tiếp sự kiện `ORDER_CREATED` vào KDS của Bếp/Bar, bàn đổi trạng thái sang `occupied` trên màn hình Thu ngân, kèm tính năng theo dõi tiến độ món ăn real-time và nút gọi nhân viên phục vụ.

---

## 5. Nâng Cấp UX/UI: Tự Động Quy Đổi Giá Mua Vào Sang Giá Vốn Kho (COMPLETED - 13/10/2026)
Đã hoàn thành và kiểm thử thành công trên cả 2 Modal tạo mới và chỉnh sửa nguyên vật liệu:
1. **Modal Thêm Mới Nguyên Vật Liệu ([AddRawMaterialModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/AddRawMaterialModal.tsx))**:
   - Thêm ô nhập **"Giá mua vào (theo 1 [Đơn vị mua]) (VNĐ)"** ngay phía trên ô "Giá vốn ước tính".
   - Tích hợp hook `useEffect` lắng nghe thay đổi của Giá mua vào và Hệ số quy đổi (`conversion_factor`).
   - Công thức tự động quy đổi: `Giá vốn ước tính (Đơn vị định mức BOM) = Giá mua vào / Hệ số quy đổi`.
   - Xử lý chặt chẽ ngoại lệ chia cho 0 hoặc giá trị rỗng/NaN, tự động gán về 0 nếu chưa hợp lệ.
   - Thêm dòng Dynamic Helper Text màu đỏ nổi bật (`text-rose-600 dark:text-rose-400`): `"⚡ 1 [Đơn vị mua] = [Số tiền] VNĐ thì giá vốn ước tính tự động quy đổi: [Giá vốn] VNĐ/[Đơn vị định mức]"`.
   - Chuyển trường **"Giá vốn ước tính"** sang trạng thái **Disabled (Read-only)** kèm badge "Khóa sửa" để tránh người dùng sửa nhầm, đảm bảo tính chuẩn xác toán học.

2. **Modal Chỉnh Sửa Nguyên Vật Liệu ([EditRawMaterialModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/EditRawMaterialModal.tsx))**:
   - Tự động tính toán và điền sẵn giá mua vào ban đầu (`material.avg_cost * material.conversion_factor`).
   - Cho phép thủ kho/quản lý cập nhật giá mua vào mới, hệ số quy đổi mới, hệ thống tự động tính lại giá vốn cơ sở tương ứng.
   - Hiển thị Dynamic Helper Text cảnh báo màu đỏ tương ứng và khóa ô giá vốn cơ sở dạng read-only.

---

## 6. Gói Nâng Cấp UX/UI Thực Chiến (Phase 1.6 - UX Refinement) - COMPLETED (13/10/2026)
Đã hoàn thành và kiểm thử thành công 3 hạng mục tối ưu hóa thao tác người dùng:

1. **Luồng Chọn Bàn 2 Bước & Đặt Bàn Trước (Reservation) tại FOH ([TableSelector.tsx](file:///e:/Vibe%20Coding/POS/src/components/foh/TableSelector.tsx), [FOHView.tsx](file:///e:/Vibe%20Coding/POS/src/components/foh/FOHView.tsx))**:
   - **Trình tự bắt buộc 2 bước**:
     - **Bước 1**: Chọn Khu vực (Zone) trước (Tầng 1, Tầng 2, Sân vườn, Phòng VIP). Hiển thị badge số bàn nhận khả dụng.
     - **Bước 2**: Tự động lọc và **chỉ hiển thị các bàn có trạng thái Trống (`available`) hoặc Đã đặt (`reserved`)**. Ẩn hoàn toàn các bàn đang phục vụ (`occupied`) hoặc đang thanh toán (`billing`).
   - **Tính năng Đặt bàn trước (Reservation)**:
     - Nút 1-chạm "Đặt bàn" chuyển trạng thái sang `reserved` và "Hủy đặt" trả về `available` ngay trên thẻ bàn tại FOH và Cashier [TableMap.tsx](file:///e:/Vibe%20Coding/POS/src/components/cashier/TableMap.tsx).
     - Khi bàn ở trạng thái `reserved`, nhân viên bấm chọn bàn và mở order bình thường khi khách đến; khi gửi đơn, hệ thống tự động chuyển bàn sang `occupied`.

2. **Tìm Kiếm Nhanh (Searchable Combobox) với Keyboard Navigation ([SearchableSelect.tsx](file:///e:/Vibe%20Coding/POS/src/components/ui/SearchableSelect.tsx))**:
   - Xây dựng component `SearchableSelect` thay thế toàn bộ các thẻ `<select>` tĩnh.
   - Hỗ trợ gõ text lọc tức thì (không phân biệt hoa/thường, hỗ trợ tiếng Việt).
   - **Điều hướng bàn phím toàn diện**: Hỗ trợ phím mũi tên `↑` / `↓` để duyệt danh sách, phím `Enter` để chọn, phím `Esc` để đóng mà không cần dùng chuột.
   - Tích hợp vào:
     - **Cấu hình Định mức BOM trong phân hệ Kho ERP ([RecipeBOMTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/RecipeBOMTab.tsx))**: Ô input tìm kiếm nhanh trên từng dòng nguyên liệu thành phần.
     - Form Thêm Định mức BOM món ăn ([AddMenuItemModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/AddMenuItemModal.tsx)).
     - Form Sửa Định mức BOM món ăn ([EditMenuItemModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/EditMenuItemModal.tsx)).
     - Form Tạo Phiếu Nhập Kho PO ([ProcurementTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/ProcurementTab.tsx)).

3. **Tùy Chỉnh UX Nâng Cao & Kiểm Kê Kho Thông Minh**:
   - **Lọc Từng Sản Phẩm trong Kiểm Kê Kho ([AuditTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/AuditTab.tsx))**:
     - Bổ sung thanh tìm kiếm nhanh nguyên liệu theo tên, đơn vị tính ngay trên đầu bảng nhập đếm tay.
     - Bộ lọc 1-chạm: *Tất cả*, *Có chênh lệch* (lệch số lượng so với sổ sách), *Khớp sổ* giúp thủ kho tập trung xử lý đúng sản phẩm cần cân bằng.
     - Hiển thị số lượng sản phẩm được lọc và thông báo empty state trực quan khi không tìm thấy.
   - **Nút Xóa Nhanh Giỏ Hàng (Clear Cart)**:
     - Bổ sung nút nổi bật "Hủy đơn / Xóa toàn bộ" (kèm icon `Trash2`) ở cả Header giỏ hàng và thanh hành động dưới cùng của [CartSidebar.tsx](file:///e:/Vibe%20Coding/POS/src/components/foh/CartSidebar.tsx).
     - Reset giỏ hàng về 0 ngay lập tức với hộp thoại xác nhận khi khách đổi ý.
   - **Hiển Thị Badge Khu Vực Cạnh Số Bàn**:
     - Bổ sung `zoneName` trên thẻ vé KDS Bếp/Bar ([KDSTicketCard.tsx](file:///e:/Vibe%20Coding/POS/src/components/kds/KDSTicketCard.tsx), [KDSView.tsx](file:///e:/Vibe%20Coding/POS/src/components/kds/KDSView.tsx)) định dạng `[Tên Khu Vực] - Bàn Số` (VD: `Tầng 2 - Bàn 05`).
     - Đồng bộ hiển thị Tên Khu Vực trong tiêu đề thanh toán ([CheckoutPanel.tsx](file:///e:/Vibe%20Coding/POS/src/components/cashier/CheckoutPanel.tsx)) và Hóa đơn in nhiệt K80 ([ReceiptModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/cashier/ReceiptModal.tsx)).

---

## 7. Mobile-First & KiotViet-like FOH Redesign (Phase 1.7) - COMPLETED (13/10/2026)
Đã khắc phục triệt để lỗi UX trên màn hình di động, hoàn thiện trải nghiệm chọn món linh hoạt:

1. **Tái Cấu Trúc Layout Responsive (Split-View vs Slide-in Drawer)**:
   - **Desktop / Tablet Landscape (`md:` & `lg:`)**: Giữ cấu trúc Side-by-Side tối ưu năng suất. MenuGrid bên trái (linh hoạt) và Giỏ hàng CartSidebar bên phải (cố định width).
   - **Mobile / Tablet Portrait (`< md`)**:
     - `MenuGrid` chiếm trọn 100% không gian màn hình để nhân viên và khách dễ dàng lướt xem món, có padding chân trang `pb-28` tránh bị che khuất.
     - `CartSidebar` chuyển thành Slide-in Right Drawer trượt từ phải sang (`fixed inset-0 z-50 flex`).
     - Bổ sung **nút Đóng (X)** to rõ ràng ở Header của Giỏ hàng cùng cơ chế click backdrop để thoát nhanh về danh sách món.

2. **UX Trải Nghiệm Chọn Món Chuẩn KiotViet (Mobile Optimization)**:
   - **Smart Table Selector Button ở Top Header**:
     - Hiển thị thông tin bàn phục vụ trực quan ngay trên thanh tiêu đề: `[Tên Khu Vực] • Bàn [Số Bàn] [Trạng Thái]`.
     - Bấm vào mở popup **Dedicated Table Selector Modal** chọn bàn 2 bước độc lập mà không cần mở giỏ hàng.
   - **Thanh Cố Định Dưới Cùng (Mobile Fixed Bottom Bar)**:
     - Luôn ghim cố định ở đáy màn hình điện thoại: Icon giỏ hàng kèm badge số lượng món, thông tin bàn, tổng tiền VNĐ và nút **"Xem Giỏ Hàng"**.
     - Giúp nhân viên kiểm tra tức thì giá tiền và số lượng món khi đang tư vấn cho khách.

3. **Luồng Chọn Bàn Tự Động Thu Gọn (Auto-Collapse & Auto-Close Drawer)**:
   - Trong Giỏ hàng: Component [TableSelector.tsx](file:///e:/Vibe%20Coding/POS/src/components/foh/TableSelector.tsx) tích hợp chế độ `collapsible`. Khi bàn đã được chọn, tự động thu gọn thành 1 thẻ tóm tắt nhỏ gọn (tiết kiệm không gian), kèm nút **"Đổi bàn"** để mở lại khi cần.
   - Khi chọn bàn thành công trên Mobile: Tự động đóng popup / đóng Cart Drawer ngay lập tức, đưa nhân viên trở về thẳng lưới món ăn `MenuGrid` để tiếp tục chạm chọn món.

---

## 8. Full-System Mobile-First & Responsive Overhaul (COMPLETED - 13/10/2026)
1. **Top Module Navigation Bar ([src/app/page.tsx](file:///e:/Vibe%20Coding/POS/src/app/page.tsx))**:
   - Tích hợp cuộn ngang `overflow-x-auto no-scrollbar` cho 5 nút phân hệ (Gọi Món, Bếp & Bar, Thu Ngân, Kho ERP, Quản Trị) kèm thuộc tính `shrink-0`.
   - Ẩn các badge kỹ thuật (`M2 Live`, `M3 Live`,...) và rút gọn nhãn nút trên màn hình điện thoại nhỏ.
   - Rút gọn nút `Giả Lập E2E` thành `⚡ E2E` và ẩn badge text `Real-time Online` trên Mobile để không chiếm diện tích hiển thị.

2. **Trung Tâm Quản Trị ([AdminView.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/AdminView.tsx))**:
   - Chuyển đổi kiến trúc sang `flex flex-col md:flex-row`.
   - Trên Desktop (`md:`): Sidebar 256px hiển thị cố định bên trái như bình thường.
   - Trên Mobile (`< md`): Tự động ẩn Sidebar cố định và thay thế bằng **Mobile Sub-Navigation Bar** ngang có khả năng cuộn mượt mà.
   - Khung nội dung chính (`main`) chiếm 100% chiều rộng màn hình, giải quyết triệt để lỗi bảng biểu và form cài đặt bị chèn ép co dúm thành dải hẹp.

3. **Phân Hệ ERP Quản Trị Kho ([ERPView.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/ERPView.tsx))**:
   - Chuyển đổi kiến trúc sang `flex flex-col md:flex-row`.
   - Trên Desktop (`md:`): Giữ nguyên Sidebar 256px bên trái.
   - Trên Mobile (`< md`): Tự động thu gọn Sidebar thành thanh Tabs ngang cuộn mượt (Tồn Kho, Định Mức BOM, Nhập Hàng, Kiểm Kê Kho).
   - Toàn bộ danh mục nguyên vật liệu, phiếu nhập hàng và kiểm kê kho mở rộng trọn vẹn 100% không gian màn hình điện thoại.

4. **Quầy Thu Ngân & Điều Phối ([CashierView.tsx](file:///e:/Vibe%20Coding/POS/src/components/cashier/CashierView.tsx))**:
   - Tối ưu hóa Header: Chuyển đổi padding, nhãn ca làm việc và tổng doanh thu hiển thị linh hoạt theo kích thước màn hình thiết bị.

---

## 9. Bổ Sung Tính Năng Quản Trị Cốt Lõi (Phase 1.8 - Invoices, Suppliers & Dynamic Analytics) - COMPLETED (13/10/2026)
Đã hoàn thành và kiểm thử toàn diện 3 tính năng quản trị cốt lõi giải quyết dứt điểm các lỗ hổng đối soát và quản lý:

1. **Quản Lý Lịch Sử Hóa Đơn & Đối Soát Gian Lận ([InvoiceHistoryTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/InvoiceHistoryTab.tsx), [InvoiceDetailModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/InvoiceDetailModal.tsx))**:
   - Bổ sung tab **"Lịch Sử Hóa Đơn"** (kèm badge đếm tổng số hóa đơn) tại cả Desktop Sidebar và Mobile Sub-nav của Trung tâm quản trị [AdminView.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/AdminView.tsx).
   - **Thẻ KPI Tổng Quan**: Tổng số hóa đơn lưu trữ, Tổng doanh thu đã thu và Số hóa đơn bị hủy.
   - **Bộ Lọc Đa Chiều & Tìm Kiếm Nhanh**:
     - Thanh Search lọc tức thì theo Mã đơn (`#ORD-...`), Tên bàn, Món ăn hoặc Ghi chú.
     - 3 Tabs trạng thái 1-chạm: *Tất Cả*, *Thành Công* (`completed`/`paid`), và *Hóa Đơn Bị Hủy* (`cancelled` - giám sát đối soát chống gian lận/thất thoát).
   - **Data Table Toàn Diện**: Hiển thị Mã đơn, Thời gian (chuẩn `dd/MM/yyyy HH:mm`), Bàn phục vụ, Danh sách tóm tắt món, Tổng tiền VNĐ, Badge hình thức thanh toán (Tiền mặt, VietQR, Thẻ POS, Ví điện tử) và Trạng thái hoàn tất/bị hủy.
   - **Modal Chi Tiết Hóa Đơn ([InvoiceDetailModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/InvoiceDetailModal.tsx))**:
     - Hiển thị layout chuẩn hóa đơn thanh toán: Thông tin bàn, thời gian tạo & cập nhật.
     - Bảng chi tiết từng món kèm phân trạm Bếp/Bar, Modifiers (độ chín, đá, đường, topping), ghi chú, số lượng, đơn giá và thành tiền.
     - Phân tích tài chính chi tiết: Tiền hàng (Subtotal), Giảm giá voucher (Discount), Thuế GTGT 8% (VAT) và Tổng thanh toán thực thu.
     - Tích hợp nút in hóa đơn (`window.print()`).

2. **Quản Lý Nhà Cung Cấp CRUD trong Phân Hệ ERP ([ProcurementTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/ProcurementTab.tsx), [AddSupplierModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/AddSupplierModal.tsx), [EditSupplierModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/EditSupplierModal.tsx))**:
   - Nâng cấp giao diện tab Nhập hàng & Nhà cung cấp: Hiển thị badge tổng công nợ đối tác toàn hệ thống và ô tìm kiếm nhanh đối tác theo tên, số điện thoại, địa chỉ.
   - **Form Thêm Mới ([AddSupplierModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/AddSupplierModal.tsx))**: Cho phép đăng ký tên công ty, số điện thoại, email, địa chỉ kho và công nợ ban đầu.
   - **Form Chỉnh Sửa ([EditSupplierModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/EditSupplierModal.tsx))**: Cập nhật thông tin liên hệ và đối soát, điều chỉnh số dư công nợ sau thanh toán.
   - **Xóa & Thao Tác Nhanh**: Nút Sửa, Xóa (kèm confirm) và nút "Nhập hàng" 1-chạm tự động gán nhà cung cấp vào form Tạo Phiếu PO.
   - **Đồng Bộ Dữ Liệu Hai Chiều**: Tích hợp các hàm helper `getMockSuppliers`, `addMockSupplier`, `updateMockSupplier`, `deleteMockSupplier` trong [mockData.ts](file:///e:/Vibe%20Coding/POS/src/database/mockData.ts) và lưu trữ cục bộ qua [inventoryService.ts](file:///e:/Vibe%20Coding/POS/src/services/inventoryService.ts).

3. **Bộ Lọc Thời Gian Động Cho Dashboard & Phân Tích ([DateRangePicker.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/DateRangePicker.tsx), [DashboardTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/DashboardTab.tsx))**:
   - Xây dựng component `DateRangePicker` với 5 lựa chọn linh hoạt:
     - **Quick Picks**: *Hôm Nay*, *Tuần Này*, *Tháng Này*, *Năm Nay*.
     - **Tùy Chỉnh**: Lựa chọn khoảng thời gian cụ thể (Từ ngày - Đến ngày).
   - **Xử Lý Chuẩn Time Boundary**: Xác định chính xác mốc `00:00:00.000` (Start of Day) và `23:59:59.999` (End of Day) tránh lệch múi giờ hay mất dữ liệu giao dịch cận ngày.
   - **Re-render Đồng Bộ Toàn Bộ Dashboard Khi Đổi Bộ Lọc**:
     - **4 Thẻ KPI**: Doanh thu thực tế, Tổng số đơn hàng, Giá trị trung bình đơn (AOV) và Cảnh báo tồn kho tính toán theo đúng khoảng thời gian đã chọn.
     - **Biểu Đồ Recharts Doanh Thu (Bar Chart)**: Tự động phân chia khung giờ (Hôm nay: theo các mốc 2 tiếng), theo các thứ trong tuần (Tuần này), theo khoảng ngày (Tháng này) hoặc theo 12 tháng (Năm nay).
     - **Biểu Đồ Recharts Thanh Toán (Donut Chart)**: Thống kê tỷ trọng thanh toán (VietQR, Tiền mặt, Thẻ POS, Ví điện tử) của các đơn hoàn tất trong khoảng thời gian đã chọn.
     - **Bảng Top 5 Best Sellers**: Tự động xếp hạng 5 món bán chạy nhất và tính tổng doanh thu món trong khoảng thời gian đã lọc.
     - Hiển thị empty state thân thiện nếu khoảng thời gian chưa phát sinh đơn hàng.

---

## 10. Phase 1.9: Admin Center Expansion (Debt Ledger, CRM Customers & Report Center) [HOÀN TẤT 100%]

Tham khảo chuẩn giao diện KiotViet, toàn bộ phân hệ Quản lý Nhà cung cấp, Sổ Công nợ, Khách hàng CRM và Trung tâm Báo cáo đã được quy hoạch tập trung tại **Trung tâm Quản trị (`/admin`)**:

1. **Quy hoạch lại Thanh Điều Hướng Admin ([AdminView.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/AdminView.tsx))**:
   - Tích hợp 3 module mới trên cả Desktop Sidebar và Mobile Navigation:
     - **Đối tác (Suppliers)**: Quản lý nhà cung cấp và sổ cái công nợ.
     - **Khách hàng (Customers)**: Quản lý khách hàng thân thiết, điểm thưởng và hạng thẻ.
     - **Báo cáo (Reports)**: Báo cáo bán hàng cuối ngày (Z-Report) và Báo cáo giá trị tồn kho.
   - Thống nhất định tuyến tab, header title động và cơ chế làm mới dữ liệu realtime.

2. **Sổ Công Nợ Nhà Cung Cấp Chuẩn KiotViet ([SupplierTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/SupplierTab.tsx), [SupplierDetailModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/SupplierDetailModal.tsx), [PaySupplierDebtModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/PaySupplierDebtModal.tsx))**:
   - **Giao diện Master-Detail**:
     - Danh sách Nhà cung cấp hiển thị: Tên đối tác, Số điện thoại, Email, Địa chỉ, Nợ hiện tại (với badge màu đỏ cảnh báo nợ), Tổng tiền mua hàng lũy kế.
     - Thẻ thống kê tổng quan: Tổng nợ phải trả toàn hệ thống, Số lượng đối tác đang có nợ, Tổng mua lũy kế.
     - Bộ lọc tìm kiếm nhanh theo tên/SĐT/địa chỉ và bộ lọc "Tất cả" vs "Đang nợ".
   - **Master-Detail Panel (Modal chi tiết)**:
     - **Tab Sổ Công Nợ (Debt Ledger)**: Hiển thị dạng Sổ cái chuẩn kế toán với các cột: Mã phiếu, Thời gian, Loại giao dịch (Nhập hàng làm tăng nợ `+`, Thanh toán làm giảm nợ `-`), Giá trị giao dịch và Nợ cần trả hiện tại (**Running Balance** lũy kế).
     - **Tab Lịch Sử Nhập Hàng**: Danh sách các Purchase Order đã phát sinh với đối tác.
     - **Tab Thông Tin**: Chi tiết hồ sơ pháp lý, địa chỉ, số điện thoại, ghi chú.
   - **Nghiệp Vụ Thanh Toán Công Nợ ([PaySupplierDebtModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/PaySupplierDebtModal.tsx))**:
     - Cho phép chọn/nhập số tiền trả (hỗ trợ nút chọn nhanh "Trả hết nợ"), tự động tính và hiển thị "Nợ còn lại sau thanh toán".
     - Khi xác nhận thanh toán: tự động sinh 1 transaction loại `payment` vào sổ cái, trừ trực tiếp `total_debt` của nhà cung cấp và phát sự kiện realtime `SUPPLIER_DEBT_UPDATED`.
     - Tự động cộng nợ khi lập đơn mua hàng mới (Purchase Order).

3. **Quản Trị Khách Hàng Thân Thiết CRM ([CustomerTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/CustomerTab.tsx), [customerService.ts](file:///e:/Vibe%20Coding/POS/src/services/customerService.ts), [AddEditCustomerModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/AddEditCustomerModal.tsx))**:
   - **Data Table Quản Lý Khách Hàng**:
     - Cột: Họ tên, Số điện thoại, Email, Hạng thành viên (Đồng, Bạc, Vàng, Kim Cương), Tổng chi tiêu lũy kế, Điểm tích lũy.
     - Thống kê 4 thẻ VIP: Kim Cương (>= 10tr), Vàng (>= 5tr), Bạc (>= 2tr), Đồng (< 2tr).
     - Tìm kiếm theo tên/SĐT và bộ lọc theo Hạng thành viên.
     - Thao tác CRUD (Thêm mới / Sửa thông tin / Xóa khách hàng).
   - **Tích hợp FOH & Cashier Flow ([CartSidebar.tsx](file:///e:/Vibe%20Coding/POS/src/components/foh/CartSidebar.tsx), [CheckoutPanel.tsx](file:///e:/Vibe%20Coding/POS/src/components/cashier/CheckoutPanel.tsx))**:
     - Cho phép gõ số điện thoại để tìm kiếm và "Gắn khách hàng" trực tiếp vào đơn hàng tại Giỏ hàng hoặc màn hình Thanh toán.
     - Hỗ trợ form tạo nhanh khách hàng mới ngay khi số điện thoại chưa tồn tại trong hệ thống.
     - Hiển thị badge hạng thẻ và điểm thưởng của khách hàng đã gắn.
     - **Tự Động Tích Điểm & Nâng Hạng**: Khi hóa đơn thanh toán hoàn tất (`PAYMENT_COMPLETED`), hệ thống tự động cộng dồn Tổng chi tiêu vào hồ sơ khách hàng, quy đổi điểm thưởng (1 điểm / 10.000 VNĐ) và tự động thăng hạng thành viên.
     - In thông tin khách hàng trên hóa đơn nhiệt K80 ([ReceiptModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/cashier/ReceiptModal.tsx)).

4. **Trung Tâm Báo Cáo Doanh Thu & Kho Hàng ([ReportTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/ReportTab.tsx))**:
   - **Báo Cáo Bán Hàng (Z-Report)**:
     - Thống kê tổng doanh thu ròng (Net Sales), Doanh thu gộp (Gross Sales), Tổng tiền giảm giá/Voucher, Tổng thuế VAT thu hộ, Số lượng đơn thành công.
     - Bóc tách chi tiết theo Phương thức thanh toán (Tiền mặt, Chuyển khoản VietQR, Thẻ POS, Ví điện tử) với tỷ trọng phần trăm.
     - Báo cáo kết ca (Cashier Shifts) và đối soát doanh thu theo ca làm việc.
     - Hỗ trợ xuất dữ liệu / In báo cáo Z-Report.
   - **Báo Cáo Giá Trị Tồn Kho (Inventory Valuation)**:
     - Tính tổng giá trị vốn lưu kho hiện tại: $\sum (\text{current\_stock} \times \text{avg\_cost})$.
     - Thống kê số lượng mặt hàng an toàn vs mặt hàng dưới định mức (Low Stock Warning).
     - Bảng chi tiết toàn bộ nguyên vật liệu kèm tỷ trọng giá trị vốn của từng mặt hàng so với tổng kho.

5. **Mô Hình Dữ Liệu & Mock Data ([types/index.ts](file:///e:/Vibe%20Coding/POS/src/types/index.ts), [mockData.ts](file:///e:/Vibe%20Coding/POS/src/database/mockData.ts))**:
   - Bổ sung types: `Customer`, `SupplierDebtTransaction`, `Order.customer_id`, `Order.customer_name`, `Order.customer_phone`, `Supplier.total_purchase`.
   - Bổ sung mảng `initialCustomers`, `initialSupplierDebtTransactions` phong phú và các hàm helper thao tác dữ liệu.
   - Biên dịch TypeScript không lỗi (`npx tsc --noEmit` đạt 0 lỗi).

---

## 11. Phase 1.10: Native Mobile App Redesign (Admin & ERP) [HOÀN TẤT 100%]

Tái cấu trúc toàn diện trải nghiệm người dùng trên thiết bị di động (< md) theo ngôn ngữ ứng dụng Native App chuẩn KiotViet Mobile, bảo toàn nguyên vẹn 100% giao diện Desktop:

1. **Thanh Điều Hướng Đáy (Bottom Navigation Bar) & App Header ([AdminView.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/AdminView.tsx))**:
   - **Xóa bỏ hoàn toàn**: Thanh điều hướng ngang cuộn trên cùng trên Mobile gây chật chội và khó thao tác.
   - **Bottom Navigation Bar Cố Định (`fixed bottom-0 w-full`)**:
     - Thiết kế chuẩn Native App với 5 Tab cốt lõi:
       1. **Tổng quan** (`LayoutDashboard`)
       2. **Hóa đơn** (`Receipt` kèm badge đếm số lượng đơn)
       3. **Thực đơn** (`UtensilsCrossed`)
       4. **Báo cáo** (`FileBarChart`)
       5. **Nhiều hơn** (`LayoutGrid` - trung tâm tính năng mở rộng)
     - Hiệu ứng active nổi bật, font size chuẩn mobile và hỗ trợ `safe-area-inset-bottom`.
   - **App Header Cố Định Trên Cùng (`fixed top-0 w-full`)**:
     - Tiêu đề tab động tương ứng ("Tổng Quan", "Hóa Đơn", "Thực Đơn", "Báo Cáo", "Nhiều Hơn"...).
     - Nút "← Nhiều hơn" quay lại menu khi đang duyệt các tính năng con (`customers`, `suppliers`, `tables`, `promotions`, `hr`, `settings`).
     - Nút làm mới dữ liệu nhanh và logo/badge thương hiệu.
   - Khoảng đệm cuộn an toàn (`pt-16 pb-20 md:pt-6 md:pb-6`) chống tràn/chống đè nội dung.

2. **Màn Hình "Nhiều Hơn" (Grid App Menu Chuẩn KiotViet Mobile)**:
   - Khi chọn tab "Nhiều hơn", render giao diện lưới `grid grid-cols-2 gap-3.5`:
     - **Khách Hàng (CRM)**: Thẻ nền trắng nổi khối, icon `UserCheck` pastel, mô tả tích điểm & hạng VIP.
     - **Đối Tác (NCC)**: Icon `Building2` pastel, mô tả sổ cái nợ nhà cung cấp.
     - **Sơ Đồ Bàn & Khu Vực**: Icon `LayoutGrid` pastel, mô tả quản lý tầng & phòng.
     - **Khuyến Mãi**: Icon `Ticket` pastel, mô tả voucher & chiết khấu.
     - **Nhân Sự**: Icon `Users` pastel, mô tả phân quyền RBAC.
     - **ERP Quản Trị Kho**: Icon `Boxes` pastel, chuyển hướng nhanh đến phân hệ ERP tồn kho & định mức BOM.
     - **Cấu Hình Cửa Hàng**: Thẻ ngang full-width (col-span-2) với icon `Settings` và mũi tên điều hướng.

3. **Chuyển Đổi Bảng Dữ Liệu Thành Danh Sách Thẻ (Mobile Card List)**:
   - **Lịch Sử Hóa Đơn ([InvoiceHistoryTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/InvoiceHistoryTab.tsx))**:
     - Desktop (`md:block`): Giữ nguyên Data Table ngang.
     - Mobile (`md:hidden`): Danh sách thẻ hóa đơn nền trắng `divide-y`:
       - Trái: Mã đơn `#ord-...` (chữ to, in đậm font-mono), Tên Bàn / Khách hàng, Giờ vào và Phương thức thanh toán.
       - Phải: Tổng tiền VNĐ (chữ to, font-black, text-blue-600), badge trạng thái (Hoàn tất / Đã hủy / Chờ TT).
       - Click thẻ mở trực tiếp `InvoiceDetailModal`.
   - **Quản Lý Khách Hàng CRM ([CustomerTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/CustomerTab.tsx))**:
     - Mobile Card List hiển thị: Tên khách hàng (in đậm), badge Hạng thành viên (Đồng, Bạc, Vàng, Kim Cương), SĐT, Điểm tích lũy, Tổng chi tiêu lũy kế font-mono và nút thao tác Sửa/Xóa.
   - **Đối Tác & Công Nợ ([SupplierTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/admin/SupplierTab.tsx))**:
     - Mobile Card List hiển thị: Tên đối tác, SĐT, Mã NCC, Badge nợ (Còn nợ / Hết nợ), Lưới tóm tắt (Nợ cần trả vs Tổng mua hàng), Nút xem chi tiết sổ cái và Nút "Trả nợ" 1 chạm.

4. **Nền Tảng & Kiểm Thử**:
   - Nền app tổng thể trên Mobile: `bg-stone-100 dark:bg-stone-950`, các Card và List item: `bg-white dark:bg-stone-900` tạo độ nổi khối chuyên nghiệp.
   - Khắc phục lỗi prerender Next.js 16 (`new Date()` trong Client Component tại `DashboardTab.tsx`).
   - Kiểm thử thành công `next build` (0 lỗi build Turbopack/PPR) và `npx tsc --noEmit` (0 lỗi type).

---

### Phase 1.11: System-wide Native Mobile Overhaul (KDS, Thu Ngân, ERP & Global App Drawer) - HOÀN TẤT
Đồng bộ ngôn ngữ thiết kế Native Mobile App hiện đại cho tất cả các phân hệ cốt lõi còn lại, bảo toàn 100% giao diện Desktop:

1. **Global App Drawer & Mobile Navigation Bar ([app/page.tsx](file:///e:/Vibe%20Coding/POS/src/app/page.tsx))**:
   - **Thay thế thanh cuộn ngang chật chội**: Trên màn hình Mobile (`< md`), loại bỏ thanh cuộn ngang tabs trên cùng.
   - **Hamburger Menu (Menu 3 gạch)**: Nút Hamburger nằm ở góc trái trên cùng của thanh Header chính, kèm badge định danh phân hệ đang kích hoạt (`/ Gọi Món`, `/ Kho ERP`, `/ Thu Ngân`...).
   - **Sliding Drawer Sidebar (Trượt từ trái sang)**: Chạm vào Menu 3 gạch mở ngăn kéo `fixed inset-0 z-50` với hiệu ứng trượt mượt mà:
     - Header thương hiệu VIBE POS, logo gradient và nút Đóng (X).
     - Danh sách 5 phân hệ với icon màu pastel, tiêu đề và mô tả trực quan: Gọi Món (FOH), Bếp & Bar (KDS), Thu Ngân (Cashier), Quản Trị Kho (ERP), Trung Tâm Quản Trị (Admin).
     - Nút kích hoạt kịch bản giả lập E2E và trạng thái Realtime Online.
   - **Desktop Navigation**: Giữ nguyên 100% thanh điều hướng ngang tabs tiện dụng trên máy tính.

2. **Phân Hệ Quản Trị Kho & Định Mức (ERP - [ERPView.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/ERPView.tsx))**:
   - **App Header Cố Định**: Header mobile "Quản Trị Kho" với icon `Boxes`, tổng giá trị kho hàng thời gian thực, badge cảnh báo hết hàng và nút làm mới dữ liệu.
   - **Horizontal Scrollable Segmented Tab Bar**: Thanh tab ngang cuộn mượt (`overflow-x-auto no-scrollbar`) gồm 4 tab: Tồn Kho, Định Mức (BOM), Nhập Hàng (PO), Kiểm Kê Kho.
   - **Ẩn hoàn toàn `<table>` trên Mobile & chuyển đổi sang Mobile Card List**:
     - **Tồn Kho ([InventoryTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/InventoryTab.tsx))**: Card nền trắng nổi khối gồm Tên nguyên liệu (chữ to, in đậm), badge cảnh báo `Low Stock (Sắp hết)` đỏ rực animate-pulse hoặc `Đủ dùng` xanh lá, lưới số liệu tồn hiện tại (màu nổi bật) kèm quy đổi đơn vị mua, hạn mức an toàn, giá vốn TB, tổng giá trị kho và nút Sửa nguyên liệu.
     - **Định Mức BOM ([RecipeBOMTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/RecipeBOMTab.tsx))**: Danh sách món ăn dạng Card với ảnh thumbnail, trạm chế biến (Bếp/Bar), giá bán, giá vốn COGS, và tỷ suất lợi nhuận (Biên LN %) phân cấp màu sắc. Chạm vào bất kỳ Card nào sẽ mở **Bottom Sheet / Modal sửa BOM** đầy đủ tính năng: thêm/bớt nguyên liệu, chỉnh định lượng, xem phân tích COGS và lưu BOM.
     - **Nhập Hàng ([ProcurementTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/ProcurementTab.tsx))**: Phiếu nhập kho (PO) dạng Card List với mã PO, nhà cung cấp, badge trạng thái, danh sách nguyên liệu và tổng tiền nổi bật.
     - **Kiểm Kê Kho ([AuditTab.tsx](file:///e:/Vibe%20Coding/POS/src/components/erp/AuditTab.tsx))**: Phiếu kiểm kê dạng Card List với người kiểm kê, ngày thực hiện, số mặt hàng lệch và giá trị chênh lệch. Cả Modal chi tiết phiếu kiểm kê và Modal lập phiếu kiểm kê đều tự động chuyển đổi bảng sang Card List trên điện thoại.

3. **Phân Hệ Bếp & Quầy Bar (KDS - [KDSKanbanBoard.tsx](file:///e:/Vibe%20Coding/POS/src/components/kds/KDSKanbanBoard.tsx))**:
   - **App Header Cố Định**: Header mobile "KDS - Bếp & Bar" với đèn tín hiệu Live, bộ lọc trạm (Tất cả / Bếp / Bar) và các nút âm thanh (thử chuông, bật/tắt tiếng, dọn xong).
   - **Mobile Kanban Redesign (Segmented Control)**: Trên Mobile, 3 cột song song Desktop được thay bằng thanh Segmented Control dính ngay dưới Header:
     - `[Chờ (X)]` (màu hổ phách) | `[Làm (Y)]` (màu cam nổi bật) | `[Xong (Z)]` (màu xanh ngọc).
     - Hệ thống CHỈ hiển thị duy nhất một cột danh sách Thẻ vé (Ticket Card) chiếm tràn màn hình dọc tương ứng với tab được chọn.

4. **Phân Hệ Thu Ngân (Cashier - [CashierView.tsx](file:///e:/Vibe%20Coding/POS/src/components/cashier/CashierView.tsx), [CheckoutPanel.tsx](file:///e:/Vibe%20Coding/POS/src/components/cashier/CheckoutPanel.tsx))**:
   - **App Header Cố Định**: Header mobile "Thu Ngân" với trạng thái mở ca, doanh thu ca thời gian thực và nút làm mới dữ liệu. Giữ nguyên Sơ đồ bàn dạng Grid cuộn dọc.
   - **Checkout Panel Bottom Sheet Slide-up**: Khi thu ngân bấm vào một bàn đang phục vụ trên điện thoại, giao diện thanh toán biến thành một **Bottom Sheet** trượt từ dưới lên (`fixed inset-x-0 bottom-0 top-12 z-50 bg-white rounded-t-2xl shadow-2xl`) kèm backdrop tối mờ.
   - **Nút "Đóng (X)" to và thanh Drag Handle**: Bố trí nút Đóng to, nổi bật ở góc trên cùng bên phải và thanh kéo drag handle ở cạnh trên để thu ngân hạ Bottom Sheet xuống quay lại Sơ đồ bàn ngay tức khắc.

5. **Nền Tảng & Kiểm Thử Toàn Diện**:
   - Tuân thủ nghiêm ngặt nguyên tắc: Mọi thay đổi áp dụng qua `md:hidden` / `hidden md:block` / `lg:hidden` / `hidden lg:grid`. Giao diện Desktop giữ nguyên 100%.
   - Màu nền tổng thể mobile: `bg-stone-100 dark:bg-stone-950`, các Card và phần tử nổi khối: `bg-white dark:bg-stone-900`.
   - Biên dịch TypeScript `npx tsc --noEmit` đạt 0 lỗi (Exit Code 0).
   - Biên dịch Next.js 16 Production Build (`npm run build`) thành công 100% với Turbopack & PPR.

---

### Phase 1.12: Authentication, Audio Routing & Kitchen Ticket Printing - HOÀN TẤT
Hệ thống hoàn thiện 3 trụ cột vận hành thực tế tại quán: Bảo mật phân quyền, Điều hướng âm thanh thông minh và In tem nhiệt bếp K80/K50 tự động:

1. **Hệ Thống Đăng Nhập & Phân Quyền (Auth & RBAC)**:
   - **Trang Đăng Nhập Chuyên Nghiệp ([src/app/login/page.tsx](file:///e:/Vibe%20Coding/POS/src/app/login/page.tsx))**:
     - Thiết kế Mobile-first chuẩn phong cách ứng dụng POS cao cấp với thẻ đăng nhập nổi khối, logo gradient.
     - Hỗ trợ nhập Username/Password với nút ẩn/hiện mật khẩu trực quan.
     - **Tính năng Đăng Nhập Nhanh 1-Chạm (Demo Accounts)**: 5 thẻ tài khoản mẫu cho 5 vai trò (`Admin`, `Quản Lý`, `Thu Ngân`, `Bếp Trưởng`, `Pha Chế Bar`, `Phục Vụ`). Chạm vào thẻ nào lập tức điền thông tin và đăng nhập ngay.
     - **User Gesture Unlock AudioContext**: Thao tác bấm nút "Đăng Nhập" tự động gọi `initAudioContext()`, kích hoạt Web Audio API vượt qua chính sách chặn âm thanh tự động (Autoplay Policy) của trình duyệt.
   - **Auth Context & Dịch Vụ Phân Quyền ([src/services/authService.ts](file:///e:/Vibe%20Coding/POS/src/services/authService.ts), [src/context/AuthContext.tsx](file:///e:/Vibe%20Coding/POS/src/context/AuthContext.tsx))**:
     - Lưu phiên đăng nhập `currentUser` vào `localStorage`, khôi phục tức thì khi F5 hoặc mở lại ứng dụng.
     - Ma trận phân quyền chi tiết (RBAC):
       - `waiter` (Phục vụ): Chỉ được truy cập `/` (FOH - Gọi món).
       - `kitchen` & `bar` (Bếp / Pha chế): Chỉ được truy cập `/kds` (Màn hình điều phối Bếp).
       - `cashier` (Thu ngân): Được truy cập `/` (FOH) và `/cashier` (Bàn & Thanh toán).
       - `manager` & `admin` (Quản trị): Toàn quyền truy cập cả 5 phân hệ (thêm `/erp`, `/admin`).
   - **Bảo Vệ Tuyến Đường (Route Guard - [src/components/auth/RouteGuard.tsx](file:///e:/Vibe%20Coding/POS/src/components/auth/RouteGuard.tsx))**:
     - Bọc toàn bộ các trang con (`/admin`, `/cashier`, `/erp`, `/kds`) và trang chủ `/`.
     - Nếu chưa đăng nhập $\rightarrow$ Lập tức chuyển hướng về `/login`.
     - Nếu đã đăng nhập nhưng không đủ quyền $\rightarrow$ Hiển thị màn hình từ chối truy cập thân thiện và nút quay về phân hệ được phép.
   - **Cập Nhật Drawer & Header ([src/app/page.tsx](file:///e:/Vibe%20Coding/POS/src/app/page.tsx))**:
     - **Profile Card Nhân Viên**: Hiển thị Avatar, Họ tên nhân viên, Huy hiệu Vai trò (`Quản trị viên`, `Thu ngân`, `Bếp chính`...) và nút Đăng xuất.
     - **Menu Động Theo Quyền**: Drawer chỉ hiển thị các phân hệ mà vai trò hiện tại được phép truy cập (`visibleModules`).

2. **Hoàn Thiện Hệ Thống Âm Thanh (Web Audio Alerts - [src/lib/audioAlert.ts](file:///e:/Vibe%20Coding/POS/src/lib/audioAlert.ts))**:
   - **2 Dải Âm Thanh Khác Biệt Bằng Web Audio API Tổng Hợp (Zero Dependency)**:
     - `playNewOrderSound()`: Chuỗi 3 xung âm thanh cao độ dồn dập (880Hz $\rightarrow$ 1108Hz $\rightarrow$ 1318Hz, dạng sóng triangle) dồn dập, báo động nhanh cho Bếp & Bar khi có đơn món mới.
     - `playReadySound()`: Tiếng chuông "Ting" thanh thoát ngân vang (dao động tần số gốc C6 1046Hz lướt lên E6 1318Hz kết hợp họa âm phụ C7 2093Hz, decay êm dịu kéo dài 0.85s) cho nhân viên phục vụ FOH ra quầy bưng món.
   - **Luồng Kích Hoạt Đa Tab (BroadcastChannel & RealtimeEngine)**:
     - **Bếp & Bar ([KDSView.tsx](file:///e:/Vibe%20Coding/POS/src/components/kds/KDSView.tsx))**: Lắng nghe sự kiện `ORDER_CREATED` $\rightarrow$ Tự động phát `playNewOrderSound()`.
     - **Phục Vụ FOH ([FOHView.tsx](file:///e:/Vibe%20Coding/POS/src/components/foh/FOHView.tsx))**: Lắng nghe sự kiện `ITEM_STATUS_CHANGED` (trạng thái `ready`) $\rightarrow$ Tự động phát `playReadySound()`. Khi bếp bấm hoàn thành ticket, phục vụ ở bất kỳ máy tính/tablet nào cũng nghe tiếng chuông Ting báo món đã sẵn sàng.

3. **Tự Động In Tem / Phiếu Bếp Ra Món ([src/components/kds/KitchenReceiptModal.tsx](file:///e:/Vibe%20Coding/POS/src/components/kds/KitchenReceiptModal.tsx))**:
   - **Khổ Giấy Nhiệt Tiêu Chuẩn K80 / K50**: Tối ưu hóa kích thước chiều rộng 80mm/50mm, nền trắng mực đen tương phản cao cho máy in nhiệt.
   - **Font Chữ RẤT TO & Cấu Trúc Phiếu Kẹp Dĩa / Dán Ly**:
     - Tiêu đề nổi bật: `[TÊN KHU VỰC - BÀN SỐ]` (Ví dụ: `[TẦNG 1 - BÀN 04]`) với font cực đại nền đen chữ trắng.
     - Phân khu trạm: `PHIẾU BẾP (KITCHEN)` hoặc `PHIẾU BAR (BEVERAGE)`.
     - Tên món ăn chữ lớn, số lượng in đậm trong khung viền to nét (`x2`, `x1`).
     - Danh sách tùy chọn / topping (+ 50% Đường, 70% Đá, + Trân châu).
     - Khung ghi chú riêng của khách hàng: `GHI CHÚ: KHÔNG CAY, ÍT HÀNH`.
     - Thông tin chân trang: Thời gian hoàn tất, Tên nhân viên đứng bếp và chỉ dẫn `*** KẸP DĨA / DÁN LY - BƯNG RA BÀN ***`.
   - **Kích Hoạt Tự Động**: Khi nhân viên bếp/bar bấm **"HOÀN TẤT & RA MÓN"** trên thẻ ticket KDS $\rightarrow$ Hệ thống lập tức mở modal tem ra món và tự động gọi lệnh `window.print()`.
   - **Hỗ Trợ In Lại 1-Chạm**: Bổ sung icon máy in nhiệt `Printer` trực tiếp trên thanh tiêu đề của mỗi Ticket Card để in lại phiếu bất cứ khi nào cần.

4. **Kiểm Thử Toàn Diện**:
   - `npx tsc --noEmit`: 0 lỗi type (Exit Code 0).
   - `npm run build`: Production Build thành công 100% trên Next.js 16 (Turbopack + PPR).

---

## 12. Phase 2: Cloud Backend, VietQR Webhook & PWA Packaging - HOÀN TẤT
Thực thi toàn bộ các task nền tảng kết nối đám mây, tự động hóa thanh toán ngân hàng và đóng gói ứng dụng di động:

1. **Kết Nối Backend Supabase Cloud ([src/lib/supabaseClient.ts](file:///e:/Vibe%20Coding/POS/src/lib/supabaseClient.ts), [.env.example](file:///e:/Vibe%20Coding/POS/.env.example))**:
   - Cài đặt thư viện chính thức `@supabase/supabase-js`.
   - Xây dựng Supabase Client Singleton an toàn, hỗ trợ chế độ Offline Fallback mượt mà khi chưa có kết nối Internet.
   - Hàm `checkSupabaseConnection()` hỗ trợ kiểm tra sức khỏe kết nối đám mây thời gian thực.
   - Cung cấp file mẫu [.env.example](file:///e:/Vibe%20Coding/POS/.env.example) hướng dẫn cấu hình chi tiết `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

2. **Webhook Tự Động Gạch Nợ Chuyển Khoản Ngân Hàng VietQR ([src/app/api/webhook/payment/route.ts](file:///e:/Vibe%20Coding/POS/src/app/api/webhook/payment/route.ts))**:
   - Endpoint: `POST /api/webhook/payment`.
   - Hỗ trợ đa cổng thanh toán phổ biến tại Việt Nam: **SePay (sepay.vn)**, **PayOS (payos.vn)**, **Cass.vn** và VietQR.
   - Thuật toán bóc tách mã đơn tự động từ nội dung chuyển khoản (`ORD-xxxx`, `DH-xxxx`, `BAN-xx`).
   - Kiểm tra số tiền chuyển khớp, bảo mật qua Header Token / API Secret.
   - Endpoint sẵn sàng tích hợp nhận biến động số dư tài khoản ngân hàng thật (MBBank, Vietcombank, Techcombank, ACB...).

3. **Đóng Gói PWA (Progressive Web App) & Máy In Nhiệt Bluetooth / LAN**:
   - **PWA Manifest ([public/manifest.json](file:///e:/Vibe%20Coding/POS/public/manifest.json))**:
     - Cấu hình chạy ứng dụng toàn màn hình độc lập (`display: standalone`).
     - Tương thích xoay màn hình tự do trên cả điện thoại đứng và tablet/máy POS ngang.
     - Icon thương hiệu vector độ nét cao [public/icon.svg](file:///e:/Vibe%20Coding/POS/public/icon.svg).
     - Phím tắt truy cập nhanh: Gọi món (FOH), Bếp & Bar (KDS), Thu Ngân.
   - **Service Worker ([public/sw.js](file:///e:/Vibe%20Coding/POS/public/sw.js))**: Đăng ký trong `src/app/layout.tsx` cho phép cài đặt app trực tiếp từ trình duyệt Android / iOS / Windows ("Thêm vào màn hình chính").
   - **Mô-đun Quản Lý Máy In Nhiệt ([src/lib/thermalPrinter.ts](file:///e:/Vibe%20Coding/POS/src/lib/thermalPrinter.ts))**:
     - Hỗ trợ Web Bluetooth API kết nối máy in nhiệt mini Bluetooth (Xprinter, Zywell, HPRT...) không cần cài driver.
     - Hỗ trợ Web Serial (USB) và định dạng lệnh in ESC/POS chuẩn (in đậm, cắt giấy tự động GS V, căn lề).
     - Fallback lệnh in chuẩn trình duyệt `window.print()`.

4. **Đồng Bộ Mã Nguồn Lên GitHub**:
   - Repository chính thức: [https://github.com/khacdiep168/Pos](https://github.com/khacdiep168/Pos).
   - Nhánh chính: `main`.
   - Đã commit và push 100% mã nguồn, tài liệu thiết kế và kiểm thử thành công.

---

## 13. Phase 2.1: TDD Auto-Fix, Multi-device Sync & Vercel Deployment - HOÀN TẤT
Hoàn thành kiểm thử tự động TDD, nâng cấp kiến trúc đồng bộ thời gian thực đa thiết bị trên nền Supabase Realtime và chuẩn bị sẵn sàng deploy production trên Vercel:

1. **Thiết Lập Unit Test & TDD Auto-Fix**:
   - **Framework**: Cài đặt Vitest hiện đại, siêu nhẹ, tương thích 100% với Next.js và Turbopack (`vitest.config.mts`).
   - **Bộ Test Suite Cốt Lõi (15/15 Tests Passed - 100%)**:
     - `src/services/__tests__/orderService.test.ts` (3 tests): Kiểm thử chính xác tính Subtotal, tính thuế VAT 8%, áp dụng Voucher giảm giá cố định (Fixed Amount), Voucher theo % (Percentage Discount) và quy trình hoàn tất thanh toán `completePayment`.
     - `src/services/__tests__/inventoryService.test.ts` (3 tests): Kiểm thử công thức tính Giá vốn bình quân di động (Moving Average Cost) khi nhập hàng mới, tính giá vốn món ăn (COGS) theo bảng định mức BOM, và kiểm thử tự động trừ tồn kho nguyên liệu chính xác theo số ly/món khách gọi khi đơn hàng hoàn tất.
     - `src/services/__tests__/authService.test.ts` (9 tests): Kiểm thử xác thực đăng nhập (thành công, sai mật khẩu, tài khoản không tồn tại), ma trận phân quyền Role-Based Access Control (RBAC) nghiêm ngặt cho từng vai trò (`waiter`, `kitchen`, `bar`, `cashier`, `manager`, `admin`), và module khởi tạo mặc định.

2. **Nâng Cấp Đồng Bộ Đa Thiết Bị Thời Gian Thực (Multi-Device Sync - [src/services/realtimeEngine.ts](file:///e:/Vibe%20Coding/POS/src/services/realtimeEngine.ts))**:
   - Thay thế kiến trúc BroadcastChannel đơn máy cục bộ bằng **Supabase Realtime Channel**.
   - Tạo phòng phát chung `pos-channel`, sử dụng phương thức broadcast `pos-event`.
   - Mọi thiết bị khác nhau (Máy tính thu ngân tại quầy, điện thoại phục vụ đi bàn, máy tính bảng nhà bếp/bar) cùng kết nối chung database Supabase đều nhận ngay lập tức các sự kiện trọng yếu: `ORDER_CREATED`, `PAYMENT_COMPLETED`, `ITEM_STATUS_CHANGED`, `TABLE_STATUS_CHANGED`... với độ trễ gần như 0ms.
   - Cơ chế Fallback thông minh: Vẫn duy trì BroadcastChannel nội bộ giữa các tab trên cùng máy và Local Event Bus giúp hệ thống hoạt động ổn định kể cả khi mất kết nối mạng Internet.

3. **Đồng Bộ Dữ Liệu Hai Chiều Lên Supabase Cloud Database ([src/services/menuService.ts](file:///e:/Vibe%20Coding/POS/src/services/menuService.ts), [src/components/foh/FOHView.tsx](file:///e:/Vibe%20Coding/POS/src/components/foh/FOHView.tsx))**:
   - **Tạo bảng PostgreSQL trên Supabase**: Đã thiết lập các bảng `pos_categories`, `pos_menu_items`, `pos_zones`, `pos_tables`, `pos_orders` kèm Public RLS Policies và kích hoạt `supabase_realtime` publication.
   - **Đồng bộ 2 chiều (2-Way Cloud Sync)**: Khi người dùng tạo/sửa/xóa món ăn trên máy tính, dữ liệu được ghi tức thì lên bảng `pos_menu_items` của Supabase Cloud và phát tín hiệu Realtime.
   - **Tự động kéo dữ liệu trên điện thoại di động**: Khi điện thoại mở app hoặc nhận sự kiện Postgres Changes, `menuService.syncFromSupabase()` tự động tải dữ liệu thực tế mới nhất từ đám mây, xóa bỏ triệt để rào cản cô lập bộ nhớ cục bộ `localStorage`.
   - **Kiểm thử trực tiếp trên giao diện**: Đã chạy Browser Subagent kiểm thử trực tiếp trên giao diện FOH (`http://localhost:3003`). Món mới tạo **"Cà phê đá" (25.000 đ)** xuất hiện nổi bật ngay vị trí đầu tiên của Lưới Gọi Món FOH.

4. **Tương Thích Vercel & Production Build**:
   - Next.js 16 Production Build (`npm run build`): Đạt 0 lỗi, Turbopack + PPR hoàn tất tối ưu cho toàn bộ 11 routes.
   - **Tối ưu hóa CI/CD Vercel**: Đã cấu hình `.npmrc` với `legacy-peer-deps=true` và nâng cấp `@types/node` lên `^22` để triệt tiêu hoàn toàn xung đột npm ERESOLVE giữa Vitest 5 và Next.js.
   - Sẵn sàng kích hoạt Vercel Git Integration tự động deploy lên domain [https://pos-kd.vercel.app/](https://pos-kd.vercel.app/) ngay khi đẩy code lên nhánh `main`.

---

## 14. Các bước tiếp theo (Phase 2.2 - Live Monitoring & Hardware Setup)
1. Kiểm tra bản build mới nhất trên Vercel tại [https://vercel.com/dashboard](https://vercel.com/dashboard) (đang tự động deploy xanh mượt).
2. Mở đồng thời [https://pos-kd.vercel.app/](https://pos-kd.vercel.app/) trên máy tính và điện thoại để trải nghiệm gọi món, ra món và thanh toán đồng bộ thời gian thực.
3. Kết nối máy in nhiệt Bluetooth/LAN thật tại quầy để in thử nghiệm.

---

## 15. Luật vận hành (Agent Working Rules)
- **Trước mỗi câu lệnh mới**: Luôn đọc `STATE.md` để nắm bắt ngay hiện trạng và quyết định kỹ thuật, không đọc lại toàn bộ code để tiết kiệm token.
- **Sau mỗi tính năng/task**: Tự động cập nhật `STATE.md`.
- **Kỷ luật chất lượng**: Tuân thủ TDD, modular components, phong cách giao diện hiện đại và an toàn dữ liệu.


