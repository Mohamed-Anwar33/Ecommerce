import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/notification.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
  ]
})
export class UserLoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Check for 'verify' param in URL
    this.route.queryParams.subscribe(params => {
      const verifyToken = params['verify'];
      if (verifyToken) {
        // Send verification request to backend
        this.authService.verifyEmail(verifyToken).subscribe({
          next: (response) => {
            this.notificationService.showSuccess('Email verified successfully! You can now login.');
            
            // Update current user data if logged in
            const currentUser = this.authService.getCurrentUser();
            if (currentUser && currentUser.email === response.user.email) {
              // Update the current user's verification status
              this.authService.updateCurrentUserData({
                ...currentUser,
                isEmailVerified: true
              });
              console.log('User verification status updated in frontend');
            }
          },
          error: () => {
            this.notificationService.showError('Invalid or expired verification link.');
          }
        });
      }
    });
  }

  onSubmit() {
    this.authService.login(this.email, this.password).subscribe(success => {
      if (success) {
        this.router.navigate(['/products']);
      }
      // الرسائل تظهر تلقائياً من الـ AuthService
    });
  }
}