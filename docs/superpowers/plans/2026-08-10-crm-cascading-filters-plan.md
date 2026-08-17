# CRM Cascading Filters (Sales Rep -> Work Route -> Customer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement cascading dependent dropdown filtering between `Sales Phụ Trách` → `Tuyến Công Tác` → `Khách Hàng` in `crm.html` and `crm.js`.

**Architecture:** Update filter HTML DOM order. Write dynamic helper functions in `crm.js` (`onReportSalesChange`, `onReportRouteChange`, `populateReportRouteSelect`, `populateReportCustomerSelect`) to re-calculate child options whenever parent dropdown selection changes.

**Tech Stack:** JavaScript (ES6+), HTML5, DOM Event Handling.

## Global Constraints
- Preserve exact dropdown IDs (`report-sales-select`, `report-route-select`, `report-customer-select`, `report-product-search`, `report-date-start`, `report-date-end`).
- Preserve default `'All'` options (`-- Tất cả Sales phụ trách --`, `-- Tất cả tuyến công tác --`, `-- Tất cả khách hàng --`).
- Ensure `generateGlobalPurchaseReport()` is triggered smoothly on every selection change.

---

### Task 1: Update Dropdown Layout & Event Attributes in `crm.html`

**Files:**
- Modify: `c:\Users\thaib\Máy tính\CRM\crm.html:163-195`

- [ ] **Step 1: Re-order dropdowns in `crm.html`**

Update the filter controls grid in `crm.html` so the layout order is:
1. `Sales Phụ Trách` (`#report-sales-select`) with `onchange="onReportSalesChange()"`
2. `Tuyến Công Tác` (`#report-route-select`) with `onchange="onReportRouteChange()"`
3. `Khách Hàng` (`#report-customer-select`) with `onchange="onReportCustomerChange()"`

---

### Task 2: Implement Cascading Logic & Event Handlers in `crm.js`

**Files:**
- Modify: `c:\Users\thaib\Máy tính\CRM\crm.js:31-155`

- [ ] **Step 1: Update `populateReportCustomerSelect()` to initialize cascading options**

Implement helper functions:
- `populateReportCustomerSelect(customers = allCustomersList)`
- `populateReportRouteSelect(customers = allCustomersList)`
- `populateReportSalesSelect(customers = allCustomersList)`

- [ ] **Step 2: Implement `onReportSalesChange()` and `onReportRouteChange()`**

- When `Sales Phụ Trách` changes:
  - If value is `'All'`, get all customers. Else filter `allCustomersList` where `sales_person === val`.
  - Re-populate `report-route-select` options for these customers.
  - Re-populate `report-customer-select` options for these customers.
  - Call `generateGlobalPurchaseReport()`.

- When `Tuyến Công Tác` changes:
  - Get selected sales rep and selected route.
  - Filter `allCustomersList` matching both criteria.
  - Re-populate `report-customer-select` options.
  - Call `generateGlobalPurchaseReport()`.

- [ ] **Step 3: Update `resetReportFilters()`**

Reset all dropdowns to `'All'`, call `populateReportCustomerSelect()` to rebuild full lists, and regenerate report.

---

### Task 3: End-to-End Verification & Walkthrough

- [ ] **Step 1: Verify cascading behavior**
Test selecting a Sales Rep -> check Route options update -> check Customer options update.

- [ ] **Step 2: Verify reset action**
Test clicking "Xóa Bộ Lọc" restores full list in all dropdowns.
