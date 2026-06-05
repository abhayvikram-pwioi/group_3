if (typeof formatCategory !== 'function') {
  window.formatCategory = function(cat) {
    if (!cat) return '';
    return cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
}

let activeCategory = 'all';
let maxPrice = 100000;
let minRating = 0;

function applyFilters() {
  const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();

  let filtered = allProducts.filter(p => {
    const matchesSearch = !searchTerm ||
      p.title.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm);
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesPrice = p.price <= maxPrice;
    const matchesRating = p.rating >= minRating;
    return matchesSearch && matchesCategory && matchesPrice && matchesRating;
  });

  visibleCount = 12;
  renderProducts(filtered);
  window._filteredProducts = filtered;
}

function buildCategoryFilters(products) {
  const categories = [...new Set(products.map(p => p.category))].sort();
  const container = document.getElementById('categoryFilters');
  if (!container) return;

  const allBtn = document.createElement('button');
  allBtn.className = 'category-btn active';
  allBtn.textContent = 'All Items';
  allBtn.dataset.cat = 'all';
  allBtn.onclick = () => setCategory('all');
  container.appendChild(allBtn);

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'category-btn';
    btn.textContent = formatCategory(cat);
    btn.dataset.cat = cat;
    btn.onclick = () => setCategory(cat);
    container.appendChild(btn);
  });

  // Mobile category filters too
  const mobileContainer = document.getElementById('mobileCategoryFilters');
  if (mobileContainer) {
    mobileContainer.innerHTML = '';
    const allBtnM = document.createElement('button');
    allBtnM.className = 'mobile-rating-btn active';
    allBtnM.textContent = 'All';
    allBtnM.dataset.cat = 'all';
    allBtnM.onclick = () => { setCategory('all'); syncMobileCatBtns('all'); };
    mobileContainer.appendChild(allBtnM);
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'mobile-rating-btn';
      btn.textContent = formatCategory(cat);
      btn.dataset.cat = cat;
      btn.onclick = () => { setCategory(cat); syncMobileCatBtns(cat); };
      mobileContainer.appendChild(btn);
    });
  }
}

function setCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  applyFilters();
}

function syncMobileCatBtns(cat) {
  document.querySelectorAll('#mobileCategoryFilters .mobile-rating-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
}

function initFilters() {
  const searchInput = document.getElementById('searchInput');
  searchInput?.addEventListener('input', applyFilters);

  const priceRange = document.getElementById('priceRange');
  if (priceRange) {
    priceRange.max = 200000;
    priceRange.value = 200000;
    maxPrice = 200000;
    priceRange.addEventListener('input', e => {
      maxPrice = parseInt(e.target.value);
      const display = document.getElementById('priceDisplay');
      if (display) display.textContent = `₹${maxPrice.toLocaleString('en-IN')}`;
      applyFilters();
    });
  }

  const mobilePriceRange = document.getElementById('mobilePriceRange');
  if (mobilePriceRange) {
    mobilePriceRange.max = 200000;
    mobilePriceRange.value = 200000;
    mobilePriceRange.addEventListener('input', e => {
      maxPrice = parseInt(e.target.value);
      const display = document.getElementById('mobilePriceDisplay');
      if (display) display.textContent = `₹${maxPrice.toLocaleString('en-IN')}`;
      if (priceRange) priceRange.value = maxPrice;
      applyFilters();
    });
  }

  const ratingSelect = document.getElementById('ratingSelect');
  ratingSelect?.addEventListener('change', e => {
    minRating = parseFloat(e.target.value);
    applyFilters();
  });

  document.querySelectorAll('.mobile-rating-btn[data-rating]').forEach(btn => {
    btn.addEventListener('click', () => {
      minRating = parseFloat(btn.dataset.rating || '0');
      document.querySelectorAll('.mobile-rating-btn[data-rating]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (ratingSelect) ratingSelect.value = minRating;
      applyFilters();
    });
  });

  const resetBtn = document.getElementById('filterResetBtn');
  resetBtn?.addEventListener('click', () => {
    activeCategory = 'all';
    maxPrice = 200000;
    minRating = 0;
    if (priceRange) priceRange.value = 200000;
    if (mobilePriceRange) mobilePriceRange.value = 200000;
    if (ratingSelect) ratingSelect.value = '0';
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('.category-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === 'all'));
    document.querySelectorAll('.mobile-rating-btn[data-rating]').forEach(b => b.classList.remove('active'));
    applyFilters();
  });
}

function loadMore() {
  visibleCount += 8;
  renderProducts(window._filteredProducts || allProducts);
}
