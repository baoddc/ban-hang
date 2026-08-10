/* =======================================================
   DEBT MANAGEMENT MODULE LOGIC (DEBTS.JS)
   ======================================================= */

let allDebts = [];
let allCustomers = [];
let allOrders = [];
let currentDetailCustomerName = '';

document.addEventListener('DOMContentLoaded', async () => {
  await loadDebtsData();
});

async function loadDebtsData() {
  if (!window.dbProvider) return;

  allDebts = await window.dbProvider.getDebts();
  allCustomers = await window.dbProvider.getCustomers();
  allOrders = await window.dbProvider.getOrders();

  calculateDebtKpis();
  filterDebtsTable();
}

function calculateDebtKpis() {
  const receivables = allDebts
    .filter(d => d.type === 'Receivable')
    .reduce((sum, d) => sum + (d.remaining_amount || 0), 0);

  const payables = allDebts
    .filter(d => d.type === 'Payable')
    .reduce((sum, d) => sum + (d.remaining_amount || 0), 0);

  const today = new Date();
  const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const dueCount = allDebts.filter(d => {
    if (!d.due_date || d.remaining_amount === 0) return false;
    const dueDate = new Date(d.due_date);
    return dueDate <= next7Days;
  }).length;

  const recElem = document.getElementById('debts-receivable-total');
  const payElem = document.getElementById('debts-payable-total');
  const dueElem = document.getElementById('debts-due-count');

  if (recElem) recElem.textContent = formatVND(receivables);
  if (payElem) payElem.textContent = formatVND(payables);
  if (dueElem) dueElem.textContent = dueCount;
}

function getGroupedDebts() {
  const customerMap = new Map();

  allDebts.forEach(d => {
    const custName = d.customer_name || 'Khách Vãng Lai';
    if (!customerMap.has(custName)) {
      // Find customer code
      const customerObj = allCustomers.find(c => c.name === custName);
      const code = customerObj ? customerObj.code : (d.type === 'Receivable' ? 'KH-DEBT' : 'NCC-DEBT');

      customerMap.set(custName, {
        customer_name: custName,
        customer_code: code,
        type: d.type || 'Receivable',
        total_amount: 0,
        remaining_amount: 0,
        voucher_count: 0,
        has_overdue: false,
        debts_list: []
      });
    }

    const group = customerMap.get(custName);
    group.total_amount += (d.total_amount || 0);
    group.remaining_amount += (d.remaining_amount || 0);
    group.voucher_count += 1;
    group.debts_list.push(d);

    if (d.remaining_amount > 0 && d.due_date) {
      if (new Date(d.due_date) < new Date()) {
        group.has_overdue = true;
      }
    }
  });

  return Array.from(customerMap.values());
}

function filterDebtsTable() {
  const searchInput = document.getElementById('debt-search-input');
  const typeFilterInput = document.getElementById('debt-type-filter');
  const statusFilterInput = document.getElementById('debt-status-filter');

  const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filterType = typeFilterInput ? typeFilterInput.value : 'All';
  const filterStatus = statusFilterInput ? statusFilterInput.value : 'All';

  const grouped = getGroupedDebts();

  const filtered = grouped.filter(c => {
    const matchType = filterType === 'All' || c.type === filterType;
    const matchSearch = c.customer_name.toLowerCase().includes(search) || c.customer_code.toLowerCase().includes(search);
    
    let matchStatus = true;
    if (filterStatus === 'Unpaid') {
      matchStatus = c.remaining_amount > 0;
    } else if (filterStatus === 'Paid') {
      matchStatus = c.remaining_amount === 0;
    } else if (filterStatus === 'Overdue') {
      matchStatus = c.has_overdue;
    }

    return matchType && matchSearch && matchStatus;
  });

  renderDebtsTable(filtered);
}

