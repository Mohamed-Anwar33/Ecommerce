import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ApiService, Product } from '../../core/api.service';
import { CartService } from '../../core/cart.service';
import { AuthService } from '../../core/auth.service';
import { AdminAuthService } from '../../core/admin-auth.service';
import { NotificationService } from '../../core/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('0.8s ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
    ]),
  ]
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = true;
  private fallbackImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&auto=format';

  // Search, filter, sort state
  searchTerm: string = '';
  sortBy: string = 'name';
  priceRange = { min: null as number | null, max: null as number | null };

  // Compare (localStorage for persistence)
  compare: number[] = [];

  constructor(
    private apiService: ApiService, 
    private cartService: CartService,
    public authService: AuthService,
    public adminAuthService: AdminAuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCompare();
    this.apiService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
        this.validateProductImages();
        this.applyFilters();
        console.log('Products loaded from backend:', this.products.length);
      },
      error: (err) => {
        console.error('Error fetching products from backend:', err);
        this.isLoading = false;
        this.notificationService.showError('Error fetching products from backend');
      }
    });
  }

  // --- Search, Filter, Sort Logic ---
  onSearchChange() {
    this.applyFilters();
  }
  onSortChange() {
    this.applyFilters();
  }
  onPriceRangeChange() {
    this.applyFilters();
  }
  clearFilters() {
    this.searchTerm = '';
    this.sortBy = 'name';
    this.priceRange = { min: null, max: null };
    this.applyFilters();
  }
  hasActiveFilters(): boolean {
    return !!this.searchTerm || this.priceRange.min !== null || this.priceRange.max !== null || this.sortBy !== 'name';
  }
  applyFilters() {
    let filtered = [...this.products];
    // Search
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term)
      );
    }
    // Price Range
    if (this.priceRange.min !== null) {
      filtered = filtered.filter(p => p.price >= this.priceRange.min!);
    }
    if (this.priceRange.max !== null) {
      filtered = filtered.filter(p => p.price <= this.priceRange.max!);
    }
    // Sorting
    switch (this.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price); break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price); break;
      case 'rating':
        filtered.sort((a, b) => this.getProductRating(b) - this.getProductRating(a)); break;
      case 'newest':
        filtered.sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)); break;
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    this.filteredProducts = filtered;
  }


  // --- Compare Logic ---
  loadCompare() {
    const data = localStorage.getItem('compare');
    this.compare = data ? JSON.parse(data) : [];
  }
  saveCompare() {
    localStorage.setItem('compare', JSON.stringify(this.compare));
  }
  toggleCompare(product: Product) {
    const idx = this.compare.indexOf(product.id);
    if (idx > -1) {
      this.compare.splice(idx, 1);
    } else if (this.compare.length < 3) {
      this.compare.push(product.id);
    }
    this.saveCompare();
  }
  isInCompare(productId: number): boolean {
    return this.compare.includes(productId);
  }

  // --- Product Helpers ---
  trackByProductId(index: number, product: Product) {
    return product.id;
  }
  isNewProduct(product: Product): boolean {
    if (!product.createdAt) return false;
    const created = new Date(product.createdAt);
    const now = new Date();
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
    return diffDays <= 7;
  }
  getProductRating(product: Product): number {
    // Example: use product.rating or fallback to random for demo
    return product.rating ?? Math.floor(Math.random() * 3) + 3;
  }
  getDiscountPercentage(product: Product): number {
    if (!product.originalPrice || product.originalPrice <= product.price) return 0;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }
  getStockClass(product: Product): string {
    const stock = typeof product.stock === 'number' ? product.stock : 99;
    if (stock === 0) return 'stock-indicator out';
    if (stock <= 5) return 'stock-indicator low';
    return 'stock-indicator in';
  }
  getStockText(product: Product): string {
    const stock = typeof product.stock === 'number' ? product.stock : 99;
    if (stock === 0) return 'Out of Stock';
    if (stock <= 5) return `Only ${stock} left!`;
    return 'In Stock';
  }
  openQuickView(product: Product) {
    // Placeholder for modal/dialog
    alert('Quick View for: ' + product.name);
  }

  // --- (rest of the original methods below remain unchanged) ---


  validateProductImages() {
    this.products.forEach(product => {
      if (!product.image || product.image.trim() === '' || !this.isValidImageUrl(product.image)) {
        console.warn(`Invalid image URL for product ${product.name}:`, product.image);
        product.image = this.fallbackImage;
      } else {
        console.log(`Valid image for product ${product.name}:`, product.image.substring(0, 60) + '...');
      }
    });
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
      console.log(`Using URL image for product ${product.name}:`, product.image.substring(0, 60) + '...');
      return product.image;
    }
    
    // Priority 4: Return fallback image
    console.warn(`Using fallback image for product ${product.name}`);
    return this.fallbackImage;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img.src !== this.fallbackImage) {
      img.src = this.fallbackImage;
    }
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product);
    // Notification is handled by cart service
  }

  editProduct(product: Product) {
    // Navigate to edit product page with query parameter
    this.router.navigate(['/add-product'], { queryParams: { edit: product.id } });
  }

  deleteProduct(product: Product) {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      const currentUser = this.authService.getCurrentUser();
      const isAdmin = this.adminAuthService.isAdminAuthenticated();
      
      if (currentUser) {
        this.apiService.deleteProduct(product.id, currentUser.id, isAdmin).subscribe({
          next: (result) => {
            if (result.success) {
              this.products = this.products.filter(p => p.id !== product.id);
              this.notificationService.showSuccess(`${product.name} deleted successfully!`);
            } else {
              this.notificationService.showError('You do not have permission to delete this product');
            }
          },
          error: (err) => {
            console.error('Error deleting product:', err);
            this.notificationService.showError('Error occurred while deleting the product');
          }
        });
      }
    }
  }
}