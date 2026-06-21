import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CouriersService } from '../../../core/services/couriers.service';
import { CourierDto } from '../../../core/models/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-couriers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmDialogComponent],
  templateUrl: './couriers.component.html',
  styleUrls: ['./couriers.component.scss']
})
export class CouriersComponent implements OnInit {
  couriers: CourierDto[] = [];
  loading = true;
  showForm = false;
  courierForm!: FormGroup;
  editingCourier: CourierDto | null = null;
  message = '';
  messageType = '';
  deleteDialogVisible = false;
  courierToDelete: CourierDto | null = null;

  constructor(private couriersService: CouriersService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.courierForm = this.fb.group({ applicationUserId: ['', Validators.required] });
    this.loadCouriers();
  }

  loadCouriers(): void {
    this.loading = true;
    this.couriersService.getCouriers().subscribe({
      next: (c) => { this.couriers = c; this.loading = false; },
      error: () => { this.showMessage('Failed to load couriers', 'error'); this.loading = false; }
    });
  }

  openAddForm(): void { this.editingCourier = null; this.courierForm.reset(); this.showForm = true; }

  editCourier(c: CourierDto): void {
    this.editingCourier = c;
    this.courierForm.patchValue({ applicationUserId: c.applicationUserId });
    this.showForm = true;
  }

  saveForm(): void {
    if (this.courierForm.invalid) return;
    const data = this.courierForm.value;
    const obs = this.editingCourier
      ? this.couriersService.updateCourier(this.editingCourier.courierId, data)
      : this.couriersService.createCourier(data);
    obs.subscribe({
      next: () => { this.showForm = false; this.loadCouriers(); this.showMessage(this.editingCourier ? 'Updated' : 'Created', 'success'); },
      error: () => this.showMessage('Operation failed', 'error')
    });
  }

  confirmDelete(c: CourierDto): void { this.courierToDelete = c; this.deleteDialogVisible = true; }

  onDeleteConfirmed(): void {
    if (!this.courierToDelete) return;
    this.deleteDialogVisible = false;
    this.couriersService.deleteCourier(this.courierToDelete.courierId).subscribe({
      next: () => { this.loadCouriers(); this.showMessage('Deleted', 'success'); },
      error: () => this.showMessage('Failed to delete', 'error')
    });
    this.courierToDelete = null;
  }

  onDeleteCancelled(): void { this.deleteDialogVisible = false; this.courierToDelete = null; }

  showMessage(msg: string, type: string): void {
    this.message = msg; this.messageType = type;
    setTimeout(() => this.message = '', 3000);
  }
}
