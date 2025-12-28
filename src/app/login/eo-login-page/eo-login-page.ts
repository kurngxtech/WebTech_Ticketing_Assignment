import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { ChangePasswordModal } from '../../components/change-password-modal/change-password-modal';
import { User } from '../../auth/auth.types';

@Component({
  selector: 'app-eo-login-page',
  imports: [CommonModule, FormsModule, ChangePasswordModal],
  templateUrl: './eo-login-page.html',
  styleUrl: './eo-login-page.css',
})
export class EoLoginPage {
  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  // First login modal state
  showPasswordChangeModal = false;
  loggedInUser: User | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter username and password';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    const tempPassword = this.password;

    this.authService.loginAsync(this.username, tempPassword, 500).subscribe(
      (result) => {
        if (result.success && result.user) {
          // Clear password after successful login
          this.password = '';
          this.loggedInUser = result.user;

          // Check if first login - show password change modal
          if (result.user.isFirstLogin) {
            this.isLoading = false;
            this.showPasswordChangeModal = true;
            return;
          }

          this.navigateByRole(result.user.role);
        } else {
          this.errorMessage = result.message || 'Login failed. Please try again.';
          this.isLoading = false;
          // Keep password visible so user can edit and retry
        }
      },
      (err) => {
        this.errorMessage = 'Login failed. Please try again.';
        this.isLoading = false;
        // Keep password visible so user can edit and retry
      }
    );
  }

  navigateByRole(role: string): void {
    if (role === 'eo') {
      this.router.navigate(['/eo']);
    } else if (role === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/']);
    }
  }

  onPasswordChanged(): void {
    this.showPasswordChangeModal = false;
    if (this.loggedInUser) {
      this.navigateByRole(this.loggedInUser.role);
    }
  }

  clearError() {
    this.errorMessage = '';
  }
}
