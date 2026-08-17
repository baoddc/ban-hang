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
  { id: 'Won', label: 'Chốt Hợp Đồng', color: 'var(--success)' },
  { id: 'Lost', label: 'Thất Bại', color: 'var(--danger)' }
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

function populateReportFilterDropdowns(options = {}) {
  const { filterSales = 'All', filterRoute = 'All', filterCust = 'All' } = options;

  const salesSelect = document.getElementById('report-sales-select');
  const routeSelect = document.getElementById('report-route-select');
  const custSelect = document.getElementById('report-customer-select');

  // 1. Populate Sales dropdown (always contains all unique sales reps)
  if (salesSelect) {
    const currentSalesVal = filterSales !== 'All' ? filterSales : (salesSelect.value || 'All');
    const uniqueSales = Array.from(new Set(allCustomersList.map(c => c.sales_person).filter(Boolean)));
    salesSelect.innerHTML = '<option value="All">-- Tất cả Sales phụ trách --</option>' +
      uniqueSales.map(s => `<option value="${s}">${s}</option>`).join('');
    if (uniqueSales.includes(currentSalesVal)) {
      salesSelect.value = currentSalesVal;
    } else {
      salesSelect.value = 'All';
    }
  }

  // Determine customers filtered by Sales
  const activeSales = salesSelect ? salesSelect.value : 'All';
  let salesFilteredCustomers = allCustomersList;
  if (activeSales !== 'All') {
    salesFilteredCustomers = allCustomersList.filter(c => c.sales_person === activeSales);
  }

  // 2. Populate Route dropdown based on selected Sales Rep
  if (routeSelect) {
    const currentRouteVal = filterRoute !== 'All' ? filterRoute : (routeSelect.value || 'All');
    const uniqueRoutes = Array.from(new Set(salesFilteredCustomers.map(c => c.route).filter(Boolean)));
    routeSelect.innerHTML = '<option value="All">-- Tất cả tuyến công tác --</option>' +
      uniqueRoutes.map(r => `<option value="${r}">${r}</option>`).join('');
    if (uniqueRoutes.includes(currentRouteVal)) {
      routeSelect.value = currentRouteVal;
    } else {
      routeSelect.value = 'All';
    }
  }

  // Determine customers filtered by Sales AND Route
  const activeRoute = routeSelect ? routeSelect.value : 'All';
  let routeFilteredCustomers = salesFilteredCustomers;
  if (activeRoute !== 'All') {
    routeFilteredCustomers = salesFilteredCustomers.filter(c => c.route === activeRoute);
  }

  // 3. Populate Customer dropdown based on selected Sales Rep AND Route
  if (custSelect) {
    const currentCustVal = filterCust !== 'All' ? filterCust : (custSelect.value || 'All');
    custSelect.innerHTML = '<option value="All">-- Tất cả khách hàng --</option>' + 
      routeFilteredCustomers.map(c => `<option value="${c.name}">${c.code ? c.code + ' - ' : ''}${c.name}</option>`).join('');
    if (routeFilteredCustomers.some(c => c.name === currentCustVal)) {
      custSelect.value = currentCustVal;
    } else {
      custSelect.value = 'All';
    }
  }
}

function populateReportCustomerSelect() {
  populateReportFilterDropdowns();
}

function onReportSalesChange() {
  const salesSelect = document.getElementById('report-sales-select');
  const selectedSales = salesSelect ? salesSelect.value : 'All';

  // Re-populate child dropdowns (routes & customers)
  populateReportFilterDropdowns({ filterSales: selectedSales, filterRoute: 'All', filterCust: 'All' });
  generateGlobalPurchaseReport();
}

function onReportRouteChange() {
  const salesSelect = document.getElementById('report-sales-select');
  const routeSelect = document.getElementById('report-route-select');

  const selectedSales = salesSelect ? salesSelect.value : 'All';
  const selectedRoute = routeSelect ? routeSelect.value : 'All';

  // Re-populate child customer dropdown
  populateReportFilterDropdowns({ filterSales: selectedSales, filterRoute: selectedRoute, filterCust: 'All' });
  generateGlobalPurchaseReport();
}

function onReportCustomerChange() {
  generateGlobalPurchaseReport();
}

