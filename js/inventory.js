/* =======================================================
   INVENTORY & WAREHOUSE LOGIC (INVENTORY.JS)
   ======================================================= */

let allProductsList = [];
let allTransactionsList = [];
let allInboundOrdersList = [];
let allCustomersList = [];
let allDebtsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadInventoryData();
});

async function loadInventoryData() {
  if (!window.dbProvider) return;

  allProductsList = await window.dbProvider.getProducts();
  allTransactionsList = await window.dbProvider.getInventoryTransactions();
  allCustomersList = await window.dbProvider.getCustomers();

  if (typeof window.dbProvider.getSuppliers === 'function') {
    try {
      const suppliersFromSupabase = await window.dbProvider.getSuppliers();
      if (Array.isArray(suppliersFromSupabase)) {
        suppliersFromSupabase.forEach(sup => {
          const idx = allCustomersList.findIndex(c => c.id === sup.id || c.code === sup.code);
          if (idx !== -1) {
            allCustomersList[idx] = { ...allCustomersList[idx], ...sup, type: 'Supplier' };
          } else {
            allCustomersList.unshift({ ...sup, type: 'Supplier' });
          }
        });
      }
    } catch (e) {
      console.warn('Error fetching suppliers from Supabase provider:', e);
    }
  }

  allDebtsList = await window.dbProvider.getDebts();
  if (typeof window.dbProvider.getInboundOrders === 'function') {
    allInboundOrdersList = await window.dbProvider.getInboundOrders();
  }

  if (typeof syncInboundOrdersToPayableDebts === 'function') {
    allDebtsList = syncInboundOrdersToPayableDebts(allDebtsList, allInboundOrdersList, allCustomersList);
  }

  calculateInventoryKpis();
  renderInventoryTable(allProductsList);
  renderLedgerTable(allTransactionsList);
  renderInboundTable(allInboundOrdersList);
  renderSuppliersTable();
  populateTxProductSelect();
  populateSupplierSelectOptions();
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
  const suppliersView = document.getElementById('inv-suppliers-view');

  const btnProducts = document.getElementById('btn-tab-products');
  const btnInbound = document.getElementById('btn-tab-inbound');
  const btnLedger = document.getElementById('btn-tab-ledger');
  const btnSuppliers = document.getElementById('btn-tab-suppliers');

  if (tab === 'products') {
    if (productsView) productsView.style.display = 'block';
    if (inboundView) inboundView.style.display = 'none';
    if (ledgerView) ledgerView.style.display = 'none';
    if (suppliersView) suppliersView.style.display = 'none';
    btnProducts?.classList.add('active');
    btnInbound?.classList.remove('active');
    btnLedger?.classList.remove('active');
    btnSuppliers?.classList.remove('active');
  } else if (tab === 'inbound') {
    if (productsView) productsView.style.display = 'none';
    if (inboundView) inboundView.style.display = 'block';
    if (ledgerView) ledgerView.style.display = 'none';
    if (suppliersView) suppliersView.style.display = 'none';
    btnProducts?.classList.remove('active');
    btnInbound?.classList.add('active');
    btnLedger?.classList.remove('active');
    btnSuppliers?.classList.remove('active');
  } else if (tab === 'ledger') {
    if (productsView) productsView.style.display = 'none';
    if (inboundView) inboundView.style.display = 'none';
    if (ledgerView) ledgerView.style.display = 'block';
    if (suppliersView) suppliersView.style.display = 'none';
    btnProducts?.classList.remove('active');
    btnInbound?.classList.remove('active');
    btnLedger?.classList.add('active');
    btnSuppliers?.classList.remove('active');
  } else if (tab === 'suppliers') {
    if (productsView) productsView.style.display = 'none';
    if (inboundView) inboundView.style.display = 'none';
    if (ledgerView) ledgerView.style.display = 'none';
    if (suppliersView) suppliersView.style.display = 'block';
    btnProducts?.classList.remove('active');
    btnInbound?.classList.remove('active');
    btnLedger?.classList.remove('active');
    btnSuppliers?.classList.add('active');
  }
}

function filterInventoryTable() {
  const search = document.getElementById('inv-search-input').value.toLowerCase().trim();
  const filtered = allProductsList.filter(p => {
    return (p.name || '').toLowerCase().includes(search) ||
      (p.sku || '').toLowerCase().includes(search) ||
      (p.supplier_name || '').toLowerCase().includes(search) ||
      (p.category || '').toLowerCase().includes(search) ||
      (p.location || '').toLowerCase().includes(search);
  });
  renderInventoryTable(filtered);
}

