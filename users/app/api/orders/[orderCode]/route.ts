// users\app\api\orders\[orderCode]\route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderCode: string }> }
) {
  try {
    const { orderCode } = await params;

    // Lấy thông tin đơn hàng
    const [orders]: any = await pool.query(
      `SELECT * FROM donhang WHERE order_code = ?`,
      [orderCode.toUpperCase()]
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // Lấy danh sách sản phẩm trong đơn hàng
    const [items]: any = await pool.query(
      `
      SELECT 
        dc.id,
        dc.sanpham_id,
        dc.soluong,
        dc.dongia,
        sp.tensanpham,
        sp.hinhanh
      FROM donhang_chitiet dc
      LEFT JOIN sanpham sp ON dc.sanpham_id = sp.id
      WHERE dc.donhang_id = ?
      `,
      [order.id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        items: items,
      },
    });
  } catch (error: any) {
    console.error('Get order detail error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server' },
      { status: 500 }
    );
  }
}