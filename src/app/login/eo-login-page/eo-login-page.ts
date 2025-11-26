import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-eo-login-page',
  imports: [CommonModule],
  templateUrl: './eo-login-page.html',
  styleUrl: './eo-login-page.css',
})
export class EoLoginPage {
  isLoading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  login(username: string, password: string) {
    if (!username || !password) {
      this.errorMessage = 'Please enter username and password';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.loginAsync(username, password, 500).subscribe(result => {
      if (result.success && result.user) {
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
      }
      this.isLoading = false;
    }, err => {
      this.errorMessage = 'Login failed. Please try again.';
      this.isLoading = false;
    });
  }
}
