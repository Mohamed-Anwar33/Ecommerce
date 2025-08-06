import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { User } from './auth.service';

export interface Product {
  id: number;
  _id?: string; 
  name: string;
  price: number;
  image: string;
  description: string;
  ownerId: number;
  owner?: string;
  imageFile?: File | string;
  category?: string;
  quantity?: number;
  createdAt?: string; 
  rating?: number; 
  originalPrice?: number; 
  stock?: number; 
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private products: Product[] = [];
  private nextProductId = 1;
  private imageCache = new Map<string, string>(); 
  
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor(private http: HttpClient) {}


  private initializeProducts() {
    try {
      const storedProducts = localStorage.getItem('ecommerce_products');
      const storedNextId = localStorage.getItem('ecommerce_next_product_id');
      
      if (storedProducts) {
        const parsedProducts = JSON.parse(storedProducts);
        this.products = parsedProducts;
        this.nextProductId = storedNextId ? parseInt(storedNextId) : this.getMaxProductId() + 1;
        console.log('Products loaded from localStorage:', this.products.length);
        console.log('Product images:', this.products.map(p => ({ id: p.id, name: p.name, image: p.image.substring(0, 60) + '...' })));
      } else {
        this.loadDefaultProducts();
      }
    } catch (error) {
      console.error('Error loading products from localStorage:', error);
      console.log('Clearing corrupted localStorage and loading defaults');
      this.clearStorageAndLoadDefaults();
    }
  }

