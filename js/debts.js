/* =======================================================
   DEBT MANAGEMENT MODULE LOGIC (DEBTS.JS)
   ======================================================= */

let allDebts = [];
let allCustomers = [];
let allOrders = [];
let allInboundOrders = [];
let currentDetailCustomerName = '';

document.addEventListener('DOMContentLoaded', async () => {
  await loadDebtsData();
  const params = new URLSearchParams(window.location.search);
  const payPartner = params.get('payPartner') || params.get('paySupplier');
  if (payPartner) {
    setTimeout(() => {
      openPaymentModalForCustomer(payPartner);
    }, 250);
  }
});

function syncInboundOrdersToPayableDebts(debts, inboundOrders, customers = []) {
  if (!Array.isArray(debts)) debts = [];
  if (!Array.isArray(inboundOrders)) return debts;

  // Build a set of codes & IDs for CANCELLED inbound orders
  const cancelledCodes = new Set();
  inboundOrders.forEach(inb => {
    const s = (inb.status || '').toLowerCase();
    if (s === 'cancelled' || s === 'đã hủy') {
      if (inb.code) cancelledCodes.add(String(inb.code));
      if (inb.id) cancelledCodes.add(String(inb.id));
    }
  });

  // Filter out any payable debt records associated with cancelled inbound orders
  let updatedDebts = debts.filter(d => {
    if ((d.type || '').toLowerCase() === 'payable') {
      const matchOrderCode = d.order_code && cancelledCodes.has(String(d.order_code));
      const matchId = d.id && (cancelledCodes.has(String(d.id)) || cancelledCodes.has(String(d.id).replace(/^d_inb_|^d_/, '')));
      const matchNotes = d.notes && Array.from(cancelledCodes).some(code => code && d.notes.includes(code));
      if (matchOrderCode || matchId || matchNotes) {
        return false;
      }
    }
    return true;
  });

  inboundOrders.forEach(inb => {
    const status = (inb.status || '').toLowerCase();
    if (status !== 'received' && status !== 'completed' && status !== 'đã nhập kho') return;

    let items = inb.items;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (e) { items = []; }
    }
    if (!Array.isArray(items)) items = [];

    let totalAmt = Number(inb.total_amount) || 0;
    if (totalAmt === 0 && items.length > 0) {
      totalAmt = items.reduce((sum, it) => {
        const q = Number(it.received_qty) >= 0 ? Number(it.received_qty) : (Number(it.expected_qty) || 0);
        const c = Number(it.cost_price) || Number(it.unit_price) || 0;
        return sum + (q * c);
      }, 0);
    }

    if (totalAmt <= 0) return;

    const supplierName = inb.supplier_name || 'Nhà Cung Cấp';
    const code = inb.code || inb.id;

    // Check if debt already exists for this inbound order
    const existingIndex = updatedDebts.findIndex(d =>
      (d.order_code && (String(d.order_code) === String(code) || String(d.order_code) === String(inb.id))) ||
      (d.id && (String(d.id) === String(inb.id) || String(d.id) === 'd_' + String(inb.id) || String(d.id) === 'd_inb_' + String(inb.id))) ||
      (d.notes && code && d.notes.includes(code))
    );

    const paidAmt = Number(inb.paid_amount) || 0;
    const calcRemaining = Math.max(0, totalAmt - paidAmt);

    if (existingIndex !== -1) {
      updatedDebts[existingIndex].type = 'Payable';
      if (!updatedDebts[existingIndex].customer_name) {
        updatedDebts[existingIndex].customer_name = supplierName;
      }
      if (!updatedDebts[existingIndex].total_amount || updatedDebts[existingIndex].total_amount === 0) {
        updatedDebts[existingIndex].total_amount = totalAmt;
      }
      if (updatedDebts[existingIndex].remaining_amount === undefined || updatedDebts[existingIndex].remaining_amount === null) {
        updatedDebts[existingIndex].remaining_amount = calcRemaining;
      } else {
        updatedDebts[existingIndex].remaining_amount = Math.min(Number(updatedDebts[existingIndex].remaining_amount), calcRemaining);
      }
      if (Number(updatedDebts[existingIndex].remaining_amount) === 0) {
        updatedDebts[existingIndex].status = 'Paid';
      } else if (Number(updatedDebts[existingIndex].remaining_amount) < Number(updatedDebts[existingIndex].total_amount)) {
        updatedDebts[existingIndex].status = 'Partial';
      }
    } else {
      const custObj = (customers || []).find(c => c.name === supplierName);
      const custCode = custObj ? custObj.code : 'NCC-DEBT';
      const initialStatus = calcRemaining === 0 ? 'Paid' : (paidAmt > 0 ? 'Partial' : 'Unpaid');

      const synDebt = {
        id: 'd_inb_' + (inb.id || Date.now()),
        code: 'CN-TRA-' + (code ? String(code).replace(/^PR/i, '') : Math.floor(1000 + Math.random() * 9000)),
        customer_name: supplierName,
        customer_code: custCode,
        order_code: code,
        items: items,
        type: 'Payable',
        total_amount: totalAmt,
        remaining_amount: calcRemaining,
        due_date: inb.expected_date || (inb.received_at ? inb.received_at.slice(0, 10) : (inb.created_at ? inb.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10))),
        status: initialStatus,
        notes: `Nợ tiền hàng nhập kho từ đơn Inbound ${code}`,
        created_at: inb.received_at || inb.created_at || new Date().toISOString(),
        is_inbound: true
      };

      updatedDebts.unshift(synDebt);
    }
  });

  return updatedDebts;
}

function syncSalesOrdersToReceivableDebts(debts, orders, customers = []) {
  if (!Array.isArray(debts)) debts = [];
  if (!Array.isArray(orders)) return debts;

  const updatedDebts = [...debts];

  orders.forEach(order => {
    const debtAmt = Number(order.debt_amount);
    const customerName = order.customer_name || 'Khách Vãng Lai';
    const code = order.order_code || order.id;

    // Check if debt already exists for this sales order
    const existingIndex = updatedDebts.findIndex(d =>
      (d.order_code && (String(d.order_code) === String(code) || String(d.order_code) === String(order.id))) ||
      (d.order_id && (String(d.order_id) === String(order.id) || String(d.order_id) === 'o_' + String(order.id))) ||
      (d.id && (String(d.id) === 'd_ord_' + String(order.id) || String(d.id) === String(order.id))) ||
      (d.notes && code && d.notes.includes(code))
    );

    const paidAmt = Number(order.paid_amount) || 0;
    const finalAmt = Number(order.final_amount || order.total_amount) || debtAmt;

    if (existingIndex !== -1) {
      updatedDebts[existingIndex].type = 'Receivable';
      if (!updatedDebts[existingIndex].customer_name) {
        updatedDebts[existingIndex].customer_name = customerName;
      }
      if (!updatedDebts[existingIndex].total_amount || updatedDebts[existingIndex].total_amount === 0) {
        updatedDebts[existingIndex].total_amount = finalAmt;
      }
      if (updatedDebts[existingIndex].remaining_amount === undefined || updatedDebts[existingIndex].remaining_amount === null) {
        updatedDebts[existingIndex].remaining_amount = isNaN(debtAmt) ? 0 : debtAmt;
      } else if (!isNaN(debtAmt)) {
        updatedDebts[existingIndex].remaining_amount = Math.min(Number(updatedDebts[existingIndex].remaining_amount), debtAmt);
      }
      if (Number(updatedDebts[existingIndex].remaining_amount) === 0) {
        updatedDebts[existingIndex].status = 'Paid';
      } else if (Number(updatedDebts[existingIndex].remaining_amount) < Number(updatedDebts[existingIndex].total_amount)) {
        updatedDebts[existingIndex].status = 'Partial';
      }
    } else if (!isNaN(debtAmt) && debtAmt > 0) {
      const custObj = (customers || []).find(c => c.name === customerName);
      const custCode = custObj ? custObj.code : 'KH-DEBT';
      const initialStatus = paidAmt > 0 ? 'Partial' : 'Unpaid';

      const synDebt = {
        id: 'd_ord_' + (order.id || Date.now()),
        code: 'CN-PT-' + (code ? String(code).replace(/^HD/i, '') : Math.floor(1000 + Math.random() * 9000)),
        customer_name: customerName,
        customer_code: custCode,
        order_id: order.id,
        order_code: code,
        items: order.items || [],
        shipping_fee: Number(order.shipping_fee) || 0,
        delivery_method: order.delivery_method || 'Delivery',
        type: 'Receivable',
        total_amount: finalAmt,
        remaining_amount: debtAmt,
        due_date: order.created_at ? order.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        status: initialStatus,
        notes: `Ghi nhận công nợ đơn ${code}`,
        created_at: order.created_at || new Date().toISOString(),
        is_sales_order: true
      };

      updatedDebts.unshift(synDebt);
    }
  });

  return updatedDebts;
}
if (typeof window !== 'undefined') {
  window.syncInboundOrdersToPayableDebts = syncInboundOrdersToPayableDebts;
  window.syncSalesOrdersToReceivableDebts = syncSalesOrdersToReceivableDebts;
}

async function loadDebtsData() {
  if (!window.dbProvider) return;

  allDebts = await window.dbProvider.getDebts();
  allCustomers = await window.dbProvider.getCustomers();
  allOrders = await window.dbProvider.getOrders();
  if (typeof window.dbProvider.getInboundOrders === 'function') {
    allInboundOrders = await window.dbProvider.getInboundOrders();
  } else {
    allInboundOrders = [];
  }

  // Auto-sync completed/received inbound orders to Payable debts
  allDebts = syncInboundOrdersToPayableDebts(allDebts, allInboundOrders, allCustomers);

  // Auto-sync sales orders to Receivable debts
  allDebts = syncSalesOrdersToReceivableDebts(allDebts, allOrders, allCustomers);

  calculateDebtKpis();
  filterDebtsTable();
}

function calculateDebtKpis() {
  const receivables = allDebts
    .filter(d => (d.type || '').toLowerCase() === 'receivable')
    .reduce((sum, d) => sum + (Number(d.remaining_amount) || 0), 0);

  const payables = allDebts
    .filter(d => (d.type || '').toLowerCase() === 'payable')
    .reduce((sum, d) => sum + (Number(d.remaining_amount) || 0), 0);

  const today = new Date();
  const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const dueCount = allDebts.filter(d => {
    if (!d.due_date || Number(d.remaining_amount) === 0) return false;
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
    const debtType = (d.type || '').toLowerCase() === 'payable' ? 'Payable' : 'Receivable';
    const key = `${custName}___${debtType}`;

    if (!customerMap.has(key)) {
      const customerObj = allCustomers.find(c => c.name === custName);
      const code = customerObj ? customerObj.code : (debtType === 'Receivable' ? 'KH-DEBT' : 'NCC-DEBT');

      customerMap.set(key, {
        customer_name: custName,
        customer_code: code,
        type: debtType,
        total_amount: 0,
        remaining_amount: 0,
        voucher_count: 0,
        has_overdue: false,
        debts_list: []
      });
    }

    const group = customerMap.get(key);
    group.total_amount += (Number(d.total_amount) || 0);
    group.remaining_amount += (Number(d.remaining_amount) || 0);
    group.voucher_count += 1;
    group.debts_list.push(d);

    if (Number(d.remaining_amount) > 0 && d.due_date) {
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
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px;">Không tìm thấy dữ liệu công nợ nào phù hợp</td></tr>`;
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
            <button class="btn btn-warning" style="padding:4px 8px; font-size:0.75rem; background:#f59e0b; border-color:#d97706; color:#fff;" onclick="openDebtPeriodReconciliationModal('${c.customer_name.replace(/'/g, "\\'")}')" title="Xem bảng đối soát & chi tiết">
              <i class="bi bi-sliders2-vertical"></i> Đối Soát & Chi Tiết
            </button>
            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem; background:#475569; border-color:#334155; color:#fff;" onclick="openDirectPrintDebt('${c.customer_name.replace(/'/g, "\\'")}')" title="In Báo Cáo Công Nợ Khổ A4 Đứng">
              <i class="bi bi-printer-fill"></i> In Công Nợ
            </button>
            ${!isFullyPaid ? `
              <button class="btn ${isReceivable ? 'btn-primary' : 'btn-warning'}" style="padding:4px 8px; font-size:0.75rem;" onclick="openPaymentModalForCustomer('${c.customer_name.replace(/'/g, "\\'")}')">
                <i class="bi ${isReceivable ? 'bi-wallet2' : 'bi-cash-stack'}"></i> ${isReceivable ? 'Thu Nợ' : 'Chi Trả'}
              </button>
            ` : ''}
            <button class="btn btn-info" style="padding:4px 8px; font-size:0.75rem; background:hsl(215, 90%, 52%); border-color:hsl(215, 90%, 52%); color:#fff;" onclick="openCustomerPurchaseDetailModal('${c.customer_name.replace(/'/g, "\\'")}')">
              <i class="bi ${isReceivable ? 'bi-cart-check' : 'bi-truck'}"></i> ${isReceivable ? 'Xem Mua Hàng' : 'Xem Nhập Hàng'}
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

  const partnerObj = allCustomers.find(c => c.name === customerName);
  const isSupplier = (partnerObj && partnerObj.type === 'Supplier') || allDebts.some(d => d.customer_name === customerName && d.type === 'Payable');

  const titleElem = document.getElementById('purchase-modal-customer-name');
  if (titleElem) {
    titleElem.textContent = customerName + (isSupplier ? ' (Nhà Cung Cấp)' : '');
  }

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
  const formatYYYYMMDD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  if (preset === 'today') {
    startInput.value = formatYYYYMMDD(today);
    endInput.value = formatYYYYMMDD(today);
  } else if (preset === '7days') {
    const d7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    startInput.value = formatYYYYMMDD(d7);
    endInput.value = formatYYYYMMDD(today);
  } else if (preset === '14days') {
    const d14 = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    startInput.value = formatYYYYMMDD(d14);
    endInput.value = formatYYYYMMDD(today);
  } else if (preset === '21days') {
    const d21 = new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000);
    startInput.value = formatYYYYMMDD(d21);
    endInput.value = formatYYYYMMDD(today);
  } else if (preset === '30days') {
    const d30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    startInput.value = formatYYYYMMDD(d30);
    endInput.value = formatYYYYMMDD(today);
  } else if (preset === 'this_month') {
    const dMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    startInput.value = formatYYYYMMDD(dMonthStart);
    endInput.value = formatYYYYMMDD(today);
  } else if (preset === 'last_month') {
    const dLastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const dLastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    startInput.value = formatYYYYMMDD(dLastMonthStart);
    endInput.value = formatYYYYMMDD(dLastMonthEnd);
  } else if (preset === 'all') {
    startInput.value = '';
    endInput.value = '';
  }
}

