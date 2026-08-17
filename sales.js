/* =======================================================
   SALES & POS SYSTEM LOGIC (SALES.JS)
   ======================================================= */

let allProducts = [];
let allCustomers = [];
let allShippingRules = [];
let currentCart = [];
let activeCategory = 'All';

document.addEventListener('DOMContentLoaded', async () => {
  await initPosData();
});

async function initPosData() {
  if (!window.dbProvider) return;

  allProducts = await window.dbProvider.getProducts();
  allCustomers = await window.dbProvider.getCustomers();
  if (typeof window.dbProvider.getShippingRules === 'function') {
    allShippingRules = await window.dbProvider.getShippingRules();
  }

  const presetCustomerId = sessionStorage.getItem('POS_PRESET_CUSTOMER');
  if (presetCustomerId) {
    selectedCustomerId = presetCustomerId;
    sessionStorage.removeItem('POS_PRESET_CUSTOMER');
  }

  renderCustomerSelect();
  renderCategoryPills();
  renderProductsGrid(allProducts);
}

let selectedCustomerId = null;

function renderCustomerSelect() {
  const select = document.getElementById('pos-customer-select');
  if (!select) return;

  select.innerHTML = '<option value="">-- Chọn khách hàng --</option>' + allCustomers.map(c => `
    <option value="${c.id}" data-name="${c.name}">${c.code} - ${c.name} (${c.group_name || 'Khách hàng'})</option>
  `).join('');

  const searchInput = document.getElementById('pos-customer-search-input');
  const clearBtn = document.getElementById('btn-clear-customer');

  if (selectedCustomerId && allCustomers.some(c => c.id === selectedCustomerId)) {
    selectCustomer(selectedCustomerId, false);
  } else {
    selectedCustomerId = null;
    if (select) select.value = '';
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
  }
}

function showCustomerDropdown() {
  const dropdown = document.getElementById('pos-customer-dropdown-list');
  if (!dropdown) return;
  filterCustomerDropdown();
  dropdown.style.display = 'block';
}

function filterCustomerDropdown() {
  const dropdown = document.getElementById('pos-customer-dropdown-list');
  const input = document.getElementById('pos-customer-search-input');
  const clearBtn = document.getElementById('btn-clear-customer');
  if (!dropdown || !input) return;

  const keyword = input.value.toLowerCase().trim();
  if (clearBtn) {
    clearBtn.style.display = input.value ? 'flex' : 'none';
  }

  const matches = allCustomers.filter(c => {
    const nameStr = (c.name || '').toLowerCase();
    const codeStr = (c.code || '').toLowerCase();
    const phoneStr = (c.phone || '').toLowerCase();
    const groupStr = (c.group_name || '').toLowerCase();
    return nameStr.includes(keyword) || codeStr.includes(keyword) || phoneStr.includes(keyword) || groupStr.includes(keyword);
  });

  if (matches.length === 0) {
    dropdown.innerHTML = `<div style="padding: 12px; text-align:center; color: var(--text-subtle); font-size: 0.82rem;">Không tìm thấy khách hàng phù hợp</div>`;
  } else {
    dropdown.innerHTML = matches.map(c => `
      <div class="customer-dropdown-item ${c.id === selectedCustomerId ? 'selected' : ''}" onclick="selectCustomer('${c.id}')">
        <div class="cust-main-info">${c.code} - ${c.name}</div>
        <div class="cust-sub-info"><i class="bi bi-tag"></i> ${c.group_name || 'Khách hàng'} ${c.phone ? ' | SĐT: ' + c.phone : ''}</div>
      </div>
    `).join('');
  }

  dropdown.style.display = 'block';
}

function selectCustomer(customerId, closeDropdown = true) {
  if (!customerId) {
    clearCustomerSearch(false);
    return;
  }
  const customer = allCustomers.find(c => c.id === customerId);
  const select = document.getElementById('pos-customer-select');
  const input = document.getElementById('pos-customer-search-input');
  const clearBtn = document.getElementById('btn-clear-customer');
  const dropdown = document.getElementById('pos-customer-dropdown-list');

  if (!customer) return;

  selectedCustomerId = customer.id;
  if (select) {
    select.value = customer.id;
  }
  if (input) {
    input.value = `${customer.code} - ${customer.name} (${customer.group_name || 'Khách hàng'})`;
  }
  if (clearBtn) {
    clearBtn.style.display = 'flex';
  }
  if (closeDropdown && dropdown) {
    dropdown.style.display = 'none';
  }
  isShippingFeeManuallyEdited = false;
  calculateCartTotals();
  renderCartItems();
}

function clearCustomerSearch(openDropdown = true) {
  const input = document.getElementById('pos-customer-search-input');
  const clearBtn = document.getElementById('btn-clear-customer');
  const select = document.getElementById('pos-customer-select');

  if (input) {
    input.value = '';
    if (openDropdown) input.focus();
  }
  if (clearBtn) {
    clearBtn.style.display = 'none';
  }
  selectedCustomerId = null;
  if (select) {
    select.value = '';
  }
  if (openDropdown) {
    showCustomerDropdown();
  }
  isShippingFeeManuallyEdited = false;
  calculateCartTotals();
  renderCartItems();
}

