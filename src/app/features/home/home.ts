import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { JsonPipe } from '@angular/common';
import { KeycloakProfile } from 'keycloak-js';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, JsonPipe],
  template: `
    <div class="container">
      <h1>Kezdőoldal</h1>
      <div class="content">
        @if (isLoggedIn()) {
          <p>Üdvözöljük, {{ userProfile()?.firstName }}!</p>
          <a routerLink="/test" class="nav-button">
            Teszt oldal megtekintése
          </a>
          <button (click)="logout()" class="nav-button">
            Kijelentkezés
          </button>
        } @else {
          <p>Kérjük, jelentkezzen be a folytatáshoz.</p>
          <button (click)="login()" class="nav-button">
            Bejelentkezés
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 2rem;
      max-width: 800px;
      margin: 2rem auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    h1 {
      color: #1a365d;
      margin-bottom: 2rem;
    }

    .content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }

    p {
      font-size: 1.2rem;
      color: #4a5568;
    }

    .nav-button {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background-color: #3182ce;
      color: white;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      transition: background-color 0.2s;
      border: none;
      cursor: pointer;

      &:hover {
        background-color: #2c5282;
      }
    }
  `]
})
export class HomePage {
  private readonly authService = inject(AuthService);

  isLoggedIn = signal(false);
  userProfile = signal<KeycloakProfile | null>(null);

  constructor() {
    this.authService.isLoggedIn.then((loggedIn: boolean) => this.isLoggedIn.set(loggedIn));
    this.authService.userProfile.then(profile => this.userProfile.set(profile));
  }

  login(): void {
    this.authService.login();
  }

  logout(): void {
    this.authService.logout();
  }
}
