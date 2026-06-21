import { Pipe, PipeTransform } from '@angular/core';
import { OrderStatus } from '../../core/models/models';

@Pipe({ name: 'orderStatus', standalone: true })
export class OrderStatusPipe implements PipeTransform {
  transform(value: OrderStatus | number): string {
    switch (value) {
      case OrderStatus.Pending: return 'Pending';
      case OrderStatus.Assigned: return 'Assigned';
      case OrderStatus.InTransit: return 'In Transit';
      case OrderStatus.Delivered: return 'Delivered';
      case OrderStatus.Cancelled: return 'Cancelled';
      default: return 'Unknown';
    }
  }
}
