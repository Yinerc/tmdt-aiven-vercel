-- ============================================================
-- TMDT - RECREATE DATABASE SẠCH CHO AIVEN / DBEAVER
-- Cách dùng: mở file này trong DBeaver, chọn connection Aiven,
-- rồi bấm Execute SQL Script / Alt + X để chạy toàn bộ.
-- KHÔNG chạy chung với Bo_sung.sql hoặc DB.sql cũ.
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+07:00';
CREATE DATABASE IF NOT EXISTS tmdt_next
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
USE tmdt_next;
SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS v_admin_users;
DROP VIEW IF EXISTS v_thongke_sanpham_banchay;
DROP VIEW IF EXISTS v_thongke_doanhthu_ngay;
DROP VIEW IF EXISTS v_don_hang_chi_tiet;
DROP VIEW IF EXISTS v_donhang_chitiet;
DROP VIEW IF EXISTS v_donhang_admin;
DROP VIEW IF EXISTS v_sanpham_danhmuc;


DROP TABLE IF EXISTS thanh_toan_qr_log;
DROP TABLE IF EXISTS thanh_toan_qr;
DROP TABLE IF EXISTS thanh_toan;
DROP TABLE IF EXISTS don_hang_trang_thai;
DROP TABLE IF EXISTS donhang_chitiet;
DROP TABLE IF EXISTS voucher_usage;
DROP TABLE IF EXISTS wishlist;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS donhang;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS khachhang;
DROP TABLE IF EXISTS sanpham;
DROP TABLE IF EXISTS danhmuc;
DROP TABLE IF EXISTS vouchers;
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS ai_generated_products;


-- 1. Danh mục
CREATE TABLE danhmuc (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tendanhmuc VARCHAR(255) NOT NULL,
  mota TEXT NULL,
  trangthai TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sản phẩm
CREATE TABLE sanpham (
  id INT AUTO_INCREMENT PRIMARY KEY,
  danhmuc_id INT NULL,
  tensanpham VARCHAR(255) NOT NULL,
  hinhanh VARCHAR(500) NULL,
  gia DECIMAL(15,2) DEFAULT 0.00,
  soluong INT DEFAULT 0,
  mota TEXT NULL,
  trangthai TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (danhmuc_id) REFERENCES danhmuc(id) ON DELETE SET NULL
);

-- 3. Khách hàng
CREATE TABLE khachhang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hoten VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  sodienthoai VARCHAR(50) NOT NULL,
  diachi TEXT NOT NULL,
  matkhau VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Đơn hàng
CREATE TABLE donhang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(20) UNIQUE NOT NULL,
  khachhang_id INT NULL,
  full_name VARCHAR(255) NULL,
  phone VARCHAR(20) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  subtotal DECIMAL(15,2) DEFAULT 0.00,
  discount_amount DECIMAL(15,2) DEFAULT 0.00,
  voucher_code VARCHAR(50) NULL,
  payment_method VARCHAR(50) DEFAULT 'cod',
  tongtien DECIMAL(15,2) DEFAULT 0.00,
  tien_giam DECIMAL(15,2) DEFAULT 0.00,
  phuong_thuc_thanh_toan VARCHAR(50) DEFAULT 'cod',
  trangthai VARCHAR(50) DEFAULT 'cho_xu_ly',
  ma_khuyenmai VARCHAR(50) NULL,
  dia_chi_giao VARCHAR(255) NULL,
  sdt_giao VARCHAR(20) NULL,
  ghichu TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (khachhang_id) REFERENCES khachhang(id) ON DELETE SET NULL
);

-- 5. Chi tiết đơn hàng
CREATE TABLE donhang_chitiet (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donhang_id INT NOT NULL,
  sanpham_id INT NULL,
  soluong INT DEFAULT 1,
  dongia DECIMAL(15,2) DEFAULT 0.00,
  FOREIGN KEY (donhang_id) REFERENCES donhang(id) ON DELETE CASCADE,
  FOREIGN KEY (sanpham_id) REFERENCES sanpham(id) ON DELETE SET NULL
);

