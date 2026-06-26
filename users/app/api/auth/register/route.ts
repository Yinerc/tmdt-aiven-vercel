// users\app\api\auth\register\route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { fullName, email, password } = await request.json();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    // Kiểm tra email đã tồn tại chưa
    const [existing]: any = await pool.query(
      'SELECT id FROM khachhang WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Email đã được sử dụng' },
        { status: 400 }
      );
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo tài khoản mới
    await pool.query(
      `INSERT INTO khachhang (hoten, email, matkhau, created_at) 
       VALUES (?, ?, ?, NOW())`,
      [fullName, email, hashedPassword]
    );

    return NextResponse.json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng đăng nhập.',
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: 'Đăng ký thất bại', error: error.message },
      { status: 500 }
    );
  }
}