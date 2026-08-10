/* =======================================================
   SALES & POS SYSTEM LOGIC (SALES.JS)
   ======================================================= */

let allProducts = [];
let allCustomers = [];
let currentCart = [];
let activeCategory = 'All';

document.addEventListener('DOMContentLoaded', async () => {
  await initPosData();
});

async function initPosData() {
  if (!window.dbProvider) return;

  allProducts = await window.dbProvider.getProducts();
  allCustomers = await window.dbProvider.getCustomers();

  renderCustomerSelect();
  renderCategoryPills();
  renderProductsGrid(allProducts);
}

function renderCustomerSelect() {
  const select = document.getElementById('pos-customer-select');
  if (!select) return;

  select.innerHTML = allCustomers.map(c => `
    <option value="${c.id}" data-name="${c.name}">${c.code} - ${c.name} (${c.group_name})</option>
  `).join('');
}

function renderCategoryPills() {
  const container = document.getElementById('category-pills');
  if (!container) return;

  const categories = ['All', ...new Set(allProducts.map(p => p.category || 'Khác'))];
  container.innerHTML = categories.map(cat => `
    <button class="pill ${cat === activeCategory ? 'active' : ''}" onclick="filterCategory('${cat}')">${cat === 'All' ? 'Tất cả' : cat}</button>
  `).join('');
}

function filterCategory(category) {
  activeCategory = category;
  renderCategoryPills();
  filterPosCatalog();
}

function filterPosCatalog() {
  const search = document.getElementById('pos-search-input').value.toLowerCase().trim();
  const filtered = allProducts.filter(p => {
    const matchCat = activeCategory === 'All' || (p.category || 'Khác') === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search);
    return matchCat && matchSearch;
  });
  renderProductsGrid(filtered);
}

function renderProductsGrid(products) {
  const grid = document.getElementById('pos-products-grid');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-subtle);">Không tìm thấy sản phẩm nào</div>`;
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="product-pos-card" onclick="addToCart('${p.id}')">
      <div>
        <span class="product-sku">${p.sku}</span>
        <div class="product-name">${p.name}</div>
      </div>
      <div>
        <div class="product-stock">Kho: <strong>${p.stock_quantity} ${p.unit}</strong></div>
        <div class="product-price">${formatVND(p.selling_price)}</div>
      </div>
    </div>
  `).join('');
}

// CART MANAGEMENT
function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  if (product.stock_quantity <= 0) {
    showToast('Sản phẩm đã hết hàng trong kho!', 'danger');
    return;
  }

  const existing = currentCart.find(item => item.product_id === product.id);
  if (existing) {
    if (existing.quantity >= product.stock_quantity) {
      showToast(`Số lượng vượt quá tồn kho hiện tại (${product.stock_quantity})!`, 'warning');
      return;
    }
    existing.quantity += 1;
    existing.subtotal = existing.quantity * existing.unit_price;
  } else {
    currentCart.push({
      product_id: product.id,
      product_sku: product.sku,
      product_name: product.name,
      unit_price: product.selling_price,
      quantity: 1,
      subtotal: product.selling_price
    });
  }

  renderCartItems();
}

function updateCartQty(productId, delta) {
  const item = currentCart.find(i => i.product_id === productId);
  const product = allProducts.find(p => p.id === productId);
  if (!item || !product) return;

  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    removeFromCart(productId);
    return;
  }

  if (newQty > product.stock_quantity) {
    showToast(`Số lượng tối đa trong kho là ${product.stock_quantity}!`, 'warning');
    return;
  }

  item.quantity = newQty;
  item.subtotal = item.quantity * item.unit_price;
  renderCartItems();
}

function removeFromCart(productId) {
  currentCart = currentCart.filter(i => i.product_id !== productId);
  renderCartItems();
}

function clearCart() {
  currentCart = [];
  renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById('cart-items-container');
  if (!container) return;

  if (currentCart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-state">
        <i class="bi bi-cart-x"></i>
        <p>Chưa có sản phẩm nào trong giỏ hàng</p>
      </div>
    `;
    calculateCartTotals();
    return;
  }

  container.innerHTML = currentCart.map(item => `
    <div class="cart-item">
      <div>
        <div class="cart-item-title">${item.product_name}</div>
        <div class="cart-item-price">${formatVND(item.unit_price)} × ${item.quantity}</div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" onclick="updateCartQty('${item.product_id}', -1)">-</button>
        <span style="font-weight:700; width:20px; text-align:center;">${item.quantity}</span>
        <button class="qty-btn" onclick="updateCartQty('${item.product_id}', 1)">+</button>
        <button class="qty-btn" style="color:var(--danger);" onclick="removeFromCart('${item.product_id}')">&times;</button>
      </div>
    </div>
  `).join('');

  calculateCartTotals();
}

