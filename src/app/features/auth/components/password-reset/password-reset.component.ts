import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    RouterModule
  ],
  template: `
    <div class="auth-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ token ? 'Reset Password' : 'Forgot Password' }}</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Request Password Reset Form -->
          <form *ngIf="!token" [formGroup]="requestForm" (ngSubmit)="onRequestSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" required>
              <mat-error *ngIf="requestForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="requestForm.get('email')?.hasError('email')">
                Please enter a valid email address
              </mat-error>
            </mat-form-field>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="requestForm.invalid || isLoading">
                {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
              </button>
            </div>
          </form>

          <!-- Reset Password Form -->
          <form *ngIf="token" [formGroup]="resetForm" (ngSubmit)="onResetSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>New Password</mat-label>
              <input matInput type="password" formControlName="newPassword" required>
              <mat-error *ngIf="resetForm.get('newPassword')?.hasError('required')">
                Password is required
              </mat-error>
              <mat-error *ngIf="resetForm.get('newPassword')?.hasError('minlength')">
                Password must be at least 8 characters
              </mat-error>
              <mat-error *ngIf="resetForm.get('newPassword')?.hasError('pattern')">
                Password must contain at least one uppercase letter, one lowercase letter, 
                one number and one special character
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Confirm New Password</mat-label>
              <input matInput type="password" formControlName="confirmPassword" required>
              <mat-error *ngIf="resetForm.get('confirmPassword')?.hasError('required')">
                Please confirm your password
              </mat-error>
              <mat-error *ngIf="resetForm.get('confirmPassword')?.hasError('passwordMismatch')">
                Passwords do not match
              </mat-error>
            </mat-form-field>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="resetForm.invalid || isLoading">
                {{ isLoading ? 'Resetting...' : 'Reset Password' }}
              </button>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <a mat-button color="primary" routerLink="/auth/login">Back to Login</a>
        </mat-card-actions>

        <mat-spinner *ngIf="isLoading" diameter="30" class="spinner"></mat-spinner>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background-color: #f5f5f5;
    }

    mat-card {
      max-width: 400px;
      width: 100%;
      padding: 20px;
    }

    mat-card-header {
      justify-content: center;
      margin-bottom: 20px;
    }

    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .form-actions {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }

    .spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  `]
})
export class PasswordResetComponent {
  requestForm: FormGroup;
  resetForm: FormGroup;
  isLoading = false;
  token: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // Initialize request form
    this.requestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Initialize reset form
    this.resetForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });

    // Check for reset token in URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { passwordMismatch: true };
  }

  onRequestSubmit(): void {
    if (this.requestForm.valid) {
      this.isLoading = true;
      this.authService.requestPasswordReset(this.requestForm.value).subscribe({
        next: () => {
          this.snackBar.open(
            'Password reset link has been sent to your email.',
            'Close',
            { duration: 5000 }
          );
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open(error.message || 'Failed to send reset link', 'Close', {
            duration: 5000
          });
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }

  onResetSubmit(): void {
    if (this.resetForm.valid && this.token) {
      this.isLoading = true;
      const { confirmPassword, ...resetData } = this.resetForm.value;
      
      this.authService.confirmPasswordReset({
        token: this.token,
        newPassword: resetData.newPassword
      }).subscribe({
        next: () => {
          this.snackBar.open('Password has been reset successfully', 'Close', {
            duration: 5000
          });
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open(error.message || 'Failed to reset password', 'Close', {
            duration: 5000
          });
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
}
