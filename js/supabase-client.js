/* =======================================================
   SUPABASE CLIENT & DUAL-ENGINE DATABASE PROVIDER
   ======================================================= */

const SUPABASE_CONFIG_KEY = 'ERP_SUPABASE_CONFIG';
const LOCAL_STORAGE_DB_KEY = 'ERP_LOCAL_DATABASE_V1';

// Default preset rules for Shipping Fee (40 comprehensive rules per SKU and distance brackets)
const DEFAULT_SHIPPING_RULES_PRESET = [
  // LAP-DEL-XPS13
  { id: 'a0000000-0000-4000-8000-000000000001', category: 'LAP-DEL-XPS13', min_distance: 0, max_distance: 15, base_fee: 30000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách ≤ 15 km' },
  { id: 'a0000000-0000-4000-8000-000000000002', category: 'LAP-DEL-XPS13', min_distance: 15, max_distance: 30, base_fee: 65000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 16 đến ≤ 30 km' },
  { id: 'a0000000-0000-4000-8000-000000000003', category: 'LAP-DEL-XPS13', min_distance: 30, max_distance: 60, base_fee: 110000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 31 đến ≤ 60 km' },
  { id: 'a0000000-0000-4000-8000-000000000004', category: 'LAP-DEL-XPS13', min_distance: 60, max_distance: 90, base_fee: 160000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 61 đến ≤ 90 km' },
  { id: 'a0000000-0000-4000-8000-000000000005', category: 'LAP-DEL-XPS13', min_distance: 90, max_distance: 9999, base_fee: 220000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách > 90 km' },

  // MON-LG-27GP
  { id: 'a0000000-0000-4000-8000-000000000006', category: 'MON-LG-27GP', min_distance: 0, max_distance: 15, base_fee: 35000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách ≤ 15 km' },
  { id: 'a0000000-0000-4000-8000-000000000007', category: 'MON-LG-27GP', min_distance: 15, max_distance: 30, base_fee: 70000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 16 đến ≤ 30 km' },
  { id: 'a0000000-0000-4000-8000-000000000008', category: 'MON-LG-27GP', min_distance: 30, max_distance: 60, base_fee: 120000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 31 đến ≤ 60 km' },
  { id: 'a0000000-0000-4000-8000-000000000009', category: 'MON-LG-27GP', min_distance: 60, max_distance: 90, base_fee: 180000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 61 đến ≤ 90 km' },
  { id: 'a0000000-0000-4000-8000-000000000010', category: 'MON-LG-27GP', min_distance: 90, max_distance: 9999, base_fee: 250000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách > 90 km' },

  // MOU-LOG-MX3S
  { id: 'a0000000-0000-4000-8000-000000000011', category: 'MOU-LOG-MX3S', min_distance: 0, max_distance: 15, base_fee: 20000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách ≤ 15 km' },
  { id: 'a0000000-0000-4000-8000-000000000012', category: 'MOU-LOG-MX3S', min_distance: 15, max_distance: 30, base_fee: 35000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 16 đến ≤ 30 km' },
  { id: 'a0000000-0000-4000-8000-000000000013', category: 'MOU-LOG-MX3S', min_distance: 30, max_distance: 60, base_fee: 55000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 31 đến ≤ 60 km' },
  { id: 'a0000000-0000-4000-8000-000000000014', category: 'MOU-LOG-MX3S', min_distance: 60, max_distance: 90, base_fee: 80000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 61 đến ≤ 90 km' },
  { id: 'a0000000-0000-4000-8000-000000000015', category: 'MOU-LOG-MX3S', min_distance: 90, max_distance: 9999, base_fee: 120000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách > 90 km' },

  // KEY-KEY-K2V2
  { id: 'a0000000-0000-4000-8000-000000000016', category: 'KEY-KEY-K2V2', min_distance: 0, max_distance: 15, base_fee: 20000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách ≤ 15 km' },
  { id: 'a0000000-0000-4000-8000-000000000017', category: 'KEY-KEY-K2V2', min_distance: 15, max_distance: 30, base_fee: 35000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 16 đến ≤ 30 km' },
  { id: 'a0000000-0000-4000-8000-000000000018', category: 'KEY-KEY-K2V2', min_distance: 30, max_distance: 60, base_fee: 60000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 31 đến ≤ 60 km' },
  { id: 'a0000000-0000-4000-8000-000000000019', category: 'KEY-KEY-K2V2', min_distance: 60, max_distance: 90, base_fee: 90000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 61 đến ≤ 90 km' },
  { id: 'a0000000-0000-4000-8000-000000000020', category: 'KEY-KEY-K2V2', min_distance: 90, max_distance: 9999, base_fee: 130000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách > 90 km' },

  // SRV-DEL-T150
  { id: 'a0000000-0000-4000-8000-000000000021', category: 'SRV-DEL-T150', min_distance: 0, max_distance: 15, base_fee: 80000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách ≤ 15 km' },
  { id: 'a0000000-0000-4000-8000-000000000022', category: 'SRV-DEL-T150', min_distance: 15, max_distance: 30, base_fee: 150000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 16 đến ≤ 30 km' },
  { id: 'a0000000-0000-4000-8000-000000000023', category: 'SRV-DEL-T150', min_distance: 30, max_distance: 60, base_fee: 250000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 31 đến ≤ 60 km' },
  { id: 'a0000000-0000-4000-8000-000000000024', category: 'SRV-DEL-T150', min_distance: 60, max_distance: 90, base_fee: 380000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 61 đến ≤ 90 km' },
  { id: 'a0000000-0000-4000-8000-000000000025', category: 'SRV-DEL-T150', min_distance: 90, max_distance: 9999, base_fee: 500000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách > 90 km' },

  // ROU-CIS-1000
  { id: 'a0000000-0000-4000-8000-000000000026', category: 'ROU-CIS-1000', min_distance: 0, max_distance: 15, base_fee: 25000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách ≤ 15 km' },
  { id: 'a0000000-0000-4000-8000-000000000027', category: 'ROU-CIS-1000', min_distance: 15, max_distance: 30, base_fee: 45000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 16 đến ≤ 30 km' },
  { id: 'a0000000-0000-4000-8000-000000000028', category: 'ROU-CIS-1000', min_distance: 30, max_distance: 60, base_fee: 80000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 31 đến ≤ 60 km' },
  { id: 'a0000000-0000-4000-8000-000000000029', category: 'ROU-CIS-1000', min_distance: 60, max_distance: 90, base_fee: 120000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 61 đến ≤ 90 km' },
  { id: 'a0000000-0000-4000-8000-000000000030', category: 'ROU-CIS-1000', min_distance: 90, max_distance: 9999, base_fee: 170000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách > 90 km' },

  // HEA-SON-WH1000
  { id: 'a0000000-0000-4000-8000-000000000031', category: 'HEA-SON-WH1000', min_distance: 0, max_distance: 15, base_fee: 25000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách ≤ 15 km' },
  { id: 'a0000000-0000-4000-8000-000000000032', category: 'HEA-SON-WH1000', min_distance: 15, max_distance: 30, base_fee: 45000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 16 đến ≤ 30 km' },
  { id: 'a0000000-0000-4000-8000-000000000033', category: 'HEA-SON-WH1000', min_distance: 30, max_distance: 60, base_fee: 75000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 31 đến ≤ 60 km' },
  { id: 'a0000000-0000-4000-8000-000000000034', category: 'HEA-SON-WH1000', min_distance: 60, max_distance: 90, base_fee: 110000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 61 đến ≤ 90 km' },
  { id: 'a0000000-0000-4000-8000-000000000035', category: 'HEA-SON-WH1000', min_distance: 90, max_distance: 9999, base_fee: 160000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách > 90 km' },

  // SSD-SAM-980PRO
  { id: 'a0000000-0000-4000-8000-000000000036', category: 'SSD-SAM-980PRO', min_distance: 0, max_distance: 15, base_fee: 15000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách ≤ 15 km' },
  { id: 'a0000000-0000-4000-8000-000000000037', category: 'SSD-SAM-980PRO', min_distance: 15, max_distance: 30, base_fee: 30000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 16 đến ≤ 30 km' },
  { id: 'a0000000-0000-4000-8000-000000000038', category: 'SSD-SAM-980PRO', min_distance: 30, max_distance: 60, base_fee: 50000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 31 đến ≤ 60 km' },
  { id: 'a0000000-0000-4000-8000-000000000039', category: 'SSD-SAM-980PRO', min_distance: 60, max_distance: 90, base_fee: 75000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Từ 61 đến ≤ 90 km' },
  { id: 'a0000000-0000-4000-8000-000000000040', category: 'SSD-SAM-980PRO', min_distance: 90, max_distance: 9999, base_fee: 110000, fee_per_km: 0, fee_per_unit: 0, free_shipping_threshold: 0, is_active: true, notes: 'Khoảng cách > 90 km' }
];

// Default initial data for enterprise fallback & demo mode
const DEFAULT_INITIAL_DATA = {
  customers: [
    {
      id: '10000000-0000-4000-8000-000000000001',
      code: 'KH001',
      name: 'Công ty TNHH Công Nghệ Việt',
      phone: '0903123456',
      email: 'contact@congngheviet.vn',
      distance_km: '5',
      address: '123 Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, TP.HCM',
      route: 'Tuyến Quận 1 - Bình Thạnh',
      sales_person: 'Nguyễn Thanh Tùng',
      type: 'Customer',
      group_name: 'VIP',
      current_debt: 73700000,
      created_at: '2026-08-01T08:00:00.000Z'
    },
    {
      id: '10000000-0000-4000-8000-000000000002',
      code: 'KH002',
      name: 'Tập đoàn Bán Lẻ An Phát',
      phone: '0918765432',
      email: 'purchasing@anphatretail.vn',
      distance_km: '12',
      address: '45 Lê Văn Sỹ, Phường 13, Quận Phú Nhuận, TP.HCM',
      route: 'Tuyến Phú Nhuận - Gò Vấp',
      sales_person: 'Lê Thu Hà',
      type: 'Customer',
      group_name: 'Đại lý',
      current_debt: 59970000,
      created_at: '2026-08-01T08:30:00.000Z'
    },
    {
      id: '10000000-0000-4000-8000-000000000003',
      code: 'KH003',
      name: 'Cửa Hàng Điện Máy Minh Khoa',
      phone: '0988112233',
      email: 'minhkhoaelectric@gmail.com',
      distance_km: '18',
      address: '789 Quang Trung, Phường 8, Quận Gò Vấp, TP.HCM',
      route: 'Tuyến Phú Nhuận - Gò Vấp',
      sales_person: 'Trần Đình Trọng',
      type: 'Customer',
      group_name: 'Khách thường',
      current_debt: 0,
      created_at: '2026-08-02T09:00:00.000Z'
    },
    {
      id: '10000000-0000-4000-8000-000000000004',
      code: 'KH004',
      name: 'Đại Lý Thiết Bị Viễn Thông Á Châu',
      phone: '0933556677',
      email: 'info@achaucorp.com.vn',
      distance_km: '35',
      address: '12 Đại Lộ Bình Dương, TP. Thủ Dầu Một, Bình Dương',
      route: 'Tuyến Miền Đông (Bình Dương - Đồng Nai)',
      sales_person: 'Nguyễn Thanh Tùng',
      type: 'Customer',
      group_name: 'Đại lý',
      current_debt: 15000000,
      created_at: '2026-08-03T10:00:00.000Z'
    },
    {
      id: '10000000-0000-4000-8000-000000000005',
      code: 'KH005',
      name: 'Công ty Cổ phần Giải pháp Số Nam Việt',
      phone: '0977889900',
      email: 'contact@namviet-digital.vn',
      distance_km: '165',
      address: '102 Trần Phú, Phường Cái Khế, Quận Ninh Kiều, Cần Thơ',
      route: 'Tuyến Miền Tây (Long An - Tiền Giang - Cần Thơ)',
      sales_person: 'Lê Thu Hà',
      type: 'Customer',
      group_name: 'VIP',
      current_debt: 0,
      created_at: '2026-08-04T11:00:00.000Z'
    },
    {
      id: '10000000-0000-4000-8000-000000000006',
      code: 'KH006',
      name: 'Trung Tâm Tin Học Trẻ Hoàng Long',
      phone: '0966445566',
      email: 'hoanglong.edu@gmail.com',
      distance_km: '15',
      address: '88 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM',
      route: 'Tuyến TP. Thủ Đức',
      sales_person: 'Trần Đình Trọng',
      type: 'Customer',
      group_name: 'Khách thường',
      current_debt: 0,
      created_at: '2026-08-05T13:30:00.000Z'
    },
    // Suppliers in customers collection for robust local storage fallback
    {
      id: '00000000-0000-4000-8000-000000000001',
      code: 'NCC01',
      name: 'Tổng Kho Phân Phối Dell Vietnam',
      phone: '02838221100',
      email: 'order@dellvietnam.com.vn',
      address: 'Tòa nhà Bitexco, Số 2 Hải Triều, Bến Nghé, Quận 1, TP.HCM',
      tax_id: '0301234567',
      contact_person: 'Trần Minh Tuấn - Trưởng phòng Phân phối',
      group_name: 'Đại lý',
      route: 'Tuyến Quận 1 - Bình Thạnh',
      type: 'Supplier',
      current_debt: 0,
      notes: 'Nhà phân phối chính thức máy chủ, máy trạm và laptop Dell',
      created_at: '2026-08-01T07:00:00.000Z'
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      code: 'NCC02',
      name: 'Công Ty TNHH LG Electronics VN',
      phone: '02838332211',
      email: 'sales@lg-vietnam.vn',
      address: 'Khu Công Nghệ Cao, Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM',
      tax_id: '0302345678',
      contact_person: 'Nguyễn Bích Ngọc - Đại diện Bán buôn',
      group_name: 'Đại lý',
      route: 'Tuyến TP. Thủ Đức',
      type: 'Supplier',
      current_debt: 0,
      notes: 'Cung cấp màn hình máy tính, thiết bị hiển thị LG UltraGear',
      created_at: '2026-08-01T07:15:00.000Z'
    },
    {
      id: '00000000-0000-4000-8000-000000000003',
      code: 'NCC03',
      name: 'Tổng Kho Linh Kiện Nam Sài Gòn',
      phone: '02839443322',
      email: 'namsaigon.parts@gmail.com',
      address: 'Lô 37-39A, Đường 19/5A, KCN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM',
      tax_id: '0304567890',
      contact_person: 'Phạm Quốc Hùng - Quản lý Kho Tổng',
      group_name: 'Đại lý',
      route: 'Tuyến Tân Bình - Tân Phú',
      type: 'Supplier',
      current_debt: 28000000,
      notes: 'Tổng kho linh kiện thiết bị mạng Cisco, chuột phím cơ Keychron & Logitech',
      created_at: '2026-08-01T07:30:00.000Z'
    },
    {
      id: '00000000-0000-4000-8000-000000000004',
      code: 'NCC04',
      name: 'Công Ty Cổ Phần Phân Phối Synnex FPT',
      phone: '02873000911',
      email: 'fpt_distribution@synnexfpt.com.vn',
      address: 'Tòa nhà FPT Tân Thuận, Lô L.29B-31B-33B, Đường Tân Thuận, KCX Tân Thuận, Quận 7, TP.HCM',
      tax_id: '0103456789',
      contact_person: 'Đỗ Khánh Linh - Giám đốc Kinh doanh Phụ kiện',
      group_name: 'Đại lý',
      route: 'Tuyến Quận 7 - Nhà Bè',
      type: 'Supplier',
      current_debt: 0,
      notes: 'Phân phối ủy quyền thiết bị lưu trữ Samsung SSD, tai nghe Sony',
      created_at: '2026-08-01T07:45:00.000Z'
    }
  ],

  products: [
    {
      id: '20000000-0000-4000-8000-000000000001',
      sku: 'LAP-DEL-XPS13',
      name: 'Laptop Dell XPS 13 i7 16GB 512GB SSD',
      supplier_id: '00000000-0000-4000-8000-000000000001',
      supplier_name: 'Tổng Kho Phân Phối Dell Vietnam',
      category: 'Máy tính & Laptop',
      unit: 'Cái',
      cost_price: 21500000,
      selling_price: 26900000,
      stock_quantity: 14,
      min_stock_alert: 5,
      location: 'Khu A - Kệ 01',
      created_at: '2026-08-01T08:00:00.000Z'
    },
    {
      id: '20000000-0000-4000-8000-000000000002',
      sku: 'MON-LG-27GP',
      name: 'Màn Hình Gaming LG UltraGear 27 inch 2K 144Hz',
      supplier_id: '00000000-0000-4000-8000-000000000002',
      supplier_name: 'Công Ty TNHH LG Electronics VN',
      category: 'Màn hình',
      unit: 'Cái',
      cost_price: 4300000,
      selling_price: 5990000,
      stock_quantity: 28,
      min_stock_alert: 8,
      location: 'Khu A - Kệ 02',
      created_at: '2026-08-01T08:15:00.000Z'
    },
    {
      id: '20000000-0000-4000-8000-000000000003',
      sku: 'MOU-LOG-MX3S',
      name: 'Chuột Không Dây Logitech MX Master 3S',
      supplier_id: '00000000-0000-4000-8000-000000000003',
      supplier_name: 'Tổng Kho Linh Kiện Nam Sài Gòn',
      category: 'Phụ kiện',
      unit: 'Cái',
      cost_price: 1750000,
      selling_price: 2450000,
      stock_quantity: 45,
      min_stock_alert: 10,
      location: 'Khu B - Kệ 01',
      created_at: '2026-08-01T08:30:00.000Z'
    },
    {
      id: '20000000-0000-4000-8000-000000000004',
      sku: 'KEY-KEY-K2V2',
      name: 'Bàn Phím Cơ Wireless Keychron K2 V2 RGB',
      supplier_id: '00000000-0000-4000-8000-000000000003',
      supplier_name: 'Tổng Kho Linh Kiện Nam Sài Gòn',
      category: 'Phụ kiện',
      unit: 'Cái',
      cost_price: 1350000,
      selling_price: 1950000,
      stock_quantity: 4,
      min_stock_alert: 8,
      location: 'Khu B - Kệ 02',
      created_at: '2026-08-01T08:45:00.000Z'
    },
    {
      id: '20000000-0000-4000-8000-000000000005',
      sku: 'SRV-DEL-T150',
      name: 'Máy Chủ Server Dell PowerEdge T150 Xeon E-2314',
      supplier_id: '00000000-0000-4000-8000-000000000001',
      supplier_name: 'Tổng Kho Phân Phối Dell Vietnam',
      category: 'Thiết bị Mạng & Server',
      unit: 'Cái',
      cost_price: 30500000,
      selling_price: 38500000,
      stock_quantity: 2,
      min_stock_alert: 2,
      location: 'Khu C - Tủ Bảo Vệ 01',
      created_at: '2026-08-01T09:00:00.000Z'
    },
    {
      id: '20000000-0000-4000-8000-000000000006',
      sku: 'ROU-CIS-1000',
      name: 'Thiết Bị Định Tuyến Router Cisco RV340 Dual WAN',
      supplier_id: '00000000-0000-4000-8000-000000000003',
      supplier_name: 'Tổng Kho Linh Kiện Nam Sài Gòn',
      category: 'Thiết bị Mạng & Server',
      unit: 'Bộ',
      cost_price: 4800000,
      selling_price: 6500000,
      stock_quantity: 12,
      min_stock_alert: 4,
      location: 'Khu C - Kệ 02',
      created_at: '2026-08-01T09:15:00.000Z'
    },
    {
      id: '20000000-0000-4000-8000-000000000007',
      sku: 'HEA-SON-WH1000',
      name: 'Tai Nghe Chống Ồn Sony WH-1000XM5 Wireless',
      supplier_id: '00000000-0000-4000-8000-000000000004',
      supplier_name: 'Công Ty Cổ Phần Phân Phối Synnex FPT',
      category: 'Phụ kiện',
      unit: 'Cái',
      cost_price: 5200000,
      selling_price: 6990000,
      stock_quantity: 16,
      min_stock_alert: 5,
      location: 'Khu B - Kệ 03',
      created_at: '2026-08-01T09:30:00.000Z'
    },
    {
      id: '20000000-0000-4000-8000-000000000008',
      sku: 'SSD-SAM-980PRO',
      name: 'Ổ Cứng SSD Samsung 980 PRO NVMe M.2 1TB',
      supplier_id: '00000000-0000-4000-8000-000000000004',
      supplier_name: 'Công Ty Cổ Phần Phân Phối Synnex FPT',
      category: 'Linh kiện máy tính',
      unit: 'Chiếc',
      cost_price: 2100000,
      selling_price: 2850000,
      stock_quantity: 35,
      min_stock_alert: 10,
      location: 'Khu A - Kệ 03',
      created_at: '2026-08-01T09:45:00.000Z'
    }
  ],

  orders: [
    {
      id: '30000000-0000-4000-8000-000000000001',
      order_code: 'HD20260801',
      customer_id: '10000000-0000-4000-8000-000000000001',
      customer_name: 'Công ty TNHH Công Nghệ Việt',
      total_amount: 26900000,
      shipping_fee: 0,
      delivery_method: 'Delivery',
      discount: 900000,
      tax: 0,
      final_amount: 26000000,
      paid_amount: 10500000,
      debt_amount: 15500000,
      status: 'Completed',
      payment_method: 'Bank',
      notes: 'Giao trong giờ hành chính, xuất hóa đơn VAT',
      created_at: '2026-08-04T10:30:00.000Z',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000001',
          product_sku: 'LAP-DEL-XPS13',
          product_name: 'Laptop Dell XPS 13 i7 16GB 512GB SSD',
          unit_price: 26900000,
          quantity: 1,
          subtotal: 26900000
        }
      ]
    },
    {
      id: '30000000-0000-4000-8000-000000000002',
      order_code: 'HD20260802',
      customer_id: '10000000-0000-4000-8000-000000000002',
      customer_name: 'Tập đoàn Bán Lẻ An Phát',
      total_amount: 42000000,
      shipping_fee: 0,
      delivery_method: 'Delivery',
      discount: 0,
      tax: 0,
      final_amount: 42000000,
      paid_amount: 0,
      debt_amount: 42000000,
      status: 'Completed',
      payment_method: 'Debt',
      notes: 'Đơn hàng theo hợp đồng khung đợt 1',
      created_at: '2026-08-06T14:15:00.000Z',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000005',
          product_sku: 'SRV-DEL-T150',
          product_name: 'Máy Chủ Server Dell PowerEdge T150 Xeon E-2314',
          unit_price: 38500000,
          quantity: 1,
          subtotal: 38500000
        },
        {
          product_id: '20000000-0000-4000-8000-000000000003',
          product_sku: 'MOU-LOG-MX3S',
          product_name: 'Chuột Không Dây Logitech MX Master 3S',
          unit_price: 3500000,
          quantity: 1,
          subtotal: 3500000
        }
      ]
    },
    {
      id: '30000000-0000-4000-8000-000000000003',
      order_code: 'HD20260808',
      customer_id: '10000000-0000-4000-8000-000000000001',
      customer_name: 'Công ty TNHH Công Nghệ Việt',
      total_amount: 53800000,
      shipping_fee: 0,
      delivery_method: 'Delivery',
      discount: 0,
      tax: 0,
      final_amount: 53800000,
      paid_amount: 0,
      debt_amount: 53800000,
      status: 'Completed',
      payment_method: 'Debt',
      notes: 'Bổ sung máy trạm lập trình',
      created_at: '2026-08-08T09:15:00.000Z',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000001',
          product_sku: 'LAP-DEL-XPS13',
          product_name: 'Laptop Dell XPS 13 i7 16GB 512GB SSD',
          unit_price: 26900000,
          quantity: 2,
          subtotal: 53800000
        }
      ]
    },
    {
      id: '30000000-0000-4000-8000-000000000004',
      order_code: 'HD20260725',
      customer_id: '10000000-0000-4000-8000-000000000001',
      customer_name: 'Công ty TNHH Công Nghệ Việt',
      total_amount: 11980000,
      shipping_fee: 0,
      delivery_method: 'Pickup',
      discount: 0,
      tax: 0,
      final_amount: 11980000,
      paid_amount: 7580000,
      debt_amount: 4400000,
      status: 'Completed',
      payment_method: 'Debt',
      notes: 'Khách tự nhận tại kho',
      created_at: '2026-07-25T16:00:00.000Z',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000002',
          product_sku: 'MON-LG-27GP',
          product_name: 'Màn Hình Gaming LG UltraGear 27 inch 2K 144Hz',
          unit_price: 5990000,
          quantity: 2,
          subtotal: 11980000
        }
      ]
    },
    {
      id: '30000000-0000-4000-8000-000000000005',
      order_code: 'HD20260807',
      customer_id: '10000000-0000-4000-8000-000000000003',
      customer_name: 'Cửa Hàng Điện Máy Minh Khoa',
      total_amount: 9840000,
      shipping_fee: 50000,
      delivery_method: 'Delivery',
      discount: 0,
      tax: 0,
      final_amount: 9890000,
      paid_amount: 9890000,
      debt_amount: 0,
      status: 'Completed',
      payment_method: 'Cash',
      notes: 'Đã thanh toán tiền mặt đủ khi giao',
      created_at: '2026-08-07T11:20:00.000Z',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000004',
          product_sku: 'KEY-KEY-K2V2',
          product_name: 'Bàn Phím Cơ Wireless Keychron K2 V2 RGB',
          unit_price: 1950000,
          quantity: 2,
          subtotal: 3900000
        },
        {
          product_id: '20000000-0000-4000-8000-000000000002',
          product_sku: 'MON-LG-27GP',
          product_name: 'Màn Hình Gaming LG UltraGear 27 inch 2K 144Hz',
          unit_price: 5940000,
          quantity: 1,
          subtotal: 5940000
        }
      ]
    },
    {
      id: '30000000-0000-4000-8000-000000000006',
      order_code: 'HD20260815',
      customer_id: '10000000-0000-4000-8000-000000000004',
      customer_name: 'Đại Lý Thiết Bị Viễn Thông Á Châu',
      total_amount: 35000000,
      shipping_fee: 120000,
      delivery_method: 'Delivery',
      discount: 120000,
      tax: 0,
      final_amount: 35000000,
      paid_amount: 20000000,
      debt_amount: 15000000,
      status: 'Completed',
      payment_method: 'Debt',
      notes: 'Đại lý công nợ gối đầu',
      created_at: '2026-08-15T15:00:00.000Z',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000006',
          product_sku: 'ROU-CIS-1000',
          product_name: 'Thiết Bị Định Tuyến Router Cisco RV340 Dual WAN',
          unit_price: 6500000,
          quantity: 4,
          subtotal: 26000000
        },
        {
          product_id: '20000000-0000-4000-8000-000000000008',
          product_sku: 'SSD-SAM-980PRO',
          product_name: 'Ổ Cứng SSD Samsung 980 PRO NVMe M.2 1TB',
          unit_price: 2850000,
          quantity: 3,
          subtotal: 8550000
        }
      ]
    }
  ],

  debts: [
    {
      id: '40000000-0000-4000-8000-000000000001',
      code: 'CN-PT-001',
      customer_id: '10000000-0000-4000-8000-000000000001',
      customer_name: 'Công ty TNHH Công Nghệ Việt',
      order_id: '30000000-0000-4000-8000-000000000001',
      order_code: 'HD20260801',
      type: 'Receivable',
      total_amount: 15500000,
      remaining_amount: 15500000,
      due_date: '2026-08-25',
      status: 'Unpaid',
      notes: 'Công nợ từ đơn HD20260801',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000001',
          product_sku: 'LAP-DEL-XPS13',
          product_name: 'Laptop Dell XPS 13 i7 16GB 512GB SSD',
          unit_price: 26900000,
          quantity: 1,
          subtotal: 15500000
        }
      ],
      created_at: '2026-08-04T10:30:00.000Z'
    },
    {
      id: '40000000-0000-4000-8000-000000000002',
      code: 'CN-PT-456',
      customer_id: '10000000-0000-4000-8000-000000000001',
      customer_name: 'Công ty TNHH Công Nghệ Việt',
      order_id: '30000000-0000-4000-8000-000000000003',
      order_code: 'HD20260808',
      type: 'Receivable',
      total_amount: 53800000,
      remaining_amount: 53800000,
      due_date: '2026-09-08',
      status: 'Unpaid',
      notes: 'Ghi nhận công nợ đơn HD20260808',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000001',
          product_sku: 'LAP-DEL-XPS13',
          product_name: 'Laptop Dell XPS 13 i7 16GB 512GB SSD',
          unit_price: 26900000,
          quantity: 2,
          subtotal: 53800000
        }
      ],
      created_at: '2026-08-08T09:15:00.000Z'
    },
    {
      id: '40000000-0000-4000-8000-000000000003',
      code: 'CN-PT-808',
      customer_id: '10000000-0000-4000-8000-000000000001',
      customer_name: 'Công ty TNHH Công Nghệ Việt',
      order_id: '30000000-0000-4000-8000-000000000004',
      order_code: 'HD20260725',
      type: 'Receivable',
      total_amount: 4400000,
      remaining_amount: 4400000,
      due_date: '2026-08-15',
      status: 'Overdue',
      notes: 'Ghi nhận công nợ đơn HD20260725 quá hạn',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000002',
          product_sku: 'MON-LG-27GP',
          product_name: 'Màn Hình Gaming LG UltraGear 27 inch 2K 144Hz',
          unit_price: 5990000,
          quantity: 2,
          subtotal: 4400000
        }
      ],
      created_at: '2026-07-25T16:00:00.000Z'
    },
    {
      id: '40000000-0000-4000-8000-000000000004',
      code: 'CN-PT-002',
      customer_id: '10000000-0000-4000-8000-000000000002',
      customer_name: 'Tập đoàn Bán Lẻ An Phát',
      order_id: '30000000-0000-4000-8000-000000000002',
      order_code: 'HD20260802',
      type: 'Receivable',
      total_amount: 42000000,
      remaining_amount: 42000000,
      due_date: '2026-08-30',
      status: 'Unpaid',
      notes: 'Công nợ từ đơn HD20260802',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000005',
          product_sku: 'SRV-DEL-T150',
          product_name: 'Máy Chủ Server Dell PowerEdge T150 Xeon E-2314',
          unit_price: 38500000,
          quantity: 1,
          subtotal: 38500000
        },
        {
          product_id: '20000000-0000-4000-8000-000000000003',
          product_sku: 'MOU-LOG-MX3S',
          product_name: 'Chuột Không Dây Logitech MX Master 3S',
          unit_price: 3500000,
          quantity: 1,
          subtotal: 3500000
        }
      ],
      created_at: '2026-08-06T14:15:00.000Z'
    },
    {
      id: '40000000-0000-4000-8000-000000000005',
      code: 'CN-PT-330',
      customer_id: '10000000-0000-4000-8000-000000000002',
      customer_name: 'Tập đoàn Bán Lẻ An Phát',
      order_id: null,
      order_code: null,
      type: 'Receivable',
      total_amount: 17970000,
      remaining_amount: 17970000,
      due_date: '2026-09-01',
      status: 'Unpaid',
      notes: 'Công nợ linh kiện đợt 2',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000004',
          product_sku: 'KEY-KEY-K2V2',
          product_name: 'Bàn Phím Cơ Wireless Keychron K2 V2 RGB',
          unit_price: 1950000,
          quantity: 9,
          subtotal: 17970000
        }
      ],
      created_at: '2026-08-01T15:00:00.000Z'
    },
    {
      id: '40000000-0000-4000-8000-000000000006',
      code: 'CN-PT-004',
      customer_id: '10000000-0000-4000-8000-000000000004',
      customer_name: 'Đại Lý Thiết Bị Viễn Thông Á Châu',
      order_id: '30000000-0000-4000-8000-000000000006',
      order_code: 'HD20260815',
      type: 'Receivable',
      total_amount: 15000000,
      remaining_amount: 15000000,
      due_date: '2026-09-15',
      status: 'Unpaid',
      notes: 'Công nợ đơn hàng HD20260815',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000006',
          product_sku: 'ROU-CIS-1000',
          product_name: 'Thiết Bị Định Tuyến Router Cisco RV340 Dual WAN',
          unit_price: 6500000,
          quantity: 4,
          subtotal: 15000000
        }
      ],
      created_at: '2026-08-15T15:00:00.000Z'
    },
    {
      id: '40000000-0000-4000-8000-000000000007',
      code: 'CN-TRA-001',
      customer_id: '10000000-0000-4000-8000-000000000001',
      customer_name: 'Tổng Kho Linh Kiện Nam Sài Gòn',
      order_id: null,
      order_code: null,
      type: 'Payable',
      total_amount: 28000000,
      remaining_amount: 28000000,
      due_date: '2026-08-20',
      status: 'Unpaid',
      notes: 'Nợ tiền hàng nhập linh kiện mạng',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000005',
          product_sku: 'SRV-DEL-T150',
          product_name: 'Máy Chủ Server Dell PowerEdge T150 Xeon E-2314',
          unit_price: 28000000,
          quantity: 1,
          subtotal: 28000000
        }
      ],
      created_at: '2026-08-01T10:00:00.000Z'
    }
  ],

  debt_payments: [
    {
      id: '50000000-0000-4000-8000-000000000001',
      debt_id: '40000000-0000-4000-8000-000000000001',
      customer_name: 'Công ty TNHH Công Nghệ Việt',
      payment_code: 'TT-20260804',
      amount: 10500000,
      payment_method: 'Bank',
      payer_name: 'Kế toán Công Nghệ Việt',
      receiver_name: 'Thủ quỹ ERP',
      note: 'Thanh toán đợt 1 tiền hàng Laptop XPS (HD20260801)',
      created_at: '2026-08-04T11:00:00.000Z'
    },
    {
      id: '50000000-0000-4000-8000-000000000002',
      debt_id: '40000000-0000-4000-8000-000000000006',
      customer_name: 'Đại Lý Thiết Bị Viễn Thông Á Châu',
      payment_code: 'TT-20260815',
      amount: 20000000,
      payment_method: 'Bank',
      payer_name: 'Đại diện Đại lý Á Châu',
      receiver_name: 'Thủ quỹ ERP',
      note: 'Thanh toán tiền hàng đợt 1 đơn HD20260815',
      created_at: '2026-08-15T15:30:00.000Z'
    }
  ],

  inventory_transactions: [
    {
      id: '60000000-0000-4000-8000-000000000001',
      code: 'NK-20260801',
      type: 'StockIn',
      product_id: '20000000-0000-4000-8000-000000000001',
      product_name: 'Laptop Dell XPS 13 i7 16GB 512GB SSD',
      sku: 'LAP-DEL-XPS13',
      quantity: 10,
      previous_stock: 4,
      new_stock: 14,
      reason: 'Nhập kho đơn hàng NK20260801 từ Dell VN',
      reference_code: 'NK20260801',
      created_at: '2026-08-01T09:00:00.000Z'
    },
    {
      id: '60000000-0000-4000-8000-000000000002',
      code: 'XK-20260804',
      type: 'StockOut',
      product_id: '20000000-0000-4000-8000-000000000001',
      product_name: 'Laptop Dell XPS 13 i7 16GB 512GB SSD',
      sku: 'LAP-DEL-XPS13',
      quantity: 1,
      previous_stock: 14,
      new_stock: 13,
      reason: 'Xuất bán cho khách hàng Công Nghệ Việt (HD20260801)',
      reference_code: 'HD20260801',
      created_at: '2026-08-04T10:30:00.000Z'
    },
    {
      id: '60000000-0000-4000-8000-000000000003',
      code: 'NK-20260803',
      type: 'StockIn',
      product_id: '20000000-0000-4000-8000-000000000002',
      product_name: 'Màn Hình Gaming LG UltraGear 27 inch 2K 144Hz',
      sku: 'MON-LG-27GP',
      quantity: 20,
      previous_stock: 10,
      new_stock: 30,
      reason: 'Nhập kho lô màn hình từ LG Electronics VN',
      reference_code: 'NK20260803',
      created_at: '2026-08-03T14:30:00.000Z'
    },
    {
      id: '60000000-0000-4000-8000-000000000004',
      code: 'XK-20260807',
      type: 'StockOut',
      product_id: '20000000-0000-4000-8000-000000000004',
      product_name: 'Bàn Phím Cơ Wireless Keychron K2 V2 RGB',
      sku: 'KEY-KEY-K2V2',
      quantity: 2,
      previous_stock: 6,
      new_stock: 4,
      reason: 'Xuất bán đơn HD20260807 (Điện Máy Minh Khoa)',
      reference_code: 'HD20260807',
      created_at: '2026-08-07T11:20:00.000Z'
    }
  ],

  leads: [
    {
      id: '70000000-0000-4000-8000-000000000001',
      name: 'Nguyễn Văn Nam',
      company: 'Công ty Cổ phần Phần mềm BK Tech',
      phone: '0933112233',
      email: 'nam.nguyen@bksoft.vn',
      estimated_value: 120000000,
      expected_value: 120000000,
      stage: 'Proposal',
      assigned_to: 'Nguyễn Thanh Tùng',
      notes: 'Yêu cầu báo giá 10 máy trạm Dell XPS và 10 màn hình LG UltraGear',
      created_at: '2026-08-11T08:30:00.000Z'
    },
    {
      id: '70000000-0000-4000-8000-000000000002',
      name: 'Trần Thị Thu Hoa',
      company: 'Chuỗi Nhà Hàng Cà Phê Phố Biển',
      phone: '0944556677',
      email: 'hoatt@phobien.com',
      estimated_value: 45000000,
      expected_value: 45000000,
      stage: 'Negotiation',
      assigned_to: 'Lê Thu Hà',
      notes: 'Cần tư vấn thiết bị mạng Cisco và hệ thống server POS cho 3 chi nhánh',
      created_at: '2026-08-14T10:00:00.000Z'
    },
    {
      id: '70000000-0000-4000-8000-000000000003',
      name: 'Phạm Quốc Cường',
      company: 'Đại Học Quốc Tế Đông Á',
      phone: '0966778899',
      email: 'cuong.pq@easia.edu.vn',
      estimated_value: 350000000,
      expected_value: 350000000,
      stage: 'Contacted',
      assigned_to: 'Nguyễn Thanh Tùng',
      notes: 'Dự án phòng Lab máy tính và Server Dell PowerEdge',
      created_at: '2026-08-16T13:45:00.000Z'
    },
    {
      id: '70000000-0000-4000-8000-000000000004',
      name: 'Lê Văn Minh',
      company: 'Công ty TNHH Logistics Vận Tải Toàn Cầu',
      phone: '0912334455',
      email: 'minh.le@globallogistics.vn',
      estimated_value: 85000000,
      expected_value: 85000000,
      stage: 'Lead',
      assigned_to: 'Trần Đình Trọng',
      notes: 'Khách liên hệ qua website cần nâng cấp hệ thống máy văn phòng',
      created_at: '2026-08-18T09:15:00.000Z'
    }
  ],

  returns: [
    {
      id: '80000000-0000-4000-8000-000000000001',
      return_code: 'TH20260801',
      order_id: '30000000-0000-4000-8000-000000000001',
      order_code: 'HD20260801',
      customer_id: '10000000-0000-4000-8000-000000000001',
      customer_name: 'Công ty TNHH Công Nghệ Việt',
      total_refund: 2450000,
      refund_amount: 2450000,
      refund_method: 'DebtDeduction',
      reason: 'Khách hàng đổi mẫu chuột, trừ trực tiếp vào công nợ',
      condition_status: 'Good',
      created_at: '2026-08-07T15:20:00.000Z'
    }
  ],

  inbound_orders: [
    {
      id: '90000000-0000-4000-8000-000000000001',
      code: 'NK20260801',
      supplier_id: '00000000-0000-4000-8000-000000000001',
      supplier_name: 'Tổng Kho Phân Phối Dell Vietnam',
      warehouse: 'Kho Tổng (Miền Nam)',
      total_amount: 215000000,
      status: 'Completed',
      received_by: 'Trần Thủ Kho',
      received_at: '2026-08-01T09:00:00.000Z',
      notes: 'Nhập lô 10 Laptop Dell XPS 13',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000001',
          sku: 'LAP-DEL-XPS13',
          product_name: 'Laptop Dell XPS 13 i7 16GB 512GB SSD',
          quantity: 10,
          unit: 'Cái',
          unit_price: 21500000,
          subtotal: 215000000
        }
      ],
      created_at: '2026-08-01T08:00:00.000Z'
    },
    {
      id: '90000000-0000-4000-8000-000000000002',
      code: 'NK20260803',
      supplier_id: '00000000-0000-4000-8000-000000000002',
      supplier_name: 'Công Ty TNHH LG Electronics VN',
      warehouse: 'Kho Tổng (Miền Nam)',
      total_amount: 86000000,
      status: 'Completed',
      received_by: 'Trần Thủ Kho',
      received_at: '2026-08-03T14:30:00.000Z',
      notes: 'Nhập 20 màn hình LG UltraGear 27 inch',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000002',
          sku: 'MON-LG-27GP',
          product_name: 'Màn Hình Gaming LG UltraGear 27 inch 2K 144Hz',
          quantity: 20,
          unit: 'Cái',
          unit_price: 4300000,
          subtotal: 86000000
        }
      ],
      created_at: '2026-08-03T10:00:00.000Z'
    },
    {
      id: '90000000-0000-4000-8000-000000000003',
      code: 'NK20260818',
      supplier_id: '00000000-0000-4000-8000-000000000003',
      supplier_name: 'Tổng Kho Linh Kiện Nam Sài Gòn',
      warehouse: 'Kho Tổng (Miền Nam)',
      total_amount: 38500000,
      status: 'Pending',
      received_by: 'Nguyễn Văn Kho',
      received_at: null,
      notes: 'Đơn đặt hàng phụ kiện Keychron & Cisco đang chờ nhà xe giao',
      items: [
        {
          product_id: '20000000-0000-4000-8000-000000000004',
          sku: 'KEY-KEY-K2V2',
          product_name: 'Bàn Phím Cơ Wireless Keychron K2 V2 RGB',
          quantity: 10,
          unit: 'Cái',
          unit_price: 1350000,
          subtotal: 13500000
        },
        {
          product_id: '20000000-0000-4000-8000-000000000006',
          sku: 'ROU-CIS-1000',
          product_name: 'Thiết Bị Định Tuyến Router Cisco RV340 Dual WAN',
          quantity: 5,
          unit: 'Bộ',
          unit_price: 5000000,
          subtotal: 25000000
        }
      ],
      created_at: '2026-08-18T08:00:00.000Z'
    }
  ],

  shipping_rules: DEFAULT_SHIPPING_RULES_PRESET,

  product_samples: [
    {
      id: 'b0000000-0000-4000-8000-000000000001',
      code: 'PM-202608-01',
      customer_id: '10000000-0000-4000-8000-000000000002',
      customer_name: 'Tập đoàn Bán Lẻ An Phát',
      customer_phone: '0918765432',
      product_id: '20000000-0000-4000-8000-000000000004',
      product_name: 'Bàn Phím Cơ Wireless Keychron K2 V2 RGB',
      product_sku: 'KEY-KEY-K2V2',
      category: 'Phụ kiện',
      quantity: 2,
      unit: 'Cái',
      sales_person: 'Lê Thu Hà',
      route: 'Tuyến Phú Nhuận - Gò Vấp',
      handover_date: '2026-08-02',
      expected_return_date: '2026-08-20',
      status: 'Displaying',
      feedback: 'Khách đánh giá gõ phím êm, đèn RGB đẹp, đang chạy thử chương trình trải nghiệm showroom',
      purpose: 'Trưng bày tại kệ trải nghiệm khách hàng',
      notes: 'Bàn giao nguyên seal 2 bàn phím mẫu',
      created_at: '2026-08-02T09:00:00.000Z'
    },
    {
      id: 'b0000000-0000-4000-8000-000000000002',
      code: 'PM-202608-02',
      customer_id: '10000000-0000-4000-8000-000000000001',
      customer_name: 'Công ty TNHH Công Nghệ Việt',
      customer_phone: '0903123456',
      product_id: '20000000-0000-4000-8000-000000000003',
      product_name: 'Chuột Không Dây Logitech MX Master 3S',
      product_sku: 'MOU-LOG-MX3S',
      category: 'Phụ kiện',
      quantity: 1,
      unit: 'Cái',
      sales_person: 'Nguyễn Thanh Tùng',
      route: 'Tuyến Quận 1 - Bình Thạnh',
      handover_date: '2026-08-05',
      expected_return_date: '2026-08-15',
      status: 'Converted',
      feedback: 'Khách hàng rất hài lòng về độ mượt của con lăn và độ êm, đã chốt mua kèm đơn hàng HD20260808',
      purpose: 'Dùng thử nội bộ cho team Thiết kế UI/UX',
      notes: 'Đã xuất hóa đơn chuyển đổi sang bán',
      created_at: '2026-08-05T14:00:00.000Z'
    },
    {
      id: 'b0000000-0000-4000-8000-000000000003',
      code: 'PM-202608-03',
      customer_id: '10000000-0000-4000-8000-000000000004',
      customer_name: 'Đại Lý Thiết Bị Viễn Thông Á Châu',
      customer_phone: '0933556677',
      product_id: '20000000-0000-4000-8000-000000000006',
      product_name: 'Thiết Bị Định Tuyến Router Cisco RV340 Dual WAN',
      product_sku: 'ROU-CIS-1000',
      category: 'Thiết bị Mạng & Server',
      quantity: 1,
      unit: 'Bộ',
      sales_person: 'Nguyễn Thanh Tùng',
      route: 'Tuyến Miền Đông (Bình Dương - Đồng Nai)',
      handover_date: '2026-08-10',
      expected_return_date: '2026-08-25',
      status: 'Displaying',
      feedback: 'Đang thử nghiệm chịu tải cho gói mạng doanh nghiệp',
      purpose: 'Thử nghiệm PoC kỹ thuật cho dự án',
      notes: 'Cấp mượn demo phòng lab',
      created_at: '2026-08-10T10:30:00.000Z'
    },
    {
      id: 'b0000000-0000-4000-8000-000000000004',
      code: 'PM-202608-04',
      customer_id: '10000000-0000-4000-8000-000000000006',
      customer_name: 'Trung Tâm Tin Học Trẻ Hoàng Long',
      customer_phone: '0966445566',
      product_id: '20000000-0000-4000-8000-000000000002',
      product_name: 'Màn Hình Gaming LG UltraGear 27 inch 2K 144Hz',
      product_sku: 'MON-LG-27GP',
      category: 'Màn hình',
      quantity: 1,
      unit: 'Cái',
      sales_person: 'Trần Đình Trọng',
      route: 'Tuyến TP. Thủ Đức',
      handover_date: '2026-07-28',
      expected_return_date: '2026-08-10',
      status: 'Returned',
      feedback: 'Chất lượng hiển thị sắc nét, trung tâm dự kiến đặt mua 10 chiếc vào tháng tới',
      purpose: 'Trưng bày tại phòng học chuyên đề Đồ họa',
      notes: 'Đã kiểm tra thu hồi về kho, tình trạng nguyên vẹn 100%',
      created_at: '2026-07-28T09:00:00.000Z'
    },
    {
      id: 'b0000000-0000-4000-8000-000000000005',
      code: 'PM-202608-05',
      customer_id: '10000000-0000-4000-8000-000000000005',
      customer_name: 'Công ty Cổ phần Giải pháp Số Nam Việt',
      customer_phone: '0977889900',
      product_id: '20000000-0000-4000-8000-000000000007',
      product_name: 'Tai Nghe Chống Ồn Sony WH-1000XM5 Wireless',
      product_sku: 'HEA-SON-WH1000',
      category: 'Phụ kiện',
      quantity: 1,
      unit: 'Cái',
      sales_person: 'Lê Thu Hà',
      route: 'Tuyến Miền Tây (Long An - Tiền Giang - Cần Thơ)',
      handover_date: '2026-08-12',
      expected_return_date: '2026-08-26',
      status: 'Displaying',
      feedback: 'Khách đánh giá chống ồn vượt trội, pin trâu',
      purpose: 'Demo cho ban giám đốc',
      notes: 'Hàng mẫu màu đen nguyên hộp',
      created_at: '2026-08-12T11:00:00.000Z'
    }
  ]
};

// Helper functions for UUID validation and Supabase payload sanitization
function isValidUUID(str) {
  if (typeof str !== 'string') return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

function prepareSupabasePayload(dataObj) {
  const payload = { ...dataObj };
  if (payload.id && !isValidUUID(payload.id)) {
    delete payload.id;
  }
  return payload;
}

class SupabaseProvider {
  constructor() {
    this.supabase = null;
    this.isLiveMode = false;
    this.initProvider();
  }

  initProvider() {
    const config = this.getSavedConfig();
    if (config && config.url && config.key && window.supabase) {
      try {
        this.supabase = window.supabase.createClient(config.url, config.key);
        this.isLiveMode = true;
        console.log('⚡ Connected to Supabase Live Database');
      } catch (err) {
        console.error('Failed to init Supabase client:', err);
        this.isLiveMode = false;
      }
    } else {
      this.isLiveMode = false;
      console.log('📦 Using Local Storage Fallback Engine (Demo Mode)');
    }

    this.ensureLocalStorageDb();
  }

  getSavedConfig() {
    try {
      return JSON.parse(localStorage.getItem(SUPABASE_CONFIG_KEY));
    } catch (e) {
      return null;
    }
  }

  saveConfig(url, key) {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url, key }));
    window.location.reload();
  }

  ensureLocalStorageDb(forceSeed = false) {
    const raw = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
    if (!raw || forceSeed) {
      localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(DEFAULT_INITIAL_DATA));
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const isCompletelyEmpty = (!parsed.customers || parsed.customers.length === 0) &&
        (!parsed.products || parsed.products.length === 0) &&
        (!parsed.orders || parsed.orders.length === 0);
      if (isCompletelyEmpty) {
        localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(DEFAULT_INITIAL_DATA));
      }
    } catch (e) {
      localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(DEFAULT_INITIAL_DATA));
    }
  }

  getLocalStorageDb() {
    this.ensureLocalStorageDb();
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_DB_KEY));
  }

  saveLocalStorageDb(data) {
    localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(data));
  }

  async loadSampleData(force = true) {
    if (this.isLiveMode) {
      try {
        // 1. Customers
        const custData = DEFAULT_INITIAL_DATA.customers.filter(c => c.type !== 'Supplier');
        for (const c of custData) {
          await this.supabase.from('customers').upsert([prepareSupabasePayload(c)], { onConflict: 'code' });
        }

        // 2. Suppliers
        try {
          const supData = DEFAULT_INITIAL_DATA.customers.filter(c => c.type === 'Supplier');
          for (const s of supData) {
            const sp = { ...s };
            delete sp.type;
            await this.supabase.from('suppliers').upsert([prepareSupabasePayload(sp)], { onConflict: 'code' });
          }
        } catch (e) {
          console.warn('Suppliers table not found on Supabase, falling back to customers table:', e);
          const supData = DEFAULT_INITIAL_DATA.customers.filter(c => c.type === 'Supplier');
          for (const s of supData) {
            await this.supabase.from('customers').upsert([prepareSupabasePayload(s)], { onConflict: 'code' });
          }
        }

        // 3. Products
        for (const p of DEFAULT_INITIAL_DATA.products) {
          await this.supabase.from('products').upsert([prepareSupabasePayload(p)], { onConflict: 'sku' });
        }

        // 4. Orders & Order Items
        for (const o of DEFAULT_INITIAL_DATA.orders) {
          const ordPayload = { ...o };
          const items = ordPayload.items || [];
          delete ordPayload.items;
          const { data: insOrd } = await this.supabase.from('orders').upsert([prepareSupabasePayload(ordPayload)], { onConflict: 'order_code' }).select();
          if (insOrd && insOrd.length > 0 && items.length > 0) {
            const orderId = insOrd[0].id;
            for (const item of items) {
              await this.supabase.from('order_items').insert([{
                order_id: orderId,
                product_id: item.product_id,
                product_name: item.product_name,
                unit_price: item.unit_price,
                quantity: item.quantity,
                subtotal: item.subtotal
              }]);
            }
          }
        }

        // 5. Debts
        for (const d of DEFAULT_INITIAL_DATA.debts) {
          const dPayload = { ...d };
          delete dPayload.items;
          await this.supabase.from('debts').upsert([prepareSupabasePayload(dPayload)], { onConflict: 'code' });
        }

        // 6. Debt Payments
        for (const dp of DEFAULT_INITIAL_DATA.debt_payments) {
          const dpPayload = {
            id: dp.id,
            debt_id: dp.debt_id,
            customer_name: dp.customer_name,
            payment_code: dp.payment_code,
            amount: dp.amount,
            payment_method: dp.payment_method,
            note: dp.note,
            created_at: dp.created_at
          };
          await this.supabase.from('debt_payments').upsert([prepareSupabasePayload(dpPayload)], { onConflict: 'payment_code' });
        }

        // 7. Inventory Transactions
        for (const it of DEFAULT_INITIAL_DATA.inventory_transactions) {
          const itPayload = {
            id: it.id,
            code: it.code,
            type: it.type,
            product_id: it.product_id,
            product_name: it.product_name,
            quantity: it.quantity,
            previous_stock: it.previous_stock,
            new_stock: it.new_stock,
            reason: it.reason,
            created_at: it.created_at
          };
          await this.supabase.from('inventory_transactions').upsert([prepareSupabasePayload(itPayload)], { onConflict: 'code' });
        }

        // 8. Leads
        for (const l of DEFAULT_INITIAL_DATA.leads) {
          const lPayload = {
            id: l.id,
            name: l.name,
            company: l.company,
            phone: l.phone,
            email: l.email,
            estimated_value: l.estimated_value,
            stage: l.stage,
            assigned_to: l.assigned_to,
            notes: l.notes,
            created_at: l.created_at
          };
          await this.supabase.from('leads').upsert([prepareSupabasePayload(lPayload)]);
        }

        // 9. Returns
        for (const r of DEFAULT_INITIAL_DATA.returns) {
          const rPayload = {
            id: r.id,
            return_code: r.return_code,
            order_code: r.order_code,
            customer_name: r.customer_name,
            total_refund: r.total_refund,
            refund_method: r.refund_method,
            reason: r.reason,
            created_at: r.created_at
          };
          await this.supabase.from('returns').upsert([prepareSupabasePayload(rPayload)], { onConflict: 'return_code' });
        }

        // 10. Inbound Orders
        for (const inb of DEFAULT_INITIAL_DATA.inbound_orders) {
          await this.supabase.from('inbound_orders').upsert([prepareSupabasePayload(inb)], { onConflict: 'code' });
        }

        // 11. Shipping Rules
        for (const sr of DEFAULT_INITIAL_DATA.shipping_rules) {
          const srPayload = {
            id: sr.id,
            category: sr.category,
            min_distance: sr.min_distance,
            max_distance: sr.max_distance,
            base_fee: sr.base_fee,
            is_active: sr.is_active,
            notes: sr.notes
          };
          await this.supabase.from('shipping_rules').upsert([prepareSupabasePayload(srPayload)]);
        }

        // 12. Product Samples
        for (const sm of DEFAULT_INITIAL_DATA.product_samples) {
          const smPayload = {
            id: sm.id,
            code: sm.code,
            customer_id: sm.customer_id,
            customer_name: sm.customer_name,
            customer_phone: sm.customer_phone,
            route: sm.route,
            sales_person: sm.sales_person,
            product_id: sm.product_id,
            product_sku: sm.product_sku,
            product_name: sm.product_name,
            category: sm.category,
            quantity: sm.quantity,
            unit: sm.unit,
            handover_date: sm.handover_date,
            status: sm.status,
            feedback: sm.feedback,
            notes: sm.notes,
            created_at: sm.created_at
          };
          await this.supabase.from('product_samples').upsert([prepareSupabasePayload(smPayload)], { onConflict: 'code' });
        }
      } catch (err) {
        console.error('Error seeding Supabase live database:', err);
        throw err;
      }
    }

    // Always ensure local storage is refreshed with sample data
    this.saveLocalStorageDb(JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA)));
  }

  // --- API METHODS ---

  // CUSTOMERS
  async getCustomers() {
    if (this.isLiveMode) {
      const { data, error } = await this.supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return this.getLocalStorageDb().customers;
  }

  // SUPPLIERS (NHÀ CUNG CẤP INBOUND)
  async getSuppliers() {
    if (this.isLiveMode) {
      try {
        const { data, error } = await this.supabase.from('suppliers').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          return data.map(s => ({ ...s, type: 'Supplier' }));
        }
      } catch (e) {
        console.warn('Bảng suppliers trên Supabase Database chưa được khởi tạo, tự động truy vấn từ bảng customers.');
      }
      const { data } = await this.supabase.from('customers').select('*').eq('type', 'Supplier').order('created_at', { ascending: false });
      if (data) return data;
    }
    const localCusts = this.getLocalStorageDb().customers || [];
    return localCusts.filter(c => c.type === 'Supplier');
  }

  async addSupplier(supplier) {
    supplier.id = supplier.id || 'c_' + Date.now();
    supplier.code = supplier.code || 'NCC' + Math.floor(10 + Math.random() * 90);
    supplier.type = 'Supplier';
    supplier.current_debt = supplier.current_debt || 0;
    supplier.created_at = supplier.created_at || new Date().toISOString();

    let createdSup = { ...supplier };
    if (this.isLiveMode) {
      const payload = prepareSupabasePayload(supplier);
      const supplierTablePayload = { ...payload };
      delete supplierTablePayload.type; // Remove 'type' field because public.suppliers table does not have a 'type' column

      const { data, error } = await this.supabase.from('suppliers').insert([supplierTablePayload]).select();
      if (error) {
        console.error('Supabase addSupplier error:', error);
        if (error.code === '23505' || (error.message && error.message.toLowerCase().includes('unique'))) {
          throw new Error(`Mã Nhà Cung Cấp "${supplier.code}" đã tồn tại trên Supabase Database! Vui lòng nhập mã khác.`);
        }
        if (error.code === '42P01' || (error.message && (error.message.includes('relation') || error.message.includes('suppliers')))) {
          throw new Error('Bảng "public.suppliers" chưa được khởi tạo trên Supabase. Vui lòng mở SQL Editor và chạy đoạn mã tạo bảng trong file config/supabase-schema.sql!');
        }
        throw new Error(error.message || 'Không thể thêm nhà cung cấp vào bảng suppliers trên Supabase');
      }
      if (data && data.length > 0) {
        createdSup = { ...supplier, id: data[0].id, type: 'Supplier' };
      }
    }

    const db = this.getLocalStorageDb();
    if (!db.customers) db.customers = [];
    const existingIdx = db.customers.findIndex(c => c.id === createdSup.id);
    if (existingIdx !== -1) {
      db.customers[existingIdx] = createdSup;
    } else {
      db.customers.unshift(createdSup);
    }
    this.saveLocalStorageDb(db);
    return createdSup;
  }

  async updateSupplier(id, updates) {
    if (this.isLiveMode) {
      try {
        const payload = prepareSupabasePayload(updates);
        delete payload.type;
        const { error } = await this.supabase.from('suppliers').update(payload).eq('id', id);
        if (error) {
          console.error('Supabase updateSupplier error:', error);
        }
      } catch (e) {
        console.error('Supabase updateSupplier exception:', e);
      }
    }
    const db = this.getLocalStorageDb();
    if (!db.customers) db.customers = [];
    const idx = db.customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      db.customers[idx] = { ...db.customers[idx], ...updates };
      this.saveLocalStorageDb(db);
    }
  }

  async addCustomer(customer) {
    customer.id = customer.id || 'c_' + Date.now();
    customer.code = customer.code || 'KH' + Math.floor(100 + Math.random() * 900);
    customer.current_debt = customer.current_debt || 0;
    customer.created_at = customer.created_at || new Date().toISOString();

    let createdCust = { ...customer };
    if (this.isLiveMode) {
      const payload = prepareSupabasePayload(customer);
      const { data, error } = await this.supabase.from('customers').insert([payload]).select();
      if (error) {
        console.error('Supabase addCustomer initial payload error:', error);
        if (error.code === 'PGRST204' || (error.message && (error.message.includes('column') || error.message.includes('email') || error.message.includes('route') || error.message.includes('sales_person') || error.message.includes('distance_km')))) {
          // Automatic Fallback: Retry with safe payload for Supabase database table
          const fallbackPayload = { ...payload };
          delete fallbackPayload.email;
          delete fallbackPayload.route;
          delete fallbackPayload.sales_person;
          delete fallbackPayload.distance_km;
          const { data: fbData, error: fbErr } = await this.supabase.from('customers').insert([fallbackPayload]).select();
          if (fbErr) {
            console.error('Supabase addCustomer fallback error:', fbErr);
            throw new Error(fbErr.message || 'Không thể thêm khách hàng vào Supabase');
          }
          if (fbData && fbData.length > 0) {
            createdCust = { ...customer, id: fbData[0].id };
          }
          if (typeof showToast === 'function') {
            showToast('Đã tạo khách hàng thành công!', 'success');
          }
        } else {
          throw new Error(error.message || 'Không thể thêm khách hàng vào Supabase');
        }
      } else if (data && data.length > 0) {
        createdCust = { ...customer, id: data[0].id };
      }
    }

    const db = this.getLocalStorageDb();
    if (!db.customers) db.customers = [];
    const existingIdx = db.customers.findIndex(c => c.id === createdCust.id);
    if (existingIdx !== -1) {
      db.customers[existingIdx] = createdCust;
    } else {
      db.customers.unshift(createdCust);
    }
    this.saveLocalStorageDb(db);
    return createdCust;
  }

  async updateCustomer(id, updates) {
    if (this.isLiveMode) {
      const payload = prepareSupabasePayload(updates);
      const { error } = await this.supabase.from('customers').update(payload).eq('id', id);
      if (error) {
        console.error('Supabase updateCustomer error:', error);
        if (error.code === 'PGRST204' || (error.message && (error.message.includes('column') || error.message.includes('email') || error.message.includes('route') || error.message.includes('sales_person') || error.message.includes('distance_km')))) {
          const fallbackPayload = { ...payload };
          delete fallbackPayload.email;
          delete fallbackPayload.route;
          delete fallbackPayload.sales_person;
          delete fallbackPayload.distance_km;
          await this.supabase.from('customers').update(fallbackPayload).eq('id', id);
        } else {
          throw new Error(error.message || 'Không thể cập nhật thông tin khách hàng trên Supabase');
        }
      }
    }
    const db = this.getLocalStorageDb();
    if (!db.customers) db.customers = [];
    const idx = db.customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      db.customers[idx] = { ...db.customers[idx], ...updates };
      this.saveLocalStorageDb(db);
    }
  }

  // PRODUCTS
  async getProducts() {
    const localProds = this.getLocalStorageDb().products || [];
    let supaProds = [];
    if (this.isLiveMode) {
      try {
        const { data, error } = await this.supabase.from('products').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) supaProds = data;
      } catch (err) {
        console.error('Error fetching products from Supabase:', err);
      }
    }

    if (supaProds.length === 0) return localProds;

    const prodMap = new Map();
    supaProds.forEach(p => prodMap.set(p.id, p));

    // Merge any local products
    localProds.forEach(lp => {
      if (!prodMap.has(lp.id)) {
        prodMap.set(lp.id, lp);
      } else {
        const sp = prodMap.get(lp.id);
        if (lp.location && !sp.location) sp.location = lp.location;
      }
    });

    return Array.from(prodMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  async addProduct(product) {
    product.id = product.id || 'p_' + Date.now();
    product.sku = product.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000);
    product.supplier_name = product.supplier_name || '';
    product.cost_price = Number(product.cost_price) || 0;
    product.selling_price = Number(product.selling_price) || 0;
    product.stock_quantity = Number(product.stock_quantity) || 0;
    product.min_stock_alert = Number(product.min_stock_alert) || 5;

    const currentProducts = await this.getProducts();

    // Check duplicate SKU before adding against current active products in the SAME warehouse location
    const targetLoc = (product.location || '').toString().trim().toLowerCase();
    const duplicateBySku = (currentProducts || []).find(p =>
      p.id !== product.id &&
      (p.sku || '').toString().trim().toLowerCase() === (product.sku || '').toString().trim().toLowerCase() &&
      (p.location || '').toString().trim().toLowerCase() === targetLoc
    );
    if (duplicateBySku) {
      throw new Error(`Mã SKU "${product.sku}" đã tồn tại tại "${product.location || 'kho này'}" (Sản phẩm: ${duplicateBySku.name})`);
    }

    const db = this.getLocalStorageDb();

    let createdProd = { ...product };

    if (this.isLiveMode) {
      const payload = prepareSupabasePayload(product);
      if (payload.supplier_id && !isValidUUID(payload.supplier_id)) {
        delete payload.supplier_id;
      }
      const { data, error } = await this.supabase.from('products').insert([payload]).select();
      if (error) {
        console.error('Supabase addProduct error:', error);
        if (error.code === 'PGRST204' || (error.message && (error.message.includes('supplier_name') || error.message.includes('supplier_id')))) {
          const fallbackPayload = { ...payload };
          delete fallbackPayload.supplier_name;
          delete fallbackPayload.supplier_id;
          const { data: fbData, error: fbErr } = await this.supabase.from('products').insert([fallbackPayload]).select();
          if (fbErr) {
            throw new Error(fbErr.message || 'Không thể thêm sản phẩm vào Supabase');
          }
          if (fbData && fbData.length > 0) {
            createdProd = { ...product, id: fbData[0].id };
          }
        } else if (error.code === '23505' || (error.message && error.message.toLowerCase().includes('unique'))) {
          throw new Error(`Mã SKU "${product.sku}" đã tồn tại trên cơ sở dữ liệu!`);
        } else {
          throw new Error(error.message || 'Không thể thêm sản phẩm vào Supabase');
        }
      } else if (data && data.length > 0) {
        createdProd = data[0];
      }
    }

    const existingIdx = db.products.findIndex(p => p.id === createdProd.id);
    if (existingIdx !== -1) {
      db.products[existingIdx] = createdProd;
    } else {
      db.products.unshift(createdProd);
    }

    // Auto-record initial stock movement in Stock Ledger (Thẻ Kho) if stock_quantity > 0
    if (createdProd.stock_quantity > 0) {
      const initTx = {
        id: 'it_' + Date.now(),
        code: 'NK-' + Math.floor(1000 + Math.random() * 9000),
        type: 'StockIn',
        product_name: createdProd.name,
        quantity: createdProd.stock_quantity,
        previous_stock: 0,
        new_stock: createdProd.stock_quantity,
        reason: 'Nhập số lượng tồn kho đầu kỳ khi khởi tạo sản phẩm',
        created_at: new Date().toISOString()
      };
      if (!db.inventory_transactions) db.inventory_transactions = [];
      db.inventory_transactions.unshift(initTx);

      if (this.isLiveMode) {
        const txPayload = prepareSupabasePayload({ ...initTx, product_id: createdProd.id });
        await this.supabase.from('inventory_transactions').insert([txPayload]);
      }
    }

    this.saveLocalStorageDb(db);
    return createdProd;
  }

  async updateProduct(id, updates) {
    if (this.isLiveMode) {
      try {
        if (isValidUUID(id)) {
          await this.supabase.from('products').update(updates).eq('id', id);
        } else {
          await this.supabase.from('products').update(updates).eq('sku', id);
        }
      } catch (err) {
        console.error('Supabase updateProduct error:', err);
      }
    }
    const db = this.getLocalStorageDb();
    const idx = (db.products || []).findIndex(p => p.id === id || p.sku === id);
    if (idx !== -1) {
      db.products[idx] = { ...db.products[idx], ...updates };
      this.saveLocalStorageDb(db);
    }
  }

  async deleteProduct(id) {
    if (this.isLiveMode) {
      try {
        if (isValidUUID(id)) {
          await this.supabase.from('products').delete().eq('id', id);
        } else {
          await this.supabase.from('products').delete().eq('sku', id);
        }
      } catch (err) {
        console.error('Supabase deleteProduct error:', err);
      }
    }
    const db = this.getLocalStorageDb();
    if (db.products) {
      db.products = db.products.filter(p => p.id !== id && p.sku !== id);
      this.saveLocalStorageDb(db);
    }
  }

  // ORDERS
  async getOrders() {
    if (this.isLiveMode) {
      try {
        const { data, error } = await this.supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
        if (!error && data) {
          return data.map(o => ({
            ...o,
            items: o.items && o.items.length > 0 ? o.items : (o.order_items || [])
          }));
        }
        const { data: ordersData } = await this.supabase.from('orders').select('*').order('created_at', { ascending: false });
        const { data: itemsData } = await this.supabase.from('order_items').select('*');
        if (ordersData) {
          const itemsMap = new Map();
          (itemsData || []).forEach(item => {
            if (!itemsMap.has(item.order_id)) itemsMap.set(item.order_id, []);
            itemsMap.get(item.order_id).push(item);
          });
          return ordersData.map(o => ({
            ...o,
            items: itemsMap.get(o.id) || o.items || []
          }));
        }
      } catch (err) {
        console.error('Error fetching orders from Supabase:', err);
      }
    }
    return this.getLocalStorageDb().orders;
  }

  async createOrder(orderData, items) {
    const isLive = this.isLiveMode;
    const db = this.getLocalStorageDb();

    orderData.id = orderData.id || (isLive ? undefined : 'o_' + Date.now());
    orderData.order_code = orderData.order_code || 'HD' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + Math.floor(10 + Math.random() * 90);
    orderData.created_at = orderData.created_at || new Date().toISOString();

    let savedOrder = { ...orderData };

    if (isLive) {
      try {
        const orderPayload = prepareSupabasePayload({
          order_code: orderData.order_code,
          customer_id: isValidUUID(orderData.customer_id) ? orderData.customer_id : null,
          customer_name: orderData.customer_name,
          total_amount: Number(orderData.total_amount) || 0,
          shipping_fee: Number(orderData.shipping_fee) || 0,
          delivery_method: orderData.delivery_method || 'Delivery',
          discount: Number(orderData.discount) || 0,
          tax: Number(orderData.tax) || 0,
          final_amount: Number(orderData.final_amount) || 0,
          paid_amount: Number(orderData.paid_amount) || 0,
          debt_amount: Number(orderData.debt_amount) || 0,
          status: orderData.status || 'Completed',
          payment_method: orderData.payment_method || 'Cash',
          notes: orderData.notes || '',
          created_at: orderData.created_at
        });

        const { data, error } = await this.supabase.from('orders').insert([orderPayload]).select();
        if (error) {
          console.error('Supabase createOrder insert error:', error);
          if (error.code === 'PGRST204' || (error.message && (error.message.includes('shipping_fee') || error.message.includes('delivery_method')))) {
            const fallbackPayload = { ...orderPayload };
            delete fallbackPayload.shipping_fee;
            delete fallbackPayload.delivery_method;
            const { data: fbData } = await this.supabase.from('orders').insert([fallbackPayload]).select();
            if (fbData && fbData.length > 0) {
              savedOrder = { ...savedOrder, ...fbData[0] };
            }
          }
        } else if (data && data.length > 0) {
          savedOrder = { ...savedOrder, ...data[0] };
        }
      } catch (err) {
        console.error('Error inserting order in Supabase:', err);
      }
    }

    if (!savedOrder.id) {
      savedOrder.id = 'o_' + Date.now();
    }

    // Build complete items list placing each shipping fee sub-item directly beneath its product item
    let finalItems = [];
    const shippingFeeVal = Number(orderData.shipping_fee) || 0;

    if (shippingFeeVal > 0) {
      const hasShippingSubItem = items.some(i => i.is_shipping_fee || (i.product_sku && (i.product_sku === 'PVC' || i.product_sku.startsWith('PVC-'))) || (i.product_name && (i.product_name.includes('Phí vận chuyển') || i.product_name.includes('vận chuyển -'))));
      if (hasShippingSubItem) {
        const prodItemsOnly = items.filter(i => !(i.is_shipping_fee || (i.product_sku && (i.product_sku === 'PVC' || i.product_sku.startsWith('PVC-'))) || (i.product_name && (i.product_name.includes('Phí vận chuyển') || i.product_name.includes('vận chuyển -')))));
        const shipItemsOnly = items.filter(i => i.is_shipping_fee || (i.product_sku && (i.product_sku === 'PVC' || i.product_sku.startsWith('PVC-'))) || (i.product_name && (i.product_name.includes('Phí vận chuyển') || i.product_name.includes('vận chuyển -'))));

        const usedShipIndices = new Set();
        prodItemsOnly.forEach((prodItem, idx) => {
          finalItems.push(prodItem);
          let matchedIdx = shipItemsOnly.findIndex((s, sIndex) => !usedShipIndices.has(sIndex) && (
            (s.product_id && (s.product_id === prodItem.product_id || s.product_id === prodItem.id)) ||
            (s.product_sku && prodItem.product_sku && (s.product_sku === `PVC-${prodItem.product_sku}` || s.product_sku === prodItem.product_sku)) ||
            (s.product_name && prodItem.product_name && s.product_name.includes(prodItem.product_name))
          ));
          if (matchedIdx === -1 && shipItemsOnly[idx] && !usedShipIndices.has(idx)) {
            matchedIdx = idx;
          }
          if (matchedIdx !== -1) {
            usedShipIndices.add(matchedIdx);
            finalItems.push(shipItemsOnly[matchedIdx]);
          }
        });
        shipItemsOnly.forEach((s, sIndex) => {
          if (!usedShipIndices.has(sIndex)) finalItems.push(s);
        });
      } else {
        const prodItemsOnly = items.filter(i => !(i.is_shipping_fee || (i.product_sku && (i.product_sku === 'PVC' || i.product_sku.startsWith('PVC-')))));
        if (prodItemsOnly.length > 0) {
          const cust = (db.customers || []).find(c => c.id === orderData.customer_id || c.name === orderData.customer_name) || {};
          const custDist = parseFloat(cust.distance_km || cust.distance || 5) || 5;
          const rules = db.shipping_rules || [];

          const itemCalcs = prodItemsOnly.map(item => {
            const prod = (db.products || []).find(p => p.id === item.product_id || p.sku === item.product_sku || p.name === item.product_name);
            const skuOrCat = item.product_sku || (prod ? (prod.sku || prod.category) : 'Khác') || 'Khác';
            const feeRes = (typeof calculateShippingFeeAdvanced === 'function')
              ? calculateShippingFeeAdvanced(skuOrCat, custDist, item.quantity, 0, rules)
              : { baseFee: 0, totalFee: 0 };
            return {
              item,
              prod,
              baseFee: feeRes.baseFee || 0,
              totalFee: feeRes.totalFee || 0
            };
          });

          const totalCalculated = itemCalcs.reduce((a, b) => a + b.totalFee, 0);

          let allocatedShipSum = 0;
          const calculatedShipRows = itemCalcs.map((calc) => {
            const item = calc.item;
            const prod = calc.prod;
            const qty = item.quantity || 1;
            let itemShipSubtotal = 0;
            if (totalCalculated > 0) {
              itemShipSubtotal = Math.round((calc.totalFee / totalCalculated) * shippingFeeVal);
            } else {
              itemShipSubtotal = Math.round(shippingFeeVal / prodItemsOnly.length);
            }
            allocatedShipSum += itemShipSubtotal;
            return {
              item,
              prod,
              qty,
              itemShipSubtotal
            };
          });

          // Adjust rounding difference
          if (calculatedShipRows.length > 0 && allocatedShipSum !== shippingFeeVal) {
            const diff = shippingFeeVal - allocatedShipSum;
            calculatedShipRows[calculatedShipRows.length - 1].itemShipSubtotal += diff;
          }

          calculatedShipRows.forEach(({ item, prod, qty, itemShipSubtotal }) => {
            finalItems.push(item);
            const unitPrice = qty > 0 ? Math.round(itemShipSubtotal / qty) : itemShipSubtotal;
            if (itemShipSubtotal > 0) {
              finalItems.push({
                product_id: item.product_id || (prod ? prod.id : null),
                product_sku: item.product_sku ? `PVC-${item.product_sku}` : 'PVC',
                product_name: `Phí vận chuyển - ${item.product_name || (prod ? prod.name : 'Sản phẩm')}`,
                unit: item.unit || (prod ? prod.unit : 'Thùng') || 'Thùng',
                location: item.location || (prod ? prod.location : 'Kho Tổng') || 'Kho Tổng',
                unit_price: unitPrice,
                quantity: qty,
                subtotal: itemShipSubtotal,
                is_shipping_fee: true
              });
            }
          });
        } else {
          finalItems = [...items];
        }
      }
    } else {
      finalItems = [...items];
    }

    savedOrder.items = finalItems;
    if (!db.orders) db.orders = [];
    db.orders.unshift(savedOrder);

    // Stock deduction & Inventory log & Supabase order_items insert
    for (const item of finalItems) {
      if (!item.is_shipping_fee) {
        const prodId = item.product_id;
        const prodSku = item.product_sku || item.sku;
        const prodName = item.product_name || item.name;
        const itemLoc = item.location || '';
        const qty = Number(item.quantity) || 1;

        // 1. Find and update product in local storage DB
        const localProd = db.products.find(p =>
          (prodId && p.id === prodId) ||
          (prodSku && itemLoc && p.sku === prodSku && (p.location || '').toLowerCase() === itemLoc.toLowerCase()) ||
          (prodSku && p.sku === prodSku) ||
          (prodName && p.name === prodName)
        );

        let oldStock = localProd ? (Number(localProd.stock_quantity) || 0) : 0;
        let newStock = Math.max(0, oldStock - qty);
        let fromLoc = itemLoc || (localProd ? localProd.location : 'Kho');
        let matchedProdName = prodName || (localProd ? localProd.name : 'Sản phẩm');

        if (localProd) {
          localProd.stock_quantity = newStock;
        }

        const txObj = {
          id: 'it_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          code: 'XK-' + Math.floor(1000 + Math.random() * 9000),
          type: 'StockOut',
          product_name: matchedProdName,
          quantity: qty,
          previous_stock: oldStock,
          new_stock: newStock,
          reason: `Xuất bán đơn hàng ${savedOrder.order_code} (Kho xuất: ${fromLoc} | Khách: ${savedOrder.customer_name})`,
          created_at: new Date().toISOString()
        };

        if (!db.inventory_transactions) db.inventory_transactions = [];
        db.inventory_transactions.unshift(txObj);

        // 2. In Supabase Live Mode, directly update stock_quantity in Supabase products table
        if (isLive) {
          try {
            let supaProd = null;
            if (isValidUUID(prodId)) {
              const { data: spData } = await this.supabase.from('products').select('*').eq('id', prodId).single();
              if (spData) supaProd = spData;
            } else if (localProd && isValidUUID(localProd.id)) {
              const { data: spData } = await this.supabase.from('products').select('*').eq('id', localProd.id).single();
              if (spData) supaProd = spData;
            }

            if (!supaProd && prodSku) {
              let q = this.supabase.from('products').select('*').eq('sku', prodSku);
              if (itemLoc) q = q.eq('location', itemLoc);
              const { data: spList } = await q;
              if (spList && spList.length > 0) supaProd = spList[0];
              else {
                const { data: spListFallback } = await this.supabase.from('products').select('*').eq('sku', prodSku);
                if (spListFallback && spListFallback.length > 0) supaProd = spListFallback[0];
              }
            }

            if (supaProd) {
              oldStock = Number(supaProd.stock_quantity) || 0;
              newStock = Math.max(0, oldStock - qty);
              fromLoc = supaProd.location || fromLoc;
              matchedProdName = supaProd.name || matchedProdName;

              await this.supabase.from('products').update({ stock_quantity: newStock }).eq('id', supaProd.id);
            } else if (prodSku) {
              if (itemLoc) {
                await this.supabase.from('products').update({ stock_quantity: newStock }).eq('sku', prodSku).eq('location', itemLoc);
              } else {
                await this.supabase.from('products').update({ stock_quantity: newStock }).eq('sku', prodSku);
              }
            }

            // Insert stock transaction into Supabase inventory_transactions
            const txPayload = prepareSupabasePayload({
              code: txObj.code,
              type: txObj.type,
              product_id: supaProd && isValidUUID(supaProd.id) ? supaProd.id : (isValidUUID(prodId) ? prodId : null),
              product_name: matchedProdName,
              quantity: qty,
              previous_stock: oldStock,
              new_stock: newStock,
              reason: `Xuất bán đơn hàng ${savedOrder.order_code} (Kho xuất: ${fromLoc} | Khách: ${savedOrder.customer_name})`,
              created_at: txObj.created_at
            });
            await this.supabase.from('inventory_transactions').insert([txPayload]);
          } catch (e) {
            console.error('Supabase inventory stock deduction error:', e);
          }
        }
      }

      // Order items insertion into Supabase (saving shipping fee sub-item to order_items table on Supabase as well!)
      if (isLive && isValidUUID(savedOrder.id)) {
        try {
          const itemPayload = prepareSupabasePayload({
            order_id: savedOrder.id,
            product_id: isValidUUID(item.product_id) ? item.product_id : null,
            product_name: item.product_name,
            unit_price: Number(item.unit_price) || 0,
            quantity: Number(item.quantity) || 1,
            subtotal: Number(item.subtotal) || 0
          });
          await this.supabase.from('order_items').insert([itemPayload]);
        } catch (e) {
          console.error('Supabase order_items insert error:', e);
        }
      }
    }

    // Record order into debts table for customer debt detail ledger & popup deduction
    let debtObj = null;
    const orderTotalVal = Number(savedOrder.final_amount || savedOrder.total_amount) || 0;

    if (orderTotalVal > 0) {
      const isFullyPaid = savedOrder.debt_amount === 0;
      const isPartial = savedOrder.paid_amount > 0 && savedOrder.debt_amount > 0;
      const initialStatus = isFullyPaid ? 'Paid' : (isPartial ? 'Partial' : 'Unpaid');
      const pmText = savedOrder.payment_method === 'Bank' ? 'Chuyển Khoản' : (savedOrder.payment_method === 'Cash' ? 'Tiền Mặt' : 'Ghi Nợ');

      debtObj = {
        id: 'd_' + Date.now(),
        code: 'CN-PT-' + Math.floor(100 + Math.random() * 900),
        customer_name: savedOrder.customer_name,
        order_id: savedOrder.id,
        order_code: savedOrder.order_code,
        items: finalItems,
        shipping_fee: shippingFeeVal,
        delivery_method: savedOrder.delivery_method || 'Delivery',
        type: 'Receivable',
        total_amount: orderTotalVal,
        remaining_amount: Number(savedOrder.debt_amount),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: initialStatus,
        notes: `Ghi nhận công nợ đơn ${savedOrder.order_code} (${pmText})`,
        created_at: savedOrder.created_at || new Date().toISOString()
      };

      if (!db.debts) db.debts = [];
      db.debts.unshift(debtObj);

      // Update customer balance in LocalStorage
      const cust = db.customers.find(c => c.name === savedOrder.customer_name || (savedOrder.customer_id && c.id === savedOrder.customer_id));
      if (cust) {
        cust.current_debt = (Number(cust.current_debt) || 0) + Number(savedOrder.debt_amount);
      }

      if (isLive) {
        try {
          const debtPayload = prepareSupabasePayload({
            code: debtObj.code,
            customer_id: (cust && isValidUUID(cust.id)) ? cust.id : (isValidUUID(savedOrder.customer_id) ? savedOrder.customer_id : null),
            customer_name: savedOrder.customer_name,
            order_id: isValidUUID(savedOrder.id) ? savedOrder.id : null,
            type: debtObj.type,
            total_amount: debtObj.total_amount,
            remaining_amount: debtObj.remaining_amount,
            due_date: debtObj.due_date,
            status: debtObj.status,
            notes: debtObj.notes,
            created_at: debtObj.created_at
          });

          const { data: insertedDebt, error: debtErr } = await this.supabase.from('debts').insert([debtPayload]).select();
          if (debtErr) {
            console.error('Supabase debt insert error:', debtErr);
          } else if (insertedDebt && insertedDebt.length > 0) {
            debtObj.id = insertedDebt[0].id;
          }

          // Update customer debt balance in Supabase
          if (cust && isValidUUID(cust.id)) {
            await this.supabase.from('customers').update({ current_debt: cust.current_debt }).eq('id', cust.id);
          } else {
            const { data: custData } = await this.supabase.from('customers').select('*').eq('name', savedOrder.customer_name);
            if (custData && custData.length > 0) {
              const targetCust = custData[0];
              const updatedDebt = (Number(targetCust.current_debt) || 0) + Number(savedOrder.debt_amount);
              await this.supabase.from('customers').update({ current_debt: updatedDebt }).eq('id', targetCust.id);
            }
          }
        } catch (e) {
          console.error('Supabase debt creation error:', e);
        }
      }
    }

    // Log upfront payment (Cash/Bank) in debt_payments if paid_amount > 0
    if (savedOrder.paid_amount > 0) {
      const orderCreatedAt = savedOrder.created_at ? new Date(savedOrder.created_at) : new Date();
      const paymentCreatedAt = new Date(orderCreatedAt.getTime() + 1000).toISOString();
      const pmText = savedOrder.payment_method === 'Bank' ? 'Chuyển Khoản' : 'Tiền Mặt';

      const upfrontDpObj = {
        id: 'dp_pos_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        debt_id: debtObj ? debtObj.id : null,
        customer_name: savedOrder.customer_name,
        payment_code: 'TT-POS-' + (savedOrder.order_code || Math.floor(100000 + Math.random() * 900000)),
        amount: Number(savedOrder.paid_amount),
        payment_method: savedOrder.payment_method === 'Debt' ? 'Bank' : (savedOrder.payment_method || 'Cash'),
        note: `Thanh toán (${pmText}) giảm trừ đơn hàng ${savedOrder.order_code}`,
        created_at: paymentCreatedAt
      };

      if (!db.debt_payments) db.debt_payments = [];
      db.debt_payments.unshift(upfrontDpObj);

      if (isLive) {
        try {
          const upfrontPayload = prepareSupabasePayload({
            debt_id: (debtObj && isValidUUID(debtObj.id)) ? debtObj.id : null,
            payment_code: upfrontDpObj.payment_code,
            amount: upfrontDpObj.amount,
            payment_method: upfrontDpObj.payment_method,
            note: upfrontDpObj.note,
            created_at: upfrontDpObj.created_at
          });
          await this.supabase.from('debt_payments').insert([upfrontPayload]);
        } catch (e) {
          console.error('Supabase upfront payment log error:', e);
        }
      }
    }

    this.saveLocalStorageDb(db);
    return savedOrder;
  }

  // DEBTS
  async getDebts() {
    if (this.isLiveMode) {
      const { data, error } = await this.supabase.from('debts').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return this.getLocalStorageDb().debts;
  }

  async clearAllDebts() {
    const db = this.getLocalStorageDb();
    db.debts = [];
    db.debt_payments = [];
    db.returns = [];
    db.inbound_orders = [];
    if (Array.isArray(db.customers)) {
      db.customers.forEach(c => { c.current_debt = 0; });
    }
    if (Array.isArray(db.orders)) {
      db.orders.forEach(o => {
        o.debt_amount = 0;
        if (o.final_amount !== undefined) {
          o.paid_amount = o.final_amount;
        }
        if (o.payment_method === 'Debt') {
          o.payment_method = 'Cash';
        }
      });
    }
    this.saveLocalStorageDb(db);

    if (this.isLiveMode && this.supabase) {
      try {
        await this.supabase.from('debts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await this.supabase.from('debt_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await this.supabase.from('returns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await this.supabase.from('inbound_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await this.supabase.from('customers').update({ current_debt: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
        await this.supabase.from('orders').update({ debt_amount: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.error('Supabase clearAllDebts error:', err);
      }
    }
  }

  async getDebtPayments(debtId) {
    if (this.isLiveMode) {
      const { data, error } = await this.supabase.from('debt_payments').select('*').eq('debt_id', debtId).order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    const db = this.getLocalStorageDb();
    return (db.debt_payments || []).filter(p => p.debt_id === debtId);
  }

  async addDebtPayment(debtId, amount, paymentMethod, note, customerName = null) {
    const db = this.getLocalStorageDb();
    const isLive = this.isLiveMode;

    if (!Array.isArray(db.debts)) db.debts = [];
    if (!Array.isArray(db.debt_payments)) db.debt_payments = [];
    if (!Array.isArray(db.customers)) db.customers = [];
    if (!Array.isArray(db.orders)) db.orders = [];
    if (!Array.isArray(db.inbound_orders)) db.inbound_orders = [];

    const normCustName = (customerName || '').trim().toLowerCase();

    // 1. Ensure any order debts exist in db.debts
    db.orders.forEach(order => {
      const debtAmt = Number(order.debt_amount);
      const oCustName = (order.customer_name || 'Khách Vãng Lai').trim();
      const code = order.order_code || order.id;
      const exists = db.debts.find(d =>
        (d.order_code && (String(d.order_code) === String(code) || String(d.order_code) === String(order.id))) ||
        (d.order_id && (String(d.order_id) === String(order.id) || String(d.order_id) === 'o_' + String(order.id))) ||
        (d.id && (String(d.id) === 'd_ord_' + String(order.id) || String(d.id) === String(order.id))) ||
        (d.notes && code && d.notes.includes(code))
      );
      if (!exists && !isNaN(debtAmt) && debtAmt > 0) {
        db.debts.push({
          id: 'd_ord_' + (order.id || Date.now()),
          code: 'CN-PT-' + (code ? String(code).replace(/^HD/i, '') : Math.floor(1000 + Math.random() * 9000)),
          customer_name: oCustName,
          customer_code: 'KH-DEBT',
          order_id: order.id,
          order_code: code,
          items: order.items || [],
          type: 'Receivable',
          total_amount: Number(order.final_amount || order.total_amount) || debtAmt,
          remaining_amount: debtAmt,
          due_date: order.created_at ? order.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          status: Number(order.paid_amount) > 0 ? 'Partial' : 'Unpaid',
          notes: `Ghi nhận công nợ đơn ${code}`,
          created_at: order.created_at || new Date().toISOString(),
          is_sales_order: true
        });
      }
    });

    // 2. Ensure any inbound debts exist in db.debts
    db.inbound_orders.forEach(inb => {
      const status = (inb.status || '').toLowerCase();
      if (status === 'received' || status === 'completed' || status === 'đã nhập kho') {
        const totalAmt = Number(inb.total_amount) || 0;
        const paidAmt = Number(inb.paid_amount) || 0;
        const remAmt = Math.max(0, totalAmt - paidAmt);
        const sName = (inb.supplier_name || 'Nhà Cung Cấp').trim();
        const code = inb.code || inb.id;
        const exists = db.debts.find(d =>
          (d.order_code && (String(d.order_code) === String(code) || String(d.order_code) === String(inb.id))) ||
          (d.id && (String(d.id) === String(inb.id) || String(d.id) === 'd_inb_' + String(inb.id))) ||
          (d.notes && code && d.notes.includes(code))
        );
        if (!exists && totalAmt > 0 && remAmt > 0) {
          db.debts.push({
            id: 'd_inb_' + (inb.id || Date.now()),
            code: 'CN-TRA-' + (code ? String(code).replace(/^PR/i, '') : Math.floor(1000 + Math.random() * 9000)),
            customer_name: sName,
            customer_code: 'NCC-DEBT',
            order_code: code,
            items: inb.items || [],
            type: 'Payable',
            total_amount: totalAmt,
            remaining_amount: remAmt,
            due_date: inb.expected_date || (inb.received_at ? inb.received_at.slice(0, 10) : (inb.created_at ? inb.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10))),
            status: paidAmt > 0 ? 'Partial' : 'Unpaid',
            notes: `Nợ tiền hàng nhập kho từ đơn Inbound ${code}`,
            created_at: inb.received_at || inb.created_at || new Date().toISOString(),
            is_inbound: true
          });
        }
      }
    });

    const isSupplierPayment = (customerName && (db.customers || []).some(c => (c.name || '').trim().toLowerCase() === normCustName && c.type === 'Supplier')) ||
      (customerName && (db.inbound_orders || []).some(i => (i.supplier_name || '').trim().toLowerCase() === normCustName)) ||
      (debtId !== 'AUTO' && debtId !== 'ALL' && (db.debts || []).some(d => String(d.id) === String(debtId) && d.type === 'Payable'));
    const codePrefix = isSupplierPayment ? 'TT-CHI-' : 'TT-THU-';

    // AUTO distribution across customer's open debt vouchers (FIFO)
    if ((debtId === 'AUTO' || debtId === 'ALL') && customerName) {
      let openDebts = [];
      if (isLive) {
        const { data } = await this.supabase.from('debts').select('*').eq('customer_name', customerName).gt('remaining_amount', 0);
        if (data && data.length > 0) {
          openDebts = data;
        } else {
          openDebts = (db.debts || []).filter(d => (d.customer_name || '').trim().toLowerCase() === normCustName && Number(d.remaining_amount) > 0);
        }
      } else {
        openDebts = (db.debts || []).filter(d => (d.customer_name || '').trim().toLowerCase() === normCustName && Number(d.remaining_amount) > 0);
      }
      openDebts.sort((a, b) => new Date(a.due_date || a.created_at || 0) - new Date(b.due_date || b.created_at || 0));

      let remainingPaymentToDistribute = amount;
      const paymentCode = codePrefix + Math.floor(100000 + Math.random() * 900000);

      for (const debt of openDebts) {
        if (remainingPaymentToDistribute <= 0) break;

        const currentRem = Number(debt.remaining_amount) || 0;
        const payForThisDebt = Math.min(currentRem, remainingPaymentToDistribute);
        const newRemaining = Math.max(0, currentRem - payForThisDebt);
        debt.remaining_amount = newRemaining;
        remainingPaymentToDistribute -= payForThisDebt;
        debt.status = newRemaining === 0 ? 'Paid' : 'Partial';

        const localDebt = (db.debts || []).find(d =>
          String(d.id) === String(debt.id) ||
          String(d.code) === String(debt.code) ||
          (d.order_code && String(d.order_code) === String(debt.order_code))
        );
        if (localDebt) {
          localDebt.remaining_amount = newRemaining;
          localDebt.status = debt.status;
        }

        // Sync corresponding sales order if applicable
        const orderMatch = (db.orders || []).find(o =>
          (debt.order_code && (String(o.order_code) === String(debt.order_code) || String(o.id) === String(debt.order_code))) ||
          (debt.order_id && (String(o.id) === String(debt.order_id) || 'o_' + String(o.id) === String(debt.order_id))) ||
          (debt.code && String(o.order_code) === String(debt.code))
        );
        if (orderMatch) {
          orderMatch.debt_amount = Math.max(0, (Number(orderMatch.debt_amount) || 0) - payForThisDebt);
          orderMatch.paid_amount = (Number(orderMatch.paid_amount) || 0) + payForThisDebt;
          if (orderMatch.debt_amount === 0) {
            orderMatch.payment_status = 'Paid';
          }
          if (isLive && isValidUUID(orderMatch.id)) {
            try {
              await this.supabase.from('orders').update({ debt_amount: orderMatch.debt_amount, paid_amount: orderMatch.paid_amount }).eq('id', orderMatch.id);
            } catch (oe) { }
          }
        }

        // Sync corresponding inbound order if applicable
        const inboundMatch = (db.inbound_orders || []).find(i =>
          (debt.order_code && (String(i.code) === String(debt.order_code) || String(i.id) === String(debt.order_code))) ||
          (debt.id && (String(debt.id) === String(i.id) || String(debt.id) === 'd_inb_' + String(i.id)))
        );
        if (inboundMatch) {
          inboundMatch.paid_amount = (Number(inboundMatch.paid_amount) || 0) + payForThisDebt;
          if (isLive && isValidUUID(inboundMatch.id)) {
            try {
              await this.supabase.from('inbound_orders').update({ paid_amount: inboundMatch.paid_amount }).eq('id', inboundMatch.id);
            } catch (ie) { }
          }
        }

        const dpObj = {
          id: 'dp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          debt_id: debt.id,
          customer_name: customerName,
          payment_code: paymentCode,
          amount: payForThisDebt,
          payment_method: paymentMethod || 'Bank',
          note: note || (isSupplierPayment ? `Chi trả công nợ NCC (${debt.code || debt.order_code || ''})` : `Thu tiền công nợ KH (${debt.code || debt.order_code || ''})`),
          created_at: new Date().toISOString()
        };

        if (!db.debt_payments) db.debt_payments = [];
        db.debt_payments.unshift(dpObj);

        if (isLive) {
          try {
            if (isValidUUID(debt.id)) {
              await this.supabase.from('debts').update({ remaining_amount: newRemaining, status: debt.status }).eq('id', debt.id);
            }
            const dpPayload = prepareSupabasePayload({
              debt_id: isValidUUID(debt.id) ? debt.id : null,
              customer_name: customerName,
              payment_code: dpObj.payment_code,
              amount: dpObj.amount,
              payment_method: dpObj.payment_method,
              note: dpObj.note,
              created_at: dpObj.created_at
            });
            await this.supabase.from('debt_payments').insert([dpPayload]);
          } catch (e) {
            console.error('Supabase addDebtPayment item error:', e);
          }
        }
      }

      const cust = db.customers.find(c => (c.name || '').trim().toLowerCase() === normCustName);
      if (cust) {
        cust.current_debt = Math.max(0, (Number(cust.current_debt) || 0) - amount);
        if (isLive && isValidUUID(cust.id)) {
          await this.supabase.from('customers').update({ current_debt: cust.current_debt }).eq('id', cust.id);
        }
      }

      this.saveLocalStorageDb(db);
      return;
    }

    // Specific debt voucher payment (Full or Partial)
    let debt = (db.debts || []).find(d =>
      String(d.id) === String(debtId) ||
      String(d.code) === String(debtId) ||
      (d.order_code && String(d.order_code) === String(debtId)) ||
      (d.order_id && String(d.order_id) === String(debtId)) ||
      (debtId && String(debtId).startsWith('d_ord_') && String(d.order_id) === String(debtId).replace('d_ord_', '')) ||
      (debtId && String(debtId).startsWith('d_inb_') && String(d.id) === String(debtId).replace('d_inb_', ''))
    );
    let supaDebt = null;

    if (isLive && isValidUUID(debtId)) {
      const { data } = await this.supabase.from('debts').select('*').eq('id', debtId).single();
      if (data) supaDebt = data;
    }

    // If debt is not in db.debts, create it from db.orders or db.inbound_orders
    if (!debt && !supaDebt) {
      const matchedOrder = (db.orders || []).find(o =>
        String(o.id) === String(debtId) ||
        String(o.order_code) === String(debtId) ||
        ('d_ord_' + String(o.id)) === String(debtId)
      );
      if (matchedOrder) {
        const dAmt = Number(matchedOrder.debt_amount) || Number(matchedOrder.final_amount) || amount;
        debt = {
          id: 'd_ord_' + matchedOrder.id,
          code: 'CN-PT-' + (matchedOrder.order_code ? String(matchedOrder.order_code).replace(/^HD/i, '') : Math.floor(1000 + Math.random() * 9000)),
          customer_name: matchedOrder.customer_name || customerName,
          order_id: matchedOrder.id,
          order_code: matchedOrder.order_code,
          type: 'Receivable',
          total_amount: Number(matchedOrder.final_amount || matchedOrder.total_amount) || dAmt,
          remaining_amount: dAmt,
          status: 'Partial',
          created_at: matchedOrder.created_at || new Date().toISOString()
        };
        db.debts.push(debt);
      } else {
        const matchedInb = (db.inbound_orders || []).find(i =>
          String(i.id) === String(debtId) ||
          String(i.code) === String(debtId) ||
          ('d_inb_' + String(i.id)) === String(debtId)
        );
        if (matchedInb) {
          const totAmt = Number(matchedInb.total_amount) || 0;
          const pAmt = Number(matchedInb.paid_amount) || 0;
          debt = {
            id: 'd_inb_' + matchedInb.id,
            code: 'CN-TRA-' + (matchedInb.code ? String(matchedInb.code).replace(/^PR/i, '') : Math.floor(1000 + Math.random() * 9000)),
            customer_name: matchedInb.supplier_name || customerName,
            order_code: matchedInb.code,
            type: 'Payable',
            total_amount: totAmt,
            remaining_amount: Math.max(0, totAmt - pAmt),
            status: 'Partial',
            created_at: matchedInb.received_at || matchedInb.created_at || new Date().toISOString()
          };
          db.debts.push(debt);
        }
      }
    }

    const currentRemaining = supaDebt ? Number(supaDebt.remaining_amount) : (debt ? Number(debt.remaining_amount) : amount);
    const payForThisDebt = Math.min(currentRemaining, amount);
    const newRemaining = Math.max(0, currentRemaining - payForThisDebt);
    const status = newRemaining === 0 ? 'Paid' : 'Partial';

    if (debt) {
      debt.remaining_amount = newRemaining;
      debt.status = status;
    }

    // Sync corresponding sales order if applicable
    const orderMatch = (db.orders || []).find(o =>
      (debt && debt.order_code && (String(o.order_code) === String(debt.order_code) || String(o.id) === String(debt.order_code))) ||
      (debt && debt.order_id && (String(o.id) === String(debt.order_id) || 'o_' + String(o.id) === String(debt.order_id))) ||
      (debt && debt.code && String(o.order_code) === String(debt.code)) ||
      (debtId && (String(o.id) === String(debtId) || String(o.order_code) === String(debtId) || ('d_ord_' + String(o.id)) === String(debtId)))
    );
    if (orderMatch) {
      orderMatch.debt_amount = Math.max(0, (Number(orderMatch.debt_amount) || 0) - payForThisDebt);
      orderMatch.paid_amount = (Number(orderMatch.paid_amount) || 0) + payForThisDebt;
      if (orderMatch.debt_amount === 0) {
        orderMatch.payment_status = 'Paid';
      }
      if (isLive && isValidUUID(orderMatch.id)) {
        try {
          await this.supabase.from('orders').update({ debt_amount: orderMatch.debt_amount, paid_amount: orderMatch.paid_amount }).eq('id', orderMatch.id);
        } catch (oe) { }
      }
    }

    // Sync corresponding inbound order if applicable
    const inboundMatch = (db.inbound_orders || []).find(i =>
      (debt && debt.order_code && (String(i.code) === String(debt.order_code) || String(i.id) === String(debt.order_code))) ||
      (debt && debt.id && (String(debt.id) === String(i.id) || String(debt.id) === 'd_inb_' + String(i.id))) ||
      (debtId && (String(i.id) === String(debtId) || String(i.code) === String(debtId) || ('d_inb_' + String(i.id)) === String(debtId)))
    );
    if (inboundMatch) {
      inboundMatch.paid_amount = (Number(inboundMatch.paid_amount) || 0) + payForThisDebt;
      if (isLive && isValidUUID(inboundMatch.id)) {
        try {
          await this.supabase.from('inbound_orders').update({ paid_amount: inboundMatch.paid_amount }).eq('id', inboundMatch.id);
        } catch (ie) { }
      }
    }

    const targetCustomerName = (debt && debt.customer_name) ? debt.customer_name : customerName;
    const dpObj = {
      id: 'dp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      debt_id: debt ? debt.id : debtId,
      customer_name: targetCustomerName,
      payment_code: codePrefix + Math.floor(100000 + Math.random() * 900000),
      amount: payForThisDebt,
      payment_method: paymentMethod || 'Bank',
      note: note || (isSupplierPayment ? `Chi trả công nợ nhà cung cấp (${debt ? debt.code : ''})` : `Thu tiền công nợ khách hàng (${debt ? debt.code : ''})`),
      created_at: new Date().toISOString()
    };

    if (!db.debt_payments) db.debt_payments = [];
    db.debt_payments.unshift(dpObj);

    const cust = (db.customers || []).find(c => (c.name || '').trim().toLowerCase() === (targetCustomerName || '').trim().toLowerCase());
    if (cust) {
      cust.current_debt = Math.max(0, (Number(cust.current_debt) || 0) - payForThisDebt);
      if (isLive && isValidUUID(cust.id)) {
        await this.supabase.from('customers').update({ current_debt: cust.current_debt }).eq('id', cust.id);
      }
    }

    if (isLive) {
      try {
        if (isValidUUID(debtId)) {
          await this.supabase.from('debts').update({ remaining_amount: newRemaining, status: status }).eq('id', debtId);
        }
        const dpPayload = prepareSupabasePayload({
          debt_id: isValidUUID(debtId) ? debtId : null,
          customer_name: targetCustomerName,
          payment_code: dpObj.payment_code,
          amount: dpObj.amount,
          payment_method: dpObj.payment_method,
          note: dpObj.note,
          created_at: dpObj.created_at
        });
        await this.supabase.from('debt_payments').insert([dpPayload]);
      } catch (e) {
        console.error('Supabase addDebtPayment error:', e);
      }
    }

    this.saveLocalStorageDb(db);
  }

  // RETURNS / TRẢ HÀNG
  async getReturns() {
    const localReturns = this.getLocalStorageDb().returns || [];
    if (this.isLiveMode) {
      const { data, error } = await this.supabase.from('returns').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(r => {
          const matchedLocal = localReturns.find(lr => lr.id === r.id || lr.return_code === r.return_code);
          if (matchedLocal && matchedLocal.items && (!r.items || r.items.length === 0)) {
            r.items = matchedLocal.items;
          }
          return r;
        });
      }
    }
    return localReturns;
  }

  // CUSTOMER / SUPPLIER COMPLETE HISTORY (360° LEDGER)
  async getCustomerHistory(customerName) {
    const orders = (await this.getOrders()).filter(o => o.customer_name === customerName);
    const inbounds = (await this.getInboundOrders()).filter(i => i.supplier_name === customerName);
    const returns = (await this.getReturns()).filter(r => r.customer_name === customerName);
    const debts = (await this.getDebts()).filter(d => d.customer_name === customerName);

    let payments = [];
    if (this.isLiveMode) {
      const debtIds = debts.map(d => d.id).filter(id => isValidUUID(id));
      if (debtIds.length > 0) {
        const { data } = await this.supabase.from('debt_payments').select('*').in('debt_id', debtIds);
        if (data) payments = data;
      }
    }

    const db = this.getLocalStorageDb();
    const customerDebtIds = debts.map(d => d.id);
    const localPayments = (db.debt_payments || []).filter(p => customerDebtIds.includes(p.debt_id) || p.customer_name === customerName);

    // Combine and remove duplicates by payment_code or id
    const paymentMap = new Map();
    [...payments, ...localPayments].forEach(p => {
      const key = (p.payment_code && p.payment_code.trim()) ? p.payment_code.trim() : p.id;
      if (key && !paymentMap.has(key)) {
        paymentMap.set(key, p);
      }
    });

    return {
      orders,
      inbounds,
      returns,
      debts,
      payments: Array.from(paymentMap.values())
    };
  }

  async createSalesReturn(returnData, itemsToReturn) {
    returnData.id = returnData.id || 'ret_' + Date.now();
    returnData.return_code = returnData.return_code || ('TH' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + Math.floor(10 + Math.random() * 90));
    returnData.created_at = new Date().toISOString();
    returnData.items = itemsToReturn || [];

    const db = this.getLocalStorageDb();
    if (!db.returns) db.returns = [];
    db.returns.unshift(returnData);

    // 1. Restore Stock in Products
    for (const item of itemsToReturn) {
      const prodId = item.product_id;
      const prodSku = item.product_sku || item.sku;
      const prodName = item.product_name || item.name;
      const qty = Number(item.quantity) || 1;

      // Update LocalStorage product stock
      const localProd = db.products.find(p =>
        (prodId && p.id === prodId) ||
        (prodSku && p.sku === prodSku) ||
        (prodName && p.name === prodName)
      );

      let prevStock = localProd ? (Number(localProd.stock_quantity) || 0) : 0;
      let nextStock = prevStock + qty;
      let targetName = prodName || (localProd ? localProd.name : 'Sản phẩm');

      if (localProd) {
        localProd.stock_quantity = nextStock;
      }

      const txObj = {
        id: 'it_' + Date.now() + '_' + Math.random(),
        code: 'NK-TH-' + Math.floor(1000 + Math.random() * 9000),
        type: 'StockIn',
        product_name: targetName,
        quantity: qty,
        previous_stock: prevStock,
        new_stock: nextStock,
        reason: `Khách hàng trả hàng đơn ${returnData.order_code} (${returnData.reason || 'Khách trả hàng'})`,
        created_at: new Date().toISOString()
      };

      if (!db.inventory_transactions) db.inventory_transactions = [];
      db.inventory_transactions.unshift(txObj);

      // In Supabase Live Mode, restore stock in Supabase products table
      if (this.isLiveMode) {
        try {
          let supaProd = null;
          if (isValidUUID(prodId)) {
            const { data: spData } = await this.supabase.from('products').select('*').eq('id', prodId).single();
            if (spData) supaProd = spData;
          } else if (localProd && isValidUUID(localProd.id)) {
            const { data: spData } = await this.supabase.from('products').select('*').eq('id', localProd.id).single();
            if (spData) supaProd = spData;
          }

          if (!supaProd && prodSku) {
            const { data: spList } = await this.supabase.from('products').select('*').eq('sku', prodSku);
            if (spList && spList.length > 0) supaProd = spList[0];
          }
          if (!supaProd && prodName) {
            const { data: spList } = await this.supabase.from('products').select('*').eq('name', prodName);
            if (spList && spList.length > 0) supaProd = spList[0];
          }

          if (supaProd) {
            prevStock = Number(supaProd.stock_quantity) || 0;
            nextStock = prevStock + qty;
            targetName = supaProd.name || targetName;

            await this.supabase.from('products').update({ stock_quantity: nextStock }).eq('id', supaProd.id);
          } else if (prodSku) {
            await this.supabase.from('products').update({ stock_quantity: nextStock }).eq('sku', prodSku);
          }

          // Insert stock transaction into Supabase inventory_transactions
          const txPayload = prepareSupabasePayload({
            code: txObj.code,
            type: txObj.type,
            product_id: supaProd && isValidUUID(supaProd.id) ? supaProd.id : (isValidUUID(prodId) ? prodId : null),
            product_name: targetName,
            quantity: qty,
            previous_stock: prevStock,
            new_stock: nextStock,
            reason: txObj.reason,
            created_at: txObj.created_at
          });
          await this.supabase.from('inventory_transactions').insert([txPayload]);
        } catch (e) {
          console.error('Supabase stock return update error:', e);
        }
      }
    }

    // 2. Adjust Debt / Customer balance & record in Debt Payment History
    if (returnData.total_refund > 0) {
      const cust = db.customers.find(c => c.name === returnData.customer_name);

      // Find open receivable debts for this customer
      const customerDebts = (db.debts || []).filter(d => d.customer_name === returnData.customer_name && d.type === 'Receivable');
      let targetDebt = customerDebts.find(d => d.remaining_amount > 0);

      const openDebts = customerDebts
        .filter(d => d.remaining_amount > 0)
        .sort((a, b) => new Date(a.due_date || a.created_at || 0) - new Date(b.due_date || b.created_at || 0));

      if (returnData.refund_method === 'DebtDeduction' || openDebts.length > 0) {
        let remainingRefundToDistribute = returnData.total_refund;
        for (const debt of openDebts) {
          if (remainingRefundToDistribute <= 0) break;
          const deductAmount = Math.min(debt.remaining_amount, remainingRefundToDistribute);
          debt.remaining_amount -= deductAmount;
          remainingRefundToDistribute -= deductAmount;
          debt.status = debt.remaining_amount === 0 ? 'Paid' : 'Partial';

          if (this.isLiveMode && isValidUUID(debt.id)) {
            await this.supabase.from('debts').update({ remaining_amount: debt.remaining_amount, status: debt.status }).eq('id', debt.id);
          }
        }

        if (cust) {
          cust.current_debt = Math.max(0, (cust.current_debt || 0) - returnData.total_refund);
          if (this.isLiveMode && isValidUUID(cust.id)) {
            await this.supabase.from('customers').update({ current_debt: cust.current_debt }).eq('id', cust.id);
          }
        }
      }

      const formattedReturnCode = (returnData.return_code && returnData.return_code.startsWith('TH'))
        ? returnData.return_code
        : ('TH-' + (returnData.return_code || Math.floor(100000 + Math.random() * 900000)));

      // Record in debt_payments history for debt detail ledger
      const dpRetObj = {
        id: 'dp_ret_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        debt_id: targetDebt ? targetDebt.id : (customerDebts[0] ? customerDebts[0].id : 'd_ret_' + Date.now()),
        customer_name: returnData.customer_name,
        payment_code: formattedReturnCode,
        amount: returnData.total_refund,
        payment_method: 'DebtDeduction',
        note: `Giảm trừ công nợ phiếu trả hàng (${formattedReturnCode}): ${returnData.reason || 'Khách đổi trả hàng'}`,
        created_at: returnData.created_at || new Date().toISOString()
      };

      if (!db.debt_payments) db.debt_payments = [];
      db.debt_payments.unshift(dpRetObj);

      if (this.isLiveMode) {
        try {
          const dpPayload = prepareSupabasePayload({
            debt_id: isValidUUID(dpRetObj.debt_id) ? dpRetObj.debt_id : null,
            payment_code: dpRetObj.payment_code,
            amount: dpRetObj.amount,
            payment_method: dpRetObj.payment_method,
            note: dpRetObj.note,
            created_at: dpRetObj.created_at
          });
          await this.supabase.from('debt_payments').insert([dpPayload]);

          const retPayload = prepareSupabasePayload({
            return_code: returnData.return_code,
            order_code: returnData.order_code,
            customer_name: returnData.customer_name,
            total_refund: returnData.total_refund,
            refund_method: returnData.refund_method,
            reason: returnData.reason,
            created_at: returnData.created_at
          });
          await this.supabase.from('returns').insert([retPayload]);
        } catch (e) {
          console.error('Supabase return & debt deduction insert error:', e);
        }
      }
    }

    this.saveLocalStorageDb(db);
    return returnData;
  }

  // INVENTORY TRANSACTIONS
  async getInventoryTransactions() {
    if (this.isLiveMode) {
      const { data, error } = await this.supabase.from('inventory_transactions').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return this.getLocalStorageDb().inventory_transactions;
  }

  async recordStockTransaction(productId, type, qty, reason) {
    let prev = 0;
    let next = 0;
    let prodName = '';
    const numQty = typeof parseQuantity === 'function' ? parseQuantity(qty) : (parseFloat(qty) || 0);

    const db = this.getLocalStorageDb();
    let prod = db.products.find(p => p.id === productId);

    if (this.isLiveMode) {
      try {
        const { data: supaProd } = await this.supabase.from('products').select('*').eq('id', productId).single();
        if (supaProd) {
          prev = Number(supaProd.stock_quantity) || 0;
          next = type === 'StockIn' ? Math.round((prev + numQty) * 100) / 100 : Math.max(0, Math.round((prev - numQty) * 100) / 100);
          prodName = supaProd.name;

          await this.supabase.from('products').update({ stock_quantity: next }).eq('id', productId);

          const txPayload = prepareSupabasePayload({
            code: (type === 'StockIn' ? 'NK-' : 'XK-') + Math.floor(1000 + Math.random() * 9000),
            type: type,
            product_id: productId,
            product_name: prodName,
            quantity: numQty,
            previous_stock: prev,
            new_stock: next,
            reason: reason || (type === 'StockIn' ? 'Nhập bổ sung kho' : 'Xuất hủy / Chuyển kho'),
            created_at: new Date().toISOString()
          });
          await this.supabase.from('inventory_transactions').insert([txPayload]);
        }
      } catch (err) {
        console.error('Error recording stock transaction in Supabase:', err);
      }
    }

    if (prod) {
      prev = Number(prod.stock_quantity) || 0;
      next = type === 'StockIn' ? Math.round((prev + numQty) * 100) / 100 : Math.max(0, Math.round((prev - numQty) * 100) / 100);
      prod.stock_quantity = next;
      prodName = prodName || prod.name;
    }

    if (prodName) {
      if (!db.inventory_transactions) db.inventory_transactions = [];
      db.inventory_transactions.unshift({
        id: 'it_' + Date.now(),
        code: (type === 'StockIn' ? 'NK-' : 'XK-') + Math.floor(1000 + Math.random() * 9000),
        type: type,
        product_name: prodName,
        quantity: numQty,
        previous_stock: prev,
        new_stock: next,
        reason: reason || (type === 'StockIn' ? 'Nhập bổ sung kho' : 'Xuất hủy / Chuyển kho'),
        created_at: new Date().toISOString()
      });

      this.saveLocalStorageDb(db);
    }
  }

  // INBOUND ORDERS / PR MUA HÀNG
  async getInboundOrders() {
    let orders = [];
    if (this.isLiveMode) {
      try {
        const { data, error } = await this.supabase.from('inbound_orders').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          orders = data.map(row => {
            let parsedItems = row.items;
            if (typeof parsedItems === 'string') {
              try { parsedItems = JSON.parse(parsedItems); } catch (e) { parsedItems = []; }
            }
            if (!Array.isArray(parsedItems)) parsedItems = [];

            const localMatch = (this.getLocalStorageDb().inbound_orders || []).find(l => (l.code && l.code === row.code) || (l.id && l.id === row.id));
            const wh = row.warehouse || localMatch?.warehouse || '';

            return {
              ...row,
              warehouse: wh,
              items: parsedItems
            };
          });
        }
        if (error && error.code === '42P01') {
          console.warn('Bảng inbound_orders chưa tồn tại trên Supabase Database.');
        }
      } catch (err) {
        console.error('Error fetching inbound_orders from Supabase:', err);
      }
    }

    const localData = (this.getLocalStorageDb().inbound_orders || []).map(row => {
      let parsedItems = row.items;
      if (typeof parsedItems === 'string') {
        try { parsedItems = JSON.parse(parsedItems); } catch (e) { parsedItems = []; }
      }
      return { ...row, items: Array.isArray(parsedItems) ? parsedItems : [] };
    });

    // Merge Supabase orders with any local orders not yet synced
    const orderMap = new Map();
    orders.forEach(o => orderMap.set(o.code || o.id, o));
    localData.forEach(o => {
      const key = o.code || o.id;
      if (!orderMap.has(key)) {
        orderMap.set(key, o);
      }
    });

    return Array.from(orderMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  async createInboundOrder(orderData, items) {
    const isLive = this.isLiveMode;
    const db = this.getLocalStorageDb();

    orderData.id = orderData.id || 'inb_' + Date.now();
    orderData.code = orderData.code || ('PR' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000));
    orderData.created_at = orderData.created_at || new Date().toISOString();
    orderData.status = orderData.status || 'Pending';
    orderData.created_by = orderData.created_by || 'Kỹ thuật';
    orderData.items = items || [];
    orderData.total_amount = (items || []).reduce((sum, it) => sum + (Number(it.subtotal) || (Number(it.expected_qty || 0) * Number(it.cost_price || 0))), 0);

    let savedOrder = { ...orderData };

    if (isLive) {
      try {
        let supplierUuid = null;
        if (isValidUUID(orderData.supplier_id)) {
          supplierUuid = orderData.supplier_id;
        }

        let sanitizedExpDate = null;
        if (orderData.expected_date && typeof orderData.expected_date === 'string' && orderData.expected_date.trim()) {
          const dStr = orderData.expected_date.trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
            sanitizedExpDate = dStr;
          } else {
            try {
              const d = new Date(dStr);
              if (!isNaN(d.getTime())) {
                sanitizedExpDate = d.toISOString().slice(0, 10);
              }
            } catch (e) { }
          }
        }

        const payload = prepareSupabasePayload({
          code: orderData.code,
          supplier_id: supplierUuid,
          supplier_name: orderData.supplier_name,
          warehouse: orderData.warehouse || '',
          created_by: orderData.created_by,
          expected_date: sanitizedExpDate,
          status: orderData.status,
          total_amount: Number(orderData.total_amount) || 0,
          notes: orderData.notes || '',
          items: orderData.items,
          created_at: orderData.created_at
        });

        let { data, error } = await this.supabase.from('inbound_orders').insert([payload]).select();

        if (error) {
          console.warn('Supabase createInboundOrder initial insert warning:', error);

          // Fallback 1: Column 'warehouse' missing on Supabase table
          if (error.code === 'PGRST204' || (error.message && error.message.includes('warehouse'))) {
            delete payload.warehouse;
            const res = await this.supabase.from('inbound_orders').insert([payload]).select();
            data = res.data;
            error = res.error;
          }

          // Fallback 2: FK constraint violation on supplier_id
          if (error && (error.code === '23503' || (error.message && error.message.includes('supplier_id')))) {
            delete payload.supplier_id;
            const res = await this.supabase.from('inbound_orders').insert([payload]).select();
            data = res.data;
            error = res.error;
          }

          // Fallback 3: Items column format mismatch (e.g. TEXT vs JSONB)
          if (error && (error.message && (error.message.includes('items') || error.code === '42804'))) {
            payload.items = JSON.stringify(orderData.items);
            const res = await this.supabase.from('inbound_orders').insert([payload]).select();
            data = res.data;
            error = res.error;
          }

          // Fallback 4: Duplicate code -> generate new unique code
          if (error && (error.code === '23505' || (error.message && error.message.toLowerCase().includes('unique')))) {
            payload.code = 'PR' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Date.now().toString().slice(-4) + Math.floor(10 + Math.random() * 90);
            savedOrder.code = payload.code;
            const res = await this.supabase.from('inbound_orders').insert([payload]).select();
            data = res.data;
            error = res.error;
          }

          // Fallback 5: Plain insert without select()
          if (error) {
            const { error: plainErr } = await this.supabase.from('inbound_orders').insert([payload]);
            if (plainErr) {
              console.warn('Supabase plain insert fallback also errored:', plainErr);
            }
          }
        }

        if (data && data.length > 0) {
          savedOrder = {
            ...savedOrder,
            ...data[0],
            warehouse: data[0].warehouse || orderData.warehouse || savedOrder.warehouse
          };
        }
      } catch (e) {
        console.error('Supabase createInboundOrder catch error:', e);
      }
    }

    if (!db.inbound_orders) db.inbound_orders = [];
    const existingIdx = db.inbound_orders.findIndex(o => o.id === savedOrder.id || o.code === savedOrder.code);
    if (existingIdx !== -1) {
      db.inbound_orders[existingIdx] = savedOrder;
    } else {
      db.inbound_orders.unshift(savedOrder);
    }

    this.saveLocalStorageDb(db);
    return savedOrder;
  }

  async fulfillInboundOrder(inboundId, itemsWithReceivedQty, receivedBy, notes, customWarehouse) {
    const isLive = this.isLiveMode;
    const db = this.getLocalStorageDb();

    let inbound = (db.inbound_orders || []).find(o => o.id === inboundId || o.code === inboundId);
    if (!inbound && isLive) {
      try {
        let query = this.supabase.from('inbound_orders').select('*');
        if (isValidUUID(inboundId)) {
          query = query.eq('id', inboundId);
        } else {
          query = query.eq('code', inboundId);
        }
        const { data } = await query;
        if (data && data.length > 0) inbound = data[0];
      } catch (e) {
        console.error('Supabase fetch inbound before fulfill error:', e);
      }
    }

    if (!inbound) throw new Error('Không tìm thấy phiếu Inbound!');

    if (customWarehouse) {
      inbound.warehouse = customWarehouse;
    }
    inbound.status = 'Received';
    inbound.received_by = receivedBy || 'Kho';
    inbound.received_at = new Date().toISOString();
    if (notes) inbound.notes = (inbound.notes ? inbound.notes + ' | ' : '') + notes;

    let grandTotal = 0;

    // Fetch live products list to ensure we have all products (Supabase + LocalStorage)
    const allProducts = await this.getProducts();

    // Update items with actual received quantities
    const updatedItems = [];
    for (const item of (itemsWithReceivedQty || inbound.items)) {
      const expQty = Number(item.expected_qty) >= 0 ? Number(item.expected_qty) : (Number(item.received_qty) || 1);
      const recQty = Number(item.received_qty) >= 0 ? Number(item.received_qty) : expQty;
      const cost = Number(item.cost_price) || 0;
      const subtotal = recQty * cost;
      grandTotal += subtotal;

      const targetWh = (inbound.warehouse || '').trim();

      // 1. Check if product already exists in the TARGET warehouse
      let targetProd = allProducts.find(p =>
        (p.id === item.product_id || (p.sku && p.sku === item.product_sku)) &&
        ((p.location || '').trim().toLowerCase() === targetWh.toLowerCase())
      );

      // 2. If not found in target warehouse, find template product by SKU, ID, or name from any warehouse
      const masterProd = allProducts.find(p => p.id === item.product_id || (p.sku && p.sku === item.product_sku) || (p.name && p.name === item.product_name));

      let prevStock = 0;
      let newStock = recQty;
      let targetProdId = null;
      let prodName = item.product_name;

      if (targetProd) {
        // === Case 1: Đã có sản phẩm này ở đúng kho này -> Cộng dồn số lượng ===
        prevStock = Number(targetProd.stock_quantity) || 0;
        newStock = prevStock + recQty;
        targetProd.stock_quantity = newStock;
        targetProdId = targetProd.id;
        prodName = targetProd.name || item.product_name;

        // Update local db.products
        const localProd = (db.products || []).find(p => p.id === targetProd.id);
        if (localProd) localProd.stock_quantity = newStock;

        if (isLive) {
          try {
            if (isValidUUID(targetProd.id)) {
              await this.supabase.from('products').update({ stock_quantity: newStock }).eq('id', targetProd.id);
            } else if (targetProd.sku) {
              await this.supabase.from('products').update({ stock_quantity: newStock }).eq('sku', targetProd.sku).eq('location', targetWh);
            }
          } catch (upErr) {
            console.error('Supabase update product error:', upErr);
          }
        }
      } else if (masterProd) {
        // === Case 2: Sản phẩm thuộc kho khác -> TẠO DÒNG MỚI CHO KHO NÀY! ===
        prevStock = 0;
        newStock = recQty;
        prodName = masterProd.name || item.product_name;

        const newProdRow = {
          id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          sku: masterProd.sku || item.product_sku,
          name: masterProd.name || item.product_name,
          supplier_id: masterProd.supplier_id || inbound.supplier_id || null,
          supplier_name: masterProd.supplier_name || inbound.supplier_name || '',
          category: masterProd.category || 'Khác',
          unit: masterProd.unit || item.unit || 'Cái',
          cost_price: Number(item.cost_price) || Number(masterProd.cost_price) || 0,
          selling_price: Number(masterProd.selling_price) || (Number(item.cost_price) * 1.2),
          stock_quantity: newStock,
          min_stock_alert: masterProd.min_stock_alert || 5,
          location: targetWh || masterProd.location || 'Kho Tổng'
        };

        if (!db.products) db.products = [];
        db.products.unshift(newProdRow);
        allProducts.push(newProdRow);
        targetProdId = newProdRow.id;

        if (isLive) {
          try {
            const payload = prepareSupabasePayload(newProdRow);
            if (payload.supplier_id && !isValidUUID(payload.supplier_id)) {
              delete payload.supplier_id;
            }
            const { data: insData, error: insErr } = await this.supabase.from('products').insert([payload]).select();
            if (insErr) {
              console.warn('Supabase insert new warehouse product row error:', insErr);
              if (insErr.code === '23505' || (insErr.message && insErr.message.includes('unique'))) {
                // If unique constraint on SKU still active on Postgres, update master product location
                await this.supabase.from('products').update({ stock_quantity: (masterProd.stock_quantity || 0) + recQty, location: targetWh }).eq('id', masterProd.id);
              }
            } else if (insData && insData.length > 0) {
              newProdRow.id = insData[0].id;
              targetProdId = insData[0].id;
            }
          } catch (e) {
            console.error('Supabase insert new warehouse row catch error:', e);
          }
        }
      } else {
        // === Case 3: Sản phẩm hoàn toàn mới -> Tạo mới ===
        prevStock = 0;
        newStock = recQty;
        const brandNewProd = {
          id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          sku: item.product_sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
          name: item.product_name,
          supplier_id: inbound.supplier_id || null,
          supplier_name: inbound.supplier_name || '',
          category: 'Khác',
          unit: item.unit || 'Cái',
          cost_price: Number(item.cost_price) || 0,
          selling_price: Number(item.cost_price) * 1.25,
          stock_quantity: newStock,
          min_stock_alert: 5,
          location: targetWh || 'Kho Tổng'
        };
        if (!db.products) db.products = [];
        db.products.unshift(brandNewProd);
        allProducts.push(brandNewProd);
        targetProdId = brandNewProd.id;

        if (isLive) {
          try {
            const payload = prepareSupabasePayload(brandNewProd);
            if (payload.supplier_id && !isValidUUID(payload.supplier_id)) delete payload.supplier_id;
            const { data: insData } = await this.supabase.from('products').insert([payload]).select();
            if (insData && insData.length > 0) brandNewProd.id = insData[0].id;
          } catch (e) { }
        }
      }

      // Record stock transaction in Thẻ Kho
      const displayWh = targetWh || 'Chưa phân kho';
      const txObj = {
        id: 'it_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        code: 'NK-' + inbound.code + '-' + (Math.floor(100 + Math.random() * 900)),
        type: 'StockIn',
        product_name: prodName,
        quantity: recQty,
        previous_stock: prevStock,
        new_stock: newStock,
        reason: `Kế thừa nhập kho từ đơn Inbound ${inbound.code} (Kho: ${displayWh} | NCC: ${inbound.supplier_name} | Thực nhận: ${recQty}/${expQty})`,
        created_at: new Date().toISOString()
      };

      if (!db.inventory_transactions) db.inventory_transactions = [];
      db.inventory_transactions.unshift(txObj);

      if (isLive) {
        try {
          const txPayload = prepareSupabasePayload({
            code: txObj.code,
            type: txObj.type,
            product_id: isValidUUID(targetProdId) ? targetProdId : null,
            product_name: prodName,
            quantity: recQty,
            previous_stock: prevStock,
            new_stock: newStock,
            reason: txObj.reason,
            created_at: txObj.created_at
          });
          await this.supabase.from('inventory_transactions').insert([txPayload]);
        } catch (e) {
          console.error('Supabase inventory_transactions catch error:', e);
        }
      }

      updatedItems.push({
        ...item,
        expected_qty: expQty,
        received_qty: recQty,
        subtotal: subtotal
      });
    }

    inbound.items = updatedItems;
    inbound.total_amount = grandTotal;

    // Create Payable Debt for Supplier if total > 0
    if (grandTotal > 0) {
      const initialPaid = Math.min(grandTotal, Number(inbound.paid_amount) || 0);
      const initialRemaining = Math.max(0, grandTotal - initialPaid);
      const initialStatus = initialRemaining === 0 ? 'Paid' : (initialPaid > 0 ? 'Partial' : 'Unpaid');

      const debtObj = {
        id: 'd_' + Date.now(),
        code: 'CN-TRA-' + Math.floor(100 + Math.random() * 900),
        customer_name: inbound.supplier_name,
        order_code: inbound.code,
        items: inbound.items,
        type: 'Payable',
        total_amount: grandTotal,
        remaining_amount: initialRemaining,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: initialStatus,
        notes: `Nợ tiền hàng nhập từ đơn Inbound ${inbound.code}`,
        created_at: new Date().toISOString()
      };

      if (!db.debts) db.debts = [];
      db.debts.unshift(debtObj);

      const supplier = db.customers.find(c => c.name === inbound.supplier_name);
      if (supplier) {
        supplier.current_debt = (Number(supplier.current_debt) || 0) + initialRemaining;
      }

      // Record upfront payment in debt_payments if initialPaid > 0
      if (initialPaid > 0) {
        const upfrontDpObj = {
          id: 'dp_inb_' + Date.now(),
          debt_id: debtObj.id,
          payment_code: 'TT-CHI-' + Math.floor(100000 + Math.random() * 900000),
          amount: initialPaid,
          payment_method: inbound.payment_method || 'Bank',
          note: `Thanh toán (${inbound.payment_method === 'Bank' ? 'Chuyển Khoản' : 'Tiền Mặt'}) khi nhập đơn hàng Inbound ${inbound.code}`,
          created_at: new Date().toISOString()
        };
        if (!db.debt_payments) db.debt_payments = [];
        db.debt_payments.unshift(upfrontDpObj);

        if (isLive) {
          try {
            const upfrontPayload = prepareSupabasePayload({
              debt_id: isValidUUID(debtObj.id) ? debtObj.id : null,
              payment_code: upfrontDpObj.payment_code,
              amount: upfrontDpObj.amount,
              payment_method: upfrontDpObj.payment_method,
              note: upfrontDpObj.note,
              created_at: upfrontDpObj.created_at
            });
            await this.supabase.from('debt_payments').insert([upfrontPayload]);
          } catch (e) {
            console.error('Supabase upfront inbound payment log error:', e);
          }
        }
      }

      if (isLive) {
        try {
          const debtPayload = prepareSupabasePayload({
            code: debtObj.code,
            customer_name: debtObj.customer_name,
            order_code: debtObj.order_code,
            type: debtObj.type,
            total_amount: debtObj.total_amount,
            remaining_amount: debtObj.remaining_amount,
            due_date: debtObj.due_date,
            status: debtObj.status,
            notes: debtObj.notes,
            created_at: debtObj.created_at
          });
          await this.supabase.from('debts').insert([debtPayload]);

          if (supplier && isValidUUID(supplier.id)) {
            await this.supabase.from('customers').update({ current_debt: supplier.current_debt }).eq('id', supplier.id);
          }
        } catch (e) {
          console.error('Supabase inbound debt error:', e);
        }
      }
    }

    if (isLive) {
      try {
        let updateQuery = this.supabase.from('inbound_orders').update({
          status: 'Received',
          received_by: inbound.received_by,
          received_at: inbound.received_at,
          total_amount: inbound.total_amount,
          items: inbound.items
        });

        if (isValidUUID(inbound.id)) {
          updateQuery = updateQuery.eq('id', inbound.id);
        } else {
          updateQuery = updateQuery.eq('code', inbound.code);
        }

        const { error } = await updateQuery;
        if (error) {
          console.error('Supabase fulfillInboundOrder update error:', error);
        }
      } catch (e) {
        console.error('Supabase fulfillInboundOrder error:', e);
      }
    }

    this.saveLocalStorageDb(db);
    return inbound;
  }

  async cancelInboundOrder(inboundId) {
    const isLive = this.isLiveMode;
    const db = this.getLocalStorageDb();

    let inbound = (db.inbound_orders || []).find(o => o.id === inboundId || o.code === inboundId);

    if (isLive) {
      try {
        let cancelQuery = this.supabase.from('inbound_orders').update({ status: 'Cancelled' });
        if (isValidUUID(inboundId)) {
          cancelQuery = cancelQuery.eq('id', inboundId);
        } else {
          cancelQuery = cancelQuery.eq('code', inboundId);
        }
        const { data, error } = await cancelQuery.select();
        if (!error && data && data.length > 0) {
          if (!inbound) inbound = data[0];
          else inbound.status = 'Cancelled';
        }
      } catch (e) {
        console.error('Supabase cancelInboundOrder error:', e);
      }
    }

    if (inbound) {
      inbound.status = 'Cancelled';
      const supplierName = inbound.supplier_name;

      // Clean up any debt records matching this cancelled inbound from db.debts
      let removedDebtRemaining = 0;
      if (Array.isArray(db.debts)) {
        db.debts = db.debts.filter(d => {
          const matchCode = d.order_code && (d.order_code === inbound.code || d.order_code === inbound.id);
          const matchId = d.id && (d.id === inbound.id || d.id === 'd_inb_' + inbound.id || d.id === 'd_' + inbound.id);
          const matchNotes = d.notes && inbound.code && d.notes.includes(inbound.code);
          if (matchCode || matchId || matchNotes) {
            removedDebtRemaining += Number(d.remaining_amount) || 0;
            return false;
          }
          return true;
        });
      }

      // Deduct removed debt from supplier's current_debt in db.customers
      if (supplierName && Array.isArray(db.customers)) {
        const sup = db.customers.find(c => c.name === supplierName);
        if (sup) {
          sup.current_debt = Math.max(0, (Number(sup.current_debt) || 0) - removedDebtRemaining);
          if (isLive && isValidUUID(sup.id)) {
            try {
              await this.supabase.from('customers').update({ current_debt: sup.current_debt }).eq('id', sup.id);
            } catch (e) { }
          }
        }
      }

      if (isLive && inbound.code) {
        try {
          await this.supabase.from('debts').delete().eq('order_code', inbound.code);
        } catch (e) {
          console.error('Error deleting cancelled debt on Supabase:', e);
        }
      }
    } else {
      if (!db.inbound_orders) db.inbound_orders = [];
      db.inbound_orders.unshift({ id: inboundId, code: inboundId, status: 'Cancelled' });
    }

    this.saveLocalStorageDb(db);
    return inbound;
  }

  async deleteInboundOrder(inboundId) {
    const isLive = this.isLiveMode;
    const db = this.getLocalStorageDb();

    if (db.inbound_orders) {
      db.inbound_orders = db.inbound_orders.filter(o => o.id !== inboundId && o.code !== inboundId);
      this.saveLocalStorageDb(db);
    }

    if (isLive) {
      try {
        let delQuery = this.supabase.from('inbound_orders').delete();
        if (isValidUUID(inboundId)) {
          delQuery = delQuery.eq('id', inboundId);
        } else {
          delQuery = delQuery.eq('code', inboundId);
        }
        await delQuery;
      } catch (err) {
        console.error('Supabase deleteInboundOrder error:', err);
      }
    }
  }

  // LEADS / CRM
  async getLeads() {
    if (this.isLiveMode) {
      const { data, error } = await this.supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return this.getLocalStorageDb().leads;
  }

  async addLead(lead) {
    lead.id = lead.id || 'l_' + Date.now();
    lead.stage = lead.stage || 'Lead';
    lead.stage_updated_at = lead.stage_updated_at || new Date().toISOString();

    let createdLead = lead;
    if (this.isLiveMode) {
      const payload = prepareSupabasePayload(lead);
      const { data, error } = await this.supabase.from('leads').insert([payload]).select();
      if (error) {
        console.error('Supabase addLead error:', error);
        throw new Error(error.message || 'Không thể thêm Lead vào Supabase');
      }
      if (data && data.length > 0) createdLead = data[0];
    }

    const db = this.getLocalStorageDb();
    db.leads.unshift(createdLead);
    this.saveLocalStorageDb(db);
    return createdLead;
  }

  async updateLeadStage(id, stage, lostReason = '') {
    const nowIso = new Date().toISOString();
    const updates = { stage, stage_updated_at: nowIso };
    if (stage === 'Lost') {
      if (lostReason) updates.lost_reason = lostReason;
    } else {
      updates.lost_reason = null;
    }
    if (this.isLiveMode) {
      try {
        await this.supabase.from('leads').update(updates).eq('id', id);
      } catch (e) {
        console.warn('Supabase updateLeadStage warning:', e);
      }
    }
    const db = this.getLocalStorageDb();
    const lead = db.leads.find(l => l.id === id);
    if (lead) {
      lead.stage = stage;
      lead.stage_updated_at = nowIso;
      if (stage === 'Lost') {
        if (lostReason) lead.lost_reason = lostReason;
      } else {
        lead.lost_reason = '';
      }
      this.saveLocalStorageDb(db);
    }
  }

  async updateLead(id, updates) {
    if (this.isLiveMode) {
      await this.supabase.from('leads').update(updates).eq('id', id);
    }
    const db = this.getLocalStorageDb();
    const idx = db.leads.findIndex(l => l.id === id);
    if (idx !== -1) {
      db.leads[idx] = { ...db.leads[idx], ...updates };
      this.saveLocalStorageDb(db);
    }
  }

  async deleteLead(id) {
    if (this.isLiveMode) {
      await this.supabase.from('leads').delete().eq('id', id);
    }
    const db = this.getLocalStorageDb();
    db.leads = db.leads.filter(l => l.id !== id);
    this.saveLocalStorageDb(db);
  }

  async deleteCustomer(id) {
    const db = this.getLocalStorageDb();
    const cust = db.customers ? db.customers.find(c => c.id === id) : null;
    if (cust && (cust.current_debt || 0) > 0) {
      throw new Error(`Không thể xóa khách hàng "${cust.name}" vì vẫn còn công nợ chưa thanh toán (${formatVND(cust.current_debt)})!`);
    }

    if (this.isLiveMode) {
      await this.supabase.from('customers').delete().eq('id', id);
    }
    db.customers = db.customers.filter(c => c.id !== id);
    this.saveLocalStorageDb(db);
  }

  // ==========================================
  // SHIPPING RULES (QUY TẮC & BIỂU PHÍ VẬN CHUYỂN)
  // ==========================================
  async getShippingRules() {
    if (this.isLiveMode) {
      try {
        const { data, error } = await this.supabase.from('shipping_rules').select('*').order('min_distance', { ascending: true });
        if (!error && Array.isArray(data)) {
          return data;
        }
      } catch (e) {
        console.warn('Lỗi khi tải bảng shipping_rules từ Supabase:', e);
      }
    }
    const db = this.getLocalStorageDb();
    if (!db.shipping_rules) {
      db.shipping_rules = [];
      this.saveLocalStorageDb(db);
    }
    return db.shipping_rules || [];
  }

  async addShippingRule(rule) {
    rule.id = rule.id || 'sr_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    rule.category = rule.category || 'Khác';
    rule.min_distance = Number(rule.min_distance) || 0;
    rule.max_distance = (rule.max_distance !== undefined && rule.max_distance !== '') ? Number(rule.max_distance) : 9999;
    rule.base_fee = Number(rule.base_fee) || 0;
    rule.is_active = rule.is_active !== undefined ? Boolean(rule.is_active) : true;
    rule.notes = rule.notes || '';
    rule.created_at = rule.created_at || new Date().toISOString();
    rule.updated_at = new Date().toISOString();

    let createdRule = { ...rule };
    if (this.isLiveMode) {
      try {
        const payload = prepareSupabasePayload(rule);
        const { data, error } = await this.supabase.from('shipping_rules').insert([payload]).select();
        if (error) {
          console.error('Supabase addShippingRule error:', error);
          throw new Error(error.message || 'Lỗi khi thêm quy tắc vận chuyển lên Supabase');
        }
        if (data && data.length > 0) createdRule = data[0];
      } catch (err) {
        console.error('addShippingRule error:', err);
        throw err;
      }
    }

    const db = this.getLocalStorageDb();
    if (!db.shipping_rules) db.shipping_rules = [];
    db.shipping_rules.push(createdRule);
    this.saveLocalStorageDb(db);
    return createdRule;
  }

  async updateShippingRule(id, updates) {
    updates.updated_at = new Date().toISOString();
    if (updates.min_distance !== undefined) updates.min_distance = Number(updates.min_distance);
    if (updates.max_distance !== undefined) updates.max_distance = Number(updates.max_distance);
    if (updates.base_fee !== undefined) updates.base_fee = Number(updates.base_fee);

    if (this.isLiveMode) {
      try {
        const payload = prepareSupabasePayload(updates);
        let query = this.supabase.from('shipping_rules').update(payload);
        if (isValidUUID(id)) {
          query = query.eq('id', id);
        } else {
          query = query.eq('id', id);
        }
        const { error } = await query;
        if (error) console.error('Supabase updateShippingRule error:', error);
      } catch (e) {
        console.error('Supabase updateShippingRule exception:', e);
      }
    }

    const db = this.getLocalStorageDb();
    if (!db.shipping_rules) db.shipping_rules = [];
    const idx = db.shipping_rules.findIndex(r => r.id === id);
    if (idx !== -1) {
      db.shipping_rules[idx] = { ...db.shipping_rules[idx], ...updates };
      this.saveLocalStorageDb(db);
      return db.shipping_rules[idx];
    }
    return null;
  }

  async deleteShippingRule(id) {
    if (this.isLiveMode) {
      try {
        await this.supabase.from('shipping_rules').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase deleteShippingRule error:', err);
      }
    }

    const db = this.getLocalStorageDb();
    if (db.shipping_rules) {
      db.shipping_rules = db.shipping_rules.filter(r => r.id !== id);
      this.saveLocalStorageDb(db);
    }
  }

  async clearAllShippingRules() {
    if (this.isLiveMode) {
      try {
        await this.supabase.from('shipping_rules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.error('Supabase clearAllShippingRules error:', err);
      }
    }

    const db = this.getLocalStorageDb();
    db.shipping_rules = [];
    this.saveLocalStorageDb(db);
    try {
      localStorage.removeItem('ERP_CATEGORY_SHIPPING_RATES');
    } catch (e) { }
  }

  async purgeLegacyDummyData() {
    const dummyNames = ['Máy tính', 'Thiết bị Mạng', 'Thiết bị ngoại vi', 'Phụ kiện'];
    if (this.isLiveMode) {
      try {
        for (const name of dummyNames) {
          await this.supabase.from('shipping_rules').delete().eq('category', name);
        }
      } catch (e) {
        console.warn('Error purging dummy rules from Supabase:', e);
      }
    }
    const db = this.getLocalStorageDb();
    if (Array.isArray(db.shipping_rules)) {
      db.shipping_rules = db.shipping_rules.filter(r => !dummyNames.includes(r.category) && !dummyNames.includes(r.sku));
      this.saveLocalStorageDb(db);
    }
    try {
      localStorage.removeItem('ERP_CATEGORY_SHIPPING_RATES');
    } catch (e) { }
  }

  async saveShippingRulesBulk(rulesArray) {
    if (!Array.isArray(rulesArray)) return;

    if (this.isLiveMode) {
      try {
        const { data: supaRules, error: fetchErr } = await this.supabase.from('shipping_rules').select('*');
        if (!fetchErr && Array.isArray(supaRules)) {
          const supaMap = new Map();
          supaRules.forEach(sr => {
            const key = `${(sr.category || '').trim()}_${Number(sr.min_distance)}_${Number(sr.max_distance)}`;
            supaMap.set(key, sr.id);
          });

          for (const rule of rulesArray) {
            const key = `${(rule.category || '').trim()}_${Number(rule.min_distance)}_${Number(rule.max_distance)}`;
            const existingSupaId = (isValidUUID(rule.id) && supaRules.some(r => r.id === rule.id))
              ? rule.id
              : supaMap.get(key);

            const payload = {
              category: (rule.category || 'Khác').trim(),
              min_distance: Number(rule.min_distance) || 0,
              max_distance: Number(rule.max_distance) || 9999,
              base_fee: Number(rule.base_fee) || 0,
              is_active: rule.is_active !== false,
              notes: rule.notes || '',
              updated_at: new Date().toISOString()
            };

            if (existingSupaId && isValidUUID(existingSupaId)) {
              rule.id = existingSupaId;
              await this.supabase.from('shipping_rules').update(payload).eq('id', existingSupaId);
            } else {
              const { data: inserted, error: insErr } = await this.supabase.from('shipping_rules').insert([payload]).select();
              if (!insErr && inserted && inserted.length > 0) {
                rule.id = inserted[0].id;
              }
            }
          }
        } else {
          const safePayload = rulesArray.map(r => prepareSupabasePayload(r));
          await this.supabase.from('shipping_rules').upsert(safePayload);
        }
      } catch (e) {
        console.error('Supabase saveShippingRulesBulk exception:', e);
      }
    }

    const db = this.getLocalStorageDb();
    db.shipping_rules = [...rulesArray];
    this.saveLocalStorageDb(db);
    return db.shipping_rules;
  }

  async resetShippingRulesToDefault() {
    if (this.isLiveMode) {
      try {
        await this.supabase.from('shipping_rules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {
        console.warn('Supabase reset rules error:', e);
      }
    }
    const db = this.getLocalStorageDb();
    db.shipping_rules = [];
    this.saveLocalStorageDb(db);
    return [];
  }

  async updateCustomerDistance(customerId, distanceKm) {
    const distStr = String(distanceKm || '').trim();
    if (this.isLiveMode) {
      try {
        await this.supabase.from('customers').update({ distance_km: distStr }).eq('id', customerId);
      } catch (e) {
        console.warn('Supabase updateCustomerDistance error:', e);
      }
    }
    const db = this.getLocalStorageDb();
    if (db.customers) {
      const c = db.customers.find(item => item.id === customerId);
      if (c) {
        c.distance_km = distStr;
        this.saveLocalStorageDb(db);
      }
    }
  }

  // --- PRODUCT SAMPLES (PHÁT MẪU SẢN PHẨM) ---
  async getSamples() {
    return this.getProductSamples();
  }

  async getProductSamples() {
    let liveSamples = [];
    if (this.isLiveMode) {
      try {
        const { data, error } = await this.supabase.from('product_samples').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          liveSamples = data;
        } else if (error) {
          console.warn('Supabase getProductSamples notice:', error);
        }
      } catch (err) {
        console.error('Error fetching product_samples from Supabase:', err);
      }
    }

    const db = this.getLocalStorageDb();
    const localSamples = Array.isArray(db.product_samples) ? db.product_samples : [];

    if (this.isLiveMode && liveSamples.length > 0) {
      db.product_samples = liveSamples;
      this.saveLocalStorageDb(db);
      return liveSamples;
    }

    return localSamples;
  }

  async addProductSample(sample) {
    sample.id = sample.id || 'sample_' + Date.now();
    sample.code = sample.code || 'PM' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900);
    sample.quantity = typeof parseQuantity === 'function' ? parseQuantity(sample.quantity) : (parseFloat(sample.quantity) || 1);
    sample.unit = sample.unit || 'Mẫu';
    sample.status = sample.status || 'Displaying';
    sample.handover_date = sample.handover_date || new Date().toISOString().split('T')[0];
    sample.items = Array.isArray(sample.items) ? sample.items : [];
    sample.created_at = sample.created_at || new Date().toISOString();
    sample.updated_at = new Date().toISOString();

    // Normalize quantities inside items
    if (sample.items.length > 0) {
      sample.items.forEach(it => {
        it.quantity = typeof parseQuantity === 'function' ? parseQuantity(it.quantity) : (parseFloat(it.quantity) || 1);
      });
    }

    let createdSample = { ...sample };

    if (this.isLiveMode) {
      try {
        const payload = prepareSupabasePayload(sample);
        const { data, error } = await this.supabase.from('product_samples').insert([payload]).select();
        if (error) {
          console.error('Supabase addProductSample error:', error);
          if (error.code === '23505') {
            throw new Error(`Mã phiếu phát mẫu "${sample.code}" đã tồn tại trên CSDL! Vui lòng chọn mã khác.`);
          }
        } else if (data && data.length > 0) {
          createdSample = { ...sample, id: data[0].id };
        }
      } catch (e) {
        console.error('Supabase addProductSample exception:', e);
      }
    }

    const db = this.getLocalStorageDb();
    if (!Array.isArray(db.product_samples)) db.product_samples = [];
    if (!Array.isArray(db.products)) db.products = [];
    if (!Array.isArray(db.inventory_transactions)) db.inventory_transactions = [];

    // --- TRỪ TỒN KHO KHI XUẤT CẤP PHÁT MẪU (STOCK OUT DEDUCTION) ---
    const itemsToDeduct = sample.items && sample.items.length > 0 ? sample.items : [{
      product_id: sample.product_id,
      sku: sample.product_sku,
      name: sample.product_name,
      quantity: sample.quantity,
      unit: sample.unit
    }];

    for (let i = 0; i < itemsToDeduct.length; i++) {
      const it = itemsToDeduct[i];
      const itemQty = typeof parseQuantity === 'function' ? parseQuantity(it.quantity) : (parseFloat(it.quantity) || 0);
      if (itemQty <= 0) continue;

      let localProd = null;
      if (it.product_id) {
        localProd = db.products.find(p => p.id === it.product_id);
      }
      if (!localProd && it.sku) {
        localProd = db.products.find(p => (p.sku || '').toLowerCase() === (it.sku || '').toLowerCase());
      }
      if (!localProd && it.name) {
        localProd = db.products.find(p => (p.name || '').toLowerCase() === (it.name || '').toLowerCase());
      }

      let oldStock = localProd ? (Number(localProd.stock_quantity) || 0) : 0;
      let newStock = Math.max(0, Math.round((oldStock - itemQty) * 100) / 100);
      const prodName = localProd ? localProd.name : (it.name || sample.product_name || 'Sản phẩm mẫu');

      if (localProd) {
        localProd.stock_quantity = newStock;
      }

      const txObj = {
        id: 'it_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        code: 'XK-PM-' + Math.floor(1000 + Math.random() * 9000),
        type: 'StockOut',
        product_id: localProd ? localProd.id : (it.product_id || null),
        product_name: prodName,
        quantity: itemQty,
        previous_stock: oldStock,
        new_stock: newStock,
        reason: `Xuất cấp phát mẫu phiếu ${sample.code} (Cửa hàng: ${sample.customer_name}${sample.sales_person ? ' | Sales: ' + sample.sales_person : ''})`,
        created_at: new Date().toISOString()
      };
      db.inventory_transactions.unshift(txObj);

      // Supabase Live Mode Stock Out
      if (this.isLiveMode) {
        try {
          let supaProd = null;
          if (isValidUUID(it.product_id)) {
            const { data: spData } = await this.supabase.from('products').select('*').eq('id', it.product_id).single();
            if (spData) supaProd = spData;
          } else if (localProd && isValidUUID(localProd.id)) {
            const { data: spData } = await this.supabase.from('products').select('*').eq('id', localProd.id).single();
            if (spData) supaProd = spData;
          }
          if (!supaProd && it.sku) {
            const { data: spList } = await this.supabase.from('products').select('*').eq('sku', it.sku);
            if (spList && spList.length > 0) supaProd = spList[0];
          }
          if (!supaProd && it.name) {
            const { data: spList } = await this.supabase.from('products').select('*').eq('name', it.name);
            if (spList && spList.length > 0) supaProd = spList[0];
          }

          let sOld = oldStock;
          let sNew = newStock;
          if (supaProd) {
            sOld = Number(supaProd.stock_quantity) || 0;
            sNew = Math.max(0, Math.round((sOld - itemQty) * 100) / 100);
            await this.supabase.from('products').update({ stock_quantity: sNew }).eq('id', supaProd.id);
          } else if (it.sku) {
            await this.supabase.from('products').update({ stock_quantity: sNew }).eq('sku', it.sku);
          }

          const txPayload = prepareSupabasePayload({
            code: txObj.code,
            type: 'StockOut',
            product_id: supaProd && isValidUUID(supaProd.id) ? supaProd.id : (isValidUUID(it.product_id) ? it.product_id : null),
            product_name: supaProd ? supaProd.name : prodName,
            quantity: itemQty,
            previous_stock: sOld,
            new_stock: sNew,
            reason: txObj.reason,
            created_at: txObj.created_at
          });
          await this.supabase.from('inventory_transactions').insert([txPayload]);
        } catch (e) {
          console.error('Supabase sample inventory deduction error:', e);
        }
      }
    }

    const existingIdx = db.product_samples.findIndex(s => s.id === createdSample.id);
    if (existingIdx !== -1) {
      db.product_samples[existingIdx] = createdSample;
    } else {
      db.product_samples.unshift(createdSample);
    }
    this.saveLocalStorageDb(db);
    return createdSample;
  }

  async addSample(sample) {
    return this.addProductSample(sample);
  }

  async updateProductSample(id, updates) {
    updates.updated_at = new Date().toISOString();
    const db = this.getLocalStorageDb();
    if (!Array.isArray(db.product_samples)) db.product_samples = [];
    if (!Array.isArray(db.products)) db.products = [];
    if (!Array.isArray(db.inventory_transactions)) db.inventory_transactions = [];

    const prevSample = db.product_samples.find(s => s.id === id);

    // Status transition: If sample is returned -> restore stock (StockIn)
    if (prevSample && prevSample.status !== 'Returned' && updates.status === 'Returned') {
      const itemsToReturn = prevSample.items && prevSample.items.length > 0 ? prevSample.items : [{
        product_id: prevSample.product_id,
        sku: prevSample.product_sku,
        name: prevSample.product_name,
        quantity: prevSample.quantity
      }];

      for (const it of itemsToReturn) {
        const itemQty = typeof parseQuantity === 'function' ? parseQuantity(it.quantity) : (parseFloat(it.quantity) || 0);
        if (itemQty <= 0) continue;

        let localProd = null;
        if (it.product_id) localProd = db.products.find(p => p.id === it.product_id);
        if (!localProd && it.sku) localProd = db.products.find(p => (p.sku || '').toLowerCase() === (it.sku || '').toLowerCase());
        if (!localProd && it.name) localProd = db.products.find(p => (p.name || '').toLowerCase() === (it.name || '').toLowerCase());

        let oldStock = localProd ? (Number(localProd.stock_quantity) || 0) : 0;
        let newStock = Math.round((oldStock + itemQty) * 100) / 100;
        const prodName = localProd ? localProd.name : (it.name || prevSample.product_name || 'Sản phẩm mẫu');

        if (localProd) localProd.stock_quantity = newStock;

        const txObj = {
          id: 'it_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          code: 'NK-PM-' + Math.floor(1000 + Math.random() * 9000),
          type: 'StockIn',
          product_id: localProd ? localProd.id : (it.product_id || null),
          product_name: prodName,
          quantity: itemQty,
          previous_stock: oldStock,
          new_stock: newStock,
          reason: `Thu hồi mẫu phiếu ${prevSample.code} từ cửa hàng "${prevSample.customer_name}" về lại kho`,
          created_at: new Date().toISOString()
        };
        db.inventory_transactions.unshift(txObj);

        if (this.isLiveMode) {
          try {
            let supaProd = null;
            if (isValidUUID(it.product_id)) {
              const { data: spData } = await this.supabase.from('products').select('*').eq('id', it.product_id).single();
              if (spData) supaProd = spData;
            } else if (localProd && isValidUUID(localProd.id)) {
              const { data: spData } = await this.supabase.from('products').select('*').eq('id', localProd.id).single();
              if (spData) supaProd = spData;
            }
            if (!supaProd && it.sku) {
              const { data: spList } = await this.supabase.from('products').select('*').eq('sku', it.sku);
              if (spList && spList.length > 0) supaProd = spList[0];
            }

            let sOld = oldStock;
            let sNew = newStock;
            if (supaProd) {
              sOld = Number(supaProd.stock_quantity) || 0;
              sNew = Math.round((sOld + itemQty) * 100) / 100;
              await this.supabase.from('products').update({ stock_quantity: sNew }).eq('id', supaProd.id);
            }

            const txPayload = prepareSupabasePayload({
              code: txObj.code,
              type: 'StockIn',
              product_id: supaProd && isValidUUID(supaProd.id) ? supaProd.id : (isValidUUID(it.product_id) ? it.product_id : null),
              product_name: supaProd ? supaProd.name : prodName,
              quantity: itemQty,
              previous_stock: sOld,
              new_stock: sNew,
              reason: txObj.reason,
              created_at: txObj.created_at
            });
            await this.supabase.from('inventory_transactions').insert([txPayload]);
          } catch (e) {
            console.error('Supabase return sample inventory error:', e);
          }
        }
      }
    } else if (prevSample && prevSample.status === 'Returned' && updates.status && updates.status !== 'Returned') {
      // Re-issued from returned status -> deduct stock again (StockOut)
      const itemsToDeduct = prevSample.items && prevSample.items.length > 0 ? prevSample.items : [{
        product_id: prevSample.product_id,
        sku: prevSample.product_sku,
        name: prevSample.product_name,
        quantity: prevSample.quantity
      }];

      for (const it of itemsToDeduct) {
        const itemQty = typeof parseQuantity === 'function' ? parseQuantity(it.quantity) : (parseFloat(it.quantity) || 0);
        if (itemQty <= 0) continue;

        let localProd = null;
        if (it.product_id) localProd = db.products.find(p => p.id === it.product_id);
        if (!localProd && it.sku) localProd = db.products.find(p => (p.sku || '').toLowerCase() === (it.sku || '').toLowerCase());
        if (!localProd && it.name) localProd = db.products.find(p => (p.name || '').toLowerCase() === (it.name || '').toLowerCase());

        let oldStock = localProd ? (Number(localProd.stock_quantity) || 0) : 0;
        let newStock = Math.max(0, Math.round((oldStock - itemQty) * 100) / 100);
        const prodName = localProd ? localProd.name : (it.name || prevSample.product_name || 'Sản phẩm mẫu');

        if (localProd) localProd.stock_quantity = newStock;

        const txObj = {
          id: 'it_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          code: 'XK-PM-' + Math.floor(1000 + Math.random() * 9000),
          type: 'StockOut',
          product_id: localProd ? localProd.id : (it.product_id || null),
          product_name: prodName,
          quantity: itemQty,
          previous_stock: oldStock,
          new_stock: newStock,
          reason: `Xuất lại mẫu phiếu ${prevSample.code} cho cửa hàng "${prevSample.customer_name}"`,
          created_at: new Date().toISOString()
        };
        db.inventory_transactions.unshift(txObj);

        if (this.isLiveMode) {
          try {
            let supaProd = null;
            if (isValidUUID(it.product_id)) {
              const { data: spData } = await this.supabase.from('products').select('*').eq('id', it.product_id).single();
              if (spData) supaProd = spData;
            } else if (localProd && isValidUUID(localProd.id)) {
              const { data: spData } = await this.supabase.from('products').select('*').eq('id', localProd.id).single();
              if (spData) supaProd = spData;
            }
            if (!supaProd && it.sku) {
              const { data: spList } = await this.supabase.from('products').select('*').eq('sku', it.sku);
              if (spList && spList.length > 0) supaProd = spList[0];
            }

            let sOld = oldStock;
            let sNew = newStock;
            if (supaProd) {
              sOld = Number(supaProd.stock_quantity) || 0;
              sNew = Math.max(0, Math.round((sOld - itemQty) * 100) / 100);
              await this.supabase.from('products').update({ stock_quantity: sNew }).eq('id', supaProd.id);
            }

            const txPayload = prepareSupabasePayload({
              code: txObj.code,
              type: 'StockOut',
              product_id: supaProd && isValidUUID(supaProd.id) ? supaProd.id : (isValidUUID(it.product_id) ? it.product_id : null),
              product_name: supaProd ? supaProd.name : prodName,
              quantity: itemQty,
              previous_stock: sOld,
              new_stock: sNew,
              reason: txObj.reason,
              created_at: txObj.created_at
            });
            await this.supabase.from('inventory_transactions').insert([txPayload]);
          } catch (e) {
            console.error('Supabase re-issue sample inventory error:', e);
          }
        }
      }
    }

    if (this.isLiveMode) {
      try {
        const payload = prepareSupabasePayload(updates);
        const { error } = await this.supabase.from('product_samples').update(payload).eq('id', id);
        if (error) {
          console.error('Supabase updateProductSample error:', error);
        }
      } catch (e) {
        console.error('Supabase updateProductSample exception:', e);
      }
    }

    const idx = db.product_samples.findIndex(s => s.id === id);
    if (idx !== -1) {
      db.product_samples[idx] = { ...db.product_samples[idx], ...updates };
      this.saveLocalStorageDb(db);
      return db.product_samples[idx];
    }
    return null;
  }

  async updateSample(id, updates) {
    return this.updateProductSample(id, updates);
  }

  async deleteProductSample(id) {
    const db = this.getLocalStorageDb();
    if (!Array.isArray(db.product_samples)) db.product_samples = [];
    if (!Array.isArray(db.products)) db.products = [];
    if (!Array.isArray(db.inventory_transactions)) db.inventory_transactions = [];

    const sample = db.product_samples.find(s => s.id === id);

    // If deleting an active sample (not Returned), restore inventory stock (StockIn)
    if (sample && sample.status !== 'Returned') {
      const itemsToRestore = sample.items && sample.items.length > 0 ? sample.items : [{
        product_id: sample.product_id,
        sku: sample.product_sku,
        name: sample.product_name,
        quantity: sample.quantity
      }];

      for (const it of itemsToRestore) {
        const itemQty = typeof parseQuantity === 'function' ? parseQuantity(it.quantity) : (parseFloat(it.quantity) || 0);
        if (itemQty <= 0) continue;

        let localProd = null;
        if (it.product_id) localProd = db.products.find(p => p.id === it.product_id);
        if (!localProd && it.sku) localProd = db.products.find(p => (p.sku || '').toLowerCase() === (it.sku || '').toLowerCase());
        if (!localProd && it.name) localProd = db.products.find(p => (p.name || '').toLowerCase() === (it.name || '').toLowerCase());

        let oldStock = localProd ? (Number(localProd.stock_quantity) || 0) : 0;
        let newStock = Math.round((oldStock + itemQty) * 100) / 100;
        const prodName = localProd ? localProd.name : (it.name || sample.product_name || 'Sản phẩm mẫu');

        if (localProd) localProd.stock_quantity = newStock;

        const txObj = {
          id: 'it_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          code: 'NK-PM-' + Math.floor(1000 + Math.random() * 9000),
          type: 'StockIn',
          product_id: localProd ? localProd.id : (it.product_id || null),
          product_name: prodName,
          quantity: itemQty,
          previous_stock: oldStock,
          new_stock: newStock,
          reason: `Hoàn tồn kho do xóa phiếu phát mẫu ${sample.code} (${sample.customer_name})`,
          created_at: new Date().toISOString()
        };
        db.inventory_transactions.unshift(txObj);

        if (this.isLiveMode) {
          try {
            let supaProd = null;
            if (isValidUUID(it.product_id)) {
              const { data: spData } = await this.supabase.from('products').select('*').eq('id', it.product_id).single();
              if (spData) supaProd = spData;
            } else if (localProd && isValidUUID(localProd.id)) {
              const { data: spData } = await this.supabase.from('products').select('*').eq('id', localProd.id).single();
              if (spData) supaProd = spData;
            }
            if (!supaProd && it.sku) {
              const { data: spList } = await this.supabase.from('products').select('*').eq('sku', it.sku);
              if (spList && spList.length > 0) supaProd = spList[0];
            }

            let sOld = oldStock;
            let sNew = newStock;
            if (supaProd) {
              sOld = Number(supaProd.stock_quantity) || 0;
              sNew = Math.round((sOld + itemQty) * 100) / 100;
              await this.supabase.from('products').update({ stock_quantity: sNew }).eq('id', supaProd.id);
            }

            const txPayload = prepareSupabasePayload({
              code: txObj.code,
              type: 'StockIn',
              product_id: supaProd && isValidUUID(supaProd.id) ? supaProd.id : (isValidUUID(it.product_id) ? it.product_id : null),
              product_name: supaProd ? supaProd.name : prodName,
              quantity: itemQty,
              previous_stock: sOld,
              new_stock: sNew,
              reason: txObj.reason,
              created_at: txObj.created_at
            });
            await this.supabase.from('inventory_transactions').insert([txPayload]);
          } catch (e) {
            console.error('Supabase restore stock on sample delete error:', e);
          }
        }
      }
    }

    if (this.isLiveMode) {
      try {
        const { error } = await this.supabase.from('product_samples').delete().eq('id', id);
        if (error) {
          console.error('Supabase deleteProductSample error:', error);
        }
      } catch (e) {
        console.error('Supabase deleteProductSample exception:', e);
      }
    }

    if (Array.isArray(db.product_samples)) {
      db.product_samples = db.product_samples.filter(s => s.id !== id);
      this.saveLocalStorageDb(db);
    }
  }

  async deleteSample(id) {
    return this.deleteProductSample(id);
  }
}

// Global Export
window.dbProvider = new SupabaseProvider();

