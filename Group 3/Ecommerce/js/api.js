const API_URL = 'https://dummyjson.com/products?limit=100';

const FALLBACK_PRODUCTS = [
  {
    id: 1001,
    title: "Luxe Wireless Over-Ear Headphones",
    category: "mobile-accessories",
    price: 14900,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    isNew: true
  },
  {
    id: 1002,
    title: "Minimalist Leather Journal",
    category: "editorial",
    price: 2400,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80",
    isNew: true
  },
  {
    id: 1003,
    title: "Precision Steel Mechanical Keyboard",
    category: "mobile-accessories",
    price: 12500,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
    isNew: true
  },
  {
    id: 1004,
    title: "Matte Black Insulated Flask",
    category: "lifestyle",
    price: 3200,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
    isNew: false
  },
  {
    id: 1005,
    title: "Premium Wool Desk Mat",
    category: "lifestyle",
    price: 4500,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600&q=80",
    isNew: false
  },
  {
    id: 1006,
    title: "Ergonomic Walnut Monitor Stand",
    category: "furniture",
    price: 8900,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80",
    isNew: false
  }
];

async function fetchProducts() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    if (!data || !Array.isArray(data.products)) throw new Error('Invalid product data structure');
    return data.products.map(p => ({
      id: p.id,
      title: p.title,
      category: p.category,
      price: Math.round((p.price || 0) * 83),
      rating: p.rating || 4.0,
      image: p.thumbnail || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
      isNew: p.id <= 10
    }));
  } catch (e) {
    console.warn('API fetch failed, utilizing beautiful Luxe mock fallback products:', e);
    return FALLBACK_PRODUCTS;
  }
}
