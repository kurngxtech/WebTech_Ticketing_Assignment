import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User, AuthState, UserRole } from './auth.types';
import { environment } from '../../environments/environment';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
   providedIn: 'root'
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
         return (mock && mock.MOCK_USERS) ? mock.MOCK_USERS : [];
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
         u => (u.username === username || u.email === username) && u.password === password
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
   loginAsync(username: string, password: string, ms = 300) {
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
      if (this.mockUsers.find(u => u.email === data.email)) {
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
      console.log(
         `Welcome email sent to ${data.email}. Username: ${username}, Default Password: ${defaultPassword}`
      );

      return { success: true, message: 'Event organizer registered successfully', user: newUser };
   }

   registerEventOrganizerAsync(data: { fullName: string; email: string; phone: string; organizationName: string }, ms = 300) {
      const result = this.registerEventOrganizer(data);
      return of(result).pipe(delay(ms));
   }

   registerUser(data: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
   }): { success: boolean; message: string; user?: User } {
      // Check if email already exists
      if (this.mockUsers.find(u => u.email === data.email)) {
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

   registerUserAsync(data: { fullName: string; email: string; phone: string; password: string }, ms = 300) {
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

   isAuthenticated(): boolean {
      return this.authState.value.isAuthenticated;
   }

   hasRole(role: UserRole): boolean {
      return this.authState.value.currentUser?.role === role;
   }

   changePassword(userId: string, oldPassword: string, newPassword: string): { success: boolean; message: string } {
      const user = this.mockUsers.find(u => u.id === userId);
      if (!user) {
         return { success: false, message: 'User not found' };
      }

      if (user.password !== oldPassword) {
         return { success: false, message: 'Current password is incorrect' };
      }

      user.password = newPassword;
      return { success: true, message: 'Password changed successfully' };
   }

   changePasswordAsync(userId: string, oldPassword: string, newPassword: string, ms = 300) {
      const result = this.changePassword(userId, oldPassword, newPassword);
      return of(result).pipe(delay(ms));
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