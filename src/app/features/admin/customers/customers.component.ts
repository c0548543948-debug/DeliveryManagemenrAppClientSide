import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersService } from '../../../core/services/customers.service';
import { CustomerDto } from '../../../core/models/models';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {
  customers: CustomerDto[] = [];
  loading = true;
  errorMessage = '';
  constructor(private customersService: CustomersService) {}
  ngOnInit(): void {
    this.customersService.getCustomers().subscribe({
      next: (c) => { this.customers = c; this.loading = false; },
      error: () => { this.errorMessage = 'Failed to load customers'; this.loading = false; }
    });
  }
}