function renderDebtsTable(groupedList) {
  const tbody = document.getElementById('debts-tbody');
  if (!tbody) return;

  if (groupedList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px;">Không tìm thấy dữ liệu công nợ khách hàng nào phù hợp</td></tr>`;
    return;
  }

  tbody.innerHTML = groupedList.map(c => {
    const isReceivable = c.type === 'Receivable';
    const paidAmount = Math.max(0, c.total_amount - c.remaining_amount);
    const isFullyPaid = c.remaining_amount === 0;
    
    let statusBadge = `<span class="badge badge-warning">Còn Nợ</span>`;
    if (isFullyPaid) {
      statusBadge = `<span class="badge badge-success">Đã Hoàn Tất</span>`;
    } else if (paidAmount > 0) {
      if (c.has_overdue) {
        statusBadge = `<span class="badge badge-danger"><i class="bi bi-clock-history"></i> Quá Hạn (Trả 1 phần)</span>`;
      } else {
        statusBadge = `<span class="badge badge-warning" style="background:#f59e0b; color:#fff;"><i class="bi bi-pie-chart-fill"></i> Trả 1 Phần</span>`;
      }
    } else if (c.has_overdue) {
      statusBadge = `<span class="badge badge-danger"><i class="bi bi-clock-history"></i> Quá Hạn</span>`;
    }

    return `
      <tr>
        <td><code>${c.customer_code}</code></td>
        <td><strong>${c.customer_name}</strong></td>
        <td>
          <span class="badge ${isReceivable ? 'badge-danger' : 'badge-info'}">
            ${isReceivable ? 'Phải Thu (Khách)' : 'Phải Trả (NCC)'}
          </span>
        </td>
        <td><span class="badge badge-secondary" style="background:#e2e8f0; color:#334155;">${c.voucher_count} phiếu</span></td>
        <td>${formatVND(c.total_amount)}</td>
        <td style="color:var(--success); font-weight:600;">${formatVND(paidAmount)}</td>
        <td style="font-weight:800; color:${isFullyPaid ? 'var(--success)' : 'var(--danger)'}; font-size:0.95rem;">
          ${formatVND(c.remaining_amount)}
        </td>
        <td>${statusBadge}</td>
        <td>
          <div style="display:flex; gap:6px; justify-content:center;">
            ${!isFullyPaid ? `
              <button class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;" onclick="openPaymentModalForCustomer('${c.customer_name.replace(/'/g, "\\'")}')">
                <i class="bi bi-wallet2"></i> Thu/Trả
              </button>
            ` : ''}
            <button class="btn btn-info" style="padding:4px 8px; font-size:0.75rem; background:hsl(215, 90%, 52%); border-color:hsl(215, 90%, 52%); color:#fff;" onclick="openCustomerPurchaseDetailModal('${c.customer_name.replace(/'/g, "\\'")}')">
              <i class="bi bi-cart-check"></i> Xem Mua Hàng
            </button>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="openDebtHistoryModalForCustomer('${c.customer_name.replace(/'/g, "\\'")}')">
              <i class="bi bi-printer"></i> In Sổ Nợ
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* ================= =======================================
   PURCHASE HISTORY DETAILS MODAL WITH DATE RANGE FILTERS
   ======================================================= */

function openCustomerPurchaseDetailModal(customerName) {
  currentDetailCustomerName = customerName;

  const titleElem = document.getElementById('purchase-modal-customer-name');
  if (titleElem) titleElem.textContent = customerName;

  // Set default preset: 30 days
  const presetSelect = document.getElementById('purchase-date-preset');
  if (presetSelect) presetSelect.value = '30days';

  applyDatePresetToInputs('30days');
  filterPurchaseDetailsModal();

  openModal('customer-purchase-detail-modal');
}

function handlePurchasePresetChange() {
  const presetSelect = document.getElementById('purchase-date-preset');
  if (!presetSelect) return;

  const preset = presetSelect.value;
  applyDatePresetToInputs(preset);
  filterPurchaseDetailsModal();
}

function applyDatePresetToInputs(preset) {
  const startInput = document.getElementById('purchase-date-start');
  const endInput = document.getElementById('purchase-date-end');
  if (!startInput || !endInput) return;

  const today = new Date();
  const formatYYYYMMDD = (d) => d.toISOString().slice(0, 10);

  if (preset === 'today') {
    startInput.value = formatYYYYMMDD(today);
    endInput.value = formatYYYYMMDD(today);
  } else if (preset === '7days') {
    const d7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    startInput.value = formatYYYYMMDD(d7);
    endInput.value = formatYYYYMMDD(today);
  } else if (preset === '30days') {
    const d30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    startInput.value = formatYYYYMMDD(d30);
    endInput.value = formatYYYYMMDD(today);
  } else if (preset === 'this_month') {
    const dMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    startInput.value = formatYYYYMMDD(dMonthStart);
    endInput.value = formatYYYYMMDD(today);
  } else if (preset === 'all') {
    startInput.value = '';
    endInput.value = '';
  }
}

function resetPurchaseModalFilters() {
  const presetSelect = document.getElementById('purchase-date-preset');
  const searchInput = document.getElementById('purchase-product-search');

  if (presetSelect) presetSelect.value = 'all';
  if (searchInput) searchInput.value = '';

  applyDatePresetToInputs('all');
  filterPurchaseDetailsModal();
}

function filterPurchaseDetailsModal() {
  if (!currentDetailCustomerName) return;

  const startVal = document.getElementById('purchase-date-start') ? document.getElementById('purchase-date-start').value : '';
  const endVal = document.getElementById('purchase-date-end') ? document.getElementById('purchase-date-end').value : '';
  const searchVal = document.getElementById('purchase-product-search') ? document.getElementById('purchase-product-search').value.toLowerCase().trim() : '';

  const startDate = startVal ? new Date(startVal + 'T00:00:00') : null;
  const endDate = endVal ? new Date(endVal + 'T23:59:59') : null;

  // Get orders for this customer
  const customerOrders = allOrders.filter(o => o.customer_name === currentDetailCustomerName);

  const purchaseRows = [];

  customerOrders.forEach(order => {
    // Date filter on order creation
    if (order.created_at) {
      const oDate = new Date(order.created_at);
      if (startDate && oDate < startDate) return;
      if (endDate && oDate > endDate) return;
    }

    const items = order.items && order.items.length > 0 ? order.items : [
      { product_name: 'Chi tiết đơn hàng ' + order.order_code, quantity: 1, unit_price: order.final_amount, subtotal: order.final_amount }
    ];

    items.forEach(item => {
      const matchSearch = !searchVal || 
        (item.product_name && item.product_name.toLowerCase().includes(searchVal)) ||
        (order.order_code && order.order_code.toLowerCase().includes(searchVal));

      if (matchSearch) {
        purchaseRows.push({
          order_id: order.id,
          order_code: order.order_code,
          created_at: order.created_at,
          payment_method: order.payment_method || 'Bank',
          product_name: item.product_name,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          subtotal: item.subtotal || (item.quantity * item.unit_price) || 0
        });
      }
    });
  });

  // Calculate Modal KPIs
  const uniqueOrderCodes = new Set(purchaseRows.map(r => r.order_code)).size;
  const totalQty = purchaseRows.reduce((sum, r) => sum + r.quantity, 0);
  const totalAmount = purchaseRows.reduce((sum, r) => sum + r.subtotal, 0);

  const orderCountElem = document.getElementById('purchase-kpi-order-count');
  const qtyCountElem = document.getElementById('purchase-kpi-qty-count');
  const amountElem = document.getElementById('purchase-kpi-total-amount');

  if (orderCountElem) orderCountElem.textContent = uniqueOrderCodes;
  if (qtyCountElem) qtyCountElem.textContent = totalQty;
  if (amountElem) amountElem.textContent = formatVND(totalAmount);

  // Render Table
  const tbody = document.getElementById('purchase-modal-tbody');
  if (!tbody) return;

  if (purchaseRows.length === 0) {
    let filterTimeText = '';
    if (startVal || endVal) {
      filterTimeText = `trong khoảng thời gian từ ${startVal || 'đầu'} đến ${endVal || 'hiện tại'}`;
    }
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">
          <i class="bi bi-info-circle" style="font-size:1.5rem; display:block; margin-bottom:6px; color:var(--info);"></i>
          Không tìm thấy đơn hàng / sản phẩm nào ${filterTimeText} phù hợp với từ khóa tìm kiếm.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = purchaseRows.map((r, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td style="font-size:0.82rem;">${formatDate(r.created_at)}</td>
      <td><code>${r.order_code}</code></td>
      <td style="font-weight:700; color:var(--primary);">${r.product_name}</td>
      <td style="font-weight:800; text-align:center;">${r.quantity}</td>
      <td>${formatVND(r.unit_price)}</td>
      <td style="font-weight:800; color:var(--success);">${formatVND(r.subtotal)}</td>
      <td>
        <span class="badge ${r.payment_method === 'Debt' ? 'badge-warning' : 'badge-info'}" style="font-size:0.75rem;">
          ${r.payment_method === 'Debt' ? 'Ghi Nợ' : (r.payment_method === 'Bank' ? 'Chuyển Khoản' : 'Tiền Mặt')}
        </span>
      </td>
    </tr>
  `).join('');
}