function handlePaymentMethodChange() {
  const method = document.getElementById('payment-method-select').value;
  const paidRow = document.getElementById('paid-amount-row');
  const paidInput = document.getElementById('paid-amount-input');
  
  if (method === 'Debt') {
    paidInput.value = '0';
  } else {
    const subtotal = currentCart.reduce((s, i) => s + i.subtotal, 0);
    const discount = parseFormattedNumber(document.getElementById('summary-discount').value);
    paidInput.value = formatNumberWithDots(Math.max(0, subtotal - discount));
  }
  calculateCartTotals();
}

function calculateCartTotals() {
  const subtotal = currentCart.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = parseFormattedNumber(document.getElementById('summary-discount').value);
  const finalTotal = Math.max(0, subtotal - discount);

  const method = document.getElementById('payment-method-select').value;
  const paidInput = document.getElementById('paid-amount-input');
  
  if (method !== 'Debt' && parseFormattedNumber(paidInput.value) === 0 && finalTotal > 0) {
    paidInput.value = formatNumberWithDots(finalTotal);
  }

  const paidAmount = parseFormattedNumber(paidInput.value);
  const debtAmount = Math.max(0, finalTotal - paidAmount);

  document.getElementById('summary-subtotal').textContent = formatVND(subtotal);
  document.getElementById('summary-final-total').textContent = formatVND(finalTotal);

  const debtWarningRow = document.getElementById('debt-warning-row');
  if (debtAmount > 0) {
    debtWarningRow.style.display = 'flex';
    document.getElementById('summary-debt-amount').textContent = formatVND(debtAmount);
  } else {
    debtWarningRow.style.display = 'none';
  }
}

async function processCheckout() {
  if (currentCart.length === 0) {
    showToast('Vui lòng chọn sản phẩm vào giỏ hàng!', 'warning');
    return;
  }

  const customerSelect = document.getElementById('pos-customer-select');
  const customerName = customerSelect.options[customerSelect.selectedIndex].getAttribute('data-name');
  
  const subtotal = currentCart.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = parseFormattedNumber(document.getElementById('summary-discount').value);
  const finalTotal = Math.max(0, subtotal - discount);
  const method = document.getElementById('payment-method-select').value;
  const paidAmount = parseFormattedNumber(document.getElementById('paid-amount-input').value);
  const debtAmount = Math.max(0, finalTotal - paidAmount);

  const orderData = {
    customer_name: customerName,
    total_amount: subtotal,
    discount: discount,
    tax: 0,
    final_amount: finalTotal,
    paid_amount: paidAmount,
    debt_amount: debtAmount,
    status: 'Completed',
    payment_method: method,
    notes: 'Bán tại quầy POS'
  };

  const createdOrder = await window.dbProvider.createOrder(orderData, currentCart);
  showToast(`Đã thanh toán thành công đơn hàng ${createdOrder.order_code}!`, 'success');

  // Render Printable Receipt Modal
  renderPrintableReceipt(createdOrder, currentCart);
  openModal('invoice-modal');

  // Reset cart & refresh product list
  clearCart();
  await initPosData();
}