function renderInventoryTable(products) {
  const tbody = document.getElementById('inventory-tbody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;">Không tìm thấy sản phẩm nào</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const isLow = p.stock_quantity <= (p.min_stock_alert || 5);
    const supName = p.supplier_name || '-';
    return `
      <tr>
        <td><code>${p.sku}</code></td>
        <td><strong>${p.name}</strong></td>
        <td><span class="badge badge-info" style="font-size:0.78rem; font-weight:600;"><i class="bi bi-building"></i> ${supName}</span></td>
        <td><span class="badge badge-neutral">${p.category || 'Khác'}</span></td>
        <td>
          <span class="badge badge-neutral" style="cursor:pointer; font-weight:600;" onclick="editProductLocation('${p.id}', '${(p.location || '').replace(/'/g, "\\'")}')" title="Nhấp để chuyển kho">
            <i class="bi bi-geo-alt text-primary"></i> ${p.location || 'Chưa phân kho'} <i class="bi bi-pencil" style="font-size:0.7rem; opacity:0.6; margin-left:3px;"></i>
          </span>
        </td>
        <td>${formatVND(p.cost_price)}</td>
        <td style="font-weight:700; color:var(--primary);">${formatVND(p.selling_price)}</td>
        <td class="stock-tag ${isLow ? 'low' : 'ok'}">${typeof formatQuantity === 'function' ? formatQuantity(p.stock_quantity) : p.stock_quantity} ${p.unit}</td>
        <td>
          ${isLow ? `
            <span class="badge badge-danger"><i class="bi bi-exclamation-circle"></i> Sắp Hết</span>
          ` : `
            <span class="badge badge-success"><i class="bi bi-check2-circle"></i> An Toàn</span>
          `}
        </td>
        <td>
          <div style="display:flex; gap:4px;">
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="quickAdjustStock('${p.id}')" title="Điều chỉnh tồn kho">
              <i class="bi bi-pencil-square"></i> Điều chỉnh
            </button>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem; color:#ef4444;" onclick="handleDeleteProduct('${p.id}', '${(p.name || '').replace(/'/g, "\\'")}')" title="Xóa dòng sản phẩm này">
              <i class="bi bi-trash"></i>
            </button>
          </div>
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
    const formattedQty = typeof formatQuantity === 'function' ? formatQuantity(tx.quantity) : tx.quantity;
    const formattedPrev = typeof formatQuantity === 'function' ? formatQuantity(tx.previous_stock) : tx.previous_stock;
    const formattedNew = typeof formatQuantity === 'function' ? formatQuantity(tx.new_stock) : tx.new_stock;
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
          ${isStockIn ? '+' : '-'}${formattedQty}
        </td>
        <td>${formattedPrev}</td>
        <td><strong>${formattedNew}</strong></td>
        <td>${tx.reason || 'N/A'}</td>
        <td>${formatDate(tx.created_at)}</td>
      </tr>
    `;
  }).join('');
}

