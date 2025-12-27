import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { DataEventService } from '../../data-event-service/data-event.service';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-user-login-page',
  imports: [FormsModule, CommonModule],
  templateUrl: './user-login-page.html',
  styleUrl: './user-login-page.css',
})
export class UserLoginPage implements OnInit, OnDestroy {
  // View mode: 'login' or 'register'
  viewMode: 'login' | 'register' = 'login';

  // Login fields
  username: string = '';
  password: string = '';
  rememberMe: boolean = false;
  showLoginPassword: boolean = false;

  // Registration fields
  regFirstName: string = '';
  regLastName: string = '';
  regEmail: string = '';
  regPhone: string = '';
  regUsername: string = '';
  regPassword: string = '';
  regConfirmPassword: string = '';
  showRegPassword: boolean = false;
  showRegConfirmPassword: boolean = false;

  // Validation touched state
  touched = {
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    username: false,
    password: false,
    confirmPassword: false,
  };

  // Availability check state
  usernameAvailable: boolean | null = null;
  usernameCheckMessage: string = '';
  emailAvailable: boolean | null = null;
  emailCheckMessage: string = '';
  isCheckingUsername: boolean = false;
  isCheckingEmail: boolean = false;

  // Debounce subjects
  private usernameCheck$ = new Subject<string>();
  private emailCheck$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  // UI state
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private eventService: DataEventService
  ) {}

  ngOnInit() {
    // Auto-fill remembered credentials (only if localStorage is available)
    if (typeof localStorage !== 'undefined') {
      const rememberedUsername = localStorage.getItem('rememberedUsername');
      const rememberedPassword = localStorage.getItem('rememberedPassword');
      if (rememberedUsername) {
        this.username = rememberedUsername;
        this.rememberMe = true;
      }
      if (rememberedPassword) {
        this.password = atob(rememberedPassword); // Decode from base64
      }
    }

    // Setup debounced username availability check
    this.usernameCheck$
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((username) => {
        if (username && username.length >= 3) {
          this.isCheckingUsername = true;
          this.authService.checkUsernameAvailability(username).subscribe((result) => {
            this.usernameAvailable = result.available;
            this.usernameCheckMessage = result.message;
            this.isCheckingUsername = false;
          });
        } else {
          this.usernameAvailable = null;
          this.usernameCheckMessage = '';
        }
      });

    // Setup debounced email availability check
    this.emailCheck$
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && emailRegex.test(email)) {
          this.isCheckingEmail = true;
          this.authService.checkEmailAvailability(email).subscribe((result) => {
            this.emailAvailable = result.available;
            this.emailCheckMessage = result.message;
            this.isCheckingEmail = false;
          });
        } else {
          this.emailAvailable = null;
          this.emailCheckMessage = '';
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Trigger username check on input
  onUsernameInput() {
    this.usernameCheck$.next(this.regUsername);
  }

  // Trigger email check on input
  onEmailInput() {
    this.emailCheck$.next(this.regEmail);
  }

  toggleView(mode: 'login' | 'register') {
    this.viewMode = mode;
    this.clearMessages();
    this.resetTouched();
    // Reset availability state
    this.usernameAvailable = null;
    this.emailAvailable = null;
    this.usernameCheckMessage = '';
    this.emailCheckMessage = '';
    // Clear form fields when switching
    if (mode === 'login') {
      this.regFirstName = '';
      this.regLastName = '';
      this.regEmail = '';
      this.regPhone = '';
      this.regUsername = '';
      this.regPassword = '';
      this.regConfirmPassword = '';
    }
  }

  resetTouched() {
    this.touched = {
      firstName: false,
      lastName: false,
      email: false,
      phone: false,
      username: false,
      password: false,
      confirmPassword: false,
    };
  }

  markTouched(field: keyof typeof this.touched) {
    this.touched[field] = true;
  }

  // Validation getters
  get isFirstNameValid(): boolean {
    return this.regFirstName.trim().length >= 2;
  }

  get isLastNameValid(): boolean {
    return this.regLastName.trim().length >= 2;
  }

  get isEmailValid(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.regEmail);
  }

  get isPhoneValid(): boolean {
    // Phone is optional, but if provided must be valid
    if (!this.regPhone) return true;
    const phoneRegex = /^[0-9\-\+\(\)\s]{8,}$/;
    return phoneRegex.test(this.regPhone);
  }

  get isUsernameValid(): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(this.regUsername);
  }

  get isPasswordValid(): boolean {
    return this.regPassword.length >= 6;
  }

  get isConfirmPasswordValid(): boolean {
    return this.regConfirmPassword === this.regPassword && this.regConfirmPassword.length > 0;
  }

  get isFormValid(): boolean {
    return (
      this.isFirstNameValid &&
      this.isLastNameValid &&
      this.isEmailValid &&
      this.isPhoneValid &&
      this.isUsernameValid &&
      this.isPasswordValid &&
      this.isConfirmPasswordValid
    );
  }

  // Password visibility toggles
  toggleLoginPasswordVisibility() {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleRegPasswordVisibility() {
    this.showRegPassword = !this.showRegPassword;
  }

  toggleRegConfirmPasswordVisibility() {
    this.showRegConfirmPassword = !this.showRegConfirmPassword;
  }

  login() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter username and password';
      return;
    }

    this.isLoading = true;
    this.clearMessages();
    const tempPassword = this.password;

    this.authService.loginAsync(this.username, tempPassword, 500).subscribe(
      (result) => {
        this.isLoading = false; // Always reset loading state

        if (result.success && result.user) {
          // Handle remember me - save both username and password
          if (this.rememberMe && typeof localStorage !== 'undefined') {
            localStorage.setItem('rememberedUsername', this.username);
            localStorage.setItem('rememberedPassword', btoa(tempPassword)); // Encode to base64
          } else if (typeof localStorage !== 'undefined') {
            // Clear if not remembering
            localStorage.removeItem('rememberedUsername');
            localStorage.removeItem('rememberedPassword');
          }

          this.password = '';

          // Refresh event data from API to ensure sync (don't await)
          this.eventService.refreshEvents();

          // Navigate based on role - use setTimeout to ensure state is updated
          const role = result.user.role;
          setTimeout(() => {
            if (role === 'admin') {
              this.router.navigate(['/admin']);
            } else if (role === 'eo') {
              this.router.navigate(['/eo']);
            } else if (role === 'user') {
              this.router.navigate(['/']);
            }
          }, 100);
        } else {
          this.errorMessage = result.message || 'Login failed. Please try again.';
        }
      },
      (err) => {
        this.errorMessage = 'Login failed. Please try again.';
        this.isLoading = false;
      }
    );
  }

  register() {
    // Mark all fields as touched to show validation
    Object.keys(this.touched).forEach((key) => {
      this.touched[key as keyof typeof this.touched] = true;
    });

    // Validate form
    if (!this.isFormValid) {
      this.errorMessage = 'Please fix the validation errors below';
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const fullName = `${this.regFirstName.trim()} ${this.regLastName.trim()}`;

    this.authService
      .registerUserAsync({
        fullName: fullName,
        email: this.regEmail,
        phone: this.regPhone || '',
        password: this.regPassword,
        username: this.regUsername,
      })
      .subscribe(
        (result) => {
          if (result.success) {
            this.successMessage = 'Account created successfully! Redirecting...';
            this.isLoading = false;

            // Clear registration form
            this.regFirstName = '';
            this.regLastName = '';
            this.regEmail = '';
            this.regPhone = '';
            this.regUsername = '';
            this.regPassword = '';
            this.regConfirmPassword = '';
            this.resetTouched();

            // User is already logged in (authService stored the token)
            // Refresh event data and navigate to home
            this.eventService.refreshEvents();

            setTimeout(() => {
              this.router.navigate(['/']);
            }, 1500);
          } else {
            this.errorMessage = result.message || 'Registration failed. Please try again.';
            this.isLoading = false;
          }
        },
        (err) => {
          this.errorMessage = 'Registration failed. Please try again.';
          this.isLoading = false;
        }
      );
  }

  clearError() {
    this.errorMessage = '';
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
