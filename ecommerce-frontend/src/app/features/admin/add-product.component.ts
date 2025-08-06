import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ApiService, Product } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { AdminAuthService } from '../../core/admin-auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
  ]
})
export class AddProductComponent implements OnInit {
  name = '';
  price = 0;
  image = '';
  description = '';
  category = '';
  errorMessage = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isEditMode = false;
  editingProductId: number | null = null;
  isLoading = false;

  constructor(
    private apiService: ApiService, 
    private authService: AuthService,
    private adminAuthService: AdminAuthService,
    private notificationService: NotificationService,
    public router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    console.log('==> AddProductComponent ngOnInit called');
    // Check if we're in edit mode
    this.route.queryParams.subscribe(params => {
      console.log('Query params received:', params);
      if (params['edit']) {
        console.log('Edit mode detected, edit ID:', params['edit']);
        this.isEditMode = true;
        this.editingProductId = params['edit']; // Always use string, do not parseInt
        console.log('Set editingProductId (string):', this.editingProductId);
        this.loadProductForEdit();
      } else {
        console.log('No edit parameter found, staying in add mode');
      }
    });
  }

  loadProductForEdit() {
    console.log('==> loadProductForEdit called with editingProductId:', this.editingProductId);
    if (!this.editingProductId) {
      console.log('No editingProductId, returning');
      return;
    }
    
    // First try to get user products (which should include the product to edit)
    console.log('Calling getUserProducts...');
    this.apiService.getUserProducts().subscribe({
      next: (products) => {
        console.log('getUserProducts returned:', products);
        console.log('Looking for product with ID:', this.editingProductId);
        const product = products.find(p => String(p.id) === String(this.editingProductId) || String(p._id) === String(this.editingProductId));
        console.log('Found product:', product);
        if (product) {
          this.name = product.name;
          this.price = product.price;
          this.description = product.description;
          this.image = product.image;
          this.imagePreview = product.image;
          this.category = product.category || '';
        } else {
          console.log('Product not found in user products, trying all products...');
          // If not found in user products, try all products (for admin)
          this.apiService.getProducts().subscribe(allProducts => {
            const foundProduct = allProducts.find(p => String(p.id) === String(this.editingProductId) || String(p._id) === String(this.editingProductId));
            if (foundProduct) {
              this.name = foundProduct.name;
              this.price = foundProduct.price;
              this.description = foundProduct.description;
              this.image = foundProduct.image;
              this.imagePreview = foundProduct.image;
              this.category = foundProduct.category || '';
            }
          });
        }
      },
      error: (err) => {
        console.error('Error loading product for edit:', err);
        // Fallback to all products
        this.apiService.getProducts().subscribe(allProducts => {
          const foundProduct = allProducts.find(p => p.id === this.editingProductId || p._id === String(this.editingProductId));
          if (foundProduct) {
            this.name = foundProduct.name;
            this.price = foundProduct.price;
            this.description = foundProduct.description;
            this.image = foundProduct.image;
            this.imagePreview = foundProduct.image;
            this.category = foundProduct.category || '';
          }
        });
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (!this.name || !this.price || !this.description || !this.category) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.isLoading = true;
    
    // Check if admin or regular user is logged in
    const currentUser = this.authService.getCurrentUser();
    const isAdmin = this.adminAuthService.isAdminAuthenticated();
    
    if (!currentUser && !isAdmin) {
      this.errorMessage = 'You must be logged in to add/edit products';
      this.isLoading = false;
      return;
    }

    // Use admin ID (0) if admin is logged in, otherwise use current user ID
    const userId = isAdmin ? 0 : (currentUser?.id || 0);
    
    let imageUrl = this.image;
    
    // If a file was selected, convert it to base64 for storage
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        imageUrl = e.target.result;
        this.saveProduct(imageUrl, userId, isAdmin);
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.saveProduct(imageUrl, userId, isAdmin);
    }
  }

  private saveProduct(imageUrl: string, userId: number, isAdmin: boolean = false) {
    const product = {
      name: this.name,
      price: this.price,
      image: imageUrl || 'assets/images/placeholder-product.jpg',
      description: this.description,
      category: this.category,
      ownerId: userId,
      imageFile: this.selectedFile || imageUrl // Pass file or URL
    };

    console.log('Saving product:', { product, userId, isAdmin, editMode: this.isEditMode });

    if (this.isEditMode && this.editingProductId) {
      // Update existing product
      const productToUpdate = { ...product, id: this.editingProductId };
      console.log('Updating product:', productToUpdate);
      
      this.apiService.updateProduct(productToUpdate, userId, isAdmin).subscribe({
        next: (updatedProduct) => {
          console.log('Update response:', updatedProduct);
          if (updatedProduct) {
            this.notificationService.showSuccess('Product updated successfully!');
            // Navigate based on user type
            const redirectPath = isAdmin ? '/admin/dashboard' : '/user-dashboard';
            this.router.navigate([redirectPath]);
          } else {
            this.errorMessage = 'Error updating product - Permission denied or product not found';
            console.error('Update failed: null response');
          }
          this.isLoading = false;
        },
        error: (err: any) => {
          this.errorMessage = 'Error updating product';
          console.error('Update error:', err);
          this.isLoading = false;
        }
      });
    } else {
      // Add new product
      this.apiService.addProduct(product, userId).subscribe({
        next: () => {
          this.notificationService.showSuccess('Product added successfully!');
          // Navigate based on user type
          const redirectPath = isAdmin ? '/admin/dashboard' : '/user-dashboard';
          this.router.navigate([redirectPath]);
        },
        error: (err: any) => {
          this.errorMessage = 'Error adding product';
          console.error(err);
        }
      });
    }
    
    this.isLoading = false;
  }
}