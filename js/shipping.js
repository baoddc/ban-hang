/* =======================================================
   SHIPPING FEE MANAGEMENT & CALCULATOR ENGINE (SHIPPING.JS)
   ======================================================= */

let allShippingRules = [];
let allCustomers = [];
let allProducts = [];

// Calculator State
let calcSelectedCustomerId = null;
let calcDistanceKm = 5;
let calcItems = [];

// Current Rule Being Edited
let editingRuleId = null;

// Category icons mapping
const CATEGORY_ICONS = {
  'Tất cả': 'bi-boxes',
  'Gạch': 'bi-grid-3x3',
  'Khác': 'bi-box-seam'
};

// Distance brackets for 2D Matrix and Shipping Simulator
const MATRIX_DISTANCE_BRACKETS = [
  { label: '≤ 15 km', min: 0, max: 15 },
  { label: 'Từ 16 đến ≤ 30 km', min: 15, max: 30 },
  { label: 'Từ 31 đến ≤ 60 km', min: 30, max: 60 },
  { label: 'Từ 61 đến ≤ 90 km', min: 60, max: 90 },
  { label: '> 90 km', min: 90, max: 9999 }
];

document.addEventListener('DOMContentLoaded', async () => {
  await loadShippingData();
  setupEventListeners();
});

/* =======================================================
   DATA LOADING & INITIALIZATION
   ======================================================= */
async function loadShippingData() {
  if (!window.dbProvider) return;

  try {
    if (typeof window.dbProvider.purgeLegacyDummyData === 'function') {
      await window.dbProvider.purgeLegacyDummyData();
    }

    allShippingRules = await window.dbProvider.getShippingRules();
    allCustomers = await window.dbProvider.getCustomers();
    allProducts = await window.dbProvider.getProducts();

    // Clean any legacy dummy items in calcItems or initialize first item
    if (calcItems.length > 0 && allProducts.length > 0) {
      if (!allProducts.some(p => p.sku === calcItems[0].category)) {
        calcItems[0].category = allProducts[0].sku;
      }
    } else if (calcItems.length === 0) {
      const skus = getWarehouseSkus();
      if (skus.length > 0) {
        const firstSku = skus[0].sku;
        const prod = allProducts.find(p => p.sku === firstSku);
        calcItems.push({
          id: 'item_' + Date.now(),
          category: firstSku,
          quantity: 1,
          unitPrice: prod ? (prod.selling_price || 0) : 0
        });
      }
    }

    renderKpiMetrics();

    // Auto-select first customer if none selected yet
    if (!calcSelectedCustomerId && allCustomers.length > 0) {
      selectCalculatorCustomer(allCustomers[0].id, false);
    } else {
      renderCalculatorCustomerSelect();
    }

    renderCalculatorItems();
    calculateShippingSimulator();
    renderShippingRulesTable();
    renderPricingMatrix();
    renderStoresDistanceTable();
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu cước phí vận chuyển:', error);
    showToast('Lỗi khi tải dữ liệu từ Supabase: ' + (error.message || ''), 'danger');
  }
}

function setupEventListeners() {
  const distSlider = document.getElementById('calc-distance-slider');
  const distInput = document.getElementById('calc-distance-input');

  if (distSlider && distInput) {
    distSlider.addEventListener('input', (e) => {
      calcDistanceKm = parseFloat(e.target.value) || 0;
      distInput.value = calcDistanceKm;
      updateDistancePillsActiveState();
      calculateShippingSimulator();
    });

    distInput.addEventListener('input', (e) => {
      calcDistanceKm = parseFloat(e.target.value) || 0;
      distSlider.value = Math.min(100, Math.max(0, calcDistanceKm));
      updateDistancePillsActiveState();
      calculateShippingSimulator();
    });
  }

  // Close customer and SKU search dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    // Customer search
    const custSearchGroup = document.querySelector('.calc-customer-search-group');
    const custDropdown = document.getElementById('calc-customer-dropdown-list');
    if (custSearchGroup && custDropdown && !custSearchGroup.contains(e.target)) {
      custDropdown.style.display = 'none';
      if (calcSelectedCustomerId) {
        renderCalculatorCustomerSelect();
      }
    }

    // SKU search in all rows
    const openSkuDropdowns = document.querySelectorAll('.sku-dropdown-menu');
    openSkuDropdowns.forEach(dropdown => {
      const parentGroup = dropdown.closest('.calc-sku-search-group');
      if (parentGroup && !parentGroup.contains(e.target)) {
        dropdown.style.display = 'none';
        const itemId = parentGroup.getAttribute('data-item-id');
        const item = calcItems.find(i => i.id === itemId);
        if (item) {
          const skus = getWarehouseSkus();
          const currSku = skus.find(s => s.sku === item.category) || { sku: item.category, name: item.category, unit: '' };
          const input = document.getElementById(`calc-sku-search-input-${itemId}`);
          if (input) {
            input.value = `[${currSku.sku}] ${currSku.name}${currSku.unit ? ` (${currSku.unit})` : ''}`;
          }
        }
      }
    });
  });
}

/* =======================================================
   KPI METRICS
   ======================================================= */
function renderKpiMetrics() {
  const activeRulesCount = allShippingRules.filter(r => r.is_active !== false).length;
  const skus = getWarehouseSkus();

  const storesWithDistance = allCustomers.filter(c => {
    const dist = parseFloat(c.distance_km || c.distance || c.email);
    return !isNaN(dist) && dist > 0;
  }).length;
  const totalStores = allCustomers.length;
  const percentStores = totalStores > 0 ? Math.round((storesWithDistance / totalStores) * 100) : 0;

  const elRules = document.getElementById('kpi-total-rules');
  const elCats = document.getElementById('kpi-total-categories');
  const elStores = document.getElementById('kpi-stores-with-distance');

  if (elRules) elRules.textContent = activeRulesCount + ' Quy tắc';
  if (elCats) elCats.textContent = skus.length + ' SKUs';
  if (elStores) elStores.textContent = `${storesWithDistance}/${totalStores} (${percentStores}%)`;
}

/* =======================================================
   TAB SWITCHING
   ======================================================= */
