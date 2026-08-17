/* =======================================================
   SHARED UI FUNCTIONS & UTILITIES (COMMON.JS)
   ======================================================= */

// Currency Formatter (VND)
function formatVND(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Date Formatter (DD/MM/YYYY)
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Toast Notifications
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'bi-check-circle-fill';
  if (type === 'danger') icon = 'bi-exclamation-triangle-fill';
  if (type === 'warning') icon = 'bi-exclamation-circle-fill';

  toast.innerHTML = `
    <i class="bi ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Thousand Separator Formatter (1000000 -> 1.000.000)
function formatNumberWithDots(val) {
  if (val === null || val === undefined || val === '') return '';
  const str = String(val).replace(/[^\d]/g, '');
  if (!str) return '';
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Parse string with dot thousand separators back to number (1.000.000 -> 1000000)
function parseFormattedNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleanStr = String(val).replace(/\./g, '').replace(/[^\d-]/g, '');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
}

// Attach live thousand-separator dot formatting to an input element
function formatInputWithDots(inputEl) {
  if (!inputEl || inputEl._hasDotFormatterAttached) return;
  inputEl._hasDotFormatterAttached = true;

  const handleFormatting = function() {
    const rawVal = this.value;
    const selectionStart = this.selectionStart;
    
    // Count digits before cursor
    const digitsBeforeCursor = rawVal.slice(0, selectionStart).replace(/[^\d]/g, '').length;
    
    // Format entire string
    const formatted = formatNumberWithDots(rawVal);
    this.value = formatted;
    
    // Restore cursor position based on digit count
    let newCursorPos = 0;
    let digitCount = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        digitCount++;
      }
      if (digitCount === digitsBeforeCursor) {
        newCursorPos = i + 1;
        break;
      }
    }
    if (digitsBeforeCursor === 0) newCursorPos = 0;
    
    try {
      this.setSelectionRange(newCursorPos, newCursorPos);
    } catch (err) {}
  };

  inputEl.addEventListener('input', handleFormatting);
  inputEl.addEventListener('blur', function() {
    if (this.value) {
      this.value = formatNumberWithDots(this.value);
    }
  });
}

// Initialize dot formatting for all number inputs inside a modal/container
function initModalNumberInputs(container) {
  if (!container) return;
  const inputs = container.querySelectorAll('input.format-number, input[inputmode="numeric"]');
  inputs.forEach(input => {
    formatInputWithDots(input);
    if (input.value) {
      input.value = formatNumberWithDots(input.value);
    }
  });
}

// Modal Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    initModalNumberInputs(modal);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Supabase Config Modal Logic
function initSupabaseConfigModal() {
  const configModalHtml = `
    <div class="modal-overlay" id="supabase-config-modal">
      <div class="modal-box">
        <div class="modal-header">
          <h3 class="modal-title"><i class="bi bi-database-gear text-primary"></i> Cấu hình Cơ sở Dữ liệu Supabase</h3>
          <button class="btn btn-icon" onclick="closeModal('supabase-config-modal')"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 16px;">
            Nhập <strong>Supabase URL</strong> và <strong>Anon Key</strong> để kết nối cơ sở dữ liệu thật trên Supabase. Nếu để trống, hệ thống tự động sử dụng chế độ <em>Demo Local Storage Engine</em>.
          </p>
          <div class="form-group">
            <label class="form-label">Supabase URL</label>
            <input type="text" id="supabase-url-input" class="form-control" placeholder="https://your-project.supabase.co" />
          </div>
          <div class="form-group">
            <label class="form-label">Supabase Anon Key</label>
            <textarea id="supabase-key-input" class="form-control" rows="3" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."></textarea>
          </div>
          <div style="background: var(--bg-subtle); padding: 12px; border-radius: var(--radius-md); font-size: 0.8rem;">
            <i class="bi bi-info-circle text-primary"></i> Bạn chưa chạy SQL Schema trên Supabase? Bạn có thể mở tệp <code>config/supabase-schema.sql</code> trong mã nguồn để tạo đầy đủ các bảng dữ liệu.
          </div>
        </div>
        <div class="modal-footer" style="display:flex; justify-content:space-between; align-items:center;">
          <button class="btn btn-secondary" onclick="resetDemoStorage()" style="color:#ef4444;" title="Xóa sạch dữ liệu mẫu"><i class="bi bi-trash"></i> Xóa sạch dữ liệu Demo</button>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-secondary" onclick="closeModal('supabase-config-modal')">Đóng</button>
            <button class="btn btn-primary" onclick="saveSupabaseConfig()"><i class="bi bi-check2"></i> Lưu & Kết nối</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', configModalHtml);

  // Pre-fill existing config if available
  const existingConfig = window.dbProvider ? window.dbProvider.getSavedConfig() : null;
  if (existingConfig) {
    const urlInput = document.getElementById('supabase-url-input');
    const keyInput = document.getElementById('supabase-key-input');
    if (urlInput) urlInput.value = existingConfig.url || '';
    if (keyInput) keyInput.value = existingConfig.key || '';
  }
}

