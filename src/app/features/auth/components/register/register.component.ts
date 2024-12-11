import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDividerModule
  ],
  template: `
    <div class="auth-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Create Account</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <!-- Role Selection -->
            <mat-form-field appearance="outline">
              <mat-label>Role</mat-label>
              <mat-select formControlName="role" required (selectionChange)="onRoleChange($event)">
                <mat-option value="administrator">Administrator</mat-option>
                <mat-option value="coach">Coach</mat-option>
                <mat-option value="participant">Teacher/Participant</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Basic Information -->
            <div class="name-fields">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" required>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" required>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" required>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Phone Number</mat-label>
              <input matInput formControlName="phoneNumber" required>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>ID Number</mat-label>
              <input matInput formControlName="idNumber" required>
            </mat-form-field>

            <!-- Role-specific fields -->
            <ng-container *ngIf="registerForm.get('role')?.value === 'participant'">
              <mat-form-field appearance="outline">
                <mat-label>Sub-district</mat-label>
                <input matInput formControlName="subDistrict" required>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Grade Teaching</mat-label>
                <input matInput formControlName="gradeTeaching" required>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Subject Teaching</mat-label>
                <input matInput formControlName="subjectTeaching" required>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>School</mat-label>
                <input matInput formControlName="school" required>
              </mat-form-field>
            </ng-container>

            <!-- File uploads -->
            <div class="file-upload-section">
              <button type="button" mat-stroked-button (click)="profilePhotoInput.click()">
                Upload Profile Photo
              </button>
              <input #profilePhotoInput type="file" hidden (change)="onProfilePhotoSelected($event)" accept="image/*">
              
              <button type="button" mat-stroked-button (click)="signatureInput.click()">
                Upload Digital Signature
              </button>
              <input #signatureInput type="file" hidden (change)="onSignatureSelected($event)" accept="image/*">
            </div>

            <!-- Password fields -->
            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" required>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Confirm Password</mat-label>
              <input matInput type="password" formControlName="confirmPassword" required>
            </mat-form-field>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="registerForm.invalid || isLoading">
                {{ isLoading ? 'Creating Account...' : 'Create Account' }}
              </button>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p>Already have an account?
            <a mat-button color="primary" routerLink="/auth/login">Login</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .name-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    
    .file-upload-section {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
    }
    
    mat-form-field {
      width: 100%;
    }
    
    .form-actions {
      margin-top: 1rem;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      role: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      idNumber: ['', Validators.required],
      subDistrict: [''],
      gradeTeaching: [''],
      subjectTeaching: [''],
      school: [''],
      profilePhoto: [null],
      digitalSignature: [null],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { passwordMismatch: true };
  }

  onRoleChange(event: any) {
    const role = event.value;
    if (role === 'participant') {
      this.registerForm.get('subDistrict')?.setValidators(Validators.required);
      this.registerForm.get('gradeTeaching')?.setValidators(Validators.required);
      this.registerForm.get('subjectTeaching')?.setValidators(Validators.required);
      this.registerForm.get('school')?.setValidators(Validators.required);
    } else {
      this.registerForm.get('subDistrict')?.clearValidators();
      this.registerForm.get('gradeTeaching')?.clearValidators();
      this.registerForm.get('subjectTeaching')?.clearValidators();
      this.registerForm.get('school')?.clearValidators();
    }
    
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.updateValueAndValidity();
    });
  }

  onProfilePhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.registerForm.patchValue({
        profilePhoto: file
      });
    }
  }

  onSignatureSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.registerForm.patchValue({
        digitalSignature: file
      });
    }
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      try {
        const formData = new FormData();
        Object.keys(this.registerForm.value).forEach(key => {
          if (key === 'profilePhoto' || key === 'digitalSignature') {
            if (this.registerForm.get(key)?.value) {
              formData.append(key, this.registerForm.get(key)?.value);
            }
          } else {
            formData.append(key, this.registerForm.get(key)?.value);
          }
        });

        await this.authService.register(formData);
        this.snackBar.open('Registration successful!', 'Close', { duration: 3000 });
        this.router.navigate(['/auth/login']);
      } catch (error: any) {
        this.snackBar.open(error.message || 'Registration failed', 'Close', { duration: 5000 });
      } finally {
        this.isLoading = false;
      }
    }
  }
}
