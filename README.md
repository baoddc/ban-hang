# 🏢 BAO ERP & CRM Enterprise Suite

> **Hệ thống Quản trị Doanh nghiệp Toàn diện (ERP - CRM - POS - Kho Bãi - Công Nợ - Phí Vận Chuyển)**  
> Thiết kế chuẩn Modern UI/UX, tối ưu cho tốc độ tải trang, vận hành theo mô hình **Dual-Engine** (Offline LocalStorage Fallback & Real-time Supabase Cloud Database).

---

## 🌟 Điểm Nổi Bật (Key Features)

- ⚡ **Kiến trúc Dual-Engine**: Chạy ngay tức thì ở chế độ Demo/Offline với LocalStorage hoặc kết nối trực tiếp đến Cloud Database **Supabase (PostgreSQL)** với chỉ 1 click.
- 🎨 **Modern Design System**: Giao diện thiết kế theo chuẩn doanh nghiệp cao cấp (CSS Design Tokens, Dark/Light accents, Glassmorphism, Micro-animations, Responsive Mobile/Tablet/Desktop).
- 🧾 **Bán Hàng & POS Siêu Tốc**: Tìm kiếm nhanh SKU/Barcode, bộ lọc danh mục, Mini-cart trôi nổi trên Mobile, tính phí vận chuyển tự động, in hóa đơn trực tiếp.
- 📊 **Quản Lý & Đối Soát Công Nợ**: Theo dõi nợ phải thu (Khách hàng) và nợ phải trả (Nhà cung cấp), tính năng **Đối Soát Kỳ** (7/14/21/30 ngày hoặc tùy chỉnh), in biên bản đối soát chuẩn A4, sao chép báo cáo gửi Zalo tiện lợi.
- 🎯 **CRM & Sales Pipeline**: Quản lý khách hàng tiềm năng qua mô hình Kanban trực quan, phân tích nguyên nhân thất bại (Lost Reason), gán nhân viên phụ trách & tuyến bán hàng.
- 📦 **Quản Lý Kho & Nhập Hàng (PR)**: Quản lý danh mục sản phẩm, cảnh báo tồn kho tối thiểu, tạo phiếu nhập kho mua hàng từ nhà cung cấp, theo dõi biến động kho.
- 🚚 **Định Mức Cước Phí Vận Chuyển**: Cấu hình quy tắc tính cước nhiều tầng linh hoạt (theo khối lượng, khoảng cách km, tuyến/tỉnh thành, giá trị đơn hàng).

---

## 🏗️ Cấu Trúc Thư Mục Dự Án (Project Structure)

Dự án được tổ chức theo chuẩn **Modular Clean Architecture**, tách biệt rõ ràng giữa tầng Giao diện (HTML), Tầng Định kiểu (CSS), Tầng Xử lý Nghiệp vụ (JS) và Cơ sở Dữ liệu (SQL/Config):

