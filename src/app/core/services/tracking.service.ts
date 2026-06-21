import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { TrackingLocation } from '../models/models';

@Injectable({ providedIn: 'root' })
export class TrackingService implements OnDestroy {
  private hubConnection: HubConnection | null = null;
  private locationSubject = new Subject<TrackingLocation>();
  locationUpdated$ = this.locationSubject.asObservable();

  constructor(private http: HttpClient) {}

  getTrackingToken(orderId: number): Observable<string> {
    return this.http.get(`${environment.apiUrl}/api/Tracking/${orderId}`, { responseType: 'text' });
  }

  async startTracking(token: string): Promise<void> {
    if (this.hubConnection) {
      await this.stopTracking();
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(environment.hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('LocationUpdated', (lat: number, lng: number) => {
      this.locationSubject.next({ lat, lng, timestamp: new Date() });
    });

    await this.hubConnection.start();
    await this.hubConnection.invoke('JoinTracking', token);
  }

  async updateLocation(orderId: number, lat: number, lng: number): Promise<void> {
    if (this.hubConnection?.state === HubConnectionState.Connected) {
      await this.hubConnection.invoke('UpdateLocation', orderId, lat, lng);
    }
  }

  async stopTracking(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
    }
  }

  isConnected(): boolean {
    return this.hubConnection?.state === HubConnectionState.Connected;
  }

  ngOnDestroy(): void {
    this.stopTracking();
    this.locationSubject.complete();
  }
}
