CREATE DATABASE IF NOT EXISTS tmdt_next CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tmdt_next;

DROP TABLE IF EXISTS donhang_chitiet;
DROP TABLE IF EXISTS donhang;
DROP TABLE IF EXISTS sanpham;
DROP TABLE IF EXISTS khachhang;
DROP TABLE IF EXISTS danhmuc;

CREATE TABLE danhmuc (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tendanhmuc VARCHAR(255) NOT NULL,
  mota TEXT NULL,
  trangthai TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sanpham (
  id INT AUTO_INCREMENT PRIMARY KEY,
  danhmuc_id INT NULL,
  tensanpham VARCHAR(255) NOT NULL,
  hinhanh VARCHAR(500) NULL,
  gia DECIMAL(15,2) DEFAULT 0,
  soluong INT DEFAULT 0,
  mota TEXT NULL,
  trangthai TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sanpham_danhmuc FOREIGN KEY (danhmuc_id) REFERENCES danhmuc(id) ON DELETE SET NULL
);

CREATE TABLE khachhang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hoten VARCHAR(255) NOT NULL,
  email VARCHAR(255) NULL,
  sodienthoai VARCHAR(50) NULL,
  diachi TEXT NULL,
  matkhau VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donhang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  khachhang_id INT NULL,
  tongtien DECIMAL(15,2) DEFAULT 0,
  trangthai VARCHAR(50) DEFAULT 'cho_xu_ly',
  ghichu TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_donhang_khachhang FOREIGN KEY (khachhang_id) REFERENCES khachhang(id) ON DELETE SET NULL
);

CREATE TABLE donhang_chitiet (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donhang_id INT NOT NULL,
  sanpham_id INT NULL,
  soluong INT DEFAULT 1,
  dongia DECIMAL(15,2) DEFAULT 0,
  CONSTRAINT fk_ct_donhang FOREIGN KEY (donhang_id) REFERENCES donhang(id) ON DELETE CASCADE,
  CONSTRAINT fk_ct_sanpham FOREIGN KEY (sanpham_id) REFERENCES sanpham(id) ON DELETE SET NULL
);

INSERT INTO danhmuc (tendanhmuc, mota, trangthai) VALUES
('Điện thoại', 'Các sản phẩm điện thoại', 1),
('Laptop', 'Máy tính xách tay', 1),
('Phụ kiện', 'Phụ kiện công nghệ', 1);

INSERT INTO sanpham (danhmuc_id, tensanpham, hinhanh, gia, soluong, mota, trangthai) VALUES
(1, 'iPhone 15', '', 19990000, 10, 'Sản phẩm mẫu', 1),
(2, 'Laptop Dell Inspiron', '', 15990000, 8, 'Sản phẩm mẫu', 1),
(3, 'Tai nghe Bluetooth', '', 590000, 30, 'Sản phẩm mẫu', 1);

INSERT INTO khachhang (hoten, email, sodienthoai, diachi, matkhau) VALUES
('Nguyễn Văn A', 'a@gmail.com', '0900000001', 'TP.HCM', ''),
('Trần Thị B', 'b@gmail.com', '0900000002', 'Cần Thơ', '');

INSERT INTO donhang (khachhang_id, tongtien, trangthai, ghichu) VALUES
(1, 19990000, 'cho_xu_ly', 'Đơn hàng mẫu'),
(2, 590000, 'da_giao', 'Đơn hàng mẫu');
