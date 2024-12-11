import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private requestCount = 0;
  private readonly MAX_REQUESTS_PER_MINUTE = 60;
  private requestTimestamps: number[] = [];

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Rate limiting check
    if (this.isRateLimited()) {
      return throwError(() => new Error('Rate limit exceeded. Please try again later.'));
    }

    // Add request to rate limiting counter
    this.trackRequest();

    // Add auth header
    request = this.addAuthHeader(request);

    return next.handle(request).pipe(
      retry({
        count: this.MAX_RETRIES,
        delay: (error, retryCount) => {
          if (error instanceof HttpErrorResponse) {
            // Don't retry for these status codes
            if ([400, 401, 403, 404].includes(error.status)) {
              return throwError(() => error);
            }
            // Exponential backoff
            const delay = this.RETRY_DELAY * Math.pow(2, retryCount - 1);
            return new Observable(subscriber => {
              setTimeout(() => subscriber.complete(), delay);
            });
          }
          return throwError(() => error);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Auto logout if 401 response returned from api
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }

  private addAuthHeader(request: HttpRequest<unknown>): HttpRequest<unknown> {
    const token = localStorage.getItem('auth_token');
    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return request;
  }

  private isRateLimited(): boolean {
    const now = Date.now();
    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < 60000
    );
    return this.requestTimestamps.length >= this.MAX_REQUESTS_PER_MINUTE;
  }

  private trackRequest(): void {
    this.requestTimestamps.push(Date.now());
  }
}
