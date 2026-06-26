const test = require('node:test');
const assert = require('node:assert/strict');
const { deriveQrUiStatus } = require('./qrUiStatus');

test('derives success state for paid QR', () => {
  const state = deriveQrUiStatus({ status: 'da_nhan_tien' });
  assert.equal(state.isSuccess, true);
  assert.equal(state.canConfirm, true);
});

test('derives expired state for expired QR', () => {
  const state = deriveQrUiStatus({ isExpired: true });
  assert.equal(state.isSuccess, false);
  assert.equal(state.canConfirm, false);
});
