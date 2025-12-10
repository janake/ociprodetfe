import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

// Small helper to retry dynamic imports if the dev server restarts or a chunk name changes
function retryImport<T>(loader: () => Promise<T>, retries = 2, delayMs = 300): Promise<T> {
  return loader().catch((err) => {
    if (retries <= 0) throw err;
    return new Promise<void>((res) => setTimeout(res, delayMs)).then(() =>
      retryImport(loader, retries - 1, Math.min(delayMs * 2, 2000))
    );
  });
}

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => retryImport(() => import('./features/home/home').then(m => m.HomePage))
  },
  {
    path: 'test',
    loadComponent: () => retryImport(() => import('./features/test/test.component').then(m => m.TestComponent)),
    canActivate: [authGuard]
  },
  {
    path: 'upload',
    loadComponent: () => retryImport(() => import('./features/upload/upload').then(m => m.UploadComponent)),
    canActivate: [authGuard]
  },
  {
    path: 'upload-storage',
    loadComponent: () => retryImport(() => import('./features/upload-storage/upload-storage').then(m => m.UploadStorageComponent)),
    canActivate: [authGuard]
  },
  {
    path: 'upload-object',
    loadComponent: () => retryImport(() => import('./features/upload-object/upload-object').then(m => m.UploadObjectComponent)),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
