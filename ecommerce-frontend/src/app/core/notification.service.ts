import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  showSuccess(message: string, duration: number = 5000) {
    this.addNotification(message, 'success', duration);
  }

  showError(message: string, duration: number = 5000) {
    this.addNotification(message, 'error', duration);
  }

  showWarning(message: string, duration: number = 5000) {
    this.addNotification(message, 'warning', duration);
  }

  showInfo(message: string, duration: number = 5000) {
    this.addNotification(message, 'info', duration);
  }

  private addNotification(message: string, type: Notification['type'], duration: number) {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: Notification = { id, message, type, duration };
    
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);

    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, duration);
    }
  }

  removeNotification(id: string) {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filteredNotifications);
  }

  clearAll() {
    this.notificationsSubject.next([]);
  }
}
