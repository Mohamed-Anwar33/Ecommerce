import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService, User } from '../../core/auth.service';
import { ApiService, Product } from '../../core/api.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class UserDashboardComponent implements OnInit {
  currentUser: User | null = null;
  userProducts: Product[] = [];
  isLoading = true;
  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to current user changes for real-time updates
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      if (!this.currentUser) {
        this.router.navigate(['/login']);
        return;
      }
      
      console.log('User dashboard updated with user data:', this.currentUser);
    });

    // Also get current user immediately
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadUserProducts();
  }

  loadUserProducts() {
    this.isLoading = true;
    this.apiService.getUserProducts().subscribe(products => {
      this.userProducts = products;
      this.isLoading = false;
    });
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  getTotalValue(): number {
    return this.userProducts.reduce((total, product) => {
      return total + product.price;
    }, 0);
  }

  getProductImage(product: Product): string {
    // Priority 1: Check if product has base64 image data
    if (product.image && product.image.startsWith('data:image/')) {
      console.log(`Using base64 image for product ${product.name}`);
      return product.image;
    }
    
    // Priority 2: Check if product has imageFile with base64 data
    if (product.imageFile && typeof product.imageFile === 'string' && product.imageFile.startsWith('data:image/')) {
      console.log(`Using base64 imageFile for product ${product.name}`);
      return product.imageFile;
    }
    
    // Priority 3: Check if product has valid image URL
    if (product.image && product.image.trim() !== '' && this.isValidImageUrl(product.image)) {
      console.log(`Using URL image for product ${product.name}`);
      return product.image;
    }
    
    // Priority 4: Return fallback image
    console.warn(`Using fallback image for product ${product.name}`);
    return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&auto=format&q=80';
  }

  isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      // Accept Unsplash URLs and common image extensions
      return url.includes('images.unsplash.com') || url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) !== null;
    } catch {
      return false;
    }
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/placeholder-product.jpg';
  }

  viewProduct(product: Product) {
    // Navigate to product details page
    this.router.navigate(['/products'], { queryParams: { view: product.id } });
  }

  editProduct(product: Product) {
    if (!this.currentUser) return;
    
    // Navigate to add-product page for editing - let backend handle authorization
    this.router.navigate(['/add-product'], { queryParams: { edit: product._id } });
  }

  deleteProduct(product: Product) {
    if (!this.currentUser) return;
    
    console.log('==> Delete product called with:', { product, currentUser: this.currentUser });
    
    if (confirm(`Are you sure you want to delete the product "${product.name}"?`)) {
      this.apiService.deleteProduct(product.id, this.currentUser.id, false).subscribe({
        next: (result) => {
          if (result.success) {
            this.notificationService.showSuccess('Product deleted successfully!');
            this.loadUserProducts(); // Reload products
          } else {
            this.notificationService.showError('Failed to delete product - You may not have permission to delete this product.');
          }
        },
        error: (err) => {
          this.notificationService.showError('Failed to delete product - You may not have permission to delete this product.');
          console.error(err);
        }
      });
    }
  }
}
