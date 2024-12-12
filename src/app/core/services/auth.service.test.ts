import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService DynamoDB Integration Test', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const testUser = {
    role: 'participant',
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser@example.com',
    password: 'Test@123456',
    phoneNumber: '1234567890',
    idNumber: 'TEST123',
    subDistrict: 'Test District',
    school: 'Test School'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should register a new user and store in DynamoDB', async () => {
    const formData = new FormData();
    Object.entries(testUser).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Test registration
    let registrationError: any = null;
    try {
      const response = await service.register(formData);
      expect(response.user.email).toBe(testUser.email);
      expect(response.token).toBeTruthy();
      expect(response.refreshToken).toBeTruthy();
    } catch (error) {
      registrationError = error;
      console.error('Registration failed:', error);
    }
    expect(registrationError).toBeNull();

    // Test login with registered credentials
    const loginCredentials = {
      email: testUser.email,
      password: testUser.password
    };

    service.login(loginCredentials).subscribe({
      next: (response) => {
        expect(response.user.email).toBe(testUser.email);
        expect(response.user.firstName).toBe(testUser.firstName);
        expect(response.user.lastName).toBe(testUser.lastName);
        expect(response.token).toBeTruthy();
        
        // Verify token is stored
        expect(localStorage.getItem('auth_token')).toBeTruthy();
        expect(localStorage.getItem('refresh_token')).toBeTruthy();
      },
      error: (error) => {
        fail('Login should not fail: ' + error.message);
      }
    });
  });
});
