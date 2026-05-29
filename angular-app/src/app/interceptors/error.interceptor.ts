import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Unauthorized — clear auth state and redirect to login
        console.warn('[VeriShield API] 401 Unauthorized — clearing auth and redirecting to /login');
        authService.logout();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        // Forbidden — log a warning
        console.warn('[VeriShield API] 403 Forbidden — access denied:', req.url);
      } else if (error.status >= 500) {
        // Server error — log an error
        console.error('[VeriShield API] Server error:', error.status, req.url, error.message);
      }

      // Re-throw so components can still handle the error
      return throwError(() => error);
    })
  );
};
