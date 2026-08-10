-- ==============================================================================
-- HE THONG QUAN TRI DOANH NGHIEP (ERP - CRM - SALES - DEBTS - INVENTORY)
-- SUPABASE FULL SQL DATABASE SCHEMA & MIGRATION SCRIPT
-- ==============================================================================

-- ==============================================================================
-- PHẦN 1: MIGRATION PATCH (DÀNH CHO BẢNG ĐÃ TỒN TẠI TRÊN SUPABASE)
-- Chạy đoạn này nếu bạn đã tạo bảng từ trước và bị thiếu các cột mới
-- ==============================================================================
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS route VARCHAR(100);
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS sales_person VARCHAR(100);
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS distance_km VARCHAR(50);

-- ==============================================================================
-- PHẦN 2: THIẾT KẾ BẢNG CƠ SỞ DỮ LIỆU (DATABASE TABLES STRUCTURE)
-- ==============================================================================

-- 1. BẢNG KHÁCH HÀNG & ĐỐI TÁC (CUSTOMERS & PARTNERS)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    distance_km VARCHAR(50), -- Khoảng cách đến công ty (km)
    address TEXT,
    route VARCHAR(100), -- Tuyến công tác
    sales_person VARCHAR(100), -- Sales phụ trách
    type VARCHAR(50) DEFAULT 'Customer', -- 'Customer', 'Supplier', 'Both'
    group_name VARCHAR(50) DEFAULT 'Khách thường', -- 'VIP', 'Khách thường', 'Đại lý'
    current_debt NUMERIC(15, 2) DEFAULT 0, -- Công nợ hiện tại
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. BẢNG SẢN PHẨM & KHO HÀNG (PRODUCTS & INVENTORY)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'Cái',
    cost_price NUMERIC(15, 2) DEFAULT 0, -- Giá nhập
    selling_price NUMERIC(15, 2) DEFAULT 0, -- Giá bán niêm yết
    stock_quantity INT DEFAULT 0, -- Số lượng tồn kho
    min_stock_alert INT DEFAULT 5, -- Ngưỡng cảnh báo tồn tối thiểu
    location VARCHAR(100) DEFAULT 'Kho A',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. BẢNG ĐƠN BÁN HÀNG (ORDERS)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(15, 2) DEFAULT 0,
    tax NUMERIC(15, 2) DEFAULT 0,
    final_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(15, 2) DEFAULT 0,
    debt_amount NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Completed', -- 'Pending', 'Confirmed', 'Completed', 'Cancelled'
    payment_method VARCHAR(50) DEFAULT 'Cash', -- 'Cash', 'Bank', 'Debt'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. BẢNG CHI TIẾT ĐƠN HÀNG (ORDER ITEMS)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL
);

-- 5. BẢNG QUẢN LÝ CÔNG NỢ (DEBTS)
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'Receivable' (Phải thu), 'Payable' (Phải trả)
    total_amount NUMERIC(15, 2) NOT NULL,
    remaining_amount NUMERIC(15, 2) NOT NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Unpaid', -- 'Unpaid', 'Partial', 'Paid', 'Overdue'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. BẢNG LỊCH SỬ THANH TOÁN CÔNG NỢ (DEBT PAYMENTS)
CREATE TABLE IF NOT EXISTS public.debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE,
    payment_code VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Bank', -- 'Cash', 'Bank'
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. BẢNG CHI TIẾT BIẾN ĐỘNG KHO (INVENTORY TRANSACTIONS)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'StockIn' (Nhập kho), 'StockOut' (Xuất kho), 'Transfer' (Điều chuyển)
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. BẢNG CRM LEADS & PIPELINE (CƠ HỘI KINH DOANH)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    estimated_value NUMERIC(15, 2) DEFAULT 0,
    stage VARCHAR(50) DEFAULT 'Lead', -- 'Lead', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost'
    assigned_to VARCHAR(100) DEFAULT 'Nguyễn Thanh Tùng',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. BẢNG KHÁCH HÀNG TRẢ HÀNG (RETURNS)
CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_code VARCHAR(50) UNIQUE NOT NULL,
    order_code VARCHAR(50) REFERENCES public.orders(order_code) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    total_refund NUMERIC(15, 2) NOT NULL DEFAULT 0,
    refund_method VARCHAR(50) DEFAULT 'DebtDeduction',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. BẢNG QUẢN LÝ ĐƠN PR & PHIẾU NHẬP HÀNG INBOUND (INBOUND ORDERS)
CREATE TABLE IF NOT EXISTS public.inbound_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255) NOT NULL,
    created_by VARCHAR(100) DEFAULT 'Kỹ thuật',
    expected_date DATE,
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending' (Chờ nhập kho), 'Received' (Đã nhập kho), 'Cancelled' (Đã hủy)
    total_amount NUMERIC(15, 2) DEFAULT 0,
    notes TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    received_by VARCHAR(100),
    received_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- PHẦN 3: ĐÁNH CHỈ MỤC INDEXES (TỐI ƯU TỐC ĐỘ TRUY VẤN)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_route ON public.customers(route);
