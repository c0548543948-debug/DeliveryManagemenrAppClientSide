import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },

  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },

  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrator'] },
    loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/admin/orders/orders.component').then(m => m.OrdersComponent)
      },
      {
        path: 'couriers',
        loadComponent: () => import('./features/admin/couriers/couriers.component').then(m => m.CouriersComponent)
      },
      {
        path: 'vehicles',
        loadComponent: () => import('./features/admin/vehicles/vehicles.component').then(m => m.VehiclesComponent)
      },
      {
        path: 'routes',
        loadComponent: () => import('./features/admin/routes/routes.component').then(m => m.RoutesAdminComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/admin/customers/customers.component').then(m => m.CustomersComponent)
      },
    ]
  },

  {
    path: 'customer',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Customer'] },
    loadComponent: () => import('./features/customer/customer-layout/customer-layout.component').then(m => m.CustomerLayoutComponent),
    children: [
      { path: '', redirectTo: 'my-orders', pathMatch: 'full' },
      {
        path: 'my-orders',
        loadComponent: () => import('./features/customer/my-orders/my-orders.component').then(m => m.MyOrdersComponent)
      },
      {
        path: 'place-order',
        loadComponent: () => import('./features/customer/place-order/place-order.component').then(m => m.PlaceOrderComponent)
      },
      {
        path: 'track-order/:orderId',
        loadComponent: () => import('./features/customer/track-order/track-order.component').then(m => m.TrackOrderComponent)
      },
    ]
  },

  {
    path: 'courier',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Courier'] },
    loadComponent: () => import('./features/courier/courier-layout/courier-layout.component').then(m => m.CourierLayoutComponent),
    children: [
      { path: '', redirectTo: 'my-routes', pathMatch: 'full' },
      {
        path: 'my-routes',
        loadComponent: () => import('./features/courier/my-routes/my-routes.component').then(m => m.MyRoutesComponent)
      },
      {
        path: 'route-detail/:routeId',
        loadComponent: () => import('./features/courier/route-detail/route-detail.component').then(m => m.RouteDetailComponent)
      },
    ]
  },

  {
    path: 'unauthorized',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  { path: '**', redirectTo: '/' }
];
