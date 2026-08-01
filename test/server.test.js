const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer, quotePrice } = require('../server');

test('quotePrice combines material loss and selected processing items', () => {
  const store = {
    products: [{ id: 'P1', name: '测试岩板', spec: '1000 × 2000 × 12mm', price: 100 }],
    customizations: [{ id: 'C1', price: 20, enabled: true }, { id: 'C2', price: 50, enabled: false }]
  };
  const result = quotePrice(store, { productId: 'P1', quantity: 2, wasteRate: 10, customizationIds: ['C1', 'C2'] });
  assert.equal(result.materialAmount, 440);
  assert.equal(result.processingAmount, 40);
  assert.equal(result.totalAmount, 480);
});

test('server exposes bootstrap data and prevents browser caching', async (context) => {
  const server = createServer().listen(0);
  context.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/bootstrap`);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(payload.company.userName, '冼国楷');
  assert.ok(payload.customizations.length >= 4);
});
