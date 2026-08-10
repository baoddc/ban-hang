/* =======================================================
   INVENTORY & WAREHOUSE LOGIC (INVENTORY.JS)
   ======================================================= */

let allProductsList = [];
let allTransactionsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadInventoryData();
});

async function loadInventoryData() {
  if (!window.dbProvider) return;

  allProductsList = await window.dbProvider.getProducts();
  allTransactionsList = await window.dbProvider.getInventoryTransactions();

  calculateInventoryKpis();
  renderInventoryTable(allProductsList);
  renderLedgerTable(allTransactionsList);
  populateTxProductSelect();
}

function calculateInventoryKpis() {
  const totalSkus = allProductsList.length;
  const valuation = allProductsList.reduce((sum, p) => sum + ((p.cost_price || 0) * (p.stock_quantity || 0)), 0);
  const lowStockCount = allProductsList.filter(p => p.stock_quantity <= (p.min_stock_alert || 5)).length;

  document.getElementById('inv-total-skus').textContent = totalSkus + ' SKUs';
  document.getElementById('inv-total-valuation').textContent = formatVND(valuation);
  document.getElementById('inv-low-stock-count').textContent = lowStockCount;
}

function switchInventoryTab(tab) {
  const productsView = document.getElementById('inv-products-view');
  const ledgerView = document.getElementById('inv-ledger-view');
  const btnProducts = document.getElementById('btn-tab-products');
  const btnLedger = document.getElementById('btn-tab-ledger');

  if (tab === 'products') {
    productsView.style.display = 'block';
    ledgerView.style.display = 'none';
    btnProducts.classList.add('active');
    btnLedger.classList.remove('active');
  } else {
    productsView.style.display = 'none';
    ledgerView.style.display = 'block';
    btnProducts.classList.remove('active');
    btnLedger.classList.add('active');
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

function openNewProductModal() {
  document.getElementById('prod-sku').value = '';
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
  const sku = document.getElementById('prod-sku').value.trim();
  const name = document.getElementById('prod-name').value.trim();
  const category = document.getElementById('prod-category').value.trim();
  const unit = document.getElementById('prod-unit').value.trim();
  const cost_price = parseFormattedNumber(document.getElementById('prod-cost').value);
  const selling_price = parseFormattedNumber(document.getElementById('prod-price').value);
  const stock_quantity = parseFormattedNumber(document.getElementById('prod-stock').value);
  const location = document.getElementById('prod-location').value.trim();

  if (!sku || !name) {
    showToast('Vui lòng nhập Mã SKU và Tên sản phẩm!', 'warning');
    return;
  }

  const newProd = {
    sku, name, category, unit, cost_price, selling_price, stock_quantity, min_stock_alert: 5, location
  };

  await window.dbProvider.addProduct(newProd);
  showToast('Tạo sản phẩm mới trong kho thành công!', 'success');

  closeModal('product-modal');
  await loadInventoryData();
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