function resetDemoStorage() {
  if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu mẫu trong bộ nhớ để bắt đầu hệ thống trống từ đầu?')) {
    localStorage.removeItem('ERP_LOCAL_DATABASE_V1');
    localStorage.removeItem('ERP_CATEGORY_SHIPPING_RATES');
    if (window.dbProvider && typeof window.dbProvider.purgeLegacyDummyData === 'function') {
      window.dbProvider.purgeLegacyDummyData();
    }
    showToast('Đã xóa sạch toàn bộ dữ liệu mẫu!', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 400);
  }
}

function saveSupabaseConfig() {
  const url = document.getElementById('supabase-url-input').value.trim();
  const key = document.getElementById('supabase-key-input').value.trim();

  if (window.dbProvider) {
    window.dbProvider.saveConfig(url, key);
    showToast('Đã lưu cấu hình Supabase! Hệ thống đang tải lại...', 'success');
  }
}

// Update Supabase Connection Badge Status in UI
function updateSupabaseBadge() {
  const badge = document.getElementById('supabase-status-badge');
  if (badge && window.dbProvider) {
    if (window.dbProvider.isLiveMode) {
      badge.className = 'supabase-status-badge';
      badge.innerHTML = '<i class="bi bi-lightning-charge-fill"></i> Supabase Live';
    } else {
      badge.className = 'supabase-status-badge offline';
      badge.innerHTML = '<i class="bi bi-hdd-fill"></i> Demo Engine';
    }
  }
}

// Highlight Current Navigation Link
function highlightActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Toggle Floating Action Button (FAB) Speed Dial Menu
function toggleFabMenu() {
  const container = document.getElementById('fab-container');
  if (container) {
    container.classList.toggle('active');
  }
}

// Close FAB when clicking outside
document.addEventListener('click', (e) => {
  const fabContainer = document.getElementById('fab-container');
  if (fabContainer && fabContainer.classList.contains('active')) {
    if (!fabContainer.contains(e.target)) {
      fabContainer.classList.remove('active');
    }
  }
});

// Category Shipping Rates Constants & Helpers
const SHIPPING_RATES_KEY = 'ERP_CATEGORY_SHIPPING_RATES';
const DEFAULT_CATEGORY_SHIPPING_RATES = {};

