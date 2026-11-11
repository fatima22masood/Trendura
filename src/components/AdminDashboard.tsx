import React, { useState } from 'react';
import {
  Package,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  Settings,
  Layers,
  CheckCircle,
  Clock,
  Truck,
  RotateCcw,
  Sparkles,
  Save,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Product, Order, StoreSettings, OrderStatus } from '../types';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  updateOrderStatus,
  updateSettings,
  seedProductsIfEmpty,
} from '../services/storeService';
import { CATEGORIES } from '../data/initialProducts';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  currencySymbol: string;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  settings,
  currencySymbol,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'settings'>('overview');
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);
  const [settingsSavedNotice, setSettingsSavedNotice] = useState(false);

  // New / Edit Product Form State
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    price: 99,
    originalPrice: 120,
    category: 'Audio & Tech',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    stock: 25,
    rating: 5.0,
    reviewCount: 1,
    featured: true,
    badge: 'New',
    tags: ['lifestyle', 'premium'],
  });

  // Calculate Metrics
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const activeOrdersCount = orders.filter((o) => ['pending', 'processing', 'shipped'].includes(o.status)).length;
  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const averageOrderValue = orders.length > 0 ? totalRevenue / (orders.length || 1) : 0;

  const handleOpenAdd = () => {
    setProductForm({
      name: '',
      description: '',
      price: 120,
      originalPrice: 150,
      category: 'Audio & Tech',
      imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
      stock: 20,
      rating: 5.0,
      reviewCount: 0,
      featured: true,
      badge: 'New Arrival',
      tags: ['modern', 'premium'],
    });
    setIsAddingProduct(true);
  };

  const handleOpenEdit = (p: Product) => {
    setIsEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      category: p.category,
      imageUrl: p.imageUrl,
      stock: p.stock,
      rating: p.rating,
      reviewCount: p.reviewCount,
      featured: p.featured,
      badge: p.badge,
      tags: p.tags,
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEditingProduct) {
        await updateProduct(isEditingProduct.id, productForm);
        setIsEditingProduct(null);
      } else {
        await createProduct(productForm);
        setIsAddingProduct(false);
      }
    } catch (err) {
      console.error('Failed to save product:', err);
      alert('Error updating database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product permanently from the database?')) return;
    try {
      await deleteProduct(id);
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(settingsForm);
      setSettingsSavedNotice(true);
      setTimeout(() => setSettingsSavedNotice(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Error updating store settings in Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReSeed = async () => {
    if (!window.confirm('Seed database with default initial products?')) return;
    try {
      await seedProductsIfEmpty();
      alert('Seeding complete!');
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders =
    orderFilter === 'all' ? orders : orders.filter((o) => o.status === orderFilter);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-neutral-950/80 backdrop-blur-md flex flex-col">
      {/* Top Bar */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 sm:px-8 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold font-serif flex items-center gap-2">
              <span>Store Operations & Inventory Manager</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-sans uppercase font-bold">
                Live Database
              </span>
            </h1>
            <p className="text-xs text-neutral-400">
              Manage inventory, customer fulfillment, prices, and store settings
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-neutral-900/90 border-b border-neutral-800 px-4 sm:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'text-white border-emerald-500'
              : 'text-neutral-400 border-transparent hover:text-neutral-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Business Overview
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'products'
              ? 'text-white border-emerald-500'
              : 'text-neutral-400 border-transparent hover:text-neutral-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Catalog Products ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'text-white border-emerald-500'
              : 'text-neutral-400 border-transparent hover:text-neutral-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Customer Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'text-white border-emerald-500'
              : 'text-neutral-400 border-transparent hover:text-neutral-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Store Settings
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-neutral-950 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-2">
                    <span>Total Sales Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white font-serif">
                    {currencySymbol}{totalRevenue.toFixed(2)}
                  </div>
                  <p className="text-[11px] text-emerald-400 mt-1">From processed customer orders</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-2">
                    <span>Active Orders</span>
                    <Package className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white font-serif">
                    {activeOrdersCount}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">Pending, processing & in-transit</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-2">
                    <span>Live Products</span>
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white font-serif">
                    {products.length}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">Across 5 catalog categories</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-2">
                    <span>Average Order Value</span>
                    <TrendingUp className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white font-serif">
                    {currencySymbol}{averageOrderValue.toFixed(2)}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">{lowStockCount} items low on stock</p>
                </div>
              </div>

              {/* Quick Actions & Recent Orders Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white font-serif">Recent Customer Orders</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      View All Orders ({orders.length})
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <p className="text-xs text-neutral-500 py-8 text-center">
                      No customer orders have been placed yet.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {orders.slice(0, 4).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/60 border border-neutral-800 text-xs text-neutral-300"
                        >
                          <div>
                            <p className="font-bold text-white">{order.customerName}</p>
                            <p className="text-[11px] text-neutral-400">
                              {order.items?.length || 0} items • {order.customerEmail}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">
                              {currencySymbol}{order.total.toFixed(2)}
                            </p>
                            <span className="text-[10px] uppercase font-bold text-emerald-400">
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Operations Checklist */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white font-serif">Quick Actions</h3>

                  <button
                    onClick={() => {
                      setActiveTab('products');
                      handleOpenAdd();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product to Store</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className="w-full py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Settings className="w-4 h-4 text-neutral-400" />
                    <span>Adjust Taxes & Shipping Rules</span>
                  </button>

                  <button
                    onClick={handleReSeed}
                    className="w-full py-3 px-4 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all border border-neutral-700/60"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Seed / Replenish Default Catalog</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white font-serif">Store Catalog Inventory</h2>
                  <p className="text-xs text-neutral-400">
                    Create, edit, or adjust inventory quantities in the Firestore database
                  </p>
                </div>
                <button
                  onClick={handleOpenAdd}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              {/* Products Table */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-neutral-300">
                    <thead className="bg-neutral-800/80 text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
                      <tr>
                        <th className="p-4">Product</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4">Rating</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover bg-neutral-800 border border-neutral-700 shrink-0"
                              />
                              <div>
                                <p className="font-bold text-white">{p.name}</p>
                                {p.badge && (
                                  <span className="text-[10px] text-amber-400 font-semibold">
                                    {p.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-neutral-400">{p.category}</td>
                          <td className="p-4 font-bold text-white">
                            {currencySymbol}{p.price.toFixed(2)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-semibold ${
                                  p.stock <= 0
                                    ? 'text-rose-400'
                                    : p.stock <= 5
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {p.stock}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() => updateProduct(p.id, { stock: Math.max(0, p.stock - 1) })}
                                  className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center justify-center text-[10px]"
                                  title="Decrease stock"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => updateProduct(p.id, { stock: p.stock + 1 })}
                                  className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center justify-center text-[10px]"
                                  title="Increase stock"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            ★ {p.rating.toFixed(1)} ({p.reviewCount})
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                                title="Edit product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-900/60 text-neutral-400 hover:text-rose-400 transition-colors"
                                title="Delete product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white font-serif">Customer Orders Fulfillment</h2>
                  <p className="text-xs text-neutral-400">
                    Live customer orders stored in the Firestore database
                  </p>
                </div>

                {/* Filter pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderFilter(st)}
                      className={`px-3 py-1.5 rounded-full capitalize font-semibold transition-all ${
                        orderFilter === st
                          ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-500 text-xs">
                    No orders match the selected filter.
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 text-xs text-neutral-300"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">#{order.id.slice(0, 10)}</span>
                            <span className="text-neutral-500">•</span>
                            <span className="font-bold text-white">{order.customerName}</span>
                            <span className="text-neutral-400 text-[11px]">({order.customerEmail})</span>
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            Placed on {new Date(order.createdAt).toLocaleString()} • Tracking: <span className="font-mono text-emerald-400">{order.trackingNumber}</span>
                          </p>
                        </div>

                        {/* Status Change Selector */}
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-white text-sm sm:text-base">
                            {currencySymbol}{order.total.toFixed(2)}
                          </span>

                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                            className="bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Items row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {order.items?.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-800/40 border border-neutral-800/80"
                          >
                            <img
                              src={it.imageUrl}
                              alt={it.name}
                              className="w-8 h-8 rounded-lg object-cover bg-neutral-800"
                            />
                            <div className="truncate">
                              <p className="font-semibold text-white truncate">{it.name}</p>
                              <p className="text-[10px] text-neutral-400">
                                Qty: {it.quantity} × {currencySymbol}{it.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Shipping info footer */}
                      <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-neutral-400 gap-2">
                        <span>
                          Delivery: {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode} ({order.shippingAddress?.country})
                        </span>
                        <span>Payment: {order.paymentMethod}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-base font-bold text-white font-serif">Store Configuration</h2>
                <p className="text-xs text-neutral-400">
                  Update business profile, taxes, shipping limits, and store announcement
                </p>
              </div>

              {settingsSavedNotice && (
                <div className="p-3 bg-emerald-500/20 text-emerald-300 text-xs rounded-xl border border-emerald-500/30 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Store settings updated successfully in Firestore database!</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Business / Store Name</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.storeName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Concierge Support Email</label>
                  <input
                    type="email"
                    required
                    value={settingsForm.supportEmail}
                    onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Top Announcement Ticker Message</label>
                  <input
                    type="text"
                    value={settingsForm.bannerMessage}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bannerMessage: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Free Shipping Threshold ($)</label>
                    <input
                      type="number"
                      required
                      value={settingsForm.freeShippingThreshold}
                      onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingThreshold: Number(e.target.value) })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Sales Tax Rate (0.08 = 8%)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={settingsForm.taxRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, taxRate: Number(e.target.value) })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving to Firestore...' : 'Save Configuration'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Product Add / Edit Modal */}
      {(isAddingProduct || isEditingProduct) && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-xl w-full p-6 text-white max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-sm font-serif">
                {isEditingProduct ? 'Edit Catalog Product' : 'Add New Product to Catalog'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingProduct(false);
                  setIsEditingProduct(null);
                }}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Precision Acoustic Headphones"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Product specs, materials, and highlights..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">MSRP Original Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.originalPrice || ''}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All Products').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Available Stock *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Image URL *</label>
                <input
                  type="url"
                  required
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Badge (optional)</label>
                  <input
                    type="text"
                    value={productForm.badge || ''}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                    placeholder="e.g. Bestseller, Staff Pick, Sale"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={productForm.featured}
                    onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                    className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="featured" className="text-neutral-300 font-medium cursor-pointer">
                    Highlight as Featured
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingProduct(false);
                    setIsEditingProduct(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md"
                >
                  {isSaving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
