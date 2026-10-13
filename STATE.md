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

## 7. Các task tiếp theo cần làm (Phase 2 Roadmap)
1. Kết nối Backend API thật với Supabase Cloud Project (chạy file migration trong `DATABASE_MIGRATION.md`).
2. Tích hợp Webhook đồng bộ biến động số dư ngân hàng tự động (Cass.vn / SePay / PayOS API) cho cổng VietQR.
3. Đóng gói PWA (Progressive Web App) hỗ trợ cài đặt trên Tablet/Điện thoại và máy in Bluetooth/LAN.

---

## 6. Luật vận hành (Agent Working Rules)
- **Trước mỗi câu lệnh mới**: Luôn đọc `STATE.md` để nắm bắt ngay hiện trạng và quyết định kỹ thuật, không đọc lại toàn bộ code để tiết kiệm token.
- **Sau mỗi tính năng/task**: Tự động cập nhật `STATE.md`.
- **Kỷ luật chất lượng**: Tuân thủ TDD, modular components, phong cách giao diện hiện đại và an toàn dữ liệu.
