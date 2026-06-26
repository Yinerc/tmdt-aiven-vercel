# 🎯 QR Code Thanh Toán - Thời Hạn 10 Phút (1 Lần Sử Dụng)

## 📋 Tóm Tắt Thay Đổi

### 1. **Database Schema** (`user_db.sql`)
- ✅ Thêm column `is_used BOOLEAN DEFAULT FALSE` vào bảng `thanh_toan_qr`
- ✅ Thêm index cho `is_used` và `thoi_gian_het_han`
- ✅ Cập nhật comment thời hạn từ 15 phút → 10 phút

### 2. **Backend API**

#### **POST `/api/payments/generate-momo-qr`** 
- ✅ Lưu QR vào database
- ✅ Set thời hạn = hiện tại + 10 phút
- ✅ Trả về `expiresAt` để frontend countdown
- ✅ Trả về `expiryMinutes: 10`

#### **POST `/api/payments/validate-qr`** (NEW)
- ✅ Kiểm tra QR hợp lệ trước khi confirm đơn hàng
- ✅ Kiểm tra: hết hạn? đã dùng? trạng thái hợp lệ?
- ✅ Trả về remaining time (giây)
- ✅ Tự động cập nhật status → `het_han` nếu hết hạn

#### **POST `/api/payments/qr-verify`**
- ✅ Đánh dấu `is_used = TRUE` khi thanh toán thành công

### 3. **Frontend** (`users/app/customer/checkout/page.tsx`)

#### **New States:**
```typescript
const [qrExpiryTime, setQrExpiryTime] = useState<Date | null>(null);
const [remainingTime, setRemainingTime] = useState<number>(0);
const [qrValidationError, setQrValidationError] = useState('');
const [isQRValid, setIsQRValid] = useState(false);
```

#### **New Functions:**
- `generateMomoQR()` - Tạo QR + validate ngay
- `validateQR(qrId)` - Kiểm tra QR hợp lệ

#### **Features:**
- ✅ Countdown timer: `⏱️ QR code hết hạn trong: 09:45`
- ✅ Thay đổi màu khi ≤60 giây (đỏ)
- ✅ Hiển thị error message nếu QR hết hạn/đã dùng
- ✅ Disable button "Xác nhận đặt hàng" nếu QR không hợp lệ
- ✅ Auto-refresh validation nếu hết hạn

---

## 🚀 Hướng Dẫn Setup

### **Step 1: Update Database**
Nếu bạn đã có database hiện tại, chạy migration:

```bash
mysql -u root -p tmdt_next < migration_add_qr_is_used.sql
```

Hoặc nếu setup mới, sử dụng `user_db.sql` bình thường.

### **Step 2: Restart Server**
```bash
# Trong thư mục users/
npm run dev
```

### **Step 3: Test**
1. Thêm sản phẩm vào giỏ → Thanh toán
2. Chọn "Chuyển khoản MoMo"
3. Xem lại đơn hàng → QR xuất hiện với countdown timer
4. Đợi hết hạn hoặc refresh để test validation

---

## 📊 Workflow Chi Tiết

```
1. User chọn thanh toán MoMo
   ↓
2. Click "Xem lại đơn hàng" → generateMomoQR()
   ↓
3. API generate-momo-qr:
   - Tạo QR string
   - Lưu vào DB (is_used=FALSE, expiry=now+10m)
   - Trả về expiresAt
   ↓
4. Frontend:
   - Gọi validateQR(qrId)
   - Start countdown timer
   - Hiển thị QR code + thông tin tài khoản
   ↓
5. User quét QR + thanh toán
   ↓
6. Gateway callback → /api/payments/qr-verify
   - Update trang_thai = 'da_nhan_tien'
   - Set is_used = TRUE
   - Update trạng thái đơn hàng
   ↓
7. Nếu hết hạn mà chưa thanh toán:
   - validateQR() tự động cập nhật status → 'het_han'
   - Frontend disable button "Xác nhận đặt hàng"
   - Hiển thị "QR đã hết hạn"
```

---

## ⚠️ Lưu Ý Quan Trọng

### **1. QR Chỉ Sử Dụng 1 Lần**
- Sau khi thanh toán thành công → `is_used = TRUE`
- Không thể tạo lại QR từ cùng `qrId`

### **2. Thời Hạn 10 Phút**
- Countdown tự động từ `expiresAt` trên frontend
- Nếu hết hạn chưa thanh toán → tự động disable
- User phải làm lại từ bước "Xem lại đơn hàng"

### **3. Validation**
- Mỗi lần click "Xem lại" → generate QR mới
- Validate ngay sau generate
- Check hợp lệ trước khi confirm đơn hàng

### **4. Database Requirements**
- MySQL 5.7+
- UTF-8 encoding
- Foreign keys enabled

---

## 🔧 Troubleshooting

### **QR hết hạn nhưng vẫn cho confirm**
→ Clear cache frontend, refresh page

### **Lỗi "Mã QR không tồn tại"**
→ Check database: `SELECT * FROM thanh_toan_qr;`

### **Countdown không chạy**
→ Check browser console, đảm bảo `qrExpiryTime` được set

### **is_used không cập nhật**
→ Check webhook từ gateway, xem qr-verify có được gọi không

---

## 📝 Files Thay Đổi

```
✅ user_db.sql
   - Thêm is_used column
   - Thêm indexes

✅ users/app/api/payments/generate-momo-qr/route.ts
   - Lưu QR vào database
   - Set thời hạn 10 phút

✅ users/app/api/payments/validate-qr/route.ts (NEW)
   - Kiểm tra QR hợp lệ

✅ users/app/api/payments/qr-verify/route.ts
   - Set is_used = TRUE

✅ users/app/customer/checkout/page.tsx
   - Countdown timer
   - Validation logic
   - Error handling

✅ migration_add_qr_is_used.sql (NEW)
   - Migration script cho existing DB
```

---

## 🎨 UI/UX Improvements

### **Checkout Modal Enhancements:**
- ✅ Countdown timer với đổi màu (xanh → đỏ)
- ✅ Error messages rõ ràng
- ✅ Button state feedback
- ✅ Copy to clipboard cho số TK / nội dung

### **User Experience:**
- ✅ Tự động validate QR khi generate
- ✅ Realtime countdown (cập nhật mỗi giây)
- ✅ Auto-disable button nếu QR hết hạn
- ✅ Hướng dẫn rõ ràng

---

## 🔐 Security

- ✅ Validation 2 chiều: database + frontend
- ✅ Check is_used trước confirm
- ✅ Check expiry time
- ✅ Prevent double-submission
- ✅ Timeout hạn chế brute force

---

Mọi câu hỏi hoặc vấn đề, vui lòng kiểm tra console logs và database!
