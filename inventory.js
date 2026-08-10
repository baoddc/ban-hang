/* =======================================================
   INVENTORY & WAREHOUSE LOGIC (INVENTORY.JS)
   ======================================================= */

let allProductsList = [];
let allTransactionsList = [];
let allInboundOrdersList = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadInventoryData();
});

async function loadInventoryData() {
  if (!window.dbProvider) return;

  allProductsList = await window.dbProvider.getProducts();
  allTransactionsList = await window.dbProvider.getInventoryTransactions();
  if (typeof window.dbProvider.getInboundOrders === 'function') {
    allInboundOrdersList = await window.dbProvider.getInboundOrders();
  }

  calculateInventoryKpis();
  renderInventoryTable(allProductsList);
  renderLedgerTable(allTransactionsList);
  renderInboundTable(allInboundOrdersList);
  populateTxProductSelect();
}

function calculateInventoryKpis() {
  const totalSkus = allProductsList.length;
  const valuation = allProductsList.reduce((sum, p) => sum + ((p.cost_price || 0) * (p.stock_quantity || 0)), 0);
  const lowStockCount = allProductsList.filter(p => p.stock_quantity <= (p.min_stock_alert || 5)).length;

  document.getElementById('inv-total-skus').textContent = totalSkus + ' SKUs';
  document.getElementById('inv-total-valuation').textContent = formatVND(valuation);
  document.getElementById('inv-low-stock-count').textContent = lowStockCount;

  // Inbound Pending Badge Count
  const pendingCount = (allInboundOrdersList || []).filter(o => o.status === 'Pending').length;
  const badgeElem = document.getElementById('pending-inbound-count');
  if (badgeElem) badgeElem.textContent = pendingCount;
}

function switchInventoryTab(tab) {
  const productsView = document.getElementById('inv-products-view');
  const inboundView = document.getElementById('inv-inbound-view');
  const ledgerView = document.getElementById('inv-ledger-view');

  const btnProducts = document.getElementById('btn-tab-products');
  const btnInbound = document.getElementById('btn-tab-inbound');
  const btnLedger = document.getElementById('btn-tab-ledger');

  if (tab === 'products') {
    if (productsView) productsView.style.display = 'block';
    if (inboundView) inboundView.style.display = 'none';
    if (ledgerView) ledgerView.style.display = 'none';
    btnProducts?.classList.add('active');
    btnInbound?.classList.remove('active');
    btnLedger?.classList.remove('active');
  } else if (tab === 'inbound') {
    if (productsView) productsView.style.display = 'none';
    if (inboundView) inboundView.style.display = 'block';
    if (ledgerView) ledgerView.style.display = 'none';
    btnProducts?.classList.remove('active');
    btnInbound?.classList.add('active');
    btnLedger?.classList.remove('active');
  } else {
    if (productsView) productsView.style.display = 'none';
    if (inboundView) inboundView.style.display = 'none';
    if (ledgerView) ledgerView.style.display = 'block';
    btnProducts?.classList.remove('active');
    btnInbound?.classList.remove('active');
    btnLedger?.classList.add('active');
  }
}

function filterInventoryTable() {
  const search = document.getElementById('inv-search-input').value.toLowerCase().trim();
  const filtered = allProductsList.filter(p => {
    return p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search) || (p.location || '').toLowerCase().includes(search);
  });
  renderInventoryTable(filtered);
}

