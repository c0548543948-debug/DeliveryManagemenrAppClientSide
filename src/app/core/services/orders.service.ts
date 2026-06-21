import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { OrderDto, CreateOrderRequest, AddressValidationResult, PriceCalculationRequest, PriceCalculationResult } from '../models/models';

@Injectable({ providedIn: 'root' })
export class OrdersService extends ApiService {
  getOrders(): Observable<OrderDto[]> {
    return this.get<OrderDto[]>('/api/Orders');
  }

  getOrder(id: number): Observable<OrderDto> {
    return this.get<OrderDto>(`/api/Orders/${id}`);
  }

  getPendingOrders(): Observable<OrderDto[]> {
    return this.get<OrderDto[]>('/api/Orders/pending');
  }

  validateAddress(address: string): Observable<AddressValidationResult> {
    return this.get<AddressValidationResult>('/api/Orders/validate-address', { address });
  }

  calculatePrice(request: PriceCalculationRequest): Observable<PriceCalculationResult> {
    // Server returns a raw decimal, wrap it into { price }
    return this.post<number>('/api/Orders/calculate-price', request).pipe(
      map(price => ({ price }))
    );
  }

  createOrder(order: CreateOrderRequest): Observable<OrderDto> {
    return this.post<OrderDto>('/api/Orders', order);
  }

  updateOrder(id: number, order: Partial<OrderDto>): Observable<OrderDto> {
    return this.put<OrderDto>(`/api/Orders/${id}`, order);
  }

  deleteOrder(id: number): Observable<void> {
    return this.delete<void>(`/api/Orders/${id}`);
  }
}