function resetPurchaseModalFilters() {
  const presetSelect = document.getElementById('purchase-date-preset');
  const searchInput = document.getElementById('purchase-product-search');

  if (presetSelect) presetSelect.value = '21days';
  if (searchInput) searchInput.value = '';

  applyDatePresetToInputs('21days');
  filterPurchaseDetailsModal();
}

function filterPurchaseDetailsModal() {
  if (!currentDetailCustomerName) return;

  const partnerObj = allCustomers.find(c => c.name === currentDetailCustomerName);
  const isSupplier = (partnerObj && partnerObj.type === 'Supplier') || allDebts.some(d => d.customer_name === currentDetailCustomerName && d.type === 'Payable');

  const startVal = document.getElementById('purchase-date-start') ? document.getElementById('purchase-date-start').value : '';
  const endVal = document.getElementById('purchase-date-end') ? document.getElementById('purchase-date-end').value : '';
  const searchVal = document.getElementById('purchase-product-search') ? document.getElementById('purchase-product-search').value.toLowerCase().trim() : '';

  const startDate = startVal ? new Date(startVal + 'T00:00:00') : null;
  const endDate = endVal ? new Date(endVal + 'T23:59:59') : null;

  const orderGroups = [];

  if (isSupplier) {
    // Filter Inbound Orders for Supplier
    const supplierInbounds = allInboundOrders.filter(i => i.supplier_name === currentDetailCustomerName || (partnerObj && i.supplier_id === partnerObj.id));

    supplierInbounds.forEach(inbound => {
      const iDate = inbound.received_at ? new Date(inbound.received_at) : (inbound.created_at ? new Date(inbound.created_at) : null);
      if (iDate) {
        if (startDate && iDate < startDate) return;
        if (endDate && iDate > endDate) return;
      }

      const items = (inbound.items && inbound.items.length > 0) ? inbound.items : [
        { product_name: 'Phiếu nhập kho ' + inbound.code, expected_qty: 1, received_qty: 1, cost_price: inbound.total_amount || 0, subtotal: inbound.total_amount || 0 }
      ];

      const matchedItems = items.filter(item => {
        return !searchVal ||
          (item.product_name && item.product_name.toLowerCase().includes(searchVal)) ||
          (inbound.code && inbound.code.toLowerCase().includes(searchVal));
      });

      if (matchedItems.length > 0) {
        const isReceived = inbound.status === 'Received';
        const isCancelled = inbound.status === 'Cancelled';
        const statusBadge = `<span class="badge ${isReceived ? 'badge-success' : (isCancelled ? 'badge-danger' : 'badge-warning')}" style="font-size:0.75rem;">
          <i class="bi ${isReceived ? 'bi-box-seam-fill' : 'bi-clock'}"></i> ${isReceived ? 'Đã Nhận Kho' : (isCancelled ? 'Đã Hủy' : 'Đang Chờ')}
        </span>`;

        const childRows = matchedItems.map(item => {
          const qty = item.received_qty !== undefined ? item.received_qty : (item.expected_qty || 1);
          const price = item.cost_price || item.unit_price || 0;
          const subtotal = item.subtotal || (qty * price) || 0;
          return {
            product_name: item.product_name || 'Linh kiện / Sản phẩm',
            quantity: qty,
            unit_price: price,
            subtotal: subtotal,
            is_shipping_fee: false
          };
        });

        const totalOrderQty = childRows.reduce((sum, r) => sum + r.quantity, 0);
        const totalOrderAmt = childRows.reduce((sum, r) => sum + r.subtotal, 0);

        orderGroups.push({
          order_id: inbound.id,
          order_code: inbound.code,
          created_at: inbound.received_at || inbound.created_at,
          status: inbound.status || 'Received',
          is_inbound: true,
          statusBadge: statusBadge,
          payment_method: 'Debt',
          totalQty: totalOrderQty,
          totalAmount: totalOrderAmt,
          deduction: 0,
          remaining: totalOrderAmt,
          childItems: childRows
        });
      }
    });
  } else {
    // Get sales orders for Customer
    const customerOrders = allOrders.filter(o => o.customer_name === currentDetailCustomerName);

    customerOrders.forEach(order => {
      if (order.created_at) {
        const oDate = new Date(order.created_at);
        if (startDate && oDate < startDate) return;
        if (endDate && oDate > endDate) return;
      }

      const items = order.items && order.items.length > 0 ? order.items : [
        { product_name: 'Chi tiết đơn hàng ' + order.order_code, quantity: 1, unit_price: order.final_amount, subtotal: order.final_amount }
      ];

      const hasShippingSubItem = items.some(i => i.is_shipping_fee || (i.product_sku && (i.product_sku === 'PVC' || i.product_sku.startsWith('PVC-'))) || (i.product_name && i.product_name.includes('Phí vận chuyển')));
      const prodItemsOnly = hasShippingSubItem ? items.filter(i => !(i.is_shipping_fee || (i.product_sku && (i.product_sku === 'PVC' || i.product_sku.startsWith('PVC-'))) || (i.product_name && i.product_name.includes('Phí vận chuyển')))) : items;
      const shipItemsOnly = hasShippingSubItem ? items.filter(i => i.is_shipping_fee || (i.product_sku && (i.product_sku === 'PVC' || i.product_sku.startsWith('PVC-'))) || (i.product_name && i.product_name.includes('Phí vận chuyển'))) : [];

      const orderShipFee = shipItemsOnly.length > 0 ? shipItemsOnly.reduce((sum, s) => sum + (s.subtotal || s.unit_price || 0), 0) : (Number(order.shipping_fee) || 0);

      const matchedProdItems = prodItemsOnly.filter(item => {
        return !searchVal ||
          (item.product_name && item.product_name.toLowerCase().includes(searchVal)) ||
          'phí vận chuyển'.includes(searchVal) ||
          (order.order_code && order.order_code.toLowerCase().includes(searchVal));
      });

      if (matchedProdItems.length > 0) {
        const isPaidUpfront = order.payment_method === 'Bank' || order.payment_method === 'Cash';
        const statusBadge = `<span class="badge ${order.payment_method === 'Debt' ? 'badge-warning' : 'badge-info'}" style="font-size:0.75rem;">
          ${order.payment_method === 'Debt' ? 'Ghi Nợ' : (order.payment_method === 'Bank' ? 'Chuyển Khoản' : 'Tiền Mặt')}
        </span>`;

        const categoryRates = typeof getCategoryShippingRates === 'function' ? getCategoryShippingRates() : {};

        const prodItemShipRates = matchedProdItems.map(item => {
          const cat = item.category || 'Khác';
          const rate = categoryRates[cat] !== undefined ? categoryRates[cat] : (categoryRates['Khác'] !== undefined ? categoryRates['Khác'] : 20000);
          const qty = item.quantity || 1;
          return { cat, rate, totalRate: qty * rate, qty };
        });
        const totalProdItemShipRates = prodItemShipRates.reduce((sum, r) => sum + r.totalRate, 0);

        const childRows = [];
        matchedProdItems.forEach((item, idx) => {
          const qty = item.quantity || 1;
          const price = item.unit_price || 0;
          const subtotal = item.subtotal || (qty * price) || 0;
          const ded = isPaidUpfront ? subtotal : 0;

          // 1. Dòng sản phẩm
          childRows.push({
            product_name: item.product_name,
            quantity: qty,
            unit_price: price,
            subtotal: subtotal,
            deduction: ded,
            remaining: subtotal - ded,
            is_shipping_fee: false
          });

          // 2. Dòng phí vận chuyển RIÊNG của sản phẩm này
          if (orderShipFee > 0) {
            let itemShipFee = 0;
            const matchedShip = shipItemsOnly.find(s => (s.product_name && s.product_name.includes(item.product_name)));
            if (matchedShip) {
              itemShipFee = matchedShip.subtotal || matchedShip.unit_price || 0;
            } else if (matchedProdItems.length === 1) {
              itemShipFee = orderShipFee;
            } else if (totalProdItemShipRates > 0) {
              itemShipFee = Math.round((prodItemShipRates[idx].totalRate / totalProdItemShipRates) * orderShipFee);
            } else {
              itemShipFee = Math.round(orderShipFee / matchedProdItems.length);
            }

            if (itemShipFee > 0) {
              const shipDed = isPaidUpfront ? itemShipFee : 0;
              childRows.push({
                product_name: `Phí vận chuyển - ${item.product_name}`,
                quantity: qty,
                unit_price: Math.round(itemShipFee / qty),
                subtotal: itemShipFee,
                deduction: shipDed,
                remaining: itemShipFee - shipDed,
                is_shipping_fee: true
              });
            }
          }
        });

        const totalOrderQty = childRows.filter(r => !r.is_shipping_fee).reduce((sum, r) => sum + r.quantity, 0);
        const totalOrderAmt = childRows.reduce((sum, r) => sum + r.subtotal, 0);
        const totalOrderDed = isPaidUpfront ? totalOrderAmt : 0;
        const totalOrderRemaining = totalOrderAmt - totalOrderDed;

        orderGroups.push({
          order_id: order.id,
          order_code: order.order_code,
          created_at: order.created_at,
          status: 'Completed',
          is_inbound: false,
          statusBadge: statusBadge,
          payment_method: order.payment_method || 'Bank',
          totalQty: totalOrderQty,
          totalAmount: totalOrderAmt,
          deduction: totalOrderDed,
          remaining: totalOrderRemaining,
          childItems: childRows
        });
      }
    });
  }

  // Calculate Modal KPIs
  const activeOrderGroups = orderGroups.filter(g => g.status !== 'Cancelled' && g.status !== 'Đã hủy');
  const uniqueOrderCodes = activeOrderGroups.length;
  const totalQty = activeOrderGroups.reduce((sum, g) => sum + g.totalQty, 0);
  const totalAmount = activeOrderGroups.reduce((sum, g) => sum + g.totalAmount, 0);

  const orderCountElem = document.getElementById('purchase-kpi-order-count');
  const qtyCountElem = document.getElementById('purchase-kpi-qty-count');
  const amountElem = document.getElementById('purchase-kpi-total-amount');

  if (orderCountElem) orderCountElem.textContent = uniqueOrderCodes;
  if (qtyCountElem) qtyCountElem.textContent = totalQty;
  if (amountElem) amountElem.textContent = formatVND(totalAmount);

  // Render Table
  const tbody = document.getElementById('purchase-modal-tbody');
  if (!tbody) return;

  if (orderGroups.length === 0) {
    let filterTimeText = '';
    if (startVal || endVal) {
      filterTimeText = `trong khoảng thời gian từ ${startVal || 'đầu'} đến ${endVal || 'hiện tại'}`;
    }
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center; padding:30px; color:var(--text-muted);">
          <i class="bi bi-info-circle" style="font-size:1.5rem; display:block; margin-bottom:6px; color:var(--info);"></i>
          Không tìm thấy ${isSupplier ? 'đơn nhập kho Inbound' : 'đơn hàng / sản phẩm'} nào ${filterTimeText} phù hợp với từ khóa tìm kiếm.
        </td>
      </tr>
    `;
    return;
  }

  let htmlRows = '';
  orderGroups.forEach((group, gIdx) => {
    const prodItemsCount = group.childItems.filter(c => !c.is_shipping_fee).length;
    const hasShipping = group.childItems.some(c => c.is_shipping_fee);

    // Group Summary Header Row (Dòng tổng đặt PHÍA TRÊN)
    htmlRows += `
      <tr style="background:#f1f5f9; border-top:2px solid #cbd5e1; border-bottom:1px solid #cbd5e1; font-weight:700; color:#0f172a;">
        <td style="text-align:center; font-weight:800; background:#e2e8f0;">${gIdx + 1}</td>
        <td style="font-size:0.82rem; font-weight:600; white-space:nowrap;">${formatDate(group.created_at)}</td>
        <td><code style="font-weight:700; background:#e2e8f0; color:#0f172a; padding:2px 6px; border-radius:4px; border:1px solid #cbd5e1;">${group.order_code}</code></td>
        <td>
          <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <i class="bi ${group.is_inbound ? 'bi-box-seam-fill' : 'bi-folder2-open'} text-primary" style="font-size:1rem;"></i>
              <strong style="color:var(--primary);">${group.is_inbound ? 'Phiếu Nhập ' + group.order_code : 'Đơn Hàng ' + group.order_code}</strong>
            </div>
            <span style="font-size:0.75rem; background:#dbeafe; color:#1e40af; padding:2px 8px; border-radius:9999px; font-weight:600; white-space:nowrap;">
              ${prodItemsCount} sản phẩm${hasShipping ? ' + Phí VC' : ''}
            </span>
          </div>
        </td>
        <td style="font-weight:800; text-align:center; color:#0f172a;">${group.totalQty}</td>
        <td style="text-align:right; color:#64748b;">-</td>
        <td style="font-weight:800; text-align:right; font-size:0.95rem; color:#0f172a;">${formatVND(group.totalAmount)}</td>
        <td style="font-weight:800; text-align:right; color:var(--success);">${group.deduction > 0 ? '-' + formatVND(group.deduction) : '0 ₫'}</td>
        <td style="font-weight:800; text-align:right; font-size:0.95rem; color:${group.remaining > 0 ? 'var(--danger)' : 'var(--success)'};">${formatVND(group.remaining)}</td>
        <td style="text-align:center;">${group.statusBadge}</td>
      </tr>
    `;

    // Child Rows (Từng sản phẩm và Phí vận chuyển đặt BÊN DƯỚI dòng tổng)
    group.childItems.forEach(child => {
      htmlRows += `
        <tr style="${child.is_shipping_fee ? 'background:#f0f9ff; color:#0369a1;' : 'background:#ffffff; color:#334155;'}">
          <td style="text-align:center; color:#94a3b8; font-size:0.8rem;"><i class="bi bi-arrow-return-right"></i></td>
          <td style="color:#94a3b8; font-size:0.75rem; text-align:center;">-</td>
          <td style="color:#94a3b8; font-size:0.75rem;">-</td>
          <td style="padding-left:24px; font-weight:${child.is_shipping_fee ? '600' : '500'};">
            ${child.is_shipping_fee ? '<i class="bi bi-truck text-info" style="margin-right:4px;"></i> ' + child.product_name : '<i class="bi bi-box-seam text-secondary" style="font-size:0.8rem; margin-right:4px;"></i> ' + child.product_name}
          </td>
          <td style="text-align:center; font-weight:600;">${child.quantity}</td>
          <td style="text-align:right; color:#64748b; font-size:0.85rem;">${formatVND(child.unit_price)}</td>
          <td style="text-align:right; font-weight:600; color:#334155;">${formatVND(child.subtotal)}</td>
          <td style="text-align:right; color:var(--success); font-size:0.82rem;">${child.deduction > 0 ? '-' + formatVND(child.deduction) : '-'}</td>
          <td style="text-align:right; color:#94a3b8;">-</td>
          <td style="text-align:center; font-size:0.75rem; color:#64748b;">${child.is_shipping_fee ? 'Vận chuyển' : 'Sản phẩm'}</td>
        </tr>
      `;
    });
  });

  tbody.innerHTML = htmlRows;
}

/* ================= =======================================
   PAYMENT MODAL FOR CUSTOMER & SUPPLIER DEBT (PARTIAL & FULL)
   ======================================================= */

function openPaymentModalForCustomer(customerName) {
  const customerDebts = allDebts.filter(d => d.customer_name === customerName && Number(d.remaining_amount) > 0);

  if (customerDebts.length === 0) {
    showToast(`Đối tác ${customerName} hiện đã thanh toán hết nợ!`, 'info');
    return;
  }

  const partnerObj = allCustomers.find(c => c.name === customerName);
  const isSupplier = (partnerObj && partnerObj.type === 'Supplier') || customerDebts.some(d => d.type === 'Payable');

  // Dynamic Modal Header and Labels
  const modalTitleElem = document.getElementById('pay-modal-title');
  const partnerNameLabelElem = document.getElementById('pay-partner-name-label');
  const voucherSelectLabelElem = document.getElementById('pay-voucher-select-label');
  const remainingLabelElem = document.getElementById('pay-remaining-label');
  const amountLabelElem = document.getElementById('pay-amount-label');
  const previewLabelElem = document.getElementById('calc-preview-label');
  const submitBtnTextElem = document.getElementById('pay-submit-btn-text');

  if (modalTitleElem) {
    modalTitleElem.innerHTML = isSupplier
      ? `<i class="bi bi-cash-stack text-warning"></i> Chi Trả Công Nợ Nhà Cung Cấp (Toàn Bộ / 1 Phần)`
      : `<i class="bi bi-wallet2 text-primary"></i> Thu Tiền Công Nợ Khách Hàng (Toàn Bộ / 1 Phần)`;
  }
  if (partnerNameLabelElem) partnerNameLabelElem.textContent = isSupplier ? 'Tên Nhà Cung Cấp' : 'Tên Khách Hàng';
  if (voucherSelectLabelElem) voucherSelectLabelElem.textContent = isSupplier ? 'Phạm Vi Chi Trả / Phiếu Nhập Nợ' : 'Phạm Vi Thu Nợ / Phiếu Đơn Hàng';
  if (remainingLabelElem) remainingLabelElem.textContent = isSupplier ? 'Số Tiền Nợ Nhà Cung Cấp Hiện Tại' : 'Số Tiền Khách Còn Nợ Hiện Tại';
  if (amountLabelElem) amountLabelElem.textContent = isSupplier ? 'Số Tiền Chi Trả Lần Này (VNĐ)' : 'Số Tiền Thu Lần Này (VNĐ)';
  if (previewLabelElem) previewLabelElem.textContent = isSupplier ? 'Dư nợ NCC còn lại sau chi trả:' : 'Dư nợ KH còn lại sau thu tiền:';
  if (submitBtnTextElem) submitBtnTextElem.textContent = isSupplier ? 'Xác Nhận Chi Trả NCC' : 'Xác Nhận Thu Tiền KH';

  document.getElementById('pay-customer-name-hidden').value = customerName;
  document.getElementById('pay-partner-name').value = customerName + (isSupplier ? ' (Nhà Cung Cấp)' : '');

  const selectGroup = document.getElementById('pay-voucher-select-group');
  const selectElem = document.getElementById('pay-voucher-select');

  const totalRemaining = customerDebts.reduce((sum, d) => sum + (Number(d.remaining_amount) || 0), 0);

  if (selectGroup && selectElem) {
    selectGroup.style.display = 'block';

    let optionsHtml = '';
    if (customerDebts.length > 1) {
      optionsHtml += `<option value="AUTO" selected>⚡ Tự động phân bổ cho phiếu cũ nhất (Tổng dư nợ: ${formatVND(totalRemaining)})</option>`;
    }

    optionsHtml += customerDebts.map(d => `
      <option value="${d.id}">Phiếu ${d.code} - ${d.type === 'Payable' ? 'Nợ NCC' : 'Nợ KH'}: ${formatVND(d.remaining_amount)} (Hạn: ${formatDate(d.due_date)})</option>
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
  const customerDebts = allDebts.filter(d => d.customer_name === customerName && Number(d.remaining_amount) > 0);

  const partnerObj = allCustomers.find(c => c.name === customerName);
  const isSupplier = (partnerObj && partnerObj.type === 'Supplier') || customerDebts.some(d => d.type === 'Payable');

  let maxDebt = 0;
  if (debtId === 'AUTO') {
    maxDebt = customerDebts.reduce((sum, d) => sum + (Number(d.remaining_amount) || 0), 0);
    document.getElementById('pay-debt-id').value = 'AUTO';
    document.getElementById('pay-remaining-amount').value = formatVND(maxDebt);
    document.getElementById('pay-note-input').value = isSupplier ? `Chi trả công nợ cho nhà cung cấp ${customerName}` : `Thu tiền công nợ từ khách hàng ${customerName}`;
  } else {
    const debt = customerDebts.find(d => String(d.id) === String(debtId)) || customerDebts[0];
    if (debt) {
      maxDebt = Number(debt.remaining_amount) || 0;
      document.getElementById('pay-debt-id').value = debt.id;
      document.getElementById('pay-remaining-amount').value = formatVND(maxDebt);
      document.getElementById('pay-note-input').value = isSupplier ? `Chi trả khoản nợ ${debt.code} cho ${customerName}` : `Thu tiền khoản nợ ${debt.code} của ${customerName}`;
    }
  }

  document.getElementById('pay-max-debt-raw').value = maxDebt;
  document.getElementById('pay-amount-input').value = formatNumberWithDots(maxDebt);

  updatePaymentCalculationSummary();
}

function setQuickPaymentPercent(fraction) {
  const maxDebt = parseFloat(document.getElementById('pay-max-debt-raw').value) || 0;
  const targetAmount = Math.round(maxDebt * fraction);
  const payAmountInput = document.getElementById('pay-amount-input');
  if (payAmountInput) {
    payAmountInput.value = formatNumberWithDots(targetAmount);
  }
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
    showToast(`Số tiền thanh toán (${formatVND(amount)}) không được vượt quá dư nợ hiện tại (${formatVND(maxDebt)})!`, 'warning');
    return;
  }

  const partnerObj = allCustomers.find(c => c.name === customerName);
  const isSupplier = (partnerObj && partnerObj.type === 'Supplier') || allDebts.some(d => d.customer_name === customerName && d.type === 'Payable');

  await window.dbProvider.addDebtPayment(debtId, amount, method, note, customerName);

  const isPartial = amount < maxDebt;
  let toastMsg = '';
  if (isSupplier) {
    toastMsg = isPartial
      ? `Đã ghi nhận chi trả 1 phần nợ cho nhà cung cấp (${formatVND(amount)}) thành công!`
      : 'Đã hoàn tất chi trả 100% nợ nhà cung cấp thành công!';
  } else {
    toastMsg = isPartial
      ? `Đã ghi nhận thu 1 phần công nợ từ khách hàng (${formatVND(amount)}) thành công!`
      : 'Đã hoàn tất thu 100% công nợ khách hàng thành công!';
  }

  showToast(toastMsg, 'success');

  closeModal('debt-payment-modal');
  await loadDebtsData();
}

