-- Migration: Thêm column is_used và index cho thanh_toan_qr
-- Thực hiện nếu table thanh_toan_qr đã tồn tại

-- Kiểm tra và thêm column is_used nếu chưa tồn tại
ALTER TABLE thanh_toan_qr 
ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT FALSE COMMENT 'Đã sử dụng QR này chưa (1 lần duy nhất)' AFTER lan_quet_cuoi;

-- Thêm index cho is_used nếu chưa tồn tại
ALTER TABLE thanh_toan_qr 
ADD INDEX IF NOT EXISTS idx_is_used (is_used);

-- Thêm index cho thoi_gian_het_han nếu chưa tồn tại
ALTER TABLE thanh_toan_qr 
ADD INDEX IF NOT EXISTS idx_thoi_gian_het_han (thoi_gian_het_han);

-- Cập nhật comment cho column thoi_gian_het_han
ALTER TABLE thanh_toan_qr 
MODIFY COLUMN thoi_gian_het_han TIMESTAMP NULL COMMENT 'QR hết hạn sau 10 phút';

-- Xác nhận
SELECT 'Migration hoàn tất!' as status;

ALTER TABLE donhang
ADD COLUMN full_name VARCHAR(255) NULL,
ADD COLUMN phone VARCHAR(20) NULL,
ADD COLUMN address VARCHAR(255) NULL,
ADD COLUMN city VARCHAR(100) NULL,
ADD COLUMN subtotal DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN discount_amount DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN voucher_code VARCHAR(50) NULL,
ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cod';