import { inject, Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly keycloak = inject(KeycloakService);

  public get isLoggedIn(): Promise<boolean> {
    return Promise.resolve(this.keycloak.isLoggedIn());
  }

  public get userProfile(): Promise<KeycloakProfile | null> {
    return this.keycloak.loadUserProfile();
  }

  public login(): void {
    this.keycloak.login();
  }

  public logout(): void {
    this.keycloak.logout(window.location.origin).then();
  }
}
