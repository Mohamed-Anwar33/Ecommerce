import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { CartService, CartItem } from '../../../core/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-out', style({ opacity: 1 })),
      ]),
    ]),
  ]
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  totalPrice = 0;
  showClearModal = false;

  constructor(private cartService: CartService) {}

  ngOnInit() {
    // Subscribe to cart changes for immediate UI updates
    this.cartService.cartItems$.subscribe((items: CartItem[]) => {
      this.cartItems = items;
      this.calculateTotal();
    });
    
    // Initial load of cart items
    this.cartService.getCartItems().subscribe();
  }

  calculateTotal() {
    this.totalPrice = this.cartService.getCartTotal();
  }

  // Quantity update methods removed to avoid UI issues

  removeFromCart(cartItemId: string) {
    this.cartService.removeFromCart(cartItemId);
  }

  clearCart() {
    this.showClearModal = true;
  }

  confirmClearCart() {
    this.cartService.clearCart();
    this.showClearModal = false;
  }

  cancelClearCart() {
    this.showClearModal = false;
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/placeholder-product.jpg';
  }

  getItemTotal(item: CartItem): number {
    return item.price * item.quantity;
  }

  getTotalItemsCount(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  onCheckout() {
    window.alert('Checkout is coming soon!');
  }
}