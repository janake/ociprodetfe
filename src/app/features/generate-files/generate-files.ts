import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { GenerateFilesService } from './generate-files.service';
import { GeneratedFile } from '../../core/models/generated-file.model';
import { GenerationRun } from '../../core/models/generation-run.model';

type GenerateStatus = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-generate-files',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-title>File Storage – fájl generálás</mat-card-title>
        <mat-card-content>
          <p class="hint">
            XML/JSON seed fájlok véletlen másolatai, DB metaadat mentéssel.
          </p>

          <div class="row">
            <mat-form-field appearance="outline" class="count-field" subscriptSizing="dynamic">
              <mat-label>Darabszám</mat-label>
              <input
                matInput
                type="number"
                min="1"
                max="1000"
                step="1"
                [ngModel]="count()"
                (ngModelChange)="onCountChange($event)"
              />
              <span matSuffix>db</span>
              <mat-hint>1–1000</mat-hint>
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="generate()" [disabled]="isGenerateDisabled()">
              <mat-icon aria-hidden="true">add</mat-icon>
              Generálás
            </button>

            <button mat-stroked-button (click)="syncAndRefresh()" [disabled]="loadingList() || status() === 'loading'">
              <mat-icon aria-hidden="true">sync</mat-icon>
              Frissítés
            </button>

            <button mat-stroked-button color="warn" (click)="cleanAll()" [disabled]="loadingList() || status() === 'loading'">
              <mat-icon aria-hidden="true">delete_forever</mat-icon>
              Clean
            </button>

            @if (showBackButton()) {
              <button mat-stroked-button (click)="goBack()" [disabled]="status() === 'loading'">
                <mat-icon aria-hidden="true">close</mat-icon>
                {{ backLabel() }}
              </button>
            }
          </div>

          @if (loadingList() && results().length === 0 && status() !== 'loading') {
            <div class="loading">
              <mat-spinner diameter="24"></mat-spinner>
              <span>Adatok betöltése a DB-ből...</span>
            </div>
          }

          @if (status() === 'loading') {
            <div class="loading">
              <mat-spinner diameter="24"></mat-spinner>
              <span>Fájlok készülnek...</span>
            </div>
          }

          @if (status() === 'error') {
            <div class="error">{{ error() }}</div>
          }

          @if (status() === 'success') {
            <div class="success">Elkészült: {{ results().length }} db</div>
          }

          @if (lastAction()) {
            <div class="success">{{ lastAction() }}</div>
          }

          @if (!loadingList() && results().length === 0 && status() !== 'loading') {
            <div class="empty">Még nincs adat az adatbázisban.</div>
          }

          @if (generations().length > 0) {
            <div class="results">
              <h3>Generálási körök</h3>
              <div class="table-wrap">
                <table mat-table [dataSource]="generations()" class="results-table">
                  <ng-container matColumnDef="genId">
                    <th mat-header-cell *matHeaderCellDef class="right">Kör</th>
                    <td mat-cell *matCellDef="let g" class="right mono">#{{ g.id }}</td>
                  </ng-container>

                  <ng-container matColumnDef="count">
                    <th mat-header-cell *matHeaderCellDef>Darab</th>
                    <td mat-cell *matCellDef="let g" class="mono">
                      {{ g.createdCount ?? '-' }} / {{ g.requestedCount }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="started">
                    <th mat-header-cell *matHeaderCellDef>Indulás</th>
                    <td mat-cell *matCellDef="let g" class="mono">
                      {{ g.generationStartedAt | date: 'yyyy-MM-dd HH:mm:ss.SSS' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="finished">
                    <th mat-header-cell *matHeaderCellDef>Kész</th>
                    <td mat-cell *matCellDef="let g" class="mono">
                      {{ g.generationFinishedAt | date: 'yyyy-MM-dd HH:mm:ss.SSS' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="duration">
                    <th mat-header-cell *matHeaderCellDef class="right">Összidő</th>
                    <td mat-cell *matCellDef="let g" class="right mono">
                      {{ formatDurationMillis(g.durationMillis) }}
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="generationColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: generationColumns;"></tr>
                </table>
              </div>
            </div>
          }

          @if (results().length > 0) {
            <div class="results">
              <h3>Eredmények</h3>
              <div class="table-wrap">
                <table mat-table [dataSource]="results()" class="results-table">
                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef>Típus</th>
                    <td mat-cell *matCellDef="let item">
                      <span class="type-pill" [class.xml]="isXml(item.fileName)" [class.json]="isJson(item.fileName)">
                        <mat-icon class="type-icon" aria-hidden="true">{{ iconFor(item.fileName) }}</mat-icon>
                        {{ ext(item.fileName) }}
                      </span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="fileName">
                    <th mat-header-cell *matHeaderCellDef>Fájlnév</th>
                    <td mat-cell *matCellDef="let item">
                      <div class="file-name" [matTooltip]="item.fileName">{{ item.fileName }}</div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="size">
                    <th mat-header-cell *matHeaderCellDef class="right">Méret</th>
                    <td mat-cell *matCellDef="let item" class="right mono">{{ formatBytes(item.fileSizeBytes) }}</td>
                  </ng-container>

                  <ng-container matColumnDef="started">
                    <th mat-header-cell *matHeaderCellDef>Indulás</th>
                    <td mat-cell *matCellDef="let item" class="mono">
                      {{ item.creationStartedAt | date: 'yyyy-MM-dd HH:mm:ss.SSS' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="finished">
                    <th mat-header-cell *matHeaderCellDef>Kész</th>
                    <td mat-cell *matCellDef="let item" class="mono">
                      {{ item.creationFinishedAt | date: 'yyyy-MM-dd HH:mm:ss.SSS' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="path">
                    <th mat-header-cell *matHeaderCellDef>Útvonal</th>
                    <td mat-cell *matCellDef="let item">
                      <div class="path" [matTooltip]="item.storagePath">{{ item.storagePath }}</div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="id">
                    <th mat-header-cell *matHeaderCellDef class="right">#</th>
                    <td mat-cell *matCellDef="let item" class="right mono">#{{ item.id }}</td>
                  </ng-container>

                  <ng-container matColumnDef="generation">
                    <th mat-header-cell *matHeaderCellDef class="right">Kör</th>
                    <td mat-cell *matCellDef="let item" class="right mono">
                      @if (item.generationId != null) { #{{ item.generationId }} } @else { - }
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }
    mat-card {
      width: 100%;
      max-width: 920px;
    }
    mat-card-title {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .hint {
      margin: 0 0 1rem;
      color: #4a5568;
    }
    .row {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .row button mat-icon {
      margin-right: 0.35rem;
    }
    .row button {
      display: inline-flex;
      align-items: center;
      gap: 0.1rem;
    }
    .count-field {
      width: 220px;
    }
    .loading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0.75rem 0;
      color: #4a5568;
    }
    .empty {
      margin: 0.75rem 0;
      color: #4a5568;
      font-style: italic;
    }
    .error {
      background: #fee2e2;
      color: #991b1b;
      padding: 0.75rem;
      border-radius: 6px;
      margin: 0.75rem 0;
    }
    .success {
      background: #dcfce7;
      color: #166534;
      padding: 0.75rem;
      border-radius: 6px;
      margin: 0.75rem 0;
    }
    .results {
      margin-top: 1rem;
    }
    .results h3 {
      margin: 0 0 0.75rem;
      color: #1a365d;
    }
    .table-wrap {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      background: #fff;
    }
    .results-table {
      width: 100%;
    }
    .results-table :is(th, td) {
      vertical-align: middle;
    }
    .results-table th {
      background: #f8fafc;
      color: #1f2937;
      font-weight: 600;
      white-space: nowrap;
    }
    .results-table tr:nth-child(even) td {
      background: #fcfcfd;
    }
    .results-table tr:hover td {
      background: #f1f5f9;
    }
    .right {
      text-align: right;
    }
    .mono {
      font-variant-numeric: tabular-nums;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    }
    .file-name, .path {
      max-width: 420px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .type-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.85rem;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .type-pill.xml {
      border-color: #bfdbfe;
      background: #eff6ff;
      color: #1d4ed8;
    }
    .type-pill.json {
      border-color: #bbf7d0;
      background: #f0fdf4;
      color: #15803d;
    }
    .type-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      line-height: 18px;
    }

    @media (max-width: 900px) {
      .file-name, .path {
        max-width: 260px;
      }
    }
    @media (max-width: 720px) {
      .results-table th:nth-child(5),
      .results-table td:nth-child(5),
      .results-table th:nth-child(6),
      .results-table td:nth-child(6) {
        display: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenerateFilesComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly generateFilesService = inject(GenerateFilesService);

  showBackButton = input<boolean>(true);
  backLabel = input<string>('Mégse');
  backUrl = input<string>('/');

  protected readonly count = signal<number>(20);
  protected readonly status = signal<GenerateStatus>('idle');
  protected readonly error = signal<string | null>(null);
  protected readonly results = signal<GeneratedFile[]>([]);
  protected readonly displayedColumns: string[] = ['type', 'fileName', 'size', 'started', 'finished', 'path', 'generation', 'id'];
  protected readonly generationColumns: string[] = ['genId', 'count', 'started', 'finished', 'duration'];

  private generateSub: Subscription | null = null;
  private listSub: Subscription | null = null;
  private generationsSub: Subscription | null = null;
  protected readonly loadingList = signal<boolean>(false);
  protected readonly loadingGenerations = signal<boolean>(false);
  protected readonly lastAction = signal<string | null>(null);
  protected readonly generations = signal<GenerationRun[]>([]);

  protected readonly isGenerateDisabled = computed(() => {
    const c = this.count();
    return this.status() === 'loading' || !Number.isFinite(c) || c < 1 || c > 1000;
  });

  ngOnInit(): void {
    this.loadGenerations();
    this.loadList();
  }

  ngOnDestroy(): void {
    this.generateSub?.unsubscribe();
    this.listSub?.unsubscribe();
    this.generationsSub?.unsubscribe();
  }

  loadGenerations(): void {
    this.generationsSub?.unsubscribe();
    this.loadingGenerations.set(true);

    this.generationsSub = this.generateFilesService.listGenerations(50).subscribe({
      next: (rows) => {
        this.generations.set(this.sortGenerationsNewestFirst(rows ?? []));
        this.loadingGenerations.set(false);
      },
      error: () => {
        this.loadingGenerations.set(false);
      }
    });
  }

  loadList(): void {
    this.listSub?.unsubscribe();
    this.loadingList.set(true);
    this.error.set(null);

    this.listSub = this.generateFilesService.list(200).subscribe({
      next: (rows) => {
        this.results.set(this.sortNewestFirst(rows ?? []));
        this.lastAction.set(null);
        this.loadingList.set(false);
      },
      error: (err) => {
        const msg = typeof err?.message === 'string' ? err.message : 'Nem sikerült betölteni a DB tartalmát.';
        this.error.set(msg);
        this.loadingList.set(false);
      }
    });
  }

  syncAndRefresh(): void {
    this.listSub?.unsubscribe();
    this.loadingList.set(true);
    this.error.set(null);

    this.listSub = this.generateFilesService.sync(200).subscribe({
      next: (rows) => {
        this.results.set(this.sortNewestFirst(rows ?? []));
        this.lastAction.set(null);
        this.loadingList.set(false);
        this.loadGenerations();
      },
      error: (err) => {
        const msg =
          typeof err?.message === 'string' ? err.message : 'Nem sikerült szinkronizálni a fájlokat a DB-be.';
        this.error.set(msg);
        this.loadingList.set(false);
      }
    });
  }

  onCountChange(value: unknown): void {
    const next = Number(value);
    this.count.set(Number.isFinite(next) ? next : 0);
  }

  generate(): void {
    const count = this.count();
    if (!Number.isFinite(count) || count < 1 || count > 1000) return;

    this.generateSub?.unsubscribe();
    this.status.set('loading');
    this.error.set(null);

    this.generateSub = this.generateFilesService.generate(count).subscribe({
      next: (rows) => {
        this.results.set(this.mergeAndSort(this.results(), rows ?? []));
        this.status.set('success');
        this.lastAction.set(null);
        this.loadGenerations();
      },
      error: (err) => {
        const msg = typeof err?.message === 'string' ? err.message : 'Ismeretlen hiba történt a generálás közben.';
        this.error.set(msg);
        this.status.set('error');
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl(this.backUrl());
  }

  cleanAll(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '420px',
        data: {
          title: 'Biztosan törlöd?',
          message:
            'Ez törli az összes generált fájlt a fájlrendszerből és az összes kapcsolódó bejegyzést az adatbázisból.',
          confirmText: 'Törlés',
          cancelText: 'Mégse',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) this.runClean();
      });
  }

  private runClean(): void {
    this.listSub?.unsubscribe();
    this.generateSub?.unsubscribe();
    this.loadingList.set(true);
    this.status.set('idle');
    this.error.set(null);
    this.lastAction.set(null);

    this.listSub = this.generateFilesService.clean().subscribe({
      next: (res) => {
        this.results.set([]);
        this.generations.set([]);
        this.loadingList.set(false);
        this.lastAction.set(`Törölve: ${res.deletedFiles} fájl, ${res.deletedDbRows} DB sor`);
      },
      error: (err) => {
        const msg = typeof err?.message === 'string' ? err.message : 'Nem sikerült törölni.';
        this.error.set(msg);
        this.loadingList.set(false);
      }
    });
  }

  formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '-';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  formatDurationMillis(ms: number | null | undefined): string {
    if (ms == null || !Number.isFinite(ms) || ms < 0) return '-';
    if (ms < 1000) return `${Math.round(ms)} ms`;
    const s = ms / 1000;
    return `${s.toFixed(3)} s`;
  }

  private mergeAndSort(existing: GeneratedFile[], newlyCreated: GeneratedFile[]): GeneratedFile[] {
    const byId = new Map<number, GeneratedFile>();
    for (const row of existing) byId.set(row.id, row);
    for (const row of newlyCreated) byId.set(row.id, row);
    return this.sortNewestFirst(Array.from(byId.values()));
  }

  private sortNewestFirst(rows: GeneratedFile[]): GeneratedFile[] {
    return [...rows].sort((a, b) => {
      const at = Date.parse(a.creationStartedAt);
      const bt = Date.parse(b.creationStartedAt);
      if (bt !== at) return bt - at;
      return (b.id ?? 0) - (a.id ?? 0);
    });
  }

  private sortGenerationsNewestFirst(rows: GenerationRun[]): GenerationRun[] {
    return [...rows].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }

  isXml(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.xml');
  }

  isJson(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.json');
  }

  ext(fileName: string): 'xml' | 'json' | 'file' {
    if (this.isXml(fileName)) return 'xml';
    if (this.isJson(fileName)) return 'json';
    return 'file';
  }

  iconFor(fileName: string): string {
    if (this.isXml(fileName)) return 'description';
    if (this.isJson(fileName)) return 'data_object';
    return 'insert_drive_file';
  }
}

type ConfirmDialogData = {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
};

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content class="content">{{ data.message }}</div>
    <div mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">{{ data.cancelText }}</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">{{ data.confirmText }}</button>
    </div>
  `,
  styles: [`
    .content {
      color: #334155;
      line-height: 1.4;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
