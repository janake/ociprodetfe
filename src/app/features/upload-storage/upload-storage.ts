import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GenerateFilesComponent } from '../generate-files/generate-files';

@Component({
  selector: 'app-upload-storage',
  standalone: true,
  imports: [GenerateFilesComponent],
  template: `
    <app-generate-files></app-generate-files>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadStorageComponent {
}
