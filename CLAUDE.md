# Project: Smart Restaurant POS & Real-Time Order System (CLAUDE.md)

## 1. Giới thiệu & Tổng quan dự án
Ứng dụng Web Quản lý Nhà hàng thông minh, tập trung vào trải nghiệm đặt món trực quan (có hình ảnh, danh mục, tùy chọn topping), điều phối đơn hàng thời gian thực (Real-time Order Routing) giữa **Khách hàng/Thu ngân**, **Bếp (Kitchen Display System - KDS)**, và **Quầy Bar**.

---

## 2. Kiến trúc Công nghệ Đề xuất (Tech Stack)
* **Frontend:** React (hoặc Next.js / HTML5 + Bootstrap tùy chọn tối ưu tốc độ), Tailwind CSS cho giao diện hiện đại, trực quan, tối ưu trên cả thiết bị di động (Tablet cho nhân viên/khách) và máy tính (Màn hình Thu ngân/Bếp).
* **Real-time Engine:** WebSocket (hoặc Supabase Realtime / Firebase) để đồng bộ trạng thái đơn hàng lập tức giữa các màn hình mà không cần tải lại trang.
* **Backend / API:** Node.js (Express) hoặc Python (FastAPI).
* **Database:** PostgreSQL hoặc SQLite (Lưu trữ danh mục món ăn, bàn, lịch sử hóa đơn, trạng thái order).

---

## 3. Các Chức năng Cốt lõi (Core Features)

### 3.1. Phân hệ Khách hàng / Nhân viên Order (Front-of-House)
* **Menu Trực quan:** Hiển thị danh mục món ăn/thức uống dưới dạng lưới thẻ (Grid Cards) có hình ảnh sắc nét, giá tiền, mô tả ngắn và trạng thái (Còn món / Hết món).
* **Tùy chỉnh món (Modifiers):** Cho phép chọn tùy chọn thêm (ít đá, nhiều đường, thêm topping, không hành...).
* **Giỏ hàng & Gửi Order:** Xem lại danh sách món đã chọn theo bàn (Table ID), xác nhận và gửi order trực tiếp vào hệ thống.

### 3.2. Phân hệ Quản lý Bếp & Quầy Bar (Kitchen/Bar Display System - KDS)
* **Màn hình Bếp (Kitchen):** Tự động nhận order mới đổ về theo thời gian thực (có âm thanh thông báo). Hiển thị chi tiết: Tên món, số lượng, ghi chú của khách, số bàn, và thời gian chờ.
* **Cập nhật trạng thái:** Nhân viên bếp bấm nút **"Đang thực hiện"** -> **"Hoàn thành"**. Trạng thái này sẽ đồng thời báo về màn hình thu ngân và nhân viên chạy bàn (Runner).
* **Phân tách Bar/Kitchen:** Tự động định tuyến (Routing): Các món nước (đồ uống) tự động đổ về màn hình Quầy Bar, món ăn chín đổ về màn hình Bếp.

### 3.3. Phân hệ Thu ngân & Quản lý (Cashier & Management)
* **Sơ đồ bàn (Table Management):** Trạng thái bàn trực quan (Bàn trống, Bàn đang phục vụ, Bàn đã tính tiền).
* **Thanh toán & In hóa đơn:** Tổng hợp món của bàn, hỗ trợ tính tiền, chiết khấu, và xuất hóa đơn.
* **Báo cáo doanh thu:** Thống kê nhanh doanh thu trong ngày, món bán chạy nhất.

### 3.4. Phân hệ Quản trị Nguồn lực (ERP, Inventory & CRM)
*   **Inventory & Recipe (Định mức):** Cấu hình nguyên liệu thành phần (BOM) cho từng món với đơn vị quy đổi (kg -> gram). Tự động trừ tồn kho (Auto-deduct) theo thời gian thực khi bếp hoàn tất món.
*   **Procurement (Nhập hàng):** Quản lý hồ sơ Nhà cung cấp, tạo Phiếu nhập kho (PO), theo dõi công nợ, và tự động tính lại Giá vốn trung bình (Moving Average Cost) sau mỗi lần nhập.
*   **Financial & COGS:** Phân tích Giá vốn hàng bán và Biên lợi nhuận gộp (Profit Margin) trên từng món ăn/thức uống.
*   **CRM (Khách hàng):** Quản lý hội viên qua Số điện thoại, hệ thống tích điểm (Loyalty points) và tự động chiết khấu theo hạng thẻ.
*   **Executive Dashboard:** Biểu đồ trực quan (Recharts / Chart.js) thống kê doanh thu, dòng tiền, top sản phẩm bán chạy, và cảnh báo tồn kho dưới mức an toàn.

