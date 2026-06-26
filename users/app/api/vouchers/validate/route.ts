// app/api/vouchers/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { code, orderAmount } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, message: 'Vui lòng nhập mã voucher' });
    }

    const query = `
      SELECT * FROM vouchers 
      WHERE code = ? 
        AND is_active = 1
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
        AND used_count < usage_limit
    `;

    const [rows]: any = await pool.query(query, [code.toUpperCase()]);

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Mã voucher không hợp lệ hoặc đã hết hạn' });
    }

    const voucher = rows[0];

    if (orderAmount < voucher.min_order_amount) {
      return NextResponse.json({
        success: false,
        message: `Đơn hàng tối thiểu ${Number(voucher.min_order_amount).toLocaleString('vi-VN')}₫`,
      });
    }

    // Tính số tiền giảm
    let discountAmount = 0;
    if (voucher.discount_type === 'percent') {
      discountAmount = Math.floor(orderAmount * (voucher.discount_value / 100));
      if (voucher.max_discount_amount) {
        discountAmount = Math.min(discountAmount, voucher.max_discount_amount);
      }
    } else {
      discountAmount = voucher.discount_value;
    }

    return NextResponse.json({
      success: true,
      data: {
        code: voucher.code,
        discountAmount,
        label: voucher.discount_type === 'percent' 
          ? `Giảm ${voucher.discount_value}%` 
          : `Giảm ${voucher.discount_value.toLocaleString('vi-VN')}₫`,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi hệ thống' }, { status: 500 });
  }
}