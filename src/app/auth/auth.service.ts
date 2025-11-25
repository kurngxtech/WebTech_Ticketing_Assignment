import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, AuthState, UserRole } from './auth.types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<AuthState>({
    currentUser: null,
    isAuthenticated: false,
  });

  public authState$: Observable<AuthState> = this.authState.asObservable();

  // Mock users database
  private mockUsers: User[] = [
    {
      id: 'user1',
      username: 'john_user',
      email: 'john@example.com',
      password: 'password123',
      role: 'user',
      fullName: 'John Attendee',
      phone: '08123456789',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'eo1',
      username: 'jane_eo',
      email: 'jane@events.com',
      password: 'eopass123',
      role: 'eo',
      fullName: 'Jane Event Organizer',
      phone: '08198765432',
      organizationName: 'Creative Events Inc',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'eo2',
      username: 'bob_eo',
      email: 'bob@events.com',
      password: 'eopass456',
      role: 'eo',
      fullName: 'Bob Event Manager',
      phone: '08156789012',
      organizationName: 'Concert Productions Ltd',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'admin1',
      username: 'admin',
      email: 'admin@auditorium.com',
      password: 'adminpass123',
      role: 'admin',
      fullName: 'Admin User',
      phone: '08100000000',
      createdAt: new Date().toISOString(),
    },
  ];

  constructor() {}

  login(username: string, password: string): { success: boolean; message: string; user?: User } {
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
    return { success: true, message: 'Login successful', user };
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

  logout(): void {
    this.authState.next({
      currentUser: null,
      isAuthenticated: false,
    });
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
}
