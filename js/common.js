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
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('supabase-config-modal')">Đóng</button>
          <button class="btn btn-primary" onclick="saveSupabaseConfig()"><i class="bi bi-check2"></i> Lưu & Kết nối</button>
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

// Initialize on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNav();
  initSupabaseConfigModal();
  updateSupabaseBadge();
  initModalNumberInputs(document.body);
});