function getCategoryShippingRates() {
  try {
    const saved = localStorage.getItem(SHIPPING_RATES_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Lỗi khi đọc bảng phí vận chuyển:', e);
  }
  return { ...DEFAULT_CATEGORY_SHIPPING_RATES };
}

/**
 * Tính toán cước phí vận chuyển dựa trên Danh mục nhóm sản phẩm & Khoảng cách (km) - Chỉ dùng cước cơ bản
 * @param {string} category - Mã SKU hoặc Danh mục sản phẩm (60x60P, 50x50, Gạch, Khác...)
 * @param {number|string} distanceKm - Khoảng cách từ công ty đến cửa hàng (km)
 * @param {number} quantity - Số lượng sản phẩm
 * @param {number} orderTotal - Tổng giá trị đơn hàng
 * @param {Array} rulesList - Danh sách quy tắc từ Supabase (hoặc DB Provider)
 */
function calculateShippingFeeAdvanced(category, distanceKm, quantity = 1, orderTotal = 0, rulesList = []) {
  let dist = typeof distanceKm === 'number' ? distanceKm : parseFloat(String(distanceKm || '').replace(/[^\d.]/g, ''));
  if (isNaN(dist) || dist < 0) dist = 10; // Mặc định 10km nếu chưa có thông tin
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const targetCat = (category || 'Khác').trim();

  // Fallback to presets if rulesList empty
  const rules = (Array.isArray(rulesList) && rulesList.length > 0)
    ? rulesList.filter(r => r.is_active !== false)
    : (typeof DEFAULT_SHIPPING_RULES_PRESET !== 'undefined' ? DEFAULT_SHIPPING_RULES_PRESET : []);

  // Find best matching rule: match exact category first, then fallback to 'Khác' or 'Tất cả'
  let matchedRule = rules.find(r => 
    r.category === targetCat && 
    dist >= (Number(r.min_distance) || 0) && 
    dist <= (Number(r.max_distance) !== undefined ? Number(r.max_distance) : 9999)
  );

  if (!matchedRule) {
    matchedRule = rules.find(r => 
      (r.category === 'Khác' || r.category === 'Tất cả') && 
      dist >= (Number(r.min_distance) || 0) && 
      dist <= (Number(r.max_distance) !== undefined ? Number(r.max_distance) : 9999)
    );
  }

  // If still not matched, find any rule for category with closest bracket
  if (!matchedRule) {
    const catRules = rules.filter(r => r.category === targetCat || r.category === 'Khác');
    if (catRules.length > 0) {
      matchedRule = catRules.reduce((prev, curr) => (Number(curr.max_distance) > Number(prev.max_distance) ? curr : prev), catRules[0]);
    }
  }

  // If absolutely no rules available, fallback to basic calculation
  if (!matchedRule) {
    const simpleRates = getCategoryShippingRates();
    const rate = simpleRates[targetCat] !== undefined ? simpleRates[targetCat] : (simpleRates['Khác'] || 30000);
    const totalFee = rate * qty;
    return {
      category: targetCat,
      distanceKm: dist,
      quantity: qty,
      baseFee: rate,
      unitFee: rate,
      distanceFee: 0,
      unitFee: 0,
      totalFee: totalFee,
      isFreeShipping: false,
      threshold: 0,
      ruleName: 'Mặc định cơ bản'
    };
  }

  const baseFee = Number(matchedRule.base_fee) || 0;
  const totalFee = baseFee * qty;

  return {
    rule: matchedRule,
    category: targetCat,
    distanceKm: dist,
    quantity: qty,
    baseFee: baseFee,
    unitFee: baseFee,
    distanceFee: 0,
    unitFee: 0,
    totalFee: totalFee,
    isFreeShipping: false,
    threshold: 0,
    ruleName: matchedRule.notes || `${matchedRule.min_distance}-${matchedRule.max_distance} km`
  };
}

// Synchronize Inbound Orders to Supplier Payable Debts (Excluding Cancelled Inbounds)
function syncInboundOrdersToPayableDebts(debts, inboundOrders, customers = []) {
  if (!Array.isArray(debts)) debts = [];
  if (!Array.isArray(inboundOrders)) return debts;

  // Build a set of codes & IDs for CANCELLED inbound orders
  const cancelledCodes = new Set();
  inboundOrders.forEach(inb => {
    const s = (inb.status || '').toLowerCase();
    if (s === 'cancelled' || s === 'đã hủy') {
      if (inb.code) cancelledCodes.add(inb.code);
      if (inb.id) cancelledCodes.add(inb.id);
    }
  });

  // Filter out any payable debt records associated with cancelled inbound orders
  let updatedDebts = debts.filter(d => {
    if ((d.type || '').toLowerCase() === 'payable') {
      const matchOrderCode = d.order_code && cancelledCodes.has(d.order_code);
      const matchId = d.id && (cancelledCodes.has(d.id) || cancelledCodes.has(d.id.replace(/^d_inb_|^d_/, '')));
      const matchNotes = d.notes && Array.from(cancelledCodes).some(code => code && d.notes.includes(code));
      if (matchOrderCode || matchId || matchNotes) {
        return false; // Exclude debt for cancelled inbound
      }
    }
    return true;
  });

  inboundOrders.forEach(inb => {
    const status = (inb.status || '').toLowerCase();
    // Only process received / completed inbound orders
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
      (d.order_code && (d.order_code === code || d.order_code === inb.id)) ||
      (d.id && (d.id === inb.id || d.id === 'd_' + inb.id || d.id === 'd_inb_' + inb.id)) ||
      (d.notes && code && d.notes.includes(code))
    );

    if (existingIndex !== -1) {
      updatedDebts[existingIndex].type = 'Payable';
      if (!updatedDebts[existingIndex].customer_name) {
        updatedDebts[existingIndex].customer_name = supplierName;
      }
      if (!updatedDebts[existingIndex].total_amount || updatedDebts[existingIndex].total_amount === 0) {
        updatedDebts[existingIndex].total_amount = totalAmt;
        if (updatedDebts[existingIndex].remaining_amount === undefined || updatedDebts[existingIndex].remaining_amount === null) {
          updatedDebts[existingIndex].remaining_amount = totalAmt;
        }
      }
    } else {
      const custObj = (customers || []).find(c => c.name === supplierName);
      const custCode = custObj ? custObj.code : 'NCC-DEBT';
      const initialPaid = Math.min(totalAmt, Number(inb.paid_amount) || 0);
      const initialRemaining = Math.max(0, totalAmt - initialPaid);
      const initialStatus = initialRemaining === 0 ? 'Paid' : (initialPaid > 0 ? 'Partial' : 'Unpaid');

      const synDebt = {
        id: 'd_inb_' + (inb.id || Date.now()),
        code: 'CN-TRA-' + (code ? code.replace(/^PR/i, '') : Math.floor(1000 + Math.random() * 9000)),
        customer_name: supplierName,
        customer_code: custCode,
        order_code: code,
        items: items,
        type: 'Payable',
        total_amount: totalAmt,
        remaining_amount: initialRemaining,
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

// Vietnamese Number to Words Converter (docSoTien)
function docSoTien(soTien) {
  if (soTien === undefined || soTien === null || isNaN(soTien)) return 'Không đồng';
  soTien = Math.round(Math.abs(Number(soTien)));
  if (soTien === 0) return 'Không đồng';

  const chuSo = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const tien = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'];

  function docBlock3(so, dayDu) {
    let tram = Math.floor(so / 100);
    let chuc = Math.floor((so % 100) / 10);
    let donVi = so % 10;
    let res = '';

    if (tram > 0 || dayDu) {
      res += chuSo[tram] + ' trăm ';
    }

    if (chuc > 1) {
      res += chuSo[chuc] + ' mươi ';
      if (donVi === 1) res += 'mốt ';
      else if (donVi === 5) res += 'lăm ';
      else if (donVi > 0) res += chuSo[donVi] + ' ';
    } else if (chuc === 1) {
      res += 'mười ';
      if (donVi === 1) res += 'một ';
      else if (donVi === 5) res += 'lăm ';
      else if (donVi > 0) res += chuSo[donVi] + ' ';
    } else if (donVi > 0) {
      if (tram > 0 || dayDu) res += 'lẻ ';
      res += chuSo[donVi] + ' ';
    }

    return res;
  }

  let strSo = soTien.toString();
  let blocks = [];
  while (strSo.length > 0) {
    blocks.push(parseInt(strSo.slice(-3), 10));
    strSo = strSo.slice(0, -3);
  }

  let chuoiChu = '';
  for (let i = blocks.length - 1; i >= 0; i--) {
    let block = blocks[i];
    if (block > 0) {
      let dayDu = (i < blocks.length - 1);
      chuoiChu += docBlock3(block, dayDu) + tien[i] + ' ';
    }
  }

  chuoiChu = chuoiChu.trim();
  if (!chuoiChu) return 'Không đồng';
  chuoiChu = chuoiChu.charAt(0).toUpperCase() + chuoiChu.slice(1) + ' đồng chẵn.';
  return chuoiChu;
}

// Responsive & Collapsible Sidebar System (Desktop & Mobile)
function toggleSidebar() {
  const isMobile = window.innerWidth <= 1024;
  const container = document.querySelector('.app-container') || document.body;
  const sidebar = document.querySelector('.app-sidebar');

  if (isMobile) {
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', closeSidebar);
    }

    if (sidebar && sidebar.classList.contains('show-mobile')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  } else {
    // Desktop collapsible toggle
    const isCurrentlyCollapsed = container.classList.contains('sidebar-collapsed');
    if (isCurrentlyCollapsed) {
      container.classList.remove('sidebar-collapsed');
      localStorage.setItem('bao_erp_sidebar_collapsed', 'false');
    } else {
      container.classList.add('sidebar-collapsed');
      localStorage.setItem('bao_erp_sidebar_collapsed', 'true');
    }
    // Trigger window resize so Chart.js, tables, and graphs adjust smoothly
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }
}

function openSidebar() {
  const isMobile = window.innerWidth <= 1024;
  const container = document.querySelector('.app-container') || document.body;
  const sidebar = document.querySelector('.app-sidebar');

  if (isMobile) {
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', closeSidebar);
    }
    if (sidebar) {
      sidebar.classList.add('show-mobile');
      if (backdrop) backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  } else {
    if (container) {
      container.classList.remove('sidebar-collapsed');
      localStorage.setItem('bao_erp_sidebar_collapsed', 'false');
      setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    }
  }
}

function closeSidebar() {
  const isMobile = window.innerWidth <= 1024;
  const container = document.querySelector('.app-container') || document.body;
  const sidebar = document.querySelector('.app-sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');

  if (isMobile) {
    if (sidebar) {
      sidebar.classList.remove('show-mobile');
    }
    if (backdrop) {
      backdrop.classList.remove('active');
    }
    document.body.style.overflow = '';
  } else {
    if (container) {
      container.classList.add('sidebar-collapsed');
      localStorage.setItem('bao_erp_sidebar_collapsed', 'true');
      setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    }
  }
}

function applyStoredSidebarState() {
  if (window.innerWidth > 1024) {
    const isCollapsed = localStorage.getItem('bao_erp_sidebar_collapsed') === 'true';
    const container = document.querySelector('.app-container') || document.body;
    if (isCollapsed && container) {
      container.classList.add('sidebar-collapsed');
    }
  }
}

function initResponsiveSidebar() {
  applyStoredSidebarState();

  // Add backdrop to body
  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', closeSidebar);
  }

  // Close sidebar on navigation click if on mobile
  document.querySelectorAll('.app-sidebar .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        closeSidebar();
      }
    });
  });

  // Close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (window.innerWidth <= 1024) {
        closeSidebar();
      }
      // Close active modals
      document.querySelectorAll('.modal-overlay.active').forEach(modal => {
        modal.classList.remove('active');
      });
    }
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      const backdrop = document.querySelector('.sidebar-backdrop');
      if (backdrop) backdrop.classList.remove('active');
      document.body.style.overflow = '';
      const sidebar = document.querySelector('.app-sidebar');
      if (sidebar) sidebar.classList.remove('show-mobile');
      applyStoredSidebarState();
    }
  });
}

if (typeof window !== 'undefined') {
  window.syncInboundOrdersToPayableDebts = syncInboundOrdersToPayableDebts;
  window.docSoTien = docSoTien;
  window.toggleSidebar = toggleSidebar;
  window.openSidebar = openSidebar;
  window.closeSidebar = closeSidebar;
}

// Initialize on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNav();
  initResponsiveSidebar();
  initSupabaseConfigModal();
  updateSupabaseBadge();
  initModalNumberInputs(document.body);
});