/* ================= =======================================
   PAYMENT MODAL FOR CUSTOMER DEBT
   ======================================================= */

function openPaymentModalForCustomer(customerName) {
  const customerDebts = allDebts.filter(d => d.customer_name === customerName && d.remaining_amount > 0);

  if (customerDebts.length === 0) {
    showToast('Khách hàng này hiện đã hết nợ!', 'info');
    return;
  }

  document.getElementById('pay-customer-name-hidden').value = customerName;
  document.getElementById('pay-partner-name').value = customerName;

  const selectGroup = document.getElementById('pay-voucher-select-group');
  const selectElem = document.getElementById('pay-voucher-select');

  const totalRemaining = customerDebts.reduce((sum, d) => sum + d.remaining_amount, 0);

  if (selectGroup && selectElem) {
    selectGroup.style.display = 'block';
    
    let optionsHtml = '';
    if (customerDebts.length > 1) {
      optionsHtml += `<option value="AUTO" selected>⚡ Tự động phân bổ cho phiếu cũ nhất (Tổng dư nợ: ${formatVND(totalRemaining)})</option>`;
    }
    
    optionsHtml += customerDebts.map(d => `
      <option value="${d.id}">Phiếu: ${d.code} - Còn nợ: ${formatVND(d.remaining_amount)} (Hạn: ${formatDate(d.due_date)})</option>
    `).join('');

    selectElem.innerHTML = optionsHtml;
  }

  onPaymentVoucherSelectChange();
  openModal('debt-payment-modal');
}

