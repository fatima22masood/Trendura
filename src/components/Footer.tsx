import React, { useState } from 'react';
import { Store, Send, ShieldCheck, Mail, ArrowUpRight } from 'lucide-react';
import { StoreSettings } from '../types';

interface FooterProps {
  settings: StoreSettings;
  onSelectCategory: (cat: string) => void;
  onOpenOrders: () => void;
  onToggleAdminView: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onSelectCategory,
  onOpenOrders,
  onToggleAdminView,
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribed(true);
    setNewsletterEmail('');
  };

  return (
    <footer className="bg-neutral-950 text-neutral-400 text-xs border-t border-neutral-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-xl bg-white text-neutral-950 flex items-center justify-center font-bold">
                <Store className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-lg font-bold font-serif tracking-tight">{settings.storeName}</span>
            </div>

            <p className="text-neutral-400 text-xs leading-relaxed max-w-sm">
              Engineered craftsmanship, architectural acoustics, and timeless everyday essentials. Connected to real-time cloud database inventory and instant order fulfillment.
            </p>

            {/* Newsletter */}
            <div className="pt-2">
              <p className="text-white font-semibold mb-2">Subscribe to the Private Drop List</p>
              {subscribed ? (
                <p className="text-emerald-400 font-medium">
                  ✓ Welcome! Your 10% coupon code is <strong className="text-white">NOVA10</strong>.
                </p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white hover:bg-neutral-200 text-neutral-950 font-bold rounded-xl transition-all shrink-0"
                  >
                    Join
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Catalog Categories */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">
              Catalog Collections
            </h4>
            <ul className="space-y-2">
              {['Audio & Tech', 'Everyday Carry', 'Smart Workspace', 'Minimalist Apparel', 'Home & Wellness'].map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => onSelectCategory(cat)}
                    className="hover:text-white transition-colors"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">
              Customer Concierge
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={onOpenOrders} className="hover:text-white transition-colors">
                  Track My Orders
                </button>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Returns & Exchanges
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Shipping Policy ($99+ Free)
                </span>
              </li>
              <li>
                <a
                  href={`mailto:${settings.supportEmail}`}
                  className="hover:text-white transition-colors"
                >
                  {settings.supportEmail}
                </a>
              </li>
            </ul>
          </div>

          {/* Operations & Business */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">
              Business Portal
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onToggleAdminView}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  <span>Inventory Manager</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </li>
              <li>
                <span className="text-neutral-500">Firestore Cloud Sync</span>
              </li>
              <li>
                <span className="text-neutral-500">Security ABAC Enforced</span>
              </li>
              <li>
                <span className="text-neutral-500">Real-time Stock Deductions</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved. Precision E-Commerce Platform.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-neutral-400 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-neutral-400 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-neutral-400 cursor-pointer">Cookie Preferences</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
