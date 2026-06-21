export interface OrderDto {
  orderId: number;
  customerId: number;
  originAddress: string;
  destinationAddress: string;
  weight: number;
  volume: number;
  requiredDate: string;
  price: number;
  status: OrderStatus;
  deliveryImageUrl?: string;
}

export enum OrderStatus {
  Pending = 0,
  Assigned = 1,
  InTransit = 2,
  Delivered = 3,
  Cancelled = 4
}

export interface CourierDto {
  courierId: number;
  applicationUserId: string;
}

export interface CustomerDto {
  customerId: number;
  applicationUserId: string;
  phone: string;
}

export interface VehicleDto {
  vehicleId: number;
  type: VehicleType;
  capacityVolume: number;
  capacityWeight: number;
  licensePlate: string;
}

export enum VehicleType {
  Motorcycle = 0,
  Car = 1,
  Van = 2,
  Truck = 3
}

export interface RouteDto {
  routeId: number;
  courierId: number;
  vehicleId?: number;
  date: string;
  startTime: string;
  endTime: string;
  items: RouteItemDto[];
}

export interface RouteItemDto {
  id: number;
  orderId: number;
  stopOrder: number;
  stopType: StopType;
  estimatedArrival?: string;
}

export enum StopType {
  Pickup = 0,
  Delivery = 1
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}

export interface AddressValidationResult {
  isValid: boolean;
  formattedAddress: string;
  lat: number;
  lng: number;
}

export interface PriceCalculationRequest {
  originAddress: string;
  destinationAddress: string;
  weight: number;
  volume: number;
  requiredDate: string;
}

export interface PriceCalculationResult {
  price: number;
}

export interface CreateOrderRequest {
  originAddress: string;
  destinationAddress: string;
  weight: number;
  volume: number;
  requiredDate: string;
}

export interface CreateCourierRequest {
  applicationUserId: string;
}

export interface CreateVehicleRequest {
  type: VehicleType;
  capacityWeight: number;
  capacityVolume: number;
  licensePlate: string;
}

export interface OptimizeRoutesRequest {
  date: string;
}

export interface TrackingLocation {
  lat: number;
  lng: number;
  timestamp: Date;
}