/* =======================================================
   PRINTABLE DEBT HISTORY LEDGER FOR CUSTOMER (BẢNG ĐỐI SOÁT & LỊCH SỬ CÔNG NỢ)
   ======================================================= */

async function openDebtHistoryModalForCustomer(customerName) {
  // Delegate to unified period & detail reconciliation modal with 'all' time preset
  return openDebtPeriodReconciliationModal(customerName, 'all');
}

function openNewDebtModal() {
  const typeSelect = document.getElementById('new-debt-type');
  if (typeSelect) typeSelect.value = 'Receivable';

  const codeInput = document.getElementById('new-debt-voucher-code');
  if (codeInput) codeInput.value = '';

  const amountInput = document.getElementById('new-debt-amount');
  if (amountInput) amountInput.value = '';

  const notesInput = document.getElementById('new-debt-notes');
  if (notesInput) notesInput.value = '';

  const dueDateInput = document.getElementById('new-debt-due-date');
  if (dueDateInput) {
    const d30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    dueDateInput.value = d30.toISOString().slice(0, 10);
  }

  onNewDebtTypeChange();
  openModal('create-new-debt-modal');
}

function onNewDebtTypeChange() {
  const typeSelect = document.getElementById('new-debt-type');
  const type = typeSelect ? typeSelect.value : 'Receivable';
  const partnerLabel = document.getElementById('new-debt-partner-label');
  const partnerSelect = document.getElementById('new-debt-partner-select');
  const inboundGroup = document.getElementById('new-debt-inbound-group');
  const inboundSelect = document.getElementById('new-debt-inbound-select');

  if (type === 'Payable') {
    if (partnerLabel) partnerLabel.textContent = 'Tên Đối Tác (Nhà Cung Cấp)';

    // Filter Suppliers
    const suppliers = allCustomers.filter(c => c.type === 'Supplier');
    let supplierOptions = suppliers.map(s => `<option value="${s.name}">${s.code} - ${s.name}</option>`).join('');
    if (suppliers.length === 0) {
      supplierOptions = `<option value="Tổng Kho Linh Kiện Nam Sài Gòn">NCC01 - Tổng Kho Linh Kiện Nam Sài Gòn</option>`;
    }
    if (partnerSelect) partnerSelect.innerHTML = supplierOptions;

    if (inboundGroup) inboundGroup.style.display = 'block';

    // Populate Inbound select
    const selectedSupplier = partnerSelect ? partnerSelect.value : '';
    const supplierInbounds = allInboundOrders.filter(i => i.supplier_name === selectedSupplier || i.status === 'Received' || i.status === 'Pending');

    let inboundOpts = `<option value="">-- Chọn phiếu nhập kho Inbound (Tùy chọn) --</option>`;
    inboundOpts += supplierInbounds.map(i => `<option value="${i.code}">Phiếu: ${i.code} - Giá trị: ${formatVND(i.total_amount || 0)} (${formatDate(i.created_at)})</option>`).join('');
    if (inboundSelect) inboundSelect.innerHTML = inboundOpts;

  } else {
    if (partnerLabel) partnerLabel.textContent = 'Tên Đối Tác (Khách Hàng)';

    // Filter Customers
    const customers = allCustomers.filter(c => c.type !== 'Supplier');
    let custOptions = customers.map(c => `<option value="${c.name}">${c.code} - ${c.name}</option>`).join('');
    if (partnerSelect) partnerSelect.innerHTML = custOptions;

    if (inboundGroup) inboundGroup.style.display = 'none';
  }
}

function onNewDebtInboundSelectChange() {
  const inboundSelect = document.getElementById('new-debt-inbound-select');
  if (!inboundSelect) return;
  const inboundCode = inboundSelect.value;
  if (!inboundCode) return;

  const inboundObj = allInboundOrders.find(i => i.code === inboundCode);
  if (inboundObj) {
    const codeInput = document.getElementById('new-debt-voucher-code');
    const amountInput = document.getElementById('new-debt-amount');
    const notesInput = document.getElementById('new-debt-notes');

    if (codeInput) codeInput.value = inboundObj.code;
    if (amountInput) amountInput.value = formatNumberWithDots(inboundObj.total_amount || 0);
    if (notesInput) notesInput.value = `Nợ tiền hàng nhập kho từ đơn Inbound ${inboundObj.code}`;
  }
}

async function submitCreateNewDebt() {
  const typeSelect = document.getElementById('new-debt-type');
  const type = typeSelect ? typeSelect.value : 'Receivable';
  const partnerSelect = document.getElementById('new-debt-partner-select');
  const partnerName = partnerSelect ? partnerSelect.value : '';
  const voucherCode = document.getElementById('new-debt-voucher-code').value.trim();
  const amount = parseFormattedNumber(document.getElementById('new-debt-amount').value);
  const dueDate = document.getElementById('new-debt-due-date').value;
  const notes = document.getElementById('new-debt-notes').value.trim();

  if (!partnerName) {
    showToast('Vui lòng chọn đối tác!', 'warning');
    return;
  }

  if (amount <= 0) {
    showToast('Vui lòng nhập số tiền công nợ hợp lệ!', 'warning');
    return;
  }

  const isReceivable = type === 'Receivable';
  const prefix = isReceivable ? 'CN-PT-' : 'CN-TRA-';
  const code = voucherCode || (prefix + Math.floor(100 + Math.random() * 900));

  const newDebtObj = {
    id: 'd_' + Date.now(),
    code: code,
    customer_name: partnerName,
    order_code: voucherCode || code,
    type: type,
    total_amount: amount,
    remaining_amount: amount,
    due_date: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'Unpaid',
    notes: notes || (isReceivable ? `Ghi nhận công nợ đơn ${code}` : `Nợ tiền hàng nhập đơn ${code}`),
    created_at: new Date().toISOString()
  };

  // Add to local database / provider
  const db = window.dbProvider.getLocalStorageDb();
  if (!db.debts) db.debts = [];
  db.debts.unshift(newDebtObj);

  // Update customer / supplier current_debt
  const cust = db.customers.find(c => c.name === partnerName);
  if (cust) {
    cust.current_debt = (Number(cust.current_debt) || 0) + amount;
  }

  window.dbProvider.saveLocalStorageDb(db);

  if (window.dbProvider.isLiveMode) {
    try {
      const payload = prepareSupabasePayload({
        code: newDebtObj.code,
        customer_name: newDebtObj.customer_name,
        order_code: newDebtObj.order_code,
        type: newDebtObj.type,
        total_amount: newDebtObj.total_amount,
        remaining_amount: newDebtObj.remaining_amount,
        due_date: newDebtObj.due_date,
        status: newDebtObj.status,
        notes: newDebtObj.notes,
        created_at: newDebtObj.created_at
      });
      await window.dbProvider.supabase.from('debts').insert([payload]);
    } catch (e) {
      console.error('Supabase create debt error:', e);
    }
  }

  showToast(`Đã ghi nhận công nợ ${isReceivable ? 'phải thu' : 'phải trả (Inbound)'} thành công!`, 'success');
  closeModal('create-new-debt-modal');
  await loadDebtsData();
}

