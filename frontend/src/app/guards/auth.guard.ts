import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // Vérification des rôles si définis dans la route
    const expectedRoles = route.data?.['roles'] as string[];
    if (expectedRoles && expectedRoles.length > 0) {
      if (!authService.hasRole(expectedRoles)) {
        // Redirection vers le tableau de bord si le rôle n'est pas autorisé
        router.navigate(['/dashboard']);
        return false;
      }
    }
    return true;
  }

  // Redirection vers login si non connecté
  router.navigate(['/login']);
  return false;
};
