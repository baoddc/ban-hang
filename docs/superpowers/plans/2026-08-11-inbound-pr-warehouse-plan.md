# PR & Supplier Inbound Warehouse Inheritance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a PR (Purchase Request) & Inbound Order inheritance workflow in `kho-bai.html` where Technical Dept creates PR/Inbound orders and Warehouse staff inherits and fulfills them, updating stock, stock ledger, and supplier debt automatically.

**Architecture:** Extend `window.dbProvider` in `js/supabase-client.js` with `inbound_orders` data & API methods. Update `kho-bai.html` with a new "Phiếu Inbound & PR Mua Hàng" tab and two modals (Create PR & Fulfill Inbound). Write controller logic in `inventory.js`.

**Tech Stack:** HTML5, Vanilla JavaScript (ES6+), Supabase JS Client / LocalStorage fallback engine, Bootstrap Icons, Custom CSS.

## Global Constraints

- Preserve all existing functionality in `kho-bai.html`, `inventory.js`, and `js/supabase-client.js`.
- Support both Supabase live database and LocalStorage fallback engine.
- Responsive table layout and form design consistent with existing CRM design system.

---

### Task 1: Database Engine & Sample Data Extensions

**Files:**
- Modify: `js/supabase-client.js:50-54`, `js/supabase-client.js:460-500`

**Interfaces:**
- Consumes: Existing `DEFAULT_INITIAL_DATA`, `getCustomers()`, `getProducts()`
- Produces: `getInboundOrders()`, `createInboundOrder(orderData, items)`, `fulfillInboundOrder(inboundId, itemsWithReceivedQty, receivedBy, notes)`, `cancelInboundOrder(inboundId)`

- [ ] **Step 1: Add mock data to `DEFAULT_INITIAL_DATA.inbound_orders` in `js/supabase-client.js`**

```javascript
  inbound_orders: [
    {
      id: 'inb_1',
      code: 'PR20260810-01',
      supplier_id: 'c4',
      supplier_name: 'Tổng Kho Linh Kiện Nam Sài Gòn',
      created_by: 'Kỹ thuật - Nguyễn Văn Kỷ',
      expected_date: '2026-08-15',
      status: 'Pending',
      notes: 'Nhập bổ sung linh kiện máy chủ Dell PowerEdge',
      total_amount: 62000000,
      created_at: '2026-08-10T14:00:00Z',
      items: [
        { product_id: 'p5', product_sku: 'SRV-SYS-01', product_name: 'Máy Chủ Server Dell PowerEdge T150', unit: 'Cái', expected_qty: 2, received_qty: 2, cost_price: 31000000, subtotal: 62000000 }
      ]
    }
  ]
```

- [ ] **Step 2: Add database methods for `inbound_orders` to `SupabaseProvider` class**

Implement `getInboundOrders()`, `createInboundOrder()`, `fulfillInboundOrder()`, `cancelInboundOrder()`.

- [ ] **Step 3: Commit Task 1**

```bash
git add js/supabase-client.js
git commit -m "feat(db): add inbound_orders data structure and provider methods"
```

---

### Task 2: HTML Structure Updates for Inbound Tab & Header Button

**Files:**
- Modify: `kho-bai.html:84-92`, `kho-bai.html:128-136`, `kho-bai.html:170-200`

**Interfaces:**
- Consumes: Tab switching functions `switchInventoryTab(tab)`
- Produces: `#btn-tab-inbound`, `#pending-inbound-count`, `#inv-inbound-view`, `#inbound-tbody`

- [ ] **Step 1: Add "+ Tạo PR / Inbound Mới" button to Header**

In `kho-bai.html` header actions:
```html
<button class="btn btn-secondary" onclick="openCreateInboundModal()">
  <i class="bi bi-file-earmark-plus-fill"></i> + Tạo PR / Inbound (Kỹ Thuật)
</button>
```

- [ ] **Step 2: Add Tab 2 button for Inbound orders**

In `tab-navigation-bar`:
```html
<button id="btn-tab-inbound" class="pill" onclick="switchInventoryTab('inbound')">
  <i class="bi bi-truck-flatbed"></i> Phiếu Inbound & PR Mua Hàng 
  <span class="badge badge-warning" id="pending-inbound-count" style="margin-left:6px;">0</span>
</button>
```