function switchShippingTab(tabName) {
  const views = {
    'calc': document.getElementById('view-shipping-calc'),
    'rules': document.getElementById('view-shipping-rules'),
    'matrix': document.getElementById('view-shipping-matrix'),
    'stores': document.getElementById('view-shipping-stores')
  };

  const buttons = {
    'calc': document.getElementById('btn-tab-calc'),
    'rules': document.getElementById('btn-tab-rules'),
    'matrix': document.getElementById('btn-tab-matrix'),
    'stores': document.getElementById('btn-tab-stores')
  };

  Object.keys(views).forEach(key => {
    if (views[key]) views[key].style.display = key === tabName ? 'block' : 'none';
    if (buttons[key]) {
      if (key === tabName) buttons[key].classList.add('active');
      else buttons[key].classList.remove('active');
    }
  });

  if (tabName === 'rules') renderShippingRulesTable();
  if (tabName === 'matrix') renderPricingMatrix();
  if (tabName === 'stores') renderStoresDistanceTable();
}

/* =======================================================
   TAB 1: CALCULATOR & SIMULATOR
   ======================================================= */
function renderCalculatorCustomerSelect() {
  const select = document.getElementById('calc-customer-select');
  const input = document.getElementById('calc-customer-search-input');
  const clearBtn = document.getElementById('btn-clear-calc-customer');

  if (select) {
    let html = '<option value="">-- Khách vãng lai / Nhập khoảng cách thủ công --</option>';
    allCustomers.forEach(c => {
      const dist = c.distance_km || c.distance || '';
      const distText = dist ? ` (${dist} km)` : ' (Chưa có km)';
      html += `<option value="${c.id}" ${c.id === calcSelectedCustomerId ? 'selected' : ''}>${c.code} - ${c.name}${distText}</option>`;
    });
    select.innerHTML = html;
  }

  if (input) {
    if (calcSelectedCustomerId) {
      const cust = allCustomers.find(c => c.id === calcSelectedCustomerId);
      if (cust) {
        const rawDist = parseFloat(String(cust.distance_km || cust.distance || cust.email || '').replace(/[^\d.]/g, ''));
        const distText = !isNaN(rawDist) && rawDist > 0 ? ` (${rawDist} km)` : '';
        input.value = `${cust.code} - ${cust.name}${distText}`;
        if (clearBtn) clearBtn.style.display = 'flex';
      } else {
        input.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
      }
    } else {
      input.value = '';
      if (clearBtn) clearBtn.style.display = 'none';
    }
  }
}

function showCalculatorCustomerDropdown() {
  // Close any open SKU dropdowns
  document.querySelectorAll('.sku-dropdown-menu').forEach(el => el.style.display = 'none');
  const dropdown = document.getElementById('calc-customer-dropdown-list');
  if (!dropdown) return;
  filterCalculatorCustomerDropdown();
  dropdown.style.display = 'block';
}

