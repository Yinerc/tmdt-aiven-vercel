const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveQrRecord } = require('./qrCallback');

test('resolves QR record by qr_code_data when qrId is a string token', async () => {
  const queries = [];
  const connection = {
    query: async (sql, params) => {
      queries.push({ sql, params });
      if (sql.includes('WHERE id = ?')) {
        return [[]];
      }
      if (sql.includes('WHERE qr_code_data = ?')) {
        return [[{ id: 7, qr_code_data: 'TMDT-ORDER-1-100000' }]];
      }
      return [[]];
    },
  };

  const record = await resolveQrRecord(connection, 'TMDT-ORDER-1-100000');

  assert.equal(record.id, 7);
  assert.equal(queries[0].params[0], 'TMDT-ORDER-1-100000');
});

test('resolves QR record by id when qrId is numeric', async () => {
  const connection = {
    query: async (sql, params) => {
      if (sql.includes('WHERE id = ?')) {
        return [[{ id: 12, qr_code_data: 'abc' }]];
      }
      return [[]];
    },
  };

  const record = await resolveQrRecord(connection, '12');

  assert.equal(record.id, 12);
});
