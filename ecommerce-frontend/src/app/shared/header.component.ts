import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { AdminAuthService } from '../core/admin-auth.service';
import { CartService } from '../core/cart.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  menuOpen = false;
  cartItemCount = 0;
  private cartSubscription: Subscription = new Subscription();

  constructor(
    public authService: AuthService,
    public adminAuthService: AdminAuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to real-time cart updates
    this.cartSubscription = this.cartService.cartItems$.subscribe(
      items => {
        // Calculate total quantity of all items in cart
        this.cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
        console.log('Cart counter updated:', this.cartItemCount);
      }
    );
    
    // Initial load of cart items
    this.cartService.getCartItems().subscribe();
  }

  ngOnDestroy() {
    this.cartSubscription.unsubscribe();
  }

  logout() {
    this.authService.logout();
    this.adminAuthService.logout();
    this.router.navigate(['/home']);
  }
}