-- 6. Vouchers
CREATE TABLE vouchers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type ENUM('percent', 'fixed') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(15,2) DEFAULT 0.00,
  max_discount_amount DECIMAL(15,2) NULL,
  start_date DATETIME NULL,
  end_date DATETIME NULL,
  usage_limit INT DEFAULT 100,
  used_count INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Lịch sử sử dụng voucher
CREATE TABLE voucher_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  voucher_id INT NOT NULL,
  khachhang_id INT NULL,
  order_id INT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
  FOREIGN KEY (khachhang_id) REFERENCES khachhang(id),
  FOREIGN KEY (order_id) REFERENCES donhang(id)
);

-- 8. Đánh giá sản phẩm
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sanpham_id INT NOT NULL,
  khachhang_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sanpham_id) REFERENCES sanpham(id) ON DELETE CASCADE,
  FOREIGN KEY (khachhang_id) REFERENCES khachhang(id) ON DELETE CASCADE
);

-- 9. Wishlist
CREATE TABLE wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  khachhang_id INT NOT NULL,
  sanpham_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_wishlist (khachhang_id, sanpham_id),
  FOREIGN KEY (khachhang_id) REFERENCES khachhang(id) ON DELETE CASCADE,
  FOREIGN KEY (sanpham_id) REFERENCES sanpham(id) ON DELETE CASCADE
);

-- 10. AI Generated Products
CREATE TABLE ai_generated_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  summary TEXT NULL,
  description TEXT NULL,
  specifications JSON NULL,
  benefits JSON NULL,
  landingPage JSON NULL,
  slogan VARCHAR(500) NULL,
  socialContent JSON NULL,
  seo JSON NULL,
  faq JSON NULL,
  targetCustomers JSON NULL,
  pros JSON NULL,
  cons JSON NULL,
  sources JSON NULL,
  selectedImageUrl VARCHAR(500) NULL,
  generatedImageUrls JSON NULL,
  qualityEvaluation JSON NULL,
  status ENUM('draft','published') DEFAULT 'draft',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 11. Admin Users
CREATE TABLE admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin','moderator') DEFAULT 'moderator',
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- SEED DATA
-- ========================================================

-- Danh mục
INSERT INTO danhmuc (tendanhmuc, mota) VALUES
('Điện thoại', 'Điện thoại thông minh các hãng'),
('Máy tính bảng', 'Tablet, iPad các loại'),
('Laptop', 'Máy tính xách tay'),
('Phụ kiện điện thoại', 'Ốp lưng, sạc, tai nghe điện thoại'),
('Phụ kiện laptop', 'Chuột, bàn phím, túi chống sốc laptop');

-- Sản phẩm (25 sản phẩm)
INSERT INTO sanpham (danhmuc_id, tensanpham, hinhanh, gia, soluong, mota) VALUES
(1, 'iPhone 16 Pro Max', 'https://picsum.photos/id/1015/300/300', 33990000, 15, 'iPhone 16 Pro Max 256GB - Thiết kế titan, chip A18 Pro'),
(1, 'Samsung Galaxy S25 Ultra', 'https://picsum.photos/id/160/300/300', 31990000, 12, 'Flagship Android mạnh nhất 2025, camera 200MP'),
(1, 'Xiaomi 15 Pro', 'https://picsum.photos/id/201/300/300', 18990000, 20, 'Hiệu năng cao, sạc nhanh 120W, camera Leica'),
(1, 'OPPO Find X8 Pro', 'https://picsum.photos/id/251/300/300', 22990000, 10, 'Thiết kế sang trọng, camera Hasselblad'),
(1, 'Google Pixel 9 Pro', 'https://picsum.photos/id/180/300/300', 25990000, 8, 'Trải nghiệm Android thuần, AI mạnh mẽ'),

