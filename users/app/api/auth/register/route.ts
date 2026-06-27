import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CustomerRow extends RowDataPacket {
  id: number;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const hoten = String(
      body.hoten || body.name || body.fullName || body.tenkhachhang || ''
    ).trim();

    const email = String(body.email || '').trim().toLowerCase();

    const password = String(
      body.password || body.matkhau || body.pass || ''
    );

    const sodienthoai = String(
      body.sodienthoai || body.phone || body.sdt || ''
    ).trim();

    const diachi = String(
      body.diachi || body.address || ''
    ).trim();

    if (!hoten || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu',
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: 'Mật khẩu phải có ít nhất 6 ký tự',
        },
        { status: 400 }
      );
    }

    const [existingUsers] = await pool.query<CustomerRow[]>(
      'SELECT id, email FROM khachhang WHERE email = ? LIMIT 1',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email này đã được đăng ký',
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO khachhang 
        (hoten, email, matkhau, sodienthoai, diachi)
      VALUES 
        (?, ?, ?, ?, ?)
      `,
      [hoten, email, hashedPassword, sodienthoai, diachi]
    );

    return NextResponse.json({
      success: true,
      message: 'Đăng ký thành công',
      user: {
        id: result.insertId,
        hoten,
        email,
        sodienthoai,
        diachi,
      },
    });
  } catch (error) {
    console.error('REGISTER_ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Đăng ký thất bại',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}