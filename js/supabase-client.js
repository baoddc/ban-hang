/* =======================================================
   SUPABASE CLIENT & DUAL-ENGINE DATABASE PROVIDER
   ======================================================= */

const SUPABASE_CONFIG_KEY = 'ERP_SUPABASE_CONFIG';
const LOCAL_STORAGE_DB_KEY = 'ERP_LOCAL_DATABASE_V1';

// Default initial data for enterprise fallback
const DEFAULT_INITIAL_DATA = {
  customers: [
    { id: 'c1', code: 'KH001', name: 'Công ty TNHH Công Nghệ Việt', phone: '0901234567', email: '5.2 km', address: '123 Lê Lợi, Q.1, TP.HCM', type: 'Customer', group_name: 'VIP', current_debt: 15500000, route: 'Tuyến Q.1 - Q.3', sales_person: 'Nguyễn Thanh Tùng', created_at: '2026-08-01' },
    { id: 'c2', code: 'KH002', name: 'Tập đoàn Bán Lẻ An Phát', phone: '0912345678', email: '12 km', address: '456 Nguyễn Huệ, Q.1, TP.HCM', type: 'Customer', group_name: 'Đại lý', current_debt: 42000000, route: 'Tuyến Q.1 - Phố Đi Bộ', sales_person: 'Lê Thu Hà', created_at: '2026-08-02' },
    { id: 'c3', code: 'KH003', name: 'Cửa Hàng Điện Máy Minh Khoa', phone: '0987654321', email: '8.5 km', address: '789 Trần Hưng Đạo, Q.5, TP.HCM', type: 'Customer', group_name: 'Khách thường', current_debt: 0, route: 'Tuyến Q.5 - Chợ Lớn', sales_person: 'Trần Văn Nam', created_at: '2026-08-05' },
    { id: 'c4', code: 'NCC01', name: 'Tổng Kho Linh Kiện Nam Sài Gòn', phone: '02838999888', email: '15 km', address: '12 KCN Tân Bình, TP.HCM', type: 'Supplier', group_name: 'Đại lý', current_debt: -28000000, route: 'Tuyến Tân Bình - Hóc Môn', sales_person: 'Nguyễn Thanh Tùng', created_at: '2026-08-03' }
  ],
  products: [
    { id: 'p1', sku: 'LAP-DEL-01', name: 'Laptop Dell XPS 13 i7 16GB', category: 'Máy tính', unit: 'Cái', cost_price: 22000000, selling_price: 26900000, stock_quantity: 14, min_stock_alert: 3, location: 'Khu A - Kệ 01' },
    { id: 'p2', sku: 'MON-LG-27', name: 'Màn Hình LG UltraGear 27 inch 144Hz', category: 'Thiết bị ngoại vi', unit: 'Cái', cost_price: 4500000, selling_price: 5990000, stock_quantity: 28, min_stock_alert: 5, location: 'Khu A - Kệ 02' },
    { id: 'p3', sku: 'MOU-LOG-MX', name: 'Chuột Không Dây Logitech MX Master 3S', category: 'Phụ kiện', unit: 'Cái', cost_price: 1800000, selling_price: 2450000, stock_quantity: 45, min_stock_alert: 10, location: 'Khu B - Kệ 01' },
    { id: 'p4', sku: 'KEY-PHI-01', name: 'Bàn Phím Cơ Wireless Keychron K2 V2', category: 'Phụ kiện', unit: 'Cái', cost_price: 1400000, selling_price: 1950000, stock_quantity: 4, min_stock_alert: 8, location: 'Khu B - Kệ 02' },
    { id: 'p5', sku: 'SRV-SYS-01', name: 'Máy Chủ Server Dell PowerEdge T150', category: 'Thiết bị Mạng', unit: 'Cái', cost_price: 31000000, selling_price: 38500000, stock_quantity: 2, min_stock_alert: 2, location: 'Khu C - Tủ Bảo Vệ' }
  ],
  orders: [
    { id: 'o1', order_code: 'HD20260801', customer_name: 'Công ty TNHH Công Nghệ Việt', total_amount: 26900000, discount: 900000, tax: 0, final_amount: 26000000, paid_amount: 10500000, debt_amount: 15500000, status: 'Completed', payment_method: 'Bank', created_at: '2026-08-04T10:30:00Z', items: [{ product_id: 'p1', product_sku: 'LAP-DEL-01', product_name: 'Laptop Dell XPS 13 i7 16GB', unit_price: 26900000, quantity: 1, subtotal: 26900000 }] },
    { id: 'o2', order_code: 'HD20260802', customer_name: 'Tập đoàn Bán Lẻ An Phát', total_amount: 42000000, discount: 0, tax: 0, final_amount: 42000000, paid_amount: 0, debt_amount: 42000000, status: 'Completed', payment_method: 'Debt', created_at: '2026-08-06T14:15:00Z', items: [{ product_id: 'p5', product_sku: 'SRV-SYS-01', product_name: 'Máy Chủ Server Dell PowerEdge T150', unit_price: 38500000, quantity: 1, subtotal: 38500000 }, { product_id: 'p3', product_sku: 'MOU-LOG-MX', product_name: 'Chuột Không Dây Logitech MX Master 3S', unit_price: 3500000, quantity: 1, subtotal: 3500000 }] },
    { id: 'o3', order_code: 'HD20260808', customer_name: 'Công ty TNHH Công Nghệ Việt', total_amount: 53800000, discount: 0, tax: 0, final_amount: 53800000, paid_amount: 0, debt_amount: 53800000, status: 'Completed', payment_method: 'Debt', created_at: '2026-08-08T09:15:00Z', items: [{ product_id: 'p1', product_sku: 'LAP-DEL-01', product_name: 'Laptop Dell XPS 13 i7 16GB', unit_price: 26900000, quantity: 2, subtotal: 53800000 }] },
    { id: 'o4', order_code: 'HD20260725', customer_name: 'Công ty TNHH Công Nghệ Việt', total_amount: 11980000, discount: 0, tax: 0, final_amount: 11980000, paid_amount: 7580000, debt_amount: 4400000, status: 'Completed', payment_method: 'Debt', created_at: '2026-07-25T16:00:00Z', items: [{ product_id: 'p2', product_sku: 'MON-LG-27', product_name: 'Màn Hình LG UltraGear 27 inch 144Hz', unit_price: 5990000, quantity: 2, subtotal: 11980000 }] },
    { id: 'o5', order_code: 'HD20260807', customer_name: 'Cửa Hàng Điện Máy Minh Khoa', total_amount: 9800000, discount: 0, tax: 0, final_amount: 9800000, paid_amount: 9800000, debt_amount: 0, status: 'Completed', payment_method: 'Cash', created_at: '2026-08-07T11:20:00Z', items: [{ product_id: 'p4', product_sku: 'KEY-PHI-01', product_name: 'Bàn Phím Cơ Wireless Keychron K2 V2', unit_price: 1950000, quantity: 2, subtotal: 3900000 }, { product_id: 'p2', product_sku: 'MON-LG-27', product_name: 'Màn Hình LG UltraGear 27 inch 144Hz', unit_price: 5900000, quantity: 1, subtotal: 5900000 }] }
  ],
  debts: [
    { id: 'd1', code: 'CN-PT-001', customer_name: 'Công ty TNHH Công Nghệ Việt', order_code: 'HD20260801', items: [{ product_id: 'p1', product_sku: 'LAP-DEL-01', product_name: 'Laptop Dell XPS 13 i7 16GB', unit_price: 26900000, quantity: 1, subtotal: 15500000 }], type: 'Receivable', total_amount: 15500000, remaining_amount: 15500000, due_date: '2026-08-25', status: 'Unpaid', notes: 'Công nợ từ đơn HD20260801' },
    { id: 'd2', code: 'CN-PT-456', customer_name: 'Công ty TNHH Công Nghệ Việt', order_code: 'HD20260808', items: [{ product_id: 'p1', product_sku: 'LAP-DEL-01', product_name: 'Laptop Dell XPS 13 i7 16GB', unit_price: 26900000, quantity: 2, subtotal: 53800000 }], type: 'Receivable', total_amount: 53800000, remaining_amount: 53800000, due_date: '2026-09-08', status: 'Unpaid', notes: 'Ghi nhận công nợ đơn HD20260808' },
    { id: 'd3', code: 'CN-PT-808', customer_name: 'Công ty TNHH Công Nghệ Việt', order_code: 'HD20260725', items: [{ product_id: 'p2', product_sku: 'MON-LG-27', product_name: 'Màn Hình LG UltraGear 27 inch 144Hz', unit_price: 5990000, quantity: 2, subtotal: 4400000 }], type: 'Receivable', total_amount: 4400000, remaining_amount: 4400000, due_date: '2026-08-15', status: 'Unpaid', notes: 'Ghi nhận công nợ đơn HD20260725' },
    { id: 'd4', code: 'CN-PT-002', customer_name: 'Tập đoàn Bán Lẻ An Phát', order_code: 'HD20260802', items: [{ product_id: 'p5', product_sku: 'SRV-SYS-01', product_name: 'Máy Chủ Server Dell PowerEdge T150', unit_price: 38500000, quantity: 1, subtotal: 38500000 }, { product_id: 'p3', product_sku: 'MOU-LOG-MX', product_name: 'Chuột Không Dây Logitech MX Master 3S', unit_price: 3500000, quantity: 1, subtotal: 3500000 }], type: 'Receivable', total_amount: 42000000, remaining_amount: 42000000, due_date: '2026-08-30', status: 'Unpaid', notes: 'Công nợ từ đơn HD20260802' },
    { id: 'd5', code: 'CN-PT-330', customer_name: 'Tập đoàn Bán Lẻ An Phát', items: [{ product_id: 'p4', product_sku: 'KEY-PHI-01', product_name: 'Bàn Phím Cơ Wireless Keychron K2 V2', unit_price: 1950000, quantity: 9, subtotal: 17970000 }], type: 'Receivable', total_amount: 17970000, remaining_amount: 17970000, due_date: '2026-09-01', status: 'Unpaid', notes: 'Công nợ linh kiện đợt 2' },
    { id: 'd6', code: 'CN-TRA-001', customer_name: 'Tổng Kho Linh Kiện Nam Sài Gòn', items: [{ product_id: 'p5', product_sku: 'SRV-SYS-01', product_name: 'Máy Chủ Server Dell PowerEdge T150', unit_price: 28000000, quantity: 1, subtotal: 28000000 }], type: 'Payable', total_amount: 28000000, remaining_amount: 28000000, due_date: '2026-08-20', status: 'Unpaid', notes: 'Nợ tiền hàng nhập linh kiện' }
  ],
  inventory_transactions: [
    { id: 'it1', code: 'NK-20260801', type: 'StockIn', product_name: 'Laptop Dell XPS 13 i7 16GB', quantity: 10, previous_stock: 4, new_stock: 14, reason: 'Nhập hàng từ Dell VN', created_at: '2026-08-01T09:00:00Z' },
    { id: 'it2', code: 'XK-20260802', type: 'StockOut', product_name: 'Bàn Phím Cơ Wireless Keychron K2 V2', quantity: 5, previous_stock: 9, new_stock: 4, reason: 'Xuất bán HD20260801', created_at: '2026-08-04T10:30:00Z' }
  ],
  leads: [
    { id: 'l1', name: 'Nguyễn Văn Nam', company: 'Công ty Cổ phần Phần mềm BK', phone: '0933112233', email: 'nam.nguyen@bksoft.vn', estimated_value: 120000000, stage: 'Proposal', assigned_to: 'Nguyễn Thanh Tùng', notes: 'Yêu cầu báo giá 10 máy trạm XPS' },
    { id: 'l2', name: 'Trần Thị Hoa', company: 'Chuỗi Nhà Hàng Phố Biển', phone: '0944556677', email: 'hoatt@phobien.com', estimated_value: 45000000, stage: 'Negotiation', assigned_to: 'Lê Thu Hà', notes: 'Cần tư vấn máy in POS' },
    { id: 'l3', name: 'Phạm Quốc Cường', company: 'Đại Học Quốc Tế Đông Á', phone: '0966778899', email: 'cuong.pq@easia.edu.vn', estimated_value: 350000000, stage: 'Contacted', assigned_to: 'Nguyễn Thanh Tùng', notes: 'Dự án phòng lab máy tính' }
  ],
  debt_payments: [
    { id: 'dp1', debt_id: 'd1', payment_code: 'TT-20260804', amount: 10000000, payment_method: 'Bank', note: 'Thanh toán đợt 1 tiền hàng Laptop XPS', created_at: '2026-08-04T11:00:00Z' }
  ],
  returns: [
    { id: 'ret1', return_code: 'TH20260801', order_code: 'HD20260801', customer_name: 'Công ty TNHH Công Nghệ Việt', total_refund: 2450000, refund_method: 'DebtDeduction', reason: 'Khách hàng đổi trả 1 Chuột MX Master 3S', created_at: '2026-08-07T15:20:00Z' }
  ],
  inbound_orders: [
    {
      id: 'inb_1',
      code: 'PR20260810-01',
      supplier_id: 'c4',
      supplier_name: 'Tổng Kho Linh Kiện Nam Sài Gòn',
      created_by: 'Kỹ thuật - Nguyễn Văn Kỷ',
      expected_date: '2026-08-15',
      status: 'Pending',
      notes: 'Nhập bổ sung linh kiện máy chủ Dell PowerEdge',
      total_amount: 62000000,
      created_at: '2026-08-10T14:00:00Z',
      items: [
        { product_id: 'p5', product_sku: 'SRV-SYS-01', product_name: 'Máy Chủ Server Dell PowerEdge T150', unit: 'Cái', expected_qty: 2, received_qty: 2, cost_price: 31000000, subtotal: 62000000 }
      ]
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

  ensureLocalStorageDb() {
    if (!localStorage.getItem(LOCAL_STORAGE_DB_KEY)) {
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

  // --- API METHODS ---

  // CUSTOMERS
  async getCustomers() {
    if (this.isLiveMode) {
      const { data, error } = await this.supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return this.getLocalStorageDb().customers;
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
    if (this.isLiveMode) {
      const { data, error } = await this.supabase.from('products').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return this.getLocalStorageDb().products;
  }

  async addProduct(product) {
    product.id = product.id || 'p_' + Date.now();
    product.sku = product.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000);
    product.cost_price = Number(product.cost_price) || 0;
    product.selling_price = Number(product.selling_price) || 0;
    product.stock_quantity = Number(product.stock_quantity) || 0;
    product.min_stock_alert = Number(product.min_stock_alert) || 5;

    const db = this.getLocalStorageDb();

    // Check duplicate SKU before adding
    const duplicateBySku = db.products.find(p => p.id !== product.id && (p.sku || '').toLowerCase() === (product.sku || '').toLowerCase());
    if (duplicateBySku) {
      throw new Error(`Mã SKU "${product.sku}" đã tồn tại trong kho (Sản phẩm: ${duplicateBySku.name})`);
    }

    let createdProd = product;

    if (this.isLiveMode) {
      const payload = prepareSupabasePayload(product);
      const { data, error } = await this.supabase.from('products').insert([payload]).select();
      if (error) {
        console.error('Supabase addProduct error:', error);
        if (error.code === '23505' || (error.message && error.message.toLowerCase().includes('unique'))) {
          throw new Error(`Mã SKU "${product.sku}" đã tồn tại trên cơ sở dữ liệu!`);
        }
        throw new Error(error.message || 'Không thể thêm sản phẩm vào Supabase');
      }
      if (data && data.length > 0) {
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
      await this.supabase.from('products').update(updates).eq('id', id);
    }
    const db = this.getLocalStorageDb();
    const idx = db.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      db.products[idx] = { ...db.products[idx], ...updates };
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
    orderData.order_code = orderData.order_code || 'HD' + new Date().toISOString().slice(0,10).replace(/-/g,'') + Math.floor(10 + Math.random() * 90);
    orderData.created_at = orderData.created_at || new Date().toISOString();

    let savedOrder = { ...orderData };

    if (isLive) {
      try {
        const orderPayload = prepareSupabasePayload({
          order_code: orderData.order_code,
          customer_id: isValidUUID(orderData.customer_id) ? orderData.customer_id : null,
          customer_name: orderData.customer_name,
          total_amount: Number(orderData.total_amount) || 0,
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

    savedOrder.items = items;
    if (!db.orders) db.orders = [];
    db.orders.unshift(savedOrder);

    // Stock deduction & Inventory log
    for (const item of items) {
      const prod = db.products.find(p => p.id === item.product_id || p.name === item.product_name || p.sku === item.product_sku);
      if (prod) {
        const oldStock = Number(prod.stock_quantity) || 0;
        const newStock = Math.max(0, oldStock - item.quantity);
        prod.stock_quantity = newStock;
        
        const txObj = {
          id: 'it_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          code: 'XK-' + Math.floor(1000 + Math.random() * 9000),
          type: 'StockOut',
          product_name: prod.name,
          quantity: item.quantity,
          previous_stock: oldStock,
          new_stock: newStock,
          reason: 'Xuất bán đơn hàng ' + savedOrder.order_code,
          created_at: new Date().toISOString()
        };

        if (!db.inventory_transactions) db.inventory_transactions = [];
        db.inventory_transactions.unshift(txObj);

        if (isLive) {
          try {
            if (isValidUUID(prod.id)) {
              await this.supabase.from('products').update({ stock_quantity: newStock }).eq('id', prod.id);
            }
            const txPayload = prepareSupabasePayload({
              code: txObj.code,
              type: txObj.type,
              product_id: isValidUUID(prod.id) ? prod.id : null,
              product_name: txObj.product_name,
              quantity: txObj.quantity,
              previous_stock: txObj.previous_stock,
              new_stock: txObj.new_stock,
              reason: txObj.reason,
              created_at: txObj.created_at
            });
            await this.supabase.from('inventory_transactions').insert([txPayload]);
          } catch (e) {
            console.error('Supabase inventory log error:', e);
          }
        }
      }

      // Order items insertion into Supabase
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

    // Debt creation if debt_amount > 0
    if (savedOrder.debt_amount > 0) {
      const debtObj = {
        id: 'd_' + Date.now(),
        code: 'CN-PT-' + Math.floor(100 + Math.random() * 900),
        customer_name: savedOrder.customer_name,
        order_id: savedOrder.id,
        order_code: savedOrder.order_code,
        items: items,
        type: 'Receivable',
        total_amount: Number(savedOrder.debt_amount),
        remaining_amount: Number(savedOrder.debt_amount),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'Unpaid',
        notes: 'Ghi nhận công nợ đơn ' + savedOrder.order_code,
        created_at: new Date().toISOString()
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
      const upfrontDpObj = {
        id: 'dp_pos_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        debt_id: savedOrder.debt_amount > 0 ? (debtObj ? debtObj.id : null) : null,
        customer_name: savedOrder.customer_name,
        payment_code: 'TT-POS-' + (savedOrder.order_code || Math.floor(100000 + Math.random() * 900000)),
        amount: Number(savedOrder.paid_amount),
        payment_method: savedOrder.payment_method === 'Debt' ? 'Bank' : (savedOrder.payment_method || 'Cash'),
        note: `Thanh toán (${savedOrder.payment_method === 'Bank' ? 'Chuyển Khoản' : 'Tiền Mặt'}) khi mua đơn hàng ${savedOrder.order_code}`,
        created_at: savedOrder.created_at || new Date().toISOString()
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

    // AUTO distribution across customer's open debt vouchers (FIFO)
    if ((debtId === 'AUTO' || debtId === 'ALL') && customerName) {
      let openDebts = [];
      if (isLive) {
        const { data } = await this.supabase.from('debts').select('*').eq('customer_name', customerName).gt('remaining_amount', 0);
        if (data && data.length > 0) {
          openDebts = data;
        } else {
          openDebts = (db.debts || []).filter(d => d.customer_name === customerName && Number(d.remaining_amount) > 0);
        }
      } else {
        openDebts = (db.debts || []).filter(d => d.customer_name === customerName && Number(d.remaining_amount) > 0);
      }
      openDebts.sort((a, b) => new Date(a.due_date || a.created_at || 0) - new Date(b.due_date || b.created_at || 0));

      let remainingPaymentToDistribute = amount;
      const paymentCode = 'TT-' + Math.floor(100000 + Math.random() * 900000);

      for (const debt of openDebts) {
        if (remainingPaymentToDistribute <= 0) break;

        const currentRem = Number(debt.remaining_amount) || 0;
        const payForThisDebt = Math.min(currentRem, remainingPaymentToDistribute);
        const newRemaining = Math.max(0, currentRem - payForThisDebt);
        debt.remaining_amount = newRemaining;
        remainingPaymentToDistribute -= payForThisDebt;

        debt.status = newRemaining === 0 ? 'Paid' : 'Partial';

        const localDebt = (db.debts || []).find(d => d.id === debt.id || d.code === debt.code);
        if (localDebt) {
          localDebt.remaining_amount = newRemaining;
          localDebt.status = debt.status;
        }

        const dpObj = {
          id: 'dp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          debt_id: debt.id,
          payment_code: paymentCode,
          amount: payForThisDebt,
          payment_method: paymentMethod || 'Bank',
          note: note || `Thanh toán công nợ (${debt.code})`,
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

      const cust = db.customers.find(c => c.name === customerName);
      if (cust) {
        if (cust.type === 'Supplier') {
          cust.current_debt = (Number(cust.current_debt) || 0) + amount;
        } else {
          cust.current_debt = Math.max(0, (Number(cust.current_debt) || 0) - amount);
        }
        if (isLive && isValidUUID(cust.id)) {
          await this.supabase.from('customers').update({ current_debt: cust.current_debt }).eq('id', cust.id);
        }
      }

      this.saveLocalStorageDb(db);
      return;
    }

    // Specific debt voucher payment (Full or Partial)
    let debt = (db.debts || []).find(d => d.id === debtId);
    let supaDebt = null;

    if (isLive) {
      const { data } = await this.supabase.from('debts').select('*').eq('id', debtId).single();
      if (data) supaDebt = data;
    }

    const currentRemaining = supaDebt ? Number(supaDebt.remaining_amount) : (debt ? Number(debt.remaining_amount) : amount);
    const newRemaining = Math.max(0, currentRemaining - amount);
    const status = newRemaining === 0 ? 'Paid' : 'Partial';

    if (debt) {
      debt.remaining_amount = newRemaining;
      debt.status = status;
    }

    const dpObj = {
      id: 'dp_' + Date.now(),
      debt_id: debtId,
      payment_code: 'TT-' + Math.floor(100000 + Math.random() * 900000),
      amount: amount,
      payment_method: paymentMethod || 'Bank',
      note: note || 'Thanh toán công nợ',
      created_at: new Date().toISOString()
    };

    if (!db.debt_payments) db.debt_payments = [];
    db.debt_payments.unshift(dpObj);

    const targetCustomerName = debt ? debt.customer_name : customerName;
    const cust = db.customers.find(c => c.name === targetCustomerName);
    if (cust) {
      const isReceivable = debt ? (debt.type === 'Receivable') : true;
      if (isReceivable) {
        cust.current_debt = Math.max(0, (Number(cust.current_debt) || 0) - amount);
      } else {
        cust.current_debt = (Number(cust.current_debt) || 0) + amount;
      }
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
    if (this.isLiveMode) {
      const { data, error } = await this.supabase.from('returns').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return this.getLocalStorageDb().returns || [];
  }

  // CUSTOMER COMPLETE HISTORY (360° LEDGER)
  async getCustomerHistory(customerName) {
    const orders = (await this.getOrders()).filter(o => o.customer_name === customerName);
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
      returns,
      debts,
      payments: Array.from(paymentMap.values())
    };
  }

  async createSalesReturn(returnData, itemsToReturn) {
    returnData.id = returnData.id || 'ret_' + Date.now();
    returnData.return_code = returnData.return_code || ('TH' + new Date().toISOString().slice(0,10).replace(/-/g,'') + Math.floor(10 + Math.random() * 90));
    returnData.created_at = new Date().toISOString();

    const db = this.getLocalStorageDb();
    if (!db.returns) db.returns = [];
    db.returns.unshift(returnData);

    // 1. Restore Stock in Products
    itemsToReturn.forEach(item => {
      const prod = db.products.find(p => p.id === item.product_id || p.name === item.product_name);
      if (prod) {
        const prevStock = prod.stock_quantity;
        prod.stock_quantity += item.quantity;

        // Log StockIn transaction
        db.inventory_transactions.unshift({
          id: 'it_' + Date.now() + '_' + Math.random(),
          code: 'NK-TH-' + Math.floor(1000 + Math.random() * 9000),
          type: 'StockIn',
          product_name: prod.name,
          quantity: item.quantity,
          previous_stock: prevStock,
          new_stock: prod.stock_quantity,
          reason: `Khách hàng trả hàng đơn ${returnData.order_code} (${returnData.reason || 'Khách trả hàng'})`,
          created_at: new Date().toISOString()
        });
      }
    });

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

    if (this.isLiveMode) {
      try {
        for (const item of itemsToReturn) {
          const prod = db.products.find(p => p.id === item.product_id || p.name === item.product_name);
          if (prod && isValidUUID(prod.id)) {
            await this.supabase.from('products').update({ stock_quantity: prod.stock_quantity }).eq('id', prod.id);
          }
        }
      } catch (e) {
        console.error('Supabase update stock error on return:', e);
      }
    }

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

    const db = this.getLocalStorageDb();
    let prod = db.products.find(p => p.id === productId);

    if (this.isLiveMode) {
      try {
        const { data: supaProd } = await this.supabase.from('products').select('*').eq('id', productId).single();
        if (supaProd) {
          prev = supaProd.stock_quantity || 0;
          next = type === 'StockIn' ? prev + qty : Math.max(0, prev - qty);
          prodName = supaProd.name;

          await this.supabase.from('products').update({ stock_quantity: next }).eq('id', productId);

          const txPayload = prepareSupabasePayload({
            code: (type === 'StockIn' ? 'NK-' : 'XK-') + Math.floor(1000 + Math.random() * 9000),
            type: type,
            product_id: productId,
            product_name: prodName,
            quantity: qty,
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
      prev = prod.stock_quantity;
      next = type === 'StockIn' ? prev + qty : Math.max(0, prev - qty);
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
        quantity: qty,
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
    if (this.isLiveMode) {
      try {
        const { data, error } = await this.supabase.from('inbound_orders').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(row => {
            let parsedItems = row.items;
            if (typeof parsedItems === 'string') {
              try { parsedItems = JSON.parse(parsedItems); } catch (e) { parsedItems = []; }
            }
            if (!Array.isArray(parsedItems)) parsedItems = [];
            return {
              ...row,
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
    const localData = this.getLocalStorageDb().inbound_orders || [];
    return localData.map(row => {
      let parsedItems = row.items;
      if (typeof parsedItems === 'string') {
        try { parsedItems = JSON.parse(parsedItems); } catch (e) { parsedItems = []; }
      }
      return { ...row, items: Array.isArray(parsedItems) ? parsedItems : [] };
    });
  }

  async createInboundOrder(orderData, items) {
    const isLive = this.isLiveMode;
    const db = this.getLocalStorageDb();

    orderData.id = orderData.id || 'inb_' + Date.now();
    orderData.code = orderData.code || ('PR' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(10 + Math.random() * 90));
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
          const { data: custCheck } = await this.supabase.from('customers').select('id').eq('id', orderData.supplier_id);
          if (custCheck && custCheck.length > 0) {
            supplierUuid = orderData.supplier_id;
          }
        }

        const payload = prepareSupabasePayload({
          code: orderData.code,
          supplier_id: supplierUuid,
          supplier_name: orderData.supplier_name,
          created_by: orderData.created_by,
          expected_date: orderData.expected_date ? orderData.expected_date : null,
          status: orderData.status,
          total_amount: Number(orderData.total_amount) || 0,
          notes: orderData.notes || '',
          items: orderData.items,
          created_at: orderData.created_at
        });

        const { data, error } = await this.supabase.from('inbound_orders').insert([payload]).select();
        if (error) {
          console.error('Supabase createInboundOrder initial insert error:', error);
          if (error.code === '23503') {
            // Foreign key constraint violation retry without supplier_id
            delete payload.supplier_id;
            const { data: fbData, error: fbErr } = await this.supabase.from('inbound_orders').insert([payload]).select();
            if (!fbErr && fbData && fbData.length > 0) {
              savedOrder = { ...savedOrder, ...fbData[0] };
            }
          } else if (error.message && error.message.includes('items')) {
            payload.items = JSON.stringify(orderData.items);
            const { data: fbData, error: fbErr } = await this.supabase.from('inbound_orders').insert([payload]).select();
            if (!fbErr && fbData && fbData.length > 0) {
              savedOrder = { ...savedOrder, ...fbData[0] };
            }
          } else if (error.code === '42P01' || (error.message && error.message.includes('inbound_orders'))) {
            if (typeof showToast === 'function') {
              showToast('Lưu ý Supabase: Chưa tạo bảng inbound_orders! Vui lòng thực thi SQL script config/supabase-schema.sql trên Supabase Dashboard.', 'warning', 8000);
            }
          } else {
            if (typeof showToast === 'function') {
              showToast('Lỗi lưu Supabase: ' + (error.message || 'Không thể ghi dữ liệu'), 'danger');
            }
          }
        } else if (data && data.length > 0) {
          savedOrder = { ...savedOrder, ...data[0] };
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

  async fulfillInboundOrder(inboundId, itemsWithReceivedQty, receivedBy, notes) {
    const isLive = this.isLiveMode;
    const db = this.getLocalStorageDb();

    const inbound = (db.inbound_orders || []).find(o => o.id === inboundId);
    if (!inbound) throw new Error('Không tìm thấy phiếu Inbound!');

    inbound.status = 'Received';
    inbound.received_by = receivedBy || 'Kho';
    inbound.received_at = new Date().toISOString();
    if (notes) inbound.notes = (inbound.notes ? inbound.notes + ' | ' : '') + notes;

    let grandTotal = 0;

    // Update items with actual received quantities
    inbound.items = (itemsWithReceivedQty || inbound.items).map(item => {
      const recQty = Number(item.received_qty) >= 0 ? Number(item.received_qty) : Number(item.expected_qty || 0);
      const cost = Number(item.cost_price) || 0;
      const subtotal = recQty * cost;
      grandTotal += subtotal;

      // Update product stock in db.products
      const prod = db.products.find(p => p.id === item.product_id || p.sku === item.product_sku || p.name === item.product_name);
      if (prod) {
        const prevStock = Number(prod.stock_quantity) || 0;
        const newStock = prevStock + recQty;
        prod.stock_quantity = newStock;

        // Record stock transaction in Thẻ Kho
        if (!db.inventory_transactions) db.inventory_transactions = [];
        db.inventory_transactions.unshift({
          id: 'it_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          code: 'NK-' + inbound.code,
          type: 'StockIn',
          product_name: prod.name,
          quantity: recQty,
          previous_stock: prevStock,
          new_stock: newStock,
          reason: `Kế thừa nhập kho từ đơn Inbound ${inbound.code} (NCC: ${inbound.supplier_name})`,
          created_at: new Date().toISOString()
        });

        if (isLive && isValidUUID(prod.id)) {
          this.supabase.from('products').update({ stock_quantity: newStock }).eq('id', prod.id).then();
        }
      }

      return {
        ...item,
        received_qty: recQty,
        subtotal: subtotal
      };
    });

    inbound.total_amount = grandTotal;

    // Create Payable Debt for Supplier if total > 0
    if (grandTotal > 0) {
      const debtObj = {
        id: 'd_' + Date.now(),
        code: 'CN-TRA-' + Math.floor(100 + Math.random() * 900),
        customer_name: inbound.supplier_name,
        order_code: inbound.code,
        items: inbound.items,
        type: 'Payable',
        total_amount: grandTotal,
        remaining_amount: grandTotal,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'Unpaid',
        notes: `Nợ tiền hàng nhập từ đơn Inbound ${inbound.code}`,
        created_at: new Date().toISOString()
      };

      if (!db.debts) db.debts = [];
      db.debts.unshift(debtObj);

      const supplier = db.customers.find(c => c.name === inbound.supplier_name);
      if (supplier) {
        supplier.current_debt = (Number(supplier.current_debt) || 0) - grandTotal;
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
          this.supabase.from('debts').insert([debtPayload]).then();
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

    const inbound = (db.inbound_orders || []).find(o => o.id === inboundId);
    if (inbound) {
      inbound.status = 'Cancelled';
      if (isLive) {
        let cancelQuery = this.supabase.from('inbound_orders').update({ status: 'Cancelled' });
        if (isValidUUID(inbound.id)) {
          cancelQuery = cancelQuery.eq('id', inbound.id);
        } else {
          cancelQuery = cancelQuery.eq('code', inbound.code);
        }
        cancelQuery.then();
      }
      this.saveLocalStorageDb(db);
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

  async updateLeadStage(id, stage) {
    if (this.isLiveMode) {
      await this.supabase.from('leads').update({ stage }).eq('id', id);
    }
    const db = this.getLocalStorageDb();
    const lead = db.leads.find(l => l.id === id);
    if (lead) {
      lead.stage = stage;
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
}

// Global Export
window.dbProvider = new SupabaseProvider();