(2, 'iPad Pro 13 inch M4', 'https://picsum.photos/id/1018/300/300', 31990000, 10, 'iPad Pro chip M4, màn hình Ultra Retina XDR'),
(2, 'Samsung Galaxy Tab S10 Ultra', 'https://picsum.photos/id/133/300/300', 24990000, 15, 'Màn hình lớn 14.6 inch, hỗ trợ S Pen'),
(2, 'Xiaomi Pad 7 Pro', 'https://picsum.photos/id/29/300/300', 12990000, 18, 'Hiệu năng mạnh, pin trâu'),
(2, 'Lenovo Tab Extreme', 'https://picsum.photos/id/48/300/300', 18990000, 7, 'Màn hình 14.5 inch, loa JBL'),
(2, 'Huawei MatePad Pro 12.2', 'https://picsum.photos/id/201/300/300', 15990000, 12, 'Thiết kế cao cấp, hỗ trợ M-Pencil'),

(3, 'MacBook Pro 14 inch M4 Pro', 'https://picsum.photos/id/1015/300/300', 52990000, 8, 'MacBook Pro 2025 chip M4 Pro'),
(3, 'Dell XPS 14 2025', 'https://picsum.photos/id/160/300/300', 42990000, 10, 'Thiết kế cao cấp, màn hình OLED 3K'),
(3, 'ASUS Zenbook 14 OLED', 'https://picsum.photos/id/251/300/300', 22990000, 15, 'Mỏng nhẹ, màn hình OLED đẹp'),
(3, 'Lenovo ThinkPad X1 Carbon Gen 13', 'https://picsum.photos/id/180/300/300', 38990000, 6, 'Laptop doanh nhân cao cấp'),
(3, 'HP Spectre x360 14', 'https://picsum.photos/id/133/300/300', 27990000, 9, '2-in-1, màn hình cảm ứng OLED'),

(4, 'Ốp lưng iPhone 16 Pro Max Spigen', 'https://picsum.photos/id/201/300/300', 590000, 50, 'Ốp lưng chống sốc cao cấp'),
(4, 'Củ sạc nhanh Anker 65W', 'https://picsum.photos/id/160/300/300', 890000, 35, 'Sạc nhanh cho điện thoại và laptop'),
(4, 'Tai nghe AirPods Pro 2', 'https://picsum.photos/id/1015/300/300', 5490000, 25, 'Tai nghe không dây chống ồn'),
(4, 'Cáp sạc Type-C to Lightning Baseus', 'https://picsum.photos/id/251/300/300', 290000, 60, 'Cáp sạc nhanh MFi'),
(4, 'Sạc dự phòng Xiaomi 20000mAh', 'https://picsum.photos/id/180/300/300', 690000, 40, 'Pin dự phòng dung lượng lớn'),

(5, 'Chuột không dây Logitech MX Master 3S', 'https://picsum.photos/id/133/300/300', 2490000, 20, 'Chuột công thái học cao cấp'),
(5, 'Bàn phím không dây Keychron K3', 'https://picsum.photos/id/201/300/300', 1890000, 15, 'Bàn phím cơ mỏng'),
(5, 'Túi chống sốc Laptop 14 inch Tomtoc', 'https://picsum.photos/id/160/300/300', 890000, 30, 'Túi chống sốc cao cấp'),
(5, 'Đế tản nhiệt Laptop Cooler Master', 'https://picsum.photos/id/251/300/300', 1290000, 18, 'Đế tản nhiệt 6 quạt'),
(5, 'Cáp HDMI 2.1 Baseus 2m', 'https://picsum.photos/id/180/300/300', 390000, 45, 'Cáp HDMI hỗ trợ 8K');

