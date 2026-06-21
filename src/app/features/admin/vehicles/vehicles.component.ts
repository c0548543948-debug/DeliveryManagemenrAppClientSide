import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehiclesService } from '../../../core/services/vehicles.service';
import { VehicleDto, VehicleType } from '../../../core/models/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { VehicleTypePipe } from '../../../shared/pipes/vehicle-type.pipe';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmDialogComponent, VehicleTypePipe],
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.scss']
})
export class VehiclesComponent implements OnInit {
  vehicles: VehicleDto[] = [];
  loading = true;
  showForm = false;
  vehicleForm!: FormGroup;
  editingVehicle: VehicleDto | null = null;
  message = '';
  messageType = '';
  deleteDialogVisible = false;
  vehicleToDelete: VehicleDto | null = null;

  vehicleTypes = [
    { value: VehicleType.Motorcycle, label: 'Motorcycle' },
    { value: VehicleType.Car, label: 'Car' },
    { value: VehicleType.Van, label: 'Van' },
    { value: VehicleType.Truck, label: 'Truck' },
  ];

  constructor(private vehiclesService: VehiclesService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.vehicleForm = this.fb.group({
      type: [VehicleType.Car, Validators.required],
      capacityWeight: [0, [Validators.required, Validators.min(0)]],
      capacityVolume: [0, [Validators.required, Validators.min(0)]],
      licensePlate: ['', Validators.required]
    });
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading = true;
    this.vehiclesService.getVehicles().subscribe({
      next: (v) => { this.vehicles = v; this.loading = false; },
      error: () => { this.showMessage('Failed to load vehicles', 'error'); this.loading = false; }
    });
  }

  openAddForm(): void {
    this.editingVehicle = null;
    this.vehicleForm.reset({ type: VehicleType.Car, capacityWeight: 0, capacityVolume: 0, licensePlate: '' });
    this.showForm = true;
  }

  editVehicle(v: VehicleDto): void {
    this.editingVehicle = v;
    this.vehicleForm.patchValue({ type: v.type, capacityWeight: v.capacityWeight, capacityVolume: v.capacityVolume, licensePlate: v.licensePlate });
    this.showForm = true;
  }

  saveForm(): void {
    if (this.vehicleForm.invalid) return;
    const data = this.vehicleForm.value;
    const obs = this.editingVehicle
      ? this.vehiclesService.updateVehicle(this.editingVehicle.vehicleId, data)
      : this.vehiclesService.createVehicle(data);
    obs.subscribe({
      next: () => { this.showForm = false; this.loadVehicles(); this.showMessage('Saved', 'success'); },
      error: () => this.showMessage('Operation failed', 'error')
    });
  }

  confirmDelete(v: VehicleDto): void { this.vehicleToDelete = v; this.deleteDialogVisible = true; }

  onDeleteConfirmed(): void {
    if (!this.vehicleToDelete) return;
    this.deleteDialogVisible = false;
    this.vehiclesService.deleteVehicle(this.vehicleToDelete.vehicleId).subscribe({
      next: () => { this.loadVehicles(); this.showMessage('Deleted', 'success'); },
      error: () => this.showMessage('Failed to delete', 'error')
    });
    this.vehicleToDelete = null;
  }

  onDeleteCancelled(): void { this.deleteDialogVisible = false; this.vehicleToDelete = null; }

  showMessage(msg: string, type: string): void {
    this.message = msg; this.messageType = type;
    setTimeout(() => this.message = '', 3000);
  }
}
