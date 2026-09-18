import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css'],
})
export class LoaderComponent {
  // Can be configured to show a different number of skeleton rows
  @Input() rows: number = 5;

  getRowsArray() {
    return Array(this.rows).fill(0);
  }
}
