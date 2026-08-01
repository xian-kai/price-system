const pageContent = document.querySelector('#pageContent');
const homeTemplate = pageContent.innerHTML;
const modal = document.querySelector('#quoteModal');
const toast = document.querySelector('#toast');
let state;

const pageNames = {
  home: '首页', workflow: '我的流程', customers: '客户关系', 'quote-create': '创建报价单',
  quotes: '报价管理', 'contract-create': '合同下单', contracts: '合同管理', analytics: '统计看板',
  products: '产品与库存', settings: '系统管理'
};

const money = (value) => `¥ ${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

async function request(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '请求失败');
  return result;
}

function notify(title, detail = '') {
  toast.querySelector('b').textContent = title;
  toast.querySelector('small').textContent = detail;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

function setUser() {
  document.querySelectorAll('[data-current-user]').forEach((item) => { item.textContent = state.company.userName; });
  document.querySelectorAll('[data-current-role]').forEach((item) => { item.textContent = state.company.role; });
  document.querySelectorAll('[data-user-avatar]').forEach((item) => { item.textContent = state.company.userName.slice(0, 1); });
}

function rows(items, columns) {
  return items.map((item) => `<tr>${columns.map((column) => `<td>${column.render ? column.render(item) : escapeHtml(item[column.key])}</td>`).join('')}</tr>`).join('');
}

function dataPage(title, description, actions, content) {
  return `<section class="page-heading"><div><p>业务管理 / ${escapeHtml(title)}</p><h1>${escapeHtml(title)}</h1><span>${escapeHtml(description)}</span></div>${actions || ''}</section>${content}`;
}

function status(value) {
  const success = ['已通过', '已完成', '生产中'].includes(value);
  return `<span class="status ${success ? 'success' : ''}">${escapeHtml(value)}</span>`;
}

function renderPage(page, push = true) {
  if (!pageNames[page]) page = 'home';
  document.querySelector('.crumb').innerHTML = `工作台 <span>/</span> ${pageNames[page]}`;
  document.querySelectorAll('[data-page]').forEach((link) => link.classList.toggle('active', link.dataset.page === page));
  if (push) history.pushState({ page }, '', `/?page=${page}`);
  if (page === 'home') {
    pageContent.innerHTML = homeTemplate;
    bindHome();
    setUser();
    return;
  }
  const renderers = { workflow: workflowPage, customers: customersPage, 'quote-create': quoteCreatePage, quotes: quotesPage, 'contract-create': contractCreatePage, contracts: contractsPage, analytics: analyticsPage, products: productsPage, settings: settingsPage };
  pageContent.innerHTML = renderers[page]();
  bindPage(page);
}

function workflowPage() {
  return dataPage('我的流程', '集中处理审批、回访、盖章及生产协同事项', '', `<article class="panel page-panel"><div class="filter-row"><button class="filter active">待处理 ${state.workflows.filter((x) => x.status === '待处理').length}</button><button class="filter">我发起的</button><button class="filter">已完成</button></div><div class="flow-list">${state.workflows.map((item) => `<div><span class="flow-icon">◫</span><p><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.detail)}</small></p>${status(item.status)}<time>${escapeHtml(item.due)}</time><button class="link-button" data-complete="${item.id}">处理 →</button></div>`).join('')}</div></article>`);
}

function customersPage() {
  const columns = [{ key: 'id' }, { key: 'name', render: (x) => `<b>${escapeHtml(x.name)}</b>` }, { key: 'contact' }, { key: 'phone' }, { key: 'level', render: (x) => status(x.level) }, { key: 'owner' }, { key: 'updatedAt' }];
  return dataPage('客户关系', `共 ${state.customers.length} 家客户，沉淀联系信息与跟进记录`, '<button class="primary" data-dialog="customer">＋ 新建客户</button>', `<article class="panel page-panel"><div class="table-tools"><label class="page-search">⌕ <input id="tableSearch" placeholder="搜索客户名称或联系人"></label><button class="ghost">全部客户⌄</button><button class="ghost">导出</button></div><div class="table-wrap"><table><thead><tr><th>客户编号</th><th>客户名称</th><th>联系人</th><th>手机号码</th><th>客户等级</th><th>负责人</th><th>最近跟进</th></tr></thead><tbody id="customerRows">${rows(state.customers, columns)}</tbody></table></div></article>`);
}

function quoteCreatePage() { return dataPage('创建报价单', '按材料、规格、损耗与定制加工规则生成报价', '<button class="primary" data-open-quote>开始智能报价</button>', `<article class="panel empty-feature"><div class="feature-mark">▤</div><h2>智能计价引擎</h2><p>系统将读取产品库和企业定制加工价格，自动核算材料与加工费用。</p><button class="primary" data-open-quote>创建第一份报价</button></article>`); }

function quotesPage() {
  const columns = [{ key: 'id', render: (x) => `<b>${escapeHtml(x.id)}</b>` }, { key: 'customer' }, { key: 'material' }, { key: 'amount', render: (x) => `<strong>${money(x.amount)}</strong>` }, { key: 'status', render: (x) => status(x.status) }, { key: 'createdAt' }, { render: () => '<button class="link-button">查看详情</button>' }];
  return dataPage('报价管理', `共 ${state.quotes.length} 份报价，统一跟踪审批与客户确认状态`, '<button class="primary" data-open-quote>＋ 新建报价</button>', `<article class="panel page-panel"><div class="table-tools"><button class="filter active">全部报价</button><button class="filter">待审批</button><button class="filter">已通过</button><button class="filter">草稿</button></div><div class="table-wrap"><table><thead><tr><th>报价单号</th><th>客户名称</th><th>岩板材料</th><th>报价金额</th><th>状态</th><th>创建日期</th><th>操作</th></tr></thead><tbody>${rows(state.quotes, columns)}</tbody></table></div></article>`);
}

function contractCreatePage() {
  const options = state.customers.map((item) => `<option>${escapeHtml(item.name)}</option>`).join('');
  return dataPage('合同下单', '从已确认报价生成销售合同并安排交付', '', `<article class="panel form-panel"><form id="contractForm"><h2>合同基本信息</h2><div class="business-form"><label>签约客户<select name="customer" required><option value="">请选择客户</option>${options}</select></label><label>合同金额<input name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00"></label><label>预计交付日期<input name="delivery" type="date" required></label><label>客户采购单号<input name="purchaseOrder" placeholder="选填"></label><label class="full">交付备注<textarea name="note" placeholder="填写包装、物流、安装等特殊要求"></textarea></label></div><div class="form-actions"><button type="reset" class="ghost">重置</button><button class="primary">提交合同</button></div></form></article>`);
}