/* =======================================================
   UNIFIED PERIOD DEBT RECONCILIATION & PRODUCT ITEMS MODULE
   (BẢNG ĐỐI SOÁT & CHI TIẾT CÔNG NỢ THEO GIAI ĐOẠN)
   ======================================================= */

let currentReconcileCustomerName = '';
let currentReconcileDataCache = null;

async function openDebtPeriodReconciliationModal(customerName, defaultPreset = '21days') {
  currentReconcileCustomerName = customerName;

  const partnerObj = allCustomers.find(c => c.name === customerName);
  const isSupplier = (partnerObj && partnerObj.type === 'Supplier') || allDebts.some(d => d.customer_name === customerName && d.type === 'Payable');

  const titleElem = document.getElementById('reconcile-modal-customer-name');
  if (titleElem) {
    titleElem.textContent = customerName + (isSupplier ? ' (Nhà Cung Cấp)' : ' (Khách Hàng)');
  }

  // Set preset
  const presetSelect = document.getElementById('reconcile-period-preset');
  if (presetSelect) presetSelect.value = defaultPreset;

  applyReconciliationPresetToInputs(defaultPreset);
  await filterDebtReconciliationModal();

  openModal('debt-period-reconciliation-modal');
}

function handleReconciliationPresetChange() {
  const presetSelect = document.getElementById('reconcile-period-preset');
  if (!presetSelect) return;

  const preset = presetSelect.value;
  if (preset !== 'custom') {
    applyReconciliationPresetToInputs(preset, 'reconcile');
  }
  filterDebtReconciliationModal();
}

function handlePrintPresetChange() {
  const presetSelect = document.getElementById('print-period-preset');
  if (!presetSelect) return;

  const preset = presetSelect.value;
  if (preset !== 'custom') {
    applyReconciliationPresetToInputs(preset, 'print');
  }
  filterPrintModalData();
}

function applyReconciliationPresetToInputs(preset, prefix = 'reconcile') {
  const startInput = document.getElementById(`${prefix}-date-start`);
  const endInput = document.getElementById(`${prefix}-date-end`);
  if (!startInput || !endInput) return;

  const today = new Date();
  const formatYYYYMMDD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  if (preset === '7days') {
    const d7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    startInput.value = formatYYYYMMDD(d7);
    endInput.value = formatYYYYMMDD(today);
  } else if (preset === '14days') {
    const d14 = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    startInput.value = formatYYYYMMDD(d14);
    endInput.value = formatYYYYMMDD(today);
  } else if (preset === '21days') {
    const d21 = new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000);
    startInput.value = formatYYYYMMDD(d21);
    endInput.value = formatYYYYMMDD(today);
  } else if (preset === '30days') {
    const d30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    startInput.value = formatYYYYMMDD(d30);
    endInput.value = formatYYYYMMDD(today);
  } else if (preset === 'this_month') {
    const dMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    startInput.value = formatYYYYMMDD(dMonthStart);
    endInput.value = formatYYYYMMDD(today);
  } else if (preset === 'last_month') {
    const dLastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const dLastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    startInput.value = formatYYYYMMDD(dLastMonthStart);
    endInput.value = formatYYYYMMDD(dLastMonthEnd);
  } else if (preset === 'all') {
    startInput.value = '';
    endInput.value = '';
  }
}

async function filterPrintModalData() {
  if (!currentReconcileCustomerName) return;

  const printStart = document.getElementById('print-date-start')?.value || '';
  const printEnd = document.getElementById('print-date-end')?.value || '';
  const printSearch = document.getElementById('print-search-input')?.value || '';
  const printItemsToggle = document.getElementById('print-show-items-toggle')?.checked ?? true;

  // Sync to reconcile controls
  const recStart = document.getElementById('reconcile-date-start');
  const recEnd = document.getElementById('reconcile-date-end');
  const recSearch = document.getElementById('reconcile-search-input');
  const recToggle = document.getElementById('reconcile-show-items-toggle');
  if (recStart) recStart.value = printStart;
  if (recEnd) recEnd.value = printEnd;
  if (recSearch) recSearch.value = printSearch;
  if (recToggle) recToggle.checked = printItemsToggle;

  await filterDebtReconciliationModal();
  printDebtReconciliationStatement();
}

function resetPrintModalFilters() {
  const presetSelect = document.getElementById('print-period-preset');
  if (presetSelect) presetSelect.value = '21days';

  const searchInput = document.getElementById('print-search-input');
  if (searchInput) searchInput.value = '';

  const itemsToggle = document.getElementById('print-show-items-toggle');
  if (itemsToggle) itemsToggle.checked = true;

  applyReconciliationPresetToInputs('21days', 'print');
  filterPrintModalData();
}

function resetReconciliationModalFilters() {
  const presetSelect = document.getElementById('reconcile-period-preset');
  if (presetSelect) presetSelect.value = '21days';

  const searchInput = document.getElementById('reconcile-search-input');
  if (searchInput) searchInput.value = '';

  const itemsToggle = document.getElementById('reconcile-show-items-toggle');
  if (itemsToggle) itemsToggle.checked = true;

  applyReconciliationPresetToInputs('21days', 'reconcile');
  filterDebtReconciliationModal();
}

