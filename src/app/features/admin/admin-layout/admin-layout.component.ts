import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  navItems = [
    { label: 'Dashboard', icon: '📊', route: '/admin/dashboard' },
    { label: 'Orders', icon: '📋', route: '/admin/orders' },
    { label: 'Couriers', icon: '🚴', route: '/admin/couriers' },
    { label: 'Vehicles', icon: '🚛', route: '/admin/vehicles' },
    { label: 'Routes', icon: '🗺️', route: '/admin/routes' },
    { label: 'Customers', icon: '👥', route: '/admin/customers' },
  ];
  menuOpen = false;

  constructor(public authService: AuthService, private router: Router) {}
  logout(): void { this.authService.logout(); }
  getUserEmail(): string { return this.authService.getUserEmail() || 'Admin'; }
}
