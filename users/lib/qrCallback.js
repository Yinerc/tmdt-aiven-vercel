async function resolveQrRecord(connection, qrId) {
  if (!connection || !qrId) return null;

  const [rows] = await connection.query(
    'SELECT * FROM thanh_toan_qr WHERE id = ? LIMIT 1',
    [qrId]
  );

  if (rows && rows.length > 0) {
    return rows[0];
  }

  const [rowsByCode] = await connection.query(
    'SELECT * FROM thanh_toan_qr WHERE qr_code_data = ? LIMIT 1',
    [qrId]
  );

  return rowsByCode && rowsByCode.length > 0 ? rowsByCode[0] : null;
}

async function markQrPaid(connection, qrRecord, transactionId, referenceCode, bankCode) {
  if (!connection || !qrRecord) return null;

  await connection.query(
    `UPDATE thanh_toan_qr
     SET trang_thai = 'da_nhan_tien', transaction_id = ?, reference_code = ?, bank_code = ?, is_used = TRUE, updated_at = NOW()
     WHERE id = ?`,
    [transactionId, referenceCode, bankCode, qrRecord.id]
  );

  await connection.query(
    `UPDATE thanh_toan
     SET trang_thai = 'da_thanh_toan', ma_giao_dich = ?, updated_at = NOW()
     WHERE id = ?`,
    [transactionId, qrRecord.thanh_toan_id]
  );

  await connection.query(
    `UPDATE donhang
     SET trangthai = 'da_thanh_toan', updated_at = NOW()
     WHERE id = ?`,
    [qrRecord.donhang_id]
  );

  await connection.query(
    `INSERT INTO don_hang_trang_thai (donhang_id, trang_thai_cu, trang_thai_moi, ghi_chu, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [qrRecord.donhang_id, 'cho_thanh_toan', 'da_thanh_toan', 'Thanh toán QR thành công', 'system']
  );

  return { success: true };
}

module.exports = {
  resolveQrRecord,
  markQrPaid,
};
