/* =======================================================
   CRM & SALES PIPELINE LOGIC (CRM.JS)
   ======================================================= */

let allLeads = [];
let allCustomersList = [];

const PIPELINE_STAGES = [
  { id: 'Lead', label: 'Mới Tiếp Cận', color: 'var(--info)' },
  { id: 'Contacted', label: 'Đã Liên Hệ', color: 'var(--warning)' },
  { id: 'Proposal', label: 'Gửi Báo Giá', color: 'var(--accent)' },
  { id: 'Negotiation', label: 'Thương Lượng', color: 'var(--primary)' },
  { id: 'Won', label: 'Chốt Hợp Đồng', color: 'var(--success)' }
];

document.addEventListener('DOMContentLoaded', async () => {
  await loadCrmData();
});

async function loadCrmData() {
  if (!window.dbProvider) return;

  allLeads = await window.dbProvider.getLeads();
  allCustomersList = await window.dbProvider.getCustomers();

  renderKanbanBoard();
  renderCustomersTable();
  populateReportCustomerSelect();
}

function populateReportCustomerSelect() {
  const select = document.getElementById('report-customer-select');
  if (!select) return;

  select.innerHTML = '<option value="All">-- Tất cả khách hàng --</option>' + 
    allCustomersList.map(c => `<option value="${c.name}">${c.code} - ${c.name}</option>`).join('');
}

function switchCrmTab(tab) {
  const pipelineView = document.getElementById('crm-pipeline-view');
  const directoryView = document.getElementById('crm-directory-view');
  const reportView = document.getElementById('crm-report-view');

  const btnPipeline = document.getElementById('btn-tab-pipeline');
  const btnDirectory = document.getElementById('btn-tab-directory');
  const btnReport = document.getElementById('btn-tab-report');

  [pipelineView, directoryView, reportView].forEach(el => el.style.display = 'none');
  [btnPipeline, btnDirectory, btnReport].forEach(el => el.classList.remove('active'));

  if (tab === 'pipeline') {
    pipelineView.style.display = 'block';
    btnPipeline.classList.add('active');
  } else if (tab === 'directory') {
    directoryView.style.display = 'block';
    btnDirectory.classList.add('active');
  } else {
    reportView.style.display = 'block';
    btnReport.classList.add('active');
    generateGlobalPurchaseReport();
  }
}