function renderInventoryTable(products) {
  const tbody = document.getElementById('inventory-tbody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Không tìm thấy sản phẩm nào</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const isLow = p.stock_quantity <= (p.min_stock_alert || 5);
    return `
      <tr>
        <td><code>${p.sku}</code></td>
        <td><strong>${p.name}</strong></td>
        <td><span class="badge badge-neutral">${p.category || 'Khác'}</span></td>
        <td><i class="bi bi-geo-alt text-primary"></i> ${p.location || 'Kho A'}</td>
        <td>${formatVND(p.cost_price)}</td>
        <td style="font-weight:700; color:var(--primary);">${formatVND(p.selling_price)}</td>
        <td class="stock-tag ${isLow ? 'low' : 'ok'}">${p.stock_quantity} ${p.unit}</td>
        <td>
          ${isLow ? `
            <span class="badge badge-danger"><i class="bi bi-exclamation-circle"></i> Sắp Hết</span>
          ` : `
            <span class="badge badge-success"><i class="bi bi-check2-circle"></i> An Toàn</span>
          `}
        </td>
        <td>
          <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="quickAdjustStock('${p.id}')">
            <i class="bi bi-pencil-square"></i> Điều chỉnh
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderLedgerTable(transactions) {
  const tbody = document.getElementById('ledger-tbody');
  if (!tbody) return;

  if (transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Chưa có nhật ký biến động kho nào</td></tr>`;
    return;
  }

  tbody.innerHTML = transactions.map(tx => {
    const isStockIn = tx.type === 'StockIn';
    return `
      <tr>
        <td><code>${tx.code}</code></td>
        <td>
          <span class="badge ${isStockIn ? 'badge-success' : 'badge-danger'}">
            ${isStockIn ? 'Nhập Kho (+)' : 'Xuất Kho (-)'}
          </span>
        </td>
        <td><strong>${tx.product_name}</strong></td>
        <td style="font-weight:800; color:${isStockIn ? 'var(--success)' : 'var(--danger)'};">
          ${isStockIn ? '+' : '-'}${tx.quantity}
        </td>
        <td>${tx.previous_stock}</td>
        <td><strong>${tx.new_stock}</strong></td>
        <td>${tx.reason || 'N/A'}</td>
        <td>${formatDate(tx.created_at)}</td>
      </tr>
    `;
  }).join('');
}

function populateTxProductSelect() {
  const select = document.getElementById('tx-product-select');
  if (!select) return;

  select.innerHTML = allProductsList.map(p => `
    <option value="${p.id}">${p.sku} - ${p.name} (Tồn: ${p.stock_quantity})</option>
  `).join('');
}

