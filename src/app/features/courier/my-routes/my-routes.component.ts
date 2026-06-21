import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoutesService } from '../../../core/services/routes.service';
import { RouteDto } from '../../../core/models/models';

@Component({
  selector: 'app-my-routes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-routes.component.html',
  styleUrls: ['./my-routes.component.scss']
})
export class MyRoutesComponent implements OnInit {
  routes: RouteDto[] = [];
  todayRoutes: RouteDto[] = [];
  otherRoutes: RouteDto[] = [];
  loading = true;
  errorMessage = '';
  today = new Date().toISOString().split('T')[0];

  constructor(private routesService: RoutesService) {}

  ngOnInit(): void {
    this.routesService.getRoutes().subscribe({
      next: (routes) => {
        this.routes = routes;
        this.todayRoutes = routes.filter(r => r.date === this.today);
        this.otherRoutes = routes.filter(r => r.date !== this.today);
        this.loading = false;
      },
      error: () => { this.errorMessage = 'Failed to load routes'; this.loading = false; }
    });
  }
}