-- Vouchers
INSERT INTO vouchers (code, discount_type, discount_value, min_order_amount, max_discount_amount, start_date, end_date, usage_limit, used_count, is_active) VALUES
('SUMMER2026', 'percent', 15, 500000, 300000, '2026-06-01 00:00:00', '2026-07-31 23:59:59', 200, 45, 1),
('NEWUSER50', 'fixed', 50000, 300000, NULL, '2026-06-01 00:00:00', '2026-12-31 23:59:59', 500, 128, 1),
('BIGSALE20', 'percent', 20, 2000000, 500000, '2026-06-10 00:00:00', '2026-06-30 23:59:59', 100, 32, 1),
('FREESHIP100', 'fixed', 100000, 0, NULL, '2026-06-01 00:00:00', '2026-08-31 23:59:59', 300, 87, 1),
('WELCOME10', 'percent', 10, 200000, NULL, '2026-05-01 00:00:00', '2026-12-31 23:59:59', 1000, 312, 1),
('FLASH25', 'percent', 25, 1000000, 400000, '2026-06-12 00:00:00', '2026-06-15 23:59:59', 50, 12, 1);

-- ========================================================
-- BẢNG THANH TOÁN (PAYMENT TABLES)
-- ========================================================

-- 12. Password Resets
CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (token),
  INDEX (email)
);

-- 13. Giao dịch thanh toán
CREATE TABLE thanh_toan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donhang_id INT NOT NULL,
  phuong_thuc VARCHAR(50) NOT NULL COMMENT 'cod, bank, qr',
  so_tien DECIMAL(15,2) NOT NULL,
  trang_thai VARCHAR(50) DEFAULT 'cho_thanh_toan' COMMENT 'cho_thanh_toan, da_thanh_toan, that_bai',
  ma_giao_dich VARCHAR(100) NULL,
  ghi_chu TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (donhang_id),
  INDEX (trang_thai),
  INDEX (created_at),
  FOREIGN KEY (donhang_id) REFERENCES donhang(id) ON DELETE CASCADE
);

-- 14. Thanh toán QR - Chi tiết mã QR
CREATE TABLE thanh_toan_qr (
  id INT AUTO_INCREMENT PRIMARY KEY,
  thanh_toan_id INT NOT NULL,
  donhang_id INT NOT NULL,
  qr_code_data VARCHAR(255) NOT NULL COMMENT 'Dữ liệu QR: TMDT-ORDER-{id}-{amount}',
  so_tien DECIMAL(15,2) NOT NULL,
  trang_thai VARCHAR(50) DEFAULT 'tao_qr' COMMENT 'tao_qr, dang_quay, da_nhan_tien, that_bai, het_han',
  bank_code VARCHAR(20) NULL COMMENT 'VietQR, NAPAS, VCB, MB...',
  nguon_giao_dich VARCHAR(100) NULL COMMENT 'VIETQR, MOMO, ZALOPAY, BANKING...',
  transaction_id VARCHAR(100) NULL COMMENT 'ID từ hệ thống thanh toán',
  reference_code VARCHAR(100) NULL,
  so_lan_quet INT DEFAULT 0 COMMENT 'Số lần QR được quét',
  lan_quet_cuoi TIMESTAMP NULL,
  thoi_gian_het_han TIMESTAMP NULL COMMENT 'QR hết hạn sau 10 phút',
  is_used BOOLEAN DEFAULT FALSE COMMENT 'Đã sử dụng QR này chưa (1 lần duy nhất)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (donhang_id),
  INDEX (trang_thai),
  INDEX (transaction_id),
  INDEX (is_used),
  INDEX (thoi_gian_het_han),
  UNIQUE KEY unique_qr_code (qr_code_data),
  FOREIGN KEY (thanh_toan_id) REFERENCES thanh_toan(id) ON DELETE CASCADE,
  FOREIGN KEY (donhang_id) REFERENCES donhang(id) ON DELETE CASCADE
);

