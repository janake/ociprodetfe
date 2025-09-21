import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  template: `
    <a [routerLink]="['/test']" class="test-link">Tovább a teszt oldalra</a>
  `,
  styles: [
    `.test-link { font-size: 1.2rem; color: #1976d2; text-decoration: underline; cursor: pointer; }`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink]
})
export class HomePage {
  constructor() {
    console.log('HomePage component rendered');
  }
}
