import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-courier-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="courier-layout">
      <nav class="topnav">
        <div class="nav-brand">🚴 Courier Portal</div>
        <div class="nav-links">
          <a routerLink="/courier/my-routes" routerLinkActive="active">🗺️ My Routes</a>
        </div>
        <div class="nav-user">
          <span class="user-email">{{ authService.getUserEmail() }}</span>
          <button class="btn btn-ghost btn-sm" (click)="logout()">Logout</button>
        </div>
      </nav>
      <div class="content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .courier-layout { min-height: 100vh; background: #f5f5f5; }
    .topnav {
      background: #1b5e20; color: white; padding: 0 24px; height: 56px;
      display: flex; align-items: center; gap: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      .nav-brand { font-size: 18px; font-weight: 700; white-space: nowrap; }
      .nav-links { display: flex; gap: 8px; flex: 1;
        a { color: rgba(255,255,255,0.85); text-decoration: none; padding: 6px 12px; border-radius: 4px; font-size: 14px;
          &:hover, &.active { background: rgba(255,255,255,0.15); color: white; }
        }
      }
      .nav-user { display: flex; align-items: center; gap: 12px; .user-email { font-size: 13px; color: rgba(255,255,255,0.75); } }
    }
    .content { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
  `]
})
export class CourierLayoutComponent {
  constructor(public authService: AuthService) {}
  logout(): void { this.authService.logout(); }
}
