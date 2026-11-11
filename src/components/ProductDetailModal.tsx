import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Star,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  MessageSquare,
  Send,
  Heart,
  Trash2,
  ThumbsUp,
  UserCheck,
  Sparkles,
  Lock,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Product, Review } from '../types';
import {
  subscribeToProductReviews,
  addProductReview,
  deleteProductReview,
} from '../services/storeService';
import { auth, signInWithGoogle, signInGuest } from '../firebase';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  currencySymbol: string;
  onAddToCart: (product: Product, quantity: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  currentUser?: User | null;
  onOpenAuth?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  currencySymbol,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  currentUser: propUser,
  onOpenAuth,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Form State
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [newComment, setNewComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Active user (either from props or direct auth)
  const user = propUser || auth.currentUser;

  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    setReviewSubmitted(false);
    setSubmitError(null);
    setLoadingReviews(true);

    const unsubscribe = subscribeToProductReviews(product.id, (fetchedReviews) => {
      setReviews(fetchedReviews);
      setLoadingReviews(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [product]);

  // Pre-fill reviewer name if user signs in
  useEffect(() => {
    if (user?.displayName) {
      setReviewerName(user.displayName);
    }
  }, [user]);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  // Star Rating Text Feedback
  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5:
        return '5 Stars • Exceptional quality & craftsmanship';
      case 4:
        return '4 Stars • Very good, highly satisfied';
      case 3:
        return '3 Stars • Average, met expectations';
      case 2:
        return '2 Stars • Could be improved';
      case 1:
        return '1 Star • Poor experience';
      default:
        return 'Select your rating';
    }
  };

  // Compute Review Breakdown Statistics
  const totalReviewsCount = reviews.length;
  const averageRating =
    totalReviewsCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviewsCount
      : product.rating;

  const starCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[rounded] = (counts[rounded] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  // Filter and Sort Reviews
  const filteredAndSortedReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        if (ratingFilter === 'all') return true;
        return Math.round(r.rating) === ratingFilter;
      })
      .sort((a, b) => {
        if (reviewSort === 'highest') return b.rating - a.rating;
        if (reviewSort === 'lowest') return a.rating - b.rating;
        // newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [reviews, ratingFilter, reviewSort]);

  // Handle Review Submission
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user) {
      setSubmitError('Please sign in before posting a review.');
      return;
    }

    setIsSubmittingReview(true);
    setSubmitError(null);

    try {
      const authorId = user.uid;
      const displayName =
        reviewerName.trim() ||
        user.displayName ||
        (user.email ? user.email.split('@')[0] : 'Verified Customer');

      await addProductReview({
        productId: product.id,
        userId: authorId,
        userName: displayName,
        rating: newRating,
        comment: newComment.trim(),
      });

      setNewComment('');
      setReviewSubmitted(true);
      setTimeout(() => setReviewSubmitted(false), 5000);
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setSubmitError('Could not post review. Please ensure you are authenticated.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle Review Deletion (for author)
  const handleDeleteReview = async (review: Review) => {
    if (!window.confirm('Delete your review?')) return;
    setDeletingId(review.id);
    try {
      await deleteProductReview(review.id, product.id, review.rating);
    } catch (err) {
      console.error('Delete review error:', err);
      alert('Unable to delete review.');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Helpful Vote
  const handleVoteHelpful = (reviewId: string) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
  };

  const handleQuickGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickGuestSignIn = async () => {
    try {
      await signInGuest();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 shadow-md backdrop-blur-sm transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Body with Scroll */}
        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Product Image */}
            <div className="relative bg-neutral-100 flex items-center justify-center p-6 md:p-8 min-h-[340px]">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-h-[380px] w-full object-contain rounded-xl drop-shadow-md"
              />
              {product.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-neutral-900 text-white shadow-sm">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Right: Product Info & Actions */}
            <div className="p-6 md:p-8 flex flex-col justify-between">
              <div>
                {/* Category & Rating */}
                <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                  <span className="font-semibold text-neutral-400 uppercase tracking-widest text-[11px]">
                    {product.category}
                  </span>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="flex items-center gap-1.5 text-amber-500 font-bold hover:underline"
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{averageRating.toFixed(1)}</span>
                    <span className="text-neutral-400 font-normal">
                      ({reviews.length || product.reviewCount} reviews)
                    </span>
                  </button>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 font-serif leading-tight">
                  {product.name}
                </h2>

                {/* Price block */}
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-2xl font-extrabold text-neutral-950">
                    {currencySymbol}{product.price.toFixed(2)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-neutral-400 line-through">
                      {currencySymbol}{product.originalPrice!.toFixed(2)}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                      Save {currencySymbol}{(product.originalPrice! - product.price).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Stock status */}
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOutOfStock
                        ? 'bg-rose-500'
                        : product.stock <= 5
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-xs font-medium text-neutral-600">
                    {isOutOfStock
                      ? 'Out of Stock'
                      : product.stock <= 5
                      ? `Low Stock: Only ${product.stock} units remaining`
                      : `In Stock ready to ship (${product.stock} units available)`}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-4 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {product.description}
                </p>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Purchase Controls */}
              <div className="mt-6 pt-5 border-t border-neutral-100 space-y-4">
                <div className="flex items-center gap-4">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden bg-neutral-50">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={isOutOfStock || quantity <= 1}
                      className="px-3.5 py-2 text-neutral-600 hover:bg-neutral-200 disabled:opacity-40 transition-colors font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 font-bold text-xs text-neutral-900 bg-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={isOutOfStock || quantity >= product.stock}
                      className="px-3.5 py-2 text-neutral-600 hover:bg-neutral-200 disabled:opacity-40 transition-colors font-bold text-sm"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <button
                    onClick={() => {
                      onAddToCart(product, quantity);
                      onClose();
                    }}
                    disabled={isOutOfStock}
                    className="flex-1 py-3 px-5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      Add to Cart • {currencySymbol}{(product.price * quantity).toFixed(2)}
                    </span>
                  </button>

                  {/* Wishlist toggle */}
                  <button
                    onClick={() => onToggleWishlist(product)}
                    className={`p-3 rounded-xl border transition-colors ${
                      isWishlisted
                        ? 'border-rose-300 bg-rose-50 text-rose-600'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                    title={isWishlisted ? 'Remove Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Micro guarantees */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Fast Delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Authentic</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                    <span>30-Day Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Tabs: Product Specs & Customer Reviews */}
          <div className="border-t border-neutral-200 bg-neutral-50/60 p-6 md:p-8">
            <div className="flex items-center gap-6 border-b border-neutral-200 pb-3 mb-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`text-xs font-bold uppercase tracking-wider pb-1 transition-all ${
                  activeTab === 'details'
                    ? 'text-neutral-900 border-b-2 border-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Specifications & Highlights
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`text-xs font-bold uppercase tracking-wider pb-1 flex items-center gap-2 transition-all ${
                  activeTab === 'reviews'
                    ? 'text-neutral-900 border-b-2 border-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Customer Reviews ({reviews.length})
              </button>
            </div>

            {activeTab === 'details' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-600">
                <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-sm">
                  <h4 className="font-bold text-neutral-900 mb-1">Materials & Quality</h4>
                  <p>Certified commercial-grade standards, rigorously inspected before dispatch.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-sm">
                  <h4 className="font-bold text-neutral-900 mb-1">Packaging</h4>
                  <p>Eco-friendly 100% recyclable molded fiber protective packaging.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-sm">
                  <h4 className="font-bold text-neutral-900 mb-1">Domestic & International</h4>
                  <p>Tracked courier shipping with SMS & email dispatch notifications.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-sm">
                  <h4 className="font-bold text-neutral-900 mb-1">Customer Support</h4>
                  <p>Dedicated 24/7 client concierge support team ready to assist.</p>
                </div>
              </div>
            ) : (
              /* CUSTOMER REVIEW SYSTEM */
              <div className="space-y-8">
                {/* 1. Review Summary Scorecard */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Average Score Column */}
                    <div className="text-center md:border-r border-neutral-100 md:pr-6">
                      <div className="text-4xl sm:text-5xl font-extrabold text-neutral-900 font-serif">
                        {averageRating.toFixed(1)}
                      </div>
                      <div className="flex items-center justify-center gap-1 my-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= Math.round(averageRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-neutral-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-neutral-500">
                        Based on {reviews.length} customer {reviews.length === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>

                    {/* Breakdown Bars */}
                    <div className="space-y-2 md:col-span-2 text-xs">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = starCounts[stars as 1 | 2 | 3 | 4 | 5];
                        const pct = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
                        return (
                          <button
                            key={stars}
                            onClick={() =>
                              setRatingFilter(ratingFilter === stars ? 'all' : stars)
                            }
                            className={`w-full flex items-center gap-3 py-0.5 text-left group hover:opacity-80 transition-opacity ${
                              ratingFilter === stars ? 'font-bold text-neutral-900' : 'text-neutral-600'
                            }`}
                          >
                            <span className="w-12 text-[11px] shrink-0 flex items-center gap-1">
                              <span>{stars}</span>
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                            </span>
                            <div className="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-amber-400 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-[11px] text-neutral-400 shrink-0">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. Write a Review Box (Authenticated vs Guest) */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-sm font-bold text-neutral-900 font-serif">
                        Share Your Customer Experience
                      </h4>
                    </div>

                    {user && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Signed in as {user.displayName || user.email || 'Shopper'}</span>
                      </div>
                    )}
                  </div>

                  {!user ? (
                    /* Prompt Unauthenticated Users to Sign In */
                    <div className="bg-neutral-50 rounded-2xl p-5 border border-dashed border-neutral-300 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center mx-auto">
                        <Lock className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-900">
                          Sign In Required to Post a Verified Review
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5 max-w-sm mx-auto">
                          To protect authentic customer ratings, please sign in with your Google account or start an instant shopper demo session.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleQuickGoogleSignIn}
                          className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-bold rounded-xl border border-neutral-300 shadow-sm flex items-center gap-2 transition-all active:scale-95"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span>Sign In with Google</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleQuickGuestSignIn}
                          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
                        >
                          Instant Demo Sign In
                        </button>
                      </div>
                    </div>
                  ) : reviewSubmitted ? (
                    /* Review Success State */
                    <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-2xl flex items-center gap-3 border border-emerald-200 animate-in fade-in">
                      <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                      <div>
                        <p className="font-bold">Thank you for your review!</p>
                        <p className="text-emerald-700 text-[11px] mt-0.5">
                          Your rating and comments have been saved to the Firestore database and are now live for this product.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Interactive Form for Authenticated User */
                    <form onSubmit={handleAddReview} className="space-y-4">
                      {submitError && (
                        <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                          {submitError}
                        </div>
                      )}

                      {/* Star Rating Picker */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                          Overall Rating *
                        </label>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const active = star <= (hoverRating || newRating);
                              return (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => setNewRating(star)}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  className="p-1 hover:scale-125 transition-transform"
                                  title={`${star} Stars`}
                                >
                                  <Star
                                    className={`w-6 h-6 ${
                                      active
                                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                                        : 'text-neutral-300'
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                          <span className="text-xs text-neutral-500 font-medium">
                            {getRatingLabel(hoverRating || newRating)}
                          </span>
                        </div>
                      </div>

                      {/* Display Name Input */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          placeholder="Your Name (e.g. Alex M.)"
                          className="w-full sm:w-80 text-xs border border-neutral-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-400 bg-neutral-50/50"
                        />
                      </div>

                      {/* Comment Input */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-neutral-700">
                            Your Comments & Review *
                          </label>
                          <span className="text-[10px] text-neutral-400">
                            {newComment.length} / 1000 characters
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          maxLength={1000}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Describe the build quality, aesthetics, comfort, performance, or packaging..."
                          className="w-full text-xs border border-neutral-200 rounded-xl p-3 focus:outline-none focus:border-neutral-400 bg-neutral-50/50 resize-none leading-relaxed"
                          required
                        />
                      </div>

                      {/* Submit Row */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Reviews are verified and posted immediately to the cloud database
                        </span>

                        <button
                          type="submit"
                          disabled={isSubmittingReview || !newComment.trim()}
                          className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 disabled:opacity-40 flex items-center gap-2 shadow-sm transition-all active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmittingReview ? 'Saving to Database...' : 'Post Customer Review'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* 3. Review Filter Bar & List */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-neutral-200">
                    <div className="flex items-center gap-2 overflow-x-auto text-xs">
                      <span className="text-neutral-500 text-[11px] font-semibold flex items-center gap-1">
                        <Filter className="w-3 h-3" /> Filter:
                      </span>
                      <button
                        onClick={() => setRatingFilter('all')}
                        className={`px-3 py-1 rounded-full font-semibold transition-all ${
                          ratingFilter === 'all'
                            ? 'bg-neutral-900 text-white shadow-sm'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        All ({reviews.length})
                      </button>
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <button
                          key={stars}
                          onClick={() => setRatingFilter(stars)}
                          className={`px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 transition-all ${
                            ratingFilter === stars
                              ? 'bg-neutral-900 text-white shadow-sm'
                              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                        >
                          <span>{stars}★</span>
                          <span className="text-[10px] opacity-75">
                            ({starCounts[stars as 1 | 2 | 3 | 4 | 5]})
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-neutral-500">Sort:</span>
                      <select
                        value={reviewSort}
                        onChange={(e) => setReviewSort(e.target.value as any)}
                        className="bg-transparent font-semibold text-neutral-800 focus:outline-none cursor-pointer"
                      >
                        <option value="newest">Most Recent</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                      </select>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-3.5">
                    {loadingReviews ? (
                      <p className="text-xs text-neutral-400 italic py-6 text-center">
                        Loading real-time customer reviews...
                      </p>
                    ) : filteredAndSortedReviews.length === 0 ? (
                      <div className="text-center py-10 bg-white rounded-2xl border border-neutral-200/80 p-6 space-y-2">
                        <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto" />
                        <h5 className="text-xs font-bold text-neutral-800">
                          {ratingFilter !== 'all'
                            ? `No reviews with ${ratingFilter} stars found.`
                            : 'No customer reviews yet.'}
                        </h5>
                        <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                          Be the first verified customer to share your thoughts on this product!
                        </p>
                      </div>
                    ) : (
                      filteredAndSortedReviews.map((rev) => {
                        const isAuthor = user && user.uid === rev.userId;
                        const reviewDate = rev.createdAt
                          ? new Date(rev.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recent';

                        return (
                          <div
                            key={rev.id}
                            className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-sm space-y-3 hover:border-neutral-300 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center">
                                  {rev.userName ? rev.userName[0].toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-neutral-900">
                                      {rev.userName}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                      Verified Buyer
                                    </span>
                                    {isAuthor && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                        Your Review
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-neutral-400">
                                    Reviewed on {reviewDate}
                                  </span>
                                </div>
                              </div>

                              {/* Star Rating Badge */}
                              <div className="flex items-center gap-1 bg-neutral-50 px-2 py-1 rounded-lg border border-neutral-100">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3.5 h-3.5 ${
                                        s <= rev.rating
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-neutral-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-bold text-neutral-800 ml-1">
                                  {rev.rating}.0
                                </span>
                              </div>
                            </div>

                            {/* Comment */}
                            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed pl-11">
                              {rev.comment}
                            </p>

                            {/* Actions / Helpful */}
                            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 pl-11">
                              <button
                                onClick={() => handleVoteHelpful(rev.id)}
                                className="flex items-center gap-1.5 text-[11px] hover:text-neutral-900 transition-colors"
                              >
                                <ThumbsUp className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-700" />
                                <span>Helpful ({helpfulVotes[rev.id] || 0})</span>
                              </button>

                              {isAuthor && (
                                <button
                                  onClick={() => handleDeleteReview(rev)}
                                  disabled={deletingId === rev.id}
                                  className="text-[11px] text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>{deletingId === rev.id ? 'Deleting...' : 'Delete My Review'}</span>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
