import { NextRequest, NextResponse } from 'next/server';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface QrRecordRow extends RowDataPacket {
  qr_id: number;
  thanh_toan_id: number;
  donhang_id: number;
  qr_code_data: string;
  so_tien: number | string;
  qr_status: string;
  bank_code: string | null;
  nguon_giao_dich: string | null;
  transaction_id: string | null;
  reference_code: string | null;
  so_lan_quet: number;
  lan_quet_cuoi: Date | string | null;
  thoi_gian_het_han: Date | string | null;
  is_used: number | boolean;
  created_at: Date | string;
  updated_at: Date | string;

  phuong_thuc: string;
  payment_status: string;
  ma_giao_dich: string | null;
  ghi_chu: string | null;

  order_code: string | null;
  order_status: string | null;
  tongtien: number | string | null;
}

interface QrLogRow extends RowDataPacket {
  id: number;
  thanh_toan_qr_id: number;
  thanh_toan_id: number | null;
  trang_thai_cu: string | null;
  trang_thai_moi: string;
  ghi_chu: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date | string;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function isExpired(value: Date | string | null | undefined): boolean {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}

function mapQrStatus(status: string | undefined | null): string {
  const value = String(status || '').toLowerCase();

  if (['paid', 'success', 'completed', 'da_thanh_toan', 'da_nhan_tien'].includes(value)) {
    return 'da_nhan_tien';
  }

  if (['failed', 'that_bai', 'cancelled', 'canceled'].includes(value)) {
    return 'that_bai';
  }

  if (['expired', 'het_han'].includes(value)) {
    return 'het_han';
  }

  if (['scanned', 'dang_quay', 'dang_quet'].includes(value)) {
    return 'dang_quay';
  }

  return 'dang_quay';
}

function mapPaymentStatus(qrStatus: string): string {
  if (qrStatus === 'da_nhan_tien') return 'da_thanh_toan';
  if (qrStatus === 'that_bai') return 'that_bai';
  return 'cho_thanh_toan';
}

function getIpAddress(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || null;

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return null;
}

// GET: Kiểm tra trạng thái QR
export async function GET(request: NextRequest) {
  let connection: Awaited<ReturnType<typeof db.getConnection>> | null = null;

  try {
    const { searchParams } = new URL(request.url);

    const qrId = searchParams.get('qrId') || searchParams.get('id');
    const orderId = searchParams.get('orderId') || searchParams.get('donhang_id');
    const qrCodeData = searchParams.get('qrCodeData') || searchParams.get('qr_code_data');
    const referenceCode = searchParams.get('referenceCode') || searchParams.get('reference_code');
    const transactionId = searchParams.get('transactionId') || searchParams.get('transaction_id');

    if (!qrId && !orderId && !qrCodeData && !referenceCode && !transactionId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin QR cần kiểm tra' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    const where: string[] = [];
    const params: Array<string | number> = [];

    if (qrId) {
      where.push('tq.id = ?');
      params.push(qrId);
    }

    if (orderId) {
      where.push('tq.donhang_id = ?');
      params.push(orderId);
    }

    if (qrCodeData) {
      where.push('tq.qr_code_data = ?');
      params.push(qrCodeData);
    }

    if (referenceCode) {
      where.push('tq.reference_code = ?');
      params.push(referenceCode);
    }

    if (transactionId) {
      where.push('(tq.transaction_id = ? OR tt.ma_giao_dich = ?)');
      params.push(transactionId, transactionId);
    }

    const [records] = await connection.query<QrRecordRow[]>(
      `SELECT 
          tq.id AS qr_id,
          tq.thanh_toan_id,
          tq.donhang_id,
          tq.qr_code_data,
          tq.so_tien,
          tq.trang_thai AS qr_status,
          tq.bank_code,
          tq.nguon_giao_dich,
          tq.transaction_id,
          tq.reference_code,
          tq.so_lan_quet,
          tq.lan_quet_cuoi,
          tq.thoi_gian_het_han,
          tq.is_used,
          tq.created_at,
          tq.updated_at,

          tt.phuong_thuc,
          tt.trang_thai AS payment_status,
          tt.ma_giao_dich,
          tt.ghi_chu,

          dh.order_code,
          dh.trangthai AS order_status,
          dh.tongtien
       FROM thanh_toan_qr tq
       LEFT JOIN thanh_toan tt ON tq.thanh_toan_id = tt.id
       LEFT JOIN donhang dh ON tq.donhang_id = dh.id
       WHERE ${where.join(' AND ')}
       ORDER BY tq.created_at DESC
       LIMIT 1`,
      params
    );

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'Không tìm thấy QR' },
        { status: 404 }
      );
    }

    const record = records[0];

    const [logs] = await connection.query<QrLogRow[]>(
      `SELECT *
       FROM thanh_toan_qr_log
       WHERE thanh_toan_qr_id = ?
       ORDER BY created_at DESC`,
      [record.qr_id]
    );

