import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { AdminAuthService } from '../../core/admin-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
  ]
})
export class AdminLoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private adminAuthService: AdminAuthService, private router: Router) {}

  async onSubmit() {
    if (await this.adminAuthService.login(this.email, this.password)) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.errorMessage = 'Invalid email or password';
    }
  }
}