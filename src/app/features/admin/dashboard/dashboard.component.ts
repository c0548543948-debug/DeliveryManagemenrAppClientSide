import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../../core/services/orders.service';
import { OrderDto, OrderStatus } from '../../../core/models/models';

interface StatCard { title: string; value: number; icon: string; colorClass: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  loading = true;
  stats: StatCard[] = [];
  recentOrders: OrderDto[] = [];

  constructor(private ordersService: OrdersService) {}

  ngOnInit(): void {
    this.ordersService.getOrders().subscribe({
      next: (orders) => {
        this.recentOrders = orders.slice(0, 5);
        this.buildStats(orders);
        this.loading = false;
      },
      error: () => { this.buildStats([]); this.loading = false; }
    });
  }

  private buildStats(orders: OrderDto[]): void {
    const today = new Date().toISOString().split('T')[0];
    this.stats = [
      { title: 'Total Orders', value: orders.length, icon: '📋', colorClass: 'stat-blue' },
      { title: 'Pending', value: orders.filter(o => o.status === OrderStatus.Pending).length, icon: '⏳', colorClass: 'stat-orange' },
      { title: 'In Transit', value: orders.filter(o => o.status === OrderStatus.InTransit).length, icon: '🚚', colorClass: 'stat-green' },
      { title: 'Delivered Today', value: orders.filter(o => o.status === OrderStatus.Delivered && o.requiredDate === today).length, icon: '✅', colorClass: 'stat-purple' },
    ];
  }

  getStatusLabel(status: OrderStatus): string {
    const map: Record<number, string> = { 0: 'Pending', 1: 'Assigned', 2: 'In Transit', 3: 'Delivered', 4: 'Cancelled' };
    return map[status] || 'Unknown';
  }
}
