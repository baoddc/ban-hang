/* =======================================================
   SUPABASE CLIENT & DUAL-ENGINE DATABASE PROVIDER
   ======================================================= */

const SUPABASE_CONFIG_KEY = 'ERP_SUPABASE_CONFIG';
const LOCAL_STORAGE_DB_KEY = 'ERP_LOCAL_DATABASE_V1';

// Default initial data for enterprise fallback
const DEFAULT_INITIAL_DATA = {
  customers: [
    { id: 'c1', code: 'KH001', name: 'Công ty TNHH Công Nghệ Việt', phone: '0901234567', email: 'contact@viettech.com', address: '123 Lê Lợi, Q.1, TP.HCM', type: 'Customer', group_name: 'VIP', current_debt: 15500000, route: 'Tuyến Q.1 - Q.3', sales_person: 'Nguyễn Thanh Tùng', created_at: '2026-08-01' },
    { id: 'c2', code: 'KH002', name: 'Tập đoàn Bán Lẻ An Phát', phone: '0912345678', email: 'purchasing@anphat.vn', address: '456 Nguyễn Huệ, Q.1, TP.HCM', type: 'Customer', group_name: 'Đại lý', current_debt: 42000000, route: 'Tuyến Q.1 - Phố Đi Bộ', sales_person: 'Lê Thu Hà', created_at: '2026-08-02' },
    { id: 'c3', code: 'KH003', name: 'Cửa Hàng Điện Máy Minh Khoa', phone: '0987654321', email: 'minhkhoa@gmail.com', address: '789 Trần Hưng Đạo, Q.5, TP.HCM', type: 'Customer', group_name: 'Khách thường', current_debt: 0, route: 'Tuyến Q.5 - Chợ Lớn', sales_person: 'Trần Văn Nam', created_at: '2026-08-05' },
    { id: 'c4', code: 'NCC01', name: 'Tổng Kho Linh Kiện Nam Sài Gòn', phone: '02838999888', email: 'sale@namsaigon.com', address: '12 KCN Tân Bình, TP.HCM', type: 'Supplier', group_name: 'Đại lý', current_debt: -28000000, route: 'Tuyến Tân Bình - Hóc Môn', sales_person: 'Nguyễn Thanh Tùng', created_at: '2026-08-03' }
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
  ]
};

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
    customer.created_at = new Date().toISOString();

    if (this.isLiveMode) {
      const { data, error } = await this.supabase.from('customers').insert([customer]).select();
      if (!error && data) return data[0];
    }
    
    const db = this.getLocalStorageDb();
    db.customers.unshift(customer);
    this.saveLocalStorageDb(db);
    return customer;
  }

  async updateCustomer(id, updates) {
    if (this.isLiveMode) {
      await this.supabase.from('customers').update(updates).eq('id', id);
    }
    const db = this.getLocalStorageDb();
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
    
    if (this.isLiveMode) {
      const { data, error } = await this.supabase.from('products').insert([product]).select();
      if (!error && data) return data[0];
    }

    const db = this.getLocalStorageDb();
    db.products.unshift(product);
    this.saveLocalStorageDb(db);
    return product;
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
      const { data, error } = await this.supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return this.getLocalStorageDb().orders;
  }

  async createOrder(orderData, items) {
    orderData.id = orderData.id || 'o_' + Date.now();
    orderData.order_code = orderData.order_code || 'HD' + new Date().toISOString().slice(0,10).replace(/-/g,'') + Math.floor(10 + Math.random() * 90);
    orderData.created_at = new Date().toISOString();

    if (this.isLiveMode) {
      await this.supabase.from('orders').insert([orderData]);
    }

    orderData.items = items;
    const db = this.getLocalStorageDb();
    db.orders.unshift(orderData);

    // Stock deduction & Debt creation
    items.forEach(item => {
      const prod = db.products.find(p => p.id === item.product_id || p.name === item.product_name);
      if (prod) {
        const oldStock = prod.stock_quantity;
        prod.stock_quantity = Math.max(0, prod.stock_quantity - item.quantity);
        
        // Log inventory transaction
        db.inventory_transactions.unshift({
          id: 'it_' + Date.now() + '_' + Math.random(),
          code: 'XK-' + Math.floor(1000 + Math.random() * 9000),
          type: 'StockOut',
          product_name: prod.name,
          quantity: item.quantity,
          previous_stock: oldStock,
          new_stock: prod.stock_quantity,
          reason: 'Xuất bán đơn hàng ' + orderData.order_code,
          created_at: new Date().toISOString()
        });
      }
    });

    if (orderData.debt_amount > 0) {
      db.debts.unshift({
        id: 'd_' + Date.now(),
        code: 'CN-PT-' + Math.floor(100 + Math.random() * 900),
        customer_name: orderData.customer_name,
        order_id: orderData.id,
        order_code: orderData.order_code,
        items: items,
        type: 'Receivable',
        total_amount: orderData.debt_amount,
        remaining_amount: orderData.debt_amount,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'Unpaid',
        notes: 'Ghi nhận công nợ đơn ' + orderData.order_code
      });

      // Update customer balance
      const cust = db.customers.find(c => c.name === orderData.customer_name);
      if (cust) {
        cust.current_debt = (cust.current_debt || 0) + orderData.debt_amount;
      }
    }

    this.saveLocalStorageDb(db);
    return orderData;
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

    // AUTO distribution across customer's open debt vouchers (FIFO)
    if ((debtId === 'AUTO' || debtId === 'ALL') && customerName) {
      const openDebts = db.debts
        .filter(d => d.customer_name === customerName && d.remaining_amount > 0)
        .sort((a, b) => new Date(a.due_date || a.created_at || 0) - new Date(b.due_date || b.created_at || 0));

      let remainingPaymentToDistribute = amount;
      const paymentCode = 'TT-' + Math.floor(100000 + Math.random() * 900000);

      for (const debt of openDebts) {
        if (remainingPaymentToDistribute <= 0) break;

        const payForThisDebt = Math.min(debt.remaining_amount, remainingPaymentToDistribute);
        debt.remaining_amount -= payForThisDebt;
        remainingPaymentToDistribute -= payForThisDebt;

        if (debt.remaining_amount === 0) {
          debt.status = 'Paid';
        } else {
          debt.status = 'Partial';
        }

        if (!db.debt_payments) db.debt_payments = [];
        db.debt_payments.unshift({
          id: 'dp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          debt_id: debt.id,
          payment_code: paymentCode,
          amount: payForThisDebt,
          payment_method: paymentMethod || 'Bank',
          note: note || `Thanh toán công nợ (${debt.code})`,
          created_at: new Date().toISOString()
        });
      }

      const cust = db.customers.find(c => c.name === customerName);
      if (cust) {
        if (cust.type === 'Supplier') {
          cust.current_debt = (cust.current_debt || 0) + amount;
        } else {
          cust.current_debt = Math.max(0, (cust.current_debt || 0) - amount);
        }
      }

      this.saveLocalStorageDb(db);
      return;
    }

    // Specific debt voucher payment (Full or Partial)
    const debt = db.debts.find(d => d.id === debtId);
    if (debt) {
      debt.remaining_amount = Math.max(0, debt.remaining_amount - amount);
      if (debt.remaining_amount === 0) {
        debt.status = 'Paid';
      } else {
        debt.status = 'Partial';
      }

      if (!db.debt_payments) db.debt_payments = [];
      db.debt_payments.unshift({
        id: 'dp_' + Date.now(),
        debt_id: debtId,
        payment_code: 'TT-' + Math.floor(100000 + Math.random() * 900000),
        amount: amount,
        payment_method: paymentMethod || 'Bank',
        note: note || 'Thanh toán công nợ',
        created_at: new Date().toISOString()
      });

      const cust = db.customers.find(c => c.name === debt.customer_name);
      if (cust) {
        if (debt.type === 'Receivable') {
          cust.current_debt = Math.max(0, (cust.current_debt || 0) - amount);
        } else {
          cust.current_debt = (cust.current_debt || 0) + amount;
        }
      }
      this.saveLocalStorageDb(db);
    }
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
    
    // Aggregate payments for this customer's debts
    const db = this.getLocalStorageDb();
    const customerDebtIds = debts.map(d => d.id);
    const payments = (db.debt_payments || []).filter(p => customerDebtIds.includes(p.debt_id) || p.customer_name === customerName);

    return {
      orders,
      returns,
      debts,
      payments
    };
  }

  async createSalesReturn(returnData, itemsToReturn) {
    returnData.id = returnData.id || 'ret_' + Date.now();
    returnData.return_code = returnData.return_code || 'TH' + new Date().toISOString().slice(0,10).replace(/-/g,'') + Math.floor(10 + Math.random() * 90);
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
      if (cust && returnData.refund_method === 'DebtDeduction') {
        cust.current_debt = Math.max(0, (cust.current_debt || 0) - returnData.total_refund);
      }

      // Find open receivable debt for this customer
      const customerDebts = (db.debts || []).filter(d => d.customer_name === returnData.customer_name && d.type === 'Receivable');
      let targetDebt = customerDebts.find(d => d.remaining_amount > 0);

      if (returnData.refund_method === 'DebtDeduction') {
        let remainingRefundToDistribute = returnData.total_refund;
        const openDebts = customerDebts
          .filter(d => d.remaining_amount > 0)
          .sort((a, b) => new Date(a.due_date || a.created_at || 0) - new Date(b.due_date || b.created_at || 0));

        for (const debt of openDebts) {
          if (remainingRefundToDistribute <= 0) break;
          const deductAmount = Math.min(debt.remaining_amount, remainingRefundToDistribute);
          debt.remaining_amount -= deductAmount;
          remainingRefundToDistribute -= deductAmount;
          debt.status = debt.remaining_amount === 0 ? 'Paid' : 'Partial';
        }
      }

      // Record in debt_payments history
      if (!db.debt_payments) db.debt_payments = [];
      db.debt_payments.unshift({
        id: 'dp_ret_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        debt_id: targetDebt ? targetDebt.id : (customerDebts[0] ? customerDebts[0].id : 'd_ret_' + Date.now()),
        customer_name: returnData.customer_name,
        payment_code: 'TH-' + (returnData.return_code || Math.floor(100000 + Math.random() * 900000)),
        amount: returnData.total_refund,
        payment_method: returnData.refund_method || 'DebtDeduction',
        note: `Trừ công nợ phiếu trả hàng (${returnData.return_code || 'Trả hàng'}): ${returnData.reason || 'Khách đổi trả hàng'}`,
        created_at: returnData.created_at || new Date().toISOString()
      });
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
    const db = this.getLocalStorageDb();
    const prod = db.products.find(p => p.id === productId);
    if (prod) {
      const prev = prod.stock_quantity;
      const next = type === 'StockIn' ? prev + qty : Math.max(0, prev - qty);
      prod.stock_quantity = next;

      db.inventory_transactions.unshift({
        id: 'it_' + Date.now(),
        code: (type === 'StockIn' ? 'NK-' : 'XK-') + Math.floor(1000 + Math.random() * 9000),
        type: type,
        product_name: prod.name,
        quantity: qty,
        previous_stock: prev,
        new_stock: next,
        reason: reason || (type === 'StockIn' ? 'Nhập bổ sung kho' : 'Xuất hủy / Chuyển kho'),
        created_at: new Date().toISOString()
      });

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
    
    if (this.isLiveMode) {
      const { data, error } = await this.supabase.from('leads').insert([lead]).select();
      if (!error && data) return data[0];
    }

    const db = this.getLocalStorageDb();
    db.leads.unshift(lead);
    this.saveLocalStorageDb(db);
    return lead;
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