function populateTxProductSelect() {
  const select = document.getElementById('tx-product-select');
  if (!select) return;

  select.innerHTML = allProductsList.map(p => {
    const formattedStock = typeof formatQuantity === 'function' ? formatQuantity(p.stock_quantity) : p.stock_quantity;
    return `
    <option value="${p.id}">${p.sku} - ${p.name} (Tồn: ${formattedStock})</option>
  `;
  }).join('');
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

  const locInput = document.getElementById('prod-location');
  const loc = locInput ? locInput.value.trim() : '';

  const existingInSameLoc = allProductsList && allProductsList.find(
    p => (p.sku || '').toLowerCase() === sku.toLowerCase() && (p.location || '').toLowerCase() === loc.toLowerCase()
  );

  const existingInOtherLoc = allProductsList && allProductsList.find(
    p => (p.sku || '').toLowerCase() === sku.toLowerCase()
  );

  if (existingInSameLoc) {
    feedback.style.display = 'block';
    feedback.style.color = '#ef4444';
    feedback.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Mã SKU <strong>"${sku}"</strong> đã tồn tại tại "${loc || 'kho này'}"!`;
    input.style.borderColor = '#ef4444';
    return false;
  } else if (existingInOtherLoc) {
    feedback.style.display = 'block';
    feedback.style.color = '#3b82f6';
    feedback.innerHTML = `<i class="bi bi-info-circle-fill"></i> Mã SKU <strong>"${sku}"</strong> đã có ở <em>${existingInOtherLoc.location || 'kho khác'}</em>. Tạo tại kho này sẽ ghi nhận vị trí kho mới.`;
    input.style.borderColor = '#3b82f6';
    return true;
  } else {
    feedback.style.display = 'block';
    feedback.style.color = '#10b981';
    feedback.innerHTML = `<i class="bi bi-check-circle-fill"></i> Mã SKU <strong>"${sku}"</strong> hợp lệ.`;
    input.style.borderColor = '#10b981';
    return true;
  }
}

function populateNewProductSupplierOptions() {
  const select = document.getElementById('prod-supplier');
  if (!select) return;

  const suppliers = (allCustomersList || []).filter(c => c.type === 'Supplier' || (c.code || '').startsWith('NCC'));
  const supplierMap = new Map();
  suppliers.forEach(s => supplierMap.set(s.name, s));

  if (supplierMap.size === 0) {
    select.innerHTML = `<option value="" disabled selected>-- Chưa có Nhà Cung Cấp nào (Hãy tạo NCC ở tab NCC) --</option>`;
    return;
  }

  select.innerHTML = Array.from(supplierMap.values()).map(s => `
    <option value="${s.id || s.name}" data-name="${s.name}" data-code="${s.code || ''}" data-id="${s.id || ''}">${s.code || 'NCC'} - ${s.name}</option>
  `).join('');
}

async function handleDeleteProduct(productId, productName) {
  if (!confirm(`Bạn có chắc chắn muốn xóa dòng sản phẩm "${productName}" khỏi kho?`)) return;

  try {
    await window.dbProvider.deleteProduct(productId);
    showToast(`Đã xóa dòng sản phẩm "${productName}" thành công!`, 'success');
    await loadInventoryData();
  } catch (err) {
    console.error('Error deleting product:', err);
    showToast('Lỗi khi xóa sản phẩm: ' + (err.message || 'Lỗi không xác định'), 'danger');
  }
}

async function cleanupUnassignedZeroStockProducts() {
  const unassignedZero = (allProductsList || []).filter(p =>
    (!p.location || p.location === 'Chưa phân kho' || p.location.trim() === '') &&
    (Number(p.stock_quantity) || 0) === 0
  );

  if (unassignedZero.length === 0) {
    showToast('Không có dòng sản phẩm nào chưa phân kho tồn bằng 0!', 'info');
    return;
  }

  if (!confirm(`Tìm thấy ${unassignedZero.length} dòng sản phẩm chưa phân kho và có số lượng tồn bằng 0.\nBạn có chắc chắn muốn xóa tất cả ${unassignedZero.length} dòng này khỏi kho?`)) {
    return;
  }

  try {
    for (const p of unassignedZero) {
      await window.dbProvider.deleteProduct(p.id);
    }
    showToast(`Đã dọn dẹp thành công ${unassignedZero.length} dòng sản phẩm chưa phân kho tồn bằng 0!`, 'success');
    await loadInventoryData();
  } catch (e) {
    console.error('Error cleaning up products:', e);
    showToast('Lỗi dọn dẹp: ' + e.message, 'danger');
  }
}

function openNewProductModal() {
  populateNewProductSupplierOptions();

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
  document.getElementById('prod-stock').value = '0';
  document.getElementById('prod-location').value = '';
  openModal('product-modal');
}

async function submitCreateProduct() {
  const supplierSelect = document.getElementById('prod-supplier');
  const skuInput = document.getElementById('prod-sku');
  const sku = skuInput.value.trim();
  const name = document.getElementById('prod-name').value.trim();
  const category = document.getElementById('prod-category').value.trim() || 'Khác';
  const unit = document.getElementById('prod-unit').value.trim() || 'Cái';
  const cost_price = parseFormattedNumber(document.getElementById('prod-cost').value);
  const selling_price = parseFormattedNumber(document.getElementById('prod-price').value);
  const stock_quantity = parseFormattedNumber(document.getElementById('prod-stock').value);
  const location = document.getElementById('prod-location').value.trim() || '';

  let supplier_name = '';
  let supplier_id = null;
  if (supplierSelect && supplierSelect.selectedIndex >= 0) {
    const opt = supplierSelect.options[supplierSelect.selectedIndex];
    supplier_name = opt ? (opt.dataset.name || opt.text.replace(/^[^-]+-\s*/, '')) : supplierSelect.value;
    supplier_id = supplierSelect.value;
  }
  supplier_name = supplier_name || '';

  if (!sku || !name) {
    showToast('Vui lòng nhập Mã SKU và Tên sản phẩm!', 'warning');
    return;
  }

  // Fetch latest products list from database provider to check for duplicates in the same warehouse
  const currentProducts = (await window.dbProvider.getProducts()) || allProductsList;
  const duplicate = currentProducts.find(p =>
    (p.sku || '').toLowerCase() === sku.toLowerCase() &&
    (p.location || '').toLowerCase() === location.toLowerCase()
  );

  if (duplicate) {
    showToast(`Mã SKU "${sku}" đã tồn tại tại "${location || 'kho này'}" (Sản phẩm: ${duplicate.name})! Vui lòng chọn mã SKU hoặc vị trí kho khác.`, 'danger');
    checkProductSkuAvailability();
    skuInput.focus();
    return;
  }

  const newProd = {
    sku, name, supplier_name, supplier_id, category, unit, cost_price, selling_price, stock_quantity, min_stock_alert: 5, location
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
  const qty = typeof parseQuantity === 'function' ? parseQuantity(document.getElementById('tx-qty-input').value) : (parseFloat(document.getElementById('tx-qty-input').value) || 1);
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
      (o.warehouse || '').toLowerCase().includes(search) ||
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
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Không tìm thấy đơn Inbound / PR nào</td></tr>`;
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

    const totalExpectedQty = items.reduce((sum, it) => sum + (Number(it.expected_qty) || Number(it.received_qty) || 0), 0);
    const totalReceivedQty = items.reduce((sum, it) => sum + (Number(it.received_qty) || 0), 0);

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
        <td><span class="badge badge-neutral"><i class="bi bi-geo-alt text-primary"></i> ${o.warehouse || 'Chưa phân kho'}</span></td>
        <td><i class="bi bi-person text-accent"></i> ${o.created_by || 'Kỹ thuật'}</td>
        <td>
          <div>${formatDate(o.created_at)}</div>
          <small class="text-muted">Hạn: ${o.expected_date || 'N/A'}</small>
        </td>
        <td>
          <div><span class="badge badge-neutral">${itemCount} mặt hàng</span></div>
          ${isReceived ? `
            <small style="color:var(--success); font-weight:600; font-size:0.75rem;"><i class="bi bi-box-seam"></i> Thực nhận: ${totalReceivedQty}/${totalExpectedQty}</small>
          ` : `
            <small class="text-muted" style="font-size:0.75rem;"><i class="bi bi-box-seam"></i> Dự kiến: ${totalExpectedQty}</small>
          `}
        </td>
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

// Helper to get products belonging STRICTLY to currently selected supplier in Inbound form
function getProductsForSelectedInboundSupplier() {
  const supplierSelect = document.getElementById('inb-supplier-select');
  if (!supplierSelect || !supplierSelect.value) return [];

  const selectedOption = supplierSelect.selectedIndex >= 0 ? supplierSelect.options[supplierSelect.selectedIndex] : null;
  const supplierId = String(selectedOption?.dataset?.id || supplierSelect.value || '').trim();
  const supplierName = (selectedOption?.dataset?.name || (selectedOption ? selectedOption.text.replace(/^[^-]+-\s*/, '') : supplierSelect.value) || '').trim();
  const supplierText = (selectedOption ? selectedOption.text : '').trim();

  // Try finding matching supplier record in allCustomersList
  const supplierObj = (allCustomersList || []).find(c =>
    (c.id && String(c.id).toLowerCase() === supplierId.toLowerCase()) ||
    (c.name && supplierName && c.name.toLowerCase().trim() === supplierName.toLowerCase().trim()) ||
    (c.code && supplierText.toLowerCase().startsWith(c.code.toLowerCase()))
  );

  const targetId = supplierId.toLowerCase();
  const targetName = supplierName.toLowerCase();
  const targetCode = (selectedOption?.dataset?.code || supplierObj?.code || (supplierText.includes('-') ? supplierText.split('-')[0] : '')).trim().toLowerCase();

  const removeAccents = (str) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';
  const normTargetName = removeAccents(targetName);

  const filtered = (allProductsList || []).filter(p => {
    const pSupName = (p.supplier_name || '').trim().toLowerCase();
    const pSupId = String(p.supplier_id || '').trim().toLowerCase();
    const pName = (p.name || '').trim().toLowerCase();
    const pSku = (p.sku || '').trim().toLowerCase();
    const normPName = removeAccents(pName);
    const normPSupName = removeAccents(pSupName);

    const hasExplicitSupId = Boolean(pSupId && pSupId !== 'null' && pSupId !== 'undefined' && pSupId !== '');
    const hasExplicitSupName = Boolean(pSupName && pSupName !== '-' && pSupName !== 'khác' && pSupName !== 'chưa có' && pSupName !== '');

    // A. If product has explicit supplier_id
    if (hasExplicitSupId) {
      if (targetId && pSupId === targetId) return true;
      if (targetName && pSupId === targetName) return true;
      if (supplierObj && supplierObj.id && pSupId === String(supplierObj.id).toLowerCase()) return true;
    }

    // B. If product has explicit supplier_name
    if (hasExplicitSupName) {
      if (targetName && (pSupName === targetName || normPSupName === normTargetName)) return true;
      if (targetCode && pSupName === targetCode) return true;
      if (targetName.length >= 3 && normTargetName.length >= 3) {
        if (normPSupName.includes(normTargetName) || normTargetName.includes(normPSupName)) return true;
      }
      // If it has an explicit supplier_name that does NOT match, it belongs to another supplier
      return false;
    }

    // If product has explicit supplier_id but it didn't match above, exclude it
    if (hasExplicitSupId) {
      return false;
    }

    // C. Fallback for legacy products where neither supplier_name nor supplier_id is set
    // 1. Match full brand / supplier name in product name (e.g. "Gạch Vicera 60x60" contains "vicera")
    if (targetName.length >= 3 && (pName.includes(targetName) || normPName.includes(normTargetName))) {
      return true;
    }

    // 2. Match SKU prefix if supplier has a distinctive code (not generic like 'ncc')
    if (targetCode && !targetCode.startsWith('ncc')) {
      if (targetCode.length >= 2 && pSku.startsWith(targetCode)) {
        return true;
      }
      if (targetCode.length === 1 && (/^[a-z][-_0-9]/i.test(pSku) || pSku.startsWith(targetCode + '-'))) {
        return pSku.startsWith(targetCode);
      }
    }

    return false;
  });

  // Deduplicate products by SKU so same product in different warehouses doesn't duplicate in the inbound picker
  const seenSkus = new Set();
  const uniqueProducts = [];
  filtered.forEach(p => {
    const key = (p.sku || p.id || p.name).toLowerCase();
    if (!seenSkus.has(key)) {
      seenSkus.add(key);
      uniqueProducts.push(p);
    }
  });

  return uniqueProducts;
}

function buildInboundProductOptionsHtml(availableProducts) {
  if (!availableProducts || availableProducts.length === 0) {
    return `<option value="" disabled selected>-- Nhà Cung Cấp này chưa có sản phẩm nào --</option>`;
  }

  return availableProducts.map(p => `
    <option value="${p.id}" data-sku="${p.sku}" data-name="${p.name}" data-unit="${p.unit}" data-cost="${p.cost_price}">
      ${p.sku} - ${p.name}
    </option>
  `).join('');
}

function onInboundSupplierChange() {
  const container = document.getElementById('inbound-items-form-list');
  if (!container) return;

  const rows = container.querySelectorAll('[id^="item_row_"]');
  if (rows.length === 0) {
    addInboundItemRow();
    return;
  }

  const availableProducts = getProductsForSelectedInboundSupplier();
  const optionsHtml = buildInboundProductOptionsHtml(availableProducts);

  rows.forEach(row => {
    const rowId = row.id;
    const select = row.querySelector('.item-product-select');
    if (!select) return;

    select.innerHTML = optionsHtml;
    onInboundItemProductChange(rowId);
  });

  calculateInboundFormTotals();
}

// Modal 1: Create PR / Inbound
async function openCreateInboundModal() {
  if (window.dbProvider) {
    try {
      allProductsList = await window.dbProvider.getProducts();
    } catch (e) {
      console.warn('Error fetching products for inbound:', e);
    }
  }

  const whInput = document.getElementById('inb-warehouse');
  if (whInput) {
    whInput.value = '';
  }

  const supplierSelect = document.getElementById('inb-supplier-select');
  if (supplierSelect && window.dbProvider) {
    let suppliers = [];
    if (typeof window.dbProvider.getSuppliers === 'function') {
      try {
        suppliers = await window.dbProvider.getSuppliers();
      } catch (e) {
        console.warn('Error fetching suppliers from Supabase:', e);
      }
    }

    if (!suppliers || suppliers.length === 0) {
      const customers = await window.dbProvider.getCustomers();
      suppliers = (customers || []).filter(c => c.type === 'Supplier' || (c.code || '').startsWith('NCC'));
    }

    if (!suppliers || suppliers.length === 0) {
      supplierSelect.innerHTML = `<option value="">-- Chưa có Nhà Cung Cấp nào --</option>`;
    } else {
      supplierSelect.innerHTML = suppliers.map(s => `
        <option value="${s.id || s.name}" data-name="${s.name}" data-code="${s.code || ''}" data-id="${s.id || ''}">${s.code || 'NCC'} - ${s.name}</option>
      `).join('');
    }
  }

  const creatorInput = document.getElementById('inb-creator-name');
  if (creatorInput && (!creatorInput.value || creatorInput.value === '[Tên bạn]')) {
    creatorInput.value = 'Nguyễn Văn A';
  }

  // Set default expected date = today + 3 days
  const expDateInput = document.getElementById('inb-expected-date');
  if (expDateInput) {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    expDateInput.value = future.toISOString().slice(0, 10);
  }

  // Reset items form list and populate with first selected supplier
  const container = document.getElementById('inbound-items-form-list');
  if (container) {
    container.innerHTML = '';
    addInboundItemRow(); // Add first default row for the selected supplier
  }

  openModal('create-inbound-modal');
}

function addInboundItemRow() {
  const container = document.getElementById('inbound-items-form-list');
  if (!container) return;

  const availableProducts = getProductsForSelectedInboundSupplier();
  const rowId = 'item_row_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const div = document.createElement('div');
  div.id = rowId;
  div.style.cssText = 'display:grid; grid-template-columns: 2fr 1fr 1.2fr 1fr 40px; gap:8px; align-items:center; background:var(--card-bg); padding:8px; border:1px solid var(--border); border-radius:6px;';

  const productOptions = buildInboundProductOptionsHtml(availableProducts, allProductsList);

  div.innerHTML = `
    <div>
      <label style="font-size:0.75rem; font-weight:600; color:var(--text-muted);">Sản Phẩm Của NCC</label>
      <select class="form-control item-product-select" style="font-size:0.85rem;" onchange="onInboundItemProductChange('${rowId}')">
        ${productOptions}
      </select>
    </div>
    <div>
      <label style="font-size:0.75rem; font-weight:600; color:var(--text-muted);">Số Lượng Dự Kiến</label>
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
  if (availableProducts.length > 0) {
    onInboundItemProductChange(rowId);
  } else {
    calculateInboundFormTotals();
  }
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

  if (select && costInput) {
    if (select.selectedIndex >= 0 && select.value) {
      const selectedOption = select.options[select.selectedIndex];
      const defaultCost = selectedOption ? (selectedOption.dataset.cost || 0) : 0;
      costInput.value = typeof formatNumberWithDots === 'function' ? formatNumberWithDots(defaultCost) : defaultCost;
    } else {
      costInput.value = '0';
    }
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
  const expectedDate = document.getElementById('inb-expected-date')?.value || '';
  const createdBy = document.getElementById('inb-creator-name')?.value?.trim() || 'Kỹ thuật';
  const notes = document.getElementById('inb-notes')?.value?.trim() || '';

  if (!supplierSelect || !supplierSelect.value) {
    showToast('Vui lòng chọn Nhà cung cấp!', 'warning');
    return;
  }

  const supplierOption = supplierSelect.selectedIndex >= 0 ? supplierSelect.options[supplierSelect.selectedIndex] : null;
  const supplierName = supplierOption ? (supplierOption.dataset.name || supplierOption.text.replace(/^[^-]+-\s*/, '')) : supplierSelect.value;
  const supplierId = supplierSelect.value;

  const container = document.getElementById('inbound-items-form-list');
  const rows = container ? container.querySelectorAll('[id^="item_row_"]') : [];

  if (rows.length === 0) {
    showToast('Vui lòng thêm ít nhất 1 mặt hàng mua!', 'warning');
    return;
  }

  const items = [];
  for (const row of rows) {
    const select = row.querySelector('.item-product-select');
    const qtyInput = row.querySelector('.item-qty-input');
    const costInput = row.querySelector('.item-cost-input');

    if (select) {
      const selectedOption = select.selectedIndex >= 0 ? select.options[select.selectedIndex] : null;
      const prodId = select.value;

      if (!prodId || (selectedOption && selectedOption.disabled)) {
        showToast('Vui lòng chọn sản phẩm hợp lệ cho tất cả các dòng!', 'warning');
        return;
      }

      // Try finding product in master list if dataset not complete
      const matchedProd = (allProductsList || []).find(p => p.id === prodId || p.sku === prodId);
      const sku = selectedOption?.dataset?.sku || matchedProd?.sku || prodId;
      const name = selectedOption?.dataset?.name || matchedProd?.name || (selectedOption ? selectedOption.text.replace(/^[^-]+-\s*/, '') : 'Sản phẩm');
      const unit = selectedOption?.dataset?.unit || matchedProd?.unit || 'Cái';

      const expected_qty = parseFormattedNumber(qtyInput ? qtyInput.value : 1) || 1;
      const cost_price = parseFormattedNumber(costInput ? costInput.value : 0) || (matchedProd?.cost_price || 0);
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
  }

  if (items.length === 0) {
    showToast('Vui lòng chọn ít nhất 1 sản phẩm hợp lệ!', 'warning');
    return;
  }

  const warehouseInput = document.getElementById('inb-warehouse');
  const warehouse = (warehouseInput?.value || '').trim();
  if (!warehouse) {
    showToast('Vui lòng điền Kho nhập hàng (Vị trí lưu kho)!', 'warning');
    if (warehouseInput) warehouseInput.focus();
    return;
  }

  const orderData = {
    supplier_id: supplierId,
    supplier_name: supplierName,
    warehouse: warehouse,
    created_by: createdBy,
    expected_date: expectedDate,
    notes: notes,
    status: 'Pending'
  };

  try {
    const resOrder = await window.dbProvider.createInboundOrder(orderData, items);
    showToast(`Đã tạo phiếu PR / Inbound (${resOrder.code || 'PR'}) thành công!`, 'success');
    closeModal('create-inbound-modal');
    await loadInventoryData();
  } catch (err) {
    console.error('Error creating inbound order:', err);
    showToast('Lỗi tạo phiếu Inbound: ' + (err.message || 'Lỗi hệ thống'), 'danger', 10000);
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
  const fulSupplier = document.getElementById('ful-supplier');
  if (fulSupplier) fulSupplier.textContent = inbound.supplier_name || '';

  const isPending = inbound.status === 'Pending';
  const fulWhInput = document.getElementById('ful-warehouse-input');
  if (fulWhInput) {
    fulWhInput.value = inbound.warehouse || 'Kho HG';
    fulWhInput.disabled = !isPending;
  }
  const fulWhText = document.getElementById('ful-warehouse');
  if (fulWhText) fulWhText.textContent = inbound.warehouse || 'Kho HG';

  const fulCreator = document.getElementById('ful-creator');
  if (fulCreator) fulCreator.textContent = inbound.created_by || 'Nguyễn Văn A';

  const tbody = document.getElementById('fulfill-items-tbody');

  tbody.innerHTML = items.map((it, idx) => {
    const expQty = it.expected_qty || 1;
    const recQty = isPending ? (it.received_qty !== undefined ? it.received_qty : expQty) : it.received_qty;
    const cost = Number(it.cost_price) || 0;
    const subtotal = recQty * cost;

    return `
      <tr data-prod-id="${it.product_id}" data-sku="${it.product_sku}" data-name="${it.product_name}" data-unit="${it.unit}" data-cost="${cost}" data-expected-qty="${expQty}">
        <td><code>${it.product_sku}</code></td>
        <td><strong>${it.product_name}</strong></td>
        <td><strong>${expQty}</strong> ${it.unit || 'Cái'}</td>
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
  onFulfillPaymentStatusChange();
  openModal('fulfill-inbound-modal');
}

function onFulfillPaymentStatusChange() {
  const statusSelect = document.getElementById('ful-pay-status-select');
  const groupElem = document.getElementById('ful-partial-pay-group');
  const amountInput = document.getElementById('ful-pay-amount-input');
  if (!statusSelect || !groupElem) return;

  const status = statusSelect.value;
  if (status === 'Partial') {
    groupElem.style.display = 'block';
    if (amountInput && (!amountInput.value || parseFormattedNumber(amountInput.value) === 0)) {
      const grandTotalElem = document.getElementById('ful-grand-total');
      const total = parseFormattedNumber(grandTotalElem ? grandTotalElem.textContent : 0);
      amountInput.value = formatNumberWithDots(Math.round(total * 0.5));
    }
  } else {
    groupElem.style.display = 'none';
  }
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

  if (document.getElementById('ful-pay-status-select') && document.getElementById('ful-pay-status-select').value === 'Partial') {
    onFulfillPaymentStatusChange();
  }
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
    const expQty = Number(row.dataset.expectedQty) || 1;

    const qtyInput = row.querySelector('.ful-rec-qty-input');
    const recQty = qtyInput ? (parseFormattedNumber(qtyInput.value) || 0) : expQty;

    itemsWithReceivedQty.push({
      product_id: prodId,
      product_sku: sku,
      product_name: name,
      unit: unit,
      cost_price: cost,
      expected_qty: expQty,
      received_qty: recQty
    });
  });

  const payStatusSelect = document.getElementById('ful-pay-status-select');
  const payMethodSelect = document.getElementById('ful-pay-method-select');
  const payStatus = payStatusSelect ? payStatusSelect.value : 'Debt';
  const payMethod = payMethodSelect ? payMethodSelect.value : 'Bank';

  const grandTotalElem = document.getElementById('ful-grand-total');
  const grandTotal = parseFormattedNumber(grandTotalElem ? grandTotalElem.textContent : 0);

  let paidAmount = 0;
  if (payStatus === 'Full') {
    paidAmount = grandTotal;
  } else if (payStatus === 'Partial') {
    const amountInput = document.getElementById('ful-pay-amount-input');
    paidAmount = parseFormattedNumber(amountInput ? amountInput.value : 0);
  }

  const inboundObj = (allInboundOrdersList || []).find(o => o.id === inboundId || o.code === inboundId);
  const customWarehouse = (document.getElementById('ful-warehouse-input')?.value || '').trim() || (inboundObj ? inboundObj.warehouse : '');

  if (inboundObj) {
    inboundObj.paid_amount = paidAmount;
    inboundObj.payment_method = payMethod;
    if (customWarehouse) inboundObj.warehouse = customWarehouse;
  }

  try {
    await window.dbProvider.fulfillInboundOrder(inboundId, itemsWithReceivedQty, 'Thủ kho', receiverNotes, customWarehouse);
    showToast(`Đã nhập hàng vào "${customWarehouse || 'kho'}" thành công!`, 'success');
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
    if (window.dbProvider && typeof window.dbProvider.cancelInboundOrder === 'function') {
      await window.dbProvider.cancelInboundOrder(inboundId);
      showToast('Đã hủy đơn PR / Inbound thành công!', 'info');
      await loadInventoryData();
    } else {
      showToast('Chưa khởi tạo trình kết nối CSDL để hủy đơn.', 'danger');
    }
  } catch (err) {
    console.error('Error cancelling inbound order:', err);
    showToast('Lỗi khi hủy đơn: ' + (err.message || 'Lỗi không xác định'), 'danger');
  }
}

