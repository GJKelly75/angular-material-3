import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { catchError, map, retry, shareReplay, tap } from 'rxjs/operators';
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  PasswordResetRequest,
  PasswordResetConfirm,
  EmailVerificationRequest,
  RefreshTokenRequest
} from '../interfaces/auth.interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://r0gdpyaey9.execute-api.us-east-1.amazonaws.com/prod/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  
  private refreshTokenTimeout: any;

  constructor(private http: HttpClient) {
    this.checkToken();
  }

  // Initialize auth state
  private checkToken(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    
    if (token && expiry && new Date(expiry) > new Date()) {
      this.decodeAndSetUser(token);
      this.startRefreshTokenTimer();
    } else {
      this.logout();
    }
  }

  // Register new user
  async register(formData: FormData): Promise<AuthResponse> {
    try {
      const response = await this.http.post<AuthResponse>(`${this.apiUrl}/register`, formData)
        .pipe(
          retry(3),
          tap(response => this.handleAuthResponse(response)),
          catchError((error: HttpErrorResponse) => this.handleError(error))
        ).toPromise();
        
      if (!response) {
        throw new Error('Registration failed');
      }
      
      return response;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        throw this.handleError(error);
      }
      throw new Error('An unexpected error occurred during registration');
    }
  }

  // Login user
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      retry(3),
      tap(response => this.handleAuthResponse(response)),
      catchError(this.handleError)
    );
  }

  // Logout user
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    this.currentUserSubject.next(null);
    this.stopRefreshTokenTimer();
  }

  // Request password reset
  requestPasswordReset(request: PasswordResetRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/password-reset`, request).pipe(
      catchError(this.handleError)
    );
  }

  // Confirm password reset
  confirmPasswordReset(reset: PasswordResetConfirm): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/password-reset/confirm`, reset).pipe(
      catchError(this.handleError)
    );
  }

  // Verify email
  verifyEmail(request: EmailVerificationRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/verify-email`, request).pipe(
      catchError(this.handleError)
    );
  }

  // Refresh token
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, request).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(this.handleError)
    );
  }

  // Get current auth status
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Handle authentication response
  private handleAuthResponse(response: AuthResponse): void {
    if (response && response.token) {
      console.log('Auth response received:', { 
        hasToken: !!response.token,
        hasRefreshToken: !!response.refreshToken,
        expiresIn: response.expiresIn 
      });
      
      // Store the tokens
      localStorage.setItem(this.TOKEN_KEY, response.token);
      if (response.refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
      }
      
      // Calculate and store expiry
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + (response.expiresIn || 3600));
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryDate.toISOString());
      
      // Decode and set user
      this.decodeAndSetUser(response.token);
      
      // Start refresh timer
      this.startRefreshTokenTimer();
      
      console.log('Auth state after login:', {
        token: !!localStorage.getItem(this.TOKEN_KEY),
        refreshToken: !!localStorage.getItem(this.REFRESH_TOKEN_KEY),
        expiry: localStorage.getItem(this.TOKEN_EXPIRY_KEY)
      });
    } else {
      console.error('Invalid auth response:', response);
      this.logout();
    }
  }

  // Get the current token
  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    
    if (token && expiry && new Date(expiry) > new Date()) {
      return token;
    }
    
    // Token expired
    if (token) {
      console.log('Token expired, attempting refresh...');
      this.refreshToken().subscribe();
    }
    
    return null;
  }

  // Decode and set user
  private decodeAndSetUser(token: string): void {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const user: User = {
        id: decoded.sub,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        isEmailVerified: decoded.emailVerified,
        role: decoded.role,
        phoneNumber: decoded.phoneNumber,
        idNumber: decoded.idNumber,
        platformId: decoded.platformId,
        createdAt: decoded.createdAt,
        updatedAt: decoded.updatedAt
      };
      this.currentUserSubject.next(user);
    } catch (error) {
      console.error('Error decoding token:', error);
      this.logout();
    }
  }

  // Start refresh token timer
  private startRefreshTokenTimer(): void {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (expiry) {
      const expires = new Date(expiry);
      const timeout = expires.getTime() - Date.now() - (60 * 1000); // Refresh 1 minute before expiry
      this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
    }
  }

  // Stop refresh token timer
  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  // Error handling
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || 'Server error';
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
