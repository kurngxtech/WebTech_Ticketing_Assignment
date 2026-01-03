/**
 * Change Password Modal Component
 * Displayed when user needs to change password (e.g., first login)
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { SvgIcon } from '../svg-icon/svg-icon';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgIcon],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-container">
        <div class="modal-header">
          <h3>
            <app-svg-icon name="lock" [size]="24" color="#ffd700"></app-svg-icon> Change Your
            Password
          </h3>
          <p class="subtitle">For your security, please change your temporary password</p>
        </div>

        <div class="modal-body">
          @if (errorMessage) {
          <div class="alert alert-error">
            <app-svg-icon name="warning" [size]="16" color="#ff6b6b"></app-svg-icon>
            {{ errorMessage }}
          </div>
          } @if (successMessage) {
          <div class="alert alert-success">
            <app-svg-icon name="check-circle" [size]="16" color="#22c55e"></app-svg-icon>
            {{ successMessage }}
          </div>
          }

          <form (ngSubmit)="changePassword()">
            <div class="form-group">
              <label for="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                [(ngModel)]="currentPassword"
                name="currentPassword"
                [disabled]="isLoading"
                placeholder="Enter your temporary password"
                required
              />
            </div>

            <div class="form-group">
              <label for="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                [(ngModel)]="newPassword"
                name="newPassword"
                [disabled]="isLoading"
                placeholder="At least 6 characters"
                required
                minlength="6"
              />
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                [disabled]="isLoading"
                placeholder="Re-enter new password"
                required
              />
            </div>

            <button type="submit" class="btn-primary" [disabled]="isLoading || !isFormValid()">
              @if (isLoading) {
              <span>Changing Password...</span>
              } @else {
              <span>Change Password</span>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .modal-container {
        background: #1e1e1e;
        border-radius: 16px;
        padding: 32px;
        width: 90%;
        max-width: 420px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid #333;
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .modal-header {
        text-align: center;
        margin-bottom: 24px;
      }

      .modal-header h3 {
        color: #ffd700;
        margin: 0 0 8px 0;
        font-size: 1.5rem;
      }

      .modal-header .subtitle {
        color: #888;
        margin: 0;
        font-size: 0.9rem;
      }

      .modal-body {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .alert {
        padding: 12px 16px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.9rem;
      }

      .alert-error {
        background: rgba(255, 68, 68, 0.15);
        border: 1px solid rgba(255, 68, 68, 0.3);
        color: #ff6b6b;
      }

      .alert-success {
        background: rgba(34, 197, 94, 0.15);
        border: 1px solid rgba(34, 197, 94, 0.3);
        color: #22c55e;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .form-group label {
        color: #ccc;
        font-size: 0.85rem;
        font-weight: 500;
      }

      .form-group input {
        background: #2d2d2d;
        border: 1px solid #444;
        border-radius: 8px;
        padding: 12px 14px;
        color: #fff;
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      .form-group input:focus {
        outline: none;
        border-color: #ffd700;
        box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.15);
      }

      .form-group input::placeholder {
        color: #666;
      }

      .btn-primary {
        background: linear-gradient(135deg, #ffd700 0%, #f5c400 100%);
        color: #000;
        border: none;
        border-radius: 8px;
        padding: 14px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        margin-top: 8px;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
})
export class ChangePasswordModal {
  @Input() userId: string = '';
  @Output() passwordChanged = new EventEmitter<void>();

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService) {}

  isFormValid(): boolean {
    return (
      this.currentPassword.length > 0 &&
      this.newPassword.length >= 6 &&
      this.newPassword === this.confirmPassword
    );
  }

  onOverlayClick(event: MouseEvent): void {
    // Prevent closing modal by clicking outside - user must change password
    event.stopPropagation();
  }

  changePassword(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    if (this.newPassword === this.currentPassword) {
      this.errorMessage = 'New password must be different from current password';
      return;
    }

    this.isLoading = true;

    this.authService
      .changePasswordAsync(this.userId, this.currentPassword, this.newPassword)
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.successMessage = 'Password changed successfully! Redirecting...';
            setTimeout(() => {
              this.passwordChanged.emit();
            }, 1500);
          } else {
            this.errorMessage = result.message || 'Failed to change password';
            this.isLoading = false;
          }
        },
        error: () => {
          this.errorMessage = 'Failed to change password. Please try again.';
          this.isLoading = false;
        },
      });
  }
}
