import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-upload-object',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  template: `
    <div class="upload-object-container">
      <mat-card>
        <mat-card-title>Fájlok feltöltése (Object Storage)</mat-card-title>
        <mat-card-content>
          <p>Ez a külön nézet az Object Storage feltöltéshez. Jelenleg csak a Mégse gomb érhető el.</p>
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-button color="primary" (click)="goHome()">Mégse</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .upload-object-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
    }
    mat-card {
      max-width: 520px;
      width: 100%;
    }
    mat-card-title {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    p {
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadObjectComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigateByUrl('/');
  }
}
