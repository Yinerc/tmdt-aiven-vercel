# Chuyển website PHP TMDT sang Next.js

Gói này tạo lại các trang PHP trong thư mục `TMDT` bằng Next.js App Router.

## 1. Bảng ánh xạ PHP sang Next.js

| PHP cũ | Next.js mới |
|---|---|
| `admin/login.php` | `app/admin/login/page.jsx` |
| `admin/logout.php` | `app/admin/logout/route.js` |
| `admin/dashboard.php` | `app/admin/(dashboard)/dashboard/page.jsx` |
| `sanpham/index.php` | `app/admin/(dashboard)/products/page.jsx` |
| `sanpham/add.php` | `app/admin/(dashboard)/products/add/page.jsx` |
| `sanpham/edit.php` | `app/admin/(dashboard)/products/edit/[id]/page.jsx` |
| `sanpham/detail.php` | `app/admin/(dashboard)/products/[id]/page.jsx` |
| `sanpham/delete.php` | Xử lý bằng Server Action `deleteProduct` |
| `danhmuc/index.php` | `app/admin/(dashboard)/categories/page.jsx` |
| `danhmuc/add.php` | `app/admin/(dashboard)/categories/add/page.jsx` |
| `danhmuc/edit.php` | `app/admin/(dashboard)/categories/edit/[id]/page.jsx` |
| `khachhang/index.php` | `app/admin/(dashboard)/customers/page.jsx` |
| `khachhang/add.php` | `app/admin/(dashboard)/customers/add/page.jsx` |
| `khachhang/edit.php` | `app/admin/(dashboard)/customers/edit/[id]/page.jsx` |
| `khachhang/detail.php` | `app/admin/(dashboard)/customers/[id]/page.jsx` |
| `donhang/index.php` | `app/admin/(dashboard)/orders/page.jsx` |
| `donhang/add.php` | `app/admin/(dashboard)/orders/add/page.jsx` |
| `donhang/edit.php` | `app/admin/(dashboard)/orders/edit/[id]/page.jsx` |
| `donhang/detail.php` | `app/admin/(dashboard)/orders/[id]/page.jsx` |
| `config/database.php` | `lib/db.js` |

## 2. Cách dùng

Copy các thư mục/file trong gói này vào project Next.js của bạn:

```txt
app/
lib/
database.sql
.env.local.example
```

Nếu project của bạn đang có `app/admin/layout.jsx`, hãy thay bằng file trong gói này. File mới chỉ trả về `{children}` để trang login không bị sidebar bọc ngoài.

## 3. Cài thư viện MySQL

Trong thư mục project Next.js, chạy:

```bash
npm install mysql2
```

## 4. Tạo database

Mở phpMyAdmin, tạo database tên `tmdt_next`, sau đó import file:

```txt
database.sql
```

Hoặc nếu bạn dùng database cũ, hãy chỉnh tên bảng/cột trong `lib/db.js` và các file `actions.js` cho khớp.

## 5. Tạo file `.env.local`

Tạo file `.env.local` ở thư mục gốc project:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=tmdt_next
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=123456
```

## 6. Chạy web

```bash
npm run dev
```

Mở:

```txt
http://localhost:3000/admin/login
```

Tài khoản mặc định:

```txt
Email: admin@gmail.com
Password: 123456
```

## 7. Ghi chú quan trọng

PHP thường viết HTML + SQL trong cùng một file. Next.js nên tách như sau:

- `page.jsx`: giao diện và lấy dữ liệu hiển thị.
- `actions.js`: thêm, sửa, xóa dữ liệu.
- `lib/db.js`: kết nối MySQL.
- `layout.jsx`: khung sidebar/header dùng chung.

Tên thư mục trong Next.js dùng tiếng Anh cho dễ quản lý:

- `sanpham` → `products`
- `danhmuc` → `categories`
- `khachhang` → `customers`
- `donhang` → `orders`
