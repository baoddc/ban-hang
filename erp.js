/* =======================================================
   ERP DASHBOARD LOGIC (ERP.JS)
   ======================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboardData();
});

async function loadDashboardData() {
  if (!window.dbProvider) return;

  const orders = await window.dbProvider.getOrders();
  const products = await window.dbProvider.getProducts();
  const debts = await window.dbProvider.getDebts();
  const leads = await window.dbProvider.getLeads();

  // 1. Compute KPIs
  const totalRevenue = orders.reduce((sum, o) => sum + (o.final_amount || 0), 0);
  const totalReceivables = debts.filter(d => d.type === 'Receivable').reduce((sum, d) => sum + (d.remaining_amount || 0), 0);
  const inventoryValuation = products.reduce((sum, p) => sum + ((p.cost_price || 0) * (p.stock_quantity || 0)), 0);
  const activeLeadsCount = leads.length;

  document.getElementById('kpi-revenue').textContent = formatVND(totalRevenue);
  document.getElementById('kpi-receivables').textContent = formatVND(totalReceivables);
  document.getElementById('kpi-inventory-val').textContent = formatVND(inventoryValuation);
  document.getElementById('kpi-leads-count').textContent = activeLeadsCount;

  // 2. Render Charts
  renderRevenueChart(orders);
  renderInventoryChart(products);

  // 3. Render Tables
  renderRecentOrders(orders);
  renderLowStockAlerts(products);
}

let revenueChartInstance = null;
let inventoryChartInstance = null;

function renderRevenueChart(orders) {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  if (revenueChartInstance) {
    revenueChartInstance.destroy();
  }

  const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  const revenueData = new Array(12).fill(0);

  if (Array.isArray(orders)) {
    orders.forEach(o => {
      if (o.created_at && o.status !== 'Cancelled') {
        const date = new Date(o.created_at);
        if (!isNaN(date.getTime())) {
          const month = date.getMonth(); // 0 - 11
          revenueData[month] += (o.final_amount || 0) / 1000000;
        }
      }
    });
  }

  const formattedRevenueData = revenueData.map(v => Math.round(v * 100) / 100);

  revenueChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Doanh thu (Triệu VNĐ)',
          data: formattedRevenueData,
          backgroundColor: 'rgba(59, 130, 246, 0.75)',
          borderColor: '#3b82f6',
          borderWidth: 2,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(226, 232, 240, 0.5)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function renderInventoryChart(products) {
  const ctx = document.getElementById('inventoryChart');
  if (!ctx) return;

  if (inventoryChartInstance) {
    inventoryChartInstance.destroy();
  }

  const categoryMap = {};
  products.forEach(p => {
    const cat = p.category || 'Khác';
    categoryMap[cat] = (categoryMap[cat] || 0) + (p.stock_quantity || 0);
  });

  const labels = Object.keys(categoryMap);
  const data = Object.values(categoryMap);

  inventoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recent-orders-tbody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Chưa có đơn hàng nào</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.slice(0, 5).map(o => `
    <tr>
      <td><strong>${o.order_code}</strong></td>
      <td>${o.customer_name}</td>
      <td style="font-weight:700; color:var(--primary);">${formatVND(o.final_amount)}</td>
      <td><span class="badge badge-success">${o.status}</span></td>
      <td>${formatDate(o.created_at)}</td>
    </tr>
  `).join('');
}

function renderLowStockAlerts(products) {
  const tbody = document.getElementById('low-stock-tbody');
  if (!tbody) return;

  const lowStock = products.filter(p => p.stock_quantity <= (p.min_stock_alert || 5));

  if (lowStock.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--success);">Tất cả sản phẩm đều đủ tồn kho!</td></tr>`;
    return;
  }

  tbody.innerHTML = lowStock.map(p => `
    <tr>
      <td><code>${p.sku}</code></td>
      <td><strong>${p.name}</strong></td>
      <td style="color:var(--danger); font-weight:800;">${p.stock_quantity} ${p.unit}</td>
      <td>${p.min_stock_alert} ${p.unit}</td>
      <td><span class="badge badge-danger"><i class="bi bi-exclamation-triangle"></i> Sắp hết</span></td>
    </tr>
  `).join('');
}
