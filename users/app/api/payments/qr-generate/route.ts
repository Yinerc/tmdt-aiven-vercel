import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OrderRow extends RowDataPacket {
  id: number;
  order_code: string | null;
  tongtien: number | string | null;
  subtotal: number | string | null;
  discount_amount: number | string | null;
  tien_giam: number | string | null;
}

interface PaymentRow extends RowDataPacket {
  id: number;
  donhang_id: number;
  phuong_thuc: string;
  so_tien: number | string;
  trang_thai: string;
  ma_giao_dich: string | null;
  ghi_chu: string | null;
  created_at: Date;
  updated_at: Date;
}

interface QrRow extends RowDataPacket {
  id: number;
  thanh_toan_id: number;
  donhang_id: number;
  qr_code_data: string;
  so_tien: number | string;
  trang_thai: string;
  bank_code: string | null;
  nguon_giao_dich: string | null;
  transaction_id: string | null;
  reference_code: string | null;
  so_lan_quet: number;
  lan_quet_cuoi: Date | null;
  thoi_gian_het_han: Date | string | null;
  is_used: number | boolean;
  created_at: Date;
  updated_at: Date;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function makeReferenceCode(orderId: string | number): string {
  return `TMDT-${orderId}-${Date.now()}`;
}

// POST: Tạo mã QR thanh toán cho đơn hàng
export async function POST(request: NextRequest) {
  let connection: Awaited<ReturnType<typeof db.getConnection>> | null = null;

  try {
    const body = await request.json();

    const orderId = body.orderId || body.donhang_id;
    const bankCode = body.bankCode || body.bank_code || 'VietQR';
    const paymentMethod = body.method || body.paymentMethod || 'qr';
    const note = body.notes || body.ghi_chu || 'Tạo thanh toán QR';

    if (!orderId) {
      return NextResponse.json(
        { error: 'Thiếu orderId' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Kiểm tra đơn hàng tồn tại
      const [orders] = await connection.query<OrderRow[]>(
        `SELECT id, order_code, tongtien, subtotal, discount_amount, tien_giam
         FROM donhang
         WHERE id = ?
         LIMIT 1`,
        [orderId]
      );

      if (orders.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'Đơn hàng không tồn tại' },
          { status: 404 }
        );
      }

      const order = orders[0];

      const amountFromBody = toNumber(body.amount || body.so_tien);
      const amountFromOrder = toNumber(order.tongtien);
      const subtotal = toNumber(order.subtotal);
      const discountAmount = toNumber(order.discount_amount);
      const tienGiam = toNumber(order.tien_giam);

      const amount =
        amountFromBody > 0
          ? amountFromBody
          : amountFromOrder > 0
            ? amountFromOrder
            : Math.max(subtotal - discountAmount - tienGiam, 0);

      if (amount <= 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'Số tiền thanh toán không hợp lệ' },
          { status: 400 }
        );
      }

      // 2. Nếu đã có QR còn hạn và chưa dùng thì trả lại QR cũ
      const [existingQr] = await connection.query<QrRow[]>(
        `SELECT *
         FROM thanh_toan_qr
         WHERE donhang_id = ?
           AND is_used = 0
           AND trang_thai IN ('tao_qr', 'dang_quay')
           AND (thoi_gian_het_han IS NULL OR thoi_gian_het_han > NOW())
         ORDER BY created_at DESC
         LIMIT 1`,
        [orderId]
      );

      if (existingQr.length > 0) {
        await connection.commit();

        const qr = existingQr[0];

        return NextResponse.json({
          success: true,
          data: {
            orderId,
            paymentId: qr.thanh_toan_id,
            qrId: qr.id,
            qrCodeData: qr.qr_code_data,
            amount: toNumber(qr.so_tien),
            status: qr.trang_thai,
            bankCode: qr.bank_code,
            referenceCode: qr.reference_code,
            expiresAt: qr.thoi_gian_het_han,
            message: 'Đơn hàng đã có mã QR còn hiệu lực',
          },
        });
      }

      // 3. Tìm giao dịch thanh toán QR đã có
      const [payments] = await connection.query<PaymentRow[]>(
        `SELECT *
         FROM thanh_toan
         WHERE donhang_id = ?
           AND phuong_thuc = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [orderId, paymentMethod]
      );

      let paymentId: number;

      if (payments.length > 0) {
        paymentId = payments[0].id;
      } else {
        const [paymentResult] = await connection.query<ResultSetHeader>(
          `INSERT INTO thanh_toan
           (donhang_id, phuong_thuc, so_tien, trang_thai, ghi_chu)
           VALUES (?, ?, ?, 'cho_thanh_toan', ?)`,
          [orderId, paymentMethod, amount, note]
        );

        paymentId = paymentResult.insertId;
      }

      // 4. Tạo QR mới
      const referenceCode = makeReferenceCode(orderId);
      const qrCodeData = `TMDT-ORDER-${orderId}-AMOUNT-${amount}-REF-${referenceCode}`;

      const [qrResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO thanh_toan_qr
         (
          thanh_toan_id,
          donhang_id,
          qr_code_data,
          so_tien,
          trang_thai,
          bank_code,
          nguon_giao_dich,
          reference_code,
          thoi_gian_het_han,
          is_used
         )
         VALUES (?, ?, ?, ?, 'tao_qr', ?, 'VIETQR', ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0)`,
        [
          paymentId,
          orderId,
          qrCodeData,
          amount,
          bankCode,
          referenceCode,
        ]
      );

      const qrId = qrResult.insertId;

      // 5. Ghi log tạo QR
      await connection.query<ResultSetHeader>(
        `INSERT INTO thanh_toan_qr_log
         (
          thanh_toan_qr_id,
          thanh_toan_id,
          trang_thai_cu,
          trang_thai_moi,
          ghi_chu
         )
         VALUES (?, ?, NULL, 'tao_qr', ?)`,
        [qrId, paymentId, 'Tạo mã QR thanh toán']
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        data: {
          orderId,
          paymentId,
          qrId,
          qrCodeData,
          amount,
          status: 'tao_qr',
          bankCode,
          referenceCode,
          expiresInMinutes: 10,
          message: 'Tạo mã QR thanh toán thành công',
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Generate QR Payment Error:', error);

    return NextResponse.json(
      { error: 'Lỗi khi tạo mã QR thanh toán' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}