    return NextResponse.json({
      success: true,
      data: {
        qrId: record.qr_id,
        paymentId: record.thanh_toan_id,
        orderId: record.donhang_id,
        orderCode: record.order_code,
        qrCodeData: record.qr_code_data,
        amount: toNumber(record.so_tien),
        qrStatus: record.qr_status,
        paymentStatus: record.payment_status,
        orderStatus: record.order_status,
        bankCode: record.bank_code,
        transactionId: record.transaction_id || record.ma_giao_dich,
        referenceCode: record.reference_code,
        scannedCount: record.so_lan_quet,
        lastScannedAt: record.lan_quet_cuoi,
        expiresAt: record.thoi_gian_het_han,
        isExpired: isExpired(record.thoi_gian_het_han),
        isUsed: Boolean(record.is_used),
        logs,
      },
    });
  } catch (error) {
    console.error('Verify QR GET Error:', error);

    return NextResponse.json(
      { error: 'Lỗi khi kiểm tra QR' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// POST: Verify / cập nhật trạng thái QR
export async function POST(request: NextRequest) {
  let connection: Awaited<ReturnType<typeof db.getConnection>> | null = null;

  try {
    const body = await request.json();

    const qrId = body.qrId || body.id;
    const orderId = body.orderId || body.donhang_id;
    const qrCodeData = body.qrCodeData || body.qr_code_data;
    const referenceCode = body.referenceCode || body.reference_code;
    const transactionId = body.transactionId || body.transaction_id || body.ma_giao_dich;
    const inputStatus = body.status || body.trang_thai || body.paymentStatus;
    const note = body.notes || body.ghi_chu || 'Xác minh QR thanh toán';

    if (!qrId && !orderId && !qrCodeData && !referenceCode && !transactionId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin QR cần xác minh' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const where: string[] = [];
      const params: Array<string | number> = [];

      if (qrId) {
        where.push('tq.id = ?');
        params.push(qrId);
      }

      if (orderId) {
        where.push('tq.donhang_id = ?');
        params.push(orderId);
      }

      if (qrCodeData) {
        where.push('tq.qr_code_data = ?');
        params.push(qrCodeData);
      }

      if (referenceCode) {
        where.push('tq.reference_code = ?');
        params.push(referenceCode);
      }

      if (transactionId) {
        where.push('(tq.transaction_id = ? OR tt.ma_giao_dich = ? OR tq.reference_code = ?)');
        params.push(transactionId, transactionId, transactionId);
      }

      const [records] = await connection.query<QrRecordRow[]>(
        `SELECT 
            tq.id AS qr_id,
            tq.thanh_toan_id,
            tq.donhang_id,
            tq.qr_code_data,
            tq.so_tien,
            tq.trang_thai AS qr_status,
            tq.bank_code,
            tq.nguon_giao_dich,
            tq.transaction_id,
            tq.reference_code,
            tq.so_lan_quet,
            tq.lan_quet_cuoi,
            tq.thoi_gian_het_han,
            tq.is_used,
            tq.created_at,
            tq.updated_at,

            tt.phuong_thuc,
            tt.trang_thai AS payment_status,
            tt.ma_giao_dich,
            tt.ghi_chu,

            dh.order_code,
            dh.trangthai AS order_status,
            dh.tongtien
         FROM thanh_toan_qr tq
         LEFT JOIN thanh_toan tt ON tq.thanh_toan_id = tt.id
         LEFT JOIN donhang dh ON tq.donhang_id = dh.id
         WHERE ${where.join(' AND ')}
         ORDER BY tq.created_at DESC
         LIMIT 1
         FOR UPDATE`,
        params
      );

      if (records.length === 0) {
        await connection.rollback();

        return NextResponse.json(
          { error: 'Không tìm thấy QR' },
          { status: 404 }
        );
      }

      const record = records[0];

      let newQrStatus = mapQrStatus(inputStatus);

      if (isExpired(record.thoi_gian_het_han) && record.qr_status !== 'da_nhan_tien') {
        newQrStatus = 'het_han';
      }

      const newPaymentStatus = mapPaymentStatus(newQrStatus);
      const oldQrStatus = record.qr_status;

      const newTransactionId =
        transactionId || record.transaction_id || record.ma_giao_dich || null;

      await connection.query<ResultSetHeader>(
        `UPDATE thanh_toan_qr
         SET 
           trang_thai = ?,
           transaction_id = COALESCE(?, transaction_id),
           so_lan_quet = so_lan_quet + 1,
           lan_quet_cuoi = NOW(),
           is_used = CASE WHEN ? = 'da_nhan_tien' THEN 1 ELSE is_used END,
           updated_at = NOW()
         WHERE id = ?`,
        [
          newQrStatus,
          newTransactionId,
          newQrStatus,
          record.qr_id,
        ]
      );

      await connection.query<ResultSetHeader>(
        `UPDATE thanh_toan
         SET 
           trang_thai = ?,
           ma_giao_dich = COALESCE(?, ma_giao_dich),
           updated_at = NOW()
         WHERE id = ?`,
        [
          newPaymentStatus,
          newTransactionId,
          record.thanh_toan_id,
        ]
      );

      if (newQrStatus === 'da_nhan_tien') {
        await connection.query<ResultSetHeader>(
          `UPDATE donhang
           SET 
             trangthai = 'da_thanh_toan',
             updated_at = NOW()
           WHERE id = ?`,
          [record.donhang_id]
        );
      }

      await connection.query<ResultSetHeader>(
        `INSERT INTO thanh_toan_qr_log
         (
          thanh_toan_qr_id,
          thanh_toan_id,
          trang_thai_cu,
          trang_thai_moi,
          ghi_chu,
          ip_address,
          user_agent
         )
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          record.qr_id,
          record.thanh_toan_id,
          oldQrStatus,
          newQrStatus,
          note,
          getIpAddress(request),
          request.headers.get('user-agent'),
        ]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        data: {
          qrId: record.qr_id,
          paymentId: record.thanh_toan_id,
          orderId: record.donhang_id,
          orderCode: record.order_code,
          amount: toNumber(record.so_tien),
          oldStatus: oldQrStatus,
          qrStatus: newQrStatus,
          paymentStatus: newPaymentStatus,
          transactionId: newTransactionId,
          referenceCode: record.reference_code,
          isExpired: isExpired(record.thoi_gian_het_han),
          message: 'Xác minh QR thành công',
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Verify QR POST Error:', error);

    return NextResponse.json(
      { error: 'Lỗi khi xác minh QR' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}