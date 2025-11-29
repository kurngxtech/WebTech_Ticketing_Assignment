import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-eo-login-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './eo-login-page.html',
  styleUrl: './eo-login-page.css',
})
export class EoLoginPage {
  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';

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
      result => {
        if (result.success && result.user) {
          // Clear password after successful login
          this.password = '';
          
          const role = result.user.role;
          if (role === 'eo') {
            this.router.navigate(['/eo']);
          } else if (role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/']);
          }
        } else {
          this.errorMessage = result.message || 'Login failed. Please try again.';
          this.isLoading = false;
          // Keep password visible so user can edit and retry
        }
      },
      err => {
        this.errorMessage = 'Login failed. Please try again.';
        this.isLoading = false;
        // Keep password visible so user can edit and retry
      }
    );
  }

  clearError() {
    this.errorMessage = '';
  }
}
