import { Routes } from '@angular/router';
import { HomeComponent } from './features/public/home.component';
import { ProductsComponent } from './features/public/products.component';
import { UserLoginComponent } from './features/public/user-login.component';
import { SignUpComponent } from './features/public/sign-up.component';

import { AddUserProductComponent } from './features/public/add-user-product.component';
import { AdminLoginComponent } from './features/admin/admin-login.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import { AddProductComponent } from './features/admin/add-product.component';
import { EditProductComponent } from './features/admin/edit-product/edit-product.component';
import { CartComponent } from './features/public/cart/cart.component';
import { UserDashboardComponent } from './features/public/user-dashboard.component';
import { AdminGuard } from './core/admin.guard';
import { AuthGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'products', component: ProductsComponent, canActivate: [AuthGuard] },
  { path: 'login', component: UserLoginComponent },
  { path: 'signup', component: SignUpComponent },

  { path: 'add-product', component: AddProductComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: UserDashboardComponent, canActivate: [AuthGuard] },
  { path: 'user-dashboard', component: UserDashboardComponent, canActivate: [AuthGuard] },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard] },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'admin/add-product', component: AddProductComponent, canActivate: [AdminGuard] },
  { path: 'admin/edit-product/:id', component: EditProductComponent, canActivate: [AdminGuard] }
];