function contractsPage() {
  const columns = [{ key: 'id', render: (x) => `<b>${escapeHtml(x.id)}</b>` }, { key: 'customer' }, { key: 'amount', render: (x) => `<strong>${money(x.amount)}</strong>` }, { key: 'status', render: (x) => status(x.status) }, { key: 'delivery' }, { render: () => '<button class="link-button">跟踪交付</button>' }];
  return dataPage('合同管理', `共 ${state.contracts.length} 份销售合同`, '<button class="primary" data-go="contract-create">＋ 合同下单</button>', `<article class="panel page-panel"><div class="table-wrap"><table><thead><tr><th>合同编号</th><th>签约客户</th><th>合同金额</th><th>执行状态</th><th>交付日期</th><th>操作</th></tr></thead><tbody>${rows(state.contracts, columns)}</tbody></table></div></article>`);
}

function analyticsPage() {
  const total = state.quotes.reduce((sum, item) => sum + item.amount, 0);
  return dataPage('统计看板', '查看销售转化、材料结构与合同执行情况', '<button class="ghost">2026 年 8 月⌄</button>', `<section class="report-cards"><article><small>累计报价金额</small><strong>${money(total)}</strong><span>↗ 12.8% 环比增长</span></article><article><small>合同转化率</small><strong>42.6%</strong><span>目标 45%</span></article><article><small>平均客单价</small><strong>${money(total / Math.max(state.quotes.length, 1))}</strong><span>报价口径</span></article></section><article class="panel analytics-panel"><div><h2>业务漏斗</h2><p>客户 → 报价 → 合同 → 交付</p></div><div class="funnel"><span style="--w:100%">${state.customers.length} 家意向客户</span><span style="--w:78%">${state.quotes.length} 份有效报价</span><span style="--w:56%">${state.contracts.length} 份销售合同</span><span style="--w:36%">1 单完成交付</span></div></article>`);
}