CREATE INDEX IF NOT EXISTS idx_customers_sales_person ON public.customers(sales_person);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_customer_id ON public.debts(customer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_product ON public.inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_inbound_orders_status ON public.inbound_orders(status);

-- ==============================================================================
-- PHẦN 4: SEED DATA MẪU (DỮ LIỆU BAN ĐẦU DÙNG THỬ)
-- ==============================================================================

INSERT INTO public.customers (code, name, phone, distance_km, address, route, sales_person, type, group_name, current_debt) VALUES
('KH001', 'Công ty TNHH Công Nghệ Việt', '0901234567', '5.2 km', '123 Lê Lợi, Q.1, TP.HCM', 'Tuyến Q.1 - Q.3', 'Nguyễn Thanh Tùng', 'Customer', 'VIP', 15500000),
('KH002', 'Tập đoàn Bán Lẻ An Phát', '0912345678', '12 km', '456 Nguyễn Huệ, Q.1, TP.HCM', 'Tuyến Q.1 - Phố Đi Bộ', 'Lê Thu Hà', 'Customer', 'Đại lý', 42000000),
('KH003', 'Cửa Hàng Điện Máy Minh Khoa', '0987654321', '8.5 km', '789 Trần Hưng Đạo, Q.5, TP.HCM', 'Tuyến Q.5 - Chợ Lớn', 'Trần Văn Nam', 'Customer', 'Khách thường', 0),
('NCC01', 'Tổng Kho Linh Kiện Nam Sài Gòn', '02838999888', '15 km', '12 KCN Tân Bình, TP.HCM', 'Tuyến Tân Bình - Hóc Môn', 'Nguyễn Thanh Tùng', 'Supplier', 'Đại lý', -28000000)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.products (sku, name, category, unit, cost_price, selling_price, stock_quantity, min_stock_alert, location) VALUES
('LAP-DEL-01', 'Laptop Dell XPS 13 i7 16GB', 'Máy tính', 'Cái', 22000000, 26900000, 14, 3, 'Khu A - Kệ 01'),
('MON-LG-27', 'Màn Hình LG UltraGear 27 inch 144Hz', 'Thiết bị ngoại vi', 'Cái', 4500000, 5990000, 28, 5, 'Khu A - Kệ 02'),
('MOU-LOG-MX', 'Chuột Không Dây Logitech MX Master 3S', 'Phụ kiện', 'Cái', 1800000, 2450000, 45, 10, 'Khu B - Kệ 01'),
('KEY-PHI-01', 'Bàn Phím Cơ Wireless Keychron K2 V2', 'Phụ kiện', 'Cái', 1400000, 1950000, 4, 8, 'Khu B - Kệ 02'),
('SRV-SYS-01', 'Máy Chủ Server Dell PowerEdge T150', 'Thiết bị Mạng', 'Cái', 31000000, 38500000, 2, 2, 'Khu C - Tủ Bảo Vệ')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO public.leads (name, company, phone, email, estimated_value, stage, assigned_to, notes) VALUES
('Nguyễn Văn Nam', 'Công ty Cổ phần Phần mềm BK', '0933112233', 'nam.nguyen@bksoft.vn', 120000000, 'Proposal', 'Nguyễn Thanh Tùng', 'Đang yêu cầu báo giá 10 bộ máy trạm XPS'),
('Trần Thị Hoa', 'Chuỗi Nhà Hàng Phố Biển', '0944556677', 'hoatt@phobien.com', 45000000, 'Negotiation', 'Lê Thu Hà', 'Cần tư vấn hạ tầng POS và máy in hóa đơn'),
('Phạm Quốc Cường', 'Đại Học Quốc Tế Đông Á', '0966778899', 'cuong.pq@easia.edu.vn', 350000000, 'Contacted', 'Nguyễn Thanh Tùng', 'Quan tâm dự án nâng cấp phòng máy vi tính');

INSERT INTO public.inbound_orders (code, supplier_name, created_by, expected_date, status, total_amount, notes, items) VALUES
('PR20260810-01', 'Tổng Kho Linh Kiện Nam Sài Gòn', 'Kỹ thuật - Nguyễn Văn Kỷ', '2026-08-15', 'Pending', 62000000, 'Nhập bổ sung linh kiện máy chủ Dell PowerEdge', '[{"product_sku":"SRV-SYS-01","product_name":"Máy Chủ Server Dell PowerEdge T150","unit":"Cái","expected_qty":2,"received_qty":2,"cost_price":31000000,"subtotal":62000000}]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- PHẦN 5: BẢO MẬT & PHÂN QUYỀN RLS (ROW LEVEL SECURITY POLICIES)
-- ==============================================================================

-- Tắt RLS để các ứng dụng Web/Client gọi trực tiếp với Anon API Key mượt mà
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_orders DISABLE ROW LEVEL SECURITY;

-- Chính sách công khai dự phòng nếu RLS bật lại trong tương lai
DROP POLICY IF EXISTS "Allow public access on customers" ON public.customers;
CREATE POLICY "Allow public access on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on products" ON public.products;
CREATE POLICY "Allow public access on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on orders" ON public.orders;
CREATE POLICY "Allow public access on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on order_items" ON public.order_items;
CREATE POLICY "Allow public access on order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on debts" ON public.debts;
CREATE POLICY "Allow public access on debts" ON public.debts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on debt_payments" ON public.debt_payments;
CREATE POLICY "Allow public access on debt_payments" ON public.debt_payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on inventory_transactions" ON public.inventory_transactions;
CREATE POLICY "Allow public access on inventory_transactions" ON public.inventory_transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on leads" ON public.leads;
CREATE POLICY "Allow public access on leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on returns" ON public.returns;
CREATE POLICY "Allow public access on returns" ON public.returns FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on inbound_orders" ON public.inbound_orders;
CREATE POLICY "Allow public access on inbound_orders" ON public.inbound_orders FOR ALL USING (true) WITH CHECK (true);