// Close customer dropdown when clicking outside
document.addEventListener('click', (e) => {
  const searchGroup = document.querySelector('.customer-search-group');
  const dropdown = document.getElementById('pos-customer-dropdown-list');
  if (searchGroup && dropdown && !searchGroup.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});

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

  grid.innerHTML = products.map(p => {
    const locName = p.location || 'Chưa phân kho';
    const isOutOfStock = (Number(p.stock_quantity) || 0) <= 0;
    return `
      <div class="product-pos-card ${isOutOfStock ? 'out-of-stock' : ''}" onclick="addToCart('${p.id}')" title="Nhấp để thêm vào giỏ (Kho: ${locName})">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span class="product-sku">${p.sku}</span>
            <span class="badge" style="font-size:0.72rem; font-weight:700; color:#4f46e5; background:#eef2ff; border:1px solid #c7d2fe; padding:2px 6px; border-radius:4px;">
              <i class="bi bi-geo-alt"></i> ${locName}
            </span>
          </div>
          <div class="product-name">${p.name}</div>
        </div>
        <div>
          <div class="product-stock" style="margin-bottom:2px;">
            Kho: <strong>${p.stock_quantity} ${p.unit || 'Thùng'}</strong>
            <span style="font-size:0.75rem; color:#6b7280; margin-left:4px;">(${locName})</span>
          </div>
          <div class="product-price">${formatVND(p.selling_price)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// CART MANAGEMENT
function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  if (product.stock_quantity <= 0) {
    showToast(`Sản phẩm tại "${product.location || 'kho này'}" đã hết hàng!`, 'danger');
    return;
  }

  const existing = currentCart.find(item => item.product_id === product.id);
  if (existing) {
    if (existing.quantity >= product.stock_quantity) {
      showToast(`Số lượng vượt quá tồn kho tại "${product.location || 'kho'}" (${product.stock_quantity})!`, 'warning');
      return;
    }
    existing.quantity += 1;
    existing.subtotal = existing.quantity * existing.unit_price;
  } else {
    currentCart.push({
      product_id: product.id,
      product_sku: product.sku,
      product_name: product.name,
      location: product.location || 'Chưa phân kho',
      unit: product.unit || 'Thùng',
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
  isShippingFeeManuallyEdited = false;
  const discountInput = document.getElementById('summary-discount');
  if (discountInput) discountInput.value = '0';
  const paidInput = document.getElementById('paid-amount-input');
  if (paidInput) paidInput.value = '0';
  const shippingInput = document.getElementById('summary-shipping-fee');
  if (shippingInput) shippingInput.value = '0';
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

  const deliverySelect = document.getElementById('delivery-method-select');
  const deliveryMethod = deliverySelect ? deliverySelect.value : '';
  const summaryShippingInput = document.getElementById('summary-shipping-fee');
  const currentShippingVal = summaryShippingInput ? summaryShippingInput.value : '0';
  const selectedCust = allCustomers.find(c => c.id === selectedCustomerId);
  const custDist = selectedCust ? (selectedCust.distance_km || selectedCust.distance || 5) : 5;

  let itemsHtml = currentCart.map(item => {
    const prod = allProducts.find(p => p.id === item.product_id);
    const skuOrCat = prod ? (prod.sku || prod.category || 'Khác') : 'Khác';
    const feeResult = calculateShippingFeeAdvanced(skuOrCat, custDist, item.quantity, 0, allShippingRules);
    const itemShipFee = deliveryMethod === 'Delivery' ? feeResult.totalFee : 0;

    let shipInfoText = '';
    if (deliveryMethod === 'Pickup') {
      shipInfoText = `<div class="cart-item-shipping-info" style="font-size:0.75rem; color:var(--text-muted); font-weight:500; margin-top:3px;"><i class="bi bi-truck"></i> Phí VC: 0 ₫ (Khách tự nhận)</div>`;
    } else if (deliveryMethod === 'Delivery') {
      const unitText = item.unit || 'thùng';
      shipInfoText = `<div class="cart-item-shipping-info" style="font-size:0.75rem; color:var(--primary); font-weight:600; margin-top:3px;"><i class="bi bi-truck text-primary"></i> Phí VC (SKU: ${skuOrCat} • ~${feeResult.distanceKm}km): <strong>${formatVND(feeResult.baseFee)}/${unitText} × ${item.quantity} = +${formatVND(itemShipFee)}</strong></div>`;
    } else {
      shipInfoText = `<div class="cart-item-shipping-info" style="font-size:0.75rem; color:var(--text-muted); font-weight:500; margin-top:3px;"><i class="bi bi-truck"></i> Chưa chọn hình thức nhận hàng</div>`;
    }

    return `
      <div class="cart-item" id="cart-item-${item.product_id}" style="flex-direction:column; align-items:stretch; gap:6px;">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
          <div>
            <div class="cart-item-title" style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
              <span>${item.product_name}</span>
              <span class="badge" style="font-size:0.7rem; font-weight:700; color:#4f46e5; background:#eef2ff; border:1px solid #c7d2fe; padding:1px 5px; border-radius:3px;">
                <i class="bi bi-geo-alt"></i> ${item.location || 'Kho'}
              </span>
            </div>
            <div class="cart-item-price" id="cart-item-price-${item.product_id}">${formatVND(item.unit_price)} × ${item.quantity}</div>
          </div>
          <div class="qty-control">
            <button class="qty-btn" onclick="updateCartQty('${item.product_id}', -1)">-</button>
            <input type="text" 
                   inputmode="numeric" 
                   class="qty-input format-number" 
                   value="${item.quantity}" 
                   id="qty-input-${item.product_id}"
                   oninput="onCartQtyInput('${item.product_id}', this)"
                   onchange="onCartQtyChange('${item.product_id}', this)"
                   onfocus="this.select()"
                   onkeydown="if(event.key==='Enter') this.blur()" />
            <button class="qty-btn" onclick="updateCartQty('${item.product_id}', 1)">+</button>
            <button class="qty-btn" style="color:var(--danger);" onclick="removeFromCart('${item.product_id}')">&times;</button>
          </div>
        </div>
        ${shipInfoText}
      </div>
    `;
  }).join('');

  let shippingSubtext = 'Vui lòng chọn hình thức nhận hàng';
  if (deliveryMethod === 'Pickup') {
    shippingSubtext = 'Khách tự nhận tại kho (0 ₫)';
  } else if (deliveryMethod === 'Delivery') {
    shippingSubtext = 'Tổng phí giao hàng các danh mục';
  }

  // Append summary shipping fee item row directly below products in cart list
  itemsHtml += `
    <div class="cart-item cart-item-shipping" id="cart-shipping-fee-item" style="background: rgba(99, 102, 241, 0.06); border: 1px dashed var(--primary); border-radius: var(--radius-md); padding: 8px 12px; margin-top: 8px;">
      <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
        <div>
          <div class="cart-item-title" style="color:var(--primary); font-weight:700; font-size:0.88rem; display:flex; align-items:center; gap:6px;">
            <i class="bi bi-truck text-primary"></i> Tổng Phí vận chuyển
            <button type="button" class="btn btn-icon" style="padding:0; width:20px; height:20px; font-size:0.75rem; color:var(--primary);" title="Cấu hình phí theo danh mục" onclick="openShippingRatesModal()">
              <i class="bi bi-gear-fill"></i>
            </button>
          </div>
          <div class="cart-item-price" style="font-size:0.75rem; color:var(--text-subtle);" id="cart-shipping-subtext">${shippingSubtext}</div>
        </div>
        <div style="display:flex; align-items:center; gap:4px;">
          <input type="text" 
                 inputmode="numeric" 
                 id="cart-shipping-fee-input" 
                 class="form-control inline-input format-number" 
                 style="width: 105px; text-align: right; font-weight: 800; color: var(--primary);" 
                 value="${currentShippingVal}" 
                 ${deliveryMethod !== 'Delivery' ? 'disabled style="width: 105px; text-align: right; font-weight: 800; color: var(--primary); opacity: 0.6;"' : ''}
                 oninput="onCartShippingFeeInput(this)" 
                 onchange="calculateCartTotals()" />
          <span style="font-size:0.8rem; font-weight:700; color:var(--primary);">₫</span>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = itemsHtml;
  calculateCartTotals();
}

function onCartShippingFeeInput(inputEl) {
  const methodSelect = document.getElementById('delivery-method-select');
  if (!methodSelect || methodSelect.value !== 'Delivery') {
    inputEl.value = '0';
    return;
  }
  isShippingFeeManuallyEdited = true;
  const summaryShippingInput = document.getElementById('summary-shipping-fee');
  if (summaryShippingInput) {
    summaryShippingInput.value = inputEl.value;
  }
  calculateCartTotals();
}

function onCartQtyInput(productId, inputEl) {
  const item = currentCart.find(i => i.product_id === productId);
  const product = allProducts.find(p => p.id === productId);
  if (!item || !product) return;

  const rawVal = inputEl.value;
  const parsed = parseFormattedNumber(rawVal);

  if (rawVal.trim() === '' || isNaN(parsed) || parsed < 0) {
    item.quantity = 0;
    item.subtotal = 0;
  } else if (parsed > product.stock_quantity) {
    showToast(`Số lượng vượt quá tồn kho hiện tại (${product.stock_quantity})!`, 'warning');
    item.quantity = product.stock_quantity;
    inputEl.value = product.stock_quantity;
    item.subtotal = item.quantity * item.unit_price;
  } else {
    item.quantity = parsed;
    item.subtotal = item.quantity * item.unit_price;
  }

  const priceEl = document.getElementById(`cart-item-price-${productId}`);
  if (priceEl) {
    priceEl.textContent = `${formatVND(item.unit_price)} × ${item.quantity}`;
  }

  const selectedCust = allCustomers.find(c => c.id === selectedCustomerId);
  const custDist = selectedCust ? (selectedCust.distance_km || selectedCust.distance || 5) : 5;
  const deliverySelect = document.getElementById('delivery-method-select');
  const deliveryMethod = deliverySelect ? deliverySelect.value : '';
  const skuOrCat = product ? (product.sku || product.category || 'Khác') : 'Khác';
  const feeResult = calculateShippingFeeAdvanced(skuOrCat, custDist, item.quantity, 0, allShippingRules);
  const itemShipFee = deliveryMethod === 'Delivery' ? feeResult.totalFee : 0;

  const cartItemElem = document.getElementById(`cart-item-${productId}`);
  if (cartItemElem) {
    const shipInfoElem = cartItemElem.querySelector('.cart-item-shipping-info');
    if (shipInfoElem) {
      if (deliveryMethod === 'Pickup') {
        shipInfoElem.innerHTML = `<i class="bi bi-truck"></i> Phí VC: 0 ₫ (Khách tự nhận)`;
      } else if (deliveryMethod === 'Delivery') {
        const unitText = item.unit || 'thùng';
        shipInfoElem.innerHTML = `<i class="bi bi-truck text-primary"></i> Phí VC (SKU: ${skuOrCat} • ~${feeResult.distanceKm}km): <strong>${formatVND(feeResult.baseFee)}/${unitText} × ${item.quantity} = +${formatVND(itemShipFee)}</strong>`;
      } else {
        shipInfoElem.innerHTML = `<i class="bi bi-truck"></i> Chưa chọn hình thức nhận hàng`;
      }
    }
  }

  calculateCartTotals();
}

function onCartQtyChange(productId, inputEl) {
  const item = currentCart.find(i => i.product_id === productId);
  const product = allProducts.find(p => p.id === productId);
  if (!item || !product) return;

  let parsed = parseFormattedNumber(inputEl.value);

  if (isNaN(parsed) || parsed <= 0) {
    removeFromCart(productId);
    return;
  }

  if (parsed > product.stock_quantity) {
    showToast(`Số lượng tối đa trong kho là ${product.stock_quantity}!`, 'warning');
    parsed = product.stock_quantity;
  }

  item.quantity = parsed;
  item.subtotal = item.quantity * item.unit_price;
  renderCartItems();
}

/* =======================================================
   CATEGORY SHIPPING RATES MANAGEMENT & CALCULATIONS
   ======================================================= */
let isShippingFeeManuallyEdited = false;

function saveCategoryShippingRatesToStorage(rates) {
  localStorage.setItem(SHIPPING_RATES_KEY, JSON.stringify(rates));
}

function handleDeliveryMethodChange() {
  isShippingFeeManuallyEdited = false;
  renderCartItems();
}

function onShippingFeeInput() {
  const methodSelect = document.getElementById('delivery-method-select');
  if (!methodSelect || methodSelect.value !== 'Delivery') {
    const shippingInput = document.getElementById('summary-shipping-fee');
    if (shippingInput) shippingInput.value = '0';
    return;
  }
  isShippingFeeManuallyEdited = true;
  calculateCartTotals();
}

function openShippingRatesModal() {
  const rates = getCategoryShippingRates();
  const prodCategories = (allProducts || []).map(p => p.category).filter(Boolean);
  const categories = [...new Set([...prodCategories, 'Khác'])];

  const container = document.getElementById('shipping-rates-list');
  if (!container) return;

  container.innerHTML = categories.map(cat => {
    const val = rates[cat] !== undefined ? rates[cat] : (rates['Khác'] !== undefined ? rates['Khác'] : 20000);
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--bg-surface); padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <span style="font-weight: 600; font-size: 0.88rem; flex: 1;">${cat}</span>
        <div style="display: flex; align-items: center; gap: 6px; width: 190px;">
          <input type="text" inputmode="numeric" class="form-control format-number category-rate-input" data-category="${cat}" value="${formatNumberWithDots(val)}" style="text-align: right;" />
          <span style="font-size: 0.8rem; color: var(--text-subtle); flex-shrink:0;">đ/sp</span>
        </div>
      </div>
    `;
  }).join('');

  openModal('shipping-rates-modal');
}

function saveCategoryShippingRates() {
  const container = document.getElementById('shipping-rates-list');
  if (!container) return;

  const inputs = container.querySelectorAll('.category-rate-input');
  const newRates = getCategoryShippingRates();

  inputs.forEach(input => {
    const cat = input.getAttribute('data-category');
    const val = parseFormattedNumber(input.value) || 0;
    newRates[cat] = val;
  });

  saveCategoryShippingRatesToStorage(newRates);
  showToast('Đã lưu cấu hình phí vận chuyển theo danh mục!', 'success');
  closeModal('shipping-rates-modal');
  isShippingFeeManuallyEdited = false;
  calculateCartTotals();
}

function handlePaymentMethodChange() {
  const methodSelect = document.getElementById('payment-method-select');
  const method = methodSelect ? methodSelect.value : '';
  const paidInput = document.getElementById('paid-amount-input');

  if (method === 'Debt') {
    if (paidInput) paidInput.value = '0';
  }
  calculateCartTotals();
}

function calculateCartTotals() {
  const subtotal = currentCart.reduce((sum, item) => sum + item.subtotal, 0);

  const deliverySelect = document.getElementById('delivery-method-select');
  const deliveryMethod = deliverySelect ? deliverySelect.value : '';
  const shippingInput = document.getElementById('summary-shipping-fee');
  const cartShippingInput = document.getElementById('cart-shipping-fee-input');
  const cartShippingSubtext = document.getElementById('cart-shipping-subtext');

  let shippingFee = 0;

  if (deliveryMethod === 'Pickup') {
    shippingFee = 0;
    if (shippingInput) {
      shippingInput.value = '0';
      shippingInput.disabled = true;
      shippingInput.style.opacity = '0.6';
    }
    if (cartShippingInput) {
      cartShippingInput.value = '0';
      cartShippingInput.disabled = true;
      cartShippingInput.style.opacity = '0.6';
    }
    if (cartShippingSubtext) {
      cartShippingSubtext.textContent = 'Khách tự nhận tại kho (0 ₫)';
    }
  } else if (deliveryMethod === 'Delivery') {
    if (shippingInput) {
      shippingInput.disabled = false;
      shippingInput.style.opacity = '1';
    }
    if (cartShippingInput) {
      cartShippingInput.disabled = false;
      cartShippingInput.style.opacity = '1';
    }
    if (cartShippingSubtext) {
      cartShippingSubtext.textContent = 'Mục con giao hàng tận nơi';
    }

    if (!isShippingFeeManuallyEdited) {
      const selectedCust = allCustomers.find(c => c.id === selectedCustomerId);
      const custDist = selectedCust ? (selectedCust.distance_km || selectedCust.distance || 5) : 5;

      shippingFee = currentCart.reduce((sum, item) => {
        const prod = allProducts.find(p => p.id === item.product_id);
        const skuOrCat = prod ? (prod.sku || prod.category || 'Khác') : 'Khác';
        const feeResult = calculateShippingFeeAdvanced(skuOrCat, custDist, item.quantity, subtotal, allShippingRules);
        return sum + feeResult.totalFee;
      }, 0);
      if (shippingInput) {
        shippingInput.value = formatNumberWithDots(shippingFee);
      }
      if (cartShippingInput && document.activeElement !== cartShippingInput) {
        cartShippingInput.value = formatNumberWithDots(shippingFee);
      }
    } else {
      if (cartShippingInput && document.activeElement === cartShippingInput) {
        shippingFee = parseFormattedNumber(cartShippingInput.value);
        if (shippingInput) shippingInput.value = formatNumberWithDots(shippingFee);
      } else if (shippingInput && document.activeElement === shippingInput) {
        shippingFee = parseFormattedNumber(shippingInput.value);
        if (cartShippingInput) cartShippingInput.value = formatNumberWithDots(shippingFee);
      } else {
        shippingFee = cartShippingInput ? parseFormattedNumber(cartShippingInput.value) : (shippingInput ? parseFormattedNumber(shippingInput.value) : 0);
      }
    }
  } else {
    // Delivery method not selected yet
    shippingFee = 0;
    if (shippingInput) {
      shippingInput.value = '0';
      shippingInput.disabled = true;
      shippingInput.style.opacity = '0.6';
    }
    if (cartShippingInput) {
      cartShippingInput.value = '0';
      cartShippingInput.disabled = true;
      cartShippingInput.style.opacity = '0.6';
    }
    if (cartShippingSubtext) {
      cartShippingSubtext.textContent = 'Vui lòng chọn hình thức nhận hàng';
    }
  }

  const discount = parseFormattedNumber(document.getElementById('summary-discount').value);
  const finalTotal = Math.max(0, subtotal + shippingFee - discount);

  const paidInput = document.getElementById('paid-amount-input');
  const paidAmount = parseFormattedNumber(paidInput ? paidInput.value : 0);
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

  // Update Mobile badges and Floating Mini-Cart Bar
  const totalQty = currentCart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const mobileBadge = document.getElementById('mobile-cart-badge');
  const mobileBar = document.getElementById('pos-mobile-cart-bar');
  const mobileBarQty = document.getElementById('mobile-bar-qty');
  const mobileBarTotal = document.getElementById('mobile-bar-total');

  if (mobileBadge) mobileBadge.textContent = totalQty;
  if (mobileBarQty) mobileBarQty.textContent = totalQty;
  if (mobileBarTotal) mobileBarTotal.textContent = formatVND(finalTotal);

  if (mobileBar) {
    const posLayout = document.querySelector('.pos-layout');
    const isCartView = posLayout && posLayout.classList.contains('view-cart');
    if (totalQty > 0 && !isCartView && window.innerWidth <= 1024) {
      mobileBar.classList.add('visible');
    } else {
      mobileBar.classList.remove('visible');
    }
  }
}

// Mobile View Switcher for POS (Catalog vs Cart)
function switchPosMobileView(view) {
  const posLayout = document.querySelector('.pos-layout');
  const btnCatalog = document.getElementById('btn-tab-pos-catalog');
  const btnCart = document.getElementById('btn-tab-pos-cart');
  const mobileBar = document.getElementById('pos-mobile-cart-bar');

  if (!posLayout) return;

  if (view === 'cart') {
    posLayout.classList.remove('view-catalog');
    posLayout.classList.add('view-cart');
    if (btnCatalog) btnCatalog.classList.remove('active');
    if (btnCart) btnCart.classList.add('active');
    if (mobileBar) mobileBar.classList.remove('visible');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    posLayout.classList.remove('view-cart');
    posLayout.classList.add('view-catalog');
    if (btnCart) btnCart.classList.remove('active');
    if (btnCatalog) btnCatalog.classList.add('active');
    
    const totalQty = currentCart.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    if (mobileBar && totalQty > 0 && window.innerWidth <= 1024) {
      mobileBar.classList.add('visible');
    }
  }
}

if (typeof window !== 'undefined') {
  window.switchPosMobileView = switchPosMobileView;
}

async function processCheckout() {
  if (currentCart.length === 0) {
    showToast('Vui lòng chọn sản phẩm vào giỏ hàng!', 'warning');
    return;
  }

  const customerSelect = document.getElementById('pos-customer-select');
  const customerId = selectedCustomerId || (customerSelect ? customerSelect.value : '');
  if (!customerId) {
    showToast('Vui lòng chọn khách hàng trước khi thanh toán!', 'warning');
    const custInput = document.getElementById('pos-customer-search-input');
    if (custInput) {
      custInput.focus();
      showCustomerDropdown();
    }
    return;
  }

  const customer = allCustomers.find(c => c.id === customerId);
  const customerName = customer ? customer.name : 'Khách Vãng Lai';

  const deliverySelect = document.getElementById('delivery-method-select');
  const deliveryMethod = deliverySelect ? deliverySelect.value : '';
  if (!deliveryMethod) {
    showToast('Vui lòng chọn hình thức nhận hàng!', 'warning');
    if (deliverySelect) deliverySelect.focus();
    return;
  }

  const paymentSelect = document.getElementById('payment-method-select');
  const paymentMethod = paymentSelect ? paymentSelect.value : '';
  if (!paymentMethod) {
    showToast('Vui lòng chọn phương thức thanh toán!', 'warning');
    if (paymentSelect) paymentSelect.focus();
    return;
  }

  const shippingInput = document.getElementById('summary-shipping-fee');
  const shippingFee = deliveryMethod === 'Pickup' ? 0 : (shippingInput ? parseFormattedNumber(shippingInput.value) : 0);

  const subtotal = currentCart.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = parseFormattedNumber(document.getElementById('summary-discount').value);
  const finalTotal = Math.max(0, subtotal + shippingFee - discount);
  const paidAmount = parseFormattedNumber(document.getElementById('paid-amount-input').value);
  const debtAmount = Math.max(0, finalTotal - paidAmount);

  const orderData = {
    customer_id: customerId,
    customer_name: customerName,
    total_amount: subtotal,
    shipping_fee: shippingFee,
    delivery_method: deliveryMethod,
    discount: discount,
    tax: 0,
    final_amount: finalTotal,
    paid_amount: paidAmount,
    debt_amount: debtAmount,
    status: 'Completed',
    payment_method: paymentMethod,
    notes: deliveryMethod === 'Delivery' ? 'Giao hàng tận nơi' : 'Khách tự nhận tại kho'
  };

  try {
    const createdOrder = await window.dbProvider.createOrder(orderData, [...currentCart]);
    showToast(`Đã thanh toán thành công đơn hàng ${createdOrder.order_code}!`, 'success');

    // Render Printable Receipt Modal
    renderPrintableReceipt(createdOrder, createdOrder.items || currentCart);
    openModal('invoice-modal');

    // Reset cart & selections
    clearCart();
    clearCustomerSearch(false);
    if (deliverySelect) deliverySelect.value = '';
    if (paymentSelect) paymentSelect.value = '';
    await initPosData();
  } catch (err) {
    console.error('Lỗi thanh toán POS:', err);
    showToast('Không thể hoàn tất thanh toán: ' + (err.message || 'Lỗi hệ thống'), 'danger');
  }
}

function readMoneyVND(amount) {
  if (!amount || amount === 0) return 'Không đồng';
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  
  let num = Math.abs(Math.round(amount));
  let str = '';
  let unitIdx = 0;
  
  while (num > 0) {
    let block = num % 1000;
    if (block > 0) {
      let bStr = '';
      let h = Math.floor(block / 100);
      let t = Math.floor((block % 100) / 10);
      let o = block % 10;
      
      if (h > 0 || num >= 1000) {
        bStr += digits[h] + ' trăm ';
      }
      if (t > 1) {
        bStr += digits[t] + ' mươi ';
        if (o === 1) bStr += 'mốt ';
        else if (o === 5) bStr += 'lăm ';
        else if (o > 0) bStr += digits[o] + ' ';
      } else if (t === 1) {
        bStr += 'mười ';
        if (o === 5) bStr += 'lăm ';
        else if (o > 0) bStr += digits[o] + ' ';
      } else if (o > 0) {
        if (h > 0 || num >= 1000) bStr += 'lẻ ';
        bStr += digits[o] + ' ';
      }
      str = bStr.trim() + ' ' + units[unitIdx] + ' ' + str;
    }
    unitIdx++;
    num = Math.floor(num / 1000);
  }
  
  str = str.trim() + ' đồng chẵn.';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderPrintableReceipt(order, items) {
  const container = document.getElementById('invoice-print-area');
  if (!container) return;

  const isDelivery = order.delivery_method === 'Delivery';
  const shippingFee = Number(order.shipping_fee) || 0;

  // Find detailed customer record
  const customer = (allCustomers || []).find(c => c.id === order.customer_id || c.name === order.customer_name) || {};

  // Filter actual product items (excluding any shipping sub-items)
  const isShippingSubItem = (i) => {
    if (!i) return false;
    if (i.is_shipping_fee) return true;
    if (i.product_sku && (i.product_sku === 'PVC' || i.product_sku.startsWith('PVC-') || i.product_sku.startsWith('PVC'))) return true;
    if (i.product_name && (i.product_name.toLowerCase().includes('phí vận chuyển') || i.product_name.toLowerCase().includes('vận chuyển -'))) return true;
    return false;
  };

  const prodItems = (items || []).filter(i => !isShippingSubItem(i));
  
  // Find distinct warehouses (strictly deduplicate, split multi-warehouse strings, trim and normalize)
  const warehousesMap = new Map();
  const addWarehouse = (locStr) => {
    if (!locStr) return;
    String(locStr).split(/[,;/+|\\+\n]+/).forEach(part => {
      let trimmed = String(part).trim().replace(/^[\s\-•*📍]+/, '').replace(/[\s\-•*]+$/, '').trim();
      if (trimmed) {
        const key = trimmed.toLowerCase().replace(/\s+/g, ' ');
        if (!warehousesMap.has(key)) {
          warehousesMap.set(key, trimmed);
        }
      }
    });
  };

  prodItems.forEach(i => {
    let loc = i.location;
    if (!loc) {
      const p = (allProducts || []).find(prod => prod.id === i.product_id || prod.sku === i.product_sku || prod.name === i.product_name);
      if (p && p.location) loc = p.location;
    }
    if (loc) addWarehouse(loc);
  });

  if (warehousesMap.size === 0 && (order.location || order.warehouse || order.export_warehouse)) {
    addWarehouse(order.location || order.warehouse || order.export_warehouse);
  }

  const exportWarehouseStr = Array.from(warehousesMap.values()).join(', ') || 'Kho Tổng';

  // Calculate or extract shipping rows for each product
  let shipRows = [];
  if (shippingFee > 0) {
    const explicitShipItems = (items || []).filter(i => i.is_shipping_fee || (i.product_sku && (i.product_sku === 'PVC' || i.product_sku.startsWith('PVC-'))) || (i.product_name && (i.product_name.toLowerCase().includes('phí vận chuyển') || i.product_name.toLowerCase().includes('vận chuyển -'))));

    if (explicitShipItems.length > 0) {
      shipRows = explicitShipItems.map(s => {
        const matchingProd = prodItems.find(p => (p.id && s.product_id && p.id === s.product_id) || (p.product_sku && s.product_sku && s.product_sku.includes(p.product_sku)) || (p.product_name && s.product_name && s.product_name.includes(p.product_name)));
        const itemLoc = s.location || (matchingProd ? (matchingProd.location || 'Kho Tổng') : 'Kho Tổng');
        const itemUnit = s.unit || (matchingProd ? matchingProd.unit : 'Thùng') || 'Thùng';
        const qty = s.quantity || (matchingProd ? matchingProd.quantity : 1);
        const subtotal = Number(s.subtotal || s.unit_price) || 0;
        const unitPrice = s.unit_price && s.unit_price !== subtotal ? s.unit_price : (qty > 0 ? Math.round(subtotal / qty) : subtotal);
        return {
          product_id: s.product_id || (matchingProd ? (matchingProd.product_id || matchingProd.id) : null),
          matching_sku: matchingProd ? matchingProd.product_sku : '',
          matching_name: matchingProd ? matchingProd.product_name : '',
          sku: s.product_sku || (matchingProd && matchingProd.product_sku ? `PVC-${matchingProd.product_sku}` : 'PVC'),
          name: s.product_name || `Phí vận chuyển - ${matchingProd ? matchingProd.product_name : 'Sản phẩm'}`,
          unit: itemUnit,
          location: itemLoc,
          quantity: qty,
          unit_price: unitPrice,
          subtotal: subtotal
        };
      });
    } else {
      const custDist = parseFloat(customer.distance_km || customer.distance || 5) || 5;
      const calculatedFees = prodItems.map(p => {
        const prod = (allProducts || []).find(prod => prod.id === p.product_id || prod.sku === p.product_sku || prod.name === p.product_name) || {};
        const skuOrCat = p.product_sku || prod.sku || prod.category || 'Khác';
        const feeRes = (typeof calculateShippingFeeAdvanced === 'function')
          ? calculateShippingFeeAdvanced(skuOrCat, custDist, p.quantity, 0, allShippingRules)
          : { baseFee: 0, totalFee: 0 };
        return {
          prodItem: p,
          prod: prod,
          baseFee: feeRes.baseFee || 0,
          totalFee: feeRes.totalFee || 0
        };
      });

      const sumCalculated = calculatedFees.reduce((acc, c) => acc + c.totalFee, 0);

      shipRows = calculatedFees.map((c) => {
        const p = c.prodItem;
        const prod = c.prod;
        const itemLoc = p.location || prod.location || 'Kho Tổng';
        const itemUnit = p.unit || prod.unit || 'Thùng';
        const qty = p.quantity || 1;

        let itemSubtotal = 0;
        let itemUnitPrice = 0;

        if (sumCalculated > 0) {
          itemSubtotal = Math.round((c.totalFee / sumCalculated) * shippingFee);
          itemUnitPrice = qty > 0 ? Math.round(itemSubtotal / qty) : itemSubtotal;
        } else {
          itemSubtotal = Math.round(shippingFee / (prodItems.length || 1));
          itemUnitPrice = qty > 0 ? Math.round(itemSubtotal / qty) : itemSubtotal;
        }

        return {
          product_id: p.product_id || prod.id,
          matching_sku: p.product_sku || prod.sku,
          matching_name: p.product_name || prod.name,
          sku: p.product_sku ? `PVC-${p.product_sku}` : 'PVC',
          name: `Phí vận chuyển - ${p.product_name}`,
          unit: itemUnit,
          location: itemLoc,
          quantity: qty,
          unit_price: itemUnitPrice,
          subtotal: itemSubtotal
        };
      });

      // Adjust rounding difference if needed
      const currentShipSum = shipRows.reduce((acc, r) => acc + r.subtotal, 0);
      if (shipRows.length > 0 && currentShipSum !== shippingFee) {
        const diff = shippingFee - currentShipSum;
        shipRows[shipRows.length - 1].subtotal += diff;
        shipRows[shipRows.length - 1].unit_price = Math.round(shipRows[shipRows.length - 1].subtotal / (shipRows[shipRows.length - 1].quantity || 1));
      }
    }
  }

  // Build table rows: Each product followed immediately by its corresponding shipping fee row
  let renderedTableRowsHTML = '';
  const usedShipIndices = new Set();

  prodItems.forEach((i, idx) => {
    const itemLoc = i.location || (allProducts.find(p => p.id === i.product_id || p.sku === i.product_sku)?.location) || 'Kho Tổng';
    const itemUnit = i.unit || (allProducts.find(p => p.id === i.product_id || p.sku === i.product_sku)?.unit) || 'Thùng';

    // Match corresponding shipping row
    let sIdx = shipRows.findIndex((s, index) => !usedShipIndices.has(index) && (
      (s.product_id && (s.product_id === i.product_id || s.product_id === i.id)) ||
      (s.matching_sku && i.product_sku && s.matching_sku === i.product_sku) ||
      (s.sku && i.product_sku && (s.sku === `PVC-${i.product_sku}` || s.sku === i.product_sku)) ||
      (s.matching_name && i.product_name && s.matching_name === i.product_name) ||
      (s.name && i.product_name && s.name.includes(i.product_name))
    ));

    if (sIdx === -1 && shipRows[idx] && !usedShipIndices.has(idx)) {
      sIdx = idx;
    }

    const shipRow = sIdx !== -1 ? shipRows[sIdx] : null;
    if (sIdx !== -1) usedShipIndices.add(sIdx);

    // 1. Dòng Sản Phẩm Chính
    renderedTableRowsHTML += `
      <tr style="border-bottom: ${shipRow && shipRow.subtotal > 0 ? '1px dashed #cbd5e1' : '1px solid #e2e8f0'}; background: #ffffff;">
        <td style="padding: 4px; text-align: center; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${idx + 1}</td>
        <td style="padding: 4px 6px; font-weight: 700; font-family: monospace; border: 1px solid #e2e8f0; color: #0f172a;">${i.product_sku || '-'}</td>
        <td style="padding: 4px 6px; font-weight: 700; color: #0f172a; border: 1px solid #e2e8f0;">${i.product_name}</td>
        <td style="padding: 4px; text-align: center; color: #475569; border: 1px solid #e2e8f0;">${itemUnit}</td>
        <td style="padding: 4px 6px; text-align: center; font-weight: 600; color: #2563eb; border: 1px solid #e2e8f0;">${itemLoc}</td>
        <td style="padding: 4px; text-align: center; font-weight: 800; font-size: 0.82rem; border: 1px solid #e2e8f0;">${i.quantity}</td>
        <td style="padding: 4px 6px; text-align: right; color: #475569; border: 1px solid #e2e8f0;">${formatNumberWithDots(i.unit_price)}</td>
        <td style="padding: 4px 6px; text-align: right; font-weight: 800; color: #0f172a; border: 1px solid #e2e8f0;">${formatNumberWithDots(i.subtotal)}</td>
      </tr>
    `;

    // 2. Dòng Phí Vận Chuyển nằm NGAY DƯỚI mặt hàng đó
    if (shipRow && shipRow.subtotal > 0) {
      renderedTableRowsHTML += `
        <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
          <td style="padding: 3px 4px; text-align: center; border: 1px solid #e2e8f0; color: #64748b; font-size: 0.72rem;">
            <i class="bi bi-arrow-return-right"></i>
          </td>
          <td style="padding: 3px 6px; font-weight: 700; font-family: monospace; color: #2563eb; border: 1px solid #e2e8f0; font-size: 0.75rem;">${shipRow.sku}</td>
          <td style="padding: 3px 6px 3px 12px; font-weight: 600; color: #1e40af; border: 1px solid #e2e8f0;">
            <i class="bi bi-truck" style="font-size: 0.72rem; margin-right: 3px; color: #2563eb;"></i> ${shipRow.name}
          </td>
          <td style="padding: 3px 4px; text-align: center; color: #475569; border: 1px solid #e2e8f0; font-size: 0.75rem;">${shipRow.unit}</td>
          <td style="padding: 3px 6px; text-align: center; font-weight: 600; color: #2563eb; border: 1px solid #e2e8f0; font-size: 0.75rem;">${shipRow.location}</td>
          <td style="padding: 3px 4px; text-align: center; font-weight: 700; font-size: 0.8rem; color: #334155; border: 1px solid #e2e8f0;">${shipRow.quantity}</td>
          <td style="padding: 3px 6px; text-align: right; color: #2563eb; border: 1px solid #e2e8f0; font-size: 0.76rem;">${formatNumberWithDots(shipRow.unit_price)}</td>
          <td style="padding: 3px 6px; text-align: right; font-weight: 800; color: #1e40af; border: 1px solid #e2e8f0;">${formatNumberWithDots(shipRow.subtotal)}</td>
        </tr>
      `;
    }
  });

  // 3. Các dòng phí vận chuyển chung khác chưa gắn vào sản phẩm cụ thể (nếu có)
  shipRows.forEach((s, sIndex) => {
    if (!usedShipIndices.has(sIndex) && s.subtotal > 0) {
      renderedTableRowsHTML += `
        <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
          <td style="padding: 3px 4px; text-align: center; border: 1px solid #e2e8f0; color: #64748b; font-size: 0.72rem;">
            <i class="bi bi-truck"></i>
          </td>
          <td style="padding: 3px 6px; font-weight: 700; font-family: monospace; color: #2563eb; border: 1px solid #e2e8f0; font-size: 0.75rem;">${s.sku}</td>
          <td style="padding: 3px 6px 3px 12px; font-weight: 600; color: #1e40af; border: 1px solid #e2e8f0;">
            <i class="bi bi-truck" style="font-size: 0.72rem; margin-right: 3px; color: #2563eb;"></i> ${s.name}
          </td>
          <td style="padding: 3px 4px; text-align: center; color: #475569; border: 1px solid #e2e8f0; font-size: 0.75rem;">${s.unit}</td>
          <td style="padding: 3px 6px; text-align: center; font-weight: 600; color: #2563eb; border: 1px solid #e2e8f0; font-size: 0.75rem;">${s.location}</td>
          <td style="padding: 3px 4px; text-align: center; font-weight: 700; font-size: 0.8rem; color: #334155; border: 1px solid #e2e8f0;">${s.quantity}</td>
          <td style="padding: 3px 6px; text-align: right; color: #2563eb; border: 1px solid #e2e8f0; font-size: 0.76rem;">${formatNumberWithDots(s.unit_price)}</td>
          <td style="padding: 3px 6px; text-align: right; font-weight: 800; color: #1e40af; border: 1px solid #e2e8f0;">${formatNumberWithDots(s.subtotal)}</td>
        </tr>
      `;
    }
  });

  container.innerHTML = `
    <div class="invoice-a5-landscape">
      <!-- HEADER: KHỔ A5 NGANG (2 CỘT RỘNG) -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 8px;">
        <div style="max-width: 48%;">
          <div style="font-size: 1.2rem; font-weight: 900; color: #1e3a8a; letter-spacing: 0.5px; text-transform: uppercase;">BAO ENTERPRISE</div>
          <div style="font-size: 0.74rem; font-weight: 600; color: #334155; margin-top: 1px;">Hệ Thống Phân Phối Gạch Men & Vật Liệu Xây Dựng</div>
          <div style="font-size: 0.72rem; color: #64748b; margin-top: 1px;">
            <i class="bi bi-telephone-fill" style="font-size: 0.65rem;"></i> Hotline: <strong>1900 8888</strong> | <i class="bi bi-geo-alt-fill" style="font-size: 0.65rem;"></i> Trụ sở chính: TP. Hồ Chí Minh
          </div>
        </div>

        <div style="text-align: right; max-width: 50%;">
          <div style="font-size: 1.18rem; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">HÓA ĐƠN BÁN HÀNG & PHIẾU XUẤT KHO</div>
          <div style="display: flex; justify-content: flex-end; gap: 14px; font-size: 0.76rem; color: #475569; margin-top: 3px;">
            <span>Mã HĐ: <strong style="color: #1e40af; font-size: 0.85rem;">${order.order_code}</strong></span>
            <span>Ngày: <strong>${new Date(order.created_at || Date.now()).toLocaleDateString('vi-VN')} ${new Date(order.created_at || Date.now()).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</strong></span>
          </div>
        </div>
      </div>

      <!-- THÔNG TIN NƠI XUẤT (KHO) VÀ NƠI NHẬN (KHÁCH HÀNG) -->
      <div style="display: grid; grid-template-columns: 1fr 1.35fr; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px; font-size: 0.78rem; line-height: 1.45;">
        <!-- NƠI XUẤT HÀNG -->
        <div style="border-right: 1px dashed #cbd5e1; padding-right: 10px;">
          <div style="font-size: 0.72rem; font-weight: 800; color: #1e40af; text-transform: uppercase; margin-bottom: 2px;">
            <i class="bi bi-box-arrow-up-right"></i> NƠI XUẤT HÀNG (KHO HÀNG):
          </div>
          <div style="font-size: 0.92rem; font-weight: 800; color: #0f172a;">
            <i class="bi bi-geo-alt-fill text-primary"></i> ${exportWarehouseStr}
          </div>
          <div style="font-size: 0.73rem; color: #475569; margin-top: 2px;">
            Phụ trách xuất: <strong>${order.created_by || 'Nhân viên bán hàng'}</strong>
          </div>
        </div>

        <!-- NƠI NHẬN HÀNG -->
        <div style="padding-left: 2px;">
          <div style="font-size: 0.72rem; font-weight: 800; color: #059669; text-transform: uppercase; margin-bottom: 2px;">
            <i class="bi bi-person-check-fill"></i> NƠI NHẬN HÀNG (KHÁCH HÀNG):
          </div>
          <div style="font-size: 0.92rem; font-weight: 800; color: #0f172a;">
            ${order.customer_name} ${customer.code ? `<span style="font-size: 0.76rem; color: #64748b; font-weight: 600;">(${customer.code})</span>` : ''}
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 10px; color: #334155; margin-top: 1px; font-size: 0.74rem;">
            ${customer.phone ? `<span><i class="bi bi-telephone-fill" style="font-size: 0.65rem;"></i> SĐT: <strong>${customer.phone}</strong></span>` : ''}
            ${customer.address ? `<span><i class="bi bi-geo-fill" style="font-size: 0.65rem;"></i> Đ/C: <strong>${customer.address}</strong></span>` : ''}
          </div>
          <div style="color: #64748b; margin-top: 1px; font-size: 0.72rem;">
            <i class="bi bi-truck"></i> Hình thức: <strong style="color: #0f172a;">${isDelivery ? 'Công ty vận chuyển tận nơi' : 'Khách tự nhận tại kho'}</strong>
            ${customer.route ? ` • Tuyến: <strong>${customer.route}</strong>` : ''}
            ${customer.distance_km ? ` (${customer.distance_km} km)` : ''}
          </div>
        </div>
      </div>

      <!-- BẢNG CHI TIẾT SẢN PHẨM KHỔ NGANG -->
      <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; margin-bottom: 8px;">
        <thead>
          <tr style="background: #f1f5f9; border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; font-weight: 700; color: #0f172a;">
            <th style="padding: 5px 4px; text-align: center; width: 35px; border: 1px solid #cbd5e1;">STT</th>
            <th style="padding: 5px 6px; text-align: left; width: 85px; border: 1px solid #cbd5e1;">Mã SKU</th>
            <th style="padding: 5px 6px; text-align: left; border: 1px solid #cbd5e1;">Tên Hàng Hóa - Quy Cách</th>
            <th style="padding: 5px 4px; text-align: center; width: 50px; border: 1px solid #cbd5e1;">ĐVT</th>
            <th style="padding: 5px 6px; text-align: center; width: 90px; border: 1px solid #cbd5e1;">Kho Xuất</th>
            <th style="padding: 5px 4px; text-align: center; width: 55px; border: 1px solid #cbd5e1;">SL</th>
            <th style="padding: 5px 6px; text-align: right; width: 95px; border: 1px solid #cbd5e1;">Đơn Giá (₫)</th>
            <th style="padding: 5px 6px; text-align: right; width: 110px; border: 1px solid #cbd5e1;">Thành Tiền (₫)</th>
          </tr>
        </thead>
        <tbody>
          ${renderedTableRowsHTML}
        </tbody>
      </table>

      <!-- TỔNG HỢP THANH TOÁN (2 CỘT KHỔ A5 NGANG) -->
      <div style="display: grid; grid-template-columns: 1.15fr 1fr; gap: 14px; font-size: 0.77rem; line-height: 1.5; margin-bottom: 8px;">
        <!-- CỘT TRÁI: BẰNG CHỮ & PHƯƠNG THỨC -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div>Số tiền viết bằng chữ: <strong style="color: #1e3a8a; font-style: italic;">${readMoneyVND(order.final_amount)}</strong></div>
            <div style="margin-top: 3px;">Phương thức thanh toán: <strong>${order.payment_method === 'Bank' ? 'Chuyển khoản Ngân hàng' : (order.payment_method === 'Cash' ? 'Tiền mặt' : 'Ghi nợ')}</strong></div>
            <div style="margin-top: 3px; color: #475569;">Ghi chú: ${order.notes || (isDelivery ? 'Giao hàng tận nơi' : 'Khách tự nhận tại kho')}</div>
          </div>
          ${order.debt_amount > 0 ? `
            <div style="margin-top: 4px; background: #fef2f2; border: 1px solid #fecaca; padding: 3px 8px; border-radius: 4px; color: #b91c1c; font-weight: 800; font-size: 0.76rem;">
              <i class="bi bi-exclamation-triangle-fill"></i> Ghi nhận công nợ đơn hàng: ${formatVND(order.debt_amount)}
            </div>
          ` : ''}
        </div>

        <!-- CỘT PHẢI: BẢNG TÍNH TIỀN -->
        <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; background: #ffffff;">
          <div style="display: flex; justify-content: space-between;">
            <span>Tiền hàng (Tạm tính):</span>
            <strong>${formatVND(order.total_amount)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; ${isDelivery ? 'color: #2563eb; font-weight: 600;' : ''}">
            <span>Phí vận chuyển:</span>
            <span>${shippingFee > 0 ? '+' + formatVND(shippingFee) : '0 ₫ (Miễn phí)'}</span>
          </div>
          ${order.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; color: #dc2626;">
              <span>Chiết khấu / Giảm giá:</span>
              <span>-${formatVND(order.discount)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 0.95rem; border-top: 1.5px solid #0f172a; margin-top: 3px; padding-top: 3px; color: #1e3a8a;">
            <span>TỔNG CỘNG HÓA ĐƠN:</span>
            <span style="color: #2563eb;">${formatVND(order.final_amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px; font-size: 0.76rem;">
            <span>Khách đã thanh toán:</span>
            <strong>${formatVND(order.paid_amount)}</strong>
          </div>
        </div>
      </div>

      <!-- CHỮ KÝ XÁC NHẬN 4 BÊN (DÀN HÀNG NGANG) -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); text-align: center; margin-top: 10px; font-size: 0.74rem; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
        <div>
          <strong style="color: #0f172a;">Người Lập Phiếu</strong><br/>
          <span style="font-size: 0.68rem; color: #64748b;">(Ký, ghi rõ họ tên)</span>
          <div style="height: 38px;"></div>
        </div>
        <div>
          <strong style="color: #0f172a;">Người Giao Hàng</strong><br/>
          <span style="font-size: 0.68rem; color: #64748b;">(Ký, ghi rõ họ tên)</span>
          <div style="height: 38px;"></div>
        </div>
        <div>
          <strong style="color: #0f172a;">Thủ Kho Xuất</strong><br/>
          <span style="font-size: 0.68rem; color: #64748b;">(Ký, ghi rõ họ tên)</span>
          <div style="height: 38px;"></div>
        </div>
        <div>
          <strong style="color: #0f172a;">Người Nhận Hàng</strong><br/>
          <span style="font-size: 0.68rem; color: #64748b;">(Ký, ghi rõ họ tên)</span>
          <div style="height: 38px;"></div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 4px; font-size: 0.68rem; color: #94a3b8; font-style: italic;">
        Hóa đơn kiêm phiếu xuất kho có giá trị giao nhận hàng hóa. Xin chân thành cảm ơn Quý khách!
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
    const items = (order.items && order.items.length > 0) 
      ? order.items 
      : [{ product_name: 'Chi tiết đơn hàng ' + orderCode, quantity: 1, subtotal: order.final_amount }];
    renderPrintableReceipt(order, items);
    openModal('invoice-modal');
  }
}

// SALES RETURNS LOGIC
async function openReturnsModal(targetCustomerName = null) {
  if (!allCustomers || allCustomers.length === 0) {
    allCustomers = await window.dbProvider.getCustomers();
  }
  if (!allProducts || allProducts.length === 0) {
    allProducts = await window.dbProvider.getProducts();
  }

  const customerSelect = document.getElementById('return-customer-select');
  if (!customerSelect) return;

  customerSelect.innerHTML = allCustomers.map(c => `
    <option value="${c.name}" data-id="${c.id}">${c.code} - ${c.name} (${c.group_name || 'Khách hàng'})</option>
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

  if (!allProducts || allProducts.length === 0) {
    allProducts = await window.dbProvider.getProducts();
  }

  const customerName = customerSelect.value;
  const selectedOpt = customerSelect.options[customerSelect.selectedIndex];
  const customerId = selectedOpt ? selectedOpt.getAttribute('data-id') : null;

  const orders = await window.dbProvider.getOrders();
  const allReturns = await window.dbProvider.getReturns();

  const custOrders = orders.filter(o => {
    if (customerId && o.customer_id && o.customer_id === customerId) return true;
    if (customerName && o.customer_name && o.customer_name.trim().toLowerCase() === customerName.trim().toLowerCase()) return true;
    return false;
  });

  const custReturns = allReturns.filter(r => {
    if (customerName && r.customer_name && r.customer_name.trim().toLowerCase() === customerName.trim().toLowerCase()) return true;
    return false;
  });

  const purchasedMap = new Map();

  // Accumulate bought quantities from customer orders
  custOrders.forEach(order => {
    const items = order.items || order.order_items || [];
    items.forEach(item => {
      const isShip = item.is_shipping_fee ||
        (item.product_sku && (item.product_sku === 'PVC' || item.product_sku.startsWith('PVC-'))) ||
        (item.product_name && (item.product_name.toLowerCase().includes('phí vận chuyển') || item.product_name.toLowerCase().includes('vận chuyển -')));
      if (isShip) return;

      if (item.product_id || item.product_name) {
        const key = item.product_id || item.product_name;
        if (!purchasedMap.has(key)) {
          purchasedMap.set(key, {
            product_id: item.product_id || '',
            product_name: item.product_name,
            product_sku: item.product_sku || item.sku || '',
            unit_price: item.unit_price || item.selling_price || 0,
            total_bought: 0,
            total_returned: 0,
            available_to_return: 0,
            last_order_code: order.order_code
          });
        }
        purchasedMap.get(key).total_bought += (Number(item.quantity) || 1);
        if (item.unit_price || item.selling_price) {
          purchasedMap.get(key).unit_price = item.unit_price || item.selling_price;
        }
      }
    });
  });

  // Accumulate previously returned quantities
  custReturns.forEach(ret => {
    const rItems = ret.items || (ret.product_name ? [{ product_id: ret.product_id, product_name: ret.product_name, quantity: ret.quantity }] : []);
    rItems.forEach(item => {
      const key = item.product_id || item.product_name;
      if (key && purchasedMap.has(key)) {
        purchasedMap.get(key).total_returned += (Number(item.quantity) || 1);
      } else if (item.product_name) {
        for (let [k, p] of purchasedMap.entries()) {
          if (p.product_name && p.product_name.toLowerCase() === item.product_name.toLowerCase()) {
            p.total_returned += (Number(item.quantity) || 1);
            break;
          }
        }
      }
    });
  });

  // Calculate net_bought (Tổng mua - Tổng đã trả)
  purchasedMap.forEach(p => {
    p.net_bought = Math.max(0, p.total_bought - p.total_returned);
    p.available_to_return = p.net_bought;
  });

  let optionsHTML = '';

  if (purchasedMap.size > 0) {
    const purchasedProducts = Array.from(purchasedMap.values());
    optionsHTML += `<optgroup label="--- Sản phẩm khách đã mua (Lịch sử đơn hàng) ---">`;
    optionsHTML += purchasedProducts.map(p => {
      const optVal = p.product_id || p.product_name;
      const isOutOfStock = p.net_bought === 0;
      const returnNote = p.total_returned > 0 ? ` (Gốc ${p.total_bought} - Đã trừ ${p.total_returned} trả lại)` : '';
      return `<option value="${optVal}" 
        data-name="${p.product_name}" 
        data-price="${p.unit_price}" 
        data-order="${p.last_order_code}"
        data-bought="${p.net_bought}"
        data-original-bought="${p.total_bought}"
        data-returned="${p.total_returned}"
        data-max="${p.net_bought}"
        ${isOutOfStock ? 'style="color:#94a3b8;"' : ''}>
        ${p.product_sku ? p.product_sku + ' - ' : ''}${p.product_name} (${formatVND(p.unit_price)}) - Đã mua: ${p.net_bought}${returnNote}
      </option>`;
    }).join('');
    optionsHTML += `</optgroup>`;

    const purchasedKeys = new Set(purchasedProducts.map(p => p.product_id || p.product_name));
    const otherProducts = allProducts.filter(p => !purchasedKeys.has(p.id) && !purchasedKeys.has(p.name));
    if (otherProducts.length > 0) {
      optionsHTML += `<optgroup label="--- Tất cả sản phẩm khác trong kho ---">`;
      optionsHTML += otherProducts.map(p => `
        <option value="${p.id || p.name}" data-name="${p.name}" data-price="${p.selling_price}" data-order="" data-bought="0" data-original-bought="0" data-returned="0" data-max="999999">
          ${p.sku ? p.sku + ' - ' : ''}${p.name} (${formatVND(p.selling_price)})
        </option>
      `).join('');
      optionsHTML += `</optgroup>`;
    }
  } else {
    optionsHTML += `<option value="">-- Khách chưa có lịch sử mua (Chọn từ tất cả sản phẩm) --</option>`;
    optionsHTML += `<optgroup label="--- Tất cả sản phẩm trong kho ---">`;
    optionsHTML += allProducts.map(p => `
      <option value="${p.id || p.name}" data-name="${p.name}" data-price="${p.selling_price}" data-order="" data-bought="0" data-original-bought="0" data-returned="0" data-max="999999">
        ${p.sku ? p.sku + ' - ' : ''}${p.name} (${formatVND(p.selling_price)})
      </option>
    `).join('');
    optionsHTML += `</optgroup>`;
  }

  productSelect.innerHTML = optionsHTML;
  calculateReturnRefund();
}

function calculateReturnRefund() {
  const productSelect = document.getElementById('return-product-select');
  const refundInput = document.getElementById('return-refund-input');
  const qtyInput = document.getElementById('return-qty-input');
  const helper = document.getElementById('return-qty-helper');
  if (!productSelect || !refundInput) return;

  const selectedOpt = productSelect.options[productSelect.selectedIndex];
  if (!selectedOpt || !productSelect.value) {
    refundInput.value = '0';
    if (helper) helper.innerHTML = '';
    return;
  }

  const price = parseFloat(selectedOpt.getAttribute('data-price')) || 0;
  const maxQtyAttr = selectedOpt.getAttribute('data-max');
  const maxQty = maxQtyAttr !== null ? parseInt(maxQtyAttr) : 999999;
  const originalBought = parseInt(selectedOpt.getAttribute('data-original-bought')) || 0;
  const returnedQty = parseInt(selectedOpt.getAttribute('data-returned')) || 0;
  const netBought = parseInt(selectedOpt.getAttribute('data-bought')) || 0;

  let qty = parseFormattedNumber(qtyInput.value) || 0;

  if (helper) {
    if (originalBought > 0) {
      if (maxQty === 0) {
        helper.innerHTML = `<span style="color:var(--danger); font-weight:700;"><i class="bi bi-exclamation-triangle-fill"></i> Khách đã trả hết toàn bộ số lượng (${returnedQty}/${originalBought}). Đã mua còn lại: 0. Không thể trả thêm!</span>`;
      } else {
        helper.innerHTML = `<i class="bi bi-check-circle-fill" style="color:var(--success);"></i> Số lượng đã mua khả dụng: <strong style="color:var(--primary); font-size:0.95rem;">${netBought}</strong> ${returnedQty > 0 ? `<span style="color:var(--text-subtle);">(Gốc ${originalBought} - Đã trả ${returnedQty})</span>` : ''} | <strong style="color:var(--success);">Tối đa có thể trả: ${maxQty}</strong>`;
      }
    } else {
      helper.innerHTML = `<span style="color:var(--text-subtle);"><i class="bi bi-info-circle"></i> Sản phẩm chưa có lịch sử mua của khách này.</span>`;
    }
  }

  if (originalBought > 0) {
    if (qty > maxQty) {
      if (typeof showToast === 'function' && maxQty > 0) {
        showToast(`Không thể trả vượt quá số lượng đã mua khả dụng! (Tối đa: ${maxQty})`, 'warning');
      }
      qty = maxQty;
      qtyInput.value = maxQty;
    }
  }

  refundInput.value = formatNumberWithDots(price * qty);
}

async function submitSalesReturn() {
  const customerSelect = document.getElementById('return-customer-select');
  if (!customerSelect) return;
  const customerName = customerSelect.value;

  const productSelect = document.getElementById('return-product-select');
  const selectedOpt = productSelect.options[productSelect.selectedIndex];
  if (!selectedOpt || !productSelect.value) {
    showToast('Vui lòng chọn sản phẩm trả lại!', 'warning');
    return;
  }

  const productId = productSelect.value;
  const productName = selectedOpt.getAttribute('data-name');
  const orderCode = selectedOpt.getAttribute('data-order') || ('TH-' + customerName);

  const qty = parseFormattedNumber(document.getElementById('return-qty-input').value) || 1;
  const refundAmount = parseFormattedNumber(document.getElementById('return-refund-input').value);
  const refundMethod = document.getElementById('return-method-select').value;
  const reason = document.getElementById('return-reason-input').value.trim();

  const maxQtyAttr = selectedOpt.getAttribute('data-max');
  const maxQty = maxQtyAttr !== null ? parseInt(maxQtyAttr) : 999999;
  const boughtQty = parseInt(selectedOpt.getAttribute('data-bought')) || 0;

  if (boughtQty > 0) {
    if (maxQty === 0) {
      showToast('Khách hàng đã trả hết toàn bộ số lượng sản phẩm này, không thể lập phiếu trả thêm!', 'error');
      return;
    }
    if (qty > maxQty) {
      showToast(`Số lượng trả lại (${qty}) không thể vượt quá số lượng đã mua khả dụng (${maxQty})!`, 'error');
      return;
    }
  }

  const price = parseFloat(selectedOpt.getAttribute('data-price')) || (qty > 0 ? Math.round(refundAmount / qty) : 0);
  const prodObj = (allProducts || []).find(p => p.id === productId || p.name === productName);
  const unit = prodObj ? (prodObj.unit || 'Cái') : 'Cái';
  const sku = prodObj ? (prodObj.sku || 'SKU-TRA') : (selectedOpt.textContent.includes(' - ') ? selectedOpt.textContent.split(' - ')[0].trim() : 'SKU-TRA');

  const returnData = {
    order_code: orderCode,
    customer_name: customerName,
    total_refund: refundAmount,
    refund_method: refundMethod,
    reason: reason ? `${reason} (Trả ${qty} ${unit} ${productName})` : `Khách trả ${qty} ${unit} ${productName} (Đơn giá: ${formatVND(price)})`
  };

  const returnItems = [{
    product_id: productId,
    product_name: productName,
    product_sku: sku,
    unit: unit,
    quantity: qty,
    unit_price: price,
    amount: refundAmount
  }];

  const createdReturn = await window.dbProvider.createSalesReturn(returnData, returnItems);
  showToast(`Đã lập phiếu trả hàng ${createdReturn.return_code} thành công! Số lượng mua khả dụng đã được trừ lại.`, 'success');

  closeModal('return-modal');
  await initPosData();
  if (typeof loadDebtsData === 'function') {
    await loadDebtsData();
  }
}
