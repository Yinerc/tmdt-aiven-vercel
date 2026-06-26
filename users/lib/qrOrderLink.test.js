const test = require('node:test');
const assert = require('node:assert/strict');
const { linkQrPaymentToOrder } = require('./qrOrderLink');

test('returns no-op result when payment method is not bank', async () => {
  const connection = {
    query: async () => {
      throw new Error('should not query');
    },
  };

  const result = await linkQrPaymentToOrder({
    connection,
    orderId: 1,
    amount: 100,
    qrId: 'qr-123',
    paymentMethod: 'cod',
  });

  assert.deepStrictEqual(result, { linked: false, reason: 'QR link not required' });
});

test('links QR payment to order when payment method is bank', async () => {
  const queries = [];
  const connection = {
    query: async (sql, params) => {
      queries.push({ sql, params });

      if (sql.includes('INSERT INTO thanh_toan')) {
        return [[{ insertId: 42 }]];
      }

      if (sql.includes('SELECT id FROM thanh_toan_qr')) {
        return [[{ id: 7 }]];
      }

      if (sql.includes('UPDATE thanh_toan_qr')) {
        return [{ affectedRows: 1 }];
      }

      if (sql.includes('INSERT INTO thanh_toan_qr_log')) {
        return [{ insertId: 88 }];
      }

      return [[{}]];
    },
  };

  const result = await linkQrPaymentToOrder({
    connection,
    orderId: 99,
    amount: 250000,
    qrId: 'qr-abc',
    paymentMethod: 'bank',
  });

  assert.equal(result.linked, true);
  assert.equal(result.paymentId, 42);
  assert.equal(result.qrRecordId, 7);
  assert.equal(queries.length, 4);
});
