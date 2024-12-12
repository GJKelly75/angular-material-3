import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthResponse, User } from '../interfaces/auth.interfaces';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should store tokens after successful login', () => {
    const mockCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockUser: User = {
      id: '123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'participant',
      phoneNumber: '1234567890',
      idNumber: 'ID123',
      platformId: 'platform123',
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const mockResponse: AuthResponse = {
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      user: mockUser
    };

    service.login(mockCredentials).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(localStorage.getItem('auth_token')).toBe(mockResponse.token);
      expect(localStorage.getItem('refresh_token')).toBe(mockResponse.refreshToken);
      expect(localStorage.getItem('token_expiry')).toBeTruthy();
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should handle login error correctly', () => {
    const mockCredentials = {
      email: 'test@example.com',
      password: 'wrong-password'
    };

    service.login(mockCredentials).subscribe({
      error: (error) => {
        expect(error.message).toBe('Invalid credentials');
        expect(localStorage.getItem('auth_token')).toBeNull();
      }
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/login`);
    req.error(new ErrorEvent('Invalid credentials'));
  });
});