async function filterDebtReconciliationModal() {
  if (!currentReconcileCustomerName) return;

  const startVal = document.getElementById('reconcile-date-start') ? document.getElementById('reconcile-date-start').value : '';
  const endVal = document.getElementById('reconcile-date-end') ? document.getElementById('reconcile-date-end').value : '';
  const searchQuery = (document.getElementById('reconcile-search-input')?.value || '').trim().toLowerCase();
  const showItemsToggle = document.getElementById('reconcile-show-items-toggle')?.checked ?? true;

  const startDate = startVal ? new Date(startVal + 'T00:00:00') : null;
  const endDate = endVal ? new Date(endVal + 'T23:59:59') : null;

  // Gather partner complete history
  const historyData = await window.dbProvider.getCustomerHistory(currentReconcileCustomerName);
  const products = await window.dbProvider.getProducts();
  const debts = allDebts.filter(d => d.customer_name === currentReconcileCustomerName);
  const partnerObj = allCustomers.find(c => c.name === currentReconcileCustomerName);
  const isSupplier = (partnerObj && partnerObj.type === 'Supplier') || debts.some(d => d.customer_name === currentReconcileCustomerName && d.type === 'Payable');

  const orders = historyData ? (historyData.orders || []) : allOrders.filter(o => o.customer_name === currentReconcileCustomerName);
  const inbounds = historyData ? (historyData.inbounds || []) : allInboundOrders.filter(i => i.supplier_name === currentReconcileCustomerName);
  const payments = historyData ? (historyData.payments || []) : [];
  const returns = historyData ? (historyData.returns || []) : [];

  let openingDebt = 0;
  let openingCredit = 0;

  const inPeriodItems = [];

  // Helper to build child items from items and shipping
  function buildChildItemsForTransaction(d, matchedOrder, matchedInbound, debtIdx) {
    const orderCode = matchedOrder ? matchedOrder.order_code : (matchedInbound ? matchedInbound.code : (d.code || 'PXN-' + d.id));
    const matchedPm = matchedOrder ? matchedOrder.payment_method : (matchedInbound ? matchedInbound.payment_method : '');

    let pmLabel = '';
    if (matchedPm === 'Bank' || (d.notes && (d.notes.includes('Chuyển Khoản') || d.notes.includes('CK')))) {
      pmLabel = 'Chuyển Khoản';
    } else if (matchedPm === 'Cash' || (d.notes && (d.notes.includes('Tiền Mặt') || d.notes.includes('TM')))) {
      pmLabel = 'Tiền Mặt';
    } else if (matchedPm === 'Debt' || (d.notes && (d.notes.includes('Ghi Nợ') || d.notes.includes('công nợ')))) {
      pmLabel = 'Ghi Nợ';
    }

    const hasSeparatePayment = payments.some(p => (orderCode && (p.order_code === orderCode || (p.note && p.note.includes(orderCode)))) || (p.debt_id && d && p.debt_id === d.id));
    const isPaidUpfront = (pmLabel === 'Chuyển Khoản' || pmLabel === 'Tiền Mặt') && !hasSeparatePayment;

    let debtNote = '';
    if (orderCode) {
      if (pmLabel === 'Chuyển Khoản' || pmLabel === 'Tiền Mặt') {
        debtNote = `Đơn hàng ${orderCode} (${pmLabel})`;
      } else {
        debtNote = d.type === 'Payable' ? `Nợ tiền hàng đơn ${orderCode}` : `Ghi nhận công nợ đơn ${orderCode}`;
      }
    } else {
      debtNote = d.notes || d.code || '';
    }

    let shippingFee = 0;
    const delMethod = String(d.delivery_method || (matchedOrder ? matchedOrder.delivery_method : '') || '').toLowerCase();
    const isPickup = delMethod.includes('pickup') || delMethod.includes('tự nhận') || delMethod.includes('nhận tại kho');

    let items = (d.items && d.items.length > 0) ? d.items : (matchedInbound && matchedInbound.items && matchedInbound.items.length > 0 ? matchedInbound.items : (matchedOrder && matchedOrder.items && matchedOrder.items.length > 0 ? matchedOrder.items : null));

    if (!isPickup && (d.type === 'Receivable' || (d.type !== 'Payable' && matchedOrder))) {
      if (d.shipping_fee !== undefined && d.shipping_fee !== null) {
        shippingFee = Number(d.shipping_fee);
      } else if (matchedOrder && matchedOrder.shipping_fee !== undefined && matchedOrder.shipping_fee !== null) {
        shippingFee = Number(matchedOrder.shipping_fee);
      } else if (matchedOrder && Number(matchedOrder.final_amount) > Number(matchedOrder.total_amount) && Number(matchedOrder.total_amount) > 0) {
        shippingFee = Number(matchedOrder.final_amount) - Number(matchedOrder.total_amount);
      } else if (delMethod.includes('delivery') || delMethod.includes('giao')) {
        if (items && items.length > 0 && typeof getCategoryShippingRates === 'function') {
          const rates = getCategoryShippingRates();
          const calculatedFee = items.reduce((sum, item) => {
            const prod = products.find(p => p.id === item.product_id || p.name === item.product_name || p.sku === item.product_sku);
            const cat = prod ? (prod.category || 'Khác') : 'Khác';
            const rate = rates[cat] !== undefined ? rates[cat] : (rates['Khác'] !== undefined ? rates['Khác'] : 20000);
            const qty = item.quantity || item.received_qty || 1;
            return sum + (qty * rate);
          }, 0);

          if (calculatedFee > 0 && calculatedFee < (d.total_amount || 0)) {
            shippingFee = calculatedFee;
          }
        }
      }
    }

    const childItems = [];

    if (items && items.length > 0) {
      const hasShippingSubItem = items.some(i => i.is_shipping_fee || (i.product_sku && (i.product_sku === 'PVC' || i.product_sku.startsWith('PVC-'))) || (i.product_name && i.product_name.includes('Phí vận chuyển')));
      const prodItems = hasShippingSubItem ? items.filter(i => !(i.is_shipping_fee || (i.product_sku && (i.product_sku === 'PVC' || i.product_sku.startsWith('PVC-'))) || (i.product_name && i.product_name.includes('Phí vận chuyển')))) : items;
      const shipItems = hasShippingSubItem ? items.filter(i => i.is_shipping_fee || (i.product_sku && (i.product_sku === 'PVC' || i.product_sku.startsWith('PVC-'))) || (i.product_name && i.product_name.includes('Phí vận chuyển'))) : [];

      const prodSubtotalSum = prodItems.reduce((sum, item) => {
        const qty = item.received_qty !== undefined ? item.received_qty : (item.quantity || item.expected_qty || 1);
        return sum + (item.subtotal || (qty * (item.cost_price || item.unit_price || 0)));
      }, 0);

      const computedShipFee = shipItems.length > 0 ? shipItems.reduce((sum, s) => sum + (s.subtotal || s.unit_price || 0), 0) : shippingFee;
      const productDebtPortion = Math.max(0, (d.total_amount || 0) - computedShipFee);
      const categoryRates = typeof getCategoryShippingRates === 'function' ? getCategoryShippingRates() : {};

      const prodItemShipRates = prodItems.map(item => {
        let prod = products.find(p => p.id === item.product_id || p.sku === item.product_sku || p.name === item.product_name || (item.product_name && p.name && p.name.toLowerCase() === item.product_name.toLowerCase()));
        const cat = item.category || (prod ? prod.category : 'Khác') || 'Khác';
        const rate = categoryRates[cat] !== undefined ? categoryRates[cat] : (categoryRates['Khác'] !== undefined ? categoryRates['Khác'] : 20000);
        const qty = item.received_qty !== undefined ? item.received_qty : (item.quantity || item.expected_qty || 1);
        return { cat, rate, totalRate: qty * rate, qty };
      });
      const totalProdItemShipRates = prodItemShipRates.reduce((sum, r) => sum + r.totalRate, 0);

      prodItems.forEach((item, prodIdx) => {
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
        const qty = item.received_qty !== undefined ? item.received_qty : (item.quantity || item.expected_qty || 1);

        let itemAmount = 0;
        if (prodItems.length === 1) {
          itemAmount = computedShipFee > 0 ? (productDebtPortion || item.subtotal) : (d.total_amount || item.subtotal || (qty * (item.cost_price || item.unit_price || 0)));
        } else {
          const rawSubtotal = item.subtotal || (qty * (item.cost_price || item.unit_price || 0));
          itemAmount = prodSubtotalSum > 0 ? Math.round((rawSubtotal / prodSubtotalSum) * productDebtPortion) : rawSubtotal;
        }

        const unitPrice = item.unit_price || item.cost_price || (qty > 0 ? Math.round(itemAmount / qty) : itemAmount);

        childItems.push({
          sku: sku,
          name: name,
          unit: unit,
          quantity: qty,
          unit_price: unitPrice,
          amount: itemAmount,
          deduction: isPaidUpfront ? itemAmount : 0,
          notes: `Đơn giá: ${formatVND(unitPrice)}`,
          is_shipping_fee: false
        });

        if (computedShipFee > 0) {
          let itemShipFee = 0;
          const matchedShip = shipItems.find(s => (s.product_sku && (s.product_sku === `PVC-${sku}` || s.product_sku === sku)) || (s.product_name && s.product_name.includes(name)));
          if (matchedShip) {
            itemShipFee = matchedShip.subtotal || matchedShip.unit_price || 0;
          } else if (prodItems.length === 1) {
            itemShipFee = computedShipFee;
          } else if (totalProdItemShipRates > 0) {
            itemShipFee = Math.round((prodItemShipRates[prodIdx].totalRate / totalProdItemShipRates) * computedShipFee);
          } else {
            itemShipFee = Math.round(computedShipFee / prodItems.length);
          }

          if (itemShipFee > 0) {
            const shipRateInfo = prodItemShipRates[prodIdx] ? ` (${prodItemShipRates[prodIdx].cat}: ${formatVND(prodItemShipRates[prodIdx].rate)}/đv)` : '';
            childItems.push({
              sku: `PVC-${sku}`,
              name: `Phí vận chuyển - ${name}`,
              unit: 'Chuyến',
              quantity: qty,
              unit_price: Math.round(itemShipFee / qty),
              amount: itemShipFee,
              deduction: isPaidUpfront ? itemShipFee : 0,
              notes: `Phí VC riêng mặt hàng${shipRateInfo}`,
              is_shipping_fee: true
            });
          }
        }
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

      const prodSku = prod ? prod.sku : 'SKU-PROD';
      const prodName = prod ? prod.name : (isSupplier ? 'Linh kiện / Nhập kho' : 'Sản Phẩm Kho Bãi');

      if (shippingFee > 0 && d.total_amount > shippingFee) {
        const prodAmt = d.total_amount - shippingFee;
        childItems.push({
          sku: prodSku,
          name: prodName,
          unit: prod ? prod.unit : 'Cái',
          quantity: 1,
          unit_price: prodAmt,
          amount: prodAmt,
          deduction: isPaidUpfront ? prodAmt : 0,
          notes: debtNote,
          is_shipping_fee: false
        });
        childItems.push({
          sku: `PVC-${orderCode}`,
          name: `Phí vận chuyển giao hàng`,
          unit: 'Chuyến',
          quantity: 1,
          unit_price: shippingFee,
          amount: shippingFee,
          deduction: isPaidUpfront ? shippingFee : 0,
          notes: `Phí vận chuyển đơn ${orderCode}`,
          is_shipping_fee: true
        });
      } else {
        childItems.push({
          sku: prodSku,
          name: prodName,
          unit: prod ? prod.unit : 'Cái',
          quantity: 1,
          unit_price: d.total_amount || d.remaining_amount || 0,
          amount: d.total_amount || d.remaining_amount || 0,
          deduction: isPaidUpfront ? (d.total_amount || 0) : 0,
          notes: debtNote,
          is_shipping_fee: false
        });
      }
    }

    const totalOrderQty = childItems.filter(c => !c.is_shipping_fee).reduce((sum, c) => sum + c.quantity, 0) || 1;
    const prodCount = childItems.filter(c => !c.is_shipping_fee).length;
    const hasShipping = childItems.some(c => c.is_shipping_fee);

    let paymentBadge = '';
    if (pmLabel === 'Chuyển Khoản') {
      paymentBadge = '<span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:0.75rem;"><i class="bi bi-bank"></i> Đã CK</span>';
    } else if (pmLabel === 'Tiền Mặt') {
      paymentBadge = '<span style="background:#dcfce7; color:#15803d; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:0.75rem;"><i class="bi bi-cash"></i> Đã TT Tiền Mặt</span>';
    } else {
      paymentBadge = `<span style="background:#fef3c7; color:#b45309; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:0.75rem;"><i class="bi bi-clock-history"></i> ${isSupplier ? 'Nợ NCC' : 'Ghi Nợ'}</span>`;
    }

    return {
      orderCode,
      childItems,
      totalOrderQty,
      prodCount,
      hasShipping,
      paymentBadge,
      debtNote,
      isPaidUpfront,
      pmLabel
    };
  }

  // 1. Process Debts
  debts.forEach((d, debtIdx) => {
    if (d.type === 'Receivable' && Number(d.remaining_amount) === 0 && d.notes && (d.notes.includes('(Tiền Mặt)') || d.notes.includes('(Chuyển Khoản)'))) {
      return;
    }

    let matchedInbound = inbounds.find(i => i.id === d.order_id || i.code === d.order_code || (d.notes && d.notes.includes(i.code)));
    let matchedOrder = orders.find(o => o.id === d.order_id || o.order_code === d.order_code || (d.notes && (d.notes.includes(o.order_code) || (o.order_code && d.notes.toLowerCase().includes(o.order_code.toLowerCase())))));

    const dDate = matchedInbound && matchedInbound.created_at ? new Date(matchedInbound.created_at) : (matchedOrder && matchedOrder.created_at ? new Date(matchedOrder.created_at) : (d.created_at ? new Date(d.created_at) : (d.due_date ? new Date(d.due_date) : new Date(0))));
    const amount = Number(d.total_amount) || Number(d.remaining_amount) || 0;
    const isPayable = d.type === 'Payable';

    if (startDate && dDate < startDate) {
      openingDebt += amount;
    } else if ((!startDate || dDate >= startDate) && (!endDate || dDate <= endDate)) {
      const { orderCode, childItems, totalOrderQty, prodCount, hasShipping, paymentBadge, debtNote, isPaidUpfront, pmLabel } = buildChildItemsForTransaction(d, matchedOrder, matchedInbound, debtIdx);

      let titleStr = '';
      if (isPayable) {
        titleStr = pmLabel && pmLabel !== 'Ghi Nợ' ? `Nhập Hàng (${pmLabel})` : 'Phiếu Nhập Hàng (Inbound)';
      } else {
        titleStr = pmLabel && pmLabel !== 'Ghi Nợ' ? `Bán Hàng (${pmLabel})` : 'Bán Hàng Ghi Nợ';
      }

      inPeriodItems.push({
        timestamp: dDate.getTime(),
        dateStr: formatDate(dDate),
        type: isPayable ? 'INBOUND' : 'INVOICE',
        code: orderCode,
        title: titleStr,
        description: debtNote,
        debtAmount: amount,
        creditAmount: isPaidUpfront ? amount : 0,
        totalQty: totalOrderQty,
        prodCount: prodCount,
        hasShippingFee: hasShipping,
        paymentBadge: paymentBadge,
        childItems: childItems
      });
    }
  });

  // 2. Handle sales orders not directly in debts
  if (!isSupplier) {
    orders.forEach((o, oIdx) => {
      const debtAmt = Number(o.debt_amount);
      const isCreditOrder = o.payment_method === 'Debt' || (!isNaN(debtAmt) && debtAmt > 0);

      if (isCreditOrder) {
        const existsInDebts = debts.some(d => d.order_id === o.id || d.order_code === o.order_code || (d.notes && d.notes.includes(o.order_code)));
        if (!existsInDebts) {
          const oDate = o.created_at ? new Date(o.created_at) : new Date();
          const amount = !isNaN(debtAmt) && debtAmt > 0 ? debtAmt : Number(o.final_amount || o.total_amount) || 0;
          if (startDate && oDate < startDate) {
            openingDebt += amount;
          } else if ((!startDate || oDate >= startDate) && (!endDate || oDate <= endDate)) {
            const oPm = o.payment_method === 'Bank' ? 'Chuyển Khoản' : (o.payment_method === 'Cash' ? 'Tiền Mặt' : 'Ghi Nợ');
            const fakeDebt = { total_amount: amount, order_id: o.id, order_code: o.order_code, type: 'Receivable', notes: `Đơn hàng ${o.order_code} (${oPm})` };
            const { orderCode, childItems, totalOrderQty, prodCount, hasShipping, paymentBadge, debtNote } = buildChildItemsForTransaction(fakeDebt, o, null, oIdx);

            const titleStr = oPm !== 'Ghi Nợ' ? `Bán Hàng (${oPm})` : 'Bán Hàng Ghi Nợ';

            inPeriodItems.push({
              timestamp: oDate.getTime(),
              dateStr: formatDate(oDate),
              type: 'INVOICE',
              code: orderCode,
              title: titleStr,
              description: debtNote,
              debtAmount: amount,
              creditAmount: 0,
              totalQty: totalOrderQty,
              prodCount: prodCount,
              hasShippingFee: hasShipping,
              paymentBadge: paymentBadge,
              childItems: childItems
            });
          }
        }
      }
    });
  }

  // 3. Handle supplier inbound orders not directly in debts
  if (isSupplier) {
    inbounds.forEach((inb, inbIdx) => {
      const existsInDebts = debts.some(d => d.order_id === inb.id || d.order_code === inb.code || (d.notes && d.notes.includes(inb.code)));
      const isReceivedStatus = inb.status === 'Received' || inb.status === 'Completed' || inb.status === 'Đã nhập kho';
      if (!existsInDebts && isReceivedStatus) {
        const iDate = inb.received_at ? new Date(inb.received_at) : (inb.created_at ? new Date(inb.created_at) : new Date());
        const amount = Number(inb.total_amount) || 0;
        if (amount > 0) {
          if (startDate && iDate < startDate) {
            openingDebt += amount;
          } else if ((!startDate || iDate >= startDate) && (!endDate || iDate <= endDate)) {
            const inbPm = inb.payment_method === 'Bank' ? 'Chuyển Khoản' : (inb.payment_method === 'Cash' ? 'Tiền Mặt' : 'Ghi Nợ');
            const fakeDebt = { total_amount: amount, order_id: inb.id, order_code: inb.code, type: 'Payable', notes: `Đơn nhập ${inb.code} (${inbPm})` };
            const { orderCode, childItems, totalOrderQty, prodCount, hasShipping, paymentBadge, debtNote } = buildChildItemsForTransaction(fakeDebt, null, inb, inbIdx);

            const titleStr = inbPm !== 'Ghi Nợ' ? `Nhập Hàng (${inbPm})` : 'Phiếu Nhập Kho (Inbound)';

            inPeriodItems.push({
              timestamp: iDate.getTime(),
              dateStr: formatDate(iDate),
              type: 'INBOUND',
              code: orderCode,
              title: titleStr,
              description: debtNote,
              debtAmount: amount,
              creditAmount: 0,
              totalQty: totalOrderQty,
              prodCount: prodCount,
              hasShippingFee: hasShipping,
              paymentBadge: paymentBadge,
              childItems: childItems
            });
          }
        }
      }
    });
  }

  // 4. Process Payments & Debt Deductions
  payments.forEach(p => {
    const pDate = p.created_at ? new Date(p.created_at) : new Date(0);
    const amount = Number(p.amount) || 0;
    if (amount <= 0) return; // Skip 0đ payments

    if (startDate && pDate < startDate) {
      openingCredit += amount;
    } else if ((!startDate || pDate >= startDate) && (!endDate || pDate <= endDate)) {
      const isDebtDeduction = p.payment_method === 'DebtDeduction' || (p.note && p.note.includes('phiếu trả hàng')) || (p.payment_code && p.payment_code.startsWith('TH'));
      let methodText = p.payment_method === 'Bank' ? 'Chuyển Khoản' : (isDebtDeduction ? 'Khấu Trừ' : 'Tiền Mặt');
      let methodBadge = '';
      if (p.payment_method === 'Bank') {
        methodBadge = '<span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:0.75rem;"><i class="bi bi-bank"></i> Chuyển Khoản</span>';
      } else if (isDebtDeduction) {
        methodBadge = '<span style="background:#fef3c7; color:#b45309; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:0.75rem;"><i class="bi bi-arrow-counterclockwise"></i> Khấu Trừ Trả Hàng</span>';
      } else {
        methodBadge = '<span style="background:#dcfce7; color:#15803d; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:0.75rem;"><i class="bi bi-cash"></i> Tiền Mặt</span>';
      }

      // Find matched order for this payment to display order number & payment method
      let matchedOrderForPayment = orders.find(o => o.id === p.order_id || o.order_code === p.order_code || (p.note && (p.note.includes(o.order_code) || (o.order_code && p.note.toLowerCase().includes(o.order_code.toLowerCase())))));
      let orderCodeText = p.order_code || (matchedOrderForPayment ? matchedOrderForPayment.order_code : '');
      if (!orderCodeText && p.note) {
        const hdMatch = p.note.match(/(HD\d+)/i) || p.note.match(/(DH\d+)/i) || p.note.match(/(INB\d+)/i) || p.note.match(/(PXN\d+)/i);
        if (hdMatch) orderCodeText = hdMatch[1].toUpperCase();
      }

      let childItems = [];
      let returnUnit = 'Cái';
      let returnQty = 1;
      let returnUnitPrice = amount;

      if (isDebtDeduction) {
        const matchedReturn = (returns || []).find(ret => ret.return_code === p.payment_code || ret.id === p.id || (p.note && p.note.includes(ret.return_code)));
        const rItems = (p.items && p.items.length > 0) ? p.items : (matchedReturn && matchedReturn.items && matchedReturn.items.length > 0 ? matchedReturn.items : null);

        if (rItems && rItems.length > 0) {
          childItems = rItems.map(i => {
            const prod = products.find(prod => prod.id === i.product_id || prod.name === i.product_name || prod.sku === i.product_sku);
            const qty = Number(i.quantity) || 1;
            const unitPrice = Number(i.unit_price) || (amount / qty);
            const itemAmt = Number(i.amount) || (unitPrice * qty) || amount;
            return {
              sku: i.product_sku || (prod ? prod.sku : 'SKU-TRA'),
              name: i.product_name || (prod ? prod.name : 'Sản phẩm trả lại'),
              unit: i.unit || (prod ? prod.unit : 'Cái'),
              quantity: qty,
              unit_price: unitPrice,
              amount: itemAmt,
              deduction: itemAmt
            };
          });
        } else {
          let prod = products.find(prod => (p.note && p.note.includes(prod.name)) || (matchedReturn && matchedReturn.reason && matchedReturn.reason.includes(prod.name)));
          let prodName = prod ? prod.name : 'Sản phẩm trả lại';
          let prodSku = prod ? prod.sku : 'SKU-TRA';
          let prodUnit = prod ? (prod.unit || 'Cái') : 'Cái';
          let prodPrice = prod ? (prod.selling_price || amount) : amount;
          let prodQty = Math.max(1, Math.round(amount / (prodPrice || 1))) || 1;
          if (prodPrice * prodQty !== amount && prodQty === 1) {
            prodPrice = amount;
          }
          childItems.push({
            sku: prodSku,
            name: prodName,
            unit: prodUnit,
            quantity: prodQty,
            unit_price: prodPrice,
            amount: amount,
            deduction: amount
          });
        }

        if (childItems.length > 0) {
          returnQty = childItems.reduce((s, c) => s + c.quantity, 0);
          returnUnit = childItems.length === 1 ? childItems[0].unit : 'SP';
          returnUnitPrice = childItems.length === 1 ? childItems[0].unit_price : Math.round(amount / returnQty);
        }
      }

      let pTitle = '';
      let pDesc = '';
      if (isDebtDeduction) {
        const prodSummary = childItems.length === 1 ? childItems[0].name : `${childItems.length} sản phẩm`;
        pTitle = `Trả Hàng: ${prodSummary}`;
        pDesc = `Khách trả ${returnQty} ${returnUnit} - ${childItems.map(c => c.name).join(', ')} (Đơn giá: ${formatVND(returnUnitPrice)})`;
      } else {
        pTitle = isSupplier ? `Phiếu Chi (${methodText})` : `Phiếu Thu (${methodText})`;
        if (orderCodeText) {
          pDesc = `Thanh toán đơn hàng ${orderCodeText} (${methodText})`;
        } else if (p.note) {
          pDesc = p.note.includes(methodText) ? p.note : `${p.note} (${methodText})`;
        } else {
          pDesc = `Thanh toán công nợ (${methodText})`;
        }
      }

      inPeriodItems.push({
        timestamp: pDate.getTime(),
        dateStr: formatDate(pDate),
        type: isDebtDeduction ? 'RETURN' : 'PAYMENT',
        code: orderCodeText ? `${p.payment_code || 'PT-' + p.id} (${orderCodeText})` : (p.payment_code || 'PT-' + p.id),
        title: pTitle,
        description: pDesc,
        debtAmount: 0,
        creditAmount: amount,
        totalQty: isDebtDeduction ? returnQty : 0,
        unit: isDebtDeduction ? returnUnit : '',
        unitPrice: isDebtDeduction ? returnUnitPrice : 0,
        paymentBadge: methodBadge,
        childItems: childItems
      });
    }
  });

  // 5. Process Returns (Only those not already recorded in debt_payments)
  returns.forEach(r => {
    const returnCode = r.return_code || ('TH-' + r.id);
    const alreadyInPayments = payments.some(p => p.payment_code === returnCode || (p.note && p.note.includes(returnCode)));
    if (alreadyInPayments) return; // Skip duplicate!

    const rDate = r.created_at ? new Date(r.created_at) : new Date(0);
    const amount = Number(r.total_refund) || Number(r.refund_amount) || 0;
    if (amount <= 0) return; // Skip 0đ returns!

    if (startDate && rDate < startDate) {
      openingCredit += amount;
    } else if ((!startDate || rDate >= startDate) && (!endDate || rDate <= endDate)) {
      let childItems = [];
      if (r.items && r.items.length > 0) {
        childItems = r.items.map(i => {
          const prod = products.find(prod => prod.id === i.product_id || prod.name === i.product_name || prod.sku === i.product_sku);
          const qty = Number(i.quantity) || 1;
          const unitPrice = Number(i.unit_price) || (amount / qty);
          const itemAmt = Number(i.amount) || (unitPrice * qty) || amount;
          return {
            sku: i.product_sku || (prod ? prod.sku : 'SKU-TRA'),
            name: i.product_name || (prod ? prod.name : 'Sản phẩm trả lại'),
            unit: i.unit || (prod ? prod.unit : 'Cái'),
            quantity: qty,
            unit_price: unitPrice,
            amount: itemAmt,
            deduction: itemAmt
          };
        });
      } else {
        let prod = products.find(prod => (r.reason && r.reason.includes(prod.name)));
        let prodName = prod ? prod.name : 'Sản phẩm trả lại';
        let prodSku = prod ? prod.sku : 'SKU-TRA';
        let prodUnit = prod ? (prod.unit || 'Cái') : 'Cái';
        let prodPrice = prod ? (prod.selling_price || amount) : amount;
        let prodQty = Math.max(1, Math.round(amount / (prodPrice || 1))) || 1;
        if (prodPrice * prodQty !== amount && prodQty === 1) {
          prodPrice = amount;
        }
        childItems.push({
          sku: prodSku,
          name: prodName,
          unit: prodUnit,
          quantity: prodQty,
          unit_price: prodPrice,
          amount: amount,
          deduction: amount
        });
      }

      const returnQty = childItems.reduce((s, c) => s + c.quantity, 0);
      const returnUnit = childItems.length === 1 ? childItems[0].unit : 'SP';
      const returnUnitPrice = childItems.length === 1 ? childItems[0].unit_price : Math.round(amount / returnQty);
      const prodSummary = childItems.length === 1 ? childItems[0].name : `${childItems.length} sản phẩm`;

      inPeriodItems.push({
        timestamp: rDate.getTime(),
        dateStr: formatDate(rDate),
        type: 'RETURN',
        code: returnCode,
        title: `Trả Hàng: ${prodSummary}`,
        description: r.reason || `Khách trả ${returnQty} ${returnUnit} - ${childItems.map(c => c.name).join(', ')} (Đơn giá: ${formatVND(returnUnitPrice)})`,
        debtAmount: 0,
        creditAmount: amount,
        totalQty: returnQty,
        unit: returnUnit,
        unitPrice: returnUnitPrice,
        paymentBadge: '<span style="background:#fef3c7; color:#b45309; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:0.75rem;"><i class="bi bi-arrow-counterclockwise"></i> Khấu Trừ Trả Hàng</span>',
        childItems: childItems
      });
    }
  });

  // Sort timeline chronologically (ascending)
  inPeriodItems.sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp;
    }
    const isDebtA = a.type === 'INVOICE' || a.type === 'INBOUND';
    const isDebtB = b.type === 'INVOICE' || b.type === 'INBOUND';
    if (isDebtA && !isDebtB) return -1;
    if (!isDebtA && isDebtB) return 1;
    return 0;
  });

  // Financial Calculations
  const openingBalance = Math.max(0, openingDebt - openingCredit);
  let inPeriodDebtsTotal = 0;
  let inPeriodPaymentsTotal = 0;

  let currentRunning = openingBalance;
  inPeriodItems.forEach(item => {
    inPeriodDebtsTotal += item.debtAmount;
    inPeriodPaymentsTotal += item.creditAmount;
    currentRunning = currentRunning + item.debtAmount - item.creditAmount;
    item.runningBalance = currentRunning;
  });

  const closingBalance = currentRunning;

  // Cache calculation result
  currentReconcileDataCache = {
    customerName: currentReconcileCustomerName,
    isSupplier,
    startVal: startVal ? formatDate(startVal) : 'Đầu kỳ',
    endVal: endVal ? formatDate(endVal) : 'Hiện tại',
    openingBalance,
    inPeriodDebtsTotal,
    inPeriodPaymentsTotal,
    closingBalance,
    inPeriodItems
  };

  // Update KPI Cards
  const kpiOpening = document.getElementById('rec-kpi-opening');
  const kpiInDebts = document.getElementById('rec-kpi-in-debts');
  const kpiInPayments = document.getElementById('rec-kpi-in-payments');
  const kpiClosing = document.getElementById('rec-kpi-closing');
  const kpiClosingSub = document.getElementById('rec-kpi-closing-sub');

  if (kpiOpening) kpiOpening.textContent = formatVND(openingBalance);
  if (kpiInDebts) kpiInDebts.textContent = '+' + formatVND(inPeriodDebtsTotal);
  if (kpiInPayments) kpiInPayments.textContent = '-' + formatVND(inPeriodPaymentsTotal);
  if (kpiClosing) {
    kpiClosing.textContent = formatVND(closingBalance);
    kpiClosing.style.color = closingBalance === 0 ? 'var(--success)' : 'var(--danger)';
  }
  if (kpiClosingSub) {
    if (closingBalance === 0) {
      kpiClosingSub.textContent = isSupplier ? 'Đã hết nợ NCC!' : 'Khách đã hết nợ!';
      kpiClosingSub.style.color = 'var(--success)';
    } else {
      kpiClosingSub.textContent = isSupplier ? 'Dư nợ NCC cần thanh toán' : 'Dư nợ cần thanh toán';
      kpiClosingSub.style.color = 'var(--danger)';
    }
  }

  // Filter items if search query is provided
  let displayItems = inPeriodItems;
  if (searchQuery) {
    displayItems = inPeriodItems.filter(item => {
      const matchMaster = (item.code && item.code.toLowerCase().includes(searchQuery)) ||
        (item.title && item.title.toLowerCase().includes(searchQuery)) ||
        (item.description && item.description.toLowerCase().includes(searchQuery));
      const matchChild = item.childItems && item.childItems.some(c =>
        (c.name && c.name.toLowerCase().includes(searchQuery)) ||
        (c.sku && c.sku.toLowerCase().includes(searchQuery)) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery))
      );
      return matchMaster || matchChild;
    });
  }

  // Render Table
  const tbody = document.getElementById('reconcile-modal-tbody');
  if (!tbody) return;

  let html = `
    <tr style="background:#f1f5f9; font-weight:700; color:#334155; border-bottom:2px solid #cbd5e1;">
      <td style="text-align:center; background:#e2e8f0; font-weight:800;">-</td>
      <td style="white-space:nowrap; font-weight:600;">${startVal ? formatDate(startVal) : 'Đầu kỳ'}</td>
      <td><code>[DƯ NỢ ĐẦU KỲ]</code></td>
      <td style="font-weight:700;">
        <i class="bi bi-clock-history text-secondary" style="margin-right:4px;"></i> Dư Nợ Tích Lũy Chuyển Tiếp Trước Kỳ
      </td>
      <td style="text-align:center; color:#64748b;">-</td>
      <td style="text-align:center; color:#64748b;">-</td>
      <td style="text-align:right; color:#64748b;">-</td>
      <td style="text-align:right; color:#64748b;">-</td>
      <td style="text-align:right; color:#64748b;">-</td>
      <td style="text-align:right; font-weight:800; font-size:0.95rem; color:#334155;">${formatVND(openingBalance)}</td>
      <td style="font-size:0.8rem; color:#64748b;">Chuyển tiếp từ trước kỳ</td>
    </tr>
  `;

  if (displayItems.length === 0) {
    html += `
      <tr>
        <td colspan="11" style="text-align:center; padding:24px; color:var(--text-muted);">
          <i class="bi bi-inbox" style="font-size:1.4rem; display:block; margin-bottom:4px;"></i>
          Không có giao dịch ${isSupplier ? 'nhập hàng hay thanh toán' : 'bán hàng hay thanh toán'} nào phát sinh trong giai đoạn này.
        </td>
      </tr>
    `;
  } else {
    displayItems.forEach((item, idx) => {
      if (item.type === 'INBOUND' || item.type === 'INVOICE') {
        // Parent Master Row
        html += `
          <tr class="reconcile-parent-row">
            <td style="text-align:center; font-weight:800; background:#e2e8f0;">${idx + 1}</td>
            <td style="font-size:0.82rem; white-space:nowrap;">${item.dateStr}</td>
            <td><code style="background:#e2e8f0; color:#0f172a; padding:2px 6px; border-radius:4px; font-weight:700;">${item.code}</code></td>
            <td>
              <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                <div style="display:flex; align-items:center; gap:6px;">
                  <i class="bi ${isSupplier ? 'bi-box-seam-fill text-primary' : 'bi-bag-check-fill text-primary'}"></i>
                  <strong style="color:#1e40af; font-size:0.92rem;">${item.title}</strong>
                </div>
                <span style="font-size:0.75rem; background:#dbeafe; color:#1e40af; padding:2px 8px; border-radius:9999px; font-weight:600; white-space:nowrap;">
                  ${item.prodCount || 1} SP${item.hasShippingFee ? ' + Cước VC' : ''}
                </span>
              </div>
            </td>
            <td style="text-align:center; color:#64748b;">Đơn</td>
            <td style="text-align:center; font-weight:800; color:#0f172a;">${item.totalQty || 1}</td>
            <td style="text-align:right; color:#64748b;">-</td>
            <td style="text-align:right; font-weight:800; color:var(--danger); font-size:0.95rem;">${item.debtAmount > 0 ? '+' + formatVND(item.debtAmount) : '-'}</td>
            <td style="text-align:right; font-weight:800; color:var(--success); font-size:0.95rem;">${item.creditAmount > 0 ? '-' + formatVND(item.creditAmount) : '-'}</td>
            <td style="text-align:right; font-weight:800; color:${item.runningBalance === 0 ? 'var(--success)' : 'var(--danger)'}; font-size:0.95rem;">${formatVND(item.runningBalance)}</td>
            <td style="font-size:0.8rem; color:#64748b;">${item.paymentBadge || item.description}</td>
          </tr>
        `;

        // Child Product Rows (when toggle is active)
        if (showItemsToggle && item.childItems && item.childItems.length > 0) {
          item.childItems.forEach(child => {
            html += `
              <tr class="${child.is_shipping_fee ? 'reconcile-shipping-row' : 'reconcile-child-row'}">
                <td style="text-align:center; color:#94a3b8; font-size:0.8rem;"><i class="bi bi-arrow-return-right"></i></td>
                <td style="text-align:center; color:#94a3b8; font-size:0.75rem;">-</td>
                <td><code style="font-size:0.78rem; color:${child.is_shipping_fee ? '#0284c7' : '#64748b'};">${child.sku}</code></td>
                <td style="padding-left:22px; font-weight:${child.is_shipping_fee ? '600' : '500'};">
                  ${child.is_shipping_fee ? '<i class="bi bi-truck text-info" style="margin-right:4px;"></i> ' + child.name : '<i class="bi bi-box-seam text-secondary" style="font-size:0.8rem; margin-right:4px;"></i> ' + child.name}
                </td>
                <td style="text-align:center; font-size:0.82rem;">${child.unit}</td>
                <td style="text-align:center; font-weight:600;">${child.quantity}</td>
                <td style="text-align:right; font-size:0.82rem; color:#64748b;">${formatVND(child.unit_price)}</td>
                <td style="text-align:right; font-weight:600; color:#334155;">${formatVND(child.amount)}</td>
                <td style="text-align:right; color:#16a34a; font-size:0.82rem;">${child.deduction > 0 ? '-' + formatVND(child.deduction) : '-'}</td>
                <td style="text-align:right; color:#94a3b8;">-</td>
                <td style="font-size:0.78rem; color:#64748b;">${child.notes || '-'}</td>
              </tr>
            `;
          });
        }
      } else if (item.type === 'PAYMENT') {
        // Payment Row
        html += `
          <tr class="reconcile-payment-row">
            <td style="text-align:center; font-weight:800; background:#dcfce7; color:#166534;">${idx + 1}</td>
            <td style="font-size:0.82rem; white-space:nowrap;">${item.dateStr}</td>
            <td><code style="background:#dcfce7; color:#15803d; padding:2px 6px; border-radius:4px; font-weight:700; border:1px solid #86efac;">${item.code}</code></td>
            <td style="font-weight:700; color:#15803d;">
              <i class="bi bi-wallet2 text-success" style="margin-right:4px;"></i> [Thanh Toán] ${item.title}
              ${item.description ? `<div style="font-size:0.75rem; color:#166534; font-weight:normal; font-style:italic; margin-top:2px;">${item.description}</div>` : ''}
            </td>
            <td style="text-align:center; color:#94a3b8;">-</td>
            <td style="text-align:center; color:#94a3b8;">-</td>
            <td style="text-align:right; color:#94a3b8;">-</td>
            <td style="text-align:right; color:#94a3b8;">-</td>
            <td style="text-align:right; font-weight:800; color:#16a34a; font-size:0.95rem;">-${formatVND(item.creditAmount)}</td>
            <td style="text-align:right; font-weight:800; color:${item.runningBalance === 0 ? 'var(--success)' : 'var(--danger)'}; font-size:0.95rem;">${formatVND(item.runningBalance)}</td>
            <td style="font-size:0.8rem; color:#166534;">${item.paymentBadge}</td>
          </tr>
        `;
      } else if (item.type === 'RETURN') {
        // Return Row
        html += `
          <tr class="reconcile-return-row">
            <td style="text-align:center; font-weight:800; background:#fef3c7; color:#92400e;">${idx + 1}</td>
            <td style="font-size:0.82rem; white-space:nowrap;">${item.dateStr}</td>
            <td><code style="background:#fef3c7; color:#b45309; padding:2px 6px; border-radius:4px; font-weight:700; border:1px solid #fde68a;">${item.code}</code></td>
            <td style="font-weight:700; color:#b45309;">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                <div>
                  <i class="bi bi-arrow-counterclockwise text-warning" style="margin-right:4px;"></i> [Khấu Trừ] ${item.title}
                  ${item.description ? `<div style="font-size:0.75rem; color:#92400e; font-weight:normal; font-style:italic; margin-top:2px;">${item.description}</div>` : ''}
                </div>
                <span style="font-size:0.75rem; background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:9999px; font-weight:600; white-space:nowrap;">
                  Trả ${item.totalQty || 1} ${item.unit || 'SP'}
                </span>
              </div>
            </td>
            <td style="text-align:center; color:#92400e; font-weight:600;">${item.unit || 'Cái'}</td>
            <td style="text-align:center; font-weight:800; color:#92400e;">${item.totalQty || 1}</td>
            <td style="text-align:right; font-weight:600; color:#92400e;">${item.unitPrice ? formatVND(item.unitPrice) : '-'}</td>
            <td style="text-align:right; color:#94a3b8;">-</td>
            <td style="text-align:right; font-weight:800; color:#16a34a; font-size:0.95rem;">-${formatVND(item.creditAmount)}</td>
            <td style="text-align:right; font-weight:800; color:${item.runningBalance === 0 ? 'var(--success)' : 'var(--danger)'}; font-size:0.95rem;">${formatVND(item.runningBalance)}</td>
            <td style="font-size:0.8rem; color:#92400e;">${item.paymentBadge || 'Khấu trừ trả hàng'}</td>
          </tr>
        `;

        if (showItemsToggle && item.childItems && item.childItems.length > 0) {
          item.childItems.forEach(child => {
            html += `
              <tr class="reconcile-child-row" style="background:#fffdf7;">
                <td style="text-align:center; color:#b45309; font-size:0.8rem;"><i class="bi bi-arrow-return-right"></i></td>
                <td style="text-align:center; color:#b45309; font-size:0.75rem;">-</td>
                <td><code style="font-size:0.78rem; color:#b45309;">${child.sku}</code></td>
                <td style="padding-left:22px; font-weight:600; color:#92400e;">
                  <i class="bi bi-box-arrow-in-left text-warning" style="margin-right:4px;"></i> [Hàng trả] ${child.name}
                </td>
                <td style="text-align:center; font-size:0.82rem;">${child.unit}</td>
                <td style="text-align:center; font-weight:600;">${child.quantity}</td>
                <td style="text-align:right; font-size:0.82rem; color:#64748b;">${formatVND(child.unit_price)}</td>
                <td style="text-align:right; color:#94a3b8;">-</td>
                <td style="text-align:right; color:#16a34a; font-weight:600; font-size:0.82rem;">-${formatVND(child.amount || child.deduction)}</td>
                <td style="text-align:right; color:#94a3b8;">-</td>
                <td style="font-size:0.78rem; color:#92400e;">Giảm trừ công nợ</td>
              </tr>
            `;
          });
        }
      }
    });
  }

  // Row Cuối Kỳ
  html += `
    <tr style="background:#fff7ed; border-top:2px solid #fdba74; font-weight:800; color:#9a3412;">
      <td style="text-align:center; background:#fed7aa; font-weight:800;">-</td>
      <td style="white-space:nowrap;">${endVal ? formatDate(endVal) : 'Hôm nay'}</td>
      <td><code style="background:#ffedd5; color:#c2410c; padding:2px 6px; border-radius:4px;">[DƯ NỢ CUỐI KỲ]</code></td>
      <td style="font-weight:800;">
        <i class="bi bi-flag-fill text-danger" style="margin-right:4px;"></i> Chốt Tổng Dư Nợ Tính Đến Ngày ${endVal ? formatDate(endVal) : 'hôm nay'}
      </td>
      <td style="text-align:center; color:#64748b;">-</td>
      <td style="text-align:center; color:#64748b;">-</td>
      <td style="text-align:right; color:#64748b;">-</td>
      <td style="text-align:right; color:var(--danger); font-size:0.95rem;">+${formatVND(inPeriodDebtsTotal)}</td>
      <td style="text-align:right; color:var(--success); font-size:0.95rem;">-${formatVND(inPeriodPaymentsTotal)}</td>
      <td style="text-align:right; font-size:1.05rem; color:${closingBalance === 0 ? 'var(--success)' : 'var(--danger)'}; font-weight:900;">${formatVND(closingBalance)}</td>
      <td style="font-size:0.82rem; font-weight:700; color:var(--danger);">Chốt công nợ kỳ</td>
    </tr>
  `;

  tbody.innerHTML = html;
}

