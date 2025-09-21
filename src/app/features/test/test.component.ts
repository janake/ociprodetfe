import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { TestService } from '../../core/services/test.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { TestMessage } from '../../core/models/test-message.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-test',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe, RouterLink],
  template: `
    <div class="container">
      <h1>Teszt Oldal</h1>
      <p class="welcome-text">Üdvözöljük a teszt oldalon!</p>
      <div [class]="messageBoxClass()">
        @if (error()) {
          <div class="error-message">{{ error() }}</div>
        } @else if (message()) {
          <div class="success-message">{{ message() | json }}</div>
        } @else {
          <div class="loading-message">Üzenet betöltése a szerverről...</div>
        }
      </div>
      <a [routerLink]="['/']" class="back-link">Vissza a főoldalra</a>
    </div>
  `,
  styles: [
    `.container {
      padding: 2rem;
      max-width: 800px;
      margin: 2rem auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    h1 {
      margin: 0 0 1rem;
      color: #1a365d;
      text-align: center;
      font-size: 2rem;
    }
    .welcome-text {
      text-align: center;
      color: #4a5568;
      font-size: 1.2rem;
      margin-bottom: 2rem;
    }
    .message-box {
      padding: 1.5rem;
      border-radius: 6px;
      background: #f7fafc;
      text-align: center;
    }
    .message-box.success {
      background: #dcfce7;
    }
    .message-box.error {
      background: #fee2e2;
    }
    .message-box.loading {
      background: #f3f4f6;
    }
    .success-message {
      color: #2f855a;
      font-size: 1.1rem;
    }
    .error-message {
      color: #c53030;
      font-size: 1.1rem;
    }
    .loading-message {
      color: #718096;
      font-style: italic;
    }
    .back-link {
      display: inline-block;
      margin-top: 2rem;
      color: #1976d2;
      text-decoration: underline;
      font-size: 1.1rem;
      cursor: pointer;
      transition: color 0.2s;
    }
    .back-link:hover {
      color: #0d47a1;
    }
    `
  ]
})
export class TestComponent {
  private readonly testService = inject(TestService);
  protected readonly error = signal<string | null>(null);
  protected readonly message = toSignal(
    this.testService.getMessage().pipe(
      map((response: unknown) => {
        console.log('TestComponent: HTTP response received', response);
        return response;
      }),
      catchError(err => {
        const isParsingError = typeof err.message === 'string' && err.message.includes('Http failure during parsing');
        const errorMessage = err.status === 0
          ? 'Nem sikerült kapcsolódni a szerverhez. Kérjük ellenőrizze, hogy fut-e a backend a 8080-as porton.'
          : `Hiba történt: ${err.message}`;
        if (isParsingError) {
          console.error('Hiba történt: Http failure during parsing for http://localhost:8080/api/teszt', err);
        }
        this.error.set(errorMessage);
        return of(null);
      })
    ),
    { initialValue: null }
  );
  protected readonly messageBoxClass = computed(() => {
    if (this.error()) return 'message-box error';
    if (this.message()) return 'message-box success';
    return 'message-box loading';
  });
}
