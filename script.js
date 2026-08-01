const modal = document.querySelector('#quoteModal');
const toast = document.querySelector('#toast');
const openButtons = [document.querySelector('#topQuote'), ...document.querySelectorAll('[data-open-quote]')];

function setModal(open) {
  modal.classList.toggle('show', open);
  modal.setAttribute('aria-hidden', String(!open));
  document.body.style.overflow = open ? 'hidden' : '';
}

openButtons.forEach((button) => button?.addEventListener('click', () => setModal(true)));
document.querySelector('.close').addEventListener('click', () => setModal(false));
modal.addEventListener('click', (event) => { if (event.target === modal) setModal(false); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setModal(false); });

function calculateQuote() {
  const unitPrice = Number(document.querySelector('#material').value);
  const area = Number(document.querySelector('#size').value);
  const quantity = Math.max(1, Number(document.querySelector('#quantity').value) || 1);
  const waste = Number(document.querySelector('#waste').value);
  const material = unitPrice * area * quantity * waste;
  const processing = [...document.querySelectorAll('.custom-options input:checked')]
    .reduce((sum, option) => sum + Number(option.value) * quantity, 0);
  document.querySelector('#materialPrice').textContent = currency(material);
  document.querySelector('#processPrice').textContent = currency(processing);
  document.querySelector('#totalPrice').textContent = currency(material + processing);
}

function currency(value) {
  return `¥ ${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

document.querySelectorAll('#quoteForm select, #quoteForm input').forEach((field) => field.addEventListener('change', calculateQuote));
document.querySelectorAll('[data-count]').forEach((button) => button.addEventListener('click', () => {
  const field = document.querySelector('#quantity');
  field.value = Math.max(1, Number(field.value) + Number(button.dataset.count));
  calculateQuote();
}));

document.querySelector('#quoteForm').addEventListener('submit', (event) => {
  event.preventDefault();
  setModal(false);
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
});

document.querySelector('.close-action').addEventListener('click', () => {
  setModal(false);
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
});

document.querySelectorAll('.todo-list input').forEach((checkbox) => checkbox.addEventListener('change', () => {
  checkbox.closest('label').style.opacity = checkbox.checked ? '.48' : '1';
}));

document.querySelectorAll('.todo-tabs button').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.todo-tabs button').forEach((tab) => tab.classList.remove('active'));
  button.classList.add('active');
}));

document.querySelector('#configBtn').addEventListener('click', () => {
  toast.querySelector('b').textContent = '定制项配置即将开放';
  toast.querySelector('small').textContent = '后续可维护工艺、计价单位与阶梯价格';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
});

calculateQuote();
