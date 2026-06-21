import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  hidePassword = true;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-()]{7,15}$/)]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    this.authService.registerAndLogin({ ...this.registerForm.value, role: 'Customer' }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate([this.authService.getHomeRoute()]);
      },
      error: (err) => {
        this.loading = false;
        const errors = err.error;
        if (Array.isArray(errors)) {
          this.errorMessage = errors.join(', ');
        } else {
          this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
        }
      }
    });
  }
}
