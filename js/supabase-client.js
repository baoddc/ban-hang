/* =======================================================
   SUPABASE CLIENT & DUAL-ENGINE DATABASE PROVIDER
   ======================================================= */

const SUPABASE_CONFIG_KEY = 'ERP_SUPABASE_CONFIG';
const LOCAL_STORAGE_DB_KEY = 'ERP_LOCAL_DATABASE_V1';

// Default preset rules for Shipping Fee (Empty start)
const DEFAULT_SHIPPING_RULES_PRESET = [];

// Default initial data for enterprise fallback (Empty start)
const DEFAULT_INITIAL_DATA = {
  customers: [],
  products: [],
  orders: [],
  debts: [],
  inventory_transactions: [],
  leads: [],
  debt_payments: [],
  returns: [],
  inbound_orders: [],
  shipping_rules: [],
  product_samples: []
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
            } catch (oe) {}
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
            } catch (ie) {}
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
        } catch (oe) {}
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
        } catch (ie) {}
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
    returnData.return_code = returnData.return_code || ('TH' + new Date().toISOString().slice(0,10).replace(/-/g,'') + Math.floor(10 + Math.random() * 90));
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
    orderData.code = orderData.code || ('PR' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(1000 + Math.random() * 9000));
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
            } catch(e) {}
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
            payload.code = 'PR' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Date.now().toString().slice(-4) + Math.floor(10 + Math.random() * 90);
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
          } catch(e) {}
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
            } catch (e) {}
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
    } catch (e) {}
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
    } catch (e) {}
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