```text
CRM/
├── 📄 index.html              # Trang chủ: Tổng quan Dashboard ERP & Biểu đồ KPI
├── 📄 ban-hang.html           # Phân hệ: Bán Hàng & Điểm bán lẻ (POS)
├── 📄 cong-no.html            # Phân hệ: Quản lý Công Nợ & Đối Soát Kỳ
├── 📄 crm.html                # Phân hệ: CRM Khách Hàng & Pipeline Bán Hàng
├── 📄 kho-bai.html            # Phân hệ: Quản Lý Kho Bãi & Nhà Cung Cấp
├── 📄 phi-van-chuyen.html     # Phân hệ: Quản Lý Quy Tắc Cước Vận Chuyển
├── 📄 phat-mau.html           # Phân hệ: Quản Lý Phát Mẫu Sản Phẩm Cho Cửa Hàng
│
├── 📂 css/                    # Tầng Định Kiểu & Design System
│   ├── common.css             # Core Design System, Variables, Sidebar, Modal, Badges
│   ├── erp.css                # Styles riêng cho ERP Dashboard
│   ├── sales.css              # Styles cho module Bán Hàng & POS
│   ├── debts.css              # Styles cho module Quản Lý Công Nợ
│   ├── crm.css                # Styles cho module CRM & Kanban Pipeline
│   ├── inventory.css          # Styles cho module Kho Bãi & Nhà Cung Cấp
│   ├── shipping.css           # Styles cho module Phí Vận Chuyển
│   └── samples.css            # Styles cho module Phát Mẫu Sản Phẩm
│
├── 📂 js/                     # Tầng Logic Nghiệp Vụ & Data Layer
│   ├── supabase-client.js     # Data Access Layer: Dual-engine Provider (Supabase + LocalStorage)
│   ├── common.js              # Shared Utilities (Toast, Modal, Formatters, Navigation)
│   ├── erp.js                 # Xử lý số liệu Dashboard & Chart.js
│   ├── sales.js               # Xử lý POS, Giỏ hàng, Tính cước, Xuất đơn hàng
│   ├── debts.js               # Xử lý sổ nợ, Thu/Chi nợ, Đối soát kỳ, In ấn A4
│   ├── crm.js                 # Xử lý Leads, Khách hàng, Kanban kéo thả, Tuyến bán hàng
│   ├── inventory.js           # Xử lý Phiếu nhập kho, Tồn kho, Nhà cung cấp
│   ├── shipping.js            # Engine tính cước vận chuyển tự động
│   └── samples.js             # Xử lý theo dõi phát mẫu, ma trận cửa hàng & in biên bản giao nhận
│
├── 📂 config/                 # Cấu hình & Kịch bản Database
│   └── supabase-schema.sql    # Toàn bộ SQL Schema & Migration script cho Supabase
│
├── 📂 docs/                   # Tài liệu thiết kế & Đặc tả kỹ thuật
├── 📄 .editorconfig           # Chuẩn hóa format code giữa các IDE
├── 📄 .gitattributes          # Chuẩn hóa Line Endings (LF/CRLF) cho Git
├── 📄 .gitignore              # Loại bỏ file rác, file OS, bảo mật thông tin
├── 📄 LICENSE                 # Giấy phép mã nguồn mở MIT
└── 📄 README.md               # Tài liệu tổng quan & Hướng dẫn sử dụng
```

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ | Chi tiết |
| :--- | :--- | :--- |
| **Frontend Core** | HTML5, Modern CSS3, Vanilla JavaScript (ES6+) | Không phụ thuộc framework nặng, tải nhanh tức thì (< 100ms) |
| **Styling** | Custom CSS Variables, Flexbox/Grid, Glassmorphism | Độc lập, không cần Node build tool / Tailwind compiler |
| **Icons** | [Bootstrap Icons v1.11.3](https://icons.getbootstrap.com/) | CDN trực tiếp, sắc nét, đồng bộ |
| **Charts** | [Chart.js](https://www.chartjs.org/) | Trực quan hóa doanh thu, top sản phẩm, tỉ lệ chốt sale |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL v15+) | REST API, Row Level Security, Real-time Cloud |
| **Offline Storage** | Web Storage API (localStorage) | Đảm bảo hệ thống luôn hoạt động kể cả khi mất kết nối |

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án (Getting Started)

### 1. Chạy Trực Tiếp Ở Local (Môi trường phát triển)
Vì dự án sử dụng kiến trúc chuẩn Web tiêu chuẩn, bạn không cần cài đặt Node.js hay chạy lệnh `npm install`.

- **Cách 1 (VSCode Live Server - Khuyên dùng):**
  1. Cài Extension **Live Server** trên VSCode.
  2. Click chuột phải vào `index.html` và chọn **Open with Live Server**.
  3. Ứng dụng sẽ tự động mở tại `http://127.0.0.1:5500/index.html`.

- **Cách 2 (Mở trực tiếp trên trình duyệt):**
  - Nhấp đúp chuột trực tiếp vào file `index.html` trong thư mục máy tính.

---

### 2. Thiết Lập Cơ Sở Dữ Liệu Supabase (Cloud Database)

Để kết nối dữ liệu đám mây thời gian thực với Supabase:

1. Đăng nhập vào [Supabase Console](https://supabase.com/dashboard) và tạo một **Project** mới.
2. Vào mục **SQL Editor** trong thanh menu bên trái -> Bấm **New query**.
3. Mở file [config/supabase-schema.sql](config/supabase-schema.sql), sao chép toàn bộ nội dung và dán vào SQL Editor.
4. Nhấn nút **Run** (hoặc tổ hợp phím `Ctrl + Enter`) để tạo toàn bộ bảng, quan hệ khóa ngoại (Foreign Keys), hàm tự động và dữ liệu mẫu.
5. Vào **Project Settings** -> **API**, sao chép:
   - **Project URL**
   - **anon / public key**
6. Mở hệ thống ERP trên trình duyệt -> Click vào biểu tượng **⚡ Cấu hình Database** ở góc trên bên phải thanh menu:
   - Dán **Project URL** và **Anon Key**.
   - Bấm **Lưu & Kết Nối**.
   - Hệ thống sẽ chuyển sang trạng thái `⚡ Supabase Live Connected`.

---

## 🌐 Triển Khai Lên Web (Deployment)

Dự án hoàn toàn tương thích và có thể deploy miễn phí 100% lên:

### GitHub Pages:
1. Push toàn bộ mã nguồn lên repository GitHub của bạn.
2. Vào **Settings** -> **Pages** -> Tại mục **Branch**, chọn `main` / `root` -> Bấm **Save**.
3. Website của bạn sẽ hoạt động trực tiếp tại `https://<username>.github.io/<repo-name>/`.

### Vercel / Netlify:
- Kéo thả trực tiếp thư mục dự án hoặc liên kết GitHub Repository, hệ thống sẽ tự động publish trong 5 giây mà không cần cấu hình build step.

---

## 🔒 Bảo Mật & Best Practices

- **Zero-Secret Hardcoding**: Mã nguồn không chứa bất kỳ API Key hay thông tin xác thực nhạy cảm nào.
- **Client-Side Secure Key Storage**: Khóa API Supabase được lưu cục bộ trên trình duyệt người dùng qua `localStorage` và chỉ gọi qua HTTPS.
- **Sanitized Payloads**: Toàn bộ thao tác ghi dữ liệu đều được kiểm tra UUID hợp lệ trước khi gửi lên Supabase.

---

## 📄 Bản Quyền & Giấy Phép (License)

Dự án được phát hành dưới giấy phép [MIT License](LICENSE). Tự do sử dụng, chỉnh sửa và triển khai cho các mục đích thương mại và cá nhân.
