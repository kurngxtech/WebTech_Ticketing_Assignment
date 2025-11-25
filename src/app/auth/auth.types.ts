export type UserRole = 'admin' | 'eo' | 'user';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  organizationName?: string; // for EO
  createdAt: string;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  token?: string;
}
