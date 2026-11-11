import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product, Order, Review, StoreSettings, OrderStatus } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from '../data/initialProducts';

const PRODUCTS_COL = 'products';
const ORDERS_COL = 'orders';
const REVIEWS_COL = 'reviews';
const SETTINGS_COL = 'settings';

// Seed initial products if catalog is empty
export async function seedProductsIfEmpty(): Promise<boolean> {
  const path = PRODUCTS_COL;
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      console.log('Seeding initial products into Firestore...');
      for (const item of INITIAL_PRODUCTS) {
        const docRef = doc(collection(db, path));
        await setDoc(docRef, {
          ...item,
          id: docRef.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Also seed default store settings
      const settingsRef = doc(db, SETTINGS_COL, 'general');
      const settingsSnap = await getDoc(settingsRef);
      if (!settingsSnap.exists()) {
        await setDoc(settingsRef, INITIAL_SETTINGS);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Seed error (may already exist or permission boundary):', error);
    return false;
  }
}

// Subscribe to Products catalog in real time
export function subscribeToProducts(callback: (products: Product[]) => void) {
  const path = PRODUCTS_COL;
  try {
    const q = collection(db, path);
    return onSnapshot(
      q,
      (snapshot) => {
        const products: Product[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          products.push({
            id: docSnap.id,
            name: data.name || 'Untitled Product',
            description: data.description || '',
            price: Number(data.price) || 0,
            originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
            category: data.category || 'General',
            imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
            stock: Number(data.stock) ?? 10,
            rating: Number(data.rating) || 5.0,
            reviewCount: Number(data.reviewCount) || 0,
            featured: Boolean(data.featured),
            badge: data.badge || undefined,
            tags: Array.isArray(data.tags) ? data.tags : [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        callback(products);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Add New Product
export async function createProduct(productData: Omit<Product, 'id'>): Promise<string> {
  const path = PRODUCTS_COL;
  try {
    const newDocRef = doc(collection(db, path));
    await setDoc(newDocRef, {
      ...productData,
      id: newDocRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Update Product
export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const path = `${PRODUCTS_COL}/${id}`;
  try {
    const docRef = doc(db, PRODUCTS_COL, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete Product
export async function deleteProduct(id: string): Promise<void> {
  const path = `${PRODUCTS_COL}/${id}`;
  try {
    await deleteDoc(doc(db, PRODUCTS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Create Order in Firestore
export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status'> & { userId: string }): Promise<string> {
  const path = ORDERS_COL;
  try {
    const newDocRef = doc(collection(db, path));
    const fullOrder: Order = {
      ...orderData,
      id: newDocRef.id,
      status: 'pending',
      trackingNumber: `NV-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(newDocRef, fullOrder);

    // Decrement stock for purchased items
    for (const item of orderData.items) {
      try {
        const productRef = doc(db, PRODUCTS_COL, item.id);
        const prodSnap = await getDoc(productRef);
        if (prodSnap.exists()) {
          const currentStock = prodSnap.data().stock || 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          await updateDoc(productRef, { stock: newStock });
        }
      } catch (err) {
        console.warn('Stock update note:', err);
      }
    }

    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Subscribe to Orders for Current User
export function subscribeToUserOrders(userId: string, callback: (orders: Order[]) => void) {
  const path = ORDERS_COL;
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const orders: Order[] = [];
        snapshot.forEach((docSnap) => {
          orders.push({ ...(docSnap.data() as Order), id: docSnap.id });
        });
        // Sort descending by date
        orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(orders);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Subscribe to All Orders (Admin View)
export function subscribeToAllOrders(callback: (orders: Order[]) => void) {
  const path = ORDERS_COL;
  try {
    const q = collection(db, path);
    return onSnapshot(
      q,
      (snapshot) => {
        const orders: Order[] = [];
        snapshot.forEach((docSnap) => {
          orders.push({ ...(docSnap.data() as Order), id: docSnap.id });
        });
        orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(orders);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Update Order Status (Admin)
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const path = `${ORDERS_COL}/${orderId}`;
  try {
    const docRef = doc(db, ORDERS_COL, orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Cancel Order (Customer - if pending)
export async function cancelOrder(orderId: string): Promise<void> {
  const path = `${ORDERS_COL}/${orderId}`;
  try {
    const docRef = doc(db, ORDERS_COL, orderId);
    await updateDoc(docRef, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Subscribe to Store Settings
export function subscribeToSettings(callback: (settings: StoreSettings) => void) {
  const path = `${SETTINGS_COL}/general`;
  try {
    const docRef = doc(db, SETTINGS_COL, 'general');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as StoreSettings);
        } else {
          callback(INITIAL_SETTINGS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Update Store Settings
export async function updateSettings(settings: StoreSettings): Promise<void> {
  const path = `${SETTINGS_COL}/general`;
  try {
    const docRef = doc(db, SETTINGS_COL, 'general');
    await setDoc(docRef, settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subscribe to Product Reviews
export function subscribeToProductReviews(productId: string, callback: (reviews: Review[]) => void) {
  const path = REVIEWS_COL;
  try {
    const q = query(collection(db, path), where('productId', '==', productId));
    return onSnapshot(
      q,
      (snapshot) => {
        const reviews: Review[] = [];
        snapshot.forEach((docSnap) => {
          reviews.push({ ...(docSnap.data() as Review), id: docSnap.id });
        });
        reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(reviews);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Add Review
export async function addProductReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
  const path = REVIEWS_COL;
  try {
    const newDocRef = doc(collection(db, path));
    await setDoc(newDocRef, {
      ...reviewData,
      id: newDocRef.id,
      createdAt: new Date().toISOString(),
    });

    // Recalculate product rating
    try {
      const prodRef = doc(db, PRODUCTS_COL, reviewData.productId);
      const prodSnap = await getDoc(prodRef);
      if (prodSnap.exists()) {
        const currentCount = prodSnap.data().reviewCount || 0;
        const currentRating = prodSnap.data().rating || 5.0;
        const newCount = currentCount + 1;
        const newRating = Number(((currentRating * currentCount + reviewData.rating) / newCount).toFixed(1));
        await updateDoc(prodRef, {
          reviewCount: newCount,
          rating: newRating,
        });
      }
    } catch (err) {
      console.warn('Rating recalculation notice:', err);
    }

    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Delete Product Review
export async function deleteProductReview(reviewId: string, productId: string, rating: number): Promise<void> {
  const path = `${REVIEWS_COL}/${reviewId}`;
  try {
    await deleteDoc(doc(db, REVIEWS_COL, reviewId));
    try {
      const prodRef = doc(db, PRODUCTS_COL, productId);
      const prodSnap = await getDoc(prodRef);
      if (prodSnap.exists()) {
        const currentCount = prodSnap.data().reviewCount || 1;
        const currentRating = prodSnap.data().rating || 5.0;
        const newCount = Math.max(0, currentCount - 1);
        const newRating = newCount === 0 ? 5.0 : Number(Math.max(1, ((currentRating * currentCount - rating) / newCount)).toFixed(1));
        await updateDoc(prodRef, {
          reviewCount: newCount,
          rating: newRating,
        });
      }
    } catch (err) {
      console.warn('Rating adjustment notice on delete:', err);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