-- 15. Log thay đổi trạng thái QR
CREATE TABLE thanh_toan_qr_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  thanh_toan_qr_id INT NOT NULL,
  thanh_toan_id INT NULL,
  trang_thai_cu VARCHAR(50) NULL,
  trang_thai_moi VARCHAR(50) NOT NULL,
  ghi_chu TEXT NULL,
  ip_address VARCHAR(50) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (thanh_toan_qr_id),
  INDEX (created_at),
  FOREIGN KEY (thanh_toan_qr_id) REFERENCES thanh_toan_qr(id) ON DELETE CASCADE
);

-- 16. Lịch sử trạng thái đơn hàng
CREATE TABLE don_hang_trang_thai (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donhang_id INT NOT NULL,
  trang_thai_cu VARCHAR(50) NULL,
  trang_thai_moi VARCHAR(50) NOT NULL,
  ghi_chu TEXT NULL,
  created_by VARCHAR(100) NULL COMMENT 'system, admin, customer...',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (donhang_id),
  INDEX (trang_thai_moi),
  INDEX (created_at),
  FOREIGN KEY (donhang_id) REFERENCES donhang(id) ON DELETE CASCADE
);


ALTER TABLE donhang 
  ADD INDEX idx_phuong_thuc (phuong_thuc_thanh_toan),
  ADD INDEX idx_trangthai (trangthai),
  ADD INDEX idx_khachhang (khachhang_id),
  ADD INDEX idx_created_at (created_at);

ALTER TABLE donhang_chitiet
  ADD INDEX idx_donhang (donhang_id),
  ADD INDEX idx_sanpham (sanpham_id);

ALTER TABLE sanpham
  ADD INDEX idx_danhmuc (danhmuc_id);

ALTER TABLE voucher_usage
  ADD INDEX idx_voucher (voucher_id),
  ADD INDEX idx_khachhang (khachhang_id),
  ADD INDEX idx_order (order_id);

ALTER TABLE reviews
  ADD INDEX idx_sanpham (sanpham_id),
  ADD INDEX idx_khachhang (khachhang_id);


DROP VIEW IF EXISTS v_don_hang_chi_tiet;
CREATE VIEW v_don_hang_chi_tiet AS
SELECT 
  d.id,
  d.order_code,
  d.khachhang_id,
  k.hoten,
  k.email,
  k.sodienthoai,
  d.tongtien,
  d.tien_giam,
  (d.tongtien - d.tien_giam) AS tong_phai_thanh,
  d.phuong_thuc_thanh_toan,
  d.trangthai,
  d.dia_chi_giao,
  d.sdt_giao,
  COALESCE(tt.trang_thai, 'chua_tao') AS trang_thai_thanh_toan,
  tt.id AS thanh_toan_id,
  d.ghichu,
  d.created_at,
  d.updated_at
FROM donhang d
LEFT JOIN khachhang k ON d.khachhang_id = k.id
LEFT JOIN thanh_toan tt ON d.id = tt.donhang_id;

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- PATCH BỔ SUNG VIEW / FK / ADMIN MẪU
-- ============================================================

-- ==========================================================
-- PATCH KIỂM TRA / BỔ SUNG SAU KHI IMPORT user_db.sql
-- Dùng file này THAY cho Bo_sung.sql hiện tại nếu user_db.sql đã có sẵn
-- nhiều cột như full_name, phone, voucher_code, payment_method.
-- Chạy sau user_db.sql trong database tmdt_next.
-- ==========================================================

SET NAMES utf8mb4;
SET time_zone = '+07:00';

-- 1) Bổ sung cột is_used cho thanh_toan_qr nếu DB chưa có.
SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE thanh_toan_qr ADD COLUMN is_used BOOLEAN DEFAULT FALSE COMMENT ''Đã sử dụng QR này chưa (1 lần duy nhất)'' AFTER lan_quet_cuoi',
    'SELECT ''Column thanh_toan_qr.is_used đã tồn tại'' AS status'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'thanh_toan_qr'
    AND COLUMN_NAME = 'is_used'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Bổ sung index cho is_used nếu chưa có.
SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE thanh_toan_qr ADD INDEX idx_is_used (is_used)',
    'SELECT ''Index idx_is_used đã tồn tại'' AS status'
  )
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'thanh_toan_qr'
    AND INDEX_NAME = 'idx_is_used'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Bổ sung index cho thoi_gian_het_han nếu chưa có.
SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE thanh_toan_qr ADD INDEX idx_thoi_gian_het_han (thoi_gian_het_han)',
    'SELECT ''Index idx_thoi_gian_het_han đã tồn tại'' AS status'
  )
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'thanh_toan_qr'
    AND INDEX_NAME = 'idx_thoi_gian_het_han'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) Bổ sung khóa ngoại donhang.voucher_code -> vouchers.code nếu chưa có.
SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE donhang ADD CONSTRAINT fk_donhang_voucher_code FOREIGN KEY (voucher_code) REFERENCES vouchers(code) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT ''FK fk_donhang_voucher_code đã tồn tại'' AS status'
  )
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'donhang'
    AND CONSTRAINT_NAME = 'fk_donhang_voucher_code'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5) Bổ sung khóa ngoại password_resets.email -> khachhang.email nếu chưa có.
SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE password_resets ADD CONSTRAINT fk_password_resets_khachhang_email FOREIGN KEY (email) REFERENCES khachhang(email) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT ''FK fk_password_resets_khachhang_email đã tồn tại'' AS status'
  )
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'password_resets'
    AND CONSTRAINT_NAME = 'fk_password_resets_khachhang_email'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6) Bổ sung khóa ngoại thanh_toan_qr_log.thanh_toan_id -> thanh_toan.id nếu chưa có.
SET @sql := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE thanh_toan_qr_log ADD CONSTRAINT fk_qr_log_thanh_toan FOREIGN KEY (thanh_toan_id) REFERENCES thanh_toan(id) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT ''FK fk_qr_log_thanh_toan đã tồn tại'' AS status'
  )
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'thanh_toan_qr_log'
    AND CONSTRAINT_NAME = 'fk_qr_log_thanh_toan'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7) Tạo lại các view còn thiếu từ DB cũ để admin/user code dễ dùng.
CREATE OR REPLACE VIEW v_sanpham_danhmuc AS
SELECT
  sp.id,
  sp.danhmuc_id,
  dm.tendanhmuc,
  sp.tensanpham,
  sp.hinhanh,
  sp.gia,
  sp.soluong,
  sp.mota,
  sp.trangthai,
  sp.created_at
FROM sanpham sp
LEFT JOIN danhmuc dm ON dm.id = sp.danhmuc_id;

CREATE OR REPLACE VIEW v_donhang_admin AS
SELECT
  dh.id,
  dh.order_code,
  dh.khachhang_id,
  COALESCE(kh.hoten, dh.full_name) AS ten_khach_hang,
  COALESCE(kh.email, '') AS email,
  COALESCE(kh.sodienthoai, dh.phone, dh.sdt_giao) AS so_dien_thoai,
  COALESCE(kh.diachi, dh.address, dh.dia_chi_giao) AS dia_chi,
  dh.subtotal,
  dh.discount_amount,
  dh.tongtien,
  COALESCE(dh.voucher_code, dh.ma_khuyenmai) AS voucher_code,
  COALESCE(dh.payment_method, dh.phuong_thuc_thanh_toan) AS payment_method,
  dh.trangthai,
  dh.ghichu,
  dh.created_at,
  dh.updated_at
FROM donhang dh
LEFT JOIN khachhang kh ON kh.id = dh.khachhang_id;

CREATE OR REPLACE VIEW v_donhang_chitiet AS
SELECT
  ct.id,
  ct.donhang_id,
  dh.order_code,
  ct.sanpham_id,
  sp.tensanpham,
  sp.hinhanh,
  ct.soluong,
  ct.dongia,
  (ct.soluong * ct.dongia) AS thanhtien
