# Design Specification: Period-Based Debt Reconciliation (Đối Soát Công Nợ Theo Giai Đoạn)

## 1. Context & Business Need
In B2B CRM / Sales operations, field sales representatives visit retail customers periodically (typically every 2 to 3 weeks). Before or during a customer meeting, the sales rep needs to present a clear, itemized debt reconciliation statement covering that exact period.

The existing system provided customer purchase history and total outstanding debt, but lacked:
1. Calculation of **Opening Balance** (*Nợ đầu kỳ*) prior to a specified start date.
2. Calculation of **In-Period Sales/Debts** (*Phát sinh nợ trong kỳ*) and **In-Period Payments/Reductions** (*Phát sinh giảm trong kỳ*).
3. Calculation of **Closing Balance** (*Nợ cuối kỳ*) at the end of the specified period.
4. **Chronological Running Balance Ledger** (*Sổ cái chi tiết dư nợ lũy kế*) showing step-by-step balance changes after every invoice, payment, or return.
5. Convenient time presets for field meetings (*14 ngày / 2 tuần*, *21 ngày / 3 tuần*, *30 ngày*, *Tháng này*, etc.).
6. Professional print layout and one-click Zalo summary export.

---

## 2. Financial & Data Logic

### Data Sources
- `allOrders`: Sales orders with `created_at`, `customer_name`, `final_amount`, `payment_method`, `items`.
- `allDebts`: Debt records with `code`, `customer_name`, `total_amount`, `remaining_amount`, `due_date`, `created_at`.
- `allPayments`: Payment records from `debt_payments` with `created_at`, `customer_name`, `debt_id`, `amount`, `payment_method`, `note`.
- `allReturns`: Sales return vouchers with `created_at`, `customer_name`, `refund_amount`, `deduct_from_debt`.

### Calculations for Selected Period `[startDate, endDate]`
1. **Opening Balance (Nợ Đầu Kỳ)**
   - `Debt Before Start Date` = Sum of all invoice debt amounts created before `startDate` (00:00:00).
   - `Paid Before Start Date` = Sum of all debt payments / reductions recorded before `startDate` (00:00:00).
   - `Opening Balance = Debt Before Start Date - Paid Before Start Date`.
2. **In-Period Debts (Phát Sinh Nợ Trong Kỳ (+))**
   - Sum of all invoice/debt amounts created between `startDate` (00:00:00) and `endDate` (23:59:59).
3. **In-Period Payments (Thanh Toán / Giảm Trừ Trong Kỳ (-))**
   - Sum of all payments and debt return deductions recorded between `startDate` (00:00:00) and `endDate` (23:59:59).
4. **Closing Balance (Nợ Cuối Kỳ (=))**
   - `Closing Balance = Opening Balance + In-Period Debts - In-Period Payments`.
5. **Running Balance Ledger (Sổ Cái Dư Nợ Lũy Kế)**
   - All transactions within `[startDate, endDate]` sorted chronologically (ascending date).
   - Initial row: `[ĐẦU KỲ]` with `Balance = Opening Balance`.
   - Each transaction row:
     - Invoice: `Debt (+)`, `Balance = Balance + Invoice Amount`
     - Payment / Return: `Payment (-)`, `Balance = Balance - Payment Amount`
   - Final row: `[CUỐI KỲ]` with `Balance = Closing Balance`.

---

## 3. User Interface & Components

### 3.1. Customer Debt List Table (`cong-no.html`)
- Add action button **"Đối Soát Kỳ"** (`<button class="btn btn-warning">`) with icon `bi-sliders2-vertical` in each customer row of the debt summary table.

### 3.2. Period Reconciliation Modal (`debt-period-reconciliation-modal`)
- **Header**: "Bảng Đối Soát Công Nợ Theo Giai Đoạn - [Tên Khách Hàng]"
- **Filter Controls**:
  - Presets: `7 ngày`, `14 ngày (2 tuần)`, `21 ngày (3 tuần - Mặc định)`, `30 ngày (1 tháng)`, `Tháng này`, `Tháng trước`, `Tùy chọn`.
  - Date inputs: `purchase-period-start` and `purchase-period-end`.
- **4 KPI Cards Summary**:
  - `Nợ Đầu Kỳ`: Opening balance with status badge.
  - `Phát Sinh Nợ (+)`: Red highlight.
  - `Đã Thanh Toán (-)`: Green highlight.
  - `Nợ Cuối Kỳ (=)`: Danger/Warning text with total outstanding balance at period end.
- **Ledger Table**:
  - Columns: `STT`, `Thời Gian`, `Mã Chứng Từ`, `Loại Giao Dịch`, `Chi Tiết / Diễn Giải`, `Phát Sinh Tăng (+)` (Đỏ), `Phát Sinh Giảm (-)` (Xanh), `Dư Nợ Lũy Kế`.
- **Action Buttons**:
  - `🖨️ In Bảng Đối Soát`: Displays print-friendly layout with company header, detailed transaction table, signatures.
  - `📲 Sao Chép Zalo`: Copies clean text summary to clipboard for sending via Zalo/Viber.
  - `❌ Đóng`: Closes modal.

---

## 4. Testing & Verification Plan
1. **Financial Precision**:
   - Verify Opening Balance + In-Period Debts - In-Period Payments == Closing Balance.
   - Test edge case where customer has no transactions in period (Running balance remains constant at Opening Balance).
2. **Date Range Filtering**:
   - Test preset switching (14 days, 21 days, 30 days, custom date selection).
3. **Print & Copy Operations**:
   - Test print window invocation (`window.print()`).
   - Test Zalo text format clipboard copy and toast notification.
