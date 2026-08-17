# CRM Sales Report by Work Route & Sales Rep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate filtering, column breakdown, and revenue aggregation by Work Route (`route`) and Sales Representative (`sales_person`) into `crm.html` and `crm.js`.

**Architecture:** Extend the CRM report filter UI with Route & Sales select dropdowns. Map order records to customer profiles to extract `route` and `sales_person`, apply multi-criteria filtering, render enriched table rows with badges, and generate grouped revenue summaries.

**Tech Stack:** HTML5, JavaScript (ES6+), Bootstrap Icons, CSS Custom Variables.

## Global Constraints
- Custom colors and badges must use existing design system variables (`var(--primary)`, `var(--bg-subtle)`, `badge-info`, `badge-neutral`).
- Preserve all existing filter capabilities (Customer, Product search, Date range).
- Handle missing customer routes or sales reps gracefully with fallbacks (`Chưa gán tuyến`, `Chưa phân công`).

---

### Task 1: Update HTML Structure in `crm.html`

**Files:**
- Modify: `c:\Users\thaib\Máy tính\CRM\crm.html:151-247`

- [ ] **Step 1: Add Route and Sales Rep select inputs to report filter grid**

In `crm.html` around line 164, update the grid layout from minmax 200px to accommodate two new filters:
```html
<div class="form-group" style="margin: 0;">
  <label class="form-label" style="font-size:0.8rem;">Tuyến Công Tác</label>
  <select id="report-route-select" class="form-control" onchange="generateGlobalPurchaseReport()">
    <option value="All">-- Tất cả tuyến công tác --</option>
  </select>
</div>

<div class="form-group" style="margin: 0;">
  <label class="form-label" style="font-size:0.8rem;">Sales Phụ Trách</label>
  <select id="report-sales-select" class="form-control" onchange="generateGlobalPurchaseReport()">
    <option value="All">-- Tất cả Sales phụ trách --</option>
  </select>
</div>
```

- [ ] **Step 2: Add Route & Sales Rep columns to report table header**

In `crm.html` around line 229, update `<thead>`:
```html
<thead>
  <tr>
    <th>STT</th>
    <th>Khách Hàng / Doanh Nghiệp</th>
    <th>Tuyến Công Tác</th>
    <th>Sales Phụ Trách</th>
    <th>Tên Sản Phẩm Đã Mua</th>
    <th>Số Lượng</th>
    <th>Đơn Giá</th>
    <th>Tổng Thành Tiền</th>
    <th>Đơn Hàng Gần Nhất</th>
    <th>Ngày Mua</th>
  </tr>
</thead>
```

- [ ] **Step 3: Add Grouped Revenue Summary Table/Card Section**

In `crm.html`, right above the main table card, insert a Route & Sales Revenue Group Summary section (`#report-group-summary-card`).

---

### Task 2: Update Data Processing & Logic in `crm.js`

**Files:**
- Modify: `c:\Users\thaib\Máy tính\CRM\crm.js:31-160`

- [ ] **Step 1: Update `populateReportCustomerSelect()` to populate Route and Sales Rep options**

Enhance `populateReportCustomerSelect()` in `crm.js` to extract unique routes and unique sales representatives from `allCustomersList` and populate `#report-route-select` and `#report-sales-select`.

- [ ] **Step 2: Update `generateGlobalPurchaseReport()` for Route & Sales filtering and rendering**

In `crm.js`:
- Fetch customer profile mapping (`customerMap`) using `customer_name` or `code`.
- Extract `route = cust ? cust.route : 'Chưa gán tuyến'` and `sales_person = cust ? cust.sales_person : 'Chưa phân công'`.
- Apply `#report-route-select` and `#report-sales-select` filter checks.
- Build aggregated group statistics for Route and Sales Rep.
- Render table rows including Route badge (`<span class="badge badge-neutral"><i class="bi bi-geo-alt"></i> ${r.route}</span>`) and Sales Rep badge (`<span class="badge badge-info"><i class="bi bi-person-badge"></i> ${r.sales_person}</span>`).
- Render Route & Sales Rep summary tables.

- [ ] **Step 3: Update `resetReportFilters()`**

In `crm.js`, set `report-route-select` and `report-sales-select` to `'All'` when clearing filters.

---

### Task 3: Verification & Walkthrough

- [ ] **Step 1: Verify code syntax and script integration**
Check `crm.html` and `crm.js` for formatting and correctness.

- [ ] **Step 2: Test report output with customer data**
Verify selecting specific Routes or Sales Representatives properly filters rows, updates KPIs, and calculates total sales.
