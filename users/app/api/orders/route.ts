// users\app\api\orders\route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { resolveCustomerId } from '@/lib/orderCustomer';
const { linkQrPaymentToOrder } = require('@/lib/qrOrderLink');

// ==================== LẤY DANH SÁCH ĐƠN HÀNG ====================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu userId' },
        { status: 400 }
      );
    }

    const [orders]: any = await pool.query(
      `SELECT 
        id, 
        order_code, 
        tongtien, 
        trangthai, 
        ghichu, 
        created_at 
       FROM donhang 
       WHERE khachhang_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server' },
      { status: 500 }
    );
  }
}

// ==================== TẠO ĐƠN HÀNG ====================
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerId,
      fullName,
      phone,
      address,
      city,
      note,
      paymentMethod,
      cartItems,
      subtotal,
      discountAmount,
      totalAmount,
      voucherCode,
      qrId,
    } = body;

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Giỏ hàng trống' },
        { status: 400 }
      );
    }

    if (!fullName || !phone || !address) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin giao hàng' },
        { status: 400 }
      );
    }

    const finalCustomerId = await resolveCustomerId(customerId, async (id: number) => {
      const [rows]: any = await pool.query('SELECT id FROM khachhang WHERE id = ?', [id]);
      return rows.length > 0;
    });

    const orderCode = 'DH' + Date.now().toString().slice(-8).toUpperCase();

    const [orderResult]: any = await pool.query(
      `
      INSERT INTO donhang (
        order_code,
        khachhang_id,
        full_name,
        phone,
        address,
        city,
        subtotal,
        discount_amount,
        tongtien,
        voucher_code,
        payment_method,
        trangthai,
        ghichu,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cho_xu_ly', ?, NOW())
      `,
      [
        orderCode,
        finalCustomerId,
        fullName,
        phone,
        address,
        city || null,
        subtotal || 0,
        discountAmount || 0,
        totalAmount || 0,
        voucherCode || null,
        paymentMethod || 'cod',
        note || null,
      ]
    );

    const orderId = orderResult.insertId;

    const orderItems = cartItems.map((item: any) => [
      orderId,
      item.id,
      item.quantity,
      item.price || item.gia || 0,
    ]);

    await pool.query(
      `
      INSERT INTO donhang_chitiet 
      (donhang_id, sanpham_id, soluong, dongia)
      VALUES ?
      `,
      [orderItems]
    );

    if (paymentMethod === 'bank' && qrId) {
      await linkQrPaymentToOrder({
        connection: pool,
        orderId,
        amount: totalAmount || 0,
        qrId,
        paymentMethod,
      });
    }

    return NextResponse.json({
      success: true,
      orderCode,
      message: 'Đặt hàng thành công!',
    });
  } catch (error: any) {
    console.error('Create order error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Không thể tạo đơn hàng',
        error: error.message,
      },
      { status: 500 }
    );
  }
}