import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const requiredRoles: string[] = route.data['roles'] || [];
  const userRole = auth.getRole();

  if (requiredRoles.length === 0 || (userRole && requiredRoles.includes(userRole))) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};
