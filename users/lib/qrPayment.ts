import db from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface OrderRow extends RowDataPacket {
  id: number;
  order_code?: string | null;
  tongtien?: number | string | null;
  subtotal?: number | string | null;
  discount_amount?: number | string | null;
  tien_giam?: number | string | null;
}

interface PaymentRow extends RowDataPacket {
  id: number;
  donhang_id: number;
  phuong_thuc: string;
  so_tien: number | string;
  trang_thai: string;
  ma_giao_dich?: string | null;
  ghi_chu?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

interface QrPaymentRow extends RowDataPacket {
  id: number;
  thanh_toan_id: number;
  donhang_id: number;
  qr_code_data: string;
  so_tien: number | string;
  trang_thai: string;
  bank_code?: string | null;
  nguon_giao_dich?: string | null;
  transaction_id?: string | null;
  reference_code?: string | null;
  so_lan_quet?: number;
  lan_quet_cuoi?: Date | string | null;
  thoi_gian_het_han?: Date | string | null;
  is_used?: number | boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
  payment_status?: string | null;
}

interface QRPaymentData {
  orderId: number;
  amount: number;
  bankCode: string;
  accountNumber: string;
}

interface PaymentStatus {
  qrId: string;
  orderId: number;
  status: string;
  isExpired: boolean;
  transactionId: string | null;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function checkExpired(value: Date | string | null | undefined): boolean {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}

/**
 * Tạo mã QR code cho thanh toán
 */
export async function createQRPayment(data: QRPaymentData): Promise<{
  qrId: number;
  paymentId: number;
  orderId: number;
  qrCodeData: string;
  amount: number;
  bankCode: string;
  accountNumber: string;
  vietQRUrl: string;
  expiresAt: string;
  status: string;
}> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    try {
      // Kiểm tra đơn hàng
      const [orders] = await connection.query<OrderRow[]>(
        'SELECT id, tongtien FROM donhang WHERE id = ? LIMIT 1',
        [data.orderId]
      );

      if (orders.length === 0) {
        throw new Error('Đơn hàng không tồn tại');
      }

      const order = orders[0];
      const amount = data.amount > 0 ? data.amount : toNumber(order.tongtien);

      if (amount <= 0) {
        throw new Error('Số tiền thanh toán không hợp lệ');
      }

      // Tạo hoặc lấy giao dịch thanh toán
      const [payments] = await connection.query<PaymentRow[]>(
        'SELECT id FROM thanh_toan WHERE donhang_id = ? AND phuong_thuc = ? ORDER BY created_at DESC LIMIT 1',
        [data.orderId, 'qr']
      );

      let paymentId: number;

      if (payments.length > 0) {
        paymentId = payments[0].id;
      } else {
        const [result] = await connection.query<ResultSetHeader>(
          'INSERT INTO thanh_toan (donhang_id, phuong_thuc, so_tien, trang_thai) VALUES (?, ?, ?, ?)',
          [data.orderId, 'qr', amount, 'cho_thanh_toan']
        );

        paymentId = result.insertId;
      }

      // Tạo mã QR
      const qrCodeData = `TMDT-ORDER-${data.orderId}-${amount}`;

      await connection.query<ResultSetHeader>(
        `INSERT INTO thanh_toan_qr 
         (
          thanh_toan_id, 
          donhang_id, 
          qr_code_data, 
          so_tien, 
          trang_thai, 
          bank_code, 
          nguon_giao_dich, 
          thoi_gian_het_han,
          is_used
         )
         VALUES (?, ?, ?, ?, 'tao_qr', ?, 'VIETQR', DATE_ADD(NOW(), INTERVAL 15 MINUTE), 0)
         ON DUPLICATE KEY UPDATE
           thanh_toan_id = VALUES(thanh_toan_id),
           donhang_id = VALUES(donhang_id),
           so_tien = VALUES(so_tien),
           trang_thai = 'tao_qr',
           bank_code = VALUES(bank_code),
           nguon_giao_dich = VALUES(nguon_giao_dich),
           thoi_gian_het_han = DATE_ADD(NOW(), INTERVAL 15 MINUTE),
           is_used = 0,
           updated_at = NOW()`,
        [paymentId, data.orderId, qrCodeData, amount, data.bankCode]
      );

      // Lấy lại QR để có id chính xác, kể cả trường hợp ON DUPLICATE KEY UPDATE
      const [qrRows] = await connection.query<QrPaymentRow[]>(
        'SELECT id, thoi_gian_het_han FROM thanh_toan_qr WHERE qr_code_data = ? LIMIT 1',
        [qrCodeData]
      );

      if (qrRows.length === 0) {
        throw new Error('Không thể tạo mã QR');
      }

      const qr = qrRows[0];
      const qrId = qr.id;

      // Log
      await connection.query<ResultSetHeader>(
        'INSERT INTO thanh_toan_qr_log (thanh_toan_qr_id, thanh_toan_id, trang_thai_moi, ghi_chu) VALUES (?, ?, ?, ?)',
        [qrId, paymentId, 'tao_qr', 'Tạo mã QR mới']
      );

      await connection.commit();

      return {
        qrId,
        paymentId,
        orderId: data.orderId,
        qrCodeData,
        amount,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        vietQRUrl: generateVietQRUrl(
          data.bankCode,
          data.accountNumber,
          amount,
          `Order ${data.orderId}`
        ),
        expiresAt: qr.thoi_gian_het_han
          ? new Date(qr.thoi_gian_het_han).toISOString()
          : new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: 'tao_qr',
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    connection.release();
  }
}

/**
 * Kiểm tra và cập nhật trạng thái QR
 */
export async function checkQRStatus(qrId: string): Promise<PaymentStatus> {
  const connection = await db.getConnection();

  try {
    const [records] = await connection.query<QrPaymentRow[]>(
      'SELECT * FROM thanh_toan_qr WHERE id = ? LIMIT 1',
      [qrId]
    );

    if (records.length === 0) {
      throw new Error('Mã QR không tồn tại');
    }

    const qr = records[0];
    const isExpired = checkExpired(qr.thoi_gian_het_han);

    return {
      qrId: String(qr.id),
      orderId: qr.donhang_id,
      status: isExpired ? 'het_han' : qr.trang_thai,
      isExpired,
      transactionId: qr.transaction_id ?? null,
    };
  } finally {
    connection.release();
  }
}

/**
 * Xác nhận thanh toán QR
 */
export async function confirmQRPayment(
  qrId: string,
  transactionId: string,
  referenceCode: string
): Promise<{
  success: boolean;
  qrId: string;
  orderId: number;
  transactionId: string;
  message: string;
}> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    try {
      const [qrRecords] = await connection.query<QrPaymentRow[]>(
        'SELECT * FROM thanh_toan_qr WHERE id = ? LIMIT 1 FOR UPDATE',
        [qrId]
      );

      if (qrRecords.length === 0) {
        throw new Error('Mã QR không tồn tại');
      }

      const qr = qrRecords[0];

      // Cập nhật QR
      await connection.query<ResultSetHeader>(
        `UPDATE thanh_toan_qr 
         SET 
           trang_thai = 'da_nhan_tien', 
           transaction_id = ?, 
           reference_code = ?, 
           is_used = 1,
           updated_at = NOW()
         WHERE id = ?`,
        [transactionId, referenceCode, qrId]
      );

      // Cập nhật thanh toán
      await connection.query<ResultSetHeader>(
        `UPDATE thanh_toan 
         SET 
           trang_thai = 'da_thanh_toan', 
           ma_giao_dich = ?,
           updated_at = NOW()
         WHERE id = ?`,
        [transactionId, qr.thanh_toan_id]
      );

      // Cập nhật đơn hàng
      await connection.query<ResultSetHeader>(
        `UPDATE donhang 
         SET 
           trangthai = 'da_thanh_toan', 
           updated_at = NOW() 
         WHERE id = ?`,
        [qr.donhang_id]
      );

      // Log trạng thái đơn hàng
      await connection.query<ResultSetHeader>(
        'INSERT INTO don_hang_trang_thai (donhang_id, trang_thai_cu, trang_thai_moi, created_by) VALUES (?, ?, ?, ?)',
        [qr.donhang_id, 'cho_thanh_toan', 'da_thanh_toan', 'system']
      );

      // Log trạng thái QR
      await connection.query<ResultSetHeader>(
        'INSERT INTO thanh_toan_qr_log (thanh_toan_qr_id, thanh_toan_id, trang_thai_cu, trang_thai_moi, ghi_chu) VALUES (?, ?, ?, ?, ?)',
        [qr.id, qr.thanh_toan_id, qr.trang_thai, 'da_nhan_tien', 'Xác nhận thanh toán QR']
      );

      await connection.commit();

      return {
        success: true,
        qrId,
        orderId: qr.donhang_id,
        transactionId,
        message: 'Xác nhận thanh toán thành công',
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    connection.release();
  }
}

/**
 * Tạo URL VietQR
 */
function generateVietQRUrl(
  bankCode: string,
  accountNumber: string,
  amount: number,
  description: string
): string {
  const encodedDesc = encodeURIComponent(description);
  return `https://api.vietqr.io/image/${bankCode}-${accountNumber}-${amount}-${encodedDesc}`;
}

/**
 * Lấy lịch sử QR payment
 */
export async function getQRPaymentHistory(orderId: number): Promise<QrPaymentRow[]> {
  const connection = await db.getConnection();

  try {
    const [records] = await connection.query<QrPaymentRow[]>(
      `SELECT tq.*, tp.trang_thai AS payment_status
       FROM thanh_toan_qr tq
       LEFT JOIN thanh_toan tp ON tq.thanh_toan_id = tp.id
       WHERE tq.donhang_id = ?
       ORDER BY tq.created_at DESC`,
      [orderId]
    );

    return records;
  } finally {
    connection.release();
  }
}

/**
 * Hết hạn QR payment tự động
 */
export async function expireQRPayments(): Promise<number> {
  const connection = await db.getConnection();

  try {
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE thanh_toan_qr 
       SET trang_thai = 'het_han', updated_at = NOW()
       WHERE trang_thai = 'tao_qr' 
         AND thoi_gian_het_han < NOW()`
    );

    return result.affectedRows ?? 0;
  } finally {
    connection.release();
  }
}