function initApp() {
  // Initialize
  initFilters();
  initDragDrop();
  renderCart();
  updateCartBadge();
  initProducts().then(() => {
    buildCategoryFilters(allProducts);
  });

  // Cart drawer toggle
  document.getElementById('cartBtn')?.addEventListener('click', showCartDrawer);
  document.getElementById('cartOverlay')?.addEventListener('click', hideCartDrawer);
  document.getElementById('cartCloseBtn')?.addEventListener('click', hideCartDrawer);

  // Load more
  document.getElementById('loadMoreBtn')?.addEventListener('click', loadMore);

  // Mobile filter drawer
  const filterDrawer = document.getElementById('mobileFilterDrawer');
  document.querySelector('.mobile-filter-btn')?.addEventListener('click', () => {
    filterDrawer?.classList.add('open');
  });
  document.getElementById('mobileFilterOverlay')?.addEventListener('click', () => {
    filterDrawer?.classList.remove('open');
  });
  document.getElementById('applyFiltersBtn')?.addEventListener('click', () => {
    applyFilters();
    filterDrawer?.classList.remove('open');
  });

  // Keyboard shortcut for search (cmd+k / ctrl+k)
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('searchInput')?.focus();
    }
    if (e.key === 'Escape') hideCartDrawer();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