function onPaymentVoucherSelectChange() {
  const customerName = document.getElementById('pay-customer-name-hidden').value;
  const debtIdSelect = document.getElementById('pay-voucher-select');
  const debtId = debtIdSelect ? debtIdSelect.value : 'AUTO';
  const customerDebts = allDebts.filter(d => d.customer_name === customerName && d.remaining_amount > 0);

  let maxDebt = 0;
  if (debtId === 'AUTO') {
    maxDebt = customerDebts.reduce((sum, d) => sum + d.remaining_amount, 0);
    document.getElementById('pay-debt-id').value = 'AUTO';
    document.getElementById('pay-remaining-amount').value = formatVND(maxDebt);
    document.getElementById('pay-note-input').value = `Thanh toán công nợ cho ${customerName}`;
  } else {
    const debt = customerDebts.find(d => d.id === debtId) || customerDebts[0];
    if (debt) {
      maxDebt = debt.remaining_amount;
      document.getElementById('pay-debt-id').value = debt.id;
      document.getElementById('pay-remaining-amount').value = formatVND(maxDebt);
      document.getElementById('pay-note-input').value = `Thanh toán khoản nợ ${debt.code} của ${customerName}`;
    }
  }

  document.getElementById('pay-max-debt-raw').value = maxDebt;
  document.getElementById('pay-amount-input').value = formatNumberWithDots(maxDebt);

  updatePaymentCalculationSummary();
}

function setQuickPaymentPercent(fraction) {
  const maxDebt = parseFloat(document.getElementById('pay-max-debt-raw').value) || 0;
  const targetAmount = Math.round(maxDebt * fraction);
  document.getElementById('pay-amount-input').value = formatNumberWithDots(targetAmount);
  updatePaymentCalculationSummary();
}