FROM donhang_chitiet ct
LEFT JOIN donhang dh ON dh.id = ct.donhang_id
LEFT JOIN sanpham sp ON sp.id = ct.sanpham_id;

CREATE OR REPLACE VIEW v_don_hang_chi_tiet AS
SELECT
  d.id,
  d.order_code,
  d.khachhang_id,
  COALESCE(k.hoten, d.full_name) AS hoten,
  COALESCE(k.email, '') AS email,
  COALESCE(k.sodienthoai, d.phone, d.sdt_giao) AS sodienthoai,
  d.subtotal,
  d.discount_amount,
  d.tongtien,
  d.tien_giam,
  d.tongtien AS tong_phai_thanh,
  COALESCE(d.payment_method, d.phuong_thuc_thanh_toan) AS phuong_thuc_thanh_toan,
  d.trangthai,
  COALESCE(d.address, d.dia_chi_giao) AS dia_chi_giao,
  COALESCE(d.phone, d.sdt_giao) AS sdt_giao,
  COALESCE(tt.trang_thai, 'chua_tao') AS trang_thai_thanh_toan,
  tt.id AS thanh_toan_id,
  d.ghichu,
  d.created_at,
  d.updated_at
FROM donhang d
LEFT JOIN khachhang k ON d.khachhang_id = k.id
LEFT JOIN thanh_toan tt ON d.id = tt.donhang_id;

CREATE OR REPLACE VIEW v_thongke_doanhthu_ngay AS
SELECT
  DATE(created_at) AS ngay,
  COUNT(*) AS so_don_hang,
  SUM(tongtien) AS doanh_thu
FROM donhang
WHERE trangthai <> 'da_huy'
GROUP BY DATE(created_at);

CREATE OR REPLACE VIEW v_thongke_sanpham_banchay AS
SELECT
  sp.id AS sanpham_id,
  sp.tensanpham,
  dm.tendanhmuc,
  SUM(ct.soluong) AS tong_so_luong_ban,
  SUM(ct.soluong * ct.dongia) AS tong_doanh_thu
FROM donhang_chitiet ct
LEFT JOIN sanpham sp ON sp.id = ct.sanpham_id
LEFT JOIN danhmuc dm ON dm.id = sp.danhmuc_id
LEFT JOIN donhang dh ON dh.id = ct.donhang_id
WHERE dh.trangthai <> 'da_huy'
GROUP BY sp.id, sp.tensanpham, dm.tendanhmuc;

CREATE OR REPLACE VIEW v_admin_users AS
SELECT
  id,
  username,
  full_name,
  role,
  is_active,
  created_at
FROM admin_users;

-- 8) Thêm tài khoản admin mẫu nếu bảng đang trống/chưa có admin.
INSERT INTO admin_users (username, password, full_name, role, is_active)
SELECT 'admin', '123456', 'Admin TMDT', 'admin', 1
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE username = 'admin');

-- 9) Test nhanh.
SHOW TABLES;
SELECT 'danhmuc' AS bang, COUNT(*) AS so_dong FROM danhmuc
UNION ALL SELECT 'sanpham', COUNT(*) FROM sanpham
UNION ALL SELECT 'khachhang', COUNT(*) FROM khachhang
UNION ALL SELECT 'donhang', COUNT(*) FROM donhang
UNION ALL SELECT 'donhang_chitiet', COUNT(*) FROM donhang_chitiet
UNION ALL SELECT 'vouchers', COUNT(*) FROM vouchers
UNION ALL SELECT 'admin_users', COUNT(*) FROM admin_users
UNION ALL SELECT 'thanh_toan', COUNT(*) FROM thanh_toan
UNION ALL SELECT 'thanh_toan_qr', COUNT(*) FROM thanh_toan_qr;

-- Kết thúc
SELECT 'IMPORT_OK' AS status;
