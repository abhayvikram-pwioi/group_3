function initCheckout() {
  initDeliveryMethod();
  loadOrderSummary();
  initPaymentMethod();
  initFormValidation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCheckout);
} else {
  initCheckout();
}

function loadOrderSummary() {
  let cart = [];
  try {
    const stored = localStorage.getItem('luxe_cart');
    cart = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(cart)) cart = [];
  } catch (e) {
    console.error('Failed to load cart from localStorage:', e);
    cart = [];
  }
  const orderItems = document.getElementById('orderItems');
  const orderSubtotal = document.getElementById('orderSubtotal');
  const orderTotal = document.getElementById('orderTotal');
  const placeOrderTotal = document.getElementById('placeOrderTotal');

  if (!orderItems) return;

  if (cart.length === 0) {
    orderItems.innerHTML = '<p style="color:var(--gray-400);font-size:0.85rem">Your cart is empty.</p>';
    return;
  }

  orderItems.innerHTML = cart.map(item => `
    <div class="order-item">
      <img class="order-item-img" src="${item.image}" alt="${item.title}">
      <div style="flex:1;min-width:0">
        <div class="order-item-name">${item.title}</div>
        <div class="order-item-qty">Qty: ${item.qty}</div>
        <div class="order-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
      </div>
    </div>
  `).join('');

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = window._selectedDelivery === 'express' ? 499 : 0;
  const total = subtotal + delivery;

  if (orderSubtotal) orderSubtotal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (orderTotal) orderTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
  if (placeOrderTotal) placeOrderTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
}

function initDeliveryMethod() {
  window._selectedDelivery = 'standard';
  document.querySelectorAll('.delivery-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.delivery-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      window._selectedDelivery = opt.dataset.delivery;
      updateDeliveryInSummary();
    });
  });
}

function updateDeliveryInSummary() {
  let cart = [];
  try {
    const stored = localStorage.getItem('luxe_cart');
    cart = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(cart)) cart = [];
  } catch (e) {
    console.error('Failed to load cart from localStorage:', e);
    cart = [];
  }
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = window._selectedDelivery === 'express' ? 499 : 0;
  const total = subtotal + delivery;

  const shippingEl = document.getElementById('orderShipping');
  const totalEl = document.getElementById('orderTotal');
  const placeOrderTotal = document.getElementById('placeOrderTotal');

  if (shippingEl) shippingEl.innerHTML = delivery === 0
    ? '<span class="free">Free</span>'
    : `₹499`;
  if (totalEl) totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
  if (placeOrderTotal) placeOrderTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
}

function initPaymentMethod() {
  document.querySelectorAll('.payment-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.payment-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const method = tab.dataset.method;
      document.querySelectorAll('.payment-fields').forEach(f => f.style.display = 'none');
      const fields = document.getElementById(`${method}Fields`);
      if (fields) fields.style.display = 'block';
    });
  });

  // Card number formatting
  const cardInput = document.getElementById('cardNumber');
  cardInput?.addEventListener('input', e => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = val.replace(/(.{4})/g, '$1 ').trim();
  });

  const expiryInput = document.getElementById('expiryDate');
  expiryInput?.addEventListener('input', e => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
    e.target.value = val;
  });

  const cvvInput = document.getElementById('cvv');
  cvvInput?.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
  });
}

function initFormValidation() {
  const form = document.getElementById('checkoutForm');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    if (validateForm()) submitOrder();
  });
}

function validateForm() {
  let valid = true;

  const checks = [
    { id: 'email', rule: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: 'Enter a valid email address' },
    { id: 'firstName', rule: v => v.trim().length >= 2, msg: 'Minimum 2 characters required' },
    { id: 'lastName', rule: v => v.trim().length >= 1, msg: 'Last name is required' },
    { id: 'phone', rule: v => /^\+?[\d\s\-]{8,15}$/.test(v), msg: 'Enter a valid phone number' },
    { id: 'address', rule: v => v.trim().length >= 5, msg: 'Address is required' },
    { id: 'city', rule: v => v.trim().length >= 2, msg: 'City is required' },
    { id: 'state', rule: v => v.trim().length >= 2, msg: 'State is required' },
    { id: 'pincode', rule: v => /^\d{4,8}$/.test(v), msg: 'Enter a valid pincode' },
  ];

  const activeMethod = document.querySelector('.payment-tab.active')?.dataset.method;
  if (activeMethod === 'card') {
    checks.push(
      { id: 'cardNumber', rule: v => v.replace(/\s/g,'').length === 16, msg: 'Enter a valid 16-digit card number' },
      { id: 'expiryDate', rule: v => /^\d{2}\/\d{2}$/.test(v), msg: 'Enter a valid expiry (MM/YY)' },
      { id: 'cvv', rule: v => /^\d{3}$/.test(v), msg: 'Enter a valid 3-digit CVV' }
    );
  }

  checks.forEach(({ id, rule, msg }) => {
    const input = document.getElementById(id);
    const errorEl = document.getElementById(`${id}Error`);
    if (!input) return;
    const ok = rule(input.value);
    input.classList.toggle('error', !ok);
    input.classList.toggle('success', ok);
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.toggle('show', !ok);
    }
    if (!ok) valid = false;
  });

  return valid;
}

function submitOrder() {
  let cart = [];
  try {
    const stored = localStorage.getItem('luxe_cart');
    cart = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(cart)) cart = [];
  } catch (e) {
    console.error('Failed to load cart from localStorage:', e);
    cart = [];
  }
  if (cart.length === 0) {
    alert('Your cart is empty. Add products before placing an order.');
    return;
  }

  const orderId = 'LXE' + Date.now().toString().slice(-8);
  document.getElementById('confirmOrderId').textContent = orderId;

  const modal = document.getElementById('successModal');
  modal?.classList.add('open');

  try {
    localStorage.removeItem('luxe_cart');
  } catch (e) {
    console.error('Failed to clear cart from localStorage:', e);
  }
}

function closeModal() {
  document.getElementById('successModal')?.classList.remove('open');
  window.location.href = 'index.html';
}
