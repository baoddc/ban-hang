-- ==============================================================================
-- HE THONG QUAN TRI DOANH NGHIEP (ERP - CRM - SALES - DEBTS - INVENTORY)
-- SUPABASE FULL SQL DATABASE SCHEMA & MIGRATION SCRIPT (VERSION 2.0)
-- ==============================================================================
-- Hướng dẫn: 
-- 1. Đăng nhập vào trang quản trị Supabase (https://supabase.com).
-- 2. Chọn dự án của bạn -> Mở mục SQL Editor -> Click "New Query".
-- 3. Dán toàn bộ nội dung file này vào ô soạn thảo và bấm "Run" (hoặc Ctrl + Enter).
-- ==============================================================================

-- ==============================================================================
-- PHẦN 1: MIGRATION PATCH (BỔ SUNG CỘT CHO BẢNG ĐÃ TỒN TẠI TRÊN SUPABASE)
-- Tự động thêm các cột mới nếu CSDL của bạn đã được tạo trước đó
-- ==============================================================================
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS route VARCHAR(100);
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS sales_person VARCHAR(100);
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS distance_km VARCHAR(50);
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS current_debt NUMERIC(15, 2) DEFAULT 0;

ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS route VARCHAR(100);
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS current_debt NUMERIC(15, 2) DEFAULT 0;

ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS supplier_id UUID;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE IF EXISTS public.products DROP CONSTRAINT IF EXISTS products_sku_key;
ALTER TABLE IF EXISTS public.products DROP CONSTRAINT IF EXISTS products_sku_unique;

ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(50) DEFAULT 'Delivery';

ALTER TABLE IF EXISTS public.debts ADD COLUMN IF NOT EXISTS order_code VARCHAR(50);

ALTER TABLE IF EXISTS public.debt_payments ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

ALTER TABLE IF EXISTS public.inbound_orders ADD COLUMN IF NOT EXISTS warehouse VARCHAR(100);
ALTER TABLE IF EXISTS public.inbound_orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.inbound_orders ADD COLUMN IF NOT EXISTS received_by VARCHAR(100);
ALTER TABLE IF EXISTS public.inbound_orders ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE;

-- ==============================================================================
-- PHẦN 2: THIẾT KẾ BẢNG CƠ SỞ DỮ LIỆU CHUẨN (DATABASE TABLE STRUCTURES)
-- ==============================================================================

-- 1. BẢNG KHÁCH HÀNG & ĐỐI TÁC (CUSTOMERS)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    distance_km VARCHAR(50), -- Khoảng cách giao hàng (km)
    address TEXT,
    route VARCHAR(100), -- Tuyến công tác sales
    sales_person VARCHAR(100), -- Nhân viên tư vấn phụ trách
    type VARCHAR(50) DEFAULT 'Customer', -- 'Customer', 'Supplier', 'Both'
    group_name VARCHAR(50) DEFAULT 'Khách thường', -- 'VIP', 'Khách thường', 'Đại lý'
    current_debt NUMERIC(15, 2) DEFAULT 0, -- Tổng dư nợ hiện tại
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

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
    cost_price NUMERIC(15, 2) DEFAULT 0, -- Giá vốn nhập kho
    selling_price NUMERIC(15, 2) DEFAULT 0, -- Giá bán niêm yết
    stock_quantity INT DEFAULT 0, -- Số lượng tồn kho hiện tại
    min_stock_alert INT DEFAULT 5, -- Ngưỡng cảnh báo tồn kho tối thiểu
    location VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. BẢNG ĐƠN BÁN HÀNG (ORDERS)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    shipping_fee NUMERIC(15, 2) DEFAULT 0,
    delivery_method VARCHAR(50) DEFAULT 'Delivery', -- 'Delivery' (Công ty giao), 'Pickup' (Khách tự nhận)
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

-- 5. BẢNG CHI TIẾT ĐƠN HÀNG (ORDER ITEMS)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    quantity INT NOT NULL,
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
    type VARCHAR(50) NOT NULL, -- 'Receivable' (Phải thu khách hàng), 'Payable' (Phải trả nhà cung cấp)
    total_amount NUMERIC(15, 2) NOT NULL,
    remaining_amount NUMERIC(15, 2) NOT NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Unpaid', -- 'Unpaid', 'Partial', 'Paid', 'Overdue'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. BẢNG LỊCH SỬ THANH TOÁN CÔNG NỢ (DEBT PAYMENTS)
CREATE TABLE IF NOT EXISTS public.debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    payment_code VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Bank', -- 'Cash', 'Bank', 'DebtDeduction'
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. BẢNG CHI TIẾT THẺ KHO & BIẾN ĐỘNG HÀNG HÓA (INVENTORY TRANSACTIONS)
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

-- 9. BẢNG CRM KHÁCH HÀNG TIỀM NĂNG & PIPELINE (LEADS)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    estimated_value NUMERIC(15, 2) DEFAULT 0,
    stage VARCHAR(50) DEFAULT 'Lead', -- 'Lead', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost'
    lost_reason TEXT, -- Nguyên nhân khi cơ hội thất bại
    assigned_to VARCHAR(100) DEFAULT 'Nguyễn Thanh Tùng',
    next_activity_date TIMESTAMP WITH TIME ZONE, -- Ngày giờ hẹn / hoạt động tiếp theo
    next_activity_note VARCHAR(255), -- Nội dung hoạt động tiếp theo (VD: Gọi lại lúc 10h...)
    stage_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()), -- Thời điểm cập nhật bước hiện tại
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Migration nếu bảng đã tồn tại trước đó
ALTER TABLE IF EXISTS public.leads ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE IF EXISTS public.leads ADD COLUMN IF NOT EXISTS next_activity_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS public.leads ADD COLUMN IF NOT EXISTS next_activity_note VARCHAR(255);
ALTER TABLE IF EXISTS public.leads ADD COLUMN IF NOT EXISTS stage_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 10. BẢNG KHÁCH HÀNG TRẢ HÀNG / ĐỔI TRẢ (RETURNS)
CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_code VARCHAR(50) UNIQUE NOT NULL,
    order_code VARCHAR(50),
    customer_name VARCHAR(255) NOT NULL,
    total_refund NUMERIC(15, 2) NOT NULL DEFAULT 0,
    refund_method VARCHAR(50) DEFAULT 'DebtDeduction', -- 'DebtDeduction', 'Cash', 'Bank'
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. BẢNG YÊU CẦU MUA HÀNG & PHIẾU NHẬP INBOUND (INBOUND ORDERS)
CREATE TABLE IF NOT EXISTS public.inbound_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID, -- ID nhà cung cấp từ bảng suppliers hoặc customers
    supplier_name VARCHAR(255) NOT NULL,
    warehouse VARCHAR(100),
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

