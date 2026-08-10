-- =======================================================
-- HE THONG QUAN TRI DOANH NGHIEP (ERP - CRM - SALES - DEBTS - INVENTORY)
-- SUPABASE SQL DATABASE SCHEMA & SEED DATA
-- =======================================================

-- 1. BANG KHÁCH HÀNG & ĐỐI TÁC (CUSTOMERS & PARTNERS)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    type VARCHAR(50) DEFAULT 'Customer', -- 'Customer', 'Supplier', 'Both'
    group_name VARCHAR(50) DEFAULT 'Khách thường', -- 'VIP', 'Khách thường', 'Đại lý'
    current_debt NUMERIC(15, 2) DEFAULT 0, -- > 0 là nợ mình, < 0 là mình nợ họ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. BANG SAN PHAM & KHO HÀNG (PRODUCTS & INVENTORY)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'Cái',
    cost_price NUMERIC(15, 2) DEFAULT 0, -- Giá nhập
    selling_price NUMERIC(15, 2) DEFAULT 0, -- Giá bán
    stock_quantity INT DEFAULT 0, -- Số lượng tồn kho hiện tại
    min_stock_alert INT DEFAULT 5, -- Ngưỡng cảnh báo tồn tối thiểu
    location VARCHAR(100) DEFAULT 'Kho A',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. BANG ĐƠN BÁN HÀNG (ORDERS)
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

-- 4. BANG CHI TIET ĐƠN HÀNG (ORDER ITEMS)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL
);

-- 5. BANG QUẢN LÝ CÔNG NỢ (DEBTS)
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

-- 6. BANG LICHSU THANH TOÁN CÔNG NỢ (DEBT PAYMENTS)
CREATE TABLE IF NOT EXISTS public.debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE,
    payment_code VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Bank', -- 'Cash', 'Bank'
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. BANG CHI TIẾT BIẾN ĐỘNG KHO (INVENTORY TRANSACTIONS)
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

-- 8. BANG CRM - LEADS & CƠ HỘI KINH DOANH (CRM LEADS & PIPELINE)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    estimated_value NUMERIC(15, 2) DEFAULT 0,
    stage VARCHAR(50) DEFAULT 'Lead', -- 'Lead', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost'
    assigned_to VARCHAR(100) DEFAULT 'Kinh doanh 1',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. BANG KHÁCH HÀNG TRẢ HÀNG (RETURNS)
CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_code VARCHAR(50) UNIQUE NOT NULL,
    order_code VARCHAR(50) REFERENCES public.orders(order_code) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    total_refund NUMERIC(15, 2) NOT NULL DEFAULT 0,
    refund_method VARCHAR(50) DEFAULT 'DebtDeduction', -- 'Cash', 'Bank', 'DebtDeduction'
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =======================================================
-- SEED DATA MẪU DOANH NGHIỆP (DEMO INITIAL DATA)
-- =======================================================

INSERT INTO public.customers (code, name, phone, email, address, type, group_name, current_debt) VALUES
('KH001', 'Công ty TNHH Công Nghệ Việt', '0901234567', 'contact@viettech.com', '123 Lê Lợi, Q.1, TP.HCM', 'Customer', 'VIP', 15500000),
('KH002', 'Tập đoàn Bán Lẻ An Phát', '0912345678', 'purchasing@anphat.vn', '456 Nguyễn Huệ, Q.1, TP.HCM', 'Customer', 'Đại lý', 42000000),
('KH003', 'Cửa Hàng Điện Máy Minh Khoa', '0987654321', 'minhkhoa@gmail.com', '789 Trần Hưng Đạo, Q.5, TP.HCM', 'Customer', 'Khách thường', 0),
('NCC01', 'Tổng Kho Linh Kiện Nam Sài Gòn', '02838999888', 'sale@namsaigon.com', '12 Khu Công Nghiệp Tân Bình, TP.HCM', 'Supplier', 'Đại lý', -28000000);