async function openDirectPrintDebt(customerName) {
  currentReconcileCustomerName = customerName;
  const partnerObj = allCustomers.find(c => c.name === customerName);
  const isSupplier = (partnerObj && partnerObj.type === 'Supplier') || allDebts.some(d => d.customer_name === customerName && d.type === 'Payable');

  const titleElem = document.getElementById('print-modal-customer-name');
  if (titleElem) {
    titleElem.textContent = customerName + (isSupplier ? ' (Nhà Cung Cấp)' : ' (Khách Hàng)');
  }

  // Set default preset if not yet initialized
  const presetSelect = document.getElementById('print-period-preset');
  const preset = presetSelect ? (presetSelect.value || '21days') : '21days';
  applyReconciliationPresetToInputs(preset, 'print');

  const searchInput = document.getElementById('print-search-input');
  if (searchInput) searchInput.value = '';

  const itemsToggle = document.getElementById('print-show-items-toggle');
  if (itemsToggle) itemsToggle.checked = true;

  await filterPrintModalData();
  openModal('debt-history-modal');
}

function printDebtReconciliationStatement() {
  if (!currentReconcileDataCache) return;

  const data = currentReconcileDataCache;
  const printContainer = document.getElementById('debt-history-print-area');
  if (!printContainer) return;

  const partner = (allCustomers || []).find(c => c.name === data.customerName) || {};
  const partnerCode = partner.code || (data.isSupplier ? 'NCC-DEBT' : 'KH-DEBT');
  const partnerPhone = partner.phone || '---';
  const partnerAddress = partner.address || '---';
  const partnerEmail = partner.email || '---';
  const partnerTaxId = partner.tax_id || partner.tax_code || '---';

  const wordsAmount = (typeof docSoTien === 'function') ? docSoTien(data.closingBalance) : 'Không đồng';
  const now = new Date();
  const currentDateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const currentTimeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  // Generate Table Rows HTML for A4 Print
  let printRowsHtml = `
    <tr style="background:#f1f5f9; font-weight:bold; border-bottom:1.5px solid #cbd5e1;">
      <td style="text-align:center; background:#e2e8f0; white-space:nowrap;">-</td>
      <td style="text-align:center; white-space:nowrap;">${data.startVal}</td>
      <td style="text-align:center; white-space:nowrap;"><code>[ĐẦU KỲ]</code></td>
      <td style="font-weight:bold;" colspan="3">DƯ NỢ ĐẦU KỲ (Số dư nợ chuyển tiếp từ kỳ trước)</td>
      <td style="text-align:right; white-space:nowrap;">-</td>
      <td style="text-align:right; white-space:nowrap;">-</td>
      <td style="text-align:right; white-space:nowrap;">-</td>
      <td class="a4-num-cell" style="text-align:right; font-weight:bold;">${formatVND(data.openingBalance)}</td>
    </tr>
  `;

  data.inPeriodItems.forEach((item, idx) => {
    if (item.type === 'INBOUND' || item.type === 'INVOICE') {
      printRowsHtml += `
        <tr style="background:#f8fafc; font-weight:bold; border-top:1.5px solid #94a3b8;">
          <td style="text-align:center; background:#e2e8f0; white-space:nowrap;">${idx + 1}</td>
          <td style="text-align:center; white-space:nowrap;">${item.dateStr}</td>
          <td style="text-align:center; white-space:nowrap;"><code>${item.code}</code></td>
          <td style="color:#1e40af;">
            <div style="font-weight:700;">${item.title} <span style="font-size:0.62rem; background:#dbeafe; color:#1e40af; padding:1px 5px; border-radius:9999px; font-weight:600;">${item.prodCount || 1} SP${item.hasShippingFee ? ' + Cước VC' : ''}</span></div>
            ${item.description ? `<div style="font-size:0.62rem; color:#64748b; font-weight:normal; font-style:italic; margin-top:2px;">${item.description}</div>` : ''}
          </td>
          <td style="text-align:center; white-space:nowrap;">Đơn</td>
          <td style="text-align:center; font-weight:bold; white-space:nowrap;">${item.totalQty || 1}</td>
          <td style="text-align:right; color:#64748b; white-space:nowrap;">-</td>
          <td class="a4-num-cell" style="text-align:right; color:#dc2626; font-weight:bold;">+${formatVND(item.debtAmount)}</td>
          <td class="a4-num-cell" style="text-align:right; color:#16a34a;">${item.creditAmount > 0 ? '-' + formatVND(item.creditAmount) : '-'}</td>
          <td class="a4-num-cell" style="text-align:right; font-weight:bold; color:${item.runningBalance === 0 ? '#16a34a' : '#dc2626'};">${formatVND(item.runningBalance)}</td>
        </tr>
      `;

      if (item.childItems && item.childItems.length > 0) {
        item.childItems.forEach(child => {
          printRowsHtml += `
            <tr style="${child.is_shipping_fee ? 'background:#f0f9ff; color:#0369a1;' : 'background:#ffffff; color:#334155;'}">
              <td style="text-align:center; color:#94a3b8; font-size:0.62rem; white-space:nowrap;">↳</td>
              <td style="text-align:center; color:#94a3b8; font-size:0.62rem; white-space:nowrap;">-</td>
              <td style="text-align:center; font-size:0.62rem; white-space:nowrap;"><code>${child.sku}</code></td>
              <td style="padding-left:14px; font-size:0.62rem;">
                ${child.is_shipping_fee ? '<span style="color:#0369a1; font-weight:600;">[Cước VC] ' + child.name + '</span>' : child.name}
                ${child.notes && child.notes !== '-' ? `<span style="font-size:0.62rem; color:#94a3b8; margin-left:4px;">(${child.notes})</span>` : ''}
              </td>
              <td style="text-align:center; font-size:0.62rem; white-space:nowrap;">${child.unit}</td>
              <td style="text-align:center; font-size:0.62rem; white-space:nowrap;">${child.quantity}</td>
              <td class="a4-num-cell" style="text-align:right; font-size:0.62rem;">${formatVND(child.unit_price)}</td>
              <td class="a4-num-cell" style="text-align:right; font-size:0.62rem;">${formatVND(child.amount)}</td>
              <td class="a4-num-cell" style="text-align:right; color:#16a34a; font-size:0.62rem;">${child.deduction > 0 ? '-' + formatVND(child.deduction) : '-'}</td>
              <td style="text-align:right; color:#94a3b8; font-size:0.62rem; white-space:nowrap;">-</td>
            </tr>
          `;
        });
      }
    } else if (item.type === 'PAYMENT') {
      printRowsHtml += `
        <tr style="background:#f0fdf4; font-weight:bold; color:#14532d; border-top:1px solid #86efac;">
          <td style="text-align:center; background:#dcfce7; color:#166534; white-space:nowrap;">${idx + 1}</td>
          <td style="text-align:center; white-space:nowrap;">${item.dateStr}</td>
          <td style="text-align:center; white-space:nowrap;"><code style="color:#15803d;">${item.code}</code></td>
          <td style="color:#15803d;">
            <div style="font-weight:700;">[Thanh Toán] ${item.title}</div>
            ${item.description ? `<div style="font-size:0.62rem; color:#166534; font-weight:normal; font-style:italic; margin-top:2px;">${item.description}</div>` : ''}
          </td>
          <td style="text-align:center; color:#94a3b8; white-space:nowrap;">-</td>
          <td style="text-align:center; color:#94a3b8; white-space:nowrap;">-</td>
          <td style="text-align:right; color:#94a3b8; white-space:nowrap;">-</td>
          <td style="text-align:right; color:#94a3b8; white-space:nowrap;">-</td>
          <td class="a4-num-cell" style="text-align:right; color:#16a34a; font-weight:bold;">-${formatVND(item.creditAmount)}</td>
          <td class="a4-num-cell" style="text-align:right; font-weight:bold; color:${item.runningBalance === 0 ? '#16a34a' : '#dc2626'};">${formatVND(item.runningBalance)}</td>
        </tr>
      `;
    } else if (item.type === 'RETURN') {
      printRowsHtml += `
        <tr style="background:#fffbeb; font-weight:bold; color:#92400e; border-top:1px solid #fde68a;">
          <td style="text-align:center; background:#fef3c7; white-space:nowrap;">${idx + 1}</td>
          <td style="text-align:center; white-space:nowrap;">${item.dateStr}</td>
          <td style="text-align:center; white-space:nowrap;"><code style="color:#b45309;">${item.code}</code></td>
          <td style="color:#b45309;">
            <div style="font-weight:700;">[Khấu Trừ] ${item.title} <span style="font-size:0.62rem; background:#fef3c7; color:#92400e; padding:1px 5px; border-radius:9999px; font-weight:600;">Trả ${item.totalQty || 1} ${item.unit || 'SP'}</span></div>
            ${item.description ? `<div style="font-size:0.62rem; color:#92400e; font-weight:normal; font-style:italic; margin-top:2px;">${item.description}</div>` : ''}
          </td>
          <td style="text-align:center; white-space:nowrap;">${item.unit || 'Cái'}</td>
          <td style="text-align:center; font-weight:bold; white-space:nowrap;">${item.totalQty || 1}</td>
          <td class="a4-num-cell" style="text-align:right;">${item.unitPrice ? formatVND(item.unitPrice) : '-'}</td>
          <td style="text-align:right; color:#94a3b8; white-space:nowrap;">-</td>
          <td class="a4-num-cell" style="text-align:right; color:#16a34a; font-weight:bold;">-${formatVND(item.creditAmount)}</td>
          <td class="a4-num-cell" style="text-align:right; font-weight:bold; color:${item.runningBalance === 0 ? '#16a34a' : '#dc2626'};">${formatVND(item.runningBalance)}</td>
        </tr>
      `;

      if (item.childItems && item.childItems.length > 0) {
        item.childItems.forEach(child => {
          printRowsHtml += `
            <tr style="background:#fffdf7; color:#78350f;">
              <td style="text-align:center; color:#b45309; font-size:0.62rem; white-space:nowrap;">↳</td>
              <td style="text-align:center; color:#b45309; font-size:0.62rem; white-space:nowrap;">-</td>
              <td style="text-align:center; font-size:0.62rem; white-space:nowrap;"><code>${child.sku}</code></td>
              <td style="padding-left:14px; font-size:0.62rem; color:#b45309;">
                [Hàng trả] ${child.name}
              </td>
              <td style="text-align:center; font-size:0.62rem; white-space:nowrap;">${child.unit}</td>
              <td style="text-align:center; font-size:0.62rem; white-space:nowrap;">${child.quantity}</td>
              <td class="a4-num-cell" style="text-align:right; font-size:0.62rem;">${formatVND(child.unit_price)}</td>
              <td style="text-align:right; color:#94a3b8; font-size:0.62rem; white-space:nowrap;">-</td>
              <td class="a4-num-cell" style="text-align:right; color:#16a34a; font-size:0.62rem;">-${formatVND(child.amount || child.deduction)}</td>
              <td style="text-align:right; color:#94a3b8; font-size:0.62rem; white-space:nowrap;">-</td>
            </tr>
          `;
        });
      }
    }
  });

  printRowsHtml += `
    <tr style="background:#fff7ed; font-weight:bold; border-top:2px solid #fdba74; color:#9a3412;">
      <td style="text-align:center; background:#fed7aa; font-weight:800; white-space:nowrap;">-</td>
      <td style="text-align:center; white-space:nowrap;">${data.endVal}</td>
      <td style="text-align:center; white-space:nowrap;"><code>[CUỐI KỲ]</code></td>
      <td style="font-weight:bold;" colspan="3">DƯ NỢ CUỐI KỲ (Chốt số nợ tính đến ngày ${data.endVal})</td>
      <td style="text-align:right; white-space:nowrap;">-</td>
      <td class="a4-num-cell" style="text-align:right; color:#dc2626; font-weight:bold;">+${formatVND(data.inPeriodDebtsTotal)}</td>
      <td class="a4-num-cell" style="text-align:right; color:#16a34a; font-weight:bold;">-${formatVND(data.inPeriodPaymentsTotal)}</td>
      <td class="a4-num-cell" style="text-align:right; font-size:0.82rem; font-weight:bold; color:#dc2626;">${formatVND(data.closingBalance)}</td>
    </tr>
  `;

  const a4PrintHtml = `
    <div class="a4-portrait-page">
      <!-- Header Grid -->
      <div class="a4-header-grid">
        <div>
          <div class="a4-company-name">CÔNG TY CỔ PHẦN CÔNG NGHỆ & THƯƠNG MẠI BAO</div>
          <div class="a4-company-sub">
            <strong>Địa chỉ:</strong> Tòa nhà BAO Building<br/>
            <strong>Hotline:</strong> 0999 999 999 &nbsp;|&nbsp; <strong>Điện thoại:</strong> (028)123456789<br/>
            <strong>Email:</strong> [EMAIL_ADDRESS] &nbsp;|&nbsp; <strong>Website:</strong> www.baosoftware.taolao
          </div>
        </div>
        <div class="a4-meta-box">
          <div><strong>Mẫu số:</strong> 01-TT/BẢNG ĐỐI SOÁT</div>
          <div><strong>Mã đối tác:</strong> <code>${partnerCode}</code></div>
          <div><strong>Ngày in:</strong> ${currentDateStr} ${currentTimeStr}</div>
        </div>
      </div>

      <!-- Document Title -->
      <div class="a4-doc-title">
        <h2>BẢNG ĐỐI SOÁT & CHI TIẾT CÔNG NỢ ${data.isSupplier ? 'NHÀ CUNG CẤP' : 'KHÁCH HÀNG'}</h2>
        <p>(Giai đoạn đối soát: Từ ngày ${data.startVal} đến ngày ${data.endVal})</p>
      </div>

      <!-- Partner Info Card -->
      <div class="a4-partner-card">
        <div>
          <div><strong>Tên đối tác:</strong> ${data.customerName}</div>
          <div><strong>Địa chỉ:</strong> ${partnerAddress}</div>
        </div>
        <div>
          <div><strong>Số điện thoại:</strong> ${partnerPhone}</div>
          <div><strong>Mã số thuế / Email:</strong> ${partnerTaxId !== '---' ? partnerTaxId : partnerEmail}</div>
        </div>
      </div>

      <!-- 4 KPI Summary Cards -->
      <div class="a4-kpi-grid">
        <div class="a4-kpi-item">
          <span class="a4-kpi-label">1. DƯ NỢ ĐẦU KỲ</span>
          <span class="a4-kpi-val">${formatVND(data.openingBalance)}</span>
        </div>
        <div class="a4-kpi-item danger">
          <span class="a4-kpi-label">2. PHÁT SINH NỢ TRONG KỲ (+)</span>
          <span class="a4-kpi-val">+${formatVND(data.inPeriodDebtsTotal)}</span>
        </div>
        <div class="a4-kpi-item success">
          <span class="a4-kpi-label">3. ĐÃ THANH TOÁN / GIẢM (-)</span>
          <span class="a4-kpi-val">-${formatVND(data.inPeriodPaymentsTotal)}</span>
        </div>
        <div class="a4-kpi-item highlight">
          <span class="a4-kpi-label">4. CÒN NỢ CUỐI KỲ (=)</span>
          <span class="a4-kpi-val">${formatVND(data.closingBalance)}</span>
        </div>
      </div>

      <!-- Amount in Words -->
      <div class="a4-words-box">
        <strong>Số tiền còn nợ bằng chữ:</strong> <em>${wordsAmount}</em>
      </div>

      <!-- Detailed Table -->
      <table class="a4-table">
        <thead>
          <tr>
            <th style="width:3%; text-align:center;">STT</th>
            <th style="width:8.5%; text-align:center;">Ngày</th>
            <th style="width:9.5%; text-align:center;">Mã Đơn / CT</th>
            <th style="width:21%;">Nội Dung Giao Dịch & Mặt Hàng</th>
            <th style="width:5.5%; text-align:center;">ĐVT</th>
            <th style="width:4.5%; text-align:center;">SL</th>
            <th style="width:11%; text-align:right;">Đơn Giá</th>
            <th style="width:12.5%; text-align:right; color:#dc2626;">Nợ Tăng (+)</th>
            <th style="width:12.5%; text-align:right; color:#16a34a;">Giảm Trừ (-)</th>
            <th style="width:12%; text-align:right;">Dư Nợ Lũy Kế</th>
          </tr>
        </thead>
        <tbody>
          ${printRowsHtml}
        </tbody>
      </table>

      <!-- Notes & Confirmation Text -->
      <div class="a4-notes-box">
        * <strong>Ghi chú xác nhận:</strong> Hai bên cùng đối soát và thống nhất số dư công nợ tính đến ngày <strong>${data.endVal}</strong> với số tiền còn phải ${data.isSupplier ? 'trả' : 'thu'} là <strong>${formatVND(data.closingBalance)}</strong> (Bằng chữ: <em>${wordsAmount}</em>). Nếu sau 03 ngày làm việc kể từ ngày nhận được biên bản này mà Quý đối tác không có phản hồi bằng văn bản, số dư trên được mặc nhiên công nhận là hoàn toàn chính xác và có giá trị thanh toán.
      </div>

      <!-- Signatures Block -->
      <div class="a4-signatures">
        <div>
          <div class="a4-sig-title">ĐẠI DIỆN ${data.isSupplier ? 'NHÀ CUNG CẤP' : 'KHÁCH HÀNG'}</div>
          <div class="a4-sig-sub">(Ký, đóng dấu và ghi rõ họ tên)</div>
          <div class="a4-sig-name">Người duyệt / Đại diện đối tác</div>
        </div>
        <div>
          <div class="a4-sig-title">ĐẠI DIỆN CÔNG TY BAO ERP</div>
          <div class="a4-sig-sub">(Ký, đóng dấu và ghi rõ họ tên)</div>
          <div class="a4-sig-name">Kế toán / Người lập biểu</div>
        </div>
      </div>
    </div>
  `;

  // Set on-screen preview modal container
  printContainer.innerHTML = a4PrintHtml;

  // Also populate dedicated direct print container for browser print engine
  const directPrintWrapper = document.getElementById('a4-print-target-wrapper');
  if (directPrintWrapper) {
    directPrintWrapper.innerHTML = a4PrintHtml;
  }

  openModal('debt-history-modal');
}

