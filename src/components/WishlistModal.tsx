import React from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Product } from '../types';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onRemoveFromWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  currencySymbol: string;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlist,
  onRemoveFromWishlist,
  onAddToCart,
  currencySymbol,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h2 className="text-lg font-bold text-neutral-900 font-serif">
              My Saved Wishlist ({wishlist.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wishlist Items */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-3">
          {wishlist.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Heart className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
              <h3 className="text-base font-bold text-neutral-900 font-serif">Your wishlist is empty</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Save items you love by tapping the heart icon on any product card.
              </p>
            </div>
          ) : (
            wishlist.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 bg-neutral-50/80 rounded-2xl border border-neutral-200 gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover bg-white border border-neutral-200 shrink-0"
                  />
                  <div>
                    <h4 className="font-semibold text-xs sm:text-sm text-neutral-900 line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-neutral-400 uppercase tracking-wider">
                      {item.category}
                    </p>
                    <p className="text-xs font-bold text-neutral-900 mt-1">
                      {currencySymbol}{item.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onAddToCart(item);
                      onRemoveFromWishlist(item);
                    }}
                    disabled={item.stock <= 0}
                    className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Move to Bag</span>
                  </button>

                  <button
                    onClick={() => onRemoveFromWishlist(item)}
                    className="p-2 text-neutral-400 hover:text-rose-500 rounded-xl hover:bg-neutral-100 transition-colors"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
