import React, { useState } from 'react';
import {
  X,
  Package,
  Clock,
  Truck,
  CheckCircle,
  AlertOctagon,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { cancelOrder } from '../services/storeService';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  currencySymbol: string;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  currencySymbol,
}) => {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCancel = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      alert('Could not cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Order Received', bg: 'bg-amber-100 text-amber-800' };
      case 'processing':
        return { label: 'In Production / Packaging', bg: 'bg-blue-100 text-blue-800' };
      case 'shipped':
        return { label: 'Dispatched / In Transit', bg: 'bg-indigo-100 text-indigo-800' };
      case 'delivered':
        return { label: 'Delivered', bg: 'bg-emerald-100 text-emerald-800' };
      case 'cancelled':
        return { label: 'Cancelled', bg: 'bg-rose-100 text-rose-800' };
      default:
        return { label: status, bg: 'bg-neutral-100 text-neutral-800' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-neutral-900 font-serif">
              My Orders & Live Tracking ({orders.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-neutral-900 font-serif">No orders placed yet</h3>
              <p className="text-xs text-neutral-400 mt-1">
                When you make a purchase, real-time tracking and delivery updates will appear here.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const badge = getStatusBadge(order.status);
              const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  className="bg-neutral-50/70 rounded-2xl border border-neutral-200 p-4 sm:p-5 space-y-4 transition-all"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-200/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-neutral-900">
                          #{order.id.slice(0, 8)}...
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">{orderDate}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm sm:text-base font-bold text-neutral-950">
                        {currencySymbol}{order.total.toFixed(2)}
                      </span>
                      <p className="text-[11px] text-neutral-500">
                        Tracking: <span className="font-mono text-neutral-700">{order.trackingNumber || 'Pending'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Progress Step Bar */}
                  {order.status !== 'cancelled' && (
                    <div className="py-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-600 mb-2">
                        <span className={order.status ? 'text-emerald-700' : ''}>1. Placed</span>
                        <span className={['processing', 'shipped', 'delivered'].includes(order.status) ? 'text-emerald-700' : ''}>2. Processing</span>
                        <span className={['shipped', 'delivered'].includes(order.status) ? 'text-emerald-700' : ''}>3. Shipped</span>
                        <span className={order.status === 'delivered' ? 'text-emerald-700' : ''}>4. Delivered</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width:
                              order.status === 'pending'
                                ? '25%'
                                : order.status === 'processing'
                                ? '50%'
                                : order.status === 'shipped'
                                ? '75%'
                                : '100%',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Purchased Items */}
                  <div className="space-y-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover bg-white border border-neutral-200"
                          />
                          <div>
                            <p className="font-semibold text-neutral-900">{item.name}</p>
                            <p className="text-neutral-500 text-[11px]">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-medium text-neutral-800">
                          {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer & Cancel Button */}
                  <div className="pt-3 border-t border-neutral-200 flex flex-wrap items-center justify-between text-xs gap-2">
                    <span className="text-neutral-500 text-[11px]">
                      Shipping to: {order.shippingAddress?.fullName}, {order.shippingAddress?.city}
                    </span>

                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(order.id)}
                        disabled={cancellingId === order.id}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
