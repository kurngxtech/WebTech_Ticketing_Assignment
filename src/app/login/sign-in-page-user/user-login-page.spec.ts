import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { UserLoginPage } from './user-login-page';
import { AuthService } from '../../auth/auth.service';

describe('UserLoginPage - Login Error Handling', () => {
  let component: UserLoginPage;
  let fixture: ComponentFixture<UserLoginPage>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['loginAsync']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [UserLoginPage],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(UserLoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Test Case 1: Wrong Password', () => {
    it('should show error message when password is wrong', (done) => {
      // Setup
      component.username = 'john_user';
      component.password = 'wrongpassword';

      // Mock failed login response
      authService.loginAsync.and.returnValue(
        of({ success: false, message: 'Invalid username or password' })
      );

      // Act
      component.login();

      // Wait for async subscription to complete
      setTimeout(() => {
        // Assert
        expect(component.errorMessage).toBe('Invalid username or password');
        expect(component.isLoading).toBe(false);
        expect(component.password).toBe('wrongpassword'); // Password should still be there for retry
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      }, 600);
    });

    it('should allow retry with correct password after error', (done) => {
      // First attempt with wrong password
      component.username = 'john_user';
      component.password = 'wrongpassword';

      authService.loginAsync.and.returnValue(
        of({ success: false, message: 'Invalid username or password' })
      );

      component.login();

      setTimeout(() => {
        // Verify error is shown
        expect(component.errorMessage).toBe('Invalid username or password');
        expect(component.isLoading).toBe(false);

        // Second attempt with correct password
        component.password = 'password123'; // Correct password
        const mockUser = {
          id: 'user1',
          username: 'john_user',
          email: 'john@example.com',
          password: 'password123',
          role: 'user',
          fullName: 'John Attendee',
          phone: '08123456789',
          createdAt: new Date().toISOString()
        };

        authService.loginAsync.and.returnValue(
          of({ success: true, message: 'Login successful', user: mockUser })
        );

        component.login();

        setTimeout(() => {
          // Assert successful login
          expect(component.password).toBe(''); // Password cleared after success
          expect(router.navigate).toHaveBeenCalledWith(['/']);
          done();
        }, 600);
      }, 600);
    });
  });

  describe('Test Case 2: Password Clearing Logic', () => {
    it('should clear password only after successful login', (done) => {
      component.username = 'john_user';
      component.password = 'password123';

      const mockUser = {
        id: 'user1',
        username: 'john_user',
        email: 'john@example.com',
        password: 'password123',
        role: 'user',
        fullName: 'John Attendee',
        phone: '08123456789',
        createdAt: new Date().toISOString()
      };

      authService.loginAsync.and.returnValue(
        of({ success: true, message: 'Login successful', user: mockUser })
      );

      component.login();

      setTimeout(() => {
        expect(component.password).toBe(''); // Password should be cleared
        done();
      }, 600);
    });

    it('should keep password visible when login fails (for retry)', (done) => {
      component.username = 'john_user';
      component.password = 'wrongpassword';

      authService.loginAsync.and.returnValue(
        of({ success: false, message: 'Invalid username or password' })
      );

      component.login();

      setTimeout(() => {
        expect(component.password).toBe('wrongpassword'); // Password should NOT be cleared on error
        expect(component.isLoading).toBe(false); // Loading should be false
        done();
      }, 600);
    });
  });

  describe('Test Case 3: Error Message Display', () => {
    it('should display error message when login fails', (done) => {
      component.username = 'john_user';
      component.password = 'wrongpassword';

      authService.loginAsync.and.returnValue(
        of({ success: false, message: 'Invalid username or password' })
      );

      component.login();

      setTimeout(() => {
        expect(component.errorMessage).toBe('Invalid username or password');
        done();
      }, 600);
    });

    it('should clear error message when clearError is called', () => {
      component.errorMessage = 'Some error';
      component.clearError();
      expect(component.errorMessage).toBe('');
    });
  });

  describe('Test Case 4: Loading State', () => {
    it('should set isLoading to false after failed login', (done) => {
      component.username = 'john_user';
      component.password = 'wrongpassword';

      authService.loginAsync.and.returnValue(
        of({ success: false, message: 'Invalid username or password' })
      );

      component.login();

      expect(component.isLoading).toBe(true);

      setTimeout(() => {
        expect(component.isLoading).toBe(false);
        done();
      }, 600);
    });

    it('should keep button enabled after failed login', (done) => {
      component.username = 'john_user';
      component.password = 'wrongpassword';

      authService.loginAsync.and.returnValue(
        of({ success: false, message: 'Invalid username or password' })
      );

      component.login();

      setTimeout(() => {
        expect(component.isLoading).toBe(false); // This allows button to be clickable again
        done();
      }, 600);
    });
  });

  describe('Test Case 5: Empty Fields Validation', () => {
    it('should show error when username is empty', () => {
      component.username = '';
      component.password = 'password123';

      component.login();

      expect(component.errorMessage).toBe('Please enter username and password');
      expect(component.isLoading).toBe(false);
    });

    it('should show error when password is empty', () => {
      component.username = 'john_user';
      component.password = '';

      component.login();

      expect(component.errorMessage).toBe('Please enter username and password');
      expect(component.isLoading).toBe(false);
    });
  });
});
