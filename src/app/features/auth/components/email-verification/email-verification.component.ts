import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  template: `
    <div class="auth-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Email Verification</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <div class="verification-content" *ngIf="!isLoading">
            <p *ngIf="verificationSuccess" class="success-message">
              <mat-icon>check_circle</mat-icon>
              Your email has been successfully verified!
            </p>
            <p *ngIf="verificationError" class="error-message">
              <mat-icon>error</mat-icon>
              {{ errorMessage }}
            </p>
          </div>
          <mat-spinner *ngIf="isLoading" diameter="30"></mat-spinner>
        </mat-card-content>

        <mat-card-actions>
          <button mat-raised-button color="primary" routerLink="/auth/login">
            Go to Login
          </button>
        </mat-card-actions>
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

    .verification-content {
      text-align: center;
      padding: 20px 0;
    }

    .success-message {
      color: #4caf50;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .error-message {
      color: #f44336;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    mat-card-actions {
      display: flex;
      justify-content: center;
    }

    mat-spinner {
      margin: 20px auto;
    }
  `]
})
export class EmailVerificationComponent implements OnInit {
  isLoading = true;
  verificationSuccess = false;
  verificationError = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.verifyEmail(token);
      } else {
        this.handleError('Verification token is missing');
      }
    });
  }

  private verifyEmail(token: string): void {
    this.authService.verifyEmail({ token }).subscribe({
      next: () => {
        this.isLoading = false;
        this.verificationSuccess = true;
        this.snackBar.open('Email verified successfully!', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (error) => {
        this.handleError(error.message || 'Email verification failed');
      }
    });
  }

  private handleError(message: string): void {
    this.isLoading = false;
    this.verificationError = true;
    this.errorMessage = message;
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
