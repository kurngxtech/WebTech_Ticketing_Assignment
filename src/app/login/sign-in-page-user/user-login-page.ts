import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
   selector: 'app-user-login-page',
   imports: [FormsModule, CommonModule],
   templateUrl: './user-login-page.html',
   styleUrl: './user-login-page.css',
})
export class UserLoginPage implements OnInit {
   username: string = '';
   password: string = '';
   rememberMe: boolean = false;
   errorMessage: string = '';
   isLoading: boolean = false;

   constructor(
      private router: Router,
      private authService: AuthService
   ) {}

   login() {
      if (!this.username || !this.password) {
         this.errorMessage = 'Please enter username and password';
         return;
      }

      this.isLoading = true;
      this.errorMessage = '';
      const tempPassword = this.password;
      // Use async AuthService helper that simulates network latency in dev
      this.authService.loginAsync(this.username, tempPassword, 500).subscribe(
         result => {
            if (result.success && result.user) {
               // Clear password after successful login
               this.password = '';
               
               // Store remember me preference (only if localStorage is available)
               if (this.rememberMe && typeof localStorage !== 'undefined') {
                  localStorage.setItem('rememberedUsername', this.username);
               }

               // Redirect based on user role
               const role = result.user.role;
               if (role === 'admin') {
                  this.router.navigate(['/admin']);
               } else if (role === 'eo') {
                  this.router.navigate(['/eo']);
               } else if (role === 'user') {
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

   goToHome() {
      this.router.navigate(['/']);
   }

   ngOnInit() {
      // Auto-fill remembered username (only if localStorage is available)
      if (typeof localStorage !== 'undefined') {
         const remembered = localStorage.getItem('rememberedUsername');
         if (remembered) {
            this.username = remembered;
            this.rememberMe = true;
         }
      }
   }
}