async function generateGlobalPurchaseReport() {
  if (!window.dbProvider) return;

  const orders = await window.dbProvider.getOrders();
  
  const customerFilter = document.getElementById('report-customer-select') ? document.getElementById('report-customer-select').value : 'All';
  const productSearch = document.getElementById('report-product-search') ? document.getElementById('report-product-search').value.toLowerCase().trim() : '';
  const startDateStr = document.getElementById('report-date-start') ? document.getElementById('report-date-start').value : '';
  const endDateStr = document.getElementById('report-date-end') ? document.getElementById('report-date-end').value : '';

  const startDate = startDateStr ? new Date(startDateStr + 'T00:00:00') : null;
  const endDate = endDateStr ? new Date(endDateStr + 'T23:59:59') : null;

  const reportRows = [];

  orders.forEach(order => {
    // 1. Filter Customer
    if (customerFilter !== 'All' && order.customer_name !== customerFilter) return;

    // 2. Filter Date Range
    if (order.created_at) {
      const oDate = new Date(order.created_at);
      if (startDate && oDate < startDate) return;
      if (endDate && oDate > endDate) return;
    }

    // 3. Filter Items
    const items = order.items || [{ product_name: 'Chi tiết đơn ' + order.order_code, quantity: 1, unit_price: order.final_amount, subtotal: order.final_amount }];
    
    items.forEach(item => {
      if (productSearch && !item.product_name.toLowerCase().includes(productSearch)) return;

      reportRows.push({
        customer_name: order.customer_name,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        order_code: order.order_code,
        created_at: order.created_at
      });
    });
  });

  // Calculate KPIs
  const uniqueCustomers = new Set(reportRows.map(r => r.customer_name)).size;
  const totalQty = reportRows.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalAmount = reportRows.reduce((sum, r) => sum + (r.subtotal || 0), 0);

  const kpiCust = document.getElementById('report-kpi-cust-count');
  const kpiQty = document.getElementById('report-kpi-qty-count');
  const kpiAmount = document.getElementById('report-kpi-total-amount');

  if (kpiCust) kpiCust.textContent = uniqueCustomers;
  if (kpiQty) kpiQty.textContent = totalQty;
  if (kpiAmount) kpiAmount.textContent = formatVND(totalAmount);

  // Render Table
  const tbody = document.getElementById('global-report-tbody');
  if (!tbody) return;

  if (reportRows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:18px;">Không tìm thấy dữ liệu mua hàng nào phù hợp với bộ lọc</td></tr>`;
    return;
  }

  tbody.innerHTML = reportRows.map((r, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${r.customer_name}</strong></td>
      <td style="color:var(--primary); font-weight:700;">${r.product_name}</td>
      <td style="font-weight:800;">${r.quantity}</td>
      <td>${formatVND(r.unit_price)}</td>
      <td style="font-weight:800; color:var(--success);">${formatVND(r.subtotal)}</td>
      <td><code>${r.order_code}</code></td>
      <td>${formatDate(r.created_at)}</td>
    </tr>
  `).join('');
}

function resetReportFilters() {
  const custSelect = document.getElementById('report-customer-select');
  const prodSearch = document.getElementById('report-product-search');
  const dStart = document.getElementById('report-date-start');
  const dEnd = document.getElementById('report-date-end');

  if (custSelect) custSelect.value = 'All';
  if (prodSearch) prodSearch.value = '';
  if (dStart) dStart.value = '';
  if (dEnd) dEnd.value = '';

  generateGlobalPurchaseReport();
}

function renderKanbanBoard() {
  const board = document.getElementById('kanban-board');
  if (!board) return;

  board.innerHTML = PIPELINE_STAGES.map(stage => {
    const stageLeads = allLeads.filter(l => (l.stage || 'Lead') === stage.id);
    const stageTotalValue = stageLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

    return `
      <div class="kanban-column">
        <div class="column-header">
          <div class="column-title">
            <span style="width:10px; height:10px; border-radius:50%; background:${stage.color}; display:inline-block;"></span>
            ${stage.label}
          </div>
          <span class="column-count">${stageLeads.length}</span>
        </div>
        <div style="padding:8px 16px; font-size:0.78rem; font-weight:700; color:var(--text-muted); background:var(--bg-subtle);">
          Tổng giá trị: <span style="color:var(--primary);">${formatVND(stageTotalValue)}</span>
        </div>
        <div class="column-cards">
          ${stageLeads.length === 0 ? `
            <div style="text-align:center; padding:20px; font-size:0.8rem; color:var(--text-subtle);">Chưa có cơ hội nào</div>
          ` : stageLeads.map(lead => `
            <div class="lead-card">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                <div class="lead-name">${lead.name}</div>
                <div style="display:flex; gap:4px;">
                  <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.72rem;" title="Sửa cơ hội" onclick="openEditLeadModal('${lead.id}')">
                    <i class="bi bi-pencil-square text-primary"></i> Sửa
                  </button>
                  <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.72rem; color:var(--danger);" title="Xóa cơ hội" onclick="deleteLeadConfirm('${lead.id}')">
                    <i class="bi bi-trash"></i> Xóa
                  </button>
                </div>
              </div>
              <div class="lead-company"><i class="bi bi-building"></i> ${lead.company || 'Cá nhân'}</div>
              <div class="lead-value">${formatVND(lead.estimated_value)}</div>
              ${lead.notes ? `<div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:6px;">${lead.notes}</div>` : ''}
              
              <div class="lead-meta">
                <span><i class="bi bi-person"></i> ${lead.assigned_to || 'Chưa gán'}</span>
                <span><i class="bi bi-telephone"></i> ${lead.phone || 'N/A'}</span>
              </div>

              <div class="lead-actions" style="margin-top:8px;">
                ${getStageButtons(lead.id, stage.id)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function getStageButtons(leadId, currentStage) {
  const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === currentStage);
  let html = '';

  if (currentIndex > 0) {
    const prevStage = PIPELINE_STAGES[currentIndex - 1];
    html += `
      <button class="btn btn-secondary" title="Lùi lại: ${prevStage.label}" onclick="moveLeadStage('${leadId}', '${prevStage.id}')">
        <i class="bi bi-arrow-left"></i>
      </button>
    `;
  }

  if (currentIndex < PIPELINE_STAGES.length - 1) {
    const nextStage = PIPELINE_STAGES[currentIndex + 1];
    html += `
      <button class="btn btn-primary" title="Chuyển sang: ${nextStage.label}" onclick="moveLeadStage('${leadId}', '${nextStage.id}')">
        <i class="bi bi-arrow-right"></i> ${nextStage.label}
      </button>
    `;
  }

  return html;
}

async function moveLeadStage(leadId, newStage) {
  await window.dbProvider.updateLeadStage(leadId, newStage);
  showToast('Đã cập nhật trạng thái cơ hội bán hàng!', 'success');
  await loadCrmData();
}

function renderCustomersTable() {
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  tbody.innerHTML = allCustomersList.map(c => `
    <tr>
      <td><span class="badge badge-neutral" style="font-weight:600;"><i class="bi bi-geo-alt"></i> ${c.route || 'Chưa gán tuyến'}</span></td>
      <td><strong>${c.sales_person || c.assigned_sales || 'Chưa gán'}</strong></td>
      <td><code>${c.code || 'KH---'}</code></td>
      <td><strong>${c.name}</strong></td>
      <td>${c.phone || 'N/A'}</td>
      <td>${c.email || 'N/A'}</td>
      <td><span class="badge badge-neutral">${c.group_name || 'Khách thường'}</span></td>
      <td style="font-weight:700; color:${(c.current_debt || 0) > 0 ? 'var(--danger)' : 'var(--success)'}; text-align:right;">
        ${formatVND(c.current_debt || 0)}
      </td>
      <td style="text-align:center;">
        <div style="display:inline-flex; gap:6px;">
          <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="openEditCustomerModal('${c.id}')" title="Chỉnh sửa thông tin">
            <i class="bi bi-pencil-square text-primary"></i> Sửa
          </button>
          <button class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;" onclick="showCustomerFullLedger('${c.id}')" title="Xem lịch sử">
            <i class="bi bi-clock-history"></i> Lịch Sử
          </button>
          <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem; color:var(--danger);" onclick="deleteCustomerConfirm('${c.id}')" title="Xóa khách hàng">
            <i class="bi bi-trash"></i> Xóa
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openNewLeadModal() {
  document.getElementById('lead-edit-id').value = '';
  document.getElementById('lead-modal-title').innerHTML = '<i class="bi bi-person-badge text-primary"></i> Thêm Lead / Cơ Hội Bán Hàng';
  document.getElementById('lead-btn-save-label').textContent = 'Lưu Cơ Hội';

  document.getElementById('lead-name').value = '';
  document.getElementById('lead-company').value = '';
  document.getElementById('lead-phone').value = '';
  document.getElementById('lead-email').value = '';
  document.getElementById('lead-value').value = '';
  document.getElementById('lead-stage').value = 'Lead';
  document.getElementById('lead-assigned').value = 'Kinh doanh 1';
  document.getElementById('lead-notes').value = '';

  openModal('lead-modal');
}

function openEditLeadModal(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  if (!lead) return;

  document.getElementById('lead-edit-id').value = lead.id;
  document.getElementById('lead-modal-title').innerHTML = `<i class="bi bi-pencil-square text-primary"></i> Chỉnh Sửa Lead: <strong>${lead.name}</strong>`;
  document.getElementById('lead-btn-save-label').textContent = 'Cập Nhật Cơ Hội';

  document.getElementById('lead-name').value = lead.name || '';
  document.getElementById('lead-company').value = lead.company || '';
  document.getElementById('lead-phone').value = lead.phone || '';
  document.getElementById('lead-email').value = lead.email || '';
  document.getElementById('lead-value').value = formatNumberWithDots(lead.estimated_value);
  document.getElementById('lead-stage').value = lead.stage || 'Lead';
  document.getElementById('lead-assigned').value = lead.assigned_to || 'Kinh doanh 1';
  document.getElementById('lead-notes').value = lead.notes || '';

  openModal('lead-modal');
}

async function submitCreateLead() {
  const editId = document.getElementById('lead-edit-id').value;
  const name = document.getElementById('lead-name').value.trim();
  const company = document.getElementById('lead-company').value.trim();
  const phone = document.getElementById('lead-phone').value.trim();
  const email = document.getElementById('lead-email').value.trim();
  const value = parseFormattedNumber(document.getElementById('lead-value').value);
  const stage = document.getElementById('lead-stage').value;
  const assigned = document.getElementById('lead-assigned').value.trim();
  const notes = document.getElementById('lead-notes').value.trim();

  if (!name) {
    showToast('Vui lòng nhập tên người liên hệ!', 'warning');
    return;
  }

  if (editId) {
    const updates = {
      name, company, phone, email, estimated_value: value, stage, assigned_to: assigned, notes
    };
    await window.dbProvider.updateLead(editId, updates);
    showToast('Cập nhật cơ hội bán hàng thành công!', 'success');
  } else {
    const newLead = {
      name, company, phone, email, estimated_value: value, assigned_to: assigned, notes, stage
    };
    await window.dbProvider.addLead(newLead);
    showToast('Thêm cơ hội bán hàng mới thành công!', 'success');
  }

  closeModal('lead-modal');
  await loadCrmData();
}

async function deleteLeadConfirm(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  const name = lead ? lead.name : 'cơ hội này';
  
  if (confirm(`Bạn có chắc chắn muốn xóa cơ hội bán hàng "${name}"?`)) {
    await window.dbProvider.deleteLead(leadId);
    showToast('Đã xóa cơ hội bán hàng thành công!', 'success');
    await loadCrmData();
  }
}

async function deleteCustomerConfirm(customerId) {
  const cust = allCustomersList.find(c => c.id === customerId);
  if (!cust) return;

  const currentDebt = cust.current_debt || 0;
  if (currentDebt > 0) {
    alert(`Không thể xóa khách hàng "${cust.name}" vì vẫn còn công nợ chưa thanh toán (${formatVND(currentDebt)})!`);
    showToast(`Không thể xóa khách hàng "${cust.name}" vì vẫn còn công nợ ${formatVND(currentDebt)}!`, 'danger');
    return;
  }

  if (confirm(`Bạn có chắc chắn muốn xóa khách hàng "${cust.name}"?`)) {
    try {
      await window.dbProvider.deleteCustomer(customerId);
      showToast('Đã xóa khách hàng thành công!', 'success');
      await loadCrmData();
    } catch (err) {
      showToast(err.message || 'Không thể xóa khách hàng!', 'danger');
    }
  }
}

function openNewCustomerModal() {
  document.getElementById('cust-edit-id').value = '';
  document.getElementById('cust-modal-title').innerHTML = '<i class="bi bi-person-plus text-primary"></i> Thêm Khách Hàng Mới';
  document.getElementById('cust-btn-save-label').textContent = 'Lưu Khách Hàng';
  
  document.getElementById('cust-code').value = '';
  document.getElementById('cust-name').value = '';
  document.getElementById('cust-route').value = '';
  document.getElementById('cust-sales').value = '';
  document.getElementById('cust-phone').value = '';
  document.getElementById('cust-email').value = '';
  document.getElementById('cust-group').value = 'Khách thường';
  document.getElementById('cust-address').value = '';
  
  const debtNotice = document.getElementById('cust-debt-info-notice');
  if (debtNotice) debtNotice.style.display = 'none';

  openModal('customer-modal');
}

function openEditCustomerModal(customerId) {
  const cust = allCustomersList.find(c => c.id === customerId);
  if (!cust) return;

  document.getElementById('cust-edit-id').value = cust.id;
  document.getElementById('cust-modal-title').innerHTML = `<i class="bi bi-pencil-square text-primary"></i> Điều Chỉnh Thông Tin: <strong>${cust.name}</strong>`;
  document.getElementById('cust-btn-save-label').textContent = 'Cập Nhật Khách Hàng';

  document.getElementById('cust-code').value = cust.code || '';
  document.getElementById('cust-name').value = cust.name || '';
  document.getElementById('cust-route').value = cust.route || '';
  document.getElementById('cust-sales').value = cust.sales_person || cust.assigned_sales || '';
  document.getElementById('cust-phone').value = cust.phone || '';
  document.getElementById('cust-email').value = cust.email || '';
  document.getElementById('cust-group').value = cust.group_name || 'Khách thường';
  document.getElementById('cust-address').value = cust.address || '';

  const debtNotice = document.getElementById('cust-debt-info-notice');
  const debtVal = document.getElementById('cust-debt-val');
  if (debtNotice && debtVal) {
    debtNotice.style.display = 'block';
    debtVal.textContent = formatVND(cust.current_debt || 0);
  }

  openModal('customer-modal');
}

async function submitCreateCustomer() {
  const editId = document.getElementById('cust-edit-id').value;
  const code = document.getElementById('cust-code').value.trim();
  const name = document.getElementById('cust-name').value.trim();
  const route = document.getElementById('cust-route') ? document.getElementById('cust-route').value.trim() : '';
  const sales_person = document.getElementById('cust-sales') ? document.getElementById('cust-sales').value.trim() : '';
  const phone = document.getElementById('cust-phone').value.trim();
  const email = document.getElementById('cust-email').value.trim();
  const group_name = document.getElementById('cust-group').value;
  const address = document.getElementById('cust-address').value.trim();

  if (!name) {
    showToast('Vui lòng nhập tên khách hàng!', 'warning');
    return;
  }

  if (editId) {
    const updates = {
      code: code || 'KH' + Math.floor(100 + Math.random() * 900),
      name,
      route,
      sales_person,
      phone,
      email,
      group_name,
      address
    };
    await window.dbProvider.updateCustomer(editId, updates);
    showToast('Đã cập nhật thông tin khách hàng thành công!', 'success');
  } else {
    const newCustomer = {
      code: code || 'KH' + Math.floor(100 + Math.random() * 900),
      name, route, sales_person, phone, email, group_name, address, type: 'Customer', current_debt: 0
    };
    await window.dbProvider.addCustomer(newCustomer);
    showToast('Tạo hồ sơ khách hàng mới thành công!', 'success');
  }

  closeModal('customer-modal');
  await loadCrmData();
}

// 360° CUSTOMER FULL LEDGER LOGIC WITH DATE FILTER & PRODUCT BREAKDOWN
let currentCustomerHistoryRaw = null;
let currentCustomerObj = null;

async function showCustomerFullLedger(customerId) {
  currentCustomerObj = allCustomersList.find(c => c.id === customerId);
  if (!currentCustomerObj) return;

  document.getElementById('cust-ledger-title').innerHTML = `
    <i class="bi bi-person-lines-fill text-primary"></i> Hồ Sơ & Lịch Sử Giao Dịch: <strong>${currentCustomerObj.name}</strong>
  `;

  currentCustomerHistoryRaw = await window.dbProvider.getCustomerHistory(currentCustomerObj.name);

  // Clear date inputs
  document.getElementById('cust-date-start').value = '';
  document.getElementById('cust-date-end').value = '';

  filterCustomerHistoryByDate();
  switchCustomerSubTab('orders');
  openModal('customer-ledger-modal');
}

function resetCustomerDateFilter() {
  document.getElementById('cust-date-start').value = '';
  document.getElementById('cust-date-end').value = '';
  filterCustomerHistoryByDate();
}

function filterCustomerHistoryByDate() {
  if (!currentCustomerHistoryRaw) return;

  const startDateStr = document.getElementById('cust-date-start').value;
  const endDateStr = document.getElementById('cust-date-end').value;

  const startDate = startDateStr ? new Date(startDateStr + 'T00:00:00') : null;
  const endDate = endDateStr ? new Date(endDateStr + 'T23:59:59') : null;

  const filterByTime = (itemDateStr) => {
    if (!itemDateStr) return true;
    const itemDate = new Date(itemDateStr);
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    return true;
  };

  const filteredOrders = currentCustomerHistoryRaw.orders.filter(o => filterByTime(o.created_at));
  const filteredReturns = currentCustomerHistoryRaw.returns.filter(r => filterByTime(r.created_at));
  const filteredPayments = currentCustomerHistoryRaw.payments.filter(p => filterByTime(p.created_at));

  // Compute KPI summaries based on filtered timeframe
  const totalPurchases = filteredOrders.reduce((sum, o) => sum + (o.final_amount || 0), 0);
  const totalReturns = filteredReturns.reduce((sum, r) => sum + (r.total_refund || 0), 0);

  document.getElementById('cust-kpi-purchases').textContent = formatVND(totalPurchases);
  document.getElementById('cust-kpi-returns').textContent = formatVND(totalReturns);
  document.getElementById('cust-kpi-debt').textContent = formatVND(currentCustomerObj ? currentCustomerObj.current_debt || 0 : 0);

  // Extract individual purchased items list across filtered orders
  const purchasedProductsList = [];
  filteredOrders.forEach(o => {
    const items = o.items || [{ product_name: 'Chi tiết đơn ' + o.order_code, quantity: 1, unit_price: o.final_amount, subtotal: o.final_amount }];
    items.forEach(i => {
      purchasedProductsList.push({
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        subtotal: i.subtotal,
        order_code: o.order_code,
        created_at: o.created_at
      });
    });
  });

  document.getElementById('cust-orders-count').textContent = filteredOrders.length;
  document.getElementById('cust-products-count').textContent = purchasedProductsList.length;
  document.getElementById('cust-returns-count').textContent = filteredReturns.length;
  document.getElementById('cust-payments-count').textContent = filteredPayments.length;

  // Render Orders Tab
  const ordersTbody = document.getElementById('cust-orders-tbody');
  ordersTbody.innerHTML = filteredOrders.length === 0 ? `
    <tr><td colspan="6" style="text-align:center; padding:12px;">Không có đơn bán hàng nào trong khoảng thời gian này</td></tr>
  ` : filteredOrders.map(o => `
    <tr>
      <td><strong>${o.order_code}</strong></td>
      <td style="font-weight:700; color:var(--primary);">${formatVND(o.final_amount)}</td>
      <td style="color:var(--success);">${formatVND(o.paid_amount)}</td>
      <td style="color:var(--danger);">${formatVND(o.debt_amount)}</td>
      <td><span class="badge badge-info">${o.payment_method}</span></td>
      <td>${formatDate(o.created_at)}</td>
    </tr>
  `).join('');

  // Render Products Breakdown Tab
  const prodsTbody = document.getElementById('cust-products-tbody');
  prodsTbody.innerHTML = purchasedProductsList.length === 0 ? `
    <tr><td colspan="6" style="text-align:center; padding:12px;">Không có sản phẩm nào được mua trong khoảng thời gian này</td></tr>
  ` : purchasedProductsList.map(p => `
    <tr>
      <td><strong>${p.product_name}</strong></td>
      <td style="font-weight:700; color:var(--primary);">${p.quantity}</td>
      <td>${formatVND(p.unit_price)}</td>
      <td style="font-weight:700;">${formatVND(p.subtotal)}</td>
      <td><code>${p.order_code}</code></td>
      <td>${formatDate(p.created_at)}</td>
    </tr>
  `).join('');

  // Render Returns Tab
  const returnsTbody = document.getElementById('cust-returns-tbody');
  returnsTbody.innerHTML = filteredReturns.length === 0 ? `
    <tr><td colspan="6" style="text-align:center; padding:12px;">Không có giao dịch trả hàng nào trong khoảng thời gian này</td></tr>
  ` : filteredReturns.map(r => `
    <tr>
      <td><strong>${r.return_code}</strong></td>
      <td><code>${r.order_code}</code></td>
      <td style="font-weight:700; color:var(--warning);">${formatVND(r.total_refund)}</td>
      <td><span class="badge badge-neutral">${r.refund_method === 'DebtDeduction' ? 'Trừ Công Nợ' : 'Hoàn Tiền'}</span></td>
      <td>${r.reason || 'N/A'}</td>
      <td>${formatDate(r.created_at)}</td>
    </tr>
  `).join('');

  // Render Debt Payments Tab
  const paymentsTbody = document.getElementById('cust-payments-tbody');
  paymentsTbody.innerHTML = filteredPayments.length === 0 ? `
    <tr><td colspan="6" style="text-align:center; padding:12px;">Không có phiếu thanh toán nợ nào trong khoảng thời gian này</td></tr>
  ` : filteredPayments.map(p => `
    <tr>
      <td><strong>${p.payment_code}</strong></td>
      <td>Mã nợ ID: ${p.debt_id}</td>
      <td style="font-weight:700; color:var(--success);">${formatVND(p.amount)}</td>
      <td><span class="badge ${p.payment_method === 'DebtDeduction' ? 'badge-warning' : 'badge-success'}">${p.payment_method === 'Bank' ? 'Chuyển Khoản' : (p.payment_method === 'DebtDeduction' ? 'Khấu Trừ Trả Hàng' : (p.payment_method === 'Cash' ? 'Tiền Mặt' : p.payment_method))}</span></td>
      <td>${p.note || ''}</td>
      <td>${formatDate(p.created_at)}</td>
    </tr>
  `).join('');
}

function switchCustomerSubTab(subtab) {
  const tabOrders = document.getElementById('cust-subtab-orders');
  const tabProducts = document.getElementById('cust-subtab-products');
  const tabReturns = document.getElementById('cust-subtab-returns');
  const tabPayments = document.getElementById('cust-subtab-payments');

  const btnOrders = document.getElementById('btn-cust-tab-orders');
  const btnProducts = document.getElementById('btn-cust-tab-products');
  const btnReturns = document.getElementById('btn-cust-tab-returns');
  const btnPayments = document.getElementById('btn-cust-tab-payments');

  // Reset all
  [tabOrders, tabProducts, tabReturns, tabPayments].forEach(el => el.style.display = 'none');
  [btnOrders, btnProducts, btnReturns, btnPayments].forEach(el => el.classList.remove('active'));

  if (subtab === 'orders') {
    tabOrders.style.display = 'block';
    btnOrders.classList.add('active');
  } else if (subtab === 'products') {
    tabProducts.style.display = 'block';
    btnProducts.classList.add('active');
  } else if (subtab === 'returns') {
    tabReturns.style.display = 'block';
    btnReturns.classList.add('active');
  } else {
    tabPayments.style.display = 'block';
    btnPayments.classList.add('active');
  }
}
