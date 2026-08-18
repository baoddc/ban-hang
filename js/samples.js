/* =======================================================
   PRODUCT SAMPLES MODULE LOGIC (SAMPLES.JS)
   BAO ERP Enterprise Suite
   ======================================================= */

let allSamples = [];
let allCustomers = [];
let allProducts = [];

let currentTab = 'list'; // 'list', 'by-store', 'by-product', 'feedback'
let editingSampleId = null;
let modalProductItems = [];

// DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
  await initSamplesData();
  setupEventListeners();
});

// Initialize Data from Supabase / LocalStorage Provider
async function initSamplesData() {
  if (!window.dbProvider) {
    console.error('dbProvider is not available');
    return;
  }

  try {
    const [samples, customers, products] = await Promise.all([
      window.dbProvider.getSamples(),
      window.dbProvider.getCustomers(),
      window.dbProvider.getProducts()
    ]);

    allSamples = Array.isArray(samples) ? samples : [];
    allCustomers = Array.isArray(customers) ? customers : [];
    allProducts = Array.isArray(products) ? products : [];

    populateFilterDropdowns();
    updateKpis();
    renderActiveTab();
  } catch (err) {
    console.error('Failed to load sample data:', err);
    showToast('Lỗi khi tải dữ liệu từ CSDL', 'danger');
  }
}

// Setup Event Listeners
function setupEventListeners() {
  const searchInput = document.getElementById('sample-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => renderActiveTab());
  }

  const statusFilter = document.getElementById('sample-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => renderActiveTab());
  }

  const storeFilter = document.getElementById('sample-store-filter');
  if (storeFilter) {
    storeFilter.addEventListener('change', () => renderActiveTab());
  }

  const categoryFilter = document.getElementById('sample-category-filter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => renderActiveTab());
  }

  const salesFilter = document.getElementById('sample-sales-filter');
  if (salesFilter) {
    salesFilter.addEventListener('change', () => renderActiveTab());
  }
}

// Populate Filter Options
function populateFilterDropdowns() {
  // Stores Filter
  const storeSelect = document.getElementById('sample-store-filter');
  if (storeSelect) {
    const uniqueStores = [...new Set(allSamples.map(s => s.customer_name).filter(Boolean))];
    let storeOptions = '<option value="">-- Tất cả cửa hàng --</option>';
    uniqueStores.sort().forEach(store => {
      storeOptions += `<option value="${escapeHtml(store)}">${escapeHtml(store)}</option>`;
    });
    storeSelect.innerHTML = storeOptions;
  }

  // Category Filter
  const catSelect = document.getElementById('sample-category-filter');
  if (catSelect) {
    const uniqueCats = [...new Set(allProducts.map(p => p.category).concat(allSamples.map(s => s.category)).filter(Boolean))];
    let catOptions = '<option value="">-- Tất cả loại mẫu --</option>';
    uniqueCats.sort().forEach(c => {
      catOptions += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
    });
    catSelect.innerHTML = catOptions;
  }

  // Salesperson Filter
  const salesSelect = document.getElementById('sample-sales-filter');
  if (salesSelect) {
    const uniqueSales = [...new Set(allSamples.map(s => s.sales_person).concat(allCustomers.map(c => c.sales_person)).filter(Boolean))];
    let salesOptions = '<option value="">-- Tất cả Sales --</option>';
    uniqueSales.sort().forEach(sp => {
      salesOptions += `<option value="${escapeHtml(sp)}">${escapeHtml(sp)}</option>`;
    });
    salesSelect.innerHTML = salesOptions;
  }
}

// Update Top KPI Counters
function updateKpis() {
  const totalCount = allSamples.length;
  
  let displayingCount = 0;
  let convertedCount = 0;
  let returnedCount = 0;
  const storeSet = new Set();
  const productSet = new Set();

  allSamples.forEach(s => {
    if (s.customer_name) storeSet.add(s.customer_name);
    if (s.product_name) productSet.add(s.product_name);
    if (s.status === 'Displaying') displayingCount += typeof parseQuantity === 'function' ? parseQuantity(s.quantity) : (parseFloat(s.quantity) || 1);
    if (s.status === 'Converted') convertedCount++;
    if (s.status === 'Returned') returnedCount++;
  });

  const conversionRate = totalCount > 0 ? ((convertedCount / totalCount) * 100).toFixed(1) : '0';

  const kpiTotalEl = document.getElementById('kpi-total-samples');
  if (kpiTotalEl) kpiTotalEl.textContent = totalCount;

  const kpiDisplayingEl = document.getElementById('kpi-displaying-samples');
  if (kpiDisplayingEl) kpiDisplayingEl.textContent = typeof formatQuantity === 'function' ? formatQuantity(displayingCount) : displayingCount;

  const kpiStoresEl = document.getElementById('kpi-stores-reached');
  if (kpiStoresEl) kpiStoresEl.textContent = storeSet.size;

  const kpiConvertedEl = document.getElementById('kpi-converted-samples');
  if (kpiConvertedEl) kpiConvertedEl.textContent = `${convertedCount} (${conversionRate}%)`;
}