INSERT INTO public.products (sku, name, category, unit, cost_price, selling_price, stock_quantity, min_stock_alert, location) VALUES
('LAP-DEL-01', 'Laptop Dell XPS 13 i7 16GB', 'Máy tính', 'Cái', 22000000, 26900000, 14, 3, 'Khu A - Kệ 01'),
('MON-LG-27', 'Màn Hình LG UltraGear 27 inch 144Hz', 'Thiết bị ngoại vi', 'Cái', 4500000, 5990000, 28, 5, 'Khu A - Kệ 02'),
('MOU-LOG-MX', 'Chuột Không Dây Logitech MX Master 3S', 'Phụ kiện', 'Cái', 1800000, 2450000, 45, 10, 'Khu B - Kệ 01'),
('KEY-PHI-01', 'Bàn Phím Cơ Wireless Keychron K2 V2', 'Phụ kiện', 'Cái', 1400000, 1950000, 4, 8, 'Khu B - Kệ 02'),
('SRV-SYS-01', 'Máy Chủ Server Dell PowerEdge T150', 'Thiết bị Mạng', 'Cái', 31000000, 38500000, 2, 2, 'Khu C - Tủ Bảo Vệ');

INSERT INTO public.leads (name, company, phone, email, estimated_value, stage, assigned_to, notes) VALUES
('Nguyễn Văn Nam', 'Công ty Cổ phần Phần mềm BK', '0933112233', 'nam.nguyen@bksoft.vn', 120000000, 'Proposal', 'Nguyễn Thanh Tùng', 'Đang yêu cầu báo giá 10 bộ máy trạm XPS'),
('Trần Thị Hoa', 'Chuỗi Nhà Hàng Phố Biển', '0944556677', 'hoatt@phobien.com', 45000000, 'Negotiation', 'Lê Thu Hà', 'Cần tư vấn hạ tầng POS và máy in hóa đơn'),
('Phạm Quốc Cường', 'Đại Học Quốc Tế Đông Á', '0966778899', 'cuong.pq@easia.edu.vn', 350000000, 'Contacted', 'Nguyễn Thanh Tùng', 'Quan tâm dự án nâng cấp phòng máy vi tính');

INSERT INTO public.orders (order_code, customer_name, total_amount, discount, tax, final_amount, paid_amount, debt_amount, status, payment_method, notes) VALUES
('HD20260801', 'Công ty TNHH Công Nghệ Việt', 26900000, 900000, 0, 26000000, 10500000, 15500000, 'Completed', 'Bank', 'Giao hàng đợt 1, nợ lại đợt 2'),
('HD20260802', 'Tập đoàn Bán Lẻ An Phát', 42000000, 0, 0, 42000000, 0, 42000000, 'Completed', 'Debt', 'Thanh toán theo hợp đồng 30 ngày');

INSERT INTO public.debts (id, code, customer_name, type, total_amount, remaining_amount, due_date, status, notes) VALUES
('d1', 'CN-PT-001', 'Công ty TNHH Công Nghệ Việt', 'Receivable', 25500000, 15500000, '2026-08-25', 'Partial', 'Công nợ từ đơn HD20260801'),
('d2', 'CN-PT-002', 'Tập đoàn Bán Lẻ An Phát', 'Receivable', 42000000, 42000000, '2026-08-30', 'Unpaid', 'Công nợ từ đơn HD20260802'),
('d3', 'CN-TRA-001', 'Tổng Kho Linh Kiện Nam Sài Gòn', 'Payable', 28000000, 28000000, '2026-08-20', 'Unpaid', 'Nợ tiền hàng linh kiện máy tính tháng 7');

INSERT INTO public.debt_payments (debt_id, payment_code, amount, payment_method, note, created_at) VALUES
('d1', 'TT-20260804', 10000000, 'Bank', 'Thanh toán đợt 1 tiền hàng Laptop XPS', '2026-08-04T11:00:00Z');

