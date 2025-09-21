import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then(m => m.HomePage)
  },
  {
    path: 'test',
    loadComponent: () => import('./features/test/test.component').then(m => m.TestComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
