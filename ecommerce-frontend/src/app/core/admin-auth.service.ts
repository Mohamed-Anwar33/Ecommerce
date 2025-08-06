import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private isAdminLoggedIn = false;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private http: HttpClient
  ) {
    this.initializeFromStorage();
  }

  private initializeFromStorage() {
    const storedAdminSession = localStorage.getItem('ecommerce_admin_session');
    if (storedAdminSession === 'true') {
      this.isAdminLoggedIn = true;
    }
  }

  private saveToStorage() {
    if (this.isAdminLoggedIn) {
      localStorage.setItem('ecommerce_admin_session', 'true');
    } else {
      localStorage.removeItem('ecommerce_admin_session');
    }
  }

  login(email: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.http.post<any>('http://localhost:5000/api/admin/login', {
        email,
        password
      }).subscribe({
        next: (res) => {
          if (res && res.token) {
            if (this.authService.isAuthenticated()) {
              this.authService.logout();
              this.notificationService.showInfo('User session ended. Admin logged in.');
            }
            this.isAdminLoggedIn = true;
            localStorage.setItem('ecommerce_admin_token', res.token);
            this.saveToStorage();
            this.notificationService.showSuccess('Admin login successful!');
            resolve(true);
          } else {
            this.notificationService.showError('Invalid admin credentials');
            resolve(false);
          }
        },
        error: (err) => {
          if (err.status === 401) {
            this.notificationService.showError('Invalid email or password');
          } else if (err.status === 400) {
            this.notificationService.showError('Please check your input data');
          } else {
            this.notificationService.showError('Admin login failed. Please try again.');
          }
          resolve(false);
        }
      });
    });
  }

  logout() {
    this.isAdminLoggedIn = false;
    this.saveToStorage();
  }

  isAdminAuthenticated(): boolean {
    return this.isAdminLoggedIn;
  }
}