import React from 'react';
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';

interface HeroBannerProps {
  onShopNow: () => void;
  onExploreCategory: (category: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onShopNow, onExploreCategory }) => {
  return (
    <div className="relative overflow-hidden bg-neutral-950 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-6 shadow-2xl">
      {/* Background Graphic Accents */}
      <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500 rounded-full blur-[128px]" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500 rounded-full blur-[128px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-14 sm:py-20 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-10">
        {/* Left Column Content */}
        <div className="max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Curated Autumn & Winter Collection
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white font-serif leading-[1.15]">
            Engineered Living. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-indigo-300">
              Timeless Aesthetics.
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-neutral-300 leading-relaxed max-w-xl">
            From precision acoustic headphones and architectural chronographs to bespoke work accessories. Discover elevated goods built to outlast trends.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <button
              onClick={onShopNow}
              className="px-6 py-3.5 rounded-full bg-white text-neutral-950 font-bold text-sm hover:bg-neutral-100 hover:shadow-lg transition-all flex items-center gap-2 group active:scale-95"
            >
              Shop Featured Goods
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onExploreCategory('Audio & Tech')}
              className="px-5 py-3.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white font-semibold text-sm border border-neutral-700/80 transition-all active:scale-95"
            >
              Explore Audio & Tech
            </button>
          </div>
        </div>

        {/* Right Feature Showcase Card */}
        <div className="w-full lg:w-96 bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">The Store Standard</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">Verified Business</span>
          </div>

          <div className="space-y-3.5 text-xs text-neutral-300">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-emerald-400 shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">Express & Free Shipping</p>
                <p className="text-neutral-400 text-[11px]">Complimentary worldwide shipping on orders over $99</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-indigo-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">Authenticity & 2-Yr Warranty</p>
                <p className="text-neutral-400 text-[11px]">100% genuine craftsmanship with manufacturer guarantee</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-rose-400 shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">30-Day Hassle-Free Returns</p>
                <p className="text-neutral-400 text-[11px]">Instant pre-paid return labels with zero restock fee</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