function checkProductSkuAvailability() {
  const input = document.getElementById('prod-sku');
  const feedback = document.getElementById('prod-sku-feedback');
  if (!input || !feedback) return false;

  const sku = input.value.trim();
  if (!sku) {
    feedback.style.display = 'none';
    input.style.borderColor = '';
    return true;
  }

  const isDuplicate = allProductsList && allProductsList.some(
    p => (p.sku || '').toLowerCase() === sku.toLowerCase()
  );

  if (isDuplicate) {
    feedback.style.display = 'block';
    feedback.style.color = '#ef4444';
    feedback.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Mã SKU <strong>"${sku}"</strong> đã tồn tại trong kho! Vui lòng chọn mã SKU khác.`;
    input.style.borderColor = '#ef4444';
    return false;
  } else {
    feedback.style.display = 'block';
    feedback.style.color = '#10b981';
    feedback.innerHTML = `<i class="bi bi-check-circle-fill"></i> Mã SKU <strong>"${sku}"</strong> chưa tồn tại (Hợp lệ).`;
    input.style.borderColor = '#10b981';
    return true;
  }
}

function openNewProductModal() {
  const skuInput = document.getElementById('prod-sku');
  const feedback = document.getElementById('prod-sku-feedback');
  if (skuInput) {
    skuInput.value = '';
    skuInput.style.borderColor = '';
  }
  if (feedback) {
    feedback.style.display = 'none';
    feedback.innerHTML = '';
  }

  document.getElementById('prod-name').value = '';
  document.getElementById('prod-category').value = '';
  document.getElementById('prod-unit').value = 'Cái';
  document.getElementById('prod-cost').value = '';
  document.getElementById('prod-price').value = '';
  document.getElementById('prod-stock').value = '10';
  document.getElementById('prod-location').value = 'Khu A - Kệ 01';
  openModal('product-modal');
}

async function submitCreateProduct() {
  const skuInput = document.getElementById('prod-sku');
  const sku = skuInput.value.trim();
  const name = document.getElementById('prod-name').value.trim();
  const category = document.getElementById('prod-category').value.trim() || 'Khác';
  const unit = document.getElementById('prod-unit').value.trim() || 'Cái';
  const cost_price = parseFormattedNumber(document.getElementById('prod-cost').value);
  const selling_price = parseFormattedNumber(document.getElementById('prod-price').value);
  const stock_quantity = parseFormattedNumber(document.getElementById('prod-stock').value);
  const location = document.getElementById('prod-location').value.trim() || 'Kho A';

  if (!sku || !name) {
    showToast('Vui lòng nhập Mã SKU và Tên sản phẩm!', 'warning');
    return;
  }

  // Fetch latest products list from database provider to check for duplicates
  const currentProducts = (await window.dbProvider.getProducts()) || allProductsList;
  const duplicate = currentProducts.find(p => (p.sku || '').toLowerCase() === sku.toLowerCase());

  if (duplicate) {
    showToast(`Mã SKU "${sku}" đã tồn tại cho sản phẩm "${duplicate.name}"! Vui lòng sử dụng mã SKU khác.`, 'danger');
    checkProductSkuAvailability();
    skuInput.focus();
    return;
  }

  const newProd = {
    sku, name, category, unit, cost_price, selling_price, stock_quantity, min_stock_alert: 5, location
  };

  try {
    await window.dbProvider.addProduct(newProd);
    showToast('Tạo sản phẩm mới trong kho thành công!', 'success');
    closeModal('product-modal');
    await loadInventoryData();
  } catch (err) {
    console.error('Error in submitCreateProduct:', err);
    showToast('Không thể tạo sản phẩm: ' + (err.message || 'Lỗi không xác định'), 'danger');
  }
}

function openStockTxModal() {
  document.getElementById('tx-qty-input').value = '1';
  openModal('stock-tx-modal');
}

function quickAdjustStock(productId) {
  const select = document.getElementById('tx-product-select');
  if (select) select.value = productId;
  openStockTxModal();
}

async function submitStockTransaction() {
  const productId = document.getElementById('tx-product-select').value;
  const type = document.getElementById('tx-type-select').value;
  const qty = parseFormattedNumber(document.getElementById('tx-qty-input').value) || 1;
  const reason = document.getElementById('tx-reason-input').value.trim();

  if (qty <= 0) {
    showToast('Số lượng giao dịch phải lớn hơn 0!', 'warning');
    return;
  }

  await window.dbProvider.recordStockTransaction(productId, type, qty, reason);
  showToast('Đã ghi nhận giao dịch kho thành công!', 'success');

  closeModal('stock-tx-modal');
  await loadInventoryData();
}

/* =======================================================
   INBOUND ORDERS & PR PURCHASE WORKFLOW
   ======================================================= */

function filterInboundTable() {
  const search = (document.getElementById('inbound-search-input')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('inbound-status-filter')?.value || 'ALL';

  const filtered = (allInboundOrdersList || []).filter(o => {
    const matchesSearch = (o.code || '').toLowerCase().includes(search) ||
                          (o.supplier_name || '').toLowerCase().includes(search) ||
                          (o.created_by || '').toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  renderInboundTable(filtered);
}

function renderInboundTable(orders) {
  const tbody = document.getElementById('inbound-tbody');
  if (!tbody) return;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Không tìm thấy đơn Inbound / PR nào</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    let items = o.items;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (e) { items = []; }
    }
    if (!Array.isArray(items)) items = [];

    const itemCount = items.length;
    const isPending = o.status === 'Pending';
    const isReceived = o.status === 'Received';

    let totalAmt = Number(o.total_amount) || 0;
    if (totalAmt === 0 && items.length > 0) {
      totalAmt = items.reduce((sum, it) => sum + (Number(it.subtotal) || (Number(it.expected_qty || 0) * Number(it.cost_price || 0))), 0);
    }

    let statusBadge = `<span class="badge badge-warning"><i class="bi bi-clock-history"></i> Chờ nhập kho</span>`;
    if (isReceived) {
      statusBadge = `<span class="badge badge-success"><i class="bi bi-check-circle"></i> Đã nhập kho</span>`;
    } else if (o.status === 'Cancelled') {
      statusBadge = `<span class="badge badge-neutral"><i class="bi bi-x-circle"></i> Đã hủy</span>`;
    }

    return `
      <tr>
        <td><code>${o.code}</code></td>
        <td><strong>${o.supplier_name}</strong></td>
        <td><i class="bi bi-person text-accent"></i> ${o.created_by || 'Kỹ thuật'}</td>
        <td>
          <div>${formatDate(o.created_at)}</div>
          <small class="text-muted">Hạn: ${o.expected_date || 'N/A'}</small>
        </td>
        <td><span class="badge badge-neutral">${itemCount} mặt hàng</span></td>
        <td style="font-weight:700; color:var(--primary);">${formatVND(totalAmt)}</td>
        <td>${statusBadge}</td>
        <td>
          ${isPending ? `
            <button class="btn btn-primary" style="padding:4px 10px; font-size:0.78rem;" onclick="openFulfillInboundModal('${o.id}')">
              <i class="bi bi-box-arrow-in-down"></i> Kế Thừa & Nhập Kho
            </button>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem; color:#ef4444;" onclick="handleCancelInbound('${o.id}')" title="Hủy đơn PR">
              <i class="bi bi-trash"></i>
            </button>
          ` : `
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="openFulfillInboundModal('${o.id}')">
              <i class="bi bi-eye"></i> Xem Chi Tiết
            </button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

// Modal 1: Create PR / Inbound
async function openCreateInboundModal() {
  if (!allProductsList || allProductsList.length === 0) {
    if (window.dbProvider) {
      allProductsList = await window.dbProvider.getProducts();
    }
  }

  const supplierSelect = document.getElementById('inb-supplier-select');
  if (supplierSelect && window.dbProvider) {
    const customers = await window.dbProvider.getCustomers();
    // Filter Suppliers or fallback to all customers
    const suppliers = customers.filter(c => c.type === 'Supplier' || (c.code || '').startsWith('NCC'));
    const listToUse = suppliers.length > 0 ? suppliers : customers;

    supplierSelect.innerHTML = listToUse.map(s => `
      <option value="${s.id}" data-name="${s.name}">${s.code || 'NCC'} - ${s.name}</option>
    `).join('');
  }

  // Set default expected date = today + 3 days
  const expDateInput = document.getElementById('inb-expected-date');
  if (expDateInput) {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    expDateInput.value = future.toISOString().slice(0, 10);
  }

  // Reset items form list
  const container = document.getElementById('inbound-items-form-list');
  if (container) {
    container.innerHTML = '';
    addInboundItemRow(); // Add first default row
  }

  openModal('create-inbound-modal');
}

function addInboundItemRow() {
  const container = document.getElementById('inbound-items-form-list');
  if (!container || !allProductsList) return;

  const rowId = 'item_row_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const div = document.createElement('div');
  div.id = rowId;
  div.style.cssText = 'display:grid; grid-template-columns: 2fr 1fr 1.2fr 1fr 40px; gap:8px; align-items:center; background:var(--card-bg); padding:8px; border:1px solid var(--border); border-radius:6px;';

  const productOptions = allProductsList.map(p => `
    <option value="${p.id}" data-sku="${p.sku}" data-name="${p.name}" data-unit="${p.unit}" data-cost="${p.cost_price}">${p.sku} - ${p.name}</option>
  `).join('');

  div.innerHTML = `
    <div>
      <label style="font-size:0.75rem; font-weight:600; color:var(--text-muted);">Sản Phẩm</label>
      <select class="form-control item-product-select" style="font-size:0.85rem;" onchange="onInboundItemProductChange('${rowId}')">
        ${productOptions}
      </select>
    </div>
    <div>
      <label style="font-size:0.75rem; font-weight:600; color:var(--text-muted);">Số Lượng Mua</label>
      <input type="text" inputmode="numeric" class="form-control format-number item-qty-input" value="1" style="font-size:0.85rem;" oninput="calculateInboundFormTotals()" />
    </div>
    <div>
      <label style="font-size:0.75rem; font-weight:600; color:var(--text-muted);">Đơn Giá Nhập (VNĐ)</label>
      <input type="text" inputmode="numeric" class="form-control format-number item-cost-input" value="0" style="font-size:0.85rem;" oninput="calculateInboundFormTotals()" />
    </div>
    <div>
      <label style="font-size:0.75rem; font-weight:600; color:var(--text-muted);">Thành Tiền</label>
      <div class="item-subtotal-display" style="font-weight:700; font-size:0.88rem; color:var(--primary); padding-top:6px;">0 ₫</div>
    </div>
    <div style="text-align:center; padding-top:14px;">
      <button type="button" class="btn btn-icon" style="color:#ef4444;" onclick="removeInboundItemRow('${rowId}')" title="Xóa dòng">
        <i class="bi bi-trash"></i>
      </button>
    </div>
  `;

  container.appendChild(div);
  onInboundItemProductChange(rowId);
}

function removeInboundItemRow(rowId) {
  const elem = document.getElementById(rowId);
  if (elem) elem.remove();
  calculateInboundFormTotals();
}

function onInboundItemProductChange(rowId) {
  const row = document.getElementById(rowId);
  if (!row) return;

  const select = row.querySelector('.item-product-select');
  const costInput = row.querySelector('.item-cost-input');

  if (select && costInput && select.selectedIndex >= 0) {
    const selectedOption = select.options[select.selectedIndex];
    const defaultCost = selectedOption ? (selectedOption.dataset.cost || 0) : 0;
    costInput.value = typeof formatNumberWithDots === 'function' ? formatNumberWithDots(defaultCost) : defaultCost;
  }

  calculateInboundFormTotals();
}

function calculateInboundFormTotals() {
  const container = document.getElementById('inbound-items-form-list');
  if (!container) return;

  let grandTotal = 0;
  const rows = container.querySelectorAll('[id^="item_row_"]');

  rows.forEach(row => {
    const qtyInput = row.querySelector('.item-qty-input');
    const costInput = row.querySelector('.item-cost-input');
    const subtotalDisplay = row.querySelector('.item-subtotal-display');

    const qty = parseFormattedNumber(qtyInput ? qtyInput.value : 1) || 0;
    const cost = parseFormattedNumber(costInput ? costInput.value : 0) || 0;
    const subtotal = qty * cost;
    grandTotal += subtotal;

    if (subtotalDisplay) {
      subtotalDisplay.textContent = formatVND(subtotal);
    }
  });

  const grandTotalElem = document.getElementById('inb-form-grand-total');
  if (grandTotalElem) grandTotalElem.textContent = formatVND(grandTotal);
}

async function submitCreateInbound() {
  const supplierSelect = document.getElementById('inb-supplier-select');
  const expectedDate = document.getElementById('inb-expected-date').value;
  const createdBy = document.getElementById('inb-creator-name').value.trim() || 'Kỹ thuật';
  const notes = document.getElementById('inb-notes').value.trim();

  if (!supplierSelect || !supplierSelect.value) {
    showToast('Vui lòng chọn Nhà cung cấp!', 'warning');
    return;
  }

  const supplierOption = supplierSelect.options[supplierSelect.selectedIndex];
  const supplierName = supplierOption ? supplierOption.dataset.name : supplierSelect.value;
  const supplierId = supplierSelect.value;

  const container = document.getElementById('inbound-items-form-list');
  const rows = container ? container.querySelectorAll('[id^="item_row_"]') : [];

  if (rows.length === 0) {
    showToast('Vui lòng thêm ít nhất 1 mặt hàng mua!', 'warning');
    return;
  }

  const items = [];
  rows.forEach(row => {
    const select = row.querySelector('.item-product-select');
    const qtyInput = row.querySelector('.item-qty-input');
    const costInput = row.querySelector('.item-cost-input');

    if (select) {
      const selectedOption = select.options[select.selectedIndex];
      const prodId = select.value;
      const sku = selectedOption ? selectedOption.dataset.sku : '';
      const name = selectedOption ? selectedOption.dataset.name : '';
      const unit = selectedOption ? selectedOption.dataset.unit : 'Cái';

      const expected_qty = parseFormattedNumber(qtyInput.value) || 1;
      const cost_price = parseFormattedNumber(costInput.value) || 0;
      const subtotal = expected_qty * cost_price;

      items.push({
        product_id: prodId,
        product_sku: sku,
        product_name: name,
        unit: unit,
        expected_qty: expected_qty,
        received_qty: expected_qty,
        cost_price: cost_price,
        subtotal: subtotal
      });
    }
  });

  const orderData = {
    supplier_id: supplierId,
    supplier_name: supplierName,
    created_by: createdBy,
    expected_date: expectedDate,
    notes: notes,
    status: 'Pending'
  };

  try {
    const resOrder = await window.dbProvider.createInboundOrder(orderData, items);
    showToast(`Đã tạo phiếu ${resOrder.code || 'PR'} thành công và lưu lên Supabase!`, 'success');
    closeModal('create-inbound-modal');
    await loadInventoryData();
  } catch (err) {
    console.error('Error creating inbound order:', err);
    showToast('Chưa thể lưu Supabase: ' + (err.message || 'Lỗi hệ thống'), 'danger', 10000);
  }
}

// Modal 2: Inherit & Fulfill Inbound
function openFulfillInboundModal(inboundId) {
  const inbound = (allInboundOrdersList || []).find(o => o.id === inboundId || o.code === inboundId);
  if (!inbound) return;

  let items = inbound.items;
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch (e) { items = []; }
  }
  if (!Array.isArray(items)) items = [];

  document.getElementById('fulfill-inbound-id').value = inbound.id;
  document.getElementById('ful-code').textContent = inbound.code;
  document.getElementById('ful-supplier').textContent = inbound.supplier_name;
  document.getElementById('ful-creator').textContent = inbound.created_by || 'Kỹ thuật';

  const tbody = document.getElementById('fulfill-items-tbody');
  const isPending = inbound.status === 'Pending';

  tbody.innerHTML = items.map((it, idx) => {
    const recQty = isPending ? (it.received_qty || it.expected_qty) : it.received_qty;
    const cost = Number(it.cost_price) || 0;
    const subtotal = recQty * cost;

    return `
      <tr data-prod-id="${it.product_id}" data-sku="${it.product_sku}" data-name="${it.product_name}" data-unit="${it.unit}" data-cost="${cost}">
        <td><code>${it.product_sku}</code></td>
        <td><strong>${it.product_name}</strong></td>
        <td>${it.expected_qty} ${it.unit || 'Cái'}</td>
        <td style="text-align:center;">
          ${isPending ? `
            <input type="text" inputmode="numeric" class="form-control format-number ful-rec-qty-input" value="${recQty}" style="width:90px; text-align:center; margin:0 auto; font-weight:700; color:var(--success);" oninput="recalculateFulfillTotals()" />
          ` : `
            <strong style="color:var(--success); font-size:1rem;">${recQty} ${it.unit || 'Cái'}</strong>
          `}
        </td>
        <td>${formatVND(cost)}</td>
        <td class="ful-item-subtotal" style="font-weight:700;">${formatVND(subtotal)}</td>
      </tr>
    `;
  }).join('');

  const confirmBtn = document.querySelector('#fulfill-inbound-modal .modal-footer .btn-primary');
  if (confirmBtn) {
    confirmBtn.style.display = isPending ? 'inline-flex' : 'none';
  }

  recalculateFulfillTotals();
  openModal('fulfill-inbound-modal');
}

function recalculateFulfillTotals() {
  const tbody = document.getElementById('fulfill-items-tbody');
  if (!tbody) return;

  let grandTotal = 0;
  const rows = tbody.querySelectorAll('tr');

  rows.forEach(row => {
    const cost = Number(row.dataset.cost) || 0;
    const qtyInput = row.querySelector('.ful-rec-qty-input');
    const recQty = qtyInput ? (parseFormattedNumber(qtyInput.value) || 0) : (Number(row.querySelector('td:nth-child(4)').textContent) || 0);
    const subtotal = recQty * cost;
    grandTotal += subtotal;

    const subtotalElem = row.querySelector('.ful-item-subtotal');
    if (subtotalElem) subtotalElem.textContent = formatVND(subtotal);
  });

  const grandTotalElem = document.getElementById('ful-grand-total');
  if (grandTotalElem) grandTotalElem.textContent = formatVND(grandTotal);
}

async function submitFulfillInbound() {
  const inboundId = document.getElementById('fulfill-inbound-id').value;
  const receiverNotes = document.getElementById('ful-receiver-notes').value.trim();

  const tbody = document.getElementById('fulfill-items-tbody');
  const rows = tbody ? tbody.querySelectorAll('tr') : [];

  const itemsWithReceivedQty = [];
  rows.forEach(row => {
    const prodId = row.dataset.prodId;
    const sku = row.dataset.sku;
    const name = row.dataset.name;
    const unit = row.dataset.unit;
    const cost = Number(row.dataset.cost) || 0;

    const qtyInput = row.querySelector('.ful-rec-qty-input');
    const recQty = parseFormattedNumber(qtyInput.value) || 0;

    itemsWithReceivedQty.push({
      product_id: prodId,
      product_sku: sku,
      product_name: name,
      unit: unit,
      cost_price: cost,
      received_qty: recQty
    });
  });

  try {
    await window.dbProvider.fulfillInboundOrder(inboundId, itemsWithReceivedQty, 'Thủ kho', receiverNotes);
    showToast('Đã nhập kho thành công! Hệ thống đã tự động ghi Thẻ Kho và Công Nợ.', 'success');
    closeModal('fulfill-inbound-modal');
    await loadInventoryData();
  } catch (err) {
    console.error('Error fulfilling inbound order:', err);
    showToast('Không thể nhập kho: ' + (err.message || 'Lỗi không xác định'), 'danger');
  }
}

async function handleCancelInbound(inboundId) {
  if (!confirm('Bạn có chắc chắn muốn hủy đơn PR / Inbound này?')) return;

  try {
    await window.dbProvider.cancelInboundOrder(inboundId);
    showToast('Đã hủy đơn Inbound!', 'info');
    await loadInventoryData();
  } catch (err) {
    console.error('Error cancelling inbound order:', err);
  }
}