function productsPage() {
  const columns = [{ key: 'id' }, { key: 'name', render: (x) => `<b>${escapeHtml(x.name)}</b><small class="cell-sub">${escapeHtml(x.series)}</small>` }, { key: 'spec' }, { key: 'price', render: (x) => `<strong>¥ ${x.price}/㎡</strong>` }, { key: 'stock', render: (x) => `${x.stock} 片` }, { render: () => '<button class="link-button">编辑</button>' }];
  return dataPage('产品与库存', '维护岩板材料档案、销售基价与可用库存', '<button class="primary">＋ 新增产品</button>', `<article class="panel page-panel"><div class="table-wrap"><table><thead><tr><th>产品编号</th><th>产品名称</th><th>板材规格</th><th>销售基价</th><th>可用库存</th><th>操作</th></tr></thead><tbody>${rows(state.products, columns)}</tbody></table></div></article>`);
}

function settingsPage() {
  return dataPage('系统管理', '企业资料、计价规则与定制加工项目配置', '', `<div class="settings-grid"><article class="panel form-panel"><form id="companyForm"><h2>企业与账号</h2><p class="section-note">页面用户名由后端企业配置提供，不再写死在 HTML 中。</p><div class="business-form one"><label>企业名称<input name="companyName" value="${escapeHtml(state.company.name)}" required></label><label>当前用户姓名<input name="userName" value="${escapeHtml(state.company.userName)}" required></label><label>职位角色<input name="role" value="${escapeHtml(state.company.role)}"></label><label>默认税率（%）<input name="taxRate" type="number" value="${state.company.taxRate}"></label></div><div class="form-actions"><button class="primary">保存企业设置</button></div></form></article><article class="panel page-panel"><div class="panel-title"><div><h2>定制加工计价</h2><p>报价时自动读取以下有效规则</p></div><button class="ghost" data-dialog="customization">＋ 添加项目</button></div><div class="setting-list">${state.customizations.map((item) => `<div><span>⚙</span><p><b>${escapeHtml(item.name)}</b><small>按${escapeHtml(item.unit)}计价</small></p><strong>¥ ${item.price} / ${escapeHtml(item.unit)}</strong><i class="switch ${item.enabled ? 'on' : ''}"></i></div>`).join('')}</div></article></div>`);
}

function dialog(type) {
  const customer = type === 'customer';
  const title = customer ? '新建客户' : '新增定制加工项目';
  const fields = customer ? '<label>客户名称<input name="name" required></label><label>联系人<input name="contact" required></label><label>联系电话<input name="phone" required></label><label>客户等级<select name="level"><option>普通客户</option><option>重点客户</option><option>战略客户</option></select></label>' : '<label>加工项目<input name="name" required></label><label>计价单位<select name="unit"><option>延米</option><option>平方米</option><option>个</option><option>套</option></select></label><label>单价（元）<input name="price" type="number" min="0" step="0.01" required></label>';
  document.body.insertAdjacentHTML('beforeend', `<div class="mini-backdrop"><form class="mini-dialog" id="miniForm"><button type="button" class="mini-close">×</button><h2>${title}</h2><p>信息保存后将同步到业务数据中</p><div class="business-form one">${fields}</div><div class="form-actions"><button type="button" class="ghost mini-cancel">取消</button><button class="primary">确认保存</button></div></form></div>`);
  const backdrop = document.querySelector('.mini-backdrop');
  backdrop.querySelectorAll('.mini-close,.mini-cancel').forEach((button) => button.onclick = () => backdrop.remove());
  backdrop.querySelector('form').onsubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = Object.fromEntries(new FormData(event.target));
      await request(customer ? '/api/customers' : '/api/customizations', { method: 'POST', body: JSON.stringify(payload) });
      state = await request('/api/bootstrap');
      backdrop.remove(); renderPage(customer ? 'customers' : 'settings', false); notify(`${title}成功`, '数据已持久化保存');
    } catch (error) { notify('保存失败', error.message); }
  };
}

function bindPage(page) {
  document.querySelectorAll('[data-open-quote]').forEach((button) => button.onclick = () => setModal(true));
  document.querySelectorAll('[data-go]').forEach((button) => button.onclick = () => renderPage(button.dataset.go));
  document.querySelectorAll('[data-dialog]').forEach((button) => button.onclick = () => dialog(button.dataset.dialog));
  if (page === 'customers') document.querySelector('#tableSearch').oninput = (event) => document.querySelectorAll('#customerRows tr').forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(event.target.value.toLowerCase()); });
  if (page === 'contract-create') document.querySelector('#contractForm').onsubmit = async (event) => { event.preventDefault(); try { await request('/api/contracts', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) }); state = await request('/api/bootstrap'); notify('合同提交成功', '已进入待盖章流程'); renderPage('contracts'); } catch (error) { notify('提交失败', error.message); } };
  if (page === 'settings') document.querySelector('#companyForm').onsubmit = async (event) => { event.preventDefault(); try { state.company = await request('/api/company', { method: 'PUT', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) }); setUser(); notify('设置已保存', `当前用户已更新为 ${state.company.userName}`); } catch (error) { notify('保存失败', error.message); } };
}

