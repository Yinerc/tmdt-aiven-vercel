import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

interface PaymentRow extends RowDataPacket {
  id: number;
  donhang_id: number;
  phuong_thuc: string;
  so_tien: number;
  trang_thai: string;
  ma_giao_dich: string | null;
  ghi_chu: string | null;
  created_at: Date;
  updated_at: Date;

  qr_id: number | null;
  qr_code_data: string | null;
  qr_status: string | null;
  qr_amount: number | null;
  bank_code: string | null;
  transaction_id: string | null;
  reference_code: string | null;
  so_lan_quet: number | null;
  thoi_gian_het_han: Date | string | null;
}

interface PaymentLogRow extends RowDataPacket {
  id: number;
  thanh_toan_qr_id: number;
  thanh_toan_id: number | null;
  trang_thai_cu: string | null;
  trang_thai_moi: string;
  ghi_chu: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

interface OrderRow extends RowDataPacket {
  id: number;
}

// GET: Lấy thông tin thanh toán của đơn hàng
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Thiếu orderId' },
        { status: 400 }
      );
    }

    const connection = await db.getConnection();

    try {
      const [payments] = await connection.query<PaymentRow[]>(
        `SELECT tp.*, 
                tq.id AS qr_id, 
                tq.qr_code_data, 
                tq.trang_thai AS qr_status,
                tq.so_tien AS qr_amount, 
                tq.bank_code, 
                tq.transaction_id, 
                tq.reference_code, 
                tq.so_lan_quet, 
                tq.thoi_gian_het_han
         FROM thanh_toan tp
         LEFT JOIN thanh_toan_qr tq ON tp.id = tq.thanh_toan_id
         WHERE tp.donhang_id = ?
         ORDER BY tp.created_at DESC`,
        [orderId]
      );

      if (payments.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            orderId,
            payments: [],
            message: 'Chưa có giao dịch thanh toán',
          },
        });
      }

      const [logs] = await connection.query<PaymentLogRow[]>(
        `SELECT tql.* 
         FROM thanh_toan_qr_log tql
         JOIN thanh_toan_qr tq ON tql.thanh_toan_qr_id = tq.id
         WHERE tq.donhang_id = ?
         ORDER BY tql.created_at DESC`,
        [orderId]
      );

      const formattedPayments = payments.map((payment) => {
        const expiresAt = payment.thoi_gian_het_han;

        return {
          paymentId: payment.id,
          method: payment.phuong_thuc,
          amount: payment.so_tien,
          status: payment.trang_thai,
          transactionCode: payment.ma_giao_dich,
          notes: payment.ghi_chu,
          qr: payment.qr_id
            ? {
                id: payment.qr_id,
                qrCodeData: payment.qr_code_data,
                status: payment.qr_status,
                amount: payment.qr_amount,
                bankCode: payment.bank_code,
                transactionId: payment.transaction_id,
                referenceCode: payment.reference_code,
                scannedCount: payment.so_lan_quet,
                expiresAt,
                isExpired: expiresAt ? new Date(expiresAt) < new Date() : false,
              }
            : null,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          orderId,
          payments: formattedPayments,
          logs,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get Payment Info Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy thông tin thanh toán' },
      { status: 500 }
    );
  }
}

// POST: Cập nhật thông tin thanh toán
export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;
    const { method, amount, notes } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Thiếu orderId' },
        { status: 400 }
      );
    }

    if (!method || !amount) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const connection = await db.getConnection();

    try {
      const [orders] = await connection.query<OrderRow[]>(
        'SELECT id FROM donhang WHERE id = ?',
        [orderId]
      );

      if (orders.length === 0) {
        return NextResponse.json(
          { error: 'Đơn hàng không tồn tại' },
          { status: 404 }
        );
      }

      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO thanh_toan 
         (donhang_id, phuong_thuc, so_tien, trang_thai, ghi_chu)
         VALUES (?, ?, ?, 'cho_thanh_toan', ?)`,
        [orderId, method, amount, notes || null]
      );

      return NextResponse.json({
        success: true,
        data: {
          paymentId: result.insertId,
          orderId,
          method,
          amount,
          status: 'cho_thanh_toan',
          message: 'Tạo giao dịch thanh toán thành công',
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create Payment Error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tạo giao dịch thanh toán' },
      { status: 500 }
    );
  }
}