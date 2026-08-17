# CRM Cascading Filters (Sales Rep -> Work Route -> Customer) Design Spec

## 1. Overview
Implement cascading / dependent dropdown filtering logic across **Sales Phụ Trách (`sales_person`)** → **Tuyến Công Tác (`route`)** → **Khách Hàng (`customer_name`)** in `crm.html` and `crm.js`. Selecting a parent filter dynamically narrows down the available options in subsequent child dropdowns.

## 2. Core Specifications

### 2.1 UI Dropdown Hierarchy & Order (`crm.html`)
Re-order the filter controls grid in `crm-report-view` as follows:
1. `Sales Phụ Trách` (`#report-sales-select`) - Parent Level 1
2. `Tuyến Công Tác` (`#report-route-select`) - Dependent Level 2
3. `Khách Hàng` (`#report-customer-select`) - Dependent Level 3
4. `Tìm Sản Phẩm` (`#report-product-search`)
5. `Từ Ngày` (`#report-date-start`)
6. `Đến Ngày` (`#report-date-end`)
7. `Xóa Bộ Lọc` (`button`)

### 2.2 Cascading Event Handlers & Dynamic Data Population (`crm.js`)

1. **`onReportSalesChange()`**:
   - Triggered when `#report-sales-select` changes.
   - Filter `allCustomersList` by selected Sales Rep (`selectedSales`).
   - Re-populate `#report-route-select` options based ONLY on routes present in the filtered customers.
   - Re-populate `#report-customer-select` options based ONLY on customers matching selected Sales Rep and selected Route.
   - Trigger `generateGlobalPurchaseReport()`.

2. **`onReportRouteChange()`**:
   - Triggered when `#report-route-select` changes.
   - Filter `allCustomersList` by selected Sales Rep AND selected Route (`selectedRoute`).
   - Re-populate `#report-customer-select` options with matching customers.
   - Trigger `generateGlobalPurchaseReport()`.

3. **`resetReportFilters()`**:
   - Reset `#report-sales-select`, `#report-route-select`, and `#report-customer-select` to `'All'`.
   - Re-populate all dropdowns with complete, unfiltered lists.
   - Trigger `generateGlobalPurchaseReport()`.

## 3. Targeted Code Modifications

1. **`crm.html`**: Update filter grid DOM ordering to `Sales -> Route -> Customer -> Product -> Dates`.
2. **`crm.js`**:
   - Implement `populateReportRouteSelect(filteredCustomers)` and `populateReportCustomerSelect(filteredCustomers)`.
   - Implement `onReportSalesChange()` and `onReportRouteChange()`.
   - Wire event handlers in `crm.html` and `crm.js`.

## 4. Verification Plan
- Selecting a Sales Rep updates the Route dropdown to display only routes managed by that rep.
- Selecting a Route updates the Customer dropdown to display only customers in that route.
- Clearing filters restores full lists across all 3 dropdowns.
