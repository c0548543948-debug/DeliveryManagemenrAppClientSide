import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  orderForm: FormGroup;
  showOrderForm = false;

  features = [
    { icon: '🚀', title: 'Fast Delivery', desc: 'Same-day and next-day delivery options available across Israel.' },
    { icon: '📍', title: 'Live Tracking', desc: 'Track your courier in real time from pickup to your door.' },
    { icon: '🤖', title: 'Smart Routing', desc: 'AI-powered route optimization means faster, cheaper deliveries.' },
    { icon: '💳', title: 'Transparent Pricing', desc: 'Instant price estimate before you commit — no surprises.' },
  ];

  steps = [
    { num: '1', title: 'Enter Details', desc: 'Fill in pickup & delivery addresses and package info.' },
    { num: '2', title: 'Get a Quote', desc: 'See your price instantly, calculated by distance and weight.' },
    { num: '3', title: 'Track Live', desc: 'Watch your delivery on the map in real time.' },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    public authService: AuthService
  ) {
    this.orderForm = this.fb.group({
      originAddress: ['', Validators.required],
      destinationAddress: ['', Validators.required],
      weight: ['', [Validators.required, Validators.min(0.1)]],
      volume: ['', [Validators.required, Validators.min(0.01)]],
      requiredDate: ['', Validators.required],
    });
  }

  scrollToOrder(): void {
    this.showOrderForm = true;
    setTimeout(() => {
      document.getElementById('order-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  submitOrder(): void {
    if (this.authService.isAuthenticated()) {
      // Already logged in — go to place-order with prefilled data
      this.router.navigate(['/customer/place-order']);
    } else {
      // Save form data and redirect to register
      sessionStorage.setItem('pendingOrder', JSON.stringify(this.orderForm.value));
      this.router.navigate(['/register'], { queryParams: { redirect: 'place-order' } });
    }
  }

  goToLogin(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.authService.getHomeRoute()]);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
