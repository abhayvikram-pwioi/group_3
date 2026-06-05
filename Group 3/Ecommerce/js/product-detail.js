// Get product ID from URL
function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('id'));
}

// Format category string
function formatCategory(cat) {
  if (!cat) return '';
  return cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Current quantity
let quantity = 1;
let currentProduct = null;

// Load and display the product
async function loadProduct() {
  const productId = getProductId();

  if (!productId) {
    showError();
    return;
  }

  try {
    const products = await fetchProducts();
    currentProduct = products.find(p => p.id === productId);

    if (!currentProduct) {
      showError();
      return;
    }

    // Try to get full product details from API for description
    let description = 'A premium product from the LUXE collection, crafted with care and precision for the modern professional.';
    let stock = null;

    try {
      const res = await fetch('https://dummyjson.com/products/' + productId);
      if (res.ok) {
        const fullProduct = await res.json();
        if (fullProduct.description) description = fullProduct.description;
        if (fullProduct.stock !== undefined) stock = fullProduct.stock;
      }
    } catch (e) {
      // Use default description
    }

    displayProduct(currentProduct, description, stock);
  } catch (e) {
    showError();
  }
}

function displayProduct(product, description, stock) {
  // Hide loading, show content
  document.getElementById('productLoading').style.display = 'none';
  document.getElementById('productContent').style.display = 'block';

  // Set page title
  document.title = 'LUXE — ' + product.title;

  // Breadcrumb
  document.getElementById('breadcrumbName').textContent = product.title;

  // Image
  document.getElementById('productImage').src = product.image;
  document.getElementById('productImage').alt = product.title;

  // Category
  document.getElementById('productCategory').textContent = formatCategory(product.category);

  // Title
  document.getElementById('productTitle').textContent = product.title;

  // Rating
  var stars = '★'.repeat(Math.round(product.rating)) + '☆'.repeat(5 - Math.round(product.rating));
  document.querySelector('#productRating .stars').textContent = stars;
  document.querySelector('#productRating .rating-value').textContent = product.rating + ' / 5';

  // Price
  document.getElementById('productPrice').textContent = '₹' + product.price.toLocaleString('en-IN');

  // Description
  document.getElementById('productDesc').textContent = description;

  // Info table
  document.getElementById('infoCategory').textContent = formatCategory(product.category);
  document.getElementById('infoRating').textContent = product.rating + ' out of 5';

  if (stock !== null) {
    document.getElementById('infoStock').textContent = stock > 0 ? stock + ' in stock' : 'Out of stock';
  }
}

function showError() {
  document.getElementById('productLoading').style.display = 'none';
  document.getElementById('productError').style.display = 'block';
}

// Quantity controls
function setupQuantity() {
  document.getElementById('qtyMinus').addEventListener('click', function() {
    if (quantity > 1) {
      quantity--;
      document.getElementById('qtyValue').textContent = quantity;
    }
  });

  document.getElementById('qtyPlus').addEventListener('click', function() {
    quantity++;
    document.getElementById('qtyValue').textContent = quantity;
  });
}

// Add to cart handler
function setupAddToCart() {
  document.getElementById('addToCartBtn').addEventListener('click', function() {
    if (!currentProduct) return;

    for (var i = 0; i < quantity; i++) {
      addToCart(currentProduct);
    }
  });
}

// Cart drawer controls
function setupCartDrawer() {
  document.getElementById('cartBtn')?.addEventListener('click', showCartDrawer);
  document.getElementById('cartOverlay')?.addEventListener('click', hideCartDrawer);
  document.getElementById('cartCloseBtn')?.addEventListener('click', hideCartDrawer);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') hideCartDrawer();
  });
}

// Initialize everything
function initProductPage() {
  renderCart();
  updateCartBadge();
  setupQuantity();
  setupAddToCart();
  setupCartDrawer();
  loadProduct();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductPage);
} else {
  initProductPage();
}