function renderPrintableReceipt(order, items) {
  const container = document.getElementById('invoice-print-area');
  if (!container) return;

  container.innerHTML = `
    <div class="invoice-receipt">
      <div class="receipt-header">
        <h2 style="margin-bottom: 4px;">APEX ENTERPRISE POS</h2>
        <p style="font-size: 0.8rem;">123 Lê Lợi, Quận 1, TP.HCM | Hotline: 1900 8888</p>
        <h3 style="margin-top: 10px;">HÓA ĐƠN BÁN HÀNG</h3>
        <p style="font-size: 0.8rem;">Mã Đơn: <strong>${order.order_code}</strong></p>
        <p style="font-size: 0.8rem;">Ngày: ${new Date().toLocaleString('vi-VN')}</p>
        <p style="font-size: 0.8rem;">Khách hàng: <strong>${order.customer_name}</strong></p>
      </div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th>Tên Sản Phẩm</th>
            <th>SL</th>
            <th>Thành Tiền</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(i => `
            <tr>
              <td>${i.product_name}</td>
              <td>${i.quantity}</td>
              <td>${formatVND(i.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="border-top: 1px dashed #000; padding-top: 8px; font-size: 0.85rem;">
        <div style="display:flex; justify-content:space-between;">
          <span>Tạm tính:</span>
          <span>${formatVND(order.total_amount)}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>Giảm giá:</span>
          <span>-${formatVND(order.discount)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1rem; margin-top:4px;">
          <span>TỔNG CỘNG:</span>
          <span>${formatVND(order.final_amount)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:4px;">
          <span>Khách thanh toán:</span>
          <span>${formatVND(order.paid_amount)}</span>
        </div>
        ${order.debt_amount > 0 ? `
          <div style="display:flex; justify-content:space-between; color:red; font-weight:bold;">
            <span>Còn Nợ Lại:</span>
            <span>${formatVND(order.debt_amount)}</span>
          </div>
        ` : ''}
      </div>

      <div style="text-align:center; margin-top: 16px; font-size: 0.75rem;">
        <p>Cảm ơn quý khách và hẹn gặp lại!</p>
      </div>
    </div>
  `;
}

async function openOrdersHistoryModal() {
  const orders = await window.dbProvider.getOrders();
  const tbody = document.getElementById('history-orders-tbody');
  if (!tbody) return;

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.order_code}</strong></td>
      <td>${o.customer_name}</td>
      <td style="font-weight:700;">${formatVND(o.final_amount)}</td>
      <td style="color:var(--success);">${formatVND(o.paid_amount)}</td>
      <td style="color:var(--danger);">${formatVND(o.debt_amount)}</td>
      <td><span class="badge badge-info">${o.payment_method}</span></td>
      <td>
        <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="reprintOrder('${o.order_code}')">
          <i class="bi bi-printer"></i> In lại
        </button>
        <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;" onclick="openReturnsModalForOrder('${o.order_code}')">
          <i class="bi bi-arrow-counterclockwise"></i> Trả hàng
        </button>
      </td>
    </tr>
  `).join('');

  openModal('orders-history-modal');
}

async function reprintOrder(orderCode) {
  const orders = await window.dbProvider.getOrders();
  const order = orders.find(o => o.order_code === orderCode);
  if (order) {
    renderPrintableReceipt(order, [{ product_name: 'Chi tiết đơn hàng ' + orderCode, quantity: 1, subtotal: order.final_amount }]);
    openModal('invoice-modal');
  }
}

// SALES RETURNS LOGIC
async function openReturnsModal(targetCustomerName = null) {
  if (!allCustomers || allCustomers.length === 0) {
    allCustomers = await window.dbProvider.getCustomers();
  }
  const customerSelect = document.getElementById('return-customer-select');
  if (!customerSelect) return;

  customerSelect.innerHTML = allCustomers.map(c => `
    <option value="${c.name}" data-id="${c.id}">${c.code} - ${c.name} (${c.group_name})</option>
  `).join('');

  if (targetCustomerName) {
    customerSelect.value = targetCustomerName;
  }

  await onReturnCustomerChange();
  openModal('return-modal');
}

async function openReturnsModalForOrder(orderCode) {
  closeModal('orders-history-modal');
  const orders = await window.dbProvider.getOrders();
  const order = orders.find(o => o.order_code === orderCode);
  const customerName = order ? order.customer_name : null;
  await openReturnsModal(customerName);
}

async function onReturnCustomerChange() {
  const customerSelect = document.getElementById('return-customer-select');
  const productSelect = document.getElementById('return-product-select');
  if (!customerSelect || !productSelect) return;

  const customerName = customerSelect.value;
  const orders = await window.dbProvider.getOrders();
  const custOrders = orders.filter(o => o.customer_name === customerName);

  const purchasedMap = new Map();
  custOrders.forEach(order => {
    (order.items || []).forEach(item => {
      if (item.product_id || item.product_name) {
        const key = item.product_id || item.product_name;
        if (!purchasedMap.has(key)) {
          purchasedMap.set(key, {
            product_id: item.product_id,
            product_name: item.product_name,
            product_sku: item.product_sku || '',
            unit_price: item.unit_price || 0,
            total_qty: 0,
            last_order_code: order.order_code
          });
        }
        purchasedMap.get(key).total_qty += (item.quantity || 1);
      }
    });
  });

  if (purchasedMap.size === 0) {
    productSelect.innerHTML = `<option value="">(Khách hàng chưa có lịch sử mua hàng)</option>`;
    document.getElementById('return-refund-input').value = 0;
  } else {
    const purchasedProducts = Array.from(purchasedMap.values());
    productSelect.innerHTML = purchasedProducts.map(p => `
      <option value="${p.product_id || ''}" data-name="${p.product_name}" data-price="${p.unit_price}" data-order="${p.last_order_code}">
        ${p.product_sku ? p.product_sku + ' - ' : ''}${p.product_name} (${formatVND(p.unit_price)}) - Đã mua tổng: ${p.total_qty}
      </option>
    `).join('');
  }

  calculateReturnRefund();
}

function calculateReturnRefund() {
  const productSelect = document.getElementById('return-product-select');
  const refundInput = document.getElementById('return-refund-input');
  if (!productSelect || !refundInput) return;

  const selectedOpt = productSelect.options[productSelect.selectedIndex];
  if (!selectedOpt || !productSelect.value) {
    refundInput.value = '0';
    return;
  }

  const price = parseFloat(selectedOpt.getAttribute('data-price')) || 0;
  const qty = parseFormattedNumber(document.getElementById('return-qty-input').value) || 1;

  refundInput.value = formatNumberWithDots(price * qty);
}

async function submitSalesReturn() {
  const customerSelect = document.getElementById('return-customer-select');
  if (!customerSelect) return;
  const customerName = customerSelect.value;

  const productSelect = document.getElementById('return-product-select');
  const selectedOpt = productSelect.options[productSelect.selectedIndex];
  if (!selectedOpt || !productSelect.value) {
    showToast('Vui lòng chọn sản phẩm trong lịch sử mua hàng của khách!', 'warning');
    return;
  }

  const productId = productSelect.value;
  const productName = selectedOpt.getAttribute('data-name');
  const orderCode = selectedOpt.getAttribute('data-order') || ('TH-' + customerName);
  
  const qty = parseFormattedNumber(document.getElementById('return-qty-input').value) || 1;
  const refundAmount = parseFormattedNumber(document.getElementById('return-refund-input').value);
  const refundMethod = document.getElementById('return-method-select').value;
  const reason = document.getElementById('return-reason-input').value.trim();

  if (qty <= 0 || refundAmount < 0) {
    showToast('Vui lòng nhập số lượng và số tiền trả hàng hợp lệ!', 'warning');
    return;
  }

  const returnData = {
    order_code: orderCode,
    customer_name: customerName,
    total_refund: refundAmount,
    refund_method: refundMethod,
    reason: reason || 'Khách hàng đổi trả sản phẩm'
  };

  const returnItems = [{
    product_id: productId,
    product_name: productName,
    quantity: qty
  }];

  const createdReturn = await window.dbProvider.createSalesReturn(returnData, returnItems);
  showToast(`Đã lập phiếu trả hàng ${createdReturn.return_code} thành công! Kho & Công nợ đã tự động được cập nhật.`, 'success');

  closeModal('return-modal');
  await initPosData();
}
