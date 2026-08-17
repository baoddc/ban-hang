# CRM Sales Report by Work Route & Sales Representative Design Spec

## 1. Overview
Enhance the existing Global Customer Product Purchase Report in `crm.html` to integrate filtering, grouping, and breakdown analysis by **Tuyến Công Tác (Work Route)** and **Sales Phụ Trách (Assigned Sales Representative)**.

## 2. Core Functional Specifications

### 2.1 Filter Bar Updates (`crm-report-view`)
Expand the report filter grid in `crm.html` to include two new dynamic select controls:
1. **`report-route-select` (Tuyến Công Tác)**: Dropdown populated dynamically from unique customer routes. Options: `-- Tất cả tuyến công tác --` + list of routes (e.g., *Tuyến Q.1 - Q.3*, *Tuyến Q.5 - Chợ Lớn*).
2. **`report-sales-select` (Sales Phụ Trách)**: Dropdown populated dynamically from unique sales representatives. Options: `-- Tất cả Sales phụ trách --` + list of sales reps (e.g., *Nguyễn Thanh Tùng*, *Lê Thu Hà*).

### 2.2 Report Summary Table Enhancements (`custom-table`)
Update the main report table headers and dynamic row rendering in `crm.html` and `crm.js`:
- Columns:
  1. `STT`
  2. `Khách Hàng / Doanh Nghiệp`
  3. **`Tuyến Công Tác`** (Badge icon `bi-geo-alt`)
  4. **`Sales Phụ Trách`** (Badge icon `bi-person-badge`)
  5. `Tên Sản Phẩm Đã Mua`
  6. `Số Lượng`
  7. `Đơn Giá`
  8. `Tổng Thành Tiền`
  9. `Đơn Hàng Gần Nhất`
  10. `Ngày Mua`

### 2.3 Grouped Summary Cards / Aggregation Panel
Below the filter bar, add a collapsible / dedicated summary card **"Tổng Hợp Doanh Số Theo Tuyến Công Tác & Sales Phụ Trách"** displaying:
- **Doanh Số Theo Tuyến**: Grouped total revenue and customer count per Work Route.
- **Doanh Số Theo Sales**: Grouped total revenue and customer count per Sales Rep.

## 3. Targeted Code Modifications

1. **`crm.html`**:
   - Add `<select id="report-route-select">` and `<select id="report-sales-select">` to the report filter grid.
   - Update table header `<th>` elements to include `Tuyến Công Tác` and `Sales Phụ Trách`.
   - Add a summary table/card section for Route & Sales revenue totals.
2. **`crm.js`**:
   - Update `populateReportCustomerSelect()` to also populate `report-route-select` and `report-sales-select`.
   - Update `generateGlobalPurchaseReport()`:
     - Map each order to its corresponding customer profile from `allCustomersList` to retrieve `route` and `sales_person`.
     - Apply route and sales_person filter criteria.
     - Compute route-level and sales-level total revenue summaries.
     - Render updated table rows with route and sales_person columns.
     - Update `resetReportFilters()` to clear route and sales selections.

## 4. Verification Plan
- Verify filter dropdowns automatically populate with unique routes and sales reps from customer records.
- Verify filtering by Route, Sales Rep, Customer, Product, and Date Range functions accurately.
- Verify total revenue calculations match across filtered rows and KPI summaries.