function filterCalculatorCustomerDropdown() {
  const dropdown = document.getElementById('calc-customer-dropdown-list');
  const input = document.getElementById('calc-customer-search-input');
  const clearBtn = document.getElementById('btn-clear-calc-customer');
  if (!dropdown || !input) return;

  const keyword = input.value.toLowerCase().trim();
  if (clearBtn) {
    clearBtn.style.display = input.value ? 'flex' : 'none';
  }

  const matches = allCustomers.filter(c => {
    if (!keyword) return true;
    const nameStr = (c.name || '').toLowerCase();
    const codeStr = (c.code || '').toLowerCase();
    const phoneStr = (c.phone || '').toLowerCase();
    const addressStr = (c.address || '').toLowerCase();
    const routeStr = (c.route || '').toLowerCase();
    const groupStr = (c.group_name || '').toLowerCase();
    return nameStr.includes(keyword) || codeStr.includes(keyword) || phoneStr.includes(keyword) || addressStr.includes(keyword) || routeStr.includes(keyword) || groupStr.includes(keyword);
  });

  let html = `
    <div class="search-dropdown-item ${!calcSelectedCustomerId ? 'selected' : ''}" onclick="selectCalculatorCustomer('')">
      <div class="dropdown-item-main">
        <i class="bi bi-person-slash text-muted" style="font-size:1rem;"></i>
        <span style="font-weight:600; color:var(--text-muted);">Khách vãng lai / Nhập khoảng cách thủ công</span>
      </div>
    </div>
  `;

  if (matches.length === 0) {
    html += `<div style="padding: 14px; text-align:center; color: var(--text-subtle); font-size: 0.82rem;">Không tìm thấy cửa hàng / đại lý phù hợp</div>`;
  } else {
    html += matches.map(c => {
      const rawDist = parseFloat(String(c.distance_km || c.distance || c.email || '').replace(/[^\d.]/g, ''));
      const distText = !isNaN(rawDist) && rawDist > 0 ? `${rawDist} km` : null;

      return `
        <div class="search-dropdown-item ${c.id === calcSelectedCustomerId ? 'selected' : ''}" onclick="selectCalculatorCustomer('${c.id}')">
          <div class="dropdown-item-main">
            <span class="badge-code">${c.code}</span>
            <strong class="item-title">${c.name}</strong>
            ${distText ? `<span class="badge-dist"><i class="bi bi-signpost-split"></i> ${distText}</span>` : `<span class="badge-nodist">Chưa có km</span>`}
          </div>
          <div class="dropdown-item-sub">
            ${c.address ? `<span><i class="bi bi-geo-alt"></i> ${c.address}</span>` : ''}
            ${c.route ? `<span><i class="bi bi-signpost"></i> Tuyến: ${c.route}</span>` : ''}
            ${c.phone ? `<span><i class="bi bi-telephone"></i> ${c.phone}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  dropdown.innerHTML = html;
  dropdown.style.display = 'block';
}

function selectCalculatorCustomer(customerId, closeDropdown = true) {
  const select = document.getElementById('calc-customer-select');
  const input = document.getElementById('calc-customer-search-input');
  const clearBtn = document.getElementById('btn-clear-calc-customer');
  const dropdown = document.getElementById('calc-customer-dropdown-list');
  const infoBox = document.getElementById('calc-customer-info-box');

  calcSelectedCustomerId = customerId || null;

  if (!customerId) {
    if (select) select.value = '';
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    if (infoBox) infoBox.style.display = 'none';
    if (closeDropdown && dropdown) dropdown.style.display = 'none';
    calculateShippingSimulator();
    return;
  }

  const cust = allCustomers.find(c => c.id === customerId);
  if (cust) {
    if (select) select.value = cust.id;
    const rawDist = parseFloat(String(cust.distance_km || cust.distance || cust.email || '').replace(/[^\d.]/g, ''));
    const distText = !isNaN(rawDist) && rawDist > 0 ? ` (${rawDist} km)` : '';
    if (input) input.value = `${cust.code} - ${cust.name}${distText}`;
    if (clearBtn) clearBtn.style.display = 'flex';

    if (infoBox) {
      infoBox.style.display = 'block';
      document.getElementById('calc-cust-name').textContent = cust.name;
      document.getElementById('calc-cust-phone').textContent = cust.phone || 'Chưa có SĐT';
      document.getElementById('calc-cust-address').textContent = cust.address || 'Chưa có địa chỉ';
      document.getElementById('calc-cust-route').textContent = cust.route || 'Chưa gán tuyến';
    }

    if (!isNaN(rawDist) && rawDist > 0) {
      setCalculatorDistance(rawDist);
    }
  }

  if (closeDropdown && dropdown) {
    dropdown.style.display = 'none';
  }
  calculateShippingSimulator();
}

function clearCalculatorCustomerSearch() {
  const input = document.getElementById('calc-customer-search-input');
  const clearBtn = document.getElementById('btn-clear-calc-customer');
  const infoBox = document.getElementById('calc-customer-info-box');
  const select = document.getElementById('calc-customer-select');

  calcSelectedCustomerId = null;
  if (select) select.value = '';
  if (infoBox) infoBox.style.display = 'none';
  if (clearBtn) clearBtn.style.display = 'none';

  if (input) {
    input.value = '';
    input.focus();
  }
  showCalculatorCustomerDropdown();
  calculateShippingSimulator();
}

function onCalculatorCustomerChange() {
  const select = document.getElementById('calc-customer-select');
  const custId = select ? select.value : '';
  selectCalculatorCustomer(custId, true);
}

function setCalculatorDistance(km) {
  calcDistanceKm = km;
  const slider = document.getElementById('calc-distance-slider');
  const input = document.getElementById('calc-distance-input');
  if (slider) slider.value = Math.min(100, Math.max(0, km));
  if (input) input.value = km;
  updateDistancePillsActiveState();
  calculateShippingSimulator();
}

function updateDistancePillsActiveState() {
  const pills = document.querySelectorAll('.distance-pill-btn');
  pills.forEach(p => {
    const val = parseFloat(p.getAttribute('data-km'));
    if (val === calcDistanceKm) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });
}

/**
 * Lấy danh sách toàn bộ SKU sản phẩm từ kho bãi (kho-bai.html / allProducts)
 */
function getWarehouseSkus() {
  const list = [];
  const seen = new Set();

  // 1. Lấy danh sách sản phẩm từ kho hàng
  if (Array.isArray(allProducts) && allProducts.length > 0) {
    allProducts.forEach(p => {
      const sku = (p.sku || '').trim();
      if (sku && !seen.has(sku)) {
        seen.add(sku);
        list.push({
          sku: sku,
          name: p.name || sku,
          category: p.category || '',
          unit: p.unit || '',
          selling_price: p.selling_price || 0
        });
      }
    });
  }

  // 2. Lấy thêm các SKU có trong bảng quy tắc cước
  if (Array.isArray(allShippingRules)) {
    const dummyCategories = ['Máy tính', 'Thiết bị Mạng', 'Thiết bị ngoại vi', 'Phụ kiện'];
    allShippingRules.forEach(r => {
      const rSku = (r.category || r.sku || '').trim();
      if (rSku && !seen.has(rSku) && !dummyCategories.includes(rSku)) {
        seen.add(rSku);
        list.push({
          sku: rSku,
          name: r.notes || rSku,
          category: '',
          unit: '',
          selling_price: 0
        });
      }
    });
  }

  return list;
}

function renderCalculatorItems() {
  const container = document.getElementById('calc-items-container');
  if (!container) return;

  const skus = getWarehouseSkus();

  // Đảm bảo item.category là SKU hợp lệ
  if (calcItems.length > 0 && skus.length > 0) {
    calcItems.forEach(item => {
      if (!skus.some(s => s.sku === item.category)) {
        item.category = skus[0].sku;
      }
    });
  }

  container.innerHTML = calcItems.map((item, idx) => {
    const currSku = skus.find(s => s.sku === item.category) || { sku: item.category, name: item.category, unit: '' };
    const displaySkuText = `[${currSku.sku}] ${currSku.name}${currSku.unit ? ` (${currSku.unit})` : ''}`;

    return `
      <div class="category-calc-row" id="calc-item-row-${item.id}">
        <div class="category-info-col">
          <div class="category-badge-icon">
            <i class="bi bi-upc-scan"></i>
          </div>
          <div style="flex: 1; position: relative;" class="calc-sku-search-group" data-item-id="${item.id}">
            <label style="font-size: 0.76rem; font-weight: 700; color: var(--text-muted); display:block; margin-bottom: 2px;">Mã SKU Sản Phẩm (Kho Hàng)</label>
            <div class="search-select-wrapper">
              <i class="bi bi-search search-select-icon"></i>
              <input type="text" 
                     id="calc-sku-search-input-${item.id}" 
                     class="form-control search-select-input sku-search-input" 
                     value="${displaySkuText.replace(/"/g, '&quot;')}" 
                     placeholder="Tìm mã SKU, tên sản phẩm, quy cách..." 
                     onfocus="showCalcSkuDropdown('${item.id}')" 
                     oninput="filterCalcSkuDropdown('${item.id}')" 
                     autocomplete="off" />
              <button type="button" class="btn-clear-select" id="btn-clear-sku-${item.id}" onclick="clearCalcSkuSearch('${item.id}')" title="Tìm SKU khác">&times;</button>
              <div class="search-dropdown-menu sku-dropdown-menu" id="calc-sku-dropdown-${item.id}" style="display:none;">
                <!-- Dynamically populated SKU items -->
              </div>
            </div>
          </div>
        </div>

        <div style="width: 75px; flex-shrink: 0;">
          <label style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted); display:block; margin-bottom: 2px;">Số Lượng</label>
          <input type="text" inputmode="numeric" class="form-control format-number" value="${item.quantity}" style="text-align:center; font-weight:700; padding: 4px 6px;" oninput="updateCalcItemQty('${item.id}', this.value)" />
        </div>

        <div style="width: 115px; flex-shrink: 0;">
          <label style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted); display:block; margin-bottom: 2px;">Đơn Giá (₫)</label>
          <input type="text" inputmode="numeric" class="form-control format-number" value="${formatNumberWithDots(item.unitPrice)}" style="text-align:right; padding: 4px 6px;" oninput="updateCalcItemPrice('${item.id}', this.value)" />
        </div>

        <div style="flex-shrink: 0;">
          <label style="font-size: 0.74rem; opacity: 0; display:block; margin-bottom: 2px;">Xóa</label>
          <button type="button" class="btn btn-icon" style="color: var(--danger); width:30px; height:30px; font-size:0.85rem;" onclick="removeCalcItem('${item.id}')" title="Xóa dòng này">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function showCalcSkuDropdown(itemId) {
  // Close customer dropdown and other SKU dropdowns
  const custDropdown = document.getElementById('calc-customer-dropdown-list');
  if (custDropdown) custDropdown.style.display = 'none';

  document.querySelectorAll('.sku-dropdown-menu').forEach(el => {
    if (el.id !== `calc-sku-dropdown-${itemId}`) {
      el.style.display = 'none';
    }
  });

  const dropdown = document.getElementById(`calc-sku-dropdown-${itemId}`);
  if (!dropdown) return;

  filterCalcSkuDropdown(itemId);
  dropdown.style.display = 'block';
}

function filterCalcSkuDropdown(itemId) {
  const dropdown = document.getElementById(`calc-sku-dropdown-${itemId}`);
  const input = document.getElementById(`calc-sku-search-input-${itemId}`);
  if (!dropdown || !input) return;

  const item = calcItems.find(i => i.id === itemId);
  const currentCategory = item ? item.category : '';
  const keyword = input.value.toLowerCase().trim();
  const skus = getWarehouseSkus();

  const matches = skus.filter(s => {
    if (!keyword) return true;
    const skuStr = (s.sku || '').toLowerCase();
    const nameStr = (s.name || '').toLowerCase();
    const catStr = (s.category || '').toLowerCase();
    const unitStr = (s.unit || '').toLowerCase();
    const priceStr = s.selling_price ? String(s.selling_price) : '';
    return skuStr.includes(keyword) || nameStr.includes(keyword) || catStr.includes(keyword) || unitStr.includes(keyword) || priceStr.includes(keyword);
  });

  if (matches.length === 0) {
    dropdown.innerHTML = `<div style="padding: 14px; text-align:center; color: var(--text-subtle); font-size: 0.82rem;">Không tìm thấy SKU sản phẩm phù hợp</div>`;
  } else {
    dropdown.innerHTML = matches.map(s => {
      const isSelected = s.sku === currentCategory;
      return `
        <div class="search-dropdown-item sku-dropdown-item ${isSelected ? 'selected' : ''}" onclick="selectCalcSku('${itemId}', '${s.sku.replace(/'/g, "\\'")}')">
          <div class="dropdown-item-main" style="justify-content: space-between;">
            <div style="display:flex; align-items:center; gap:8px; min-width:0;">
              <span class="badge-code"><i class="bi bi-upc-scan"></i> ${s.sku}</span>
              <strong class="item-title" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.name}</strong>
            </div>
            <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
              ${s.unit ? `<span class="badge-unit">${s.unit}</span>` : ''}
              ${s.selling_price ? `<span class="badge-price">${formatVND(s.selling_price)}</span>` : ''}
            </div>
          </div>
          ${s.category ? `<div class="dropdown-item-sub"><span><i class="bi bi-folder"></i> Danh mục: ${s.category}</span></div>` : ''}
        </div>
      `;
    }).join('');
  }

  dropdown.style.display = 'block';
}

function selectCalcSku(itemId, sku) {
  const item = calcItems.find(i => i.id === itemId);
  if (!item) return;

  item.category = sku;
  const prod = allProducts.find(p => p.sku === sku);
  if (prod && prod.selling_price) {
    item.unitPrice = prod.selling_price;
  }

  renderCalculatorItems();
  calculateShippingSimulator();
}

function clearCalcSkuSearch(itemId) {
  const input = document.getElementById(`calc-sku-search-input-${itemId}`);
  if (input) {
    input.value = '';
    input.focus();
  }
  showCalcSkuDropdown(itemId);
}

function addCalcItemRow() {
  const skus = getWarehouseSkus();
  const defaultSku = skus.length > 0 ? skus[0].sku : '60x60P';
  const prod = allProducts.find(p => p.sku === defaultSku);
  const newItem = {
    id: 'item_' + Date.now(),
    category: defaultSku,
    quantity: 1,
    unitPrice: prod ? (prod.selling_price || 0) : 0
  };
  calcItems.push(newItem);
  renderCalculatorItems();
  calculateShippingSimulator();
}

function removeCalcItem(id) {
  if (calcItems.length <= 1) {
    showToast('Cần giữ ít nhất 1 sản phẩm để tính cước!', 'warning');
    return;
  }
  calcItems = calcItems.filter(i => i.id !== id);
  renderCalculatorItems();
  calculateShippingSimulator();
}

function updateCalcItemCategory(id, sku) {
  selectCalcSku(id, sku);
}

function updateCalcItemQty(id, val) {
  const item = calcItems.find(i => i.id === id);
  if (item) {
    item.quantity = Math.max(1, parseInt(parseFormattedNumber(val), 10) || 1);
    calculateShippingSimulator();
  }
}

function updateCalcItemPrice(id, val) {
  const item = calcItems.find(i => i.id === id);
  if (item) {
    item.unitPrice = parseFormattedNumber(val) || 0;
    calculateShippingSimulator();
  }
}

function calculateShippingSimulator() {
  let grandTotalShippingFee = 0;
  let totalOrderGoodsValue = 0;
  let breakdownRows = [];
  let isAnyFreeShipping = false;

  calcItems.forEach(item => {
    totalOrderGoodsValue += (item.quantity * item.unitPrice);
  });

  calcItems.forEach(item => {
    const itemTotalValue = item.quantity * item.unitPrice;

    const feeResult = calculateShippingFeeAdvanced(
      item.category,
      calcDistanceKm,
      item.quantity,
      totalOrderGoodsValue,
      allShippingRules
    );

    grandTotalShippingFee += feeResult.totalFee;
    if (feeResult.isFreeShipping) isAnyFreeShipping = true;

    breakdownRows.push({
      item,
      feeResult
    });
  });

  // Render Result Panel
  const elTotal = document.getElementById('calc-result-total');
  const elDistDisp = document.getElementById('calc-result-dist-display');
  const elBreakdownList = document.getElementById('calc-breakdown-list');
  const elFreeBanner = document.getElementById('calc-free-shipping-banner');

  if (elTotal) elTotal.textContent = formatVND(grandTotalShippingFee);
  if (elDistDisp) elDistDisp.textContent = `${calcDistanceKm} km`;

  if (elFreeBanner) {
    elFreeBanner.style.display = isAnyFreeShipping ? 'flex' : 'none';
  }

  if (elBreakdownList) {
    elBreakdownList.innerHTML = breakdownRows.map(({ item, feeResult }) => {
      const prod = allProducts.find(p => p.sku === item.category);
      const prodName = prod ? ` - ${prod.name}` : '';
      const unitText = (prod && prod.unit) ? prod.unit : 'thùng';
      return `
        <div style="background: rgba(255,255,255,0.05); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.08);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
            <div style="font-weight: 700; color:#38bdf8; font-size: 0.88rem;">
              <i class="bi bi-upc-scan"></i> SKU: <code>${item.category}</code>${prodName} (SL: ${item.quantity} ${unitText})
            </div>
            <div style="font-weight: 800; font-size: 1.05rem; color:#ffffff;">
              ${formatVND(feeResult.totalFee)}
            </div>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; font-size: 0.74rem; color: #94a3b8;">
            <span class="breakdown-tag"><i class="bi bi-tag"></i> Khung: ${feeResult.ruleName}</span>
            <span class="breakdown-tag"><i class="bi bi-cash-stack"></i> Đơn giá cước: ${formatVND(feeResult.baseFee)}/${unitText} × ${item.quantity} = <strong>${formatVND(feeResult.totalFee)}</strong></span>
          </div>
        </div>
      `;
    }).join('');
  }
}

function applyToPosTerminal() {
  // Store calculator state in session / navigate to ban-hang.html
  sessionStorage.setItem('POS_PRESET_CUSTOMER', calcSelectedCustomerId || '');
  window.location.href = 'ban-hang.html';
}

function copyQuotationText() {
  const custSelect = document.getElementById('calc-customer-select');
  const custName = custSelect && custSelect.selectedIndex > 0 ? custSelect.options[custSelect.selectedIndex].text : 'Khách hàng';
  const totalShipping = document.getElementById('calc-result-total')?.textContent || '0 ₫';

  let text = `📦 BÁO GIÁ CƯỚC VẬN CHUYỂN - BAO ERP\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👤 Khách hàng / Cửa hàng: ${custName}\n`;
  text += `📍 Khoảng cách giao hàng: ${calcDistanceKm} km\n`;
  text += `📋 Danh sách SKU hàng hóa:\n`;
  calcItems.forEach((item, idx) => {
    const prod = allProducts.find(p => p.sku === item.category);
    text += `  ${idx + 1}. [${item.category}] ${prod ? prod.name : ''} - SL: ${item.quantity}\n`;
  });
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🚚 TỔNG PHÍ VẬN CHUYỂN: ${totalShipping}\n`;
  text += `(Cước phí được tính tự động từ bảng định mức cước Supabase)`;

  navigator.clipboard.writeText(text).then(() => {
    showToast('Đã sao chép nội dung báo giá vào bộ nhớ tạm!', 'success');
  }).catch(() => {
    showToast('Không thể sao chép tự động.', 'warning');
  });
}

/* =======================================================
   TAB 2: RULES MANAGEMENT (CRUD)
   ======================================================= */
function populateRulesSkuFilter() {
  const select = document.getElementById('rules-filter-category');
  if (!select) return;
  const currentVal = select.value || 'All';
  const skus = getWarehouseSkus();
  select.innerHTML = '<option value="All">Tất cả SKU</option>' + skus.map(s => `
    <option value="${s.sku}" ${s.sku === currentVal ? 'selected' : ''}>[${s.sku}] ${s.name}</option>
  `).join('');
}

function renderShippingRulesTable() {
  const tbody = document.getElementById('shipping-rules-tbody');
  const filterCat = document.getElementById('rules-filter-category')?.value || 'All';
  const searchKey = (document.getElementById('rules-search-input')?.value || '').toLowerCase().trim();

  if (!tbody) return;

  populateRulesSkuFilter();

  let filtered = allShippingRules;
  if (filterCat !== 'All') {
    filtered = filtered.filter(r => r.category === filterCat || r.sku === filterCat);
  }
  if (searchKey) {
    filtered = filtered.filter(r =>
      (r.category || '').toLowerCase().includes(searchKey) ||
      (r.notes || '').toLowerCase().includes(searchKey)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">
          <i class="bi bi-inbox" style="font-size:2rem; display:block; margin-bottom:8px;"></i>
          Không tìm thấy quy tắc cước phí nào phù hợp
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(rule => {
    const sku = rule.category;
    const prod = allProducts.find(p => p.sku === sku);
    const prodName = prod ? prod.name : '';
    const maxDistText = (rule.max_distance >= 9999 || rule.max_distance === null) ? '∞' : `${rule.max_distance} km`;
    const distBadge = `${rule.min_distance} - ${maxDistText}`;

    return `
      <tr id="rule-row-${rule.id}">
        <td>
          <span class="badge-category">
            <i class="bi bi-upc-scan text-primary"></i> <code>${sku}</code>
          </span>
          ${prodName ? `<div style="font-size:0.76rem; color:var(--text-muted); margin-top:2px;">${prodName}</div>` : ''}
        </td>
        <td>
          <span class="badge-distance"><i class="bi bi-signpost-split"></i> ${distBadge}</span>
        </td>
        <td style="text-align:right;">
          <div style="display:flex; align-items:center; justify-content:flex-end; gap:6px;">
            <input type="text" 
                   inputmode="numeric" 
                   class="form-control format-number inline-rule-price-input" 
                   style="width: 125px; text-align: right; font-weight: 700; color: var(--primary);" 
                   data-rule-id="${rule.id}"
                   value="${formatNumberWithDots(rule.base_fee)}" 
                   oninput="onInlineRulePriceInput('${rule.id}', this)"
                   onchange="onInlineRulePriceChange('${rule.id}', this)" />
            <span style="font-size:0.8rem; font-weight:600; color:var(--text-muted);">₫</span>
          </div>
        </td>
        <td style="font-size:0.82rem; color:var(--text-muted);">
          ${rule.notes || '-'}
        </td>
        <td style="text-align:center;">
          <label class="switch-toggle">
            <input type="checkbox" ${rule.is_active !== false ? 'checked' : ''} onchange="toggleRuleActiveState('${rule.id}', this.checked)">
            <span class="switch-slider"></span>
          </label>
        </td>
        <td style="text-align:center;">
          <div style="display:inline-flex; gap:6px;">
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="openEditRuleModal('${rule.id}')" title="Chỉnh sửa chi tiết">
              <i class="bi bi-pencil-square text-primary"></i>
            </button>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem; color:var(--danger);" onclick="deleteShippingRuleAction('${rule.id}')" title="Xóa quy tắc">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (typeof initModalNumberInputs === 'function') {
    initModalNumberInputs(tbody);
  }
}

function onInlineRulePriceInput(ruleId, inputEl) {
  const newFee = parseFormattedNumber(inputEl.value) || 0;
  const rule = allShippingRules.find(r => r.id === ruleId);
  if (rule) {
    rule.base_fee = newFee;

    // Synchronize corresponding cell in Matrix table if present
    const matrixInput = document.querySelector(`.matrix-cell-input[data-rule-id="${ruleId}"]`) ||
      document.querySelector(`.matrix-cell-input[data-category="${rule.category}"][data-min="${rule.min_distance}"][data-max="${rule.max_distance}"]`);
    if (matrixInput && document.activeElement !== matrixInput) {
      matrixInput.value = formatNumberWithDots(newFee);
    }
  }
  calculateShippingSimulator();
}

function onInlineRulePriceChange(ruleId, inputEl) {
  const newFee = parseFormattedNumber(inputEl.value) || 0;
  const rule = allShippingRules.find(r => r.id === ruleId);
  if (rule) {
    rule.base_fee = newFee;
  }
  calculateShippingSimulator();
}

function openCreateRuleModal() {
  editingRuleId = null;
  document.getElementById('rule-modal-title').innerHTML = '<i class="bi bi-plus-circle text-primary"></i> Thêm Quy Tắc Phí Vận Chuyển Theo SKU';

  populateRuleModalCategoryOptions();

  document.getElementById('rule-min-dist').value = '0';
  document.getElementById('rule-max-dist').value = '15';
  document.getElementById('rule-base-fee').value = '50.000';
  document.getElementById('rule-notes').value = 'Khoảng cách ≤ 15 km';
  document.getElementById('rule-active-toggle').checked = true;

  openModal('rule-modal');
}

function openEditRuleModal(ruleId) {
  const rule = allShippingRules.find(r => r.id === ruleId);
  if (!rule) return;

  editingRuleId = ruleId;
  document.getElementById('rule-modal-title').innerHTML = '<i class="bi bi-pencil-square text-primary"></i> Chỉnh Sửa Quy Tắc Phí Vận Chuyển';

  populateRuleModalCategoryOptions();
  document.getElementById('rule-category-select').value = rule.category;
  document.getElementById('rule-min-dist').value = rule.min_distance || 0;
  document.getElementById('rule-max-dist').value = (rule.max_distance >= 9999 || rule.max_distance === null) ? '9999' : rule.max_distance;
  document.getElementById('rule-base-fee').value = formatNumberWithDots(rule.base_fee || 0);
  document.getElementById('rule-notes').value = rule.notes || '';
  document.getElementById('rule-active-toggle').checked = rule.is_active !== false;

  openModal('rule-modal');
}

function populateRuleModalCategoryOptions() {
  const select = document.getElementById('rule-category-select');
  if (!select) return;
  const skus = getWarehouseSkus();
  select.innerHTML = skus.map(s => `<option value="${s.sku}">[${s.sku}] ${s.name}${s.unit ? ` (${s.unit})` : ''}</option>`).join('');
}

async function saveRuleFormSubmit() {
  const category = document.getElementById('rule-category-select').value;
  const minDist = parseFloat(document.getElementById('rule-min-dist').value) || 0;
  const maxDist = parseFloat(document.getElementById('rule-max-dist').value) || 9999;
  const baseFee = parseFormattedNumber(document.getElementById('rule-base-fee').value) || 0;
  const notes = document.getElementById('rule-notes').value.trim();
  const isActive = document.getElementById('rule-active-toggle').checked;

  if (minDist >= maxDist) {
    showToast('Khoảng cách từ (km) phải nhỏ hơn khoảng cách đến (km)!', 'warning');
    return;
  }

  const payload = {
    category,
    min_distance: minDist,
    max_distance: maxDist,
    base_fee: baseFee,
    fee_per_km: 0,
    fee_per_unit: 0,
    free_shipping_threshold: 0,
    notes,
    is_active: isActive
  };

  try {
    if (editingRuleId) {
      await window.dbProvider.updateShippingRule(editingRuleId, payload);
      showToast('Đã cập nhật quy tắc cước phí thành công!', 'success');
    } else {
      await window.dbProvider.addShippingRule(payload);
      showToast('Đã thêm quy tắc cước phí mới lên Supabase!', 'success');
    }

    closeModal('rule-modal');
    await loadShippingData();
  } catch (err) {
    console.error('Lỗi khi lưu quy tắc:', err);
    showToast('Lỗi khi lưu quy tắc: ' + err.message, 'danger');
  }
}

async function toggleRuleActiveState(ruleId, newState) {
  try {
    await window.dbProvider.updateShippingRule(ruleId, { is_active: newState });
    showToast(`Đã ${newState ? 'bật' : 'tắt'} kích hoạt quy tắc!`, 'info');
    const rule = allShippingRules.find(r => r.id === ruleId);
    if (rule) rule.is_active = newState;
    calculateShippingSimulator();
  } catch (e) {
    console.error('Error toggling rule:', e);
    showToast('Lỗi khi cập nhật trạng thái', 'danger');
  }
}

async function deleteShippingRuleAction(ruleId) {
  if (!confirm('Bạn có chắc chắn muốn xóa quy tắc cước phí này khỏi cơ sở dữ liệu Supabase?')) {
    return;
  }

  try {
    await window.dbProvider.deleteShippingRule(ruleId);
    showToast('Đã xóa quy tắc vận chuyển thành công!', 'success');
    await loadShippingData();
  } catch (e) {
    console.error('Error deleting rule:', e);
    showToast('Lỗi khi xóa quy tắc', 'danger');
  }
}

async function clearAllShippingRulesAction() {
  if (!confirm('Bạn có chắc chắn muốn xóa TẤT CẢ các quy tắc cước phí vận chuyển trong hệ thống?')) {
    return;
  }

  try {
    if (typeof window.dbProvider.clearAllShippingRules === 'function') {
      await window.dbProvider.clearAllShippingRules();
    }
    showToast('Đã xóa tất cả quy tắc cước phí thành công!', 'success');
    await loadShippingData();
  } catch (e) {
    console.error('Error clearing rules:', e);
    showToast('Lỗi khi xóa quy tắc: ' + e.message, 'danger');
  }
}

async function resetShippingRulesPresets() {
  const skus = (allProducts || []).map(p => ({ sku: (p.sku || '').trim(), name: p.name || p.sku })).filter(s => s.sku);
  if (skus.length === 0) {
    showToast('Kho hàng hiện chưa có sản phẩm nào. Vui lòng thêm sản phẩm vào kho trước khi tạo mẫu cước!', 'warning');
    return;
  }

  if (!confirm(`Bạn có chắc chắn muốn tạo bảng cước phí chuẩn mẫu cho ${skus.length} SKU sản phẩm trong kho hàng?`)) {
    return;
  }

  try {
    const newRules = [];
    skus.forEach((s, idx) => {
      const sku = s.sku;
      MATRIX_DISTANCE_BRACKETS.forEach((b, bIdx) => {
        let baseFee = 30000;
        if (b.min === 0) baseFee = 30000;
        else if (b.min === 15) baseFee = 65000;
        else if (b.min === 30) baseFee = 110000;
        else if (b.min === 60) baseFee = 160000;
        else baseFee = 220000;

        newRules.push({
          id: 'sr_' + (idx * 5 + bIdx + 1) + '_' + Date.now(),
          category: sku,
          min_distance: b.min,
          max_distance: b.max,
          base_fee: baseFee,
          fee_per_km: 0,
          fee_per_unit: 0,
          free_shipping_threshold: 0,
          is_active: true,
          notes: b.min === 0 ? `Khoảng cách ≤ 15 km` : (b.max >= 9999 ? `Khoảng cách > 90 km` : `Từ ${b.min + 1} đến ≤ ${b.max} km`)
        });
      });
    });

    await window.dbProvider.saveShippingRulesBulk(newRules);
    showToast('Đã tạo bảng cước phí chuẩn mẫu cho các SKU thành công!', 'success');
    await loadShippingData();
  } catch (e) {
    console.error('Error resetting rules:', e);
    showToast('Lỗi khi tạo quy tắc: ' + e.message, 'danger');
  }
}

/* =======================================================
   TAB 3: 2D PRICING MATRIX (INTERACTIVE GRID)
   ======================================================= */
function renderPricingMatrix() {
  const container = document.getElementById('pricing-matrix-container');
  if (!container) return;

  const skus = getWarehouseSkus();

  let html = `
    <table class="matrix-table">
      <thead>
        <tr>
          <th style="width: 260px;">Mã SKU Sản Phẩm (Kho Hàng)</th>
          ${MATRIX_DISTANCE_BRACKETS.map(b => `<th style="text-align: center;">${b.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
  `;

  skus.forEach(item => {
    const sku = item.sku;
    const prodName = (item.name && item.name !== sku) ? item.name : '';
    const unitBadge = item.unit ? `<span class="badge badge-neutral" style="font-size:0.7rem; padding:1px 5px; margin-left:4px;">${item.unit}</span>` : '';

    html += `
      <tr>
        <td>
          <div class="matrix-category-header">
            <div style="font-weight: 700; font-size: 0.92rem; color: var(--primary); display:flex; align-items:center; gap:4px;">
              <i class="bi bi-upc-scan text-primary"></i> <code>${sku}</code> ${unitBadge}
            </div>
            ${prodName ? `<div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 3px; line-height: 1.25;">${prodName}</div>` : ''}
          </div>
        </td>
    `;

    MATRIX_DISTANCE_BRACKETS.forEach((bracket) => {
      // Find matching rule by SKU
      const matchedRule = allShippingRules.find(r =>
        (r.category === sku || r.sku === sku) &&
        ((Number(r.min_distance) === bracket.min && Number(r.max_distance) === bracket.max) ||
          (bracket.min === 0 && Number(r.max_distance) <= 15) ||
          (bracket.min === 15 && Number(r.max_distance) > 15 && Number(r.max_distance) <= 30) ||
          (bracket.min === 30 && Number(r.max_distance) > 30 && Number(r.max_distance) <= 60) ||
          (bracket.min === 60 && Number(r.max_distance) > 60 && Number(r.max_distance) <= 90) ||
          (bracket.min === 90 && (Number(r.min_distance) >= 90 || Number(r.max_distance) > 90)))
      );

      const feeVal = matchedRule ? matchedRule.base_fee : (bracket.min === 0 ? 30000 : (bracket.min === 15 ? 65000 : (bracket.min === 30 ? 110000 : (bracket.min === 60 ? 160000 : 220000))));
      const ruleId = matchedRule ? matchedRule.id : `new_${sku}_${bracket.min}_${bracket.max}`;

      html += `
        <td>
          <div class="matrix-cell-box">
            <input type="text" 
                   inputmode="numeric" 
                   class="matrix-price-input format-number matrix-cell-input" 
                   data-category="${sku}"
                   data-min="${bracket.min}"
                   data-max="${bracket.max}"
                   data-rule-id="${ruleId}"
                   value="${formatNumberWithDots(feeVal)}"
                   oninput="onMatrixCellInput(this)"
                   onchange="onMatrixCellChange(this)" />
            <div class="matrix-subtext">VNĐ / ĐVT</div>
          </div>
        </td>
      `;
    });

    html += `</tr>`;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;

  if (typeof initModalNumberInputs === 'function') {
    initModalNumberInputs(container);
  }
}

function onMatrixCellInput(inputEl) {
  const sku = inputEl.getAttribute('data-category');
  const minDist = parseFloat(inputEl.getAttribute('data-min')) || 0;
  const maxDist = parseFloat(inputEl.getAttribute('data-max')) || 9999;
  const baseFee = parseFormattedNumber(inputEl.value) || 0;
  const ruleId = inputEl.getAttribute('data-rule-id');

  let matchedRule = allShippingRules.find(r =>
    r.id === ruleId || ((r.category === sku || r.sku === sku) && Number(r.min_distance) === minDist && Number(r.max_distance) === maxDist)
  );

  if (matchedRule) {
    matchedRule.base_fee = baseFee;
  } else {
    const newId = (ruleId && !ruleId.startsWith('new_')) ? ruleId : ('sr_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
    matchedRule = {
      id: newId,
      category: sku,
      min_distance: minDist,
      max_distance: maxDist,
      base_fee: baseFee,
      fee_per_km: 0,
      fee_per_unit: 0,
      free_shipping_threshold: 0,
      is_active: true,
      notes: minDist === 0 ? 'Khoảng cách ≤ 15 km' : (maxDist >= 9999 ? 'Khoảng cách > 90 km' : `Từ ${minDist + 1} đến ≤ ${maxDist} km`),
      created_at: new Date().toISOString()
    };
    allShippingRules.push(matchedRule);
    inputEl.setAttribute('data-rule-id', matchedRule.id);
  }

  // Synchronize corresponding row input in Bảng Quy Tắc Cước Phí if currently in DOM
  const tableInput = document.querySelector(`.inline-rule-price-input[data-rule-id="${matchedRule.id}"]`);
  if (tableInput && document.activeElement !== tableInput) {
    tableInput.value = formatNumberWithDots(baseFee);
  }

  calculateShippingSimulator();
}

function onMatrixCellChange(inputEl) {
  calculateShippingSimulator();
}

async function saveAllShippingRules() {
  // 1. Gather all inputs from matrix cells if any are currently mounted
  const matrixInputs = document.querySelectorAll('.matrix-cell-input');
  if (matrixInputs.length > 0) {
    matrixInputs.forEach(inp => {
      const sku = inp.getAttribute('data-category');
      const minDist = parseFloat(inp.getAttribute('data-min')) || 0;
      const maxDist = parseFloat(inp.getAttribute('data-max')) || 9999;
      const baseFee = parseFormattedNumber(inp.value) || 0;
      const ruleId = inp.getAttribute('data-rule-id');

      const existingIdx = allShippingRules.findIndex(r =>
        r.id === ruleId || ((r.category === sku || r.sku === sku) && Number(r.min_distance) === minDist && Number(r.max_distance) === maxDist)
      );

      if (existingIdx !== -1) {
        allShippingRules[existingIdx].category = sku;
        allShippingRules[existingIdx].base_fee = baseFee;
        allShippingRules[existingIdx].updated_at = new Date().toISOString();
      } else {
        allShippingRules.push({
          id: 'sr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          category: sku,
          min_distance: minDist,
          max_distance: maxDist,
          base_fee: baseFee,
          fee_per_km: 0,
          fee_per_unit: 0,
          free_shipping_threshold: 0,
          is_active: true,
          notes: minDist === 0 ? 'Khoảng cách ≤ 15 km' : (maxDist >= 9999 ? 'Khoảng cách > 90 km' : `Từ ${minDist + 1} đến ≤ ${maxDist} km`)
        });
      }
    });
  }

  // 2. Gather all inputs from Rules table if any are currently mounted
  const ruleInputs = document.querySelectorAll('.inline-rule-price-input');
  if (ruleInputs.length > 0) {
    ruleInputs.forEach(inp => {
      const rId = inp.getAttribute('data-rule-id');
      const fee = parseFormattedNumber(inp.value) || 0;
      const r = allShippingRules.find(item => item.id === rId);
      if (r) {
        r.base_fee = fee;
        r.updated_at = new Date().toISOString();
      }
    });
  }

  try {
    await window.dbProvider.saveShippingRulesBulk(allShippingRules);
    showToast('Đã lưu và đồng bộ toàn bộ bảng cước phí 2 chiều lên Supabase thành công!', 'success');
    await loadShippingData();
  } catch (e) {
    console.error('Lỗi khi lưu cước phí 2 chiều:', e);
    showToast('Lỗi khi lưu cước phí: ' + e.message, 'danger');
  }
}

// Alias for compatibility
const savePricingMatrixChanges = saveAllShippingRules;

/* =======================================================
   TAB 4: STORES & DELIVERY DISTANCE
   ======================================================= */
function renderStoresDistanceTable() {
  const tbody = document.getElementById('stores-distance-tbody');
  const searchKey = (document.getElementById('stores-search-input')?.value || '').toLowerCase().trim();
  const filterRoute = document.getElementById('stores-filter-route')?.value || 'All';

  if (!tbody) return;

  // Populate routes filter
  populateStoreRoutesFilter();

  let filtered = allCustomers;
  if (filterRoute !== 'All') {
    filtered = filtered.filter(c => (c.route || '') === filterRoute);
  }
  if (searchKey) {
    filtered = filtered.filter(c =>
      (c.name || '').toLowerCase().includes(searchKey) ||
      (c.code || '').toLowerCase().includes(searchKey) ||
      (c.phone || '').toLowerCase().includes(searchKey) ||
      (c.address || '').toLowerCase().includes(searchKey)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
          <i class="bi bi-shop" style="font-size:2rem; display:block; margin-bottom:8px;"></i>
          Không tìm thấy cửa hàng / khách hàng phù hợp
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const rawDist = parseFloat(String(c.distance_km || c.distance || c.email || '').replace(/[^\d.]/g, ''));
    const distVal = !isNaN(rawDist) ? rawDist : '';

    return `
      <tr>
        <td><code>${c.code}</code></td>
        <td><strong>${c.name}</strong></td>
        <td><i class="bi bi-telephone text-primary"></i> ${c.phone || 'Chưa có'}</td>
        <td style="max-width: 200px; font-size: 0.82rem; color: var(--text-muted);">${c.address || 'Chưa nhập địa chỉ'}</td>
        <td><span class="badge badge-neutral"><i class="bi bi-geo-alt"></i> ${c.route || 'Chưa gán tuyến'}</span></td>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <input type="number" 
                   step="0.5" 
                   min="0" 
                   class="quick-distance-input" 
                   id="store-dist-input-${c.id}" 
                   value="${distVal}" 
                   placeholder="0" />
            <span style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">km</span>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="saveStoreDistanceQuick('${c.id}')" title="Lưu khoảng cách">
              <i class="bi bi-check2 text-success"></i>
            </button>
          </div>
        </td>
        <td style="text-align:center;">
          <button class="btn btn-primary" style="padding:4px 10px; font-size:0.78rem;" onclick="quickCalculateForStore('${c.id}')">
            <i class="bi bi-calculator"></i> Tính Cước
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function populateStoreRoutesFilter() {
  const select = document.getElementById('stores-filter-route');
  if (!select || select.options.length > 1) return;

  const routes = [...new Set(allCustomers.map(c => c.route).filter(Boolean))];
  routes.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = `Tuyến: ${r}`;
    select.appendChild(opt);
  });
}

async function saveStoreDistanceQuick(customerId) {
  const input = document.getElementById(`store-dist-input-${customerId}`);
  if (!input) return;

  const km = parseFloat(input.value) || 0;

  try {
    await window.dbProvider.updateCustomerDistance(customerId, km);
    showToast(`Đã lưu khoảng cách ${km} km cho cửa hàng!`, 'success');

    // Update local cache
    const cust = allCustomers.find(c => c.id === customerId);
    if (cust) cust.distance_km = km;

    renderKpiMetrics();
  } catch (e) {
    console.error('Error saving distance:', e);
    showToast('Lỗi khi lưu khoảng cách: ' + e.message, 'danger');
  }
}

function quickCalculateForStore(customerId) {
  calcSelectedCustomerId = customerId;
  const cust = allCustomers.find(c => c.id === customerId);
  if (cust) {
    const rawDist = parseFloat(String(cust.distance_km || cust.distance || '').replace(/[^\d.]/g, ''));
    if (!isNaN(rawDist) && rawDist > 0) {
      calcDistanceKm = rawDist;
    }
  }

  switchShippingTab('calc');
  renderCalculatorCustomerSelect();
  onCalculatorCustomerChange();
}
