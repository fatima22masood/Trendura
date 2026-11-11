import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Sparkles,
  Tag,
  Check,
  AlertCircle,
} from 'lucide-react';
import { CartItem, StoreSettings } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  settings: StoreSettings;
  currencySymbol: string;
  onProceedToCheckout: () => void;
  appliedPromo: string;
  onApplyPromo: (code: string) => { success: boolean; message: string };
  onRemovePromo: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  settings,
  currencySymbol,
  onProceedToCheckout,
  appliedPromo,
  onApplyPromo,
  onRemovePromo,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Discount calculation
  let discountPercent = 0;
  if (appliedPromo === 'NOVA10') discountPercent = 0.1;
  else if (appliedPromo === 'SAVE20') discountPercent = 0.2;

  const discountAmount = subtotal * discountPercent;
  const discountedSubtotal = subtotal - discountAmount;

  const isFreeShipping =
    appliedPromo === 'FREESHIP' || discountedSubtotal >= settings.freeShippingThreshold;
  const shippingCost = cartItems.length === 0 || isFreeShipping ? 0 : 4.99;
  const estimatedTax = discountedSubtotal * settings.taxRate;
  const grandTotal = discountedSubtotal + shippingCost + estimatedTax;

  const amountNeededForFreeShipping = Math.max(0, settings.freeShippingThreshold - discountedSubtotal);
  const freeShippingProgress = Math.min(
    100,
    (discountedSubtotal / settings.freeShippingThreshold) * 100
  );

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const result = onApplyPromo(promoInput.trim().toUpperCase());
    setPromoMessage({ text: result.message, isError: !result.success });
    if (result.success) {
      setPromoInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-neutral-900" />
              <h2 className="text-base font-bold text-neutral-900 font-serif">
                Your Shopping Bag ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Meter */}
          {cartItems.length > 0 && (
            <div className="bg-neutral-50 px-5 py-3 border-b border-neutral-200">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                {isFreeShipping ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    Unlocked Free Standard Shipping!
                  </span>
                ) : (
                  <span className="text-neutral-600">
                    Add <strong className="text-neutral-900">{currencySymbol}{amountNeededForFreeShipping.toFixed(2)}</strong> more for free shipping
                  </span>
                )}
                <span className="text-neutral-400 text-[10px] font-bold">
                  {Math.round(freeShippingProgress)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 text-neutral-300" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 font-serif">
                  Your bag is empty
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                  Explore our curated collection of architectural gear, accessories, and audio craftsmanship.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-sm"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 p-3 bg-neutral-50/80 hover:bg-neutral-50 rounded-2xl border border-neutral-200/80 transition-colors"
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-xl object-cover bg-white shrink-0 border border-neutral-200"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-neutral-400 hover:text-rose-500 transition-colors p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[11px] text-neutral-400 uppercase tracking-wider mt-0.5">
                        {item.product.category}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-200/60">
                      {/* Quantity buttons */}
                      <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-neutral-600 hover:bg-neutral-100 text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-0.5 text-xs font-bold text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="px-2 py-0.5 text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 text-xs font-bold"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-xs sm:text-sm font-bold text-neutral-950">
                        {currencySymbol}{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Breakdown */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-neutral-200 bg-white space-y-3.5 shadow-lg">
              {/* Promo code input */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Promo code (e.g. NOVA10)"
                    className="w-full text-xs uppercase tracking-wider bg-neutral-100 rounded-xl pl-8 pr-3 py-2 border border-neutral-200 focus:outline-none focus:bg-white"
                  />
                  <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Apply
                </button>
              </form>

              {promoMessage && (
                <div
                  className={`text-[11px] px-3 py-1.5 rounded-lg flex items-center justify-between ${
                    promoMessage.isError
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <span>{promoMessage.text}</span>
                  {appliedPromo && (
                    <button
                      onClick={() => {
                        onRemovePromo();
                        setPromoMessage(null);
                      }}
                      className="text-neutral-500 hover:text-neutral-800 font-bold ml-2 underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}

              {/* Price Calculation Lines */}
              <div className="space-y-1.5 text-xs text-neutral-600 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900">
                    {currencySymbol}{subtotal.toFixed(2)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({appliedPromo})</span>
                    <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Standard Shipping</span>
                  <span className="font-semibold text-neutral-900">
                    {shippingCost === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      `${currencySymbol}${shippingCost.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span className="font-semibold text-neutral-900">
                    {currencySymbol}{estimatedTax.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm sm:text-base font-extrabold text-neutral-950 pt-2 border-t border-neutral-200">
                  <span>Total</span>
                  <span>{currencySymbol}{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onProceedToCheckout();
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex justify-center">
                  <button
                    onClick={onClearCart}
                    className="text-[11px] text-neutral-400 hover:text-rose-600 transition-colors"
                  >
                    Clear shopping bag
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
