/**
 * HTTP Interceptor for JWT Authentication
 * Automatically attaches Authorization header to API requests
 */

import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const isBrowser = isPlatformBrowser(platformId);

  // Only add token if in browser and request is to our API
  if (isBrowser && req.url.includes('/api/')) {
    const token = getToken();

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired or invalid - clear auth and redirect to login
        if (isBrowser) {
          localStorage.removeItem('authState');
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};

/**
 * Helper function to get token from localStorage
 */
function getToken(): string | null {
  try {
    const stored = localStorage.getItem('authState');
    if (stored) {
      const authData = JSON.parse(stored);
      return authData.token || null;
    }
  } catch (e) {
    console.warn('Failed to get token:', e);
  }
  return null;
}
