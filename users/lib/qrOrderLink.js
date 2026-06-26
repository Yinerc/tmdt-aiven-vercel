function extractInsertId(result) {
  if (!result) return null;
  if (typeof result === 'object' && 'insertId' in result) return result.insertId;
  if (Array.isArray(result)) {
    for (const item of result) {
      if (item && typeof item === 'object' && 'insertId' in item) return item.insertId;
      if (Array.isArray(item) && item[0] && typeof item[0] === 'object' && 'insertId' in item[0]) {
        return item[0].insertId;
      }
    }
  }
  return null;
}

async function linkQrPaymentToOrder({ connection, orderId, amount, qrId, paymentMethod }) {
  if (!connection || !orderId || !qrId || paymentMethod !== 'bank') {
    return { linked: false, reason: 'QR link not required' };
  }

  const paymentResult = await connection.query(
    `INSERT INTO thanh_toan (donhang_id, phuong_thuc, so_tien, trang_thai) VALUES (?, ?, ?, ?)`,
    [orderId, 'qr', amount || 0, 'cho_thanh_toan']
  );

  const paymentId = extractInsertId(paymentResult);

  const qrRowsResult = await connection.query(
    `SELECT id FROM thanh_toan_qr WHERE qr_code_data = ? LIMIT 1`,
    [qrId]
  );
  const qrRows = qrRowsResult?.[0] || [];

  let qrRecordId = null;

  if (qrRows && qrRows.length > 0) {
    await connection.query(
      `UPDATE thanh_toan_qr
       SET thanh_toan_id = ?, donhang_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [paymentId, orderId, qrRows[0].id]
    );
    qrRecordId = qrRows[0].id;
  } else {
    const insertResult = await connection.query(
      `INSERT INTO thanh_toan_qr
       (thanh_toan_id, donhang_id, qr_code_data, so_tien, trang_thai, nguon_giao_dich, thoi_gian_het_han, is_used)
       VALUES (?, ?, ?, ?, 'tao_qr', 'MOMO', DATE_ADD(NOW(), INTERVAL 10 MINUTE), FALSE)`,
      [paymentId, orderId, qrId, amount || 0]
    );
    qrRecordId = extractInsertId(insertResult);
  }

  await connection.query(
    `INSERT INTO thanh_toan_qr_log
     (thanh_toan_qr_id, thanh_toan_id, trang_thai_cu, trang_thai_moi, ghi_chu)
     VALUES (?, ?, ?, ?, ?)`,
    [qrRecordId, paymentId, null, 'tao_qr', 'Liên kết QR với đơn hàng']
  );

  return { linked: true, paymentId, qrRecordId };
}

module.exports = {
  linkQrPaymentToOrder,
};
