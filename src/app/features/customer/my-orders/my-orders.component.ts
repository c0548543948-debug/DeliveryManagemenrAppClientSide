import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrdersService } from '../../../core/services/orders.service';
import { OrderDto, OrderStatus } from '../../../core/models/models';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusChipComponent],
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss']
})
export class MyOrdersComponent implements OnInit {
  orders: OrderDto[] = [];
  loading = true;
  errorMessage = '';
  OrderStatus = OrderStatus;

  constructor(private ordersService: OrdersService) {}

  ngOnInit(): void {
    this.ordersService.getOrders().subscribe({
      next: (o) => { this.orders = o; this.loading = false; },
      error: () => { this.errorMessage = 'Failed to load orders'; this.loading = false; }
    });
  }

  canTrack(order: OrderDto): boolean { return order.status === OrderStatus.InTransit; }
}
