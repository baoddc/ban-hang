-- ==============================================================================
-- HE THONG QUAN TRI DOANH NGHIEP (ERP - CRM - SALES - DEBTS - INVENTORY)
-- SUPABASE ALL-IN-ONE SEED DATA & AUTO-REPAIR SCRIPT
-- ==============================================================================
-- Hướng dẫn:
-- 1. Đăng nhập vào trang quản trị Supabase (https://supabase.com).
-- 2. Chọn dự án của bạn -> Mở mục SQL Editor -> Click "New Query".
-- 3. Dán toàn bộ nội dung file này vào ô soạn thảo và bấm "Run" (Ctrl + Enter).
-- ==============================================================================

-- ==============================================================================
-- BƯỚC 1: TỰ ĐỘNG ĐẢM BẢO TẤT CẢ CÁC BẢNG & CỘT TỒN TẠI (AUTO SCHEMA CREATION)
-- ==============================================================================

-- 1. BẢNG KHÁCH HÀNG & ĐỐI TÁC (CUSTOMERS)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    distance_km VARCHAR(50),
    address TEXT,
    route VARCHAR(100),
    sales_person VARCHAR(100),
    type VARCHAR(50) DEFAULT 'Customer',
    group_name VARCHAR(50) DEFAULT 'Khách thường',
    current_debt NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS route VARCHAR(100);
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS sales_person VARCHAR(100);
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS distance_km VARCHAR(50);
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS current_debt NUMERIC(15, 2) DEFAULT 0;

-- 2. BẢNG NHÀ CUNG CẤP INBOUND (SUPPLIERS)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    tax_id VARCHAR(50),
    contact_person VARCHAR(100),
    group_name VARCHAR(50) DEFAULT 'Đại lý',
    route VARCHAR(100),
    current_debt NUMERIC(15, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. BẢNG SẢN PHẨM & QUẢN LÝ TỒN KHO (PRODUCTS)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    supplier_id UUID,
    supplier_name VARCHAR(255),
    category VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'Cái',
    cost_price NUMERIC(15, 2) DEFAULT 0,
    selling_price NUMERIC(15, 2) DEFAULT 0,
    stock_quantity NUMERIC(15, 2) DEFAULT 0,
    min_stock_alert NUMERIC(15, 2) DEFAULT 5,
    location VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS supplier_id UUID;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- 4. BẢNG ĐƠN BÁN HÀNG (ORDERS)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    shipping_fee NUMERIC(15, 2) DEFAULT 0,
    delivery_method VARCHAR(50) DEFAULT 'Delivery',
    discount NUMERIC(15, 2) DEFAULT 0,
    tax NUMERIC(15, 2) DEFAULT 0,
    final_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(15, 2) DEFAULT 0,
    debt_amount NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Completed',
    payment_method VARCHAR(50) DEFAULT 'Cash',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(50) DEFAULT 'Delivery';

-- 5. BẢNG CHI TIẾT ĐƠN HÀNG (ORDER ITEMS)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    quantity NUMERIC(15, 2) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL
);

-- 6. BẢNG QUẢN LÝ CHỨNG TỪ CÔNG NỢ (DEBTS)
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    order_code VARCHAR(50),
    type VARCHAR(50) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    remaining_amount NUMERIC(15, 2) NOT NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Unpaid',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE IF EXISTS public.debts ADD COLUMN IF NOT EXISTS order_code VARCHAR(50);

-- 7. BẢNG LỊCH SỬ THANH TOÁN CÔNG NỢ (DEBT PAYMENTS)
CREATE TABLE IF NOT EXISTS public.debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    payment_code VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Bank',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE IF EXISTS public.debt_payments ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

-- 8. BẢNG CHI TIẾT THẺ KHO & BIẾN ĐỘNG HÀNG HÓA (INVENTORY TRANSACTIONS)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(15, 2) NOT NULL,
    previous_stock NUMERIC(15, 2) NOT NULL,
    new_stock NUMERIC(15, 2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. BẢNG CRM KHÁCH HÀNG TIỀM NĂNG & PIPELINE (LEADS)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    estimated_value NUMERIC(15, 2) DEFAULT 0,
    stage VARCHAR(50) DEFAULT 'Lead',
    lost_reason TEXT,
    assigned_to VARCHAR(100) DEFAULT 'Nguyễn Thanh Tùng',
    next_activity_date TIMESTAMP WITH TIME ZONE,
    next_activity_note VARCHAR(255),
    stage_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. BẢNG KHÁCH HÀNG TRẢ HÀNG / ĐỔI TRẢ (RETURNS)
CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_code VARCHAR(50) UNIQUE NOT NULL,
    order_code VARCHAR(50),
    customer_name VARCHAR(255) NOT NULL,
    total_refund NUMERIC(15, 2) NOT NULL DEFAULT 0,
    refund_method VARCHAR(50) DEFAULT 'DebtDeduction',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. BẢNG YÊU CẦU MUA HÀNG & PHIẾU NHẬP INBOUND (INBOUND ORDERS)
CREATE TABLE IF NOT EXISTS public.inbound_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID,
    supplier_name VARCHAR(255) NOT NULL,
    warehouse VARCHAR(100),
    created_by VARCHAR(100) DEFAULT 'Kỹ thuật',
    expected_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    total_amount NUMERIC(15, 2) DEFAULT 0,
    notes TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    received_by VARCHAR(100),
    received_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE IF EXISTS public.inbound_orders ADD COLUMN IF NOT EXISTS warehouse VARCHAR(100);
ALTER TABLE IF EXISTS public.inbound_orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.inbound_orders ADD COLUMN IF NOT EXISTS received_by VARCHAR(100);
ALTER TABLE IF EXISTS public.inbound_orders ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE;

-- 12. BẢNG QUY TẮC & ĐỊNH MỨC PHÍ VẬN CHUYỂN (SHIPPING RULES)
CREATE TABLE IF NOT EXISTS public.shipping_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    min_distance NUMERIC(10, 2) DEFAULT 0,
    max_distance NUMERIC(10, 2) DEFAULT 9999,
    base_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 13. BẢNG QUẢN LÝ PHÁT MẪU SẢN PHẨM (PRODUCT SAMPLES)
CREATE TABLE IF NOT EXISTS public.product_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_address TEXT,
    route VARCHAR(100),
    sales_person VARCHAR(100),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_sku VARCHAR(50),
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity NUMERIC(15, 2) DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'Mẫu',
    handover_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Displaying',
    feedback TEXT,
    notes TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- BƯỚC 2: NẠP BỘ DỮ LIỆU MẪU CHUẨN (SEED DATA INSERTIONS)
-- ==============================================================================

-- 1. NHÀ CUNG CẤP (SUPPLIERS)
INSERT INTO public.suppliers (id, code, name, phone, email, address, tax_id, contact_person, group_name, route, current_debt, notes, created_at)
VALUES
('00000000-0000-4000-8000-000000000001', 'NCC01', 'Tổng Kho Phân Phối Dell Vietnam', '02838221100', 'order@dellvietnam.com.vn', 'Tòa nhà Bitexco, Số 2 Hải Triều, Bến Nghé, Quận 1, TP.HCM', '0301234567', 'Trần Minh Tuấn - Trưởng phòng Phân phối', 'Đại lý', 'Tuyến Quận 1 - Bình Thạnh', 0, 'Nhà phân phối chính thức máy chủ, máy trạm và laptop Dell', '2026-08-01 07:00:00+00'),
('00000000-0000-4000-8000-000000000002', 'NCC02', 'Công Ty TNHH LG Electronics VN', '02838332211', 'sales@lg-vietnam.vn', 'Khu Công Nghệ Cao, Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM', '0302345678', 'Nguyễn Bích Ngọc - Đại diện Bán buôn', 'Đại lý', 'Tuyến TP. Thủ Đức', 0, 'Cung cấp màn hình máy tính, thiết bị hiển thị LG UltraGear', '2026-08-01 07:15:00+00'),
('00000000-0000-4000-8000-000000000003', 'NCC03', 'Tổng Kho Linh Kiện Nam Sài Gòn', '02839443322', 'namsaigon.parts@gmail.com', 'Lô 37-39A, Đường 19/5A, KCN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM', '0304567890', 'Phạm Quốc Hùng - Quản lý Kho Tổng', 'Đại lý', 'Tuyến Tân Bình - Tân Phú', 28000000, 'Tổng kho linh kiện thiết bị mạng Cisco, chuột phím cơ Keychron & Logitech', '2026-08-01 07:30:00+00'),
('00000000-0000-4000-8000-000000000004', 'NCC04', 'Công Ty Cổ Phần Phân Phối Synnex FPT', '02873000911', 'fpt_distribution@synnexfpt.com.vn', 'Tòa nhà FPT Tân Thuận, Lô L.29B-31B-33B, KCX Tân Thuận, Quận 7, TP.HCM', '0103456789', 'Đỗ Khánh Linh - Giám đốc Kinh doanh', 'Đại lý', 'Tuyến Quận 7 - Nhà Bè', 0, 'Phân phối ủy quyền thiết bị lưu trữ Samsung SSD, tai nghe Sony', '2026-08-01 07:45:00+00')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  address = EXCLUDED.address,
  current_debt = EXCLUDED.current_debt;

-- 2. KHÁCH HÀNG & ĐỐI TÁC (CUSTOMERS)
INSERT INTO public.customers (id, code, name, phone, email, distance_km, address, route, sales_person, type, group_name, current_debt, created_at)
VALUES
('10000000-0000-4000-8000-000000000001', 'KH001', 'Công ty TNHH Công Nghệ Việt', '0903123456', 'contact@congngheviet.vn', '5', '123 Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, TP.HCM', 'Tuyến Quận 1 - Bình Thạnh', 'Nguyễn Thanh Tùng', 'Customer', 'VIP', 73700000, '2026-08-01 08:00:00+00'),
('10000000-0000-4000-8000-000000000002', 'KH002', 'Tập đoàn Bán Lẻ An Phát', '0918765432', 'purchasing@anphatretail.vn', '12', '45 Lê Văn Sỹ, Phường 13, Quận Phú Nhuận, TP.HCM', 'Tuyến Phú Nhuận - Gò Vấp', 'Lê Thu Hà', 'Customer', 'Đại lý', 59970000, '2026-08-01 08:30:00+00'),
('10000000-0000-4000-8000-000000000003', 'KH003', 'Cửa Hàng Điện Máy Minh Khoa', '0988112233', 'minhkhoaelectric@gmail.com', '18', '789 Quang Trung, Phường 8, Quận Gò Vấp, TP.HCM', 'Tuyến Phú Nhuận - Gò Vấp', 'Trần Đình Trọng', 'Customer', 'Khách thường', 0, '2026-08-02 09:00:00+00'),
('10000000-0000-4000-8000-000000000004', 'KH004', 'Đại Lý Thiết Bị Viễn Thông Á Châu', '0933556677', 'info@achaucorp.com.vn', '35', '12 Đại Lộ Bình Dương, TP. Thủ Dầu Một, Bình Dương', 'Tuyến Miền Đông (Bình Dương - Đồng Nai)', 'Nguyễn Thanh Tùng', 'Customer', 'Đại lý', 15000000, '2026-08-03 10:00:00+00'),
('10000000-0000-4000-8000-000000000005', 'KH005', 'Công ty Cổ phần Giải pháp Số Nam Việt', '0977889900', 'contact@namviet-digital.vn', '165', '102 Trần Phú, Phường Cái Khế, Quận Ninh Kiều, Cần Thơ', 'Tuyến Miền Tây (Long An - Tiền Giang - Cần Thơ)', 'Lê Thu Hà', 'Customer', 'VIP', 0, '2026-08-04 11:00:00+00'),
('10000000-0000-4000-8000-000000000006', 'KH006', 'Trung Tâm Tin Học Trẻ Hoàng Long', '0966445566', 'hoanglong.edu@gmail.com', '15', '88 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM', 'Tuyến TP. Thủ Đức', 'Trần Đình Trọng', 'Customer', 'Khách thường', 0, '2026-08-05 13:30:00+00')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  distance_km = EXCLUDED.distance_km,
  address = EXCLUDED.address,
  route = EXCLUDED.route,
  sales_person = EXCLUDED.sales_person,
  current_debt = EXCLUDED.current_debt;

-- 3. SẢN PHẨM & KHO BÃI (PRODUCTS)
INSERT INTO public.products (id, sku, name, supplier_id, supplier_name, category, unit, cost_price, selling_price, stock_quantity, min_stock_alert, location, created_at)
VALUES
('20000000-0000-4000-8000-000000000001', 'LAP-DEL-XPS13', 'Laptop Dell XPS 13 i7 16GB 512GB SSD', '00000000-0000-4000-8000-000000000001', 'Tổng Kho Phân Phối Dell Vietnam', 'Máy tính & Laptop', 'Cái', 21500000, 26900000, 14, 5, 'Khu A - Kệ 01', '2026-08-01 08:00:00+00'),
('20000000-0000-4000-8000-000000000002', 'MON-LG-27GP', 'Màn Hình Gaming LG UltraGear 27 inch 2K 144Hz', '00000000-0000-4000-8000-000000000002', 'Công Ty TNHH LG Electronics VN', 'Màn hình', 'Cái', 4300000, 5990000, 28, 8, 'Khu A - Kệ 02', '2026-08-01 08:15:00+00'),
('20000000-0000-4000-8000-000000000003', 'MOU-LOG-MX3S', 'Chuột Không Dây Logitech MX Master 3S', '00000000-0000-4000-8000-000000000003', 'Tổng Kho Linh Kiện Nam Sài Gòn', 'Phụ kiện', 'Cái', 1750000, 2450000, 45, 10, 'Khu B - Kệ 01', '2026-08-01 08:30:00+00'),
('20000000-0000-4000-8000-000000000004', 'KEY-KEY-K2V2', 'Bàn Phím Cơ Wireless Keychron K2 V2 RGB', '00000000-0000-4000-8000-000000000003', 'Tổng Kho Linh Kiện Nam Sài Gòn', 'Phụ kiện', 'Cái', 1350000, 1950000, 4, 8, 'Khu B - Kệ 02', '2026-08-01 08:45:00+00'),
('20000000-0000-4000-8000-000000000005', 'SRV-DEL-T150', 'Máy Chủ Server Dell PowerEdge T150 Xeon E-2314', '00000000-0000-4000-8000-000000000001', 'Tổng Kho Phân Phối Dell Vietnam', 'Thiết bị Mạng & Server', 'Cái', 30500000, 38500000, 2, 2, 'Khu C - Tủ Bảo Vệ 01', '2026-08-01 09:00:00+00'),
('20000000-0000-4000-8000-000000000006', 'ROU-CIS-1000', 'Thiết Bị Định Tuyến Router Cisco RV340 Dual WAN', '00000000-0000-4000-8000-000000000003', 'Tổng Kho Linh Kiện Nam Sài Gòn', 'Thiết bị Mạng & Server', 'Bộ', 4800000, 6500000, 12, 4, 'Khu C - Kệ 02', '2026-08-01 09:15:00+00'),
('20000000-0000-4000-8000-000000000007', 'HEA-SON-WH1000', 'Tai Nghe Chống Ồn Sony WH-1000XM5 Wireless', '00000000-0000-4000-8000-000000000004', 'Công Ty Cổ Phần Phân Phối Synnex FPT', 'Phụ kiện', 'Cái', 5200000, 6990000, 16, 5, 'Khu B - Kệ 03', '2026-08-01 09:30:00+00'),
('20000000-0000-4000-8000-000000000008', 'SSD-SAM-980PRO', 'Ổ Cứng SSD Samsung 980 PRO NVMe M.2 1TB', '00000000-0000-4000-8000-000000000004', 'Công Ty Cổ Phần Phân Phối Synnex FPT', 'Linh kiện máy tính', 'Chiếc', 2100000, 2850000, 35, 10, 'Khu A - Kệ 03', '2026-08-01 09:45:00+00');

-- 4. ĐƠN BÁN HÀNG (ORDERS) & CHI TIẾT (ORDER_ITEMS)
INSERT INTO public.orders (id, order_code, customer_id, customer_name, total_amount, shipping_fee, delivery_method, discount, tax, final_amount, paid_amount, debt_amount, status, payment_method, notes, created_at)
VALUES
('30000000-0000-4000-8000-000000000001', 'HD20260801', '10000000-0000-4000-8000-000000000001', 'Công ty TNHH Công Nghệ Việt', 26900000, 0, 'Delivery', 900000, 0, 26000000, 10500000, 15500000, 'Completed', 'Bank', 'Giao trong giờ hành chính, xuất hóa đơn VAT', '2026-08-04 10:30:00+00'),
('30000000-0000-4000-8000-000000000002', 'HD20260802', '10000000-0000-4000-8000-000000000002', 'Tập đoàn Bán Lẻ An Phát', 42000000, 0, 'Delivery', 0, 0, 42000000, 0, 42000000, 'Completed', 'Debt', 'Đơn hàng theo hợp đồng khung đợt 1', '2026-08-06 14:15:00+00'),
('30000000-0000-4000-8000-000000000003', 'HD20260808', '10000000-0000-4000-8000-000000000001', 'Công ty TNHH Công Nghệ Việt', 53800000, 0, 'Delivery', 0, 0, 53800000, 0, 53800000, 'Completed', 'Debt', 'Bổ sung máy trạm lập trình', '2026-08-08 09:15:00+00'),
('30000000-0000-4000-8000-000000000004', 'HD20260725', '10000000-0000-4000-8000-000000000001', 'Công ty TNHH Công Nghệ Việt', 11980000, 0, 'Pickup', 0, 0, 11980000, 7580000, 4400000, 'Completed', 'Debt', 'Khách tự nhận tại kho', '2026-07-25 16:00:00+00'),
('30000000-0000-4000-8000-000000000005', 'HD20260807', '10000000-0000-4000-8000-000000000003', 'Cửa Hàng Điện Máy Minh Khoa', 9840000, 50000, 'Delivery', 0, 0, 9890000, 9890000, 0, 'Completed', 'Cash', 'Đã thanh toán tiền mặt đủ khi giao', '2026-08-07 11:20:00+00'),
('30000000-0000-4000-8000-000000000006', 'HD20260815', '10000000-0000-4000-8000-000000000004', 'Đại Lý Thiết Bị Viễn Thông Á Châu', 35000000, 120000, 'Delivery', 120000, 0, 35000000, 20000000, 15000000, 'Completed', 'Debt', 'Đại lý công nợ gối đầu', '2026-08-15 15:00:00+00')
ON CONFLICT (order_code) DO NOTHING;

INSERT INTO public.order_items (id, order_id, product_id, product_name, unit_price, quantity, subtotal)
VALUES
('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Laptop Dell XPS 13 i7 16GB 512GB SSD', 26900000, 1, 26900000),
('31000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000005', 'Máy Chủ Server Dell PowerEdge T150 Xeon E-2314', 38500000, 1, 38500000),
('31000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003', 'Chuột Không Dây Logitech MX Master 3S', 3500000, 1, 3500000),
('31000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'Laptop Dell XPS 13 i7 16GB 512GB SSD', 26900000, 2, 53800000),
('31000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', 'Màn Hình Gaming LG UltraGear 27 inch 2K 144Hz', 5990000, 2, 11980000),
('31000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000004', 'Bàn Phím Cơ Wireless Keychron K2 V2 RGB', 1950000, 2, 3900000),
('31000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000002', 'Màn Hình Gaming LG UltraGear 27 inch 2K 144Hz', 5940000, 1, 5940000),
('31000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000006', 'Thiết Bị Định Tuyến Router Cisco RV340 Dual WAN', 6500000, 4, 26000000),
('31000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000008', 'Ổ Cứng SSD Samsung 980 PRO NVMe M.2 1TB', 2850000, 3, 8550000);

-- 5. CÔNG NỢ (DEBTS) & THANH TOÁN (DEBT_PAYMENTS)
INSERT INTO public.debts (id, code, customer_id, customer_name, order_id, order_code, type, total_amount, remaining_amount, due_date, status, notes, created_at)
VALUES
('40000000-0000-4000-8000-000000000001', 'CN-PT-001', '10000000-0000-4000-8000-000000000001', 'Công ty TNHH Công Nghệ Việt', '30000000-0000-4000-8000-000000000001', 'HD20260801', 'Receivable', 15500000, 15500000, '2026-08-25', 'Unpaid', 'Công nợ từ đơn HD20260801', '2026-08-04 10:30:00+00'),
('40000000-0000-4000-8000-000000000002', 'CN-PT-456', '10000000-0000-4000-8000-000000000001', 'Công ty TNHH Công Nghệ Việt', '30000000-0000-4000-8000-000000000003', 'HD20260808', 'Receivable', 53800000, 53800000, '2026-09-08', 'Unpaid', 'Ghi nhận công nợ đơn HD20260808', '2026-08-08 09:15:00+00'),
('40000000-0000-4000-8000-000000000003', 'CN-PT-808', '10000000-0000-4000-8000-000000000001', 'Công ty TNHH Công Nghệ Việt', '30000000-0000-4000-8000-000000000004', 'HD20260725', 'Receivable', 4400000, 4400000, '2026-08-15', 'Overdue', 'Ghi nhận công nợ đơn HD20260725 quá hạn', '2026-07-25 16:00:00+00'),
('40000000-0000-4000-8000-000000000004', 'CN-PT-002', '10000000-0000-4000-8000-000000000002', 'Tập đoàn Bán Lẻ An Phát', '30000000-0000-4000-8000-000000000002', 'HD20260802', 'Receivable', 42000000, 42000000, '2026-08-30', 'Unpaid', 'Công nợ từ đơn HD20260802', '2026-08-06 14:15:00+00'),
('40000000-0000-4000-8000-000000000005', 'CN-PT-330', '10000000-0000-4000-8000-000000000002', 'Tập đoàn Bán Lẻ An Phát', NULL, NULL, 'Receivable', 17970000, 17970000, '2026-09-01', 'Unpaid', 'Công nợ linh kiện đợt 2', '2026-08-01 15:00:00+00'),
('40000000-0000-4000-8000-000000000006', 'CN-PT-004', '10000000-0000-4000-8000-000000000004', 'Đại Lý Thiết Bị Viễn Thông Á Châu', '30000000-0000-4000-8000-000000000006', 'HD20260815', 'Receivable', 15000000, 15000000, '2026-09-15', 'Unpaid', 'Công nợ đơn hàng HD20260815', '2026-08-15 15:00:00+00'),
('40000000-0000-4000-8000-000000000007', 'CN-TRA-001', '10000000-0000-4000-8000-000000000001', 'Tổng Kho Linh Kiện Nam Sài Gòn', NULL, NULL, 'Payable', 28000000, 28000000, '2026-08-20', 'Unpaid', 'Nợ tiền hàng nhập linh kiện mạng', '2026-08-01 10:00:00+00')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.debt_payments (id, debt_id, customer_name, payment_code, amount, payment_method, note, created_at)
VALUES
('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'Công ty TNHH Công Nghệ Việt', 'TT-20260804', 10500000, 'Bank', 'Thanh toán đợt 1 tiền hàng Laptop XPS (HD20260801)', '2026-08-04 11:00:00+00'),
('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000006', 'Đại Lý Thiết Bị Viễn Thông Á Châu', 'TT-20260815', 20000000, 'Bank', 'Thanh toán tiền hàng đợt 1 đơn HD20260815', '2026-08-15 15:30:00+00')
ON CONFLICT (id) DO NOTHING;

-- 6. LỊCH SỬ KHO (INVENTORY_TRANSACTIONS)
INSERT INTO public.inventory_transactions (id, code, type, product_id, product_name, quantity, previous_stock, new_stock, reason, created_at)
VALUES
('60000000-0000-4000-8000-000000000001', 'NK-20260801', 'StockIn', '20000000-0000-4000-8000-000000000001', 'Laptop Dell XPS 13 i7 16GB 512GB SSD', 10, 4, 14, 'Nhập kho đơn hàng NK20260801 từ Dell VN', '2026-08-01 09:00:00+00'),
('60000000-0000-4000-8000-000000000002', 'XK-20260804', 'StockOut', '20000000-0000-4000-8000-000000000001', 'Laptop Dell XPS 13 i7 16GB 512GB SSD', 1, 14, 13, 'Xuất bán cho khách hàng Công Nghệ Việt (HD20260801)', '2026-08-04 10:30:00+00'),
('60000000-0000-4000-8000-000000000003', 'NK-20260803', 'StockIn', '20000000-0000-4000-8000-000000000002', 'Màn Hình Gaming LG UltraGear 27 inch 2K 144Hz', 20, 10, 30, 'Nhập kho lô màn hình từ LG Electronics VN', '2026-08-03 14:30:00+00'),
('60000000-0000-4000-8000-000000000004', 'XK-20260807', 'StockOut', '20000000-0000-4000-8000-000000000004', 'Bàn Phím Cơ Wireless Keychron K2 V2 RGB', 2, 6, 4, 'Xuất bán đơn HD20260807 (Điện Máy Minh Khoa)', '2026-08-07 11:20:00+00')
ON CONFLICT (code) DO NOTHING;

-- 7. LEADS CRM
INSERT INTO public.leads (id, name, company, phone, email, estimated_value, stage, assigned_to, notes, created_at)
VALUES
('70000000-0000-4000-8000-000000000001', 'Nguyễn Văn Nam', 'Công ty Cổ phần Phần mềm BK Tech', '0933112233', 'nam.nguyen@bksoft.vn', 120000000, 'Proposal', 'Nguyễn Thanh Tùng', 'Yêu cầu báo giá 10 máy trạm Dell XPS và 10 màn hình LG UltraGear', '2026-08-11 08:30:00+00'),
('70000000-0000-4000-8000-000000000002', 'Trần Thị Thu Hoa', 'Chuỗi Nhà Hàng Cà Phê Phố Biển', '0944556677', 'hoatt@phobien.com', 45000000, 'Negotiation', 'Lê Thu Hà', 'Cần tư vấn thiết bị mạng Cisco và hệ thống server POS cho 3 chi nhánh', '2026-08-14 10:00:00+00'),
('70000000-0000-4000-8000-000000000003', 'Phạm Quốc Cường', 'Đại Học Quốc Tế Đông Á', '0966778899', 'cuong.pq@easia.edu.vn', 350000000, 'Contacted', 'Nguyễn Thanh Tùng', 'Dự án phòng Lab máy tính và Server Dell PowerEdge', '2026-08-16 13:45:00+00'),
('70000000-0000-4000-8000-000000000004', 'Lê Văn Minh', 'Công ty TNHH Logistics Vận Tải Toàn Cầu', '0912334455', 'minh.le@globallogistics.vn', 85000000, 'Lead', 'Trần Đình Trọng', 'Khách liên hệ qua website cần nâng cấp hệ thống máy văn phòng', '2026-08-18 09:15:00+00');

-- 8. ĐỔI TRẢ HÀNG (RETURNS)
INSERT INTO public.returns (id, return_code, order_code, customer_name, total_refund, refund_method, reason, created_at)
VALUES
('80000000-0000-4000-8000-000000000001', 'TH20260801', 'HD20260801', 'Công ty TNHH Công Nghệ Việt', 2450000, 'DebtDeduction', 'Khách hàng đổi mẫu chuột, trừ trực tiếp vào công nợ', '2026-08-07 15:20:00+00')
ON CONFLICT (return_code) DO NOTHING;

-- 9. PHIẾU NHẬP KHO (INBOUND_ORDERS)
INSERT INTO public.inbound_orders (id, code, supplier_id, supplier_name, warehouse, total_amount, status, received_by, received_at, notes, items, created_at)
VALUES
('90000000-0000-4000-8000-000000000001', 'NK20260801', '00000000-0000-4000-8000-000000000001', 'Tổng Kho Phân Phối Dell Vietnam', 'Kho Tổng (Miền Nam)', 215000000, 'Completed', 'Trần Thủ Kho', '2026-08-01 09:00:00+00', 'Nhập lô 10 Laptop Dell XPS 13', '[{"product_id":"20000000-0000-4000-8000-000000000001","sku":"LAP-DEL-XPS13","product_name":"Laptop Dell XPS 13 i7 16GB 512GB SSD","quantity":10,"unit":"Cái","unit_price":21500000,"subtotal":215000000}]'::jsonb, '2026-08-01 08:00:00+00'),
('90000000-0000-4000-8000-000000000002', 'NK20260803', '00000000-0000-4000-8000-000000000002', 'Công Ty TNHH LG Electronics VN', 'Kho Tổng (Miền Nam)', 86000000, 'Completed', 'Trần Thủ Kho', '2026-08-03 14:30:00+00', 'Nhập 20 màn hình LG UltraGear 27 inch', '[{"product_id":"20000000-0000-4000-8000-000000000002","sku":"MON-LG-27GP","product_name":"Màn Hình Gaming LG UltraGear 27 inch 2K 144Hz","quantity":20,"unit":"Cái","unit_price":4300000,"subtotal":86000000}]'::jsonb, '2026-08-03 10:00:00+00'),
('90000000-0000-4000-8000-000000000003', 'NK20260818', '00000000-0000-4000-8000-000000000003', 'Tổng Kho Linh Kiện Nam Sài Gòn', 'Kho Tổng (Miền Nam)', 38500000, 'Pending', 'Nguyễn Văn Kho', NULL, 'Đơn đặt hàng phụ kiện Keychron & Cisco đang chờ nhà xe giao', '[{"product_id":"20000000-0000-4000-8000-000000000004","sku":"KEY-KEY-K2V2","product_name":"Bàn Phím Cơ Wireless Keychron K2 V2 RGB","quantity":10,"unit":"Cái","unit_price":1350000,"subtotal":13500000},{"product_id":"20000000-0000-4000-8000-000000000006","sku":"ROU-CIS-1000","product_name":"Thiết Bị Định Tuyến Router Cisco RV340 Dual WAN","quantity":5,"unit":"Bộ","unit_price":5000000,"subtotal":25000000}]'::jsonb, '2026-08-18 08:00:00+00')
ON CONFLICT (code) DO NOTHING;

-- 10. BẢNG CƯỚC PHÍ VẬN CHUYỂN (SHIPPING_RULES)
INSERT INTO public.shipping_rules (id, category, min_distance, max_distance, base_fee, is_active, notes)
VALUES
('a0000000-0000-4000-8000-000000000001', 'LAP-DEL-XPS13', 0, 15, 30000, true, 'Khoảng cách ≤ 15 km'),
('a0000000-0000-4000-8000-000000000002', 'LAP-DEL-XPS13', 15, 30, 65000, true, 'Từ 16 đến ≤ 30 km'),
('a0000000-0000-4000-8000-000000000003', 'LAP-DEL-XPS13', 30, 60, 110000, true, 'Từ 31 đến ≤ 60 km'),
('a0000000-0000-4000-8000-000000000004', 'LAP-DEL-XPS13', 60, 90, 160000, true, 'Từ 61 đến ≤ 90 km'),
('a0000000-0000-4000-8000-000000000005', 'LAP-DEL-XPS13', 90, 9999, 220000, true, 'Khoảng cách > 90 km'),
('a0000000-0000-4000-8000-000000000006', 'MON-LG-27GP', 0, 15, 35000, true, 'Khoảng cách ≤ 15 km'),
('a0000000-0000-4000-8000-000000000007', 'MON-LG-27GP', 15, 30, 70000, true, 'Từ 16 đến ≤ 30 km'),
('a0000000-0000-4000-8000-000000000008', 'MON-LG-27GP', 30, 60, 120000, true, 'Từ 31 đến ≤ 60 km'),
('a0000000-0000-4000-8000-000000000009', 'MON-LG-27GP', 60, 90, 180000, true, 'Từ 61 đến ≤ 90 km'),
('a0000000-0000-4000-8000-000000000010', 'MON-LG-27GP', 90, 9999, 250000, true, 'Khoảng cách > 90 km'),
('a0000000-0000-4000-8000-000000000011', 'MOU-LOG-MX3S', 0, 15, 20000, true, 'Khoảng cách ≤ 15 km'),
('a0000000-0000-4000-8000-000000000012', 'MOU-LOG-MX3S', 15, 30, 35000, true, 'Từ 16 đến ≤ 30 km'),
('a0000000-0000-4000-8000-000000000013', 'MOU-LOG-MX3S', 30, 60, 55000, true, 'Từ 31 đến ≤ 60 km'),
('a0000000-0000-4000-8000-000000000014', 'MOU-LOG-MX3S', 60, 90, 80000, true, 'Từ 61 đến ≤ 90 km'),
('a0000000-0000-4000-8000-000000000015', 'MOU-LOG-MX3S', 90, 9999, 120000, true, 'Khoảng cách > 90 km'),
('a0000000-0000-4000-8000-000000000016', 'KEY-KEY-K2V2', 0, 15, 20000, true, 'Khoảng cách ≤ 15 km'),
('a0000000-0000-4000-8000-000000000017', 'KEY-KEY-K2V2', 15, 30, 35000, true, 'Từ 16 đến ≤ 30 km'),
('a0000000-0000-4000-8000-000000000018', 'KEY-KEY-K2V2', 30, 60, 60000, true, 'Từ 31 đến ≤ 60 km'),
('a0000000-0000-4000-8000-000000000019', 'KEY-KEY-K2V2', 60, 90, 90000, true, 'Từ 61 đến ≤ 90 km'),
('a0000000-0000-4000-8000-000000000020', 'KEY-KEY-K2V2', 90, 9999, 130000, true, 'Khoảng cách > 90 km'),
('a0000000-0000-4000-8000-000000000021', 'SRV-DEL-T150', 0, 15, 80000, true, 'Khoảng cách ≤ 15 km'),
('a0000000-0000-4000-8000-000000000022', 'SRV-DEL-T150', 15, 30, 150000, true, 'Từ 16 đến ≤ 30 km'),
('a0000000-0000-4000-8000-000000000023', 'SRV-DEL-T150', 30, 60, 250000, true, 'Từ 31 đến ≤ 60 km'),
('a0000000-0000-4000-8000-000000000024', 'SRV-DEL-T150', 60, 90, 380000, true, 'Từ 61 đến ≤ 90 km'),
('a0000000-0000-4000-8000-000000000025', 'SRV-DEL-T150', 90, 9999, 500000, true, 'Khoảng cách > 90 km'),
('a0000000-0000-4000-8000-000000000026', 'ROU-CIS-1000', 0, 15, 25000, true, 'Khoảng cách ≤ 15 km'),
('a0000000-0000-4000-8000-000000000027', 'ROU-CIS-1000', 15, 30, 45000, true, 'Từ 16 đến ≤ 30 km'),
('a0000000-0000-4000-8000-000000000028', 'ROU-CIS-1000', 30, 60, 80000, true, 'Từ 31 đến ≤ 60 km'),
('a0000000-0000-4000-8000-000000000029', 'ROU-CIS-1000', 60, 90, 120000, true, 'Từ 61 đến ≤ 90 km'),
('a0000000-0000-4000-8000-000000000030', 'ROU-CIS-1000', 90, 9999, 170000, true, 'Khoảng cách > 90 km'),
('a0000000-0000-4000-8000-000000000031', 'HEA-SON-WH1000', 0, 15, 25000, true, 'Khoảng cách ≤ 15 km'),
('a0000000-0000-4000-8000-000000000032', 'HEA-SON-WH1000', 15, 30, 45000, true, 'Từ 16 đến ≤ 30 km'),
('a0000000-0000-4000-8000-000000000033', 'HEA-SON-WH1000', 30, 60, 75000, true, 'Từ 31 đến ≤ 60 km'),
('a0000000-0000-4000-8000-000000000034', 'HEA-SON-WH1000', 60, 90, 110000, true, 'Từ 61 đến ≤ 90 km'),
('a0000000-0000-4000-8000-000000000035', 'HEA-SON-WH1000', 90, 9999, 160000, true, 'Khoảng cách > 90 km'),
('a0000000-0000-4000-8000-000000000036', 'SSD-SAM-980PRO', 0, 15, 15000, true, 'Khoảng cách ≤ 15 km'),
('a0000000-0000-4000-8000-000000000037', 'SSD-SAM-980PRO', 15, 30, 30000, true, 'Từ 16 đến ≤ 30 km'),
('a0000000-0000-4000-8000-000000000038', 'SSD-SAM-980PRO', 30, 60, 50000, true, 'Từ 31 đến ≤ 60 km'),
('a0000000-0000-4000-8000-000000000039', 'SSD-SAM-980PRO', 60, 90, 75000, true, 'Từ 61 đến ≤ 90 km'),
('a0000000-0000-4000-8000-000000000040', 'SSD-SAM-980PRO', 90, 9999, 110000, true, 'Khoảng cách > 90 km');

-- 11. PHIẾU PHÁT MẪU & TRƯNG BÀY (PRODUCT_SAMPLES)
INSERT INTO public.product_samples (id, code, customer_id, customer_name, customer_phone, route, sales_person, product_id, product_sku, product_name, category, quantity, unit, handover_date, status, feedback, notes, created_at)
VALUES
('b0000000-0000-4000-8000-000000000001', 'PM-202608-01', '10000000-0000-4000-8000-000000000002', 'Tập đoàn Bán Lẻ An Phát', '0918765432', 'Tuyến Phú Nhuận - Gò Vấp', 'Lê Thu Hà', '20000000-0000-4000-8000-000000000004', 'KEY-KEY-K2V2', 'Bàn Phím Cơ Wireless Keychron K2 V2 RGB', 'Phụ kiện', 2, 'Cái', '2026-08-02', 'Displaying', 'Khách đánh giá gõ phím êm, đèn RGB đẹp, đang chạy thử chương trình trải nghiệm showroom', 'Trưng bày tại kệ trải nghiệm khách hàng. Bàn giao nguyên seal 2 bàn phím mẫu.', '2026-08-02 09:00:00+00'),
('b0000000-0000-4000-8000-000000000002', 'PM-202608-02', '10000000-0000-4000-8000-000000000001', 'Công ty TNHH Công Nghệ Việt', '0903123456', 'Tuyến Quận 1 - Bình Thạnh', 'Nguyễn Thanh Tùng', '20000000-0000-4000-8000-000000000003', 'MOU-LOG-MX3S', 'Chuột Không Dây Logitech MX Master 3S', 'Phụ kiện', 1, 'Cái', '2026-08-05', 'Converted', 'Khách hàng rất hài lòng về độ mượt của con lăn và độ êm, đã chốt mua kèm đơn hàng HD20260808', 'Dùng thử nội bộ cho team Thiết kế UI/UX. Đã xuất hóa đơn chuyển đổi sang bán.', '2026-08-05 14:00:00+00'),
('b0000000-0000-4000-8000-000000000003', 'PM-202608-03', '10000000-0000-4000-8000-000000000004', 'Đại Lý Thiết Bị Viễn Thông Á Châu', '0933556677', 'Tuyến Miền Đông (Bình Dương - Đồng Nai)', 'Nguyễn Thanh Tùng', '20000000-0000-4000-8000-000000000006', 'ROU-CIS-1000', 'Thiết Bị Định Tuyến Router Cisco RV340 Dual WAN', 'Thiết bị Mạng & Server', 1, 'Bộ', '2026-08-10', 'Displaying', 'Đang thử nghiệm chịu tải cho gói mạng doanh nghiệp', 'Thử nghiệm PoC kỹ thuật cho dự án. Cấp mượn demo phòng lab.', '2026-08-10 10:30:00+00'),
('b0000000-0000-4000-8000-000000000004', 'PM-202608-04', '10000000-0000-4000-8000-000000000006', 'Trung Tâm Tin Học Trẻ Hoàng Long', '0966445566', 'Tuyến TP. Thủ Đức', 'Trần Đình Trọng', '20000000-0000-4000-8000-000000000002', 'MON-LG-27GP', 'Màn Hình Gaming LG UltraGear 27 inch 2K 144Hz', 'Màn hình', 1, 'Cái', '2026-07-28', 'Returned', 'Chất lượng hiển thị sắc nét, trung tâm dự kiến đặt mua 10 chiếc vào tháng tới', 'Trưng bày tại phòng học chuyên đề Đồ họa. Đã kiểm tra thu hồi về kho, tình trạng nguyên vẹn 100%.', '2026-07-28 09:00:00+00'),
('b0000000-0000-4000-8000-000000000005', 'PM-202608-05', '10000000-0000-4000-8000-000000000005', 'Công ty Cổ phần Giải pháp Số Nam Việt', '0977889900', 'Tuyến Miền Tây (Long An - Tiền Giang - Cần Thơ)', 'Lê Thu Hà', '20000000-0000-4000-8000-000000000007', 'HEA-SON-WH1000', 'Tai Nghe Chống Ồn Sony WH-1000XM5 Wireless', 'Phụ kiện', 1, 'Cái', '2026-08-12', 'Displaying', 'Khách đánh giá chống ồn vượt trội, pin trâu', 'Demo cho ban giám đốc. Hàng mẫu màu đen nguyên hộp.', '2026-08-12 11:00:00+00')
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- BƯỚC 3: CẤP QUYỀN TRUY CẬP (GRANTS & PERMISSIONS)
-- ==============================================================================
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.debts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.debt_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inbound_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shipping_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_samples DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, postgres, service_role;
