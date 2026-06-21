import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { VehicleDto, CreateVehicleRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class VehiclesService extends ApiService {
  getVehicles(): Observable<VehicleDto[]> {
    return this.get<VehicleDto[]>('/api/Vehicles');
  }

  createVehicle(vehicle: CreateVehicleRequest): Observable<VehicleDto> {
    return this.post<VehicleDto>('/api/Vehicles', vehicle);
  }

  updateVehicle(id: number, vehicle: Partial<VehicleDto>): Observable<VehicleDto> {
    return this.put<VehicleDto>(`/api/Vehicles/${id}`, vehicle);
  }

  deleteVehicle(id: number): Observable<void> {
    return this.delete<void>(`/api/Vehicles/${id}`);
  }
}
