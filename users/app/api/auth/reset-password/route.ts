// users\app\api\auth\reset-password\route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    // Kiểm tra token
    const [rows]: any = await pool.query(
      `SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()`,
      [token]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Token không hợp lệ hoặc đã hết hạn' },
        { status: 400 }
      );
    }

    const resetRecord = rows[0];

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu
    await pool.query(
      `UPDATE khachhang SET matkhau = ? WHERE email = ?`,
      [hashedPassword, resetRecord.email]
    );

    // Xóa token đã dùng
    await pool.query(`DELETE FROM password_resets WHERE token = ?`, [token]);

    return NextResponse.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công!',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: 'Đặt lại mật khẩu thất bại' },
      { status: 500 }
    );
  }
}