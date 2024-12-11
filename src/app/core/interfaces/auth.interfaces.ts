export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'administrator' | 'coach' | 'participant';
  phoneNumber: string;
  idNumber: string;
  subDistrict?: string;
  gradeTeaching?: string;
  subjectTeaching?: string;
  school?: string;
  profilePhotoUrl?: string;
  digitalSignatureUrl?: string;
  platformId: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  role: 'administrator' | 'coach' | 'participant';
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  idNumber: string;
  subDistrict?: string;
  gradeTeaching?: string;
  subjectTeaching?: string;
  school?: string;
  profilePhoto?: File;
  digitalSignature?: File;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface EmailVerificationRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