// Switch Active View Tab
function switchSampleTab(tabName) {
  currentTab = tabName;
  
  document.querySelectorAll('.sample-tabs .pill').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.getElementById(`tab-btn-${tabName}`);
  if (activeBtn) activeBtn.classList.add('active');

  const tabList = document.getElementById('view-sample-list');
  const tabStore = document.getElementById('view-sample-by-store');
  const tabProduct = document.getElementById('view-sample-by-product');
  const tabFeedback = document.getElementById('view-sample-feedback');

  if (tabList) tabList.style.display = tabName === 'list' ? 'block' : 'none';
  if (tabStore) tabStore.style.display = tabName === 'by-store' ? 'block' : 'none';
  if (tabProduct) tabProduct.style.display = tabName === 'by-product' ? 'block' : 'none';
  if (tabFeedback) tabFeedback.style.display = tabName === 'feedback' ? 'block' : 'none';

  renderActiveTab();
}

// Filter Samples Based on Current Inputs
function getFilteredSamples() {
  const query = (document.getElementById('sample-search-input')?.value || '').toLowerCase().trim();
  const status = document.getElementById('sample-status-filter')?.value || '';
  const store = document.getElementById('sample-store-filter')?.value || '';
  const category = document.getElementById('sample-category-filter')?.value || '';
  const sales = document.getElementById('sample-sales-filter')?.value || '';

  return allSamples.filter(s => {
    // Status filter
    if (status && s.status !== status) return false;

    // Store filter
    if (store && s.customer_name !== store) return false;

    // Category filter
    if (category && s.category !== category) return false;

    // Sales filter
    if (sales && s.sales_person !== sales) return false;

    // Text search query
    if (query) {
      const matchCode = (s.code || '').toLowerCase().includes(query);
      const matchStore = (s.customer_name || '').toLowerCase().includes(query);
      const matchPhone = (s.customer_phone || '').toLowerCase().includes(query);
      const matchProd = (s.product_name || '').toLowerCase().includes(query);
      const matchSku = (s.product_sku || '').toLowerCase().includes(query);
      const matchSales = (s.sales_person || '').toLowerCase().includes(query);
      const matchRoute = (s.route || '').toLowerCase().includes(query);
      const matchNotes = (s.notes || '').toLowerCase().includes(query);
      const matchFeedback = (s.feedback || '').toLowerCase().includes(query);

      return matchCode || matchStore || matchPhone || matchProd || matchSku || matchSales || matchRoute || matchNotes || matchFeedback;
    }

    return true;
  });
}

// Render Content for the Currently Active Tab
function renderActiveTab() {
  const filtered = getFilteredSamples();

  if (currentTab === 'list') {
    renderSampleListTable(filtered);
  } else if (currentTab === 'by-store') {
    renderSamplesByStore(filtered);
  } else if (currentTab === 'by-product') {
    renderSamplesByProduct(filtered);
  } else if (currentTab === 'feedback') {
    renderSamplesFeedback(filtered);
  }
}