function resetReportFilters() {
  const salesSelect = document.getElementById('report-sales-select');
  const routeSelect = document.getElementById('report-route-select');
  const custSelect = document.getElementById('report-customer-select');
  const prodSearch = document.getElementById('report-product-search');
  const dStart = document.getElementById('report-date-start');
  const dEnd = document.getElementById('report-date-end');

  if (salesSelect) salesSelect.value = 'All';
  if (routeSelect) routeSelect.value = 'All';
  if (custSelect) custSelect.value = 'All';
  if (prodSearch) prodSearch.value = '';
  if (dStart) dStart.value = '';
  if (dEnd) dEnd.value = '';

  populateReportFilterDropdowns({ filterSales: 'All', filterRoute: 'All', filterCust: 'All' });
  generateGlobalPurchaseReport();
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

function isShippingFeeItem(item) {
  if (!item) return false;
  if (item.is_shipping_fee) return true;
  if (item.product_sku && (item.product_sku === 'PVC' || item.product_sku.startsWith('PVC-'))) return true;
  if (item.product_name) {
    const nameLower = item.product_name.toLowerCase();
    if (nameLower.includes('phí vận chuyển') || nameLower.includes('vận chuyển -') || nameLower.startsWith('pvc -')) {
      return true;
    }
  }
  return false;
}

async function generateGlobalPurchaseReport() {
  if (!window.dbProvider) return;

  const orders = await window.dbProvider.getOrders();
  
  // Build lookup map for customer route & sales_person
  const customerMap = {};
  allCustomersList.forEach(c => {
    customerMap[c.name] = c;
    if (c.code) customerMap[c.code] = c;
  });

  const routeFilter = document.getElementById('report-route-select') ? document.getElementById('report-route-select').value : 'All';
  const salesFilter = document.getElementById('report-sales-select') ? document.getElementById('report-sales-select').value : 'All';
  const customerFilter = document.getElementById('report-customer-select') ? document.getElementById('report-customer-select').value : 'All';
  const productSearch = document.getElementById('report-product-search') ? document.getElementById('report-product-search').value.toLowerCase().trim() : '';
  const startDateStr = document.getElementById('report-date-start') ? document.getElementById('report-date-start').value : '';
  const endDateStr = document.getElementById('report-date-end') ? document.getElementById('report-date-end').value : '';

  const startDate = startDateStr ? new Date(startDateStr + 'T00:00:00') : null;
  const endDate = endDateStr ? new Date(endDateStr + 'T23:59:59') : null;

  const reportRows = [];

  orders.forEach(order => {
    if (order.status === 'Cancelled') return;

    const custProfile = customerMap[order.customer_name] || customerMap[order.customer_code] || {};
    const route = custProfile.route || 'Chưa gán tuyến';
    const salesPerson = custProfile.sales_person || 'Chưa phân công';

    // 1. Filter Route
    if (routeFilter !== 'All' && route !== routeFilter) return;

    // 2. Filter Sales Person
    if (salesFilter !== 'All' && salesPerson !== salesFilter) return;

    // 3. Filter Customer
    if (customerFilter !== 'All' && order.customer_name !== customerFilter) return;

    // 4. Filter Date Range
    if (order.created_at) {
      const oDate = new Date(order.created_at);
      if (startDate && oDate < startDate) return;
      if (endDate && oDate > endDate) return;
    }

    // 5. Filter Items (EXCLUDE SHIPPING FEES FROM SALES & PRODUCT MERCHANDISE)
    const shipFeeVal = Number(order.shipping_fee) || 0;
    const netOrderFinal = Math.max(0, (Number(order.final_amount) || 0) - shipFeeVal);
    const items = order.items || [{ product_name: 'Chi tiết đơn ' + order.order_code, quantity: 1, unit_price: netOrderFinal, subtotal: netOrderFinal }];
    
    items.forEach(item => {
      // Exclude shipping fee sub-items
      if (isShippingFeeItem(item)) return;

      if (productSearch && !item.product_name.toLowerCase().includes(productSearch)) return;

      reportRows.push({
        customer_name: order.customer_name,
        route: route,
        sales_person: salesPerson,
        product_name: item.product_name,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        subtotal: Number(item.subtotal) || 0,
        order_code: order.order_code,
        created_at: order.created_at
      });
    });
  });

  // Calculate KPIs (Doanh số thuần không bao gồm phí vận chuyển)
  const uniqueCustomers = new Set(reportRows.map(r => r.customer_name)).size;
  const totalQty = reportRows.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalAmount = reportRows.reduce((sum, r) => sum + (r.subtotal || 0), 0);

  const kpiCust = document.getElementById('report-kpi-cust-count');
  const kpiQty = document.getElementById('report-kpi-qty-count');
  const kpiAmount = document.getElementById('report-kpi-total-amount');

  if (kpiCust) kpiCust.textContent = uniqueCustomers;
  if (kpiQty) kpiQty.textContent = totalQty;
  if (kpiAmount) kpiAmount.textContent = formatVND(totalAmount);

  // Group Summaries by Route
  const routeMap = {};
  reportRows.forEach(r => {
    if (!routeMap[r.route]) routeMap[r.route] = { customers: new Set(), total: 0 };
    routeMap[r.route].customers.add(r.customer_name);
    routeMap[r.route].total += (r.subtotal || 0);
  });

  const routeSummaryTbody = document.getElementById('report-route-summary-tbody');
  if (routeSummaryTbody) {
    const routeEntries = Object.entries(routeMap);
    if (routeEntries.length === 0) {
      routeSummaryTbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-subtle);">Chưa có dữ liệu</td></tr>`;
    } else {
      routeSummaryTbody.innerHTML = routeEntries.map(([rName, data]) => `
        <tr>
          <td><span class="badge badge-neutral" style="font-weight:600;"><i class="bi bi-geo-alt"></i> ${rName}</span></td>
          <td style="text-align:center; font-weight:700;">${data.customers.size}</td>
          <td style="text-align:right; font-weight:800; color:var(--primary);">${formatVND(data.total)}</td>
        </tr>
      `).join('');
    }
  }

  // Group Summaries by Sales Person
  const salesMap = {};
  reportRows.forEach(r => {
    if (!salesMap[r.sales_person]) salesMap[r.sales_person] = { customers: new Set(), total: 0 };
    salesMap[r.sales_person].customers.add(r.customer_name);
    salesMap[r.sales_person].total += (r.subtotal || 0);
  });

  const salesSummaryTbody = document.getElementById('report-sales-summary-tbody');
  if (salesSummaryTbody) {
    const salesEntries = Object.entries(salesMap);
    if (salesEntries.length === 0) {
      salesSummaryTbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-subtle);">Chưa có dữ liệu</td></tr>`;
    } else {
      salesSummaryTbody.innerHTML = salesEntries.map(([sName, data]) => `
        <tr>
          <td><span class="badge badge-info" style="font-weight:600;"><i class="bi bi-person-badge"></i> ${sName}</span></td>
          <td style="text-align:center; font-weight:700;">${data.customers.size}</td>
          <td style="text-align:right; font-weight:800; color:var(--success);">${formatVND(data.total)}</td>
        </tr>
      `).join('');
    }
  }

  // Render Main Report Table
  const tbody = document.getElementById('global-report-tbody');
  if (!tbody) return;

  if (reportRows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:18px;">Không tìm thấy dữ liệu mua hàng nào phù hợp với bộ lọc</td></tr>`;
    return;
  }

  tbody.innerHTML = reportRows.map((r, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${r.customer_name}</strong></td>
      <td><span class="badge badge-neutral" style="font-weight:600;"><i class="bi bi-geo-alt"></i> ${r.route}</span></td>
      <td><span class="badge badge-info" style="font-weight:600;"><i class="bi bi-person-badge"></i> ${r.sales_person}</span></td>
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
  const routeSelect = document.getElementById('report-route-select');
  const salesSelect = document.getElementById('report-sales-select');
  const custSelect = document.getElementById('report-customer-select');
  const prodSearch = document.getElementById('report-product-search');
  const dStart = document.getElementById('report-date-start');
  const dEnd = document.getElementById('report-date-end');

  if (routeSelect) routeSelect.value = 'All';
  if (salesSelect) salesSelect.value = 'All';
  if (custSelect) custSelect.value = 'All';
  if (prodSearch) prodSearch.value = '';
  if (dStart) dStart.value = '';
  if (dEnd) dEnd.value = '';

  generateGlobalPurchaseReport();
}

function formatDateTimeLocal(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function setQuickNextActivity(note, daysOffset, timeStr = '09:00') {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysOffset);

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const dateFormatted = `${year}-${month}-${day}`;

  const nextDateInput = document.getElementById('lead-next-date');
  const nextTimeInput = document.getElementById('lead-next-time');
  const nextNoteInput = document.getElementById('lead-next-note');

  if (nextDateInput) nextDateInput.value = dateFormatted;
  if (nextTimeInput) nextTimeInput.value = timeStr;
  if (nextNoteInput) nextNoteInput.value = note;
}

function clearLeadNextActivity() {
  const nextDateInput = document.getElementById('lead-next-date');
  const nextTimeInput = document.getElementById('lead-next-time');
  const nextNoteInput = document.getElementById('lead-next-note');
  if (nextDateInput) nextDateInput.value = '';
  if (nextTimeInput) nextTimeInput.value = '09:00';
  if (nextNoteInput) nextNoteInput.value = '';
}

function getDealAgingInfo(lead, stageId) {
  // Không cảnh báo ngâm đối với Deal đã chốt thành công (Won) hoặc Thất bại (Lost)
  if (stageId === 'Won' || stageId === 'Lost') {
    return { isStale: false, days: 0, cardClass: '', badgeHtml: '' };
  }

  const stageTimeStr = lead.stage_updated_at || lead.created_at;
  if (!stageTimeStr) {
    return { isStale: false, days: 0, cardClass: '', badgeHtml: '' };
  }

  const stageDate = new Date(stageTimeStr);
  if (isNaN(stageDate.getTime())) {
    return { isStale: false, days: 0, cardClass: '', badgeHtml: '' };
  }

  const now = new Date();
  const diffMs = now.getTime() - stageDate.getTime();
  const daysInStage = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (daysInStage >= 7) {
    return {
      isStale: true,
      days: daysInStage,
      cardClass: 'stale-danger',
      badgeHtml: `<span class="stale-badge-danger" title="Cơ hội bị ngâm ${daysInStage} ngày ở bước này chưa tiến triển"><i class="bi bi-flag-fill"></i> 🚩 Ngâm ${daysInStage} ngày</span>`
    };
  }

  if (daysInStage >= 3) {
    return {
      isStale: true,
      days: daysInStage,
      cardClass: 'stale-warning',
      badgeHtml: `<span class="stale-badge-warning" title="Cơ hội đã ở bước này ${daysInStage} ngày"><i class="bi bi-hourglass-split"></i> ⏳ ${daysInStage} ngày</span>`
    };
  }

  return {
    isStale: false,
    days: daysInStage,
    cardClass: '',
    badgeHtml: `<span style="font-size:0.72rem; color:var(--text-subtle);"><i class="bi bi-clock"></i> ${daysInStage === 0 ? 'Hôm nay' : daysInStage + ' ngày'}</span>`
  };
}

function renderNextActivitySnippet(lead) {
  if (!lead.next_activity_date && !lead.next_activity_note) return '';

  let badgeHtml = '';
  if (lead.next_activity_date) {
    const actDate = new Date(lead.next_activity_date);
    if (!isNaN(actDate.getTime())) {
      const now = new Date();
      const isOverdue = actDate < now;
      const isToday = actDate.toDateString() === now.toDateString();
      const tomorrow = new Date(now.getTime() + 86400000);
      const isTomorrow = tomorrow.toDateString() === actDate.toDateString();

      const timeStr = `${String(actDate.getHours()).padStart(2, '0')}:${String(actDate.getMinutes()).padStart(2, '0')}`;
      const dateStr = `${String(actDate.getDate()).padStart(2, '0')}/${String(actDate.getMonth() + 1).padStart(2, '0')}`;

      if (isOverdue) {
        badgeHtml = `<span class="activity-badge-overdue" title="Lịch hẹn đã quá hạn"><i class="bi bi-alarm-fill"></i> Quá hạn: ${dateStr} ${timeStr}</span>`;
      } else if (isToday) {
        badgeHtml = `<span class="activity-badge-today" title="Lịch hẹn hôm nay"><i class="bi bi-bell-fill"></i> Hôm nay ${timeStr}</span>`;
      } else if (isTomorrow) {
        badgeHtml = `<span class="activity-badge-upcoming" title="Lịch hẹn ngày mai"><i class="bi bi-calendar-event"></i> Ngày mai ${timeStr}</span>`;
      } else {
        badgeHtml = `<span class="activity-badge-upcoming" title="Lịch hẹn tiếp theo"><i class="bi bi-calendar-check"></i> ${dateStr} ${timeStr}</span>`;
      }
    }
  }

  return `
    <div class="activity-box">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px;">
        <span style="font-size:0.72rem; font-weight:700; color:var(--text-muted);"><i class="bi bi-calendar-event"></i> Hẹn tiếp theo:</span>
        ${badgeHtml}
      </div>
      ${lead.next_activity_note ? `
        <div style="margin-top:3px; color:var(--text-main); font-weight:600; line-height:1.35; display:flex; align-items:flex-start; gap:4px;">
          <i class="bi bi-pin-angle text-primary" style="font-size:0.8rem; margin-top:2px;"></i>
          <span>${lead.next_activity_note}</span>
        </div>
      ` : ''}
    </div>
  `;
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
          ` : stageLeads.map(lead => {
            const aging = getDealAgingInfo(lead, stage.id);
            const activityHtml = renderNextActivitySnippet(lead);

            return `
            <div class="lead-card ${aging.cardClass}">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px; gap:8px;">
                <div style="flex:1; min-width:0;">
                  <div class="lead-company-title" title="${lead.company || lead.name || 'Khách cá nhân'}">
                    <i class="bi bi-building text-primary" style="font-size:0.88rem; flex-shrink:0;"></i>
                    <span>${lead.company || lead.name || 'Khách cá nhân'}</span>
                  </div>
                </div>
                <div style="display:flex; gap:4px; flex-shrink:0;">
                  <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.72rem;" title="Sửa cơ hội" onclick="openEditLeadModal('${lead.id}')">
                    <i class="bi bi-pencil-square text-primary"></i> Sửa
                  </button>
                  <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.72rem; color:var(--danger);" title="Xóa cơ hội" onclick="deleteLeadConfirm('${lead.id}')">
                    <i class="bi bi-trash"></i> Xóa
                  </button>
                </div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <div class="lead-contact-name">
                  <i class="bi bi-person" style="font-size:0.85rem; flex-shrink:0;"></i>
                  <span>Người LH: <strong>${lead.name || 'N/A'}</strong></span>
                </div>
                ${aging.badgeHtml}
              </div>

              <div class="lead-value">${formatVND(lead.estimated_value)}</div>

              ${activityHtml}

              ${lead.notes ? `<div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:6px;">${lead.notes}</div>` : ''}
              ${lead.lost_reason ? `
                <div style="font-size:0.78rem; color:#b91c1c; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:5px 8px; margin-bottom:6px; line-height:1.35;">
                  <strong><i class="bi bi-exclamation-octagon-fill"></i> Lý do:</strong> ${lead.lost_reason}
                </div>
              ` : ''}
              
              <div class="lead-meta">
                <span><i class="bi bi-person"></i> ${lead.assigned_to || 'Chưa gán'}</span>
                <span><i class="bi bi-telephone"></i> ${lead.phone || 'N/A'}</span>
              </div>

              <div class="lead-actions" style="margin-top:8px;">
                ${getStageButtons(lead.id, stage.id)}
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function getStageButtons(leadId, currentStage) {
  let html = '';

  if (currentStage === 'Negotiation') {
    // Thương Lượng: chuyển thẳng sang Chốt Hợp Đồng hoặc Thất Bại
    html += `
      <button class="btn btn-secondary" style="padding:4px 7px;" title="Lùi lại: Gửi Báo Giá" onclick="moveLeadStage('${leadId}', 'Proposal')">
        <i class="bi bi-arrow-left"></i>
      </button>
      <button class="btn btn-success" style="background:#10b981; color:#fff; border-color:#10b981; padding:4px 9px; font-size:0.75rem; font-weight:700;" title="Chốt Hợp Đồng Thành Công" onclick="moveLeadStage('${leadId}', 'Won')">
        <i class="bi bi-check-circle-fill"></i> Chốt HĐ
      </button>
      <button class="btn btn-danger" style="background:#fee2e2; color:var(--danger); border-color:#fca5a5; padding:4px 8px; font-size:0.75rem; font-weight:700;" title="Thương lượng thất bại" onclick="promptLostLead('${leadId}')">
        <i class="bi bi-x-circle-fill"></i> Thất Bại
      </button>
    `;
    return html;
  }

  if (currentStage === 'Won') {
    html += `
      <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" title="Lùi lại: Thương Lượng" onclick="moveLeadStage('${leadId}', 'Negotiation')">
        <i class="bi bi-arrow-left"></i> Thương Lượng
      </button>
      <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem; color:var(--danger); border-color:#fca5a5;" title="Chuyển sang Thất Bại" onclick="promptLostLead('${leadId}')">
        <i class="bi bi-x-circle"></i> Thất Bại
      </button>
    `;
    return html;
  }

  if (currentStage === 'Lost') {
    html += `
      <button class="btn btn-secondary" style="padding:4px 9px; font-size:0.75rem; font-weight:600;" title="Khôi phục lại cơ hội về Thương Lượng" onclick="moveLeadStage('${leadId}', 'Negotiation')">
        <i class="bi bi-arrow-counterclockwise text-primary"></i> Khôi phục Thương Lượng
      </button>
    `;
    return html;
  }

  // Các giai đoạn trước (Lead, Contacted, Proposal)
  const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === currentStage);
  if (currentIndex > 0) {
    const prevStage = PIPELINE_STAGES[currentIndex - 1];
    html += `
      <button class="btn btn-secondary" style="padding:4px 7px;" title="Lùi lại: ${prevStage.label}" onclick="moveLeadStage('${leadId}', '${prevStage.id}')">
        <i class="bi bi-arrow-left"></i>
      </button>
    `;
  }

  if (currentIndex < PIPELINE_STAGES.length - 1) {
    const nextStage = PIPELINE_STAGES[currentIndex + 1];
    html += `
      <button class="btn btn-primary" style="padding:4px 9px; font-size:0.75rem;" title="Chuyển sang: ${nextStage.label}" onclick="moveLeadStage('${leadId}', '${nextStage.id}')">
        <i class="bi bi-arrow-right"></i> ${nextStage.label}
      </button>
    `;
  }

  html += `
    <button class="btn btn-secondary" style="padding:4px 7px; color:var(--danger); border-color:#fca5a5;" title="Đánh dấu Thất Bại" onclick="promptLostLead('${leadId}')">
      <i class="bi bi-x-lg"></i>
    </button>
  `;

  return html;
}

let pendingLostLeadId = null;

function promptLostLead(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  if (!lead) return;

  pendingLostLeadId = leadId;
  const nameEl = document.getElementById('lost-modal-lead-name');
  const compEl = document.getElementById('lost-modal-lead-company');
  const valEl = document.getElementById('lost-modal-lead-value');
  const reasonEl = document.getElementById('lost-modal-reason');

  if (compEl) compEl.textContent = lead.company || lead.name || 'Khách cá nhân';
  if (nameEl) nameEl.innerHTML = `<i class="bi bi-person"></i> Người liên hệ: <strong>${lead.name || 'N/A'}</strong>`;
  if (valEl) valEl.textContent = formatVND(lead.estimated_value || 0);
  if (reasonEl) {
    reasonEl.value = lead.lost_reason || '';
  }

  openModal('lost-reason-modal');
  setTimeout(() => {
    if (reasonEl) reasonEl.focus();
  }, 100);
}

function setLostReasonSnippet(snippet) {
  const reasonEl = document.getElementById('lost-modal-reason');
  if (!reasonEl) return;
  if (reasonEl.value.trim()) {
    reasonEl.value = reasonEl.value.trim() + '; ' + snippet;
  } else {
    reasonEl.value = snippet;
  }
  reasonEl.focus();
}

async function confirmLostReason() {
  if (!pendingLostLeadId) return;
  const reasonEl = document.getElementById('lost-modal-reason');
  const reason = reasonEl ? reasonEl.value.trim() : '';

  if (!reason) {
    showToast('Bắt buộc phải nhập nguyên nhân thất bại!', 'warning');
    if (reasonEl) reasonEl.focus();
    return;
  }

  await moveLeadStage(pendingLostLeadId, 'Lost', reason);
  closeModal('lost-reason-modal');
  pendingLostLeadId = null;
}

async function moveLeadStage(leadId, newStage, lostReason = '') {
  if (newStage === 'Lost') {
    if (!lostReason) {
      promptLostLead(leadId);
      return;
    }
  }

  await window.dbProvider.updateLeadStage(leadId, newStage, lostReason);
  if (newStage === 'Lost') {
    showToast('Đã chuyển cơ hội sang trạng thái Thất Bại!', 'warning');
  } else if (newStage === 'Won') {
    showToast('Chúc mừng! Đã chốt hợp đồng thành công!', 'success');
  } else {
    showToast('Đã cập nhật trạng thái cơ hội bán hàng!', 'success');
  }
  await loadCrmData();
}

function onLeadStageModalChange() {
  const stage = document.getElementById('lead-stage').value;
  const lostGroup = document.getElementById('lead-lost-reason-group');
  if (lostGroup) {
    if (stage === 'Lost') {
      lostGroup.style.display = 'block';
      const reasonEl = document.getElementById('lead-lost-reason');
      if (reasonEl) reasonEl.focus();
    } else {
      lostGroup.style.display = 'none';
    }
  }
}

function formatDistanceKmDisplay(val) {
  if (!val) return 'Chưa nhập';
  const str = String(val).trim();
  if (!str) return 'Chưa nhập';
  if (str.toLowerCase().includes('km')) return str;
  return str + ' km';
}

function renderCustomersTable() {
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  tbody.innerHTML = allCustomersList.map(c => {
    const distText = formatDistanceKmDisplay(c.distance_km || c.distance || c.email);
    return `
    <tr>
      <td><span class="badge badge-neutral" style="font-weight:600;"><i class="bi bi-geo-alt"></i> ${c.route || 'Chưa gán tuyến'}</span></td>
      <td><strong>${c.sales_person || c.assigned_sales || 'Chưa gán'}</strong></td>
      <td><code>${c.code || 'KH---'}</code></td>
      <td><strong>${c.name}</strong></td>
      <td>${c.phone || 'N/A'}</td>
      <td><span class="badge badge-neutral" style="font-weight:600;"><i class="bi bi-signpost-split"></i> ${distText}</span></td>
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
  `;
  }).join('');
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
  document.getElementById('lead-lost-reason').value = '';
  document.getElementById('lead-lost-reason-group').style.display = 'none';
  if (document.getElementById('lead-next-date')) document.getElementById('lead-next-date').value = '';
  if (document.getElementById('lead-next-time')) document.getElementById('lead-next-time').value = '09:00';
  if (document.getElementById('lead-next-note')) document.getElementById('lead-next-note').value = '';
  document.getElementById('lead-assigned').value = 'Kinh doanh 1';
  document.getElementById('lead-notes').value = '';

  openModal('lead-modal');
}

function openEditLeadModal(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  if (!lead) return;

  document.getElementById('lead-edit-id').value = lead.id;
  const leadTitle = lead.company ? `${lead.company} (${lead.name})` : lead.name;
  document.getElementById('lead-modal-title').innerHTML = `<i class="bi bi-pencil-square text-primary"></i> Chỉnh Sửa Cơ Hội: <strong>${leadTitle}</strong>`;
  document.getElementById('lead-btn-save-label').textContent = 'Cập Nhật Cơ Hội';

  document.getElementById('lead-name').value = lead.name || '';
  document.getElementById('lead-company').value = lead.company || '';
  document.getElementById('lead-phone').value = lead.phone || '';
  document.getElementById('lead-email').value = lead.email || '';
  document.getElementById('lead-value').value = formatNumberWithDots(lead.estimated_value);
  document.getElementById('lead-stage').value = lead.stage || 'Lead';
  document.getElementById('lead-lost-reason').value = lead.lost_reason || '';
  if (lead.stage === 'Lost') {
    document.getElementById('lead-lost-reason-group').style.display = 'block';
  } else {
    document.getElementById('lead-lost-reason-group').style.display = 'none';
  }

  // Tách ngày và giờ riêng biệt từ lead.next_activity_date
  if (lead.next_activity_date) {
    const actDate = new Date(lead.next_activity_date);
    if (!isNaN(actDate.getTime())) {
      const year = actDate.getFullYear();
      const month = String(actDate.getMonth() + 1).padStart(2, '0');
      const day = String(actDate.getDate()).padStart(2, '0');
      const hours = String(actDate.getHours()).padStart(2, '0');
      const minutes = String(actDate.getMinutes()).padStart(2, '0');
      if (document.getElementById('lead-next-date')) document.getElementById('lead-next-date').value = `${year}-${month}-${day}`;
      if (document.getElementById('lead-next-time')) document.getElementById('lead-next-time').value = `${hours}:${minutes}`;
    } else {
      if (document.getElementById('lead-next-date')) document.getElementById('lead-next-date').value = '';
      if (document.getElementById('lead-next-time')) document.getElementById('lead-next-time').value = '09:00';
    }
  } else {
    if (document.getElementById('lead-next-date')) document.getElementById('lead-next-date').value = '';
    if (document.getElementById('lead-next-time')) document.getElementById('lead-next-time').value = '09:00';
  }

  if (document.getElementById('lead-next-note')) document.getElementById('lead-next-note').value = lead.next_activity_note || '';
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
  const lostReason = document.getElementById('lead-lost-reason').value.trim();

  // Kết hợp ngày và giờ
  const nextDateVal = document.getElementById('lead-next-date') ? document.getElementById('lead-next-date').value : '';
  const nextTimeVal = document.getElementById('lead-next-time') ? (document.getElementById('lead-next-time').value || '09:00') : '09:00';
  const nextNote = document.getElementById('lead-next-note') ? document.getElementById('lead-next-note').value.trim() : '';

  let nextActivityDate = null;
  if (nextDateVal) {
    const combinedDate = new Date(`${nextDateVal}T${nextTimeVal}:00`);
    if (!isNaN(combinedDate.getTime())) {
      nextActivityDate = combinedDate.toISOString();
    }
  }

  const assigned = document.getElementById('lead-assigned').value.trim();
  const notes = document.getElementById('lead-notes').value.trim();

  if (!name && !company) {
    showToast('Vui lòng nhập tên công ty hoặc người liên hệ!', 'warning');
    return;
  }

  if (stage === 'Lost' && !lostReason) {
    showToast('Bắt buộc phải nhập nguyên nhân thất bại khi chọn trạng thái Thất Bại!', 'warning');
    document.getElementById('lead-lost-reason').focus();
    return;
  }

  if (editId) {
    const updates = {
      name, company, phone, email, estimated_value: value, stage, assigned_to: assigned, notes,
      lost_reason: stage === 'Lost' ? lostReason : '',
      next_activity_date: nextActivityDate,
      next_activity_note: nextNote
    };
    await window.dbProvider.updateLead(editId, updates);
    showToast('Cập nhật cơ hội bán hàng thành công!', 'success');
  } else {
    const newLead = {
      name: name || company, company, phone, email, estimated_value: value, assigned_to: assigned, notes, stage,
      lost_reason: stage === 'Lost' ? lostReason : '',
      next_activity_date: nextActivityDate,
      next_activity_note: nextNote,
      stage_updated_at: new Date().toISOString()
    };
    await window.dbProvider.addLead(newLead);
    showToast('Thêm cơ hội bán hàng mới thành công!', 'success');
  }

  closeModal('lead-modal');
  await loadCrmData();
}

async function deleteLeadConfirm(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  const name = lead ? (lead.company ? `${lead.company} (${lead.name})` : lead.name) : 'cơ hội này';
  
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
  document.getElementById('cust-email').value = cust.distance_km || cust.distance || cust.email || '';
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
  const editIdEl = document.getElementById('cust-edit-id');
  const codeEl = document.getElementById('cust-code');
  const nameEl = document.getElementById('cust-name');
  const routeEl = document.getElementById('cust-route');
  const salesEl = document.getElementById('cust-sales');
  const phoneEl = document.getElementById('cust-phone');
  const emailEl = document.getElementById('cust-email');
  const groupEl = document.getElementById('cust-group');
  const addressEl = document.getElementById('cust-address');

  if (!nameEl || !nameEl.value.trim()) {
    showToast('Vui lòng nhập tên khách hàng / công ty!', 'warning');
    if (nameEl) nameEl.focus();
    return;
  }

  const editId = editIdEl ? editIdEl.value : '';
  const code = codeEl ? codeEl.value.trim() : '';
  const name = nameEl.value.trim();
  const route = routeEl ? routeEl.value.trim() : '';
  const sales_person = salesEl ? salesEl.value.trim() : '';
  const phone = phoneEl ? phoneEl.value.trim() : '';
  const distance_km = emailEl ? emailEl.value.trim() : '';
  const group_name = groupEl ? groupEl.value : 'Khách thường';
  const address = addressEl ? addressEl.value.trim() : '';

  try {
    if (editId) {
      const updates = {
        code: code || 'KH' + Math.floor(100 + Math.random() * 900),
        name,
        route,
        sales_person,
        phone,
        distance_km,
        group_name,
        address
      };
      await window.dbProvider.updateCustomer(editId, updates);
      showToast('Đã cập nhật thông tin khách hàng thành công!', 'success');
    } else {
      if (code) {
        const existing = allCustomersList.find(c => c.code && c.code.toLowerCase() === code.toLowerCase());
        if (existing) {
          showToast(`Mã khách hàng "${code}" đã tồn tại! Vui lòng nhập mã khác hoặc để trống để tạo tự động.`, 'warning');
          if (codeEl) codeEl.focus();
          return;
        }
      }

      const finalCode = code || 'KH' + Math.floor(100 + Math.random() * 900);
      const newCustomer = {
        code: finalCode,
        name,
        route,
        sales_person,
        phone,
        distance_km,
        group_name,
        address,
        type: 'Customer',
        current_debt: 0
      };
      await window.dbProvider.addCustomer(newCustomer);
      showToast('Tạo hồ sơ khách hàng mới thành công!', 'success');
    }

    closeModal('customer-modal');
    await loadCrmData();
    switchCrmTab('directory');
  } catch (err) {
    console.error('Lỗi khi lưu khách hàng:', err);
    showToast(err.message || 'Không thể lưu khách hàng!', 'danger');
  }
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

  // Compute KPI summaries based on filtered timeframe (Doanh số mua hàng thuần không gồm phí vận chuyển)
  const totalPurchases = filteredOrders.reduce((sum, o) => {
    const shipFee = Number(o.shipping_fee) || 0;
    return sum + Math.max(0, (Number(o.final_amount) || 0) - shipFee);
  }, 0);
  const totalReturns = filteredReturns.reduce((sum, r) => sum + (r.total_refund || 0), 0);

  document.getElementById('cust-kpi-purchases').textContent = formatVND(totalPurchases);
  document.getElementById('cust-kpi-returns').textContent = formatVND(totalReturns);
  document.getElementById('cust-kpi-debt').textContent = formatVND(currentCustomerObj ? currentCustomerObj.current_debt || 0 : 0);

  // Extract individual purchased merchandise items list across filtered orders (excluding shipping fee)
  const purchasedProductsList = [];
  filteredOrders.forEach(o => {
    const shipFeeVal = Number(o.shipping_fee) || 0;
    const netOrderFinal = Math.max(0, (Number(o.final_amount) || 0) - shipFeeVal);
    const items = o.items || [{ product_name: 'Chi tiết đơn ' + o.order_code, quantity: 1, unit_price: netOrderFinal, subtotal: netOrderFinal }];
    items.forEach(i => {
      if (isShippingFeeItem(i)) return;
      purchasedProductsList.push({
        product_name: i.product_name,
        quantity: Number(i.quantity) || 1,
        unit_price: Number(i.unit_price) || 0,
        subtotal: Number(i.subtotal) || 0,
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
