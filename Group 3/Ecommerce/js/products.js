if (typeof formatCategory !== 'function') {
  window.formatCategory = function(cat) {
    if (!cat) return '';
    return cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
}

let allProducts = [];
let visibleCount = 12;

function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <h3>No products found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    `;
    updateResultCount(0);
    return;
  }

  const slice = products.slice(0, visibleCount);
  grid.innerHTML = slice.map(p => createProductCard(p)).join('');
  updateResultCount(products.length);

  const loadMoreWrap = document.getElementById('loadMoreWrap');
  if (loadMoreWrap) {
    loadMoreWrap.style.display = products.length > visibleCount ? 'flex' : 'none';
  }

  if (typeof attachDragEvents === 'function') {
    attachDragEvents();
  }
}

function createProductCard(product) {
  const stars = '★'.repeat(Math.round(product.rating)) + '☆'.repeat(5 - Math.round(product.rating));
  return `
    <div class="product-card" draggable="true" data-id="${product.id}" onclick="window.location.href='product.html?id=${product.id}'" style="cursor:pointer">
      <div class="product-card-img">
        ${product.isNew ? '<span class="product-badge">New</span>' : ''}
        <div class="drag-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
          </svg>
        </div>
        <img src="${product.image}" alt="${product.title}" loading="lazy">
      </div>
      <div class="product-card-body">
        <div class="product-category">
          <span>${formatCategory(product.category)}</span>
          <span class="product-rating"><span class="star">★</span> ${product.rating}</span>
        </div>
        <div class="product-name">${product.title}</div>
        <div class="product-footer">
          <span class="product-price">₹${product.price.toLocaleString('en-IN')}</span>
          <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${product.id})">Add to Cart</button>
        </div>
      </div>
    </div>
  `;
}

function renderSkeletons() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.innerHTML = Array(8).fill('').map(() => `
    <div class="skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line tall"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>
  `).join('');
}

function renderError() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.innerHTML = `
    <div class="error-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 1rem;color:#a0a0a0">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3>Unable to load products</h3>
      <p>Something went wrong fetching the catalog.</p>
      <button class="btn-retry" onclick="initProducts()">Try Again</button>
    </div>
  `;
}

function updateResultCount(count) {
  const el = document.getElementById('resultCount');
  if (el) el.textContent = `Showing ${count} product${count !== 1 ? 's' : ''}`;
}

async function initProducts() {
  renderSkeletons();
  try {
    allProducts = await fetchProducts();
    applyFilters();
  } catch (e) {
    renderError();
  }
}
