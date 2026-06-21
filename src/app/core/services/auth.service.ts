import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly apiUrl = environment.apiUrl;

  isLoggedIn = signal<boolean>(this.hasToken());

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/api/Users/login`, credentials, { responseType: 'text' }).pipe(
      tap(raw => {
        const token = raw.replace(/^"|"$/g, '').trim();
        localStorage.setItem(this.TOKEN_KEY, token);
        this.isLoggedIn.set(true);
      })
    );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/Users/register`, data);
  }

  registerAndLogin(data: RegisterRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/api/Users/register`, data, { responseType: 'text' }).pipe(
      tap(raw => {
        const token = raw.replace(/^"|"$/g, '').trim();
        localStorage.setItem(this.TOKEN_KEY, token);
        this.isLoggedIn.set(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;
    try {
      const payload = this.decodePayload(token);
      const exp = payload['exp'];
      if (exp && Date.now() / 1000 > exp) {
        localStorage.removeItem(this.TOKEN_KEY);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  private decodePayload(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return JSON.parse(atob(padded));
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = this.decodePayload(token);
      return payload['role'] || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null;
    } catch {
      return null;
    }
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = this.decodePayload(token);
      return payload['sub'] || payload['nameid'] || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || null;
    } catch {
      return null;
    }
  }

  getUserEmail(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = this.decodePayload(token);
      return payload['email'] || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || null;
    } catch {
      return null;
    }
  }

  isAdmin(): boolean { return this.getRole() === 'Administrator'; }
  isCourier(): boolean { return this.getRole() === 'Courier'; }
  isCustomer(): boolean { return this.getRole() === 'Customer'; }

  getHomeRoute(): string {
    const role = this.getRole();
    if (role === 'Administrator') return '/admin/dashboard';
    if (role === 'Courier') return '/courier/my-routes';
    if (role === 'Customer') return '/customer/my-orders';
    return '/login';
  }
}
