import { Component } from '@angular/core';
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
export class UserLoginPage {
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

      // Simulate API delay
      setTimeout(() => {
         const result = this.authService.login(this.username, this.password);

         if (result.success && result.user) {
            // Store remember me preference
            if (this.rememberMe) {
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
         }

         this.isLoading = false;
      }, 500);
   }

   goToSignUp() {
      this.router.navigate(['/sign-up']);
   }

   ngOnInit() {
      // Auto-fill remembered username
      const remembered = localStorage.getItem('rememberedUsername');
      if (remembered) {
         this.username = remembered;
         this.rememberMe = true;
      }
   }
}
