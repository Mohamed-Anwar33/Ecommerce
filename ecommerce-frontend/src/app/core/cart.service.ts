import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationService } from './notification.service';
import { HttpClient } from '@angular/common/http';

export interface CartItem {
  cartItemId: string; // The cart item's _id from backend
  productId: string;  // The product's _id
  name: string;
  price: number;
  image: string;
  description: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartItems: CartItem[] = [];
  private cartItemsSubject = new BehaviorSubject<CartItem[]>(this.cartItems);
  public cartItems$ = this.cartItemsSubject.asObservable();
  
  constructor(private notificationService: NotificationService, private http: HttpClient) {}

  getCartItems(): Observable<CartItem[]> {
    // جلب السلة من الباك اند
    return new Observable<CartItem[]>(observer => {
      this.http.get<any>('http://localhost:5000/api/cart', {
        headers: { Authorization: `Bearer ${localStorage.getItem('ecommerce_token')}` }
      }).subscribe({
        next: (cart) => {
          console.log('==> getCartItems response from backend:', cart);
          // تحويل بيانات السلة من الباك اند إلى CartItem[]
          const items: CartItem[] = (cart.items || []).map((item: any) => {
            console.log('Processing cart item:', item);
            console.log('  - item._id:', item._id);
            console.log('  - item.product:', item.product);
            return {
              cartItemId: item._id, // Cart item _id
              productId: item.product._id, // Product _id
              name: item.product.name,
              price: item.product.price,
              image: item.product.image,
              description: item.product.description,
              quantity: item.quantity
            };
          });
          console.log('Mapped cart items:', items);
          this.cartItems = items;
          this.cartItemsSubject.next(items);
          observer.next(items);
          observer.complete();
        },
        error: (err) => {
          this.notificationService.showError('Failed to load cart from server.');
          observer.error(err);
        }
      });
    });
  }

  addToCart(product: any) {
    // إرسال إضافة منتج للسلة إلى الباك اند
    // Use MongoDB _id if available, otherwise fall back to id
    const productId = product._id || product.id || product.productId;
    console.log('Adding to cart - Product:', product, 'ProductId:', productId);
    
    this.http.post<any>('http://localhost:5000/api/cart', {
      productId: productId,
      quantity: 1
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('ecommerce_token')}` }
    }).subscribe({
      next: (cart) => {
        console.log('Cart response:', cart);
        // تحديث السلة محلياً بعد نجاح العملية
        const items: CartItem[] = (cart.items || []).map((item: any) => ({
          cartItemId: item._id, // Cart item _id
          productId: item.product._id, // Product _id
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          description: item.product.description,
          quantity: item.quantity
        }));
        this.cartItems = items;
        this.cartItemsSubject.next(items);
        this.notificationService.showSuccess(`${product.name} has been added to the cart!`);
        this.getCartItems().subscribe();
      },
      error: (err) => {
        if (err.status === 400 && err.error?.message === 'Insufficient stock') {
          this.notificationService.showError('The requested quantity is not available in stock.');
        } else if (err.status === 404 && err.error?.message === 'Product not found') {
          this.notificationService.showError('Product not found.');
        } else {
          this.notificationService.showError('Failed to add product to cart.');
        }
      }
    });
  }

  updateQuantity(cartItemId: string, quantity: number) {
    console.log('==> updateQuantity called with:', { cartItemId, quantity });
    
    // Find the cart item by cartItemId
    const item = this.cartItems.find(item => item.cartItemId === cartItemId);
    console.log('Found cart item:', item);
    console.log('All cart items:', this.cartItems);
    
    if (!item) {
      console.log('Cart item not found locally!');
      return;
    }
    
    if (quantity <= 0) {
      console.log('Quantity <= 0, removing from cart');
      this.removeFromCart(cartItemId);
      return;
    }
    
    // Validate cartItemId format before sending
    if (!cartItemId || cartItemId.length !== 24) {
      console.error('Invalid cartItemId format:', cartItemId);
      this.notificationService.showError('Invalid cart item ID format');
      return;
    }
    
    console.log('Sending PUT request to:', `http://localhost:5000/api/cart/${cartItemId}`);
    console.log('Request payload:', { quantity });
    
    // Update quantity using cartItemId
    this.http.put<any>(`http://localhost:5000/api/cart/${cartItemId}`, { quantity }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('ecommerce_token')}` }
    }).subscribe({
      next: (cart) => {
        const items: CartItem[] = (cart.items || []).map((item: any) => ({
          cartItemId: item._id, // Cart item _id
          productId: item.product._id, // Product _id
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          description: item.product.description,
          quantity: item.quantity
        }));
        this.cartItems = items;
        this.cartItemsSubject.next(items);
        this.notificationService.showSuccess('Quantity updated successfully.');
      },
      error: (err) => {
        console.error('==> updateQuantity error:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.error);
        
        if (err.status === 400) {
          if (err.error?.message === 'Insufficient stock') {
            this.notificationService.showError('Sorry, there is not enough stock available for this quantity.');
          } else if (err.error?.message) {
            this.notificationService.showError(`Update failed: ${err.error.message}`);
          } else {
            this.notificationService.showError('Invalid request. Please check the cart item.');
          }
        } else {
          this.notificationService.showError('Failed to update quantity.');
        }
      }
    });
  }

  removeFromCart(cartItemId: string) {
    // Remove cart item by cartItemId
    this.http.delete<any>(`http://localhost:5000/api/cart/${cartItemId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('ecommerce_token')}` }
    }).subscribe({
      next: (res) => {
        // Refresh cart after successful removal
        this.getCartItems().subscribe(items => {
          this.cartItems = items;
          this.cartItemsSubject.next(items);
        });
        this.notificationService.showInfo('Product removed from cart.');
      },
      error: (err) => {
        this.notificationService.showError('Failed to remove product from cart.');
      }
    });
  }

  clearCart() {
    console.log('==> clearCart called');
    
    // Use the new atomic clear cart endpoint
    this.http.delete<any>('http://localhost:5000/api/cart/clear', {
      headers: { Authorization: `Bearer ${localStorage.getItem('ecommerce_token')}` }
    }).subscribe({
      next: (response) => {
        console.log('Cart cleared successfully:', response);
        // Update local state immediately
        this.cartItems = [];
        this.cartItemsSubject.next([]);
        this.notificationService.showSuccess('Cart cleared successfully!');
      },
      error: (err) => {
        console.error('Error clearing cart:', err);
        if (err.status === 404) {
          // Cart not found, probably already empty
          this.cartItems = [];
          this.cartItemsSubject.next([]);
          this.notificationService.showInfo('Cart is already empty.');
        } else {
          this.notificationService.showError('Failed to clear cart. Please try again.');
        }
      }
    });
  }

  getCartItemsCount(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}