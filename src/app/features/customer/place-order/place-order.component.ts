import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrdersService } from '../../../core/services/orders.service';
import { AddressValidationResult } from '../../../core/models/models';

@Component({
  selector: 'app-place-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './place-order.component.html',
  styleUrls: ['./place-order.component.scss']
})
export class PlaceOrderComponent implements OnInit {
  orderForm!: FormGroup;
  originValidation: AddressValidationResult | null = null;
  destValidation: AddressValidationResult | null = null;
  estimatedPrice: number | null = null;
  validatingOrigin = false;
  validatingDest = false;
  calculatingPrice = false;
  submitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.orderForm = this.fb.group({
      originAddress: ['', Validators.required],
      destinationAddress: ['', Validators.required],
      weight: [1, [Validators.required, Validators.min(0.1)]],
      volume: [0.1, [Validators.required, Validators.min(0.01)]],
      requiredDate: ['', Validators.required]
    });
  }

  validateOrigin(): void {
    const addr = this.orderForm.get('originAddress')?.value;
    if (!addr) return;
    this.validatingOrigin = true;
    this.originValidation = null;
    this.ordersService.validateAddress(addr).subscribe({
      next: (r) => { this.originValidation = r; this.validatingOrigin = false; this.tryCalculatePrice(); },
      error: () => { this.validatingOrigin = false; }
    });
  }

  validateDest(): void {
    const addr = this.orderForm.get('destinationAddress')?.value;
    if (!addr) return;
    this.validatingDest = true;
    this.destValidation = null;
    this.ordersService.validateAddress(addr).subscribe({
      next: (r) => { this.destValidation = r; this.validatingDest = false; this.tryCalculatePrice(); },
      error: () => { this.validatingDest = false; }
    });
  }

  tryCalculatePrice(): void {
    const f = this.orderForm.value;
    if (f.originAddress && f.destinationAddress && f.weight && f.volume && f.requiredDate) {
      this.calculatePrice();
    }
  }

  calculatePrice(): void {
    const f = this.orderForm.value;
    if (!f.originAddress || !f.destinationAddress || !f.weight || !f.volume || !f.requiredDate) return;
    this.calculatingPrice = true;
    this.estimatedPrice = null;
    this.ordersService.calculatePrice({
      originAddress: f.originAddress,
      destinationAddress: f.destinationAddress,
      weight: f.weight,
      volume: f.volume,
      requiredDate: f.requiredDate
    }).subscribe({
      next: (r) => { this.estimatedPrice = r.price; this.calculatingPrice = false; },
      error: () => { this.calculatingPrice = false; }
    });
  }

  submitOrder(): void {
    if (this.orderForm.invalid) return;
    this.submitting = true;
    this.errorMessage = '';
    this.ordersService.createOrder(this.orderForm.value).subscribe({
      next: () => { this.submitting = false; this.router.navigate(['/customer/my-orders']); },
      error: (err) => { this.submitting = false; this.errorMessage = err.error?.message || 'Failed to place order'; }
    });
  }
}
