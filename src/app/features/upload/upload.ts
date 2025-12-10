import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { UploadService } from './upload.service';
import { HttpEventType } from '@angular/common/http';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

interface UploadResponse {
  message: string;
  fileName: string;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

@Component({
  selector: 'app-upload',
  template: `
    <div class="upload-container" [@fade]="'in'">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Fájl feltöltés</mat-card-title>
          <mat-card-subtitle>Húzd ide a fájlt, vagy kattints a feltöltéshez</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @switch (status()) {
            @case ('uploading') {
              <div class="upload-progress-container">
                <p>Feltöltés folyamatban...</p>
                <mat-progress-bar [mode]="hasTotal() ? 'determinate' : 'indeterminate'" [value]="hasTotal() ? uploadProgress() : null"></mat-progress-bar>
                <p class="progress-text">{{ uploadProgress() }}%</p>
              </div>
            }
            @case ('success') {
              <div class="upload-success-container">
                <mat-icon class="success-icon">check_circle</mat-icon>
                <p>Sikeres feltöltés!</p>
              </div>
            }
            @default {
              <div class="drop-zone"
                   [class.drag-over]="dragOver()"
                   (click)="fileUpload.click()"
                   (dragover)="onDragOver($event)"
                   (dragleave)="onDragLeave($event)"
                   (drop)="onDrop($event)">
                <mat-icon>cloud_upload</mat-icon>
                @if (fileName()) {
                  <p class="file-name">{{ fileName() }}</p>
                } @else {
                  <p>Húzd ide a fájlt, vagy kattints a kiválasztáshoz</p>
                }
                <input hidden type="file" (change)="onFileSelected($event)" #fileUpload>
              </div>
            }
          }
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-button (click)="cancelUpload()">Mégse</button>
          <button mat-raised-button color="primary" [disabled]="!selectedFile() || status() === 'uploading'" (click)="onUpload()">
            <mat-icon>file_upload</mat-icon>
            <span>Feltöltés</span>
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      --primary-color: #3f51b5;
      --accent-color: #f0f4ff;
      --success-color: #4caf50;
    }

    .upload-container {
      width: 100%;
      max-width: 500px;
    }

    mat-card {
      text-align: center;
      padding: 1rem;
    }

    mat-card-subtitle {
      margin-bottom: 1.5rem;
    }

    .drop-zone {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 2.5rem;
      cursor: pointer;
      transition: all 0.3s ease-in-out;
      background-color: #fafafa;
      margin-bottom: 1rem;
    }

    .drop-zone:hover, .drop-zone.drag-over {
      border-color: var(--primary-color);
      background-color: var(--accent-color);
      transform: scale(1.02);
    }

    .drop-zone mat-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: var(--primary-color);
      margin-bottom: 1rem;
    }

    .drop-zone .file-name {
      font-weight: 500;
      color: var(--primary-color);
    }

    .upload-progress-container, .upload-success-container {
      padding: 2.5rem;
      min-height: 180px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .progress-text {
      margin-top: 0.5rem;
      font-weight: 500;
    }

    .success-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--success-color);
      animation: pop-in 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    }

    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 0 24px 24px;
    }

    @keyframes pop-in {
      0% { transform: scale(0); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressBarModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule
  ],
  animations: [
    trigger('fade', [
      transition('void => *', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class UploadComponent {
  private uploadService = inject(UploadService);
  private snackBar = inject(MatSnackBar);
  private location = inject(Location);
  private router = inject(Router);

  private uploadSub: Subscription | null = null;

  selectedFile = signal<File | null>(null);
  fileName = signal('');
  uploadProgress = signal(0);
  status = signal<UploadStatus>('idle');
  dragOver = signal(false);
  hasTotal = signal(false);

  private static readonly MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file) {
      if (file.size > UploadComponent.MAX_FILE_SIZE_BYTES) {
        this.snackBar.open('A fájl túl nagy (max. 50MB).', 'Bezár', { duration: 3000 });
        input.value = '';
        return;
      }
      this.selectedFile.set(file);
      this.fileName.set(file.name);
      this.status.set('idle');
    }
  }

  onUpload(): void {
    const file = this.selectedFile();
    if (!file) return;

    // Cancel previous in-flight upload if any
    this.uploadSub?.unsubscribe();
    this.uploadProgress.set(0);
    this.hasTotal.set(false);
    this.status.set('uploading');

    this.uploadSub = this.uploadService.upload(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total ?? 0;
          this.hasTotal.set(!!event.total && event.total > 0);
          const ratio = total > 0 ? event.loaded / total : 0;
          this.uploadProgress.set(Math.round(ratio * 100));
        } else if (event.type === HttpEventType.Response) {
          const body = (event.body ?? {}) as Partial<UploadResponse>;
          this.status.set('success');
          this.snackBar.open(body.message ?? 'Sikeres feltöltés!', 'Bezár', { duration: 3000 });
          this.cleanupUploadSub();
          setTimeout(() => this.location.back(), 2000);
        }
      },
      error: (err) => {
        this.status.set('error');
        const backendMsg = (err && typeof err === 'object' && 'error' in err && (err as any).error && typeof (err as any).error === 'object' && 'message' in (err as any).error)
          ? (err as any).error.message as string
          : null;
        this.snackBar.open(backendMsg ?? 'Hiba történt a feltöltés során.', 'Bezár', { duration: 4000 });
        this.cleanupUploadSub();
        this.reset(); // allow retry
      }
    });
  }

  cancelUpload(): void {
    if (this.uploadSub) {
      this.uploadSub.unsubscribe();
      this.snackBar.open('Feltöltés megszakítva.', 'Bezár', { duration: 2000 });
    }
    this.cleanupUploadSub();
    this.reset();
    this.router.navigateByUrl('/');
  }

  private cleanupUploadSub(): void {
    this.uploadSub = null;
  }

  private reset(): void {
    this.selectedFile.set(null);
    this.fileName.set('');
    this.uploadProgress.set(0);
    this.status.set('idle');
    this.dragOver.set(false);
    this.hasTotal.set(false);
  }

  // Drag and drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0] ?? null;
    if (file) {
      if (file.size > UploadComponent.MAX_FILE_SIZE_BYTES) {
        this.snackBar.open('A fájl túl nagy (max. 50MB).', 'Bezár', { duration: 3000 });
        return;
      }
      this.selectedFile.set(file);
      this.fileName.set(file.name);
      this.status.set('idle');
    }
  }
}