// Ensure print wrapper always syncs before printing
window.addEventListener('beforeprint', () => {
  const directPrintWrapper = document.getElementById('a4-print-target-wrapper');
  const printContainer = document.getElementById('debt-history-print-area');
  if (directPrintWrapper && printContainer && printContainer.innerHTML.trim()) {
    directPrintWrapper.innerHTML = printContainer.innerHTML;
  }
});

function copyDebtReconciliationZaloText() {
  if (!currentReconcileDataCache) return;

  const data = currentReconcileDataCache;
  const zaloText = `📋 *BẢNG ĐỐI SOÁT & CHI TIẾT CÔNG NỢ ${data.isSupplier ? 'NHÀ CUNG CẤP' : 'KHÁCH HÀNG'}*
👤 *${data.isSupplier ? 'Nhà cung cấp:' : 'Khách hàng:'}* ${data.customerName}
📅 *Giai đoạn:* Từ ${data.startVal} đến ${data.endVal}
----------------------------------------
1️⃣ Dư nợ đầu kỳ: ${formatVND(data.openingBalance)}
2️⃣ ${data.isSupplier ? 'Nhập hàng mới trong kỳ (+):' : 'Mua nợ mới trong kỳ (+):'} +${formatVND(data.inPeriodDebtsTotal)}
3️⃣ Đã thanh toán / Giảm trừ (-): -${formatVND(data.inPeriodPaymentsTotal)}
----------------------------------------
👉 *CÒN NỢ CUỐI KỲ:* ${formatVND(data.closingBalance)}
----------------------------------------
Kính mời Quý đối tác kiểm tra và xác nhận công nợ. Trân trọng cảm ơn!`;

  navigator.clipboard.writeText(zaloText).then(() => {
    showToast('Đã sao chép nội dung đối soát công nợ gửi Zalo!', 'success');
  }).catch(() => {
    showToast('Không thể sao chép văn bản, vui lòng thử lại!', 'warning');
  });
}

async function confirmAndClearAllDebts() {
  const confirmed = confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu công nợ? Hành động này sẽ đặt toàn bộ khoản nợ về 0 và không thể hoàn tác.');
  if (!confirmed) return;

  if (window.dbProvider && typeof window.dbProvider.clearAllDebts === 'function') {
    await window.dbProvider.clearAllDebts();
  } else {
    localStorage.removeItem('ERP_LOCAL_DATABASE_V1');
  }

  await loadDebtsData();

  if (typeof showToast === 'function') {
    showToast('Đã xóa thành công tất cả dữ liệu công nợ!', 'success');
  } else {
    alert('Đã xóa thành công tất cả dữ liệu công nợ!');
  }
}


