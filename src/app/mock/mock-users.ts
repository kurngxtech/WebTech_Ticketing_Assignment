/* DEV ONLY: Mock users for front-end assignment demo. Remove or ignore for backend integration. */
import { User } from '../auth/auth.types';

export const MOCK_USERS: User[] = [
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
