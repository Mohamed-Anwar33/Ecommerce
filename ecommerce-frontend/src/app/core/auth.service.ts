import { Injectable } from '@angular/core';
import { NotificationService } from './notification.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  role: 'user' | 'admin';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isLoggedIn = false;
  private currentUser: User | null = null;
  private users: User[] = [];
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private notificationService: NotificationService, private http: HttpClient) {
    this.initializeFromStorage();
  }

  private initializeFromStorage() {
    const storedUsers = localStorage.getItem('ecommerce_users');
    if (storedUsers) {
      this.users = JSON.parse(storedUsers);
    }

    const storedUser = localStorage.getItem('ecommerce_currentUser');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
      this.isLoggedIn = true;
      this.currentUserSubject.next(this.currentUser);
    }
  }

  private saveToStorage() {
    localStorage.setItem('ecommerce_users', JSON.stringify(this.users));
    
    if (this.currentUser) {
      localStorage.setItem('ecommerce_currentUser', JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem('ecommerce_currentUser');
    }
  }

  login(email: string, password: string): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.http.post<any>('http://localhost:5000/api/auth/login', { email, password }).subscribe({
        next: (res) => {
          localStorage.setItem('ecommerce_token', res.token);
          localStorage.setItem('ecommerce_currentUser', JSON.stringify(res.user));
          this.isLoggedIn = true;
          this.currentUser = res.user;
          this.currentUserSubject.next(res.user);
          this.notificationService.showSuccess('Login successful!');
          observer.next(true);
          observer.complete();
        },
        error: (err) => {
          if (err.status === 403) {
            this.notificationService.showError('Please verify your email first! Check your inbox or spam folder.');
            const resend = confirm('Would you like to resend the verification email?');
            if (resend) {
              this.resendVerification(email).subscribe({
                next: () => {
                  this.notificationService.showSuccess('Verification email sent successfully! Check your email.');
                },
                error: (resendErr) => {
                  if (resendErr.status === 400 && resendErr.error?.message === 'Email is already verified') {
                    this.notificationService.showInfo('Email is already verified! Try logging in again.');
                  } else if (resendErr.status === 404) {
                    this.notificationService.showError('Email address not found.');
                  } else {
                    this.notificationService.showError('Failed to send verification email. Please try again.');
                  }
                }
              });
            }
          } else if (err.status === 401) {
            this.notificationService.showError('Invalid email or password!');
          } else {
            this.notificationService.showError('An error occurred during login.');
          }
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  signup(name: string, email: string, password: string): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.http.post<any>('http://localhost:5000/api/auth/signup', { name, email, password }).subscribe({
        next: (res) => {
          this.notificationService.showSuccess('Account created successfully! Please verify your email before logging in.');
          observer.next(true);
          observer.complete();
        },
        error: (err) => {
          if (err.status === 400 && err.error?.message === 'User already exists') {
            this.notificationService.showError('Email is already in use!');
          } else if (err.status === 400 && err.error?.errors) {
            this.notificationService.showError('Please check your input data.');
          } else {
            this.notificationService.showError('An error occurred while creating the account.');
          }
          observer.next(false);
          observer.complete();
        }
      });
    });
  }



  verifyEmail(token: string): Observable<any> {
    return this.http.get(`http://localhost:5000/api/auth/verify/${token}`);
  }
  resendVerification(email: string): Observable<any> {
    return this.http.post(`http://localhost:5000/api/auth/resend-verification`, { email });
  }

  logout() {
    this.isLoggedIn = false;
    this.currentUser = null;
    this.currentUserSubject.next(null);
    this.saveToStorage();
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  
  updateCurrentUserData(updatedUser: User): void {
    this.currentUser = updatedUser;
    this.currentUserSubject.next(updatedUser);
    
    
    localStorage.setItem('ecommerce_currentUser', JSON.stringify(updatedUser));
      
    
    const userIndex = this.users.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
      this.users[userIndex] = updatedUser;
      this.saveToStorage();
    }
    
    console.log('Current user data updated:', updatedUser);
  }

  getAllUsers(): User[] {
    return this.users;
  }

  deleteUser(userId: number): boolean {
    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.users.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }
}