import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TrackingService } from '../../../core/services/tracking.service';
import { TrackingLocation } from '../../../core/models/models';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-order.component.html',
  styleUrls: ['./track-order.component.scss']
})
export class TrackOrderComponent implements OnInit, OnDestroy {
  orderId!: number;
  connecting = false;
  connected = false;
  currentLocation: TrackingLocation | null = null;
  locationHistory: TrackingLocation[] = [];
  error: string | null = null;
  private sub!: Subscription;

  constructor(private route: ActivatedRoute, private trackingService: TrackingService) {}

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('orderId'));
    this.sub = this.trackingService.locationUpdated$.subscribe(loc => {
      this.currentLocation = loc;
      this.locationHistory.unshift(loc);
      if (this.locationHistory.length > 50) this.locationHistory.pop();
    });
    this.startTracking();
  }

  async startTracking(): Promise<void> {
    this.connecting = true;
    this.error = null;
    try {
      const token = await this.trackingService.getTrackingToken(this.orderId).toPromise();
      if (token) {
        await this.trackingService.startTracking(token);
        this.connected = true;
      }
    } catch {
      this.error = 'Failed to connect to tracking service.';
    } finally {
      this.connecting = false;
    }
  }

  async stopTracking(): Promise<void> {
    await this.trackingService.stopTracking();
    this.connected = false;
  }

  formatTime(date: Date): string { return new Date(date).toLocaleTimeString(); }

  getMapsUrl(): string | null {
    if (!this.currentLocation) return null;
    return `https://www.google.com/maps?q=${this.currentLocation.lat},${this.currentLocation.lng}`;
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    this.trackingService.stopTracking();
  }
}
