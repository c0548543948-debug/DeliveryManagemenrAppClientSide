import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CourierDto, CreateCourierRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CouriersService extends ApiService {
  getCouriers(): Observable<CourierDto[]> {
    return this.get<CourierDto[]>('/api/Couriers');
  }

  createCourier(courier: CreateCourierRequest): Observable<CourierDto> {
    return this.post<CourierDto>('/api/Couriers', courier);
  }

  updateCourier(id: number, courier: Partial<CourierDto>): Observable<CourierDto> {
    return this.put<CourierDto>(`/api/Couriers/${id}`, courier);
  }

  deleteCourier(id: number): Observable<void> {
    return this.delete<void>(`/api/Couriers/${id}`);
  }
}
