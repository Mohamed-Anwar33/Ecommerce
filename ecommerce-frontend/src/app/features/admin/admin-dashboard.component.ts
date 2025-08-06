import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService, Product } from '../../core/api.service';
import { AuthService, User } from '../../core/auth.service';
import { AdminAuthService } from '../../core/admin-auth.service';
import { NotificationService } from '../../core/notification.service';
import { Observable } from 'rxjs';


// Remove bootstrap dependency - using DOM manipulation instead

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AdminDashboardComponent implements OnInit {
  products: Product[] = [];
  users: User[] = [];
  isLoading = true;
  activeTab: 'products' | 'users' = 'products';
  private fallbackImage = 'https://via.placeholder.com/50x50/f0f0f0/666666?text=No+Image';

  // Modal data properties
  selectedUser: User | null = null;
  userProducts: Product[] = [];
  editUserData: any = {
    name: '',
    email: '',
    password: '',
    isEmailVerified: false,
    changePassword: false
  };
  newUserData: any = {
    name: '',
    email: '',
    password: '',
    isEmailVerified: true
  };

  constructor(
    private apiService: ApiService, 
    private authService: AuthService,
    private adminAuthService: AdminAuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    const adminToken = localStorage.getItem('ecommerce_admin_token') || '';
    
    // Load all products with owner info (admin-specific API)
    this.apiService.adminGetAllProducts(adminToken).subscribe({
      next: (products) => {
        this.products = products;
        console.log('Admin dashboard products loaded:', this.products.length);
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error fetching admin products:', err);
        this.notificationService.showError('Failed to load products');
        this.checkLoadingComplete();
      }
    });
    
    // Load users from backend
    this.apiService.getAllUsersFromBackend(adminToken).subscribe({
      next: (users) => {
        this.users = users;
        this.checkLoadingComplete();
      },
      error: (err) => {
        this.notificationService.showError('Failed to load users from server');
        this.checkLoadingComplete();
      }
    });
  }

  checkLoadingComplete() {
    this.isLoading = false;
  }

  setActiveTab(tab: 'products' | 'users') {
    this.activeTab = tab;
  }

  // Product Management Methods
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
    return this.fallbackImage;
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

  editProduct(id: number) {
    this.router.navigate(['/add-product'], { queryParams: { edit: id } });
  }

  deleteProduct(id: number) {
    const product = this.products.find(p => p.id === id);
    if (!product) return;
    
    if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      const adminToken = localStorage.getItem('ecommerce_admin_token') || '';
      
      // Use admin-specific delete API
      this.apiService.adminDeleteProduct(id.toString(), adminToken).subscribe({
        next: (response) => {
          this.products = this.products.filter(product => product.id !== id);
          this.notificationService.showSuccess('Product deleted successfully by admin');
          console.log('Admin deleted product:', response);
        },
        error: (err) => {
          console.error('Error deleting product:', err);
          if (err.status === 404) {
            this.notificationService.showError('Product not found');
          } else if (err.status === 403) {
            this.notificationService.showError('Admin access required');
          } else {
            this.notificationService.showError('Failed to delete product');
          }
        }
      });
    }
  }

  addProduct() {
    this.router.navigate(['/add-product']);
  }

  addUser() {
    this.resetNewUserData();
    this.showModal('createUserModal');
  }

  // User Management Methods
  getTotalUsers(): number {
    return this.users.length;
  }

  getConfirmedUsers(): number {
    return this.users.filter(user => user.isEmailVerified).length;
  }

  getPendingUsers(): number {
    return this.users.filter(user => !user.isEmailVerified).length;
  }

  getUserProductCount(userId: number): number {
    return this.products.filter(product => product.ownerId === userId).length;
  }



  // Save new user from modal
  saveNewUser() {
    if (!this.newUserData.name || !this.newUserData.email || !this.newUserData.password) {
      this.notificationService.showError('Please fill in all required fields');
      return;
    }
    
    const adminToken = localStorage.getItem('ecommerce_admin_token') || '';
    const userData = {
      name: this.newUserData.name.trim(),
      email: this.newUserData.email.trim(),
      password: this.newUserData.password.trim(),
      isEmailVerified: this.newUserData.isEmailVerified
    };
    
    this.apiService.createUserFromBackend(userData, adminToken).subscribe({
      next: (res: any) => {
        if (res && res.user) {
          this.users.push(res.user);
          this.notificationService.showSuccess('User created successfully');
          this.closeModal('createUserModal');
          this.resetNewUserData();
        } else {
          this.notificationService.showError('Failed to create user');
        }
      },
      error: (err: any) => {
        if (err.status === 400 && err.error?.message === 'User already exists') {
          this.notificationService.showError('User with this email already exists');
        } else if (err.status === 400) {
          this.notificationService.showError('Please check your input data');
        } else {
          this.notificationService.showError('Failed to create user');
        }
      }
    });
  }

  // Edit user with modal
  editUser(user: User) {
    this.selectedUser = user;
    this.editUserData = {
      name: user.name,
      email: user.email,
      password: '',
      isEmailVerified: user.isEmailVerified,
      changePassword: false
    };
    
    this.showModal('editUserModal');
  }
  
  // Save user changes from modal
  saveUserChanges() {
    if (!this.editUserData.name || !this.editUserData.email) {
      this.notificationService.showError('Name and email are required');
      return;
    }
    
    if (this.editUserData.changePassword && !this.editUserData.password) {
      this.notificationService.showError('Please enter a new password');
      return;
    }
    
    const adminToken = localStorage.getItem('ecommerce_admin_token') || '';
    const updateData: any = {};
    
    if (this.editUserData.name.trim() !== this.selectedUser?.name) {
      updateData.name = this.editUserData.name.trim();
    }
    if (this.editUserData.email.trim() !== this.selectedUser?.email) {
      updateData.email = this.editUserData.email.trim();
    }
    if (this.editUserData.changePassword && this.editUserData.password.trim()) {
      updateData.password = this.editUserData.password.trim();
    }
    if (this.editUserData.isEmailVerified !== this.selectedUser?.isEmailVerified) {
      updateData.isEmailVerified = this.editUserData.isEmailVerified;
    }
    
    if (Object.keys(updateData).length === 0) {
      this.notificationService.showInfo('No changes made');
      this.closeModal('editUserModal');
      return;
    }
    
    this.apiService.updateUserFromBackend(this.selectedUser!.id, updateData, adminToken).subscribe({
      next: (res: any) => {
        if (res && res.user) {
          // Update user in local array
          const idx = this.users.findIndex(u => u.id === this.selectedUser!.id);
          if (idx !== -1) {
            this.users[idx] = { ...this.users[idx], ...res.user };
          }
          this.notificationService.showSuccess('User updated successfully');
          this.closeModal('editUserModal');
        } else {
          this.notificationService.showError('Failed to update user');
        }
      },
      error: (err: any) => {
        if (err.status === 400 && err.error?.message === 'Email already exists') {
          this.notificationService.showError('Email already exists');
        } else if (err.status === 404) {
          this.notificationService.showError('User not found');
        } else {
          this.notificationService.showError('Failed to update user');
        }
      }
    });
  }

  deleteUser(userId: number) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    this.selectedUser = user;
    this.showModal('deleteConfirmModal');
  }
  
  // Confirm delete user from modal
  confirmDeleteUser() {
    if (!this.selectedUser) return;
    
    const adminToken = localStorage.getItem('ecommerce_admin_token') || '';
    this.apiService.deleteUserFromBackend(this.selectedUser.id, adminToken).subscribe({
      next: (res: any) => {
        if (res && res.message === 'User deleted successfully') {
          // Remove user's products from the interface
          this.products = this.products.filter(product => product.ownerId !== this.selectedUser!.id);
          // Remove user from the list
          this.users = this.users.filter(u => u.id !== this.selectedUser!.id);
          
          const deletedUserInfo = res.deletedUser || { name: this.selectedUser?.name || 'Unknown User' };
          this.notificationService.showSuccess(`User "${deletedUserInfo.name}" deleted successfully`);
          this.closeModal('deleteConfirmModal');
          console.log('Admin deleted user:', res);
        } else {
          this.notificationService.showError('Failed to delete user');
        }
      },
      error: (err: any) => {
        console.error('Error deleting user:', err);
        if (err.status === 404) {
          this.notificationService.showError('User not found');
        } else if (err.status === 403) {
          this.notificationService.showError('Admin access required');
        } else {
          this.notificationService.showError('Failed to delete user');
        }
      }
    });
  }

  // Confirm user email verification
  confirmUserEmail(user: User) {
    if (user.isEmailVerified) {
      this.notificationService.showInfo('User email is already verified');
      return;
    }

    if (confirm(`Confirm email verification for user "${user.name}"?`)) {
      const adminToken = localStorage.getItem('ecommerce_admin_token') || '';
      const updateData = { isEmailVerified: true };
      
      this.apiService.updateUserFromBackend(user.id, updateData, adminToken).subscribe({
        next: (res: any) => {
          if (res && res.user) {
            // Update user in local array
            const idx = this.users.findIndex(u => u.id === user.id);
            if (idx !== -1) {
              this.users[idx] = { ...this.users[idx], ...res.user };
            }
            this.notificationService.showSuccess(`Email verified for user "${user.name}"`);
          } else {
            this.notificationService.showError('Failed to verify user email');
          }
        },
        error: (err: any) => {
          console.error('Error confirming user email:', err);
          this.notificationService.showError('Failed to verify user email');
        }
      });
    }
  }

  // View user's products with modal
  viewUserProducts(userId: number) {
    const user = this.users.find(u => u.id === userId);
    this.selectedUser = user || null;
    this.userProducts = this.products.filter(p => p.ownerId === userId);
    
    this.showModal('viewProductsModal');
  }

  // Helper methods for modal management
  resetNewUserData() {
    this.newUserData = {
      name: '',
      email: '',
      password: '',
      isEmailVerified: true
    };
  }

  // Show modal using DOM manipulation
  showModal(modalId: string) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      modalElement.style.display = 'block';
      modalElement.classList.add('show');
      modalElement.setAttribute('aria-hidden', 'false');
      
      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = `${modalId}-backdrop`;
      document.body.appendChild(backdrop);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    }
  }

  closeModal(modalId: string) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      modalElement.style.display = 'none';
      modalElement.classList.remove('show');
      modalElement.setAttribute('aria-hidden', 'true');
      
      // Remove backdrop
      const backdrop = document.getElementById(`${modalId}-backdrop`);
      if (backdrop) {
        backdrop.remove();
      }
      
      // Restore body scroll
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
  }
}