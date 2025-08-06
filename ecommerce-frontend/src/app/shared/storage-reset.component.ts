import { Component } from '@angular/core';
import { ApiService } from '../core/api.service';
import { NotificationService } from '../core/notification.service';

@Component({
  selector: 'app-storage-reset',
  standalone: true,
  template: `
    <div class="storage-reset-container">
      <button 
        class="btn btn-warning" 
        (click)="clearStorage()"
        [disabled]="isClearing">
        {{ isClearing ? 'Clearing...' : 'Clear Storage & Reset Data' }}
      </button>
      <p class="text-muted mt-2">
        Use this if you're experiencing storage quota errors or corrupted data
      </p>
    </div>
  `,
  styles: [`
    .storage-reset-container {
      padding: 1rem;
      border: 2px dashed #ffc107;
      border-radius: 8px;
      background-color: #fff3cd;
      margin: 1rem 0;
      text-align: center;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 500;
    }
    
    .btn-warning {
      background-color: #ffc107;
      color: #212529;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .text-muted {
      color: #6c757d;
      font-size: 0.875rem;
      margin: 0;
    }
  `]
})
export class StorageResetComponent {
  isClearing = false;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  clearStorage() {
    this.isClearing = true;
    
    try {
      this.apiService.clearAllData().subscribe({
        next: (products) => {
          this.notificationService.showSuccess('Storage cleared and data reset successfully!');
          console.log('Storage reset complete, products loaded:', products.length);
          this.isClearing = false;
          
          // Refresh the page to ensure clean state
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        },
        error: (error) => {
          console.error('Error clearing storage:', error);
          this.notificationService.showError('Error clearing storage');
          this.isClearing = false;
        }
      });
    } catch (error) {
      console.error('Error in clearStorage:', error);
      this.notificationService.showError('Error clearing storage');
      this.isClearing = false;
    }
  }
}