- [ ] **Step 3: Add `#inv-inbound-view` content section**

Add table with columns: `Mã Phiếu`, `Nhà Cung Cấp`, `Người Lập (Kỹ thuật)`, `Ngày Tạo / Dự Kiến`, `Số Mặt Hàng`, `Tổng Giá Trị`, `Trạng Thái`, `Thao Tác`.

- [ ] **Step 4: Commit Task 2**

```bash
git add kho-bai.html
git commit -m "feat(ui): add PR & Inbound tab and table layout in kho-bai.html"
```

---

### Task 3: Modals for PR Creation & Inbound Fulfillment

**Files:**
- Modify: `kho-bai.html:295-303`

**Interfaces:**
- Consumes: Modal system `openModal()`, `closeModal()`
- Produces: `#create-inbound-modal`, `#fulfill-inbound-modal`

- [ ] **Step 1: Add `#create-inbound-modal` (Tạo PR / Inbound mới)**

Form inputs: Supplier select, Expected date picker, Technical creator name, Items dynamic list container (`#inbound-items-form-list`), Total price display, Notes.

- [ ] **Step 2: Add `#fulfill-inbound-modal` (Kế Thừa & Nhập Kho)**

Modal displaying order header info, item list table with editable `received_qty` numeric inputs, line subtotal calculation, receiver notes, and confirm button.

- [ ] **Step 3: Commit Task 3**

```bash
git add kho-bai.html
git commit -m "feat(ui): add modals for creating PR and fulfilling Inbound orders"
```

---

### Task 4: JavaScript Controller Logic in `inventory.js`

**Files:**
- Modify: `inventory.js:5-30`, `inventory.js:34-51`, `inventory.js:200-262`

**Interfaces:**
- Consumes: `window.dbProvider`, DOM elements from Task 2 & 3
- Produces: `renderInboundTable()`, `openCreateInboundModal()`, `addInboundItemRow()`, `removeInboundItemRow()`, `submitCreateInbound()`, `openFulfillInboundModal()`, `submitFulfillInbound()`, `handleCancelInbound()`

- [ ] **Step 1: Load and render Inbound orders data**

Update `loadInventoryData()` to fetch `allInboundOrdersList`, calculate pending count badge `#pending-inbound-count`, render `renderInboundTable()`.

- [ ] **Step 2: Implement dynamic item row additions/deletions in Create PR Modal**

`addInboundItemRow()`, `removeInboundItemRow()`, `calculateInboundTotals()`.

- [ ] **Step 3: Implement submit function `submitCreateInbound()`**

Extract form fields, build items array, invoke `dbProvider.createInboundOrder()`, show toast, refresh data.

- [ ] **Step 4: Implement fulfill function `openFulfillInboundModal()` and `submitFulfillInbound()`**

Load selected order items into fulfill modal, calculate totals dynamically when `received_qty` inputs change, invoke `dbProvider.fulfillInboundOrder()`, show toast, update inventory table, ledger table, and inbound table.

- [ ] **Step 5: Commit Task 4**

```bash
git add inventory.js
git commit -m "feat(logic): complete controller functions for PR and Inbound order workflow"
```

---

## Verification Plan

### Automated / Manual Test Steps
1. Load `kho-bai.html` -> Verify tab **"Phiếu Inbound & PR Mua Hàng"** displays badge count `1`.
2. Switch to Inbound tab -> Verify mock order `PR20260810-01` is rendered with status **`Chờ nhập kho`**.
3. Click **"+ Tạo PR / Inbound (Kỹ Thuật)"** -> Fill supplier, add 2 products with quantity and cost price -> Submit -> Confirm toast and table update.
4. Click **"Kế Thừa & Nhập Kho"** on a pending inbound order -> Adjust received quantity -> Click **"Hoàn Tất Nhập Kho"** -> Verify:
   - Order status changes to **`Đã nhập kho`**.
   - Products tab updates stock quantity.
   - Thẻ kho (Stock Ledger) records new `StockIn` transaction.
   - Payable debt recorded for supplier.
