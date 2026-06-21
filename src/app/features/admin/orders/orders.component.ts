import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../../../core/services/orders.service';
import { OrderDto, OrderStatus } from '../../../core/models/models';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusChipComponent, ConfirmDialogComponent],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  allOrders: OrderDto[] = [];
  filteredOrders: OrderDto[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';
  searchText = '';
  statusFilter = '';
  deleteDialogVisible = false;
  orderToDelete: OrderDto | null = null;

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: '0', label: 'Pending' },
    { value: '1', label: 'Assigned' },
    { value: '2', label: 'In Transit' },
    { value: '3', label: 'Delivered' },
    { value: '4', label: 'Cancelled' },
  ];

  // Pagination
  currentPage = 1;
  pageSize = 15;

  constructor(private ordersService: OrdersService) {}

  ngOnInit(): void { this.loadOrders(); }

  loadOrders(): void {
    this.loading = true;
    this.ordersService.getOrders().subscribe({
      next: (orders) => {
        this.allOrders = orders;
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.errorMessage = 'Failed to load orders'; this.loading = false; }
    });
  }

  applyFilter(): void {
    let result = this.allOrders;
    if (this.searchText) {
      const s = this.searchText.toLowerCase();
      result = result.filter(o =>
        o.originAddress.toLowerCase().includes(s) ||
        o.destinationAddress.toLowerCase().includes(s) ||
        o.orderId.toString().includes(s)
      );
    }
    if (this.statusFilter !== '') {
      result = result.filter(o => o.status.toString() === this.statusFilter);
    }
    this.filteredOrders = result;
    this.currentPage = 1;
  }

  get pagedOrders(): OrderDto[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  get totalPages(): number { return Math.ceil(this.filteredOrders.length / this.pageSize); }

  confirmDelete(order: OrderDto): void {
    this.orderToDelete = order;
    this.deleteDialogVisible = true;
  }

  onDeleteConfirmed(): void {
    if (!this.orderToDelete) return;
    this.deleteDialogVisible = false;
    this.ordersService.deleteOrder(this.orderToDelete.orderId).subscribe({
      next: () => { this.successMessage = 'Order deleted'; this.loadOrders(); setTimeout(() => this.successMessage = '', 3000); },
      error: () => { this.errorMessage = 'Failed to delete'; setTimeout(() => this.errorMessage = '', 3000); }
    });
    this.orderToDelete = null;
  }

  onDeleteCancelled(): void { this.deleteDialogVisible = false; this.orderToDelete = null; }
}
