import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-test',
  template: `
    <h1>Welcome to the Test Page!</h1>
  `,
  styles: [
    `h1 { font-size: 2rem; color: #388e3c; margin-top: 2rem; }`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestComponent {}
