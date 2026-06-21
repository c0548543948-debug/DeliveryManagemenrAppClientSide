import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RoutesService } from '../../../core/services/routes.service';
import { OrdersService } from '../../../core/services/orders.service';
import { TrackingService } from '../../../core/services/tracking.service';
import { RouteDto, RouteItemDto, OrderStatus } from '../../../core/models/models';

@Component({
  selector: 'app-route-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './route-detail.component.html',
  styleUrls: ['./route-detail.component.scss']
})
export class RouteDetailComponent implements OnInit, OnDestroy {
  routeId!: number;
  route: RouteDto | null = null;
  loading = true;
  updatingLocation = false;
  lastLocation: { lat: number; lng: number } | null = null;
  successMessage = '';
  errorMessage = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private routesService: RoutesService,
    private ordersService: OrdersService,
    private trackingService: TrackingService
  ) {}

  ngOnInit(): void {
    this.routeId = Number(this.activatedRoute.snapshot.paramMap.get('routeId'));
    this.loadRoute();
  }

  loadRoute(): void {
    this.loading = true;
    this.routesService.getRoutes().subscribe({
      next: (routes) => {
        this.route = routes.find(r => r.routeId === this.routeId) || null;
        this.loading = false;
      },
      error: () => { this.errorMessage = 'Failed to load route'; this.loading = false; }
    });
  }

  sendLocation(orderId: number): void {
    if (!navigator.geolocation) {
      this.errorMessage = 'Geolocation is not supported by your browser';
      return;
    }
    this.updatingLocation = true;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.lastLocation = { lat, lng };
        try {
          await this.trackingService.updateLocation(orderId, lat, lng);
          this.showSuccess(`Location sent: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } catch {
          this.showError('Failed to send location');
        }
        this.updatingLocation = false;
      },
      (err) => {
        this.showError('Could not get location: ' + err.message);
        this.updatingLocation = false;
      }
    );
  }

  markDelivered(item: RouteItemDto): void {
    this.ordersService.updateOrder(item.orderId, { status: OrderStatus.Delivered } as any).subscribe({
      next: () => this.showSuccess(`Order #${item.orderId} marked as delivered`),
      error: () => this.showError('Failed to update order status')
    });
  }

  getStopLabel(type: number): string { return type === 0 ? 'Pickup' : 'Delivery'; }
  getStopIcon(type: number): string { return type === 0 ? '📦' : '🏠'; }

  showSuccess(msg: string): void { this.successMessage = msg; this.errorMessage = ''; setTimeout(() => this.successMessage = '', 4000); }
  showError(msg: string): void { this.errorMessage = msg; this.successMessage = ''; setTimeout(() => this.errorMessage = '', 4000); }

  ngOnDestroy(): void { this.trackingService.stopTracking(); }
}
