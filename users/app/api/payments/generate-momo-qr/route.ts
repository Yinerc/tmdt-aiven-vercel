import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// MoMo Account Configuration
const MOMO_CONFIG = {
  accountNumber: '0375418489',
  accountName: 'TRAN VO HUU THANG',
  bankCode: 'MOMO',
};

const QR_EXPIRY_MINUTES = 10; // Thời hạn QR 10 phút

// Hàm tạo dữ liệu thanh toán MoMo theo định dạng tiêu chuẩn
function generateMomoPaymentInfo(orderId: number | string, amount: number, description: string): string {
  // MoMo sử dụng định dạng: {số điện thoại / số tài khoản}|{tên tài khoản}|{số tiền}|{nội dung}
  return `${MOMO_CONFIG.accountNumber}|${MOMO_CONFIG.accountName}|${amount}|${description}`;
}

// Hàm tạo mã QR unique
function generateQRCode(orderId: string, amount: number): string {
  return `TMDT-ORDER-${orderId}-${amount}-${Date.now()}`;
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    const body = await request.json();
    const { orderId, amount, orderCode, thanh_toan_id, donhang_id } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc (orderId, amount)' },
        { status: 400 }
      );
    }

    // Tạo nội dung mô tả cho QR code
    const description = `${orderCode || `DH${orderId}`} - ${amount}đ`;
    
    // Tạo dữ liệu QR code theo chuẩn MoMo
    const momoQRString = generateMomoPaymentInfo(orderId, amount, description);
    const qrCodeData = generateQRCode(orderCode || orderId, amount);
    const expiresAt = new Date(Date.now() + QR_EXPIRY_MINUTES * 60 * 1000);

    // Thử lưu QR vào database
    try {
      connection = await pool.getConnection();

      // Lưu QR vào database
      await connection.execute(
        `INSERT INTO thanh_toan_qr 
         (thanh_toan_id, donhang_id, qr_code_data, so_tien, trang_thai, nguon_giao_dich, thoi_gian_het_han, is_used)
         VALUES (?, ?, ?, ?, 'tao_qr', 'MOMO', ?, FALSE)`,
        [thanh_toan_id || 0, donhang_id || 0, qrCodeData, amount, expiresAt]
      );

      console.log('✅ QR saved to database:', qrCodeData);
    } catch (dbError: any) {
      console.error('⚠️ Database error (continuing without DB save):', dbError.message);
      // Vẫn trả về QR code dù DB error - để user có thể thanh toán
    }

    return NextResponse.json({
      success: true,
      data: {
        qrId: qrCodeData,
        orderId,
        orderCode: orderCode || `DH${orderId}`,
        amount,
        accountNumber: MOMO_CONFIG.accountNumber,
        accountName: MOMO_CONFIG.accountName,
        bankCode: MOMO_CONFIG.bankCode,
        description,
        qrCodeDataUrl: '/momo-qr.jpg',
        qrCodeString: momoQRString,
        expiresAt: expiresAt.toISOString(),
        expiryMinutes: QR_EXPIRY_MINUTES,
        instructions: [
          '1. Quét mã QR bằng ứng dụng MoMo hoặc ứng dụng ngân hàng',
          '2. Kiểm tra thông tin và xác nhận thanh toán',
          '3. Đơn hàng sẽ được xác nhận tự động sau khi thanh toán thành công',
          `4. Mã QR có hiệu lực trong ${QR_EXPIRY_MINUTES} phút`,
        ],
      },
    });
  } catch (error: any) {
    console.error('❌ Generate MoMo QR Error:', error.message);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Lỗi khi tạo mã QR thanh toán',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.release();
  }
}

// GET endpoint để lấy thông tin tài khoản MoMo
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      accountNumber: MOMO_CONFIG.accountNumber,
      accountName: MOMO_CONFIG.accountName,
      bankCode: MOMO_CONFIG.bankCode,
    },
  });
}
