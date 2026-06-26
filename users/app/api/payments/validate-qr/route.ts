import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  let connection;
  try {
    const body = await request.json();
    const { qrId, donhang_id } = body;

    if (!qrId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã QR' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Lấy thông tin QR
    const [rows]: any = await connection.execute(
      `SELECT * FROM thanh_toan_qr WHERE qr_code_data = ? LIMIT 1`,
      [qrId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Mã QR không tồn tại' },
        { status: 404 }
      );
    }

    const qrRecord = rows[0];
    const now = new Date();
    const expiryTime = new Date(qrRecord.thoi_gian_het_han);

    // Kiểm tra điều kiện hợp lệ
    const errors = [];

    // 1. Kiểm tra thời hạn
    if (now > expiryTime) {
      errors.push('Mã QR đã hết hạn');
      // Cập nhật trạng thái thành hết hạn
      await connection.execute(
        `UPDATE thanh_toan_qr SET trang_thai = 'het_han', updated_at = NOW() WHERE id = ?`,
        [qrRecord.id]
      );
    }

    // 2. Kiểm tra đã sử dụng chưa
    if (qrRecord.is_used) {
      errors.push('Mã QR này đã được sử dụng');
    }

    // 3. Kiểm tra trạng thái
    if (qrRecord.trang_thai !== 'tao_qr' && qrRecord.trang_thai !== 'dang_quay') {
      errors.push(`Mã QR không khả dụng (${qrRecord.trang_thai})`);
    }

    // 4. Kiểm tra donhang_id nếu có
    if (donhang_id && qrRecord.donhang_id !== donhang_id) {
      errors.push('Mã QR không khớp với đơn hàng');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: errors.join(', '),
          qrStatus: qrRecord.trang_thai,
          isUsed: qrRecord.is_used,
          isExpired: now > expiryTime,
        },
        { status: 400 }
      );
    }

    // QR hợp lệ
    return NextResponse.json({
      success: true,
      message: 'Mã QR hợp lệ',
      data: {
        qrId: qrRecord.qr_code_data,
        amount: qrRecord.so_tien,
        donhang_id: qrRecord.donhang_id,
        expiresAt: qrRecord.thoi_gian_het_han,
        remainingTime: Math.max(0, Math.floor((expiryTime.getTime() - now.getTime()) / 1000)),
      },
    });
  } catch (error: any) {
    console.error('Validate QR Error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi xác thực mã QR', details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.release();
  }
}
