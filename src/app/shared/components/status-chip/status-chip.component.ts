import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus } from '../../../core/models/models';
import { OrderStatusPipe } from '../../pipes/order-status.pipe';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [CommonModule, OrderStatusPipe],
  template: `<span [class]="'badge ' + getClass()">{{ status | orderStatus }}</span>`,
  styles: []
})
export class StatusChipComponent {
  @Input() status!: OrderStatus;
  getClass(): string {
    switch (this.status) {
      case OrderStatus.Pending: return 'badge-pending';
      case OrderStatus.Assigned: return 'badge-assigned';
      case OrderStatus.InTransit: return 'badge-transit';
      case OrderStatus.Delivered: return 'badge-delivered';
      case OrderStatus.Cancelled: return 'badge-cancelled';
      default: return '';
    }
  }
}
