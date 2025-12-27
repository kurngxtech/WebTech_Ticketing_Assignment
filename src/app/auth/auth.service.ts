import { BehaviorSubject, Observable, of, map, catchError, tap } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User, AuthState, UserRole } from './auth.types';
import { environment } from '../../environments/environment';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authState = new BehaviorSubject<AuthState>({
    currentUser: null,
    isAuthenticated: false,
  });

  public authState$: Observable<AuthState> = this.authState.asObservable();

  // Inject PLATFORM_ID and determine if running in browser
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Mock users database (moved to dev-only file when environment.useMocks === true)
  private mockUsers: User[] = [];

  // Try to load dev mock users if configured
  private static loadDevMocks(): User[] {
    if (!environment || !environment.useMocks) return [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      // tslint:disable-next-line:no-var-requires
      // @ts-ignore
      const mock = require('../mock/mock-users');
      return mock && mock.MOCK_USERS ? mock.MOCK_USERS : [];
    } catch (e) {
      return [];
    }
  }

  constructor() {
    // PENTING: Hanya panggil restoreAuthState() jika berada di browser
    if (this.isBrowser) {
      this.restoreAuthState();
    }
  }

  // Initialize mock users after construction to avoid require at module-eval time in some build setups
  ngOnInit?(): void {
    // noop - placeholder if needed
  }

  private ensureMockLoaded() {
    if (this.mockUsers.length === 0 && environment.useMocks) {
      this.mockUsers = AuthService.loadDevMocks();
    }
  }

  login(username: string, password: string): { success: boolean; message: string; user?: User } {
    this.ensureMockLoaded();
    const user = this.mockUsers.find(
      (u) => (u.username === username || u.email === username) && u.password === password
    );

    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }

    const authData: AuthState = {
      currentUser: { ...user },
      isAuthenticated: true,
      token: `token_${user.id}_${Date.now()}`,
    };

    this.authState.next(authData);
    this.persistAuthState(authData);
    return { success: true, message: 'Login successful', user };
  }

  // Async helpers that simulate network latency when using dev mocks. Use these from components
  // if you want Observable-based flows instead of synchronous returns.
  loginAsync(
    username: string,
    password: string,
    ms = 300
  ): Observable<{ success: boolean; message: string; user?: User }> {
    // Use real API when mocks are disabled
    if (!environment.useMocks) {
      return this.http
        .post<{ success: boolean; message: string; token?: string; user?: User }>(
          `${this.apiUrl}/auth/login`,
          { username, password }
        )
        .pipe(
          tap((response) => {
            if (response.success && response.user && response.token) {
              const authData: AuthState = {
                currentUser: response.user,
                isAuthenticated: true,
                token: response.token,
              };
              // IMPORTANT: Persist to localStorage FIRST so interceptor has the token
              // before subscribers are notified and make API calls
              this.persistAuthState(authData);
              this.authState.next(authData);
            }
          }),
          catchError((error) => {
            console.error('Login error:', error);
            return of({
              success: false,
              message: error.error?.message || 'Login failed. Please try again.',
            });
          })
        );
    }

    // Mock mode
    const result = this.login(username, password);
    return of(result).pipe(delay(ms));
  }

  registerEventOrganizer(data: {
    fullName: string;
    email: string;
    phone: string;
    organizationName: string;
  }): { success: boolean; message: string; user?: User } {
    // Check if email already exists
    if (this.mockUsers.find((u) => u.email === data.email)) {
      return { success: false, message: 'Email already registered' };
    }

    const username = data.email.split('@')[0];
    const defaultPassword = `TempPass_${Math.random().toString(36).substring(7)}`;

    const newUser: User = {
      id: `eo_${Date.now()}`,
      username,
      email: data.email,
      password: defaultPassword,
      role: 'eo',
      fullName: data.fullName,
      phone: data.phone,
      organizationName: data.organizationName,
      createdAt: new Date().toISOString(),
    };

    this.mockUsers.push(newUser);

    // In real app, send email here
    // Welcome email sent to ${data.email}

    return { success: true, message: 'Event organizer registered successfully', user: newUser };
  }

  registerEventOrganizerAsync(
    data: { fullName: string; email: string; phone: string; organizationName: string },
    ms = 300
  ): Observable<{ success: boolean; message: string; user?: User }> {
    // Use real API when mocks are disabled
    if (!environment.useMocks) {
      const username = data.email.split('@')[0];
      const password = `TempPass_${Math.random().toString(36).substring(7)}`;

      return this.http
        .post<{ success: boolean; message: string; user?: User }>(
          `${this.apiUrl}/auth/register-eo`,
          { ...data, username, password }
        )
        .pipe(
          catchError((error) => {
            console.error('Register EO error:', error);
            return of({
              success: false,
              message: error.error?.message || 'Registration failed. Please try again.',
            });
          })
        );
    }

    const result = this.registerEventOrganizer(data);
    return of(result).pipe(delay(ms));
  }

  registerUser(data: { fullName: string; email: string; phone: string; password: string }): {
    success: boolean;
    message: string;
    user?: User;
  } {
    // Check if email already exists
    if (this.mockUsers.find((u) => u.email === data.email)) {
      return { success: false, message: 'Email already registered' };
    }

    const username = data.email.split('@')[0];
    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      email: data.email,
      password: data.password,
      role: 'user',
      fullName: data.fullName,
      phone: data.phone,
      createdAt: new Date().toISOString(),
    };

    this.mockUsers.push(newUser);
    return { success: true, message: 'User registered successfully', user: newUser };
  }

  registerUserAsync(
    data: { fullName: string; email: string; phone: string; password: string; username?: string },
    ms = 300
  ): Observable<{ success: boolean; message: string; user?: User }> {
    // Use real API when mocks are disabled
    if (!environment.useMocks) {
      return this.http
        .post<{ success: boolean; message: string; token?: string; user?: User }>(
          `${this.apiUrl}/auth/register`,
          data
        )
        .pipe(
          tap((response) => {
            if (response.success && response.user && response.token) {
              const authData: AuthState = {
                currentUser: response.user,
                isAuthenticated: true,
                token: response.token,
              };
              // IMPORTANT: Persist to localStorage FIRST so interceptor has the token
              // before subscribers are notified and make API calls
              this.persistAuthState(authData);
              this.authState.next(authData);
            }
          }),
          catchError((error) => {
            console.error('Register user error:', error);
            return of({
              success: false,
              message: error.error?.message || 'Registration failed. Please try again.',
            });
          })
        );
    }

    const result = this.registerUser(data);
    return of(result).pipe(delay(ms));
  }

  logout(): void {
    this.authState.next({
      currentUser: null,
      isAuthenticated: false,
    });
    this.clearAuthState();
  }

  getCurrentUser(): User | null {
    return this.authState.value.currentUser || null;
  }

  getAllUsers(): User[] {
    this.ensureMockLoaded();
    return [...this.mockUsers];
  }

  // Async version that fetches from API
  getAllUsersAsync(): Observable<User[]> {
    if (!environment.useMocks) {
      return this.http.get<{ success: boolean; users: User[] }>(`${this.apiUrl}/users`).pipe(
        map((response) => response.users || []),
        catchError((error) => {
          console.error('Get users error:', error);
          return of([]);
        })
      );
    }
    this.ensureMockLoaded();
    return of([...this.mockUsers]);
  }

  getEventOrganizersAsync(): Observable<User[]> {
    if (!environment.useMocks) {
      return this.http
        .get<{ success: boolean; eventOrganizers: User[] }>(`${this.apiUrl}/users/eos`)
        .pipe(
          map((response) => response.eventOrganizers || []),
          catchError((error) => {
            console.error('Get EOs error:', error);
            return of([]);
          })
        );
    }
    this.ensureMockLoaded();
    return of(this.mockUsers.filter((u) => u.role === 'eo'));
  }

  // Check if username is available (real-time validation)
  checkUsernameAvailability(username: string): Observable<{ available: boolean; message: string }> {
    if (!username || username.length < 3) {
      return of({ available: false, message: 'Username must be at least 3 characters' });
    }

    if (!environment.useMocks) {
      return this.http
        .get<{ available: boolean; message: string }>(
          `${this.apiUrl}/auth/check-username/${encodeURIComponent(username)}`
        )
        .pipe(
          catchError((error) => {
            console.error('Check username error:', error);
            return of({ available: true, message: '' }); // Assume available on error
          })
        );
    }

    // Mock mode - check local users
    this.ensureMockLoaded();
    const exists = this.mockUsers.some((u) => u.username?.toLowerCase() === username.toLowerCase());
    return of({
      available: !exists,
      message: exists ? 'Username is already taken' : 'Username is available',
    });
  }

  // Check if email is available (real-time validation)
  checkEmailAvailability(email: string): Observable<{ available: boolean; message: string }> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return of({ available: false, message: 'Invalid email format' });
    }

    if (!environment.useMocks) {
      return this.http
        .get<{ available: boolean; message: string }>(
          `${this.apiUrl}/auth/check-email/${encodeURIComponent(email)}`
        )
        .pipe(
          catchError((error) => {
            console.error('Check email error:', error);
            return of({ available: true, message: '' }); // Assume available on error
          })
        );
    }

    // Mock mode - check local users
    this.ensureMockLoaded();
    const exists = this.mockUsers.some((u) => u.email?.toLowerCase() === email.toLowerCase());
    return of({
      available: !exists,
      message: exists ? 'Email is already registered' : 'Email is available',
    });
  }

  isAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }

  hasRole(role: UserRole): boolean {
    return this.authState.value.currentUser?.role === role;
  }

  changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): { success: boolean; message: string } {
    const user = this.mockUsers.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.password !== oldPassword) {
      return { success: false, message: 'Current password is incorrect' };
    }

    user.password = newPassword;
    return { success: true, message: 'Password changed successfully' };
  }

  changePasswordAsync(
    userId: string,
    oldPassword: string,
    newPassword: string,
    ms = 300
  ): Observable<{ success: boolean; message: string }> {
    // Use real API when mocks are disabled
    if (!environment.useMocks) {
      return this.http
        .post<{ success: boolean; message: string }>(`${this.apiUrl}/auth/change-password`, {
          oldPassword,
          newPassword,
        })
        .pipe(
          catchError((error) => {
            console.error('Change password error:', error);
            return of({
              success: false,
              message: error.error?.message || 'Failed to change password.',
            });
          })
        );
    }

    const result = this.changePassword(userId, oldPassword, newPassword);
    return of(result).pipe(delay(ms));
  }

  // Get current token
  getToken(): string | null {
    return this.authState.value.token || null;
  }

  // Private helper methods for localStorage persistence
  private persistAuthState(authData: AuthState): void {
    // Gunakan isBrowser untuk memastikan hanya berjalan di browser
    if (this.isBrowser) {
      try {
        localStorage.setItem('authState', JSON.stringify(authData));
      } catch (e) {
        console.warn('Failed to persist auth state:', e);
      }
    }
  }

  private restoreAuthState(): void {
    // Gunakan isBrowser untuk memastikan hanya berjalan di browser
    if (this.isBrowser) {
      try {
        const stored = localStorage.getItem('authState');
        if (stored) {
          const authData = JSON.parse(stored) as AuthState;
          if (authData.isAuthenticated && authData.currentUser) {
            this.authState.next(authData);
          }
        }
      } catch (e) {
        console.warn('Failed to restore auth state:', e);
      }
    }
  }

  private clearAuthState(): void {
    // Gunakan isBrowser untuk memastikan hanya berjalan di browser
    if (this.isBrowser) {
      try {
        localStorage.removeItem('authState');
      } catch (e) {
        console.warn('Failed to clear auth state:', e);
      }
    }
  }
}
