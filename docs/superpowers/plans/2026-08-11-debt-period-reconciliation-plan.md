# Period-Based Debt Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a period-based debt reconciliation feature ("Đối Soát Công Nợ Theo Giai Đoạn") in BAO ERP CRM to allow field sales staff to calculate opening balance, in-period debts/payments, closing balance, view a chronological running balance ledger, and generate printable statements / Zalo text summaries.

**Architecture:** Extend `debts.js` with reconciliation calculation algorithms (`calculatePeriodReconciliation`), date filter handlers (presets: 7, 14, 21, 30 days, this month, custom), dynamic table/KPI renderer for the `debt-period-reconciliation-modal`, printable view, and Zalo clipboard copy. Update `cong-no.html` with the modal markup and action buttons.

**Tech Stack:** JavaScript (ES6+), HTML5, CSS3, Bootstrap Icons, Vanilla JS.

## Global Constraints
- Pure JavaScript without heavy framework dependencies.
- Follow existing BAO ERP UI styling (`crm.css`, `debts.css`, `common.css`).
- Preserve all existing functionality in `debts.js` and `cong-no.html`.

---

### Task 1: HTML Markup for Period Debt Reconciliation Modal & Trigger Buttons

**Files:**
- Modify: `c:\Users\thaib\Máy tính\CRM\cong-no.html`

**Interfaces:**
- Consumes: Action button in `debts-tbody` table rows.
- Produces: Modal element `#debt-period-reconciliation-modal` with filter controls, KPI cards, table container, print container, and footer action buttons.

- [ ] **Step 1: Add "Đối Soát Kỳ" trigger button in `renderDebtsTable` action cell inside `debts.js`**
  - Add button `<button class="btn btn-warning" style="padding:4px 8px; font-size:0.75rem; background:#f59e0b; border-color:#d97706; color:#fff;" onclick="openDebtPeriodReconciliationModal('${c.customer_name.replace(/'/g, "\\'")}')"><i class="bi bi-sliders2-vertical"></i> Đối Soát Kỳ</button>`.

- [ ] **Step 2: Add modal HTML structure to `cong-no.html`**
  - Modal overlay `#debt-period-reconciliation-modal` with presets select `#reconcile-period-preset`, date pickers `#reconcile-date-start` and `#reconcile-date-end`, 4 mini KPI cards (`#rec-kpi-opening`, `#rec-kpi-in-debts`, `#rec-kpi-in-payments`, `#rec-kpi-closing`), ledger tbody `#reconcile-modal-tbody`, printable hidden area `#reconcile-print-area`, and action buttons (`In Bảng Đối Soát`, `Sao Chép Zalo`).

- [ ] **Step 3: Commit HTML changes**
  ```bash
  git add cong-no.html debts.js
  git commit -m "feat(debts): add HTML markup for period debt reconciliation modal"
  ```

---

### Task 2: Calculation Logic & Modal Rendering in `debts.js`

**Files:**
- Modify: `c:\Users\thaib\Máy tính\CRM\debts.js`

**Interfaces:**
- Consumes: `allDebts`, `allOrders`, `dbProvider.getCustomerHistory(customerName)`.
- Produces: `openDebtPeriodReconciliationModal(customerName)`, `filterDebtReconciliationModal()`, `handleReconciliationPresetChange()`, `printDebtReconciliationStatement()`, `copyDebtReconciliationZaloText()`.

- [ ] **Step 1: Implement `calculatePeriodReconciliation(customerName, startDate, endDate)`**
  - Calculate Opening Balance before `startDate`.
  - Calculate In-Period Debts (Invoices between `startDate` and `endDate`).
  - Calculate In-Period Payments/Reductions (Payments and return deductions between `startDate` and `endDate`).
  - Calculate Closing Balance = `Opening + Debts - Payments`.
  - Generate chronological transaction items with Running Balance (`running_balance`).

- [ ] **Step 2: Implement Preset Handlers & Input Events**
  - Support presets: `7days`, `14days`, `21days` (3 weeks default), `30days`, `this_month`, `last_month`, `all`, `custom`.
  - Auto-update date inputs on preset change and re-trigger calculation.

- [ ] **Step 3: Implement `renderReconciliationModalData` & KPI updates**
  - Update KPI cards with formatted VND values.
  - Render ledger table with rows: `[DƯ NỢ ĐẦU KỲ]`, transaction rows with badge indicators (+ Red, - Green/Yellow), and `[DƯ NỢ CUỐI KỲ]`.

- [ ] **Step 4: Implement Print & Zalo Export**
  - `printDebtReconciliationStatement()`: Generate clean printable view with dual signatures.
  - `copyDebtReconciliationZaloText()`: Copy structured summary text to clipboard and show toast.

- [ ] **Step 5: Commit JavaScript changes**
  ```bash
  git add debts.js
  git commit -m "feat(debts): implement period debt reconciliation financial calculations and modal logic"
  ```

---

### Task 3: Verification & Visual Polish

**Files:**
- Modify: `c:\Users\thaib\Máy tính\CRM\debts.css`

- [ ] **Step 1: Add CSS styling for KPI cards & ledger table styling in `debts.css`**
- [ ] **Step 2: Manual testing and verification**
  - Verify calculations (Opening + In-period Debts - In-period Payments == Closing Balance).
  - Verify preset date range changes.
  - Verify print view rendering and clipboard copy.
- [ ] **Step 3: Commit CSS & final changes**
  ```bash
  git add debts.css
  git commit -m "style(debts): enhance period debt reconciliation UI and printable layout"
  ```
