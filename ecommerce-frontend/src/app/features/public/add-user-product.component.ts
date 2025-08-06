import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ApiService, Product } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-add-user-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-user-product.component.html',
  styleUrls: ['./add-user-product.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('0.8s ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ]),
  ]
})
export class AddUserProductComponent {
  product = {
    name: '',
    description: '',
    price: 0,
    image: '',
    imageFile: undefined as File | undefined
  };
  
  imagePreview: string | null = null;
  isLoading = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.showError('Image size should be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        this.notificationService.showError('Please select a valid image file');
        return;
      }
      
      this.product.imageFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(event: Event) {
    event.stopPropagation();
    this.product.imageFile = undefined;
    this.imagePreview = null;
    this.product.image = '';
  }

  onSubmit() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.notificationService.showError('You must be logged in to add a product');
      return;
    }

    this.isLoading = true;

    // Create product object
    const productData: Partial<Product> = {
      name: this.product.name,
      description: this.product.description,
      price: this.product.price,
      imageFile: this.product.imageFile
    };

    this.apiService.addProduct(productData, currentUser.id).subscribe({
      next: (newProduct) => {
        this.notificationService.showSuccess('Product added successfully!');
        this.router.navigate(['/products']);
      },
      error: (err) => {
        console.error('Error adding product:', err);
        this.notificationService.showError('Error adding product');
        this.isLoading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/products']);
  }
}