/* =======================================================
   SUPPLIERS PROCUREMENT MODULE LOGIC (NHÀ CUNG CẤP INBOUND)
   ======================================================= */

function openSupplierPaymentDirectly(supplierName) {
  window.location.href = `cong-no.html?paySupplier=${encodeURIComponent(supplierName)}`;
}

function populateSupplierSelectOptions() {
  const select = document.getElementById('inb-supplier-select');
  if (!select) return;

  const suppliers = (allCustomersList || []).filter(c => c.type === 'Supplier' || (c.code || '').startsWith('NCC'));
  const supplierMap = new Map();
  suppliers.forEach(s => supplierMap.set(s.name, s));

  if (supplierMap.size === 0) {
    select.innerHTML = `<option value="" disabled selected>-- Chưa có Nhà Cung Cấp nào --</option>`;
    return;
  }

  let html = Array.from(supplierMap.values()).map(s => `
    <option value="${s.id || s.name}" data-name="${s.name}" data-code="${s.code || ''}" data-id="${s.id || ''}">${s.code || 'NCC'} - ${s.name}</option>
  `).join('');

  select.innerHTML = html;
}

function filterSuppliersTable() {
  const searchInput = document.getElementById('supplier-search-input');
  const search = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const suppliers = (allCustomersList || []).filter(c => c.type === 'Supplier');

  const filtered = suppliers.filter(s => {
    return (s.name || '').toLowerCase().includes(search) ||
      (s.code || '').toLowerCase().includes(search) ||
      (s.phone || '').toLowerCase().includes(search) ||
      (s.email || '').toLowerCase().includes(search) ||
      (s.tax_id || '').toLowerCase().includes(search) ||
      (s.contact_person || '').toLowerCase().includes(search) ||
      (s.address || '').toLowerCase().includes(search);
  });

  renderSuppliersTable(filtered);
}