### 3.4. Phân hệ Quản trị Hệ thống & Cấu hình (Admin Settings & HR)
*   **Cấu hình Thông tin Cửa hàng (Store Setup):** Cho phép Admin tải lên Logo, cập nhật tên quán, địa chỉ, số điện thoại liên hệ, giờ mở cửa/đóng cửa, và các liên kết mạng xã hội. Thông tin này sẽ tự động xuất hiện trên Hóa đơn in, Menu điện tử, và giao diện ứng dụng.
*   **Quản lý Khuyến mãi & Voucher (Promotions & Discounts):** Thiết lập các chương trình khuyến mãi linh hoạt: giảm giá theo phần trăm (%), giảm số tiền cố định, hoặc tặng món (Mua 2 tặng 1). Hỗ trợ thiết lập điều kiện kích hoạt: theo khung giờ (Happy Hour), theo tổng giá trị hóa đơn (bill trên 500k), hoặc theo hạng thẻ hội viên. Cung cấp mã Voucher để thu ngân nhập khi thanh toán.
*   **Quản lý Nhân sự & Phân quyền (HR & RBAC):** Khởi tạo tài khoản cho nhân viên với hệ thống phân quyền (Role-Based Access Control) rõ ràng:
    *   *Quản lý (Admin/Manager):* Toàn quyền truy cập Dashboard, cấu hình giá, xem báo cáo doanh thu, quản lý kho.
    *   *Thu ngân (Cashier):* Mở/kết ca, nhận order, thanh toán, in hóa đơn.
    *   *Bếp/Bar (Kitchen/Bar):* Chỉ truy cập KDS, thay đổi trạng thái món (Từ chối, Đang làm, Xong).
    *   *Phục vụ (Waiter):* Truy cập giao diện order, xem trạng thái bàn, gửi order xuống bếp.

---



## 4. Quy trình Phát triển & Kỷ luật Code (Tích hợp từ Superpowers & AAS Skills)
Khi phát triển dự án này trong Antigravity IDE, mọi tác vụ phải tuân thủ nghiêm ngặt các nguyên tắc sau:
1. **Brainstorming trước khi viết code:** Phân tích kỹ giao diện và luồng dữ liệu của từng tính năng trước khi sinh mã nguồn.
2. **Modular Code Structure:** Tách biệt rõ ràng các thư mục:
   * `/components` (Các thành phần UI: Menu Card, Order Item, KDS Board).
   * `/services` (API kết nối, Realtime socket handlers).
   * `/database` (Schema, Mock data hoặc migrations).
3. **Test-Driven / Quality Check:** Đảm bảo xử lý triệt để các lỗi ngoại lệ (ví dụ: mất kết nối realtime, hết món đột xuất) bằng quy trình `systematic-debugging`.

---

## 5. Cấu trúc Cơ sở dữ liệu Mẫu (Database Schema Core)

*   **Tables:** `id`, `table_number`, `status`
*   **Categories:** `id`, `name`, `type`
*   **MenuItems:** `id`, `category_id`, `name`, `price`, `image_url`, `station`, `is_available`
*   **Orders:** `id`, `table_id`, `order_status` (pending, cooking, ready, completed, cancelled), `payment_status`, `payment_method`, `total_amount`, `created_at`
*   **OrderItems:** `id`, `order_id`, `menu_item_id`, `quantity`, `notes`, `item_status`
*   **Payments:** `id`, `order_id`, `amount`, `payment_method`, `transaction_ref`, `created_at`

