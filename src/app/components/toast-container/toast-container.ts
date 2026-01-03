import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { Subscription } from 'rxjs';
import { SvgIcon } from '../svg-icon/svg-icon';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, SvgIcon],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toasts; trackBy: trackById"
        class="toast"
        [ngClass]="'toast-' + toast.type"
        (click)="dismiss(toast.id)"
      >
        <div class="toast-icon">
          <app-svg-icon
            *ngIf="toast.type === 'success'"
            name="check"
            [size]="18"
            color="currentColor"
          ></app-svg-icon>
          <app-svg-icon
            *ngIf="toast.type === 'error'"
            name="close"
            [size]="18"
            color="currentColor"
          ></app-svg-icon>
          <app-svg-icon
            *ngIf="toast.type === 'warning'"
            name="warning"
            [size]="18"
            color="currentColor"
          ></app-svg-icon>
          <app-svg-icon
            *ngIf="toast.type === 'info'"
            name="info"
            [size]="18"
            color="currentColor"
          ></app-svg-icon>
        </div>
        <div class="toast-message">{{ toast.message }}</div>
        <button class="toast-close" (click)="dismiss(toast.id); $event.stopPropagation()">×</button>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
        min-width: 280px;
      }

      .toast {
        display: flex;
        align-items: center;
        padding: 14px 16px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        animation: slideIn 0.3s ease-out;
        transition: transform 0.2s, opacity 0.2s;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .toast:hover {
        transform: translateX(-4px);
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .toast-success {
        background: #059669;
        color: #ffffff;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .toast-error {
        background: #dc2626;
        color: #ffffff;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .toast-warning {
        background: #d97706;
        color: #ffffff;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .toast-info {
        background: #2563eb;
        color: #ffffff;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .toast-icon {
        font-size: 18px;
        margin-right: 12px;
        font-weight: bold;
      }

      .toast-message {
        flex: 1;
        font-size: 14px;
        line-height: 1.4;
        font-weight: 600;
      }

      .toast-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 20px;
        cursor: pointer;
        opacity: 0.8;
        padding: 0 4px;
        margin-left: 8px;
        font-weight: bold;
      }

      .toast-close:hover {
        opacity: 1;
      }
    `,
  ],
})
export class ToastContainer implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription?: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription = this.toastService.toasts$.subscribe((toasts) => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  trackById(index: number, toast: Toast): string {
    return toast.id;
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
