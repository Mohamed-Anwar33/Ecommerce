import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ApiService } from '../../../core/api.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
  ]
})
export class EditProductComponent implements OnInit {
  productId: number | null = null;
  name = '';
  price = 0;
  image = '';
  description = '';
  errorMessage = '';

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    this.apiService.getProducts().subscribe({
      next: (products: any[]) => {
        const product = products.find((p: any) => p.id === this.productId);
        if (product) {
          this.name = product.name;
          this.price = product.price;
          this.image = product.image;
          this.description = product.description;
        } else {
          this.errorMessage = 'Product not found';
        }
      },
      error: (err: any) => {
        this.errorMessage = 'Error fetching product';
        console.error(err);
      }
    });
  }

  onSubmit() {
    if (!this.name || !this.price || !this.description || !this.productId) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }
    const updatedProduct = {
      id: this.productId,
      name: this.name,
      price: this.price,
      image: this.image || 'https://via.placeholder.com/150',
      description: this.description,
      ownerId: 0
    };
    this.apiService.updateProduct(updatedProduct, 0, true).subscribe({
      next: () => {
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err: any) => {
        this.errorMessage = 'Error updating product';
        console.error(err);
      }
    });
  }
}