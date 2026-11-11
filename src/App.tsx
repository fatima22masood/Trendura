import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  Sparkles,
  ShoppingBag,
  Package,
  Layers,
  Heart,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

import { auth, testFirestoreConnection, logOut } from './firebase';
import { Product, CartItem, Order, StoreSettings } from './types';
import { INITIAL_SETTINGS, CATEGORIES } from './data/initialProducts';
import {
  subscribeToProducts,
  subscribeToSettings,
  subscribeToUserOrders,
  subscribeToAllOrders,
  seedProductsIfEmpty,
} from './services/storeService';

import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrdersModal } from './components/OrdersModal';
import { WishlistModal } from './components/WishlistModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';

export default function App() {
  // App & Database State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart & Wishlist State (persisted locally)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('nova_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('nova_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI Modals & Views
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('featured');
  const [appliedPromo, setAppliedPromo] = useState('');

  // Save Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('nova_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [cart]);

  // Save Wishlist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('nova_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [wishlist]);

  // 1. Boot connection test & seed initial catalog
  useEffect(() => {
    const initApp = async () => {
      await testFirestoreConnection();
      await seedProductsIfEmpty();
    };
    initApp();
  }, []);

  // 2. Track Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 3. Real-time Firestore subscriptions for Products & Settings
  useEffect(() => {
    const unsubProducts = subscribeToProducts((fetchedProducts) => {
      setProducts(fetchedProducts);
      setIsLoading(false);
    });

    const unsubSettings = subscribeToSettings((fetchedSettings) => {
      setSettings(fetchedSettings);
    });

    return () => {
      if (unsubProducts) unsubProducts();
      if (unsubSettings) unsubSettings();
    };
  }, []);

  // 4. Real-time Firestore subscriptions for Orders
  useEffect(() => {
    if (!currentUser) {
      setUserOrders([]);
      return;
    }

    const unsubUserOrders = subscribeToUserOrders(currentUser.uid, (orders) => {
      setUserOrders(orders);
    });

    return () => {
      if (unsubUserOrders) unsubUserOrders();
    };
  }, [currentUser]);

  // 5. Admin orders subscription (all orders)
  useEffect(() => {
    const unsubAllOrders = subscribeToAllOrders((orders) => {
      setAllOrders(orders);
    });
    return () => {
      if (unsubAllOrders) unsubAllOrders();
    };
  }, []);

  // Cart Operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });

    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1500);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Wishlist Operations
  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  // Promo Code Handler
  const handleApplyPromo = (code: string) => {
    if (code === 'NOVA10') {
      setAppliedPromo('NOVA10');
      return { success: true, message: 'Code NOVA10 applied: 10% discount on all items!' };
    }
    if (code === 'FREESHIP') {
      setAppliedPromo('FREESHIP');
      return { success: true, message: 'Code FREESHIP applied: Free standard shipping unlocked!' };
    }
    if (code === 'SAVE20') {
      setAppliedPromo('SAVE20');
      return { success: true, message: 'VIP code SAVE20 applied: 20% discount applied!' };
    }
    return { success: false, message: 'Invalid or expired promotional coupon code.' };
  };

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category Filter
        if (selectedCategory !== 'All Products' && p.category !== selectedCategory) {
          return false;
        }
        // Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchCat = p.category.toLowerCase().includes(q);
          const matchTag = p.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchName && !matchDesc && !matchCat && !matchTag) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'newest') return (b.createdAt || '').localeCompare(a.createdAt || '');
        // default: featured
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const currencySymbol = settings.currencySymbol || '$';

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      {/* Sticky Header / Navbar */}
      <Navbar
        settings={settings}
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        wishlistCount={wishlist.length}
        userOrdersCount={userOrders.length}
        currentUser={currentUser}
        isAdmin={true} // In this showcase, user has store manager oversight
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={logOut}
        onToggleAdminView={() => setIsAdminView(!isAdminView)}
        isAdminView={isAdminView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={CATEGORIES}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {isAdminView ? (
          /* Business Admin Dashboard Overlay / View */
          <AdminDashboard
            products={products}
            orders={allOrders}
            settings={settings}
            currencySymbol={currencySymbol}
            onClose={() => setIsAdminView(false)}
          />
        ) : (
          /* Public Storefront View */
          <div>
            {/* Hero Showcase Banner */}
            <HeroBanner
              onShopNow={() => {
                const catalogEl = document.getElementById('catalog-section');
                catalogEl?.scrollIntoView({ behavior: 'smooth' });
              }}
              onExploreCategory={(cat) => {
                setSelectedCategory(cat);
                const catalogEl = document.getElementById('catalog-section');
                catalogEl?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Catalog Section */}
            <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
              {/* Filter & Sorting Controls Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-950 font-serif flex items-center gap-2">
                    <span>{selectedCategory}</span>
                    <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                      {filteredProducts.length} items
                    </span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Live inventory synced with connected cloud database
                  </p>
                </div>

                {/* Sort selector & reset search */}
                <div className="flex items-center gap-3">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Clear search "{searchQuery}"
                    </button>
                  )}

                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-neutral-200 shadow-sm text-xs">
                    <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-neutral-500 hidden sm:inline">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent font-semibold text-neutral-800 focus:outline-none cursor-pointer"
                    >
                      <option value="featured">Featured Picks</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="rating">Top Rated</option>
                      <option value="newest">Newest Arrivals</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className="py-24 text-center">
                  <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-3" />
                  <p className="text-xs text-neutral-500 font-medium">Connecting to Firestore database...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-20 text-center max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                    <Search className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 font-serif">
                    No products found
                  </h3>
                  <p className="text-xs text-neutral-500">
                    No items matched "{searchQuery || selectedCategory}". Try adjusting your filters or browsing all catalog items.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('All Products');
                      setSearchQuery('');
                    }}
                    className="px-5 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-sm"
                  >
                    View All Products
                  </button>
                </div>
              ) : (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      currencySymbol={currencySymbol}
                      isWishlisted={wishlist.some((w) => w.id === product.id)}
                      onToggleWishlist={handleToggleWishlist}
                      onAddToCart={(p) => handleAddToCart(p, 1)}
                      onQuickView={setSelectedProduct}
                      isAddedJustNow={justAddedId === product.id}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          const catalogEl = document.getElementById('catalog-section');
          catalogEl?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onToggleAdminView={() => setIsAdminView(!isAdminView)}
      />

      {/* Interactive Drawers & Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        settings={settings}
        currencySymbol={currencySymbol}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        appliedPromo={appliedPromo}
        onApplyPromo={handleApplyPromo}
        onRemovePromo={() => setAppliedPromo('')}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        settings={settings}
        currencySymbol={currencySymbol}
        appliedPromo={appliedPromo}
        onOrderCompleted={handleClearCart}
        onViewOrders={() => setIsOrdersOpen(true)}
      />

      <OrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        orders={userOrders.length > 0 ? userOrders : allOrders.slice(0, 5)}
        currencySymbol={currencySymbol}
      />

      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onRemoveFromWishlist={handleToggleWishlist}
        onAddToCart={(p) => handleAddToCart(p, 1)}
        currencySymbol={currencySymbol}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        currencySymbol={currencySymbol}
        onAddToCart={handleAddToCart}
        isWishlisted={selectedProduct ? wishlist.some((w) => w.id === selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
      />
    </div>
  );
}
