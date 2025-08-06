import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AdminAuthService } from './admin-auth.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private adminAuthService: AdminAuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated() || this.adminAuthService.isAdminAuthenticated()) {
      return true;
    }
    
    this.notificationService.showWarning('You must be logged in to access this page');
    this.router.navigate(['/login']);
    return false;
  }
}