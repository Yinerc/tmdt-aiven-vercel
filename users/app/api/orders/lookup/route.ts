// users\app\api\orders\lookup\route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderCode = searchParams.get('orderCode');
  const phone = searchParams.get('phone');

  if (!orderCode || !phone) {
    return NextResponse.json({ success: false, message: 'Thiếu thông tin tra cứu' }, { status: 400 });
  }

  try {
    const [orders]: any = await pool.query(
      `SELECT * FROM donhang 
       WHERE order_code = ? AND phone = ?`,
      [orderCode.toUpperCase(), phone]
    );

    if (orders.length === 0) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: orders[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}