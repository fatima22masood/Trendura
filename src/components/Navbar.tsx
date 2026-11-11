import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Heart,
  Package,
  LayoutDashboard,
  User as UserIcon,
  X,
  ChevronDown,
  LogOut,
  Sparkles,
  Store,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { StoreSettings } from '../types';

interface NavbarProps {
  settings: StoreSettings;
  cartCount: number;
  wishlistCount: number;
  userOrdersCount: number;
  currentUser: User | null;
  isAdmin: boolean;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenOrders: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onToggleAdminView: () => void;
  isAdminView: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: string[];
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  cartCount,
  wishlistCount,
  userOrdersCount,
  currentUser,
  isAdmin,
  onOpenCart,
  onOpenWishlist,
  onOpenOrders,
  onOpenAuth,
  onLogout,
  onToggleAdminView,
  isAdminView,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categories,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchOpenMobile, setIsSearchOpenMobile] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200 transition-all">
      {/* Top Announcement Bar */}
      <div className="bg-neutral-900 text-neutral-100 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="truncate max-w-2xl">{settings.bannerMessage}</span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onSelectCategory('All Products');
                onSearchChange('');
              }}
              className="flex items-center gap-2 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-1.5 font-serif">
                  {settings.storeName || 'NOVA'}
                </span>
                <span className="hidden sm:block text-[10px] uppercase tracking-widest text-neutral-500 font-sans -mt-1">
                  Boutique & Goods
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products, gear, apparel..."
                className="w-full bg-neutral-100/90 hover:bg-neutral-100 focus:bg-white text-neutral-900 placeholder-neutral-400 text-sm rounded-full pl-10 pr-10 py-2.5 border border-transparent focus:border-neutral-300 focus:outline-none transition-all"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpenMobile(!isSearchOpenMobile)}
              className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-neutral-100"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Store Manager Toggle */}
            <button
              onClick={onToggleAdminView}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isAdminView
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80'
              }`}
              title="Switch between Customer Store and Business Manager"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isAdminView ? 'Storefront' : 'Store Manager'}
              </span>
            </button>

            {/* Wishlist */}
            <button
              onClick={onOpenWishlist}
              className="relative p-2 text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* My Orders */}
            <button
              onClick={onOpenOrders}
              className="relative p-2 text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
              title="My Orders & Tracking"
            >
              <Package className="w-5 h-5" />
              {userOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {userOrdersCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-neutral-900 text-white hover:bg-neutral-800 px-3.5 py-2 rounded-full transition-all shadow-sm active:scale-95"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-bold">{cartCount}</span>
            </button>

            {/* User Profile / Auth */}
            <div className="relative">
              {currentUser ? (
                <div>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1.5 p-1 rounded-full border border-neutral-200 hover:border-neutral-400 transition-colors"
                  >
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="User"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-700 font-bold text-xs flex items-center justify-center">
                        {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500 pr-0.5" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-neutral-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="text-xs font-semibold text-neutral-900 truncate">
                          {currentUser.displayName || 'Customer'}
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate">
                          {currentUser.email || (currentUser.isAnonymous ? 'Guest Shopper' : '')}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenOrders();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                      >
                        <Package className="w-3.5 h-3.5" /> My Orders & History
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onToggleAdminView();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />
                        {isAdminView ? 'View Storefront' : 'Manage Store Inventory'}
                      </button>

                      <div className="my-1 border-t border-neutral-100" />

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 border border-neutral-300 hover:border-neutral-400 px-3 py-1.5 rounded-full transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5" /> Sign In
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Input Drawer */}
        {isSearchOpenMobile && (
          <div className="md:hidden pb-3 pt-1">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search catalog..."
                className="w-full bg-neutral-100 text-neutral-900 text-sm rounded-full pl-10 pr-10 py-2 border border-neutral-200 focus:outline-none"
                autoFocus
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category Pills Bar (when on storefront) */}
        {!isAdminView && (
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar border-t border-neutral-100">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`text-xs font-medium px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all ${
                    active
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
