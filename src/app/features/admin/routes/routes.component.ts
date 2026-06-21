import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoutesService } from '../../../core/services/routes.service';
import { RouteDto } from '../../../core/models/models';

@Component({
  selector: 'app-routes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './routes.component.html',
  styleUrls: ['./routes.component.scss']
})
export class RoutesAdminComponent implements OnInit {
  routes: RouteDto[] = [];
  loading = true;
  optimizing = false;
  message = '';
  messageType = '';
  selectedDate = new Date().toISOString().split('T')[0];
  expandedRouteId: number | null = null;

  constructor(private routesService: RoutesService) {}

  ngOnInit(): void { this.loadRoutes(); }

  loadRoutes(): void {
    this.loading = true;
    this.routesService.getRoutes().subscribe({
      next: (r) => { this.routes = r; this.loading = false; },
      error: () => { this.showMessage('Failed to load routes', 'error'); this.loading = false; }
    });
  }

  optimizeRoutes(): void {
    this.optimizing = true;
    this.routesService.optimizeRoutes({ date: this.selectedDate }).subscribe({
      next: () => { this.showMessage('Routes optimized!', 'success'); this.optimizing = false; this.loadRoutes(); },
      error: () => { this.showMessage('Optimization failed', 'error'); this.optimizing = false; }
    });
  }

  batchOptimize(): void {
    this.optimizing = true;
    this.routesService.batchOptimizeRoutes({ date: this.selectedDate }).subscribe({
      next: () => { this.showMessage('Batch optimization started!', 'success'); this.optimizing = false; this.loadRoutes(); },
      error: () => { this.showMessage('Batch optimization failed', 'error'); this.optimizing = false; }
    });
  }

  openMap(routeId: number): void {
    this.routesService.getRouteMap(routeId).subscribe({
      next: (r) => { if (r.mapUrl) window.open(r.mapUrl, '_blank'); },
      error: () => this.showMessage('Failed to load map', 'error')
    });
  }

  toggleRoute(routeId: number): void {
    this.expandedRouteId = this.expandedRouteId === routeId ? null : routeId;
  }

  getStopLabel(type: number): string { return type === 0 ? 'Pickup' : 'Delivery'; }

  showMessage(msg: string, type: string): void {
    this.message = msg; this.messageType = type;
    setTimeout(() => this.message = '', 4000);
  }
}