### 5.2. Dữ liệu Nguồn lực (ERP)
*   **RawMaterials:** `id`, `name`, `supplier_id`, `purchase_unit`, `recipe_unit`, `conversion_factor`, `current_stock`, `min_stock_level`, `avg_cost`
*   **Recipes (BOM):** `id`, `menu_item_id`, `raw_material_id`, `quantity`
*   **Suppliers:** `id`, `name`, `phone`, `total_debt`
*   **PurchaseOrders:** `id`, `supplier_id`, `total_amount`, `status`
*   **InventoryTransactions:** `id`, `raw_material_id`, `type` (in, out, waste, adjustment), `quantity_changed`, `reference_type`, `reference_id`
*   **Customers:** `id`, `name`, `phone`, `total_points`, `membership_tier`

### 5.3. Dữ liệu Cấu hình & Nhân sự (Admin Schema)
*   **StoreSettings (Cấu hình quán):** `id`, `store_name`, `logo_url`, `address`, `phone`, `business_hours`, `tax_rate`, `wifi_password`
*   **Promotions (Khuyến mãi):** `id`, `name`, `promo_code`, `discount_type` (percent, fixed_amount, free_item), `discount_value`, `min_order_value`, `start_date`, `end_date`, `is_active`, `applicable_roles`
*   **Users/Employees (Nhân viên):** `id`, `full_name`, `username`, `password_hash`, `role` (admin, manager, cashier, kitchen, waiter), `is_active`, `last_login`
*   **Shifts (Ca làm việc):** `id`, `user_id`, `start_time`, `end_time`, `start_cash`, `end_cash`, `status` (open, closed)

---

---

## 6. Hướng dẫn Lập trình cho AI (Superpowers & AAS Skills Integration)
*   **Kỷ luật Superpowers:** Luôn Brainstorming -> Lập kế hoạch (Plan) -> Viết Test (TDD) trước khi sinh mã nguồn thực tế.
*   **Triển khai AAS Skills:** Tận dụng `frontend-ui-ux` cho giao diện hiện đại, `secure-app-builder` cho bảo mật, và `systematic-debugging` để rà soát lỗi.
*   **Toàn vẹn dữ liệu:** Mọi tác vụ liên quan đến tài chính và trừ kho bắt buộc sử dụng cơ chế ACID Database Transactions (Rollback nếu lỗi).
*   **Real-time Focus:** Xử lý triệt để đồng bộ trạng thái qua WebSocket/Realtime engine, không yêu cầu người dùng tải lại trang.
## 7. Luồng Nghiệp vụ Cốt lõi (Core Business Flow & State Machine)

### 7.1. Vòng đời Đơn hàng & Trừ kho (Order Lifecycle & Inventory Trigger)
Hệ thống phải tuân thủ nghiêm ngặt vòng đời trạng thái của một đơn hàng (Order Status) và chi tiết món (Item Status):
1. **Khởi tạo (Pending):** Order được tạo (từ thiết bị của khách hoặc nhân viên phục vụ). Hệ thống ghi nhận nhưng CHƯA trừ kho.
2. **Thực hiện (Cooking/Preparing):** Bếp/Bar nhận order trên màn hình KDS và nhấn "Đang làm".
3. **Hoàn tất món (Ready):** Bếp/Bar nhấn "Xong". Màn hình phục vụ báo nhận món. Kho VẪN CHƯA bị trừ.
4. **Thanh toán & Trừ kho (Completed & Deducted - TRIGGER CHÍNH):** Thu ngân thực hiện thanh toán. Ngay khi trạng thái thanh toán là `SUCCESS`, hệ thống thực thi đồng thời một Database Transaction (ACID) gồm 3 việc:
   - Đổi trạng thái Order thành `Completed`.
   - Ghi nhận Doanh thu vào sổ quỹ theo `payment_method`.
   - Quét qua định mức (BOM) của các món trong Order và tự động ghi log trừ Tồn kho vào `InventoryTransactions`.

### 7.2. Tích hợp Đa phương thức Thanh toán (Omnichannel Payments)
* Hỗ trợ thanh toán hỗn hợp hoặc đơn lẻ: **Tiền mặt (Cash)**, **Chuyển khoản / Quét mã QR (Bank Transfer/VietQR)**, **Ví điện tử (Momo, ZaloPay)**, **Thẻ tín dụng (POS)**.
* Giao diện Thu ngân phải hiển thị mã QR động (Dynamic QR) tích hợp sẵn số tiền và mã đơn hàng nội dung chuyển khoản để đối soát tự động qua Open API của ngân hàng (nếu có).

---