-- 12. BẢNG QUY TẮC & ĐỊNH MỨC PHÍ VẬN CHUYỂN (SHIPPING RULES)
CREATE TABLE IF NOT EXISTS public.shipping_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL, -- '60x60P', '60x60C', '50x50', 'Gạch', 'Vật tư / Khác', 'Tất cả'
    min_distance NUMERIC(10, 2) DEFAULT 0, -- Khoảng cách từ (km)
    max_distance NUMERIC(10, 2) DEFAULT 9999, -- Khoảng cách đến (km)
    base_fee NUMERIC(15, 2) NOT NULL DEFAULT 0, -- Cước phí cơ bản (VNĐ)
    is_active BOOLEAN DEFAULT true, -- Trạng thái áp dụng quy tắc
    notes TEXT, -- Ghi chú mô tả
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- PHẦN 3: ĐÁNH CHỈ MỤC INDEXES (TỐI ƯU HÓA TỐC ĐỘ TRUY VẤN CSDL)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(code);
CREATE INDEX IF NOT EXISTS idx_customers_route ON public.customers(route);
CREATE INDEX IF NOT EXISTS idx_customers_sales_person ON public.customers(sales_person);
CREATE INDEX IF NOT EXISTS idx_customers_type ON public.customers(type);

CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);

CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_supplier_name ON public.products(supplier_name);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products(location);

CREATE INDEX IF NOT EXISTS idx_orders_order_code ON public.orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_debts_code ON public.debts(code);
CREATE INDEX IF NOT EXISTS idx_debts_customer_id ON public.debts(customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_customer_name ON public.debts(customer_name);
CREATE INDEX IF NOT EXISTS idx_debts_order_id ON public.debts(order_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON public.debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_type ON public.debts(type);

CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON public.debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_payment_code ON public.debt_payments(payment_code);

CREATE INDEX IF NOT EXISTS idx_inventory_tx_product ON public.inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_type ON public.inventory_transactions(type);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_created_at ON public.inventory_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);

CREATE INDEX IF NOT EXISTS idx_returns_return_code ON public.returns(return_code);
CREATE INDEX IF NOT EXISTS idx_returns_order_code ON public.returns(order_code);

CREATE INDEX IF NOT EXISTS idx_inbound_orders_code ON public.inbound_orders(code);
CREATE INDEX IF NOT EXISTS idx_inbound_orders_supplier_id ON public.inbound_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inbound_orders_warehouse ON public.inbound_orders(warehouse);
CREATE INDEX IF NOT EXISTS idx_inbound_orders_status ON public.inbound_orders(status);

CREATE INDEX IF NOT EXISTS idx_shipping_rules_category ON public.shipping_rules(category);
CREATE INDEX IF NOT EXISTS idx_shipping_rules_distance ON public.shipping_rules(min_distance, max_distance);
CREATE INDEX IF NOT EXISTS idx_shipping_rules_active ON public.shipping_rules(is_active);

-- ==============================================================================
-- PHẦN 4: HÀM TIỆN ÍCH HỖ TRỢ XÓA / RESET DỮ LIỆU CÔNG NỢ (UTILITY FUNCTIONS)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.reset_all_debts_data()
RETURNS void AS $$
BEGIN
    DELETE FROM public.debt_payments;
    DELETE FROM public.debts;
    DELETE FROM public.returns;
    DELETE FROM public.inbound_orders;
    UPDATE public.customers SET current_debt = 0;
    UPDATE public.orders SET debt_amount = 0;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- PHẦN 5: THIẾT LẬP BẢO MẬT VÀ PHÂN QUYỀN TRUY CẬP (RLS & POLICIES)
-- ==============================================================================
-- Tắt RLS để các ứng dụng Web/Client gọi trực tiếp với Anon API Key mượt mà không bị lỗi RLS policy
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rules DISABLE ROW LEVEL SECURITY;

-- Chính sách công khai dự phòng (Public Access Policies) nếu RLS được bật lại trong tương lai
DROP POLICY IF EXISTS "Allow public access on customers" ON public.customers;
CREATE POLICY "Allow public access on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on suppliers" ON public.suppliers;
CREATE POLICY "Allow public access on suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);

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

DROP POLICY IF EXISTS "Allow public access on shipping_rules" ON public.shipping_rules;
CREATE POLICY "Allow public access on shipping_rules" ON public.shipping_rules FOR ALL USING (true) WITH CHECK (true);

-- Cấp quyền truy cập trực tiếp cho các Role mặc định của Supabase
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, postgres, service_role;

-- ==============================================================================
-- HOÀN TẤT: BẠN ĐÃ KHỞI TẠO THÀNH CÔNG SUPABASE CƠ SỞ DỮ LIỆU ERP SYSTEM!
-- ==============================================================================
