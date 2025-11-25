import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
   selector: 'app-user-sign-up',
   imports: [FormsModule, CommonModule],
   templateUrl: './user-sign-up.html',
   styleUrl: './user-sign-up.css',
})
export class UserSignUp {
   fullName: string = '';
   email: string = '';
   phone: string = '';
   password: string = '';
   confirmPassword: string = '';
   agreeTerms: boolean = false;
   errorMessage: string = '';
   successMessage: string = '';
   isLoading: boolean = false;

   constructor(
      private router: Router,
      private authService: AuthService
   ) { }

   signUp() {
      // Validation
      if (!this.fullName || !this.email || !this.phone || !this.password || !this.confirmPassword) {
         this.errorMessage = 'Please fill in all fields';
         return;
      }

      if (this.password !== this.confirmPassword) {
         this.errorMessage = 'Passwords do not match';
         return;
      }

      if (this.password.length < 6) {
         this.errorMessage = 'Password must be at least 6 characters';
         return;
      }

      if (!this.agreeTerms) {
         this.errorMessage = 'You must agree to the terms and conditions';
         return;
      }

      this.isLoading = true;
      this.errorMessage = '';

      // Simulate API delay
      setTimeout(() => {
         const result = this.authService.registerUser({
            fullName: this.fullName,
            email: this.email,
            phone: this.phone,
            password: this.password
         });

         if (result.success) {
            this.successMessage = 'Account created successfully! Redirecting to login...';
            setTimeout(() => {
               this.router.navigate(['/login']);
            }, 2000);
         } else {
            this.errorMessage = result.message || 'Registration failed. Please try again.';
         }

         this.isLoading = false;
      }, 500);
   }

   goToLogin() {
      this.router.navigate(['/login'])
   }
}