function updatePaymentCalculationSummary() {
  const maxDebt = parseFloat(document.getElementById('pay-max-debt-raw').value) || 0;
  const payAmountInput = document.getElementById('pay-amount-input');
  const payAmount = parseFormattedNumber(payAmountInput ? payAmountInput.value : 0);

  const calcRemainingElem = document.getElementById('calc-preview-remaining');
  const calcStatusBadge = document.getElementById('calc-preview-status-badge');

  const remainingAfter = Math.max(0, maxDebt - payAmount);

  if (calcRemainingElem) {
    calcRemainingElem.textContent = formatVND(remainingAfter);
  }

  if (calcStatusBadge) {
    if (payAmount <= 0) {
      calcStatusBadge.innerHTML = `<span class="badge badge-secondary">Vui lòng nhập số tiền hợp lệ</span>`;
    } else if (payAmount > maxDebt) {
      calcStatusBadge.innerHTML = `<span class="badge badge-danger"><i class="bi bi-exclamation-triangle-fill"></i> Số tiền vượt dư nợ (${formatVND(payAmount - maxDebt)})</span>`;
    } else if (payAmount === maxDebt) {
      calcStatusBadge.innerHTML = `<span class="badge badge-success"><i class="bi bi-check-circle-fill"></i> Thanh toán toàn bộ (100%)</span>`;
    } else {
      const pct = Math.round((payAmount / maxDebt) * 100);
      calcStatusBadge.innerHTML = `<span class="badge badge-warning" style="background:#f59e0b; color:#fff;"><i class="bi bi-pie-chart-fill"></i> Thanh toán 1 phần (${pct}%)</span>`;
    }
  }
}

async function submitDebtPayment() {
  const customerName = document.getElementById('pay-customer-name-hidden').value;
  const debtId = document.getElementById('pay-debt-id').value;
  const amount = parseFormattedNumber(document.getElementById('pay-amount-input').value);
  const maxDebt = parseFloat(document.getElementById('pay-max-debt-raw').value) || 0;
  const method = document.getElementById('pay-method-select').value;
  const note = document.getElementById('pay-note-input').value;

  if (amount <= 0) {
    showToast('Vui lòng nhập số tiền thanh toán hợp lệ!', 'warning');
    return;
  }

  if (amount > maxDebt) {
    showToast(`Số tiền thanh toán (${formatVND(amount)}) không được vượt quá số nợ hiện tại (${formatVND(maxDebt)})!`, 'warning');
    return;
  }

  await window.dbProvider.addDebtPayment(debtId, amount, method, note, customerName);

  const isPartial = amount < maxDebt;
  const toastMsg = isPartial 
    ? `Đã ghi nhận thanh toán 1 phần công nợ (${formatVND(amount)}) thành công!` 
    : 'Đã hoàn tất thanh toán 100% công nợ thành công!';

  showToast(toastMsg, 'success');

  closeModal('debt-payment-modal');
  await loadDebtsData();
}

/* ================= =======================================
   PRINTABLE DEBT HISTORY LEDGER FOR CUSTOMER
   ======================================================= */

