import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatrixComponent } from './matrix/matrix.component';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatrixComponent],
  template: `
    <app-matrix [width]="16" [height]="16" />
  `, 
})
export class HomeComponent { }
