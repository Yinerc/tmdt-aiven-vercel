import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Test endpoint - gửi email quên mật khẩu đến test email
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập email' },
        { status: 400 }
      );
    }

    // Kiểm tra email có tồn tại trong database không
    const [users]: any = await pool.query(
      'SELECT id, hoten, email FROM khachhang WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Email không tồn tại trong hệ thống',
        tested: true,
      });
    }

    const user = users[0];

    // Kiểm tra xem bảng password_resets có tồn tại không
    try {
      const [tableCheck]: any = await pool.query(
        "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'password_resets'",
        [process.env.DB_NAME || 'tmdt_next']
      );

      if (tableCheck.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Bảng password_resets chưa được tạo trong database',
          status: 'TABLE_MISSING',
        });
      }
    } catch (err) {
      console.error('Table check error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Email tồn tại và sẵn sàng để gửi link reset',
      user: {
        id: user.id,
        name: user.hoten,
        email: user.email,
      },
      resendApiKey: process.env.RESEND_API_KEY ? 'Có' : 'Không',
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    });
  } catch (error: any) {
    console.error('Test forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server', error: error.message },
      { status: 500 }
    );
  }
}
