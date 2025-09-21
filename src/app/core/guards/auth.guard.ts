import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const authGuard: CanActivateFn = (route, state) => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  return new Promise(async (resolve, reject) => {
    if (await keycloak.isLoggedIn()) {
      resolve(true);
    } else {
      await keycloak.login({
        redirectUri: window.location.origin + state.url,
      });
      resolve(false);
    }
  });
};