// Render Tab 1: Detailed List Table
function renderSampleListTable(samples) {
  const tbody = document.getElementById('samples-table-body');
  const countBadge = document.getElementById('filtered-count-badge');
  if (countBadge) countBadge.textContent = `${samples.length} phiếu`;

  if (!tbody) return;

  if (samples.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center" style="padding: 40px; color: var(--text-muted);">
          <i class="bi bi-inbox" style="font-size: 2.5rem; display: block; margin-bottom: 8px; opacity: 0.5;"></i>
          Không tìm thấy dữ liệu phát mẫu nào phù hợp với bộ lọc hiện tại.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = samples.map((s, index) => {
    const statusBadge = getStatusBadge(s.status);
    const dateFormatted = formatDate(s.handover_date);
    
    // Check if multi items exist
    const hasMultipleItems = Array.isArray(s.items) && s.items.length > 0;
    const itemsCountText = hasMultipleItems ? ` <span class="badge" style="background:var(--primary-subtle); color:var(--primary); font-size:0.75rem;">+${s.items.length} món</span>` : '';

    return `
      <tr>
        <td style="font-weight: 700; color: var(--text-main);">${index + 1}</td>
        <td>
          <span style="font-weight: 700; color: var(--primary);">${escapeHtml(s.code || 'N/A')}</span>
          <div style="font-size: 0.76rem; color: var(--text-muted);">${dateFormatted}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(s.customer_name || 'Khách vãng lai')}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">
            ${s.customer_phone ? `<i class="bi bi-telephone"></i> ${escapeHtml(s.customer_phone)}` : ''}
            ${s.route ? ` • <i class="bi bi-geo-alt"></i> ${escapeHtml(s.route)}` : ''}
          </div>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(s.product_name || 'Chưa đặt tên')} ${itemsCountText}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">
            ${s.product_sku ? `<span class="badge" style="font-size:0.72rem;">${escapeHtml(s.product_sku)}</span>` : ''}
            ${s.category ? ` ${escapeHtml(s.category)}` : ''}
          </div>
        </td>
        <td style="text-align: center;">
          <span style="font-weight: 700; font-size: 1rem;">${typeof formatQuantity === 'function' ? formatQuantity(s.quantity) : (s.quantity || 1)}</span>
          <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">${escapeHtml(s.unit || 'Mẫu')}</span>
        </td>
        <td>
          <div style="font-size: 0.85rem; font-weight: 500;">${escapeHtml(s.sales_person || 'N/A')}</div>
        </td>
        <td>${statusBadge}</td>
        <td style="max-width: 180px;">
          <div style="font-size: 0.8rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(s.feedback || s.notes || '')}">
            ${s.feedback ? `<i class="bi bi-chat-dots text-primary"></i> ${escapeHtml(s.feedback)}` : (s.notes ? escapeHtml(s.notes) : '<em style="color:var(--text-muted);">Chưa có</em>')}
          </div>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-icon btn-sm" onclick="openPrintReceiptModal('${s.id}')" title="In biên bản giao nhận">
            <i class="bi bi-printer"></i>
          </button>
          <button class="btn btn-icon btn-sm" onclick="openEditSampleModal('${s.id}')" title="Chỉnh sửa phiếu">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn btn-icon btn-sm" onclick="convertToSaleOrder('${s.customer_id || ''}')" title="Tạo đơn hàng từ mẫu" style="color: var(--success, #10b981);">
            <i class="bi bi-cart-plus-fill"></i>
          </button>
          <button class="btn btn-icon btn-sm" onclick="confirmDeleteSample('${s.id}')" title="Xóa phiếu" style="color: var(--danger, #ef4444);">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Render Tab 2: Grouped by Store Matrix View
function renderSamplesByStore(samples) {
  const container = document.getElementById('store-matrix-container');
  if (!container) return;

  // Group samples by store
  const storeMap = new Map();

  samples.forEach(s => {
    const storeKey = s.customer_name || 'Khách vãng lai';
    if (!storeMap.has(storeKey)) {
      storeMap.set(storeKey, {
        customer_id: s.customer_id,
        customer_name: storeKey,
        customer_phone: s.customer_phone,
        customer_address: s.customer_address,
        route: s.route,
        sales_person: s.sales_person,
        samples: []
      });
    }
    storeMap.get(storeKey).samples.push(s);
  });

  if (storeMap.size === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="bi bi-shop" style="font-size: 2.5rem; display: block; margin-bottom: 8px; opacity: 0.5;"></i>
        Chưa có cửa hàng nào được phát mẫu theo điều kiện tìm kiếm.
      </div>
    `;
    return;
  }

  container.innerHTML = Array.from(storeMap.values()).map(store => {
    const activeSamples = store.samples.filter(s => s.status === 'Displaying').length;
    const convertedSamples = store.samples.filter(s => s.status === 'Converted').length;

    return `
      <div class="store-card">
        <div class="store-card-header">
          <div>
            <div class="store-card-title">
              <i class="bi bi-shop-window text-primary"></i> ${escapeHtml(store.customer_name)}
            </div>
            <div class="store-card-meta">
              ${store.customer_phone ? `<span><i class="bi bi-telephone"></i> ${escapeHtml(store.customer_phone)}</span>` : ''}
              ${store.customer_address ? `<span><i class="bi bi-geo-alt"></i> ${escapeHtml(store.customer_address)}</span>` : ''}
              ${store.route ? `<span><i class="bi bi-signpost-2"></i> Tuyến: <strong>${escapeHtml(store.route)}</strong></span>` : ''}
              ${store.sales_person ? `<span><i class="bi bi-person-badge"></i> Sales: <strong>${escapeHtml(store.sales_person)}</strong></span>` : ''}
            </div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="openNewSampleModalForStore('${escapeHtml(store.customer_name)}', '${store.customer_id || ''}')" title="Phát thêm mẫu cho cửa hàng này">
            <i class="bi bi-plus-lg"></i> Thêm mẫu
          </button>
        </div>

        <div style="display: flex; gap: 8px; font-size: 0.8rem; font-weight: 600; padding: 4px 0;">
          <span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #2563eb;">
            <i class="bi bi-eye"></i> Đang trưng bày: ${activeSamples}
          </span>
          <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #059669;">
            <i class="bi bi-check-circle"></i> Đã chốt đơn: ${convertedSamples}
          </span>
        </div>

        <div class="store-sample-list">
          ${store.samples.map(s => {
            const formattedQty = typeof formatQuantity === 'function' ? formatQuantity(s.quantity) : (s.quantity || 1);
            return `
            <div class="store-sample-item">
              <div class="store-sample-item-info">
                <span class="store-sample-name" title="${escapeHtml(s.product_name)}">${escapeHtml(s.product_name)}</span>
                <span class="store-sample-sku">
                  ${s.product_sku ? `[${escapeHtml(s.product_sku)}] ` : ''}SL: ${formattedQty} ${escapeHtml(s.unit || 'Mẫu')} • Ngày: ${formatDate(s.handover_date)}
                </span>
                ${s.feedback ? `<span style="font-size:0.74rem; color:var(--primary);"><i class="bi bi-chat-quote"></i> ${escapeHtml(s.feedback)}</span>` : ''}
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                ${getStatusBadge(s.status)}
                <button class="btn btn-icon btn-sm" onclick="openEditSampleModal('${s.id}')" title="Cập nhật mẫu">
                  <i class="bi bi-pencil"></i>
                </button>
              </div>
            </div>
          `;
          }).join('')}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px; margin-top: auto;">
          <span style="font-size: 0.78rem; color: var(--text-muted);">Tổng cộng: <strong>${store.samples.length} mẫu</strong></span>
          <button class="btn btn-sm btn-secondary" onclick="convertToSaleOrder('${store.customer_id || ''}')" title="Lên đơn bán hàng cho cửa hàng này">
            <i class="bi bi-cart3"></i> Tạo đơn bán
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Render Tab 3: Grouped by Product Distribution View
function renderSamplesByProduct(samples) {
  const container = document.getElementById('product-dist-container');
  if (!container) return;

  // Group samples by product
  const productMap = new Map();

  samples.forEach(s => {
    const prodKey = s.product_sku ? `${s.product_sku} - ${s.product_name}` : s.product_name;
    if (!productMap.has(prodKey)) {
      productMap.set(prodKey, {
        product_id: s.product_id,
        product_sku: s.product_sku,
        product_name: s.product_name,
        category: s.category,
        totalQuantity: 0,
        stores: []
      });
    }
    const item = productMap.get(prodKey);
    const itemQty = typeof parseQuantity === 'function' ? parseQuantity(s.quantity) : (parseFloat(s.quantity) || 1);
    item.totalQuantity += itemQty;
    item.stores.push(s);
  });

  if (productMap.size === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="bi bi-box-seam" style="font-size: 2.5rem; display: block; margin-bottom: 8px; opacity: 0.5;"></i>
        Chưa có dữ liệu phân bổ sản phẩm mẫu nào phù hợp.
      </div>
    `;
    return;
  }

  container.innerHTML = Array.from(productMap.values()).map(prod => {
    return `
      <div class="product-dist-card">
        <div class="product-dist-header">
          <div>
            ${prod.product_sku ? `<span class="product-dist-sku">${escapeHtml(prod.product_sku)}</span>` : ''}
            <h4 style="font-size: 0.98rem; font-weight: 700; margin-top: 4px; color: var(--text-main);">${escapeHtml(prod.product_name)}</h4>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(prod.category || 'Mẫu chung')}</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 1.1rem; font-weight: 800; color: var(--primary);">${typeof formatQuantity === 'function' ? formatQuantity(prod.totalQuantity) : prod.totalQuantity}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Tổng mẫu phát</span>
          </div>
        </div>

        <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">
          Đang phủ tại <strong>${prod.stores.length}</strong> điểm bán / cửa hàng:
        </div>

        <div class="product-dist-stores">
          ${prod.stores.map(st => `
            <div class="product-dist-store-row">
              <div>
                <div style="font-weight: 600; font-size: 0.84rem; color: var(--text-main);">${escapeHtml(st.customer_name)}</div>
                <div style="font-size: 0.76rem; color: var(--text-muted);">
                  ${st.sales_person ? `Sales: ${escapeHtml(st.sales_person)}` : ''} • Ngày: ${formatDate(st.handover_date)}
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                ${getStatusBadge(st.status)}
                <button class="btn btn-icon btn-sm" onclick="openEditSampleModal('${st.id}')" title="Cập nhật">
                  <i class="bi bi-pencil"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Render Tab 4: Store Feedback & Evaluation Log
function renderSamplesFeedback(samples) {
  const container = document.getElementById('feedback-log-container');
  if (!container) return;

  const samplesWithFeedback = samples.filter(s => s.feedback || s.notes);

  if (samplesWithFeedback.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="bi bi-chat-heart" style="font-size: 2.5rem; display: block; margin-bottom: 8px; opacity: 0.5;"></i>
        Chưa có ghi nhận phản hồi hoặc đánh giá nào từ các cửa hàng nhận mẫu.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
      ${samplesWithFeedback.map(s => `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 10px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px dashed var(--border-color); padding-bottom: 10px;">
            <div>
              <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-main);">
                <i class="bi bi-shop text-primary"></i> ${escapeHtml(s.customer_name)}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${formatDate(s.handover_date)} • ${escapeHtml(s.sales_person || 'N/A')}</div>
            </div>
            ${getStatusBadge(s.status)}
          </div>

          <div style="font-size: 0.85rem; font-weight: 600; color: var(--primary);">
            <i class="bi bi-box2"></i> ${escapeHtml(s.product_name)} ${s.product_sku ? `[${escapeHtml(s.product_sku)}]` : ''}
          </div>

          ${s.feedback ? `
            <div style="background: var(--bg-subtle); border-left: 3px solid var(--primary); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--text-main);">
              <div style="font-weight: 600; font-size: 0.78rem; color: var(--primary); margin-bottom: 2px;">
                <i class="bi bi-chat-square-quote-fill"></i> Phản hồi từ cửa hàng:
              </div>
              ${escapeHtml(s.feedback)}
            </div>
          ` : ''}

          ${s.notes ? `
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              <strong>Ghi chú sales:</strong> ${escapeHtml(s.notes)}
            </div>
          ` : ''}

          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: auto; padding-top: 10px; border-top: 1px solid var(--border-color);">
            <button class="btn btn-sm btn-secondary" onclick="openEditSampleModal('${s.id}')">
              <i class="bi bi-pencil"></i> Sửa phản hồi
            </button>
            <button class="btn btn-sm btn-primary" onclick="convertToSaleOrder('${s.customer_id || ''}')">
              <i class="bi bi-cart-check"></i> Chốt đơn ngay
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Get HTML Status Badge
function getStatusBadge(status) {
  switch (status) {
    case 'Displaying':
      return `<span class="status-badge displaying"><i class="bi bi-eye-fill"></i> Đang trưng bày</span>`;
    case 'Converted':
      return `<span class="status-badge converted"><i class="bi bi-check-circle-fill"></i> Đã chốt đơn</span>`;
    case 'Returned':
      return `<span class="status-badge returned"><i class="bi bi-arrow-return-left"></i> Đã thu hồi</span>`;
    case 'Damaged':
      return `<span class="status-badge damaged"><i class="bi bi-exclamation-octagon-fill"></i> Hỏng / Mất</span>`;
    case 'Pending':
      return `<span class="status-badge pending"><i class="bi bi-hourglass-split"></i> Chờ giao</span>`;
    default:
      return `<span class="status-badge displaying"><i class="bi bi-eye-fill"></i> Đang trưng bày</span>`;
  }
}

// Modal Handlers
function openNewSampleModal() {
  editingSampleId = null;
  modalProductItems = [];

  const modalTitle = document.getElementById('sample-modal-title');
  if (modalTitle) modalTitle.innerHTML = '<i class="bi bi-plus-circle text-primary"></i> Tạo Phiếu Phát Mẫu Sản Phẩm';

  // Generate new code
  const today = new Date();
  const dateCode = today.toISOString().slice(2, 10).replace(/-/g, '');
  const randNum = Math.floor(100 + Math.random() * 900);
  const codeInput = document.getElementById('modal-sample-code');
  if (codeInput) codeInput.value = `PM-${dateCode}-${randNum}`;

  // Reset inputs
  document.getElementById('modal-customer-id').value = '';
  document.getElementById('modal-customer-search').value = '';
  document.getElementById('modal-customer-phone').value = '';
  document.getElementById('modal-customer-address').value = '';
  document.getElementById('modal-customer-route').value = '';
  document.getElementById('modal-sales-person').value = 'Nguyễn Thanh Tùng';
  document.getElementById('modal-handover-date').value = today.toISOString().split('T')[0];
  document.getElementById('modal-sample-status').value = 'Displaying';
  document.getElementById('modal-sample-feedback').value = '';
  document.getElementById('modal-sample-notes').value = '';

  // Add default single item row
  addModalProductRow();

  openModal('sample-handover-modal');
}

function openNewSampleModalForStore(storeName, customerId) {
  openNewSampleModal();

  const custSearch = document.getElementById('modal-customer-search');
  if (custSearch) custSearch.value = storeName;

  const custIdEl = document.getElementById('modal-customer-id');
  if (custIdEl) custIdEl.value = customerId || '';

  const matched = allCustomers.find(c => c.id === customerId || c.name === storeName);
  if (matched) {
    document.getElementById('modal-customer-phone').value = matched.phone || '';
    document.getElementById('modal-customer-address').value = matched.address || '';
    document.getElementById('modal-customer-route').value = matched.route || '';
    if (matched.sales_person) {
      document.getElementById('modal-sales-person').value = matched.sales_person;
    }
  }
}

function openEditSampleModal(sampleId) {
  const sample = allSamples.find(s => s.id === sampleId);
  if (!sample) return;

  editingSampleId = sampleId;

  const modalTitle = document.getElementById('sample-modal-title');
  if (modalTitle) modalTitle.innerHTML = `<i class="bi bi-pencil-square text-primary"></i> Sửa Phiếu Phát Mẫu: ${escapeHtml(sample.code)}`;

  document.getElementById('modal-sample-code').value = sample.code || '';
  document.getElementById('modal-customer-id').value = sample.customer_id || '';
  document.getElementById('modal-customer-search').value = sample.customer_name || '';
  document.getElementById('modal-customer-phone').value = sample.customer_phone || '';
  document.getElementById('modal-customer-address').value = sample.customer_address || '';
  document.getElementById('modal-customer-route').value = sample.route || '';
  document.getElementById('modal-sales-person').value = sample.sales_person || '';
  document.getElementById('modal-handover-date').value = sample.handover_date || new Date().toISOString().split('T')[0];
  document.getElementById('modal-sample-status').value = sample.status || 'Displaying';
  document.getElementById('modal-sample-feedback').value = sample.feedback || '';
  document.getElementById('modal-sample-notes').value = sample.notes || '';

  // Populate product items
  if (Array.isArray(sample.items) && sample.items.length > 0) {
    modalProductItems = JSON.parse(JSON.stringify(sample.items));
  } else {
    modalProductItems = [{
      product_id: sample.product_id || '',
      sku: sample.product_sku || '',
      name: sample.product_name || '',
      category: sample.category || '',
      quantity: sample.quantity !== undefined ? sample.quantity : 1,
      unit: sample.unit || 'Mẫu',
      notes: ''
    }];
  }

  renderModalProductRows();
  openModal('sample-handover-modal');
}

// Modal Multi-product list builder
function addModalProductRow() {
  modalProductItems.push({
    product_id: '',
    sku: '',
    name: '',
    category: '',
    quantity: 1,
    unit: 'Mẫu',
    notes: ''
  });
  renderModalProductRows();
}

function removeModalProductRow(index) {
  if (modalProductItems.length <= 1) {
    showToast('Phiếu phát mẫu phải có ít nhất 1 sản phẩm!', 'warning');
    return;
  }
  modalProductItems.splice(index, 1);
  renderModalProductRows();
}

function onModalItemQtyChange(idx, inputEl) {
  const parsed = typeof parseQuantity === 'function' ? parseQuantity(inputEl.value) : parseFloat(inputEl.value);
  if (!parsed || parsed <= 0) {
    modalProductItems[idx].quantity = 1;
    inputEl.value = 1;
  } else {
    modalProductItems[idx].quantity = parsed;
  }
}

function renderModalProductRows() {
  const container = document.getElementById('modal-product-rows');
  if (!container) return;

  container.innerHTML = modalProductItems.map((item, idx) => `
    <tr>
      <td style="width: 35%;">
        <div style="display: flex; gap: 6px;">
          <select class="form-control form-control-sm" onchange="onModalProductSelect(${idx}, this.value)">
            <option value="">-- Chọn sản phẩm từ Kho --</option>
            ${allProducts.map(p => `
              <option value="${p.id}" ${p.id === item.product_id ? 'selected' : ''}>
                ${p.sku} - ${escapeHtml(p.name)} (${p.category || 'Chung'})
              </option>
            `).join('')}
          </select>
        </div>
        <input type="text" class="form-control form-control-sm" style="margin-top: 4px;" placeholder="Hoặc nhập tên mẫu tuỳ chỉnh..." value="${escapeHtml(item.name || '')}" oninput="modalProductItems[${idx}].name = this.value">
      </td>
      <td style="width: 20%;">
        <input type="text" class="form-control form-control-sm" placeholder="Mã SKU" value="${escapeHtml(item.sku || '')}" oninput="modalProductItems[${idx}].sku = this.value">
        <input type="text" class="form-control form-control-sm" style="margin-top: 4px;" placeholder="Loại (VD: 60x60)" value="${escapeHtml(item.category || '')}" oninput="modalProductItems[${idx}].category = this.value">
      </td>
      <td style="width: 15%;">
        <input type="number" step="any" min="0" class="form-control form-control-sm text-center" value="${item.quantity !== undefined ? item.quantity : 1}" oninput="modalProductItems[${idx}].quantity = this.value === '' ? '' : (parseFloat(this.value.replace(',', '.')) || 0)" onchange="onModalItemQtyChange(${idx}, this)">
      </td>
      <td style="width: 15%;">
        <select class="form-control form-control-sm" onchange="modalProductItems[${idx}].unit = this.value">
          <option value="Mẫu" ${item.unit === 'Mẫu' ? 'selected' : ''}>Mẫu</option>
          <option value="Tấm" ${item.unit === 'Tấm' ? 'selected' : ''}>Tấm</option>
          <option value="Bộ" ${item.unit === 'Bộ' ? 'selected' : ''}>Bộ</option>
          <option value="Cuốn" ${item.unit === 'Cuốn' ? 'selected' : ''}>Cuốn</option>
          <option value="Cây" ${item.unit === 'Cây' ? 'selected' : ''}>Cây</option>
          <option value="Cái" ${item.unit === 'Cái' ? 'selected' : ''}>Cái</option>
        </select>
      </td>
      <td style="width: 15%; text-align: center;">
        <button type="button" class="btn btn-icon btn-sm" onclick="removeModalProductRow(${idx})" style="color: var(--danger);" title="Xóa dòng này">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function onModalProductSelect(index, productId) {
  const prod = allProducts.find(p => p.id === productId);
  if (prod) {
    modalProductItems[index].product_id = prod.id;
    modalProductItems[index].sku = prod.sku || '';
    modalProductItems[index].name = prod.name || '';
    modalProductItems[index].category = prod.category || '';
    modalProductItems[index].unit = prod.unit || 'Mẫu';
  } else {
    modalProductItems[index].product_id = '';
  }
  renderModalProductRows();
}

// Live Customer Search in Modal
function onModalCustomerSearch(input) {
  const val = (input.value || '').toLowerCase().trim();
  const listEl = document.getElementById('modal-customer-dropdown-list');
  if (!listEl) return;

  if (!val) {
    listEl.classList.remove('show');
    return;
  }

  const matches = allCustomers.filter(c => 
    (c.name || '').toLowerCase().includes(val) ||
    (c.code || '').toLowerCase().includes(val) ||
    (c.phone || '').toLowerCase().includes(val)
  ).slice(0, 8);

  if (matches.length === 0) {
    listEl.innerHTML = `
      <div class="search-dropdown-item" style="color: var(--text-muted); cursor: default;">
        Không tìm thấy khách hàng. Hệ thống sẽ lưu dưới tên mới nhập.
      </div>
    `;
    listEl.classList.add('show');
    return;
  }

  listEl.innerHTML = matches.map(c => `
    <div class="search-dropdown-item" onclick="selectModalCustomer('${c.id}')">
      <div style="font-weight: 600;">${escapeHtml(c.name)} <span class="badge" style="font-size:0.72rem;">${escapeHtml(c.code)}</span></div>
      <div class="subtext">
        ${c.phone ? `SĐT: ${escapeHtml(c.phone)}` : ''} 
        ${c.route ? `• Tuyến: ${escapeHtml(c.route)}` : ''}
        ${c.address ? `• Đ/C: ${escapeHtml(c.address)}` : ''}
      </div>
    </div>
  `).join('');

  listEl.classList.add('show');
}

function selectModalCustomer(customerId) {
  const cust = allCustomers.find(c => c.id === customerId);
  if (!cust) return;

  document.getElementById('modal-customer-id').value = cust.id;
  document.getElementById('modal-customer-search').value = cust.name;
  document.getElementById('modal-customer-phone').value = cust.phone || '';
  document.getElementById('modal-customer-address').value = cust.address || '';
  document.getElementById('modal-customer-route').value = cust.route || '';
  if (cust.sales_person) {
    document.getElementById('modal-sales-person').value = cust.sales_person;
  }

  const listEl = document.getElementById('modal-customer-dropdown-list');
  if (listEl) listEl.classList.remove('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('modal-customer-dropdown-list');
  const searchInput = document.getElementById('modal-customer-search');
  if (dropdown && dropdown.classList.contains('show')) {
    if (!dropdown.contains(e.target) && e.target !== searchInput) {
      dropdown.classList.remove('show');
    }
  }
});

// Save / Submit Sample Handover Record
async function saveSampleHandover() {
  const code = (document.getElementById('modal-sample-code')?.value || '').trim();
  const customerName = (document.getElementById('modal-customer-search')?.value || '').trim();
  const customerId = document.getElementById('modal-customer-id')?.value || null;
  const customerPhone = document.getElementById('modal-customer-phone')?.value || '';
  const customerAddress = document.getElementById('modal-customer-address')?.value || '';
  const route = document.getElementById('modal-customer-route')?.value || '';
  const salesPerson = document.getElementById('modal-sales-person')?.value || '';
  const handoverDate = document.getElementById('modal-handover-date')?.value || new Date().toISOString().split('T')[0];
  const status = document.getElementById('modal-sample-status')?.value || 'Displaying';
  const feedback = document.getElementById('modal-sample-feedback')?.value || '';
  const notes = document.getElementById('modal-sample-notes')?.value || '';

  if (!customerName) {
    showToast('Vui lòng nhập hoặc chọn Cửa hàng / Đại lý nhận mẫu!', 'warning');
    document.getElementById('modal-customer-search')?.focus();
    return;
  }

  // Validate items
  const validItems = modalProductItems.filter(it => (it.name || '').trim() || (it.sku || '').trim());
  if (validItems.length === 0) {
    showToast('Vui lòng chọn hoặc nhập ít nhất 1 sản phẩm mẫu!', 'warning');
    return;
  }

  const primaryItem = validItems[0];
  const primaryQty = typeof parseQuantity === 'function' ? parseQuantity(primaryItem.quantity) : (parseFloat(primaryItem.quantity) || 1);

  // Normalize all valid items quantities
  validItems.forEach(it => {
    it.quantity = typeof parseQuantity === 'function' ? parseQuantity(it.quantity) : (parseFloat(it.quantity) || 1);
  });

  const payload = {
    code: code || `PM-${Date.now()}`,
    customer_id: customerId,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_address: customerAddress,
    route: route,
    sales_person: salesPerson,
    product_id: primaryItem.product_id || null,
    product_sku: primaryItem.sku || '',
    product_name: primaryItem.name || 'Mẫu sản phẩm',
    category: primaryItem.category || '',
    quantity: primaryQty,
    unit: primaryItem.unit || 'Mẫu',
    handover_date: handoverDate,
    status: status,
    feedback: feedback,
    notes: notes,
    items: validItems
  };

  try {
    if (editingSampleId) {
      await window.dbProvider.updateSample(editingSampleId, payload);
      showToast('Đã cập nhật thông tin phiếu phát mẫu thành công!', 'success');
    } else {
      await window.dbProvider.addSample(payload);
      showToast('Đã tạo phiếu phát mẫu và tự động trừ tồn kho thành công!', 'success');
    }

    closeModal('sample-handover-modal');
    await initSamplesData();
  } catch (err) {
    console.error('Error saving sample:', err);
    showToast(err.message || 'Không thể lưu phiếu phát mẫu vào CSDL Supabase', 'danger');
  }
}

// Delete Sample Handover Slip
async function confirmDeleteSample(sampleId) {
  const sample = allSamples.find(s => s.id === sampleId);
  const sampleCode = sample ? sample.code : 'này';

  if (confirm(`Bạn có chắc chắn muốn xóa phiếu phát mẫu "${sampleCode}"? Tồn kho các sản phẩm trong phiếu sẽ được tự động hoàn lại!`)) {
    try {
      await window.dbProvider.deleteSample(sampleId);
      showToast(`Đã xóa phiếu phát mẫu "${sampleCode}" và hoàn tồn kho thành công!`, 'info');
      await initSamplesData();
    } catch (err) {
      console.error('Error deleting sample:', err);
      showToast('Không thể xóa phiếu phát mẫu', 'danger');
    }
  }
}

// Printable Handover Receipt Modal Logic
function openPrintReceiptModal(sampleId) {
  const sample = allSamples.find(s => s.id === sampleId);
  if (!sample) return;

  const receiptCodeEl = document.getElementById('receipt-code');
  if (receiptCodeEl) receiptCodeEl.textContent = sample.code || 'N/A';

  const receiptDateEl = document.getElementById('receipt-date');
  if (receiptDateEl) receiptDateEl.textContent = formatDate(sample.handover_date);

  const receiptStoreEl = document.getElementById('receipt-store-name');
  if (receiptStoreEl) receiptStoreEl.textContent = sample.customer_name || 'Đại lý / Cửa hàng';

  const receiptPhoneEl = document.getElementById('receipt-store-phone');
  if (receiptPhoneEl) receiptPhoneEl.textContent = sample.customer_phone || '---';

  const receiptAddressEl = document.getElementById('receipt-store-address');
  if (receiptAddressEl) receiptAddressEl.textContent = sample.customer_address || '---';

  const receiptSalesEl = document.getElementById('receipt-sales-person');
  if (receiptSalesEl) receiptSalesEl.textContent = sample.sales_person || 'Nguyễn Thanh Tùng';

  const receiptSignSales = document.getElementById('receipt-sign-sales');
  if (receiptSignSales) receiptSignSales.textContent = sample.sales_person || 'Đại diện Công ty';

  const receiptSignStore = document.getElementById('receipt-sign-store');
  if (receiptSignStore) receiptSignStore.textContent = sample.customer_name || 'Đại diện Cửa hàng';

  // Items table
  const items = (Array.isArray(sample.items) && sample.items.length > 0) ? sample.items : [{
    sku: sample.product_sku,
    name: sample.product_name,
    category: sample.category,
    quantity: sample.quantity,
    unit: sample.unit
  }];

  const tableBody = document.getElementById('receipt-items-body');
  if (tableBody) {
    tableBody.innerHTML = items.map((it, idx) => {
      const formattedQty = typeof formatQuantity === 'function' ? formatQuantity(it.quantity) : (it.quantity || 1);
      return `
      <tr>
        <td style="text-align:center; padding: 8px;">${idx + 1}</td>
        <td style="padding: 8px;"><strong>${escapeHtml(it.sku || '---')}</strong></td>
        <td style="padding: 8px;">${escapeHtml(it.name || 'Mẫu')}</td>
        <td style="padding: 8px;">${escapeHtml(it.category || '---')}</td>
        <td style="text-align:center; padding: 8px; font-weight: 700;">${formattedQty}</td>
        <td style="text-align:center; padding: 8px;">${escapeHtml(it.unit || 'Mẫu')}</td>
        <td style="padding: 8px;">${escapeHtml(sample.status === 'Displaying' ? 'Mẫu trưng bày' : sample.status)}</td>
      </tr>
    `;
    }).join('');
  }

  openModal('print-receipt-modal');
}

function printReceipt() {
  window.print();
}

// Convert to Sales Order (redirect to ban-hang.html with customer preset)
function convertToSaleOrder(customerId) {
  if (customerId) {
    sessionStorage.setItem('POS_PRESET_CUSTOMER', customerId);
  }
  window.location.href = 'ban-hang.html';
}

// Export Filtered Samples to CSV with UTF-8 BOM
function exportSamplesToCSV() {
  const samples = getFilteredSamples();
  if (samples.length === 0) {
    showToast('Không có dữ liệu để xuất file CSV!', 'warning');
    return;
  }

  let csvContent = '\uFEFF'; // UTF-8 BOM
  csvContent += 'Mã Phiếu,Ngày Bàn Giao,Tên Cửa Hàng,SĐT,Địa Chỉ,Tuyến,Mã Sản Phẩm,Tên Sản Phẩm Mẫu,Loại Mẫu,Số Lượng,ĐVT,Sales Phụ Trách,Trạng Thái,Phản Hồi Cửa Hàng,Ghi Chú\n';

  samples.forEach(s => {
    const formattedQty = typeof formatQuantity === 'function' ? formatQuantity(s.quantity) : (s.quantity || 1);
    const row = [
      `"${(s.code || '').replace(/"/g, '""')}"`,
      `"${s.handover_date || ''}"`,
      `"${(s.customer_name || '').replace(/"/g, '""')}"`,
      `"${(s.customer_phone || '').replace(/"/g, '""')}"`,
      `"${(s.customer_address || '').replace(/"/g, '""')}"`,
      `"${(s.route || '').replace(/"/g, '""')}"`,
      `"${(s.product_sku || '').replace(/"/g, '""')}"`,
      `"${(s.product_name || '').replace(/"/g, '""')}"`,
      `"${(s.category || '').replace(/"/g, '""')}"`,
      `"${formattedQty}"`,
      `"${(s.unit || 'Mẫu').replace(/"/g, '""')}"`,
      `"${(s.sales_person || '').replace(/"/g, '""')}"`,
      `"${(s.status || '').replace(/"/g, '""')}"`,
      `"${(s.feedback || '').replace(/"/g, '""')}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`
    ];
    csvContent += row.join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Bao_Cao_Phat_Mau_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Đã xuất báo cáo phát mẫu ra file CSV thành công!', 'success');
}

// Utility: HTML Escape
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