function renderSuppliersTable(suppliersList) {
  const tbody = document.getElementById('suppliers-tbody');
  if (!tbody) return;

  const suppliers = suppliersList || (allCustomersList || []).filter(c => c.type === 'Supplier');

  if (suppliers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:var(--text-muted);">Chưa có dữ liệu nhà cung cấp nào. Nhấn "+ Thêm Nhà Cung Cấp Mới" để tạo.</td></tr>`;
    return;
  }

  const cancelledInbCodes = new Set(
    (allInboundOrdersList || [])
      .filter(i => {
        const s = (i.status || '').toLowerCase();
        return s === 'cancelled' || s === 'đã hủy';
      })
      .flatMap(i => [i.code, i.id].filter(Boolean))
  );

  tbody.innerHTML = suppliers.map(s => {
    // Calculate supplier debt (Payable), excluding cancelled inbounds
    const supplierDebts = (allDebtsList || []).filter(d =>
      d.customer_name === s.name &&
      d.type === 'Payable' &&
      (!d.order_code || !cancelledInbCodes.has(d.order_code)) &&
      (!d.id || !cancelledInbCodes.has(d.id.replace(/^d_inb_|^d_/, '')))
    );
    const remainingDebt = supplierDebts.reduce((sum, d) => sum + (Number(d.remaining_amount) || 0), 0);

    // Count inbound orders
    const inbounds = (allInboundOrdersList || []).filter(i => i.supplier_name === s.name || i.supplier_id === s.id);
    const inboundCount = inbounds.length;

    return `
      <tr>
        <td><code>${s.code || 'NCC'}</code></td>
        <td><strong>${s.name}</strong></td>
        <td>
          <div style="font-weight:600;">${s.contact_person && s.contact_person !== '-' ? s.contact_person : '-'}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);"><i class="bi bi-telephone"></i> ${s.phone || '-'}</div>
        </td>
        <td style="font-size:0.83rem;">
          <div>${s.email && s.email !== '-' ? s.email : '-'}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${s.tax_id && s.tax_id !== '-' ? 'MST: ' + s.tax_id : ''}</div>
        </td>
        <td style="font-size:0.85rem;">${s.address || '-'}</td>
        <td>
          <span class="badge badge-neutral">${s.group_name || 'Đại lý'}</span>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${s.route || ''}</div>
        </td>
        <td style="font-weight:800; color:${remainingDebt > 0 ? 'var(--danger)' : 'var(--success)'}; font-size:0.95rem;">
          ${formatVND(remainingDebt)}
        </td>
        <td><span class="badge badge-info">${inboundCount} đơn Inbound</span></td>
        <td>
          <div style="display:flex; gap:6px; justify-content:center;">
            ${remainingDebt > 0 ? `
              <button class="btn btn-warning" style="padding:4px 8px; font-size:0.75rem; background:#f59e0b; border-color:#d97706; color:#fff;" onclick="openSupplierPaymentDirectly('${s.name.replace(/'/g, "\\'")}')">
                <i class="bi bi-cash-stack"></i> Chi Trả Nợ
              </button>
            ` : ''}
            <button class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;" onclick="openCreateInboundForSupplier('${s.id}', '${s.name.replace(/'/g, "\\'")}')">
              <i class="bi bi-plus-circle"></i> + Tạo PR / Inbound
            </button>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem; background:#475569; border-color:#475569; color:#fff;" onclick="filterInboundTableBySupplier('${s.name.replace(/'/g, "\\'")}')">
              <i class="bi bi-journal-text"></i> Xem Inbound
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openCreateInboundForSupplier(supplierId, supplierName) {
  openCreateInboundModal();
  const select = document.getElementById('inb-supplier-select');
  if (select) {
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].value === supplierId || select.options[i].dataset.name === supplierName) {
        select.selectedIndex = i;
        break;
      }
    }
    onInboundSupplierChange();
  }
}

function filterInboundTableBySupplier(supplierName) {
  switchInventoryTab('inbound');
  const searchInput = document.getElementById('inbound-search-input');
  if (searchInput) {
    searchInput.value = supplierName;
    filterInboundTable();
  }
}

function openCreateSupplierModal() {
  const suppliers = (allCustomersList || []).filter(c => c.type === 'Supplier');
  let maxNum = 0;
  suppliers.forEach(s => {
    if (s.code && s.code.startsWith('NCC')) {
      const num = parseInt(s.code.replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });

  const nextCode = 'NCC' + String(maxNum + 1).padStart(2, '0');
  const codeInput = document.getElementById('new-sup-code');
  if (codeInput) codeInput.value = nextCode;

  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  setVal('new-sup-name', '');
  setVal('new-sup-phone', '');
  setVal('new-sup-email', '');
  setVal('new-sup-tax-id', '');
  setVal('new-sup-contact-person', '');
  setVal('new-sup-group', 'Đại lý');
  setVal('new-sup-route', '');
  setVal('new-sup-address', '');
  setVal('new-sup-notes', '');

  openModal('create-supplier-modal');
}

async function submitCreateSupplier() {
  const getVal = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

  const code = getVal('new-sup-code') || ('NCC' + Math.floor(10 + Math.random() * 90));
  const name = getVal('new-sup-name');
  const phone = getVal('new-sup-phone');
  const email = getVal('new-sup-email');
  const taxId = getVal('new-sup-tax-id');
  const contactPerson = getVal('new-sup-contact-person');
  const groupName = getVal('new-sup-group') || 'Đại lý';
  const route = getVal('new-sup-route');
  const address = getVal('new-sup-address');
  const notes = getVal('new-sup-notes');

  if (!name) {
    showToast('Vui lòng nhập tên nhà cung cấp!', 'warning');
    return;
  }

  // Check duplicate code locally
  const duplicate = (allCustomersList || []).find(c => (c.code || '').toLowerCase() === code.toLowerCase());
  if (duplicate) {
    showToast(`Mã nhà cung cấp "${code}" đã tồn tại (đối tác: ${duplicate.name}). Vui lòng nhập mã khác!`, 'warning', 7000);
    return;
  }

  const supplierObj = {
    code: code,
    name: name,
    phone: phone || '-',
    email: email || '-',
    address: address || '-',
    tax_id: taxId || '-',
    contact_person: contactPerson || '-',
    group_name: groupName,
    route: route || 'Tuyến KCN - Đại Lý',
    notes: notes || '',
    type: 'Supplier',
    current_debt: 0,
    created_at: new Date().toISOString()
  };

  try {
    await window.dbProvider.addSupplier(supplierObj);
    showToast(`Đã thêm nhà cung cấp "${name}" đồng bộ bảng public.suppliers trên Supabase thành công!`, 'success');
    closeModal('create-supplier-modal');
    await loadInventoryData();
  } catch (err) {
    console.error('Submit create supplier error:', err);
    showToast('Lỗi khi thêm nhà cung cấp: ' + (err.message || 'Lỗi không xác định'), 'danger', 8000);
  }
}
