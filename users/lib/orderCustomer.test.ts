import assert from 'node:assert/strict';
import { resolveCustomerId } from './orderCustomer';

async function runTests() {
  const customerExists = async (id: number) => id === 2;

  assert.equal(await resolveCustomerId(null, customerExists), null);
  assert.equal(await resolveCustomerId('', customerExists), null);
  assert.equal(await resolveCustomerId('2', customerExists), 2);
  assert.equal(await resolveCustomerId(999, customerExists), null);

  console.log('orderCustomer tests passed');
}

runTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