  private loadDefaultProducts() {
    console.log('Loading fresh default products...');
    
    this.products = [
      { id: 1, name: 'Smartphone X', price: 560, image: 'https://images.unsplash.com/photo-1511707171634-5f897198f9a7?w=400&h=300&fit=crop&auto=format&q=80', description: 'High-end smartphone', ownerId: 0 },
      { id: 2, name: 'Laptop Pro', price: 1199, image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a0a1?w=400&h=300&fit=crop&auto=format&q=80', description: 'Powerful laptop', ownerId: 0 },
      { id: 3, name: 'Wireless Earbuds', price: 222, image: 'https://images.unsplash.com/photo-1590658006821-04f54d2a36ca?w=400&h=300&fit=crop&auto=format&q=80', description: 'True wireless audio', ownerId: 0 },
      { id: 4, name: 'Smart Watch', price: 672, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop&auto=format&q=80', description: 'Fitness tracker', ownerId: 0 },
      { id: 5, name: 'Gaming Console', price: 470, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&auto=format&q=80', description: 'Next-gen gaming', ownerId: 0 },
      { id: 6, name: 'Bluetooth Speaker', price: 792, image: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=400&h=300&fit=crop&auto=format&q=80', description: 'Portable speaker', ownerId: 0 },
      { id: 7, name: 'Tablet', price: 399, image: 'https://images.unsplash.com/photo-1542751110-97427bbabf20?w=400&h=300&fit=crop&auto=format&q=80', description: 'Lightweight tablet', ownerId: 0 },
      { id: 8, name: 'Camera', price: 899, image: 'https://images.unsplash.com/photo-1519638831568-d9897f97ed0e?w=400&h=300&fit=crop&auto=format&q=80', description: 'Professional camera', ownerId: 0 },
      { id: 9, name: 'Headphones', price: 299, image: 'https://images.unsplash.com/photo-1505740106531-4243f3831145?w=400&h=300&fit=crop&auto=format&q=80', description: 'Noise-cancelling headphones', ownerId: 0 },
      { id: 10, name: 'Smart TV', price: 1299, image: 'https://images.unsplash.com/photo-1593784991095-2c792f337d4e?w=400&h=300&fit=crop&auto=format&q=80', description: '4K smart TV', ownerId: 0 }
    ];
    this.nextProductId = 11;
    this.productsSubject.next([...this.products]);
    console.log('Default products loaded with unique images:', this.products.map(p => ({ id: p.id, name: p.name, image: p.image.substring(0, 50) + '...' })));
  }

  private clearStorageAndLoadDefaults() {
    try {
      localStorage.removeItem('ecommerce_products');
      localStorage.removeItem('ecommerce_next_product_id');
      console.log('localStorage cleared');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    this.loadDefaultProducts();
  }

  clearAllData() {
    this.clearStorageAndLoadDefaults();
    this.imageCache.clear();
    return this.getProducts();
  }

  private saveProductsToStorage() {
    try {
      localStorage.setItem('ecommerce_products', JSON.stringify(this.products));
      localStorage.setItem('ecommerce_next_product_id', this.nextProductId.toString());
    } catch (error) {
      console.error('Error saving products to localStorage:', error);
    }
  }

  fixImageData() {
    try {
      localStorage.removeItem('ecommerce_products');
      localStorage.removeItem('ecommerce_next_product_id');
      console.log('Cleared corrupted localStorage');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    
    this.loadDefaultProducts();
    this.productsSubject.next([...this.products]);
    return this.products$;
  }
  forceRefreshData() {
    console.log('Forcing data refresh with new unique images...');
    this.clearStorageAndLoadDefaults();
    this.imageCache.clear();
    this.productsSubject.next([...this.products]);
    return this.products$;
  }

  private getMaxProductId(): number {
    return this.products.length > 0 ? Math.max(...this.products.map(p => p.id)) : 0;
  }



  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('http://localhost:5000/api/products');
  }
  
  getProductsStream(): Observable<Product[]> {
    return this.products$;
  }

  getUserProducts(): Observable<Product[]> {
    console.log('==> getUserProducts called');
    const token = localStorage.getItem('ecommerce_token');
    console.log('Token found:', token ? 'Yes' : 'No');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get<Product[]>('http://localhost:5000/api/products/my-products', { headers })
      .pipe(
        tap(products => console.log('getUserProducts response:', products)),
        catchError(error => {
          console.error('getUserProducts error:', error);
          return of([]);
        })
      );
  }

  addProduct(product: Partial<Product>, ownerId: number): Observable<Product> {
    const formData = new FormData();
    formData.append('name', product.name || '');
    formData.append('price', (product.price || 0).toString());
    formData.append('description', product.description || '');
    formData.append('category', (product as any).category || '');
    formData.append('quantity', (product as any).quantity?.toString() || '1');
    if (product.imageFile instanceof File) {
      formData.append('image', product.imageFile);
    } else if (typeof product.imageFile === 'string' && product.imageFile.startsWith('data:')) {
      const arr = product.imageFile.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new File([u8arr], 'product-image.png', {type:mime});
      formData.append('image', file);
    }
    return new Observable(observer => {
      this.http.post<Product>('http://localhost:5000/api/products', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ecommerce_token')}` }
      }).subscribe({
        next: (createdProduct) => {
          this.products.push(createdProduct);
          this.saveProductsToStorage();
          this.productsSubject.next([...this.products]);
          observer.next(createdProduct);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }


  updateProduct(product: Product, userId: number, isAdmin: boolean = false): Observable<Product | null> {
    console.log('==> updateProduct called with:', { product, userId, isAdmin });
    
    if (isAdmin) {
      const adminToken = localStorage.getItem('ecommerce_admin_token');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${adminToken}`
      });
      const formData = new FormData();
      if (product.name) formData.append('name', product.name);
      if (product.price) formData.append('price', product.price.toString());
      if (product.description) formData.append('description', product.description);
      if (product.quantity) formData.append('quantity', product.quantity.toString());
      if (product.category) formData.append('category', product.category);
      if (product.imageFile && product.imageFile instanceof File) {
        formData.append('image', product.imageFile, product.imageFile.name);
      }
      return this.http.put<any>(`http://localhost:5000/api/products/admin/${product.id}`, formData, { headers })
        .pipe(
          tap(response => {
            console.log('Product updated successfully:', response);
            const index = this.products.findIndex(p => p.id === product.id);
            if (index !== -1) {
              this.products[index] = { ...this.products[index], ...response.product };
              this.productsSubject.next([...this.products]);
            }
          }),
          catchError((error: any) => {
            console.error('Error updating product:', error);
            return of(null);
          }),
          map(response => response ? response.product : null)
        );
    }
    
    const formData = new FormData();
    if (product.name) formData.append('name', product.name);
    if (product.price) formData.append('price', product.price.toString());
    if (product.description) formData.append('description', product.description);
    if (product.quantity) formData.append('quantity', product.quantity.toString());
    if (product.category) formData.append('category', product.category);
    
    if (product.imageFile && product.imageFile instanceof File) {
      formData.append('image', product.imageFile, product.imageFile.name);
    }
    
    const token = localStorage.getItem('ecommerce_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.put<any>(`http://localhost:5000/api/products/${product.id}`, formData, { headers })
      .pipe(
        tap(response => {
          console.log('Product updated successfully:', response);
          const index = this.products.findIndex(p => p.id === product.id);
          if (index !== -1) {
            this.products[index] = { ...this.products[index], ...response.product };
            this.productsSubject.next([...this.products]);
          }
        }),
        catchError((error: any) => {
          console.error('Error updating product:', error);
          // Return null to indicate failure
          return of(null);
        }),
        map(response => response ? response.product : null)
      );
  }

  getAllUsersFromBackend(adminToken: string): Observable<User[]> {
    return this.http.get<User[]>('http://localhost:5000/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }
  adminGetAllProducts(adminToken: string): Observable<Product[]> {
    return this.http.get<Product[]>('http://localhost:5000/api/products/admin/all', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }
  adminUpdateProduct(productId: string, productData: FormData, adminToken: string): Observable<any> {
    return this.http.put('http://localhost:5000/api/products/admin/' + productId, productData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  adminDeleteProduct(productId: string, adminToken: string): Observable<any> {
    return this.http.delete('http://localhost:5000/api/products/admin/' + productId, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  createUserFromBackend(userData: any, adminToken: string) {
    return this.http.post<any>('http://localhost:5000/api/admin/users', userData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }
  deleteUserFromBackend(userId: number, adminToken: string) {
    return this.http.delete<any>(`http://localhost:5000/api/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  updateUserFromBackend(userId: number, userData: any, adminToken: string) {
    return this.http.put<any>(`http://localhost:5000/api/admin/users/${userId}`, userData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  deleteProduct(id: number, userId: number, isAdmin: boolean = false): Observable<{ success: boolean }> {
    console.log('==> deleteProduct called with:', { id, userId, isAdmin });
    
    const token = localStorage.getItem('ecommerce_token') || localStorage.getItem('ecommerce_admin_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.delete<any>(`http://localhost:5000/api/products/${id}`, { headers })
      .pipe(
        tap(response => {
          console.log('Product deleted successfully:', response);
          const productIndex = this.products.findIndex(p => p.id === id);
          if (productIndex !== -1) {
            this.products.splice(productIndex, 1);
            this.productsSubject.next([...this.products]);
          }
        }),
        map(() => ({ success: true })),
        catchError((error: any) => {
          console.error('Error deleting product:', error);
          return of({ success: false });
        })
      );
  }
}