function bindHome() {
  document.querySelectorAll('[data-open-quote]').forEach((button) => button.onclick = () => setModal(true));
  document.querySelectorAll('[data-go]').forEach((button) => button.onclick = () => renderPage(button.dataset.go));
  document.querySelectorAll('.todo-list input').forEach((checkbox) => checkbox.onchange = () => { checkbox.closest('label').style.opacity = checkbox.checked ? '.48' : '1'; });
  document.querySelectorAll('.todo-tabs button').forEach((button) => button.onclick = () => { document.querySelectorAll('.todo-tabs button').forEach((tab) => tab.classList.remove('active')); button.classList.add('active'); });
}

function setModal(open) { modal.classList.toggle('show', open); modal.setAttribute('aria-hidden', String(!open)); document.body.style.overflow = open ? 'hidden' : ''; }

function configureQuote() {
  document.querySelector('#material').innerHTML = state.products.map((item) => `<option value="${item.id}">${escapeHtml(item.name)} · ¥${item.price}/㎡</option>`).join('');
  document.querySelector('.custom-options').innerHTML = state.customizations.filter((item) => item.enabled).map((item, index) => `<label><input type="checkbox" value="${item.id}" ${index === 0 ? 'checked' : ''}><span><i>◇</i><b>${escapeHtml(item.name)}</b><small>¥${item.price} / ${escapeHtml(item.unit)}</small></span></label>`).join('');
  const calculate = async () => {
    const payload = quotePayload();
    try {
      const price = await request('/api/quotes/calculate', { method: 'POST', body: JSON.stringify(payload) });
      document.querySelector('#materialPrice').textContent = money(price.materialAmount);
      document.querySelector('#processPrice').textContent = money(price.processingAmount);
      document.querySelector('#totalPrice').textContent = money(price.totalAmount);
    } catch (error) { notify('计价失败', error.message); }
  };
  document.querySelectorAll('#quoteForm select, #quoteForm input').forEach((field) => field.onchange = calculate);
  document.querySelectorAll('[data-count]').forEach((button) => button.onclick = () => { const field = document.querySelector('#quantity'); field.value = Math.max(1, Number(field.value) + Number(button.dataset.count)); calculate(); });
  calculate();
}

function quotePayload(status = '待审批') {
  return { customer: document.querySelector('#quoteForm > .form-grid label:first-child input').value, productId: document.querySelector('#material').value, quantity: Number(document.querySelector('#quantity').value), wasteRate: (Number(document.querySelector('#waste').value) - 1) * 100, customizationIds: [...document.querySelectorAll('.custom-options input:checked')].map((item) => item.value), status };
}

document.querySelectorAll('[data-page]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); renderPage(link.dataset.page); }));
document.querySelector('#topQuote').onclick = () => setModal(true);
document.querySelector('.close').onclick = () => setModal(false);
modal.onclick = (event) => { if (event.target === modal) setModal(false); };
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setModal(false); });
document.querySelector('#quoteForm').onsubmit = async (event) => { event.preventDefault(); try { const quote = await request('/api/quotes', { method: 'POST', body: JSON.stringify(quotePayload()) }); state = await request('/api/bootstrap'); setModal(false); notify('报价单已创建', `${quote.id} · ${money(quote.amount)}`); renderPage('quotes'); } catch (error) { notify('创建失败', error.message); } };
document.querySelector('.close-action').onclick = async () => { try { const quote = await request('/api/quotes', { method: 'POST', body: JSON.stringify(quotePayload('草稿')) }); state = await request('/api/bootstrap'); setModal(false); notify('草稿已保存', quote.id); } catch (error) { notify('保存失败', error.message); } };
window.onpopstate = (event) => renderPage(event.state?.page || new URLSearchParams(location.search).get('page') || 'home', false);

(async function init() {
  try {
    state = await request('/api/bootstrap');
    setUser(); configureQuote();
    renderPage(new URLSearchParams(location.search).get('page') || 'home', false);
  } catch (error) {
    notify('无法连接后端', '请使用 npm start 启动系统，而不是直接打开 HTML 文件');
  }
}());
