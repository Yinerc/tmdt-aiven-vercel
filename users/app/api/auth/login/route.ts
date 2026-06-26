// users\app\api\auth\login\route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập email và mật khẩu' },
        { status: 400 }
      );
    }

    // Tìm user theo email
    const [users]: any = await pool.query(
      'SELECT * FROM khachhang WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.matkhau || '');

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Trả về thông tin user (không trả về mật khẩu)
    const { matkhau, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Đăng nhập thất bại' },
      { status: 500 }
    );
  }
}