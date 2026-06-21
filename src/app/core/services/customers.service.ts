import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CustomerDto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CustomersService extends ApiService {
  getCustomers(): Observable<CustomerDto[]> {
    return this.get<CustomerDto[]>('/api/Customers');
  }
}