async function openDebtHistoryModalForCustomer(customerName) {
  const customerDebts = allDebts.filter(d => d.customer_name === customerName);
  if (customerDebts.length === 0) {
    showToast('Không có dữ liệu nợ cho đối tác này!', 'warning');
    return;
  }

  const container = document.getElementById('debt-history-print-area');
  if (!container) return;

  // Gather all debt payments, products, and orders for this customer
  const historyData = await window.dbProvider.getCustomerHistory(customerName);
  const payments = historyData ? (historyData.payments || []) : [];
  const products = await window.dbProvider.getProducts();
  const orders = historyData ? (historyData.orders || []) : (await window.dbProvider.getOrders());

  const totalOriginalDebt = customerDebts.reduce((sum, d) => sum + (d.total_amount || 0), 0);
  const totalRemainingDebt = customerDebts.reduce((sum, d) => sum + (d.remaining_amount || 0), 0);
  const totalPaid = totalOriginalDebt - totalRemainingDebt;

  // Build row items for "1. Các Khoản Nợ Đã Phát Sinh" table
  let debtRows = [];

  customerDebts.forEach((d, debtIdx) => {
    // Match corresponding order
    let matchedOrder = orders.find(o => o.id === d.order_id || o.order_code === d.order_code);
    if (!matchedOrder && d.notes) {
      matchedOrder = orders.find(o => o.order_code && d.notes.includes(o.order_code));
    }
    if (!matchedOrder) {
      matchedOrder = orders.find(o => o.customer_name === d.customer_name && Math.abs((o.debt_amount || o.final_amount) - d.total_amount) < 100);
    }

    let items = (d.items && d.items.length > 0) ? d.items : (matchedOrder && matchedOrder.items && matchedOrder.items.length > 0 ? matchedOrder.items : null);

    const debtDate = matchedOrder && matchedOrder.created_at ? formatDate(matchedOrder.created_at) : (d.created_at ? formatDate(d.created_at) : formatDate(d.due_date));
    const debtNote = d.notes || (matchedOrder ? `Ghi nhận công nợ đơn ${matchedOrder.order_code}` : d.code);

    if (items && items.length > 0) {
      items.forEach(item => {
        let prod = products.find(p => p.id === item.product_id || p.sku === item.product_sku || p.name === item.product_name || (item.product_name && p.name && p.name.toLowerCase() === item.product_name.toLowerCase()));
        
        if (!prod) {
          prod = products.find(p => (item.product_name && item.product_name.includes(p.name)) || (d.notes && d.notes.includes(p.name)));
        }
        if (!prod) {
          prod = products[debtIdx % products.length] || products[0];
        }

        const sku = prod ? prod.sku : (item.product_sku || item.sku || 'SKU-PROD');
        const name = prod ? prod.name : (item.product_name || 'Sản phẩm');
        const unit = prod ? prod.unit : (item.unit || 'Cái');
        const qty = item.quantity || 1;

        let itemAmount = 0;
        if (items.length === 1) {
          itemAmount = d.total_amount || item.subtotal || (qty * (item.unit_price || 0));
        } else {
          const orderTotal = matchedOrder ? (matchedOrder.total_amount || matchedOrder.final_amount || 1) : 1;
          const rawSubtotal = item.subtotal || (qty * (item.unit_price || 0));
          itemAmount = Math.round((rawSubtotal / orderTotal) * d.total_amount);
        }

        debtRows.push({
          date: debtDate,
          product_sku: sku,
          product_name: name,
          unit: unit,
          quantity: qty,
          amount: itemAmount,
          notes: debtNote
        });
      });
    } else {
      let prod = products.find(p => d.notes && d.notes.includes(p.name));
      if (!prod) {
        if (d.total_amount >= 50000000) {
          prod = products.find(p => p.sku === 'LAP-DEL-01') || products[0];
        } else if (d.total_amount <= 5000000) {
          prod = products.find(p => p.sku === 'MON-LG-27') || products[1] || products[0];
        } else {
          prod = products[debtIdx % products.length] || products[0];
        }
      }

      debtRows.push({
        date: debtDate,
        product_sku: prod ? prod.sku : 'SKU-PROD',
        product_name: prod ? prod.name : 'Sản Phẩm Kho Bãi',
        unit: prod ? prod.unit : 'Cái',
        quantity: 1,
        amount: d.total_amount || d.remaining_amount || 0,
        notes: debtNote
      });
    }
  });

  container.innerHTML = `
    <div class="invoice-receipt" style="background:#fff; color:#000; padding:20px; font-family:sans-serif;">
      <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:12px; margin-bottom:16px;">
        <h2 style="margin:0; font-size:1.4rem;">CÔNG TY CỔ PHẦN ERP APEX</h2>
        <p style="margin:4px 0; font-size:0.9rem; font-weight:bold;">SỔ ĐỐI SOÁT TỔNG HỢP CÔNG NỢ KHÁCH HÀNG</p>
        <p style="margin:0; font-size:0.8rem; color:#555;">Đối Tác: <strong>${customerName}</strong> | Ngày In: ${new Date().toLocaleDateString('vi-VN')}</p>
      </div>

      <h4 style="margin-bottom:8px; font-size:0.95rem;">1. Các Khoản Nợ Đã Phát Sinh:</h4>
      <table class="receipt-table" style="border:1px solid #ddd; margin-bottom:16px; width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:6px; border:1px solid #ddd; text-align:center;">Số thứ tự</th>
            <th style="padding:6px; border:1px solid #ddd;">Ngày</th>
            <th style="padding:6px; border:1px solid #ddd;">Mã sản phẩm</th>
            <th style="padding:6px; border:1px solid #ddd;">Tên sản phẩm</th>
            <th style="padding:6px; border:1px solid #ddd; text-align:center;">Đơn vị tính</th>
            <th style="padding:6px; border:1px solid #ddd; text-align:center;">Số lượng</th>
            <th style="padding:6px; border:1px solid #ddd; text-align:right;">Thành tiền</th>
            <th style="padding:6px; border:1px solid #ddd;">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          ${debtRows.map((r, idx) => `
            <tr>
              <td style="padding:6px; border:1px solid #ddd; text-align:center;">${idx + 1}</td>
              <td style="padding:6px; border:1px solid #ddd;">${r.date}</td>
              <td style="padding:6px; border:1px solid #ddd;"><code>${r.product_sku}</code></td>
              <td style="padding:6px; border:1px solid #ddd; font-weight:600;">${r.product_name}</td>
              <td style="padding:6px; border:1px solid #ddd; text-align:center;">${r.unit}</td>
              <td style="padding:6px; border:1px solid #ddd; text-align:center; font-weight:bold;">${r.quantity}</td>
              <td style="padding:6px; border:1px solid #ddd; text-align:right; font-weight:bold; color:red;">${formatVND(r.amount)}</td>
              <td style="padding:6px; border:1px solid #ddd; font-size:0.8rem;">${r.notes}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h4 style="margin-bottom:8px; font-size:0.95rem;">2. Lịch Sử Các Đợt Thanh Toán:</h4>
      <table class="receipt-table" style="border:1px solid #ddd; margin-bottom:16px; width:100%;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:6px; border:1px solid #ddd;">STT</th>
            <th style="padding:6px; border:1px solid #ddd;">Mã Phiếu</th>
            <th style="padding:6px; border:1px solid #ddd;">Ngày Thanh Toán</th>
            <th style="padding:6px; border:1px solid #ddd;">Số Tiền Trả</th>
            <th style="padding:6px; border:1px solid #ddd;">Hình Thức</th>
            <th style="padding:6px; border:1px solid #ddd;">Ghi Chú</th>
          </tr>
        </thead>
        <tbody>
          ${payments.length === 0 ? `
            <tr><td colspan="6" style="text-align:center; padding:10px;">Chưa có đợt thanh toán nào được ghi nhận</td></tr>
          ` : payments.map((p, idx) => `
            <tr>
              <td style="padding:6px; border:1px solid #ddd; text-align:center;">${idx + 1}</td>
              <td style="padding:6px; border:1px solid #ddd;">${p.payment_code}</td>
              <td style="padding:6px; border:1px solid #ddd;">${formatDate(p.created_at)}</td>
              <td style="padding:6px; border:1px solid #ddd; font-weight:bold; color:green; text-align:right;">${formatVND(p.amount)}</td>
              <td style="padding:6px; border:1px solid #ddd;">${p.payment_method === 'Bank' ? 'Chuyển Khoản' : (p.payment_method === 'DebtDeduction' ? 'Khấu Trừ Trả Hàng' : (p.payment_method === 'Cash' ? 'Tiền Mặt' : p.payment_method))}</td>
              <td style="padding:6px; border:1px solid #ddd; font-size:0.8rem;">${p.note || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="border-top:2px dashed #000; padding-top:10px; font-size:0.92rem;">
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span>Tổng Giá Trị Công Nợ Ban Đầu:</span>
          <strong>${formatVND(totalOriginalDebt)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:green;">
          <span>Tổng Số Tiền Đã Thanh Toán:</span>
          <strong>-${formatVND(totalPaid)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:1.1rem; color:red; border-top:1px solid #ccc; padding-top:6px; margin-top:4px;">
          <span>CÒN NỢ TỔNG HỢP HIỆN TẠI:</span>
          <strong>${formatVND(totalRemainingDebt)}</strong>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; margin-top:40px; text-align:center; font-size:0.85rem;">
        <div>
          <p><strong>ĐẠI DIỆN KHÁCH HÀNG / NCC</strong></p>
          <p style="margin-top:40px; color:#888;">(Ký, ghi rõ họ tên)</p>
        </div>
        <div>
          <p><strong>NGƯỜI LẬP BẢNG ĐỐI SOÁT</strong></p>
          <p style="margin-top:40px; color:#888;">(Ký, ghi rõ họ tên)</p>
        </div>
      </div>
    </div>
  `;

  openModal('debt-history-modal');
}

function openNewDebtModal() {
  showToast('Mẹo: Công nợ được tự động tạo khi bán hàng ghi nợ tại phân hệ POS!', 'info');
}

