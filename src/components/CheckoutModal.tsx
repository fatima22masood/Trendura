import React, { useState } from 'react';
import {
  X,
  CreditCard,
  CheckCircle2,
  Lock,
  Truck,
  Copy,
  Check,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, StoreSettings, ShippingAddress } from '../types';
import { createOrder } from '../services/storeService';
import { auth } from '../firebase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  settings: StoreSettings;
  currencySymbol: string;
  appliedPromo: string;
  onOrderCompleted: () => void;
  onViewOrders: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  settings,
  currencySymbol,
  appliedPromo,
  onOrderCompleted,
  onViewOrders,
}) => {
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'cod'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<{
    orderId: string;
    trackingNumber: string;
    total: number;
  } | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  // Address Form State
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: auth.currentUser?.displayName || '',
    email: auth.currentUser?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });

  // Card Form State
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Discounts
  let discountPercent = 0;
  if (appliedPromo === 'NOVA10') discountPercent = 0.1;
  else if (appliedPromo === 'SAVE20') discountPercent = 0.2;
  const discountAmount = subtotal * discountPercent;
  const discountedSubtotal = subtotal - discountAmount;

  // Shipping
  const isFreeStandard = appliedPromo === 'FREESHIP' || discountedSubtotal >= settings.freeShippingThreshold;
  const shippingCost =
    shippingMethod === 'express'
      ? 14.99
      : isFreeStandard
      ? 0
      : 4.99;

  const tax = discountedSubtotal * settings.taxRate;
  const grandTotal = discountedSubtotal + shippingCost + tax;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.email || !address.address || !address.city) {
      alert('Please fill out all required shipping fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      const userId = user?.uid || `guest_${Date.now()}`;

      const orderItems = cartItems.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        imageUrl: item.product.imageUrl,
      }));

      const newOrderId = await createOrder({
        userId,
        customerEmail: address.email,
        customerName: address.fullName,
        customerPhone: address.phone,
        items: orderItems,
        subtotal,
        discount: discountAmount,
        promoCode: appliedPromo || undefined,
        shipping: shippingCost,
        tax,
        total: grandTotal,
        shippingAddress: address,
        paymentMethod:
          paymentMethod === 'card'
            ? 'Credit Card (Ending 4242)'
            : paymentMethod === 'apple_pay'
            ? 'Apple / Google Pay'
            : 'Cash on Delivery',
      });

      // Confetti celebratory burst!
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });

      setOrderConfirmation({
        orderId: newOrderId,
        trackingNumber: `NV-${Math.floor(100000 + Math.random() * 900000)}`,
        total: grandTotal,
      });

      onOrderCompleted();
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('There was an issue processing your order. Please check the logs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyOrderId = () => {
    if (orderConfirmation) {
      navigator.clipboard.writeText(orderConfirmation.orderId);
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-neutral-900 font-serif">
              {orderConfirmation ? 'Order Confirmed!' : 'Secure Checkout'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1">
          {orderConfirmation ? (
            /* Order Success State */
            <div className="text-center py-6 sm:py-8 space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-neutral-900 font-serif">
                  Thank You For Your Order!
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-md mx-auto">
                  Your purchase has been placed and registered in our live store database. We've sent a confirmation receipt to <strong>{address.email}</strong>.
                </p>
              </div>

              {/* Order Reference Box */}
              <div className="max-w-md mx-auto bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Order ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral-900">{orderConfirmation.orderId}</span>
                    <button
                      onClick={copyOrderId}
                      className="text-neutral-400 hover:text-neutral-700"
                      title="Copy Order ID"
                    >
                      {copiedOrderId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Estimated Delivery:</span>
                  <span className="font-semibold text-neutral-900">
                    {shippingMethod === 'express' ? '1-2 Business Days' : '3-5 Business Days'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Total Charged:</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {currencySymbol}{orderConfirmation.total.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                    Order Received / Processing
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    onClose();
                    onViewOrders();
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>View in My Orders</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-neutral-100 text-neutral-700 font-bold text-xs hover:bg-neutral-200 transition-all"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {/* Step 1: Customer & Shipping Address */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-neutral-500" />
                  1. Shipping Destination
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-neutral-600 mb-1 font-medium">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      placeholder="Jane Doe"
                      className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-400 bg-neutral-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1 font-medium">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={address.email}
                      onChange={(e) => setAddress({ ...address, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-400 bg-neutral-50/50"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-neutral-600 mb-1 font-medium">Street Address *</label>
                    <input
                      type="text"
                      required
                      value={address.address}
                      onChange={(e) => setAddress({ ...address, address: e.target.value })}
                      placeholder="742 Evergreen Terrace, Apt 4B"
                      className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-400 bg-neutral-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1 font-medium">City *</label>
                    <input
                      type="text"
                      required
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      placeholder="San Francisco"
                      className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-400 bg-neutral-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">State/Province</label>
                      <input
                        type="text"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        placeholder="CA"
                        className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-neutral-400 bg-neutral-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">Postal Code</label>
                      <input
                        type="text"
                        value={address.postalCode}
                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                        placeholder="94107"
                        className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-neutral-400 bg-neutral-50/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Delivery Speed */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3">
                  2. Delivery Option
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label
                    className={`flex items-start justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      shippingMethod === 'standard'
                        ? 'border-neutral-900 bg-neutral-50/80 shadow-sm'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingMethod === 'standard'}
                        onChange={() => setShippingMethod('standard')}
                        className="text-neutral-900 focus:ring-neutral-900"
                      />
                      <div>
                        <p className="font-bold text-neutral-900">Standard Delivery</p>
                        <p className="text-neutral-500 text-[11px]">3-5 business days</p>
                      </div>
                    </div>
                    <span className="font-bold text-neutral-900">
                      {isFreeStandard ? <span className="text-emerald-600">FREE</span> : `${currencySymbol}4.99`}
                    </span>
                  </label>

                  <label
                    className={`flex items-start justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      shippingMethod === 'express'
                        ? 'border-neutral-900 bg-neutral-50/80 shadow-sm'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingMethod === 'express'}
                        onChange={() => setShippingMethod('express')}
                        className="text-neutral-900 focus:ring-neutral-900"
                      />
                      <div>
                        <p className="font-bold text-neutral-900">Priority Express</p>
                        <p className="text-neutral-500 text-[11px]">1-2 business days with courier tracking</p>
                      </div>
                    </div>
                    <span className="font-bold text-neutral-900">{currencySymbol}14.99</span>
                  </label>
                </div>
              </div>

              {/* Step 3: Payment Method */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-neutral-500" />
                  3. Payment Method
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        paymentMethod === 'card'
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      Credit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('apple_pay')}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        paymentMethod === 'apple_pay'
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      Apple / GPay
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      Pay on Delivery
                    </button>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
                      <div>
                        <label className="block text-neutral-600 mb-1 text-[11px] font-medium">Card Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4242 4242 4242 4242"
                            className="w-full border border-neutral-200 rounded-xl px-3 py-2 pl-9 bg-white text-xs font-mono focus:outline-none"
                          />
                          <CreditCard className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-neutral-600 mb-1 text-[11px] font-medium">Expires</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full border border-neutral-200 rounded-xl px-3 py-2 bg-white text-xs font-mono focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-neutral-600 mb-1 text-[11px] font-medium">Security CVC</label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="•••"
                            className="w-full border border-neutral-200 rounded-xl px-3 py-2 bg-white text-xs font-mono focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'apple_pay' && (
                    <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-center text-xs text-neutral-600">
                      Biometric checkout ready. You will authorize with FaceID / TouchID upon placing order.
                    </div>
                  )}

                  {paymentMethod === 'cod' && (
                    <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-xs text-neutral-600">
                      Pay cash or contactless terminal upon parcel arrival at your doorstep.
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary & Submit Button */}
              <div className="border-t border-neutral-200 pt-4 space-y-3">
                <div className="space-y-1.5 text-xs text-neutral-600">
                  <div className="flex justify-between">
                    <span>Subtotal ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                    <span className="font-semibold text-neutral-900">{currencySymbol}{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({appliedPromo})</span>
                      <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-semibold text-neutral-900">
                      {shippingCost === 0 ? <span className="text-emerald-600">FREE</span> : `${currencySymbol}${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sales Tax</span>
                    <span className="font-semibold text-neutral-900">{currencySymbol}{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-neutral-950 pt-2 border-t border-neutral-200">
                    <span>Grand Total</span>
                    <span>{currencySymbol}{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isSubmitting ? 'Placing Order in Database...' : `Authorize & Place Order • ${currencySymbol}${grandTotal.toFixed(2)}`}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
