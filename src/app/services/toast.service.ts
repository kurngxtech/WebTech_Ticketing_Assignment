import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts: Toast[] = [];
  private toastsSubject = new BehaviorSubject<Toast[]>([]);

  get toasts$(): Observable<Toast[]> {
    return this.toastsSubject.asObservable();
  }

  show(message: string, type: Toast['type'] = 'info', duration = 4000): void {
    const id = `toast_${Date.now()}`;
    const toast: Toast = { id, message, type, duration };

    // Use setTimeout to defer the toast update beyond the current change detection cycle
    // This prevents NG0100 ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.toasts.push(toast);
      this.toastsSubject.next([...this.toasts]);

      if (duration > 0) {
        setTimeout(() => this.dismiss(id), duration);
      }
    }, 0);
  }

  success(message: string, duration = 4000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration = 4000): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration = 4000): void {
    this.show(message, 'info', duration);
  }

  dismiss(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.toastsSubject.next([...this.toasts]);
  }

  clear(): void {
    this.toasts = [];
    this.toastsSubject.next([]);
  }
}
