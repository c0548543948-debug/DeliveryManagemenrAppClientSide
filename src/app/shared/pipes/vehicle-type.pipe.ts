import { Pipe, PipeTransform } from '@angular/core';
import { VehicleType } from '../../core/models/models';

@Pipe({ name: 'vehicleType', standalone: true })
export class VehicleTypePipe implements PipeTransform {
  transform(value: VehicleType | number): string {
    switch (value) {
      case VehicleType.Motorcycle: return 'Motorcycle';
      case VehicleType.Car: return 'Car';
      case VehicleType.Van: return 'Van';
      case VehicleType.Truck: return 'Truck';
      default: return 'Unknown';
    }
  }
}
