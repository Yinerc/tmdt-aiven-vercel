// users\app\api\profile\route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const { userId, fullName, phone, address, city } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin người dùng' },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE khachhang 
       SET hoten = ?, sodienthoai = ?, diachi = ? 
       WHERE id = ?`,
      [fullName, phone, address, userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Cập nhật thất bại' },
      { status: 500 }
    );
  }
}