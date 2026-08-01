const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const ROOT = __dirname;
const STORE_FILE = path.join(ROOT, 'data', 'store.json');
const PORT = Number(process.env.PORT) || 4173;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

function readStore() {
  return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
}

function writeStore(store) {
  const temporary = `${STORE_FILE}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(store, null, 2)}\n`);
  fs.renameSync(temporary, STORE_FILE);
}

function json(response, status, payload) {
  response.writeHead(status, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
}

async function body(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 1_000_000) throw new Error('请求内容过大');
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function required(data, fields) {
  const missing = fields.filter((field) => data[field] === undefined || data[field] === '');
  if (missing.length) throw new Error(`缺少必填字段：${missing.join('、')}`);
}

function quotePrice(store, input) {
  required(input, ['productId', 'quantity', 'wasteRate']);
  const product = store.products.find((item) => item.id === input.productId);
  if (!product) throw new Error('岩板产品不存在');
  const quantity = Number(input.quantity);
  const wasteRate = Number(input.wasteRate);
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(wasteRate) || wasteRate < 0) throw new Error('数量或损耗率无效');
  const dimensions = product.spec.match(/(\d+)\s*×\s*(\d+)/);
  const area = dimensions ? (Number(dimensions[1]) * Number(dimensions[2])) / 1_000_000 : 1;
  const materialAmount = product.price * area * quantity * (1 + wasteRate / 100);
  const selected = Array.isArray(input.customizationIds) ? input.customizationIds : [];
  const processingAmount = store.customizations
    .filter((item) => item.enabled && selected.includes(item.id))
    .reduce((total, item) => total + item.price * quantity, 0);
  return {
    product,
    materialAmount: Number(materialAmount.toFixed(2)),
    processingAmount: Number(processingAmount.toFixed(2)),
    totalAmount: Number((materialAmount + processingAmount).toFixed(2))
  };
}

async function api(request, response, pathname) {
  const store = readStore();
  if (request.method === 'GET' && pathname === '/api/bootstrap') {
    return json(response, 200, store);
  }
  if (request.method === 'POST' && pathname === '/api/quotes/calculate') {
    return json(response, 200, quotePrice(store, await body(request)));
  }
  if (request.method === 'POST' && pathname === '/api/quotes') {
    const input = await body(request);
    required(input, ['customer', 'productId', 'quantity', 'wasteRate']);
    const price = quotePrice(store, input);
    const quote = {
      id: `QT${new Date().toISOString().slice(0, 10).replaceAll('-', '')}${String(store.quotes.length + 1).padStart(3, '0')}`,
      customer: input.customer,
      material: price.product.name,
      amount: price.totalAmount,
      status: input.status === '草稿' ? '草稿' : '待审批',
      createdAt: new Date().toISOString().slice(0, 10)
    };
    store.quotes.unshift(quote);
    writeStore(store);
    return json(response, 201, quote);
  }
  if (request.method === 'POST' && pathname === '/api/customers') {
    const input = await body(request);
    required(input, ['name', 'contact', 'phone']);
    const customer = { id: `CUS-${randomUUID().slice(0, 6).toUpperCase()}`, level: '普通客户', owner: store.company.userName, updatedAt: new Date().toISOString().slice(0, 10), ...input };
    store.customers.unshift(customer);
    writeStore(store);
    return json(response, 201, customer);
  }
  if (request.method === 'POST' && pathname === '/api/contracts') {
    const input = await body(request);
    required(input, ['customer', 'amount', 'delivery']);
    const contract = { id: `HT${new Date().toISOString().slice(0, 10).replaceAll('-', '')}${String(store.contracts.length + 1).padStart(3, '0')}`, status: '待盖章', ...input, amount: Number(input.amount) };
    store.contracts.unshift(contract);
    writeStore(store);
    return json(response, 201, contract);
  }
  if (request.method === 'PUT' && pathname === '/api/company') {
    const input = await body(request);
    required(input, ['userName', 'companyName']);
    store.company = { ...store.company, name: input.companyName, userName: input.userName, role: input.role || store.company.role, taxRate: Number(input.taxRate) || store.company.taxRate };
    writeStore(store);
    return json(response, 200, store.company);
  }
  if (request.method === 'POST' && pathname === '/api/customizations') {
    const input = await body(request);
    required(input, ['name', 'unit', 'price']);
    const item = { id: `CUS-P${Date.now().toString().slice(-5)}`, name: input.name, unit: input.unit, price: Number(input.price), enabled: true };
    store.customizations.push(item);
    writeStore(store);
    return json(response, 201, item);
  }
  return json(response, 404, { error: '接口不存在' });
}

function staticFile(response, pathname) {
  const routes = { '/': 'index.html', '/index.html': 'index.html', '/styles.css': 'styles.css', '/script.js': 'script.js' };
  const filename = routes[pathname];
  if (!filename) return json(response, 404, { error: '页面不存在' });
  const file = path.join(ROOT, filename);
  response.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(response);
}

function createServer() {
  return http.createServer(async (request, response) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    try {
      if (pathname.startsWith('/api/')) return await api(request, response, pathname);
      return staticFile(response, pathname);
    } catch (error) {
      return json(response, error instanceof SyntaxError ? 400 : 422, { error: error.message || '服务器处理失败' });
    }
  });
}

if (require.main === module) createServer().listen(PORT, () => console.log(`曜石云已启动：http://localhost:${PORT}`));

module.exports = { createServer, quotePrice };
