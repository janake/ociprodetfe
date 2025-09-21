import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { from, switchMap } from 'rxjs';

function isKeycloakUrl(url: string): boolean {
  if (!/^https?:\/\//.test(url)) return false;
  try {
    const u = new URL(url);
    return (
      u.hostname === 'kc.prodet.org' ||
      u.pathname.includes('/realms/') && u.pathname.includes('/protocol/openid-connect/')
    );
  } catch {
    return false;
  }
}

function isStaticAsset(url: string): boolean {
  return url.startsWith('/assets') || url.startsWith('assets') || url.startsWith('/public');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloak = inject(KeycloakService);

  // Attach token to all app HTTP calls except Keycloak endpoints and static assets
  const isAppHttpCall = !isKeycloakUrl(req.url) && !isStaticAsset(req.url);

  if (!isAppHttpCall) {
    return next(req);
  }

  // Ensure we always work with a Promise<boolean> for compatibility
  return from(Promise.resolve(keycloak.isLoggedIn())).pipe(
    switchMap((isLoggedIn) => {
      if (!isLoggedIn) {
        return next(req);
      }

      // Refresh token if near expiry, then attach it
      return from(keycloak.updateToken(10)).pipe(
        switchMap(() => from(keycloak.getToken())),
        switchMap((token) => {
          const authReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          });
          return next(authReq);
        })
      );
    })
  );
};
