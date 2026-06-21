import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RouteDto, OptimizeRoutesRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RoutesService extends ApiService {
  getRoutes(): Observable<RouteDto[]> {
    return this.get<RouteDto[]>('/api/Routes');
  }

  getRouteMap(id: number): Observable<{ mapUrl: string }> {
    return this.get<{ mapUrl: string }>(`/api/Routes/${id}/map`);
  }

  optimizeRoutes(request: OptimizeRoutesRequest): Observable<any> {
    return this.post<any>('/api/Routes/optimize', request);
  }

  batchOptimizeRoutes(request: OptimizeRoutesRequest): Observable<any> {
    return this.post<any>('/api/Routes/batch-optimize', request);
  }
}
