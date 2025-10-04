import { inject, Injectable, signal } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly keycloak = inject(KeycloakService);

  // Expose a reactive logged-in state (lazy populated) – can be expanded later
  private readonly _loggedIn = signal<boolean>(false);
  readonly loggedIn = this._loggedIn;

  async refreshLoginState(): Promise<boolean> {
    try {
      const v = await this.keycloak.isLoggedIn();
      this._loggedIn.set(v);
      return v;
    } catch {
      this._loggedIn.set(false);
      return false;
    }
  }

  async isLoggedIn(): Promise<boolean> {
    // Keep a single canonical method returning the Promise<boolean>
    return this.keycloak.isLoggedIn();
  }

  async userProfile(): Promise<KeycloakProfile | null> {
    try {
      if (!(await this.keycloak.isLoggedIn())) return null;
      return await this.keycloak.loadUserProfile();
    } catch {
      return null;
    }
  }

  login(): Promise<void> {
    return this.keycloak.login();
  }

  logout(): Promise<void> {
    return this.keycloak.logout();
  }

  async getToken(): Promise<string | null> {
    try {
      if (!(await this.keycloak.isLoggedIn())) return null;
      await this.keycloak.updateToken(15);
      return await this.keycloak.getToken();
    } catch {
      return null;
    }
  }
}
