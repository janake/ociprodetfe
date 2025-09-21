import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { UploadService } from './upload.service';
import { HttpEventType } from '@angular/common/http';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { animate, style, transition, trigger } from '@angular/animations';

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
                <mat-progress-bar mode="determinate" [value]="uploadProgress()"></mat-progress-bar>
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
          <button mat-button (click)="cancelUpload()" [disabled]="status() === 'uploading'">Mégse</button>
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

      &:hover, &.drag-over {
        border-color: var(--primary-color);
        background-color: var(--accent-color);
        transform: scale(1.02);
      }

      mat-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: var(--primary-color);
        margin-bottom: 1rem;
      }

      .file-name {
        font-weight: 500;
        color: var(--primary-color);
      }
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
  standalone: true,
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

  selectedFile = signal<File | null>(null);
  fileName = signal('');
  uploadProgress = signal(0);
  status = signal<UploadStatus>('idle');

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile.set(file);
      this.fileName.set(file.name);
      this.status.set('idle');
    }
  }

  onUpload(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.status.set('uploading');
    this.uploadService.upload(file).subscribe({
      next: event => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress.set(Math.round(100 * (event.loaded / (event.total || 1))));
        } else if (event.type === HttpEventType.Response) {
          const body = event.body as UploadResponse;
          this.status.set('success');
          this.snackBar.open(body.message || 'Sikeres feltöltés!', 'Bezár', { duration: 3000 });
          setTimeout(() => {
            this.location.back();
          }, 2000);
        }
      },
      error: () => {
        this.status.set('error');
        this.snackBar.open('Hiba történt a feltöltés során.', 'Bezár', { duration: 3000 });
        this.reset(); // Reset on error to allow retry
      }
    });
  }

  cancelUpload(): void {
    if (this.status() === 'uploading') {
      // TODO: Implement actual upload cancellation if the service supports it
      this.snackBar.open('Feltöltés megszakítva.', 'Bezár', { duration: 2000 });
    }
    this.reset();
  }

  private reset(): void {
    this.selectedFile.set(null);
    this.fileName.set('');
    this.uploadProgress.set(0);
    this.status.set('idle');
  }

  // Drag and drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.add('drag-over');
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.selectedFile.set(file);
      this.fileName.set(file.name);
      this.status.set('idle');
    }
  }
}
