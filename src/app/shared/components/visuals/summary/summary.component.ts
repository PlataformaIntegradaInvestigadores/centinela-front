import { Component, Input } from '@angular/core';
import { DashboardCounts } from '../../../interfaces/dashboard.interface';

@Component({
  selector: 'app1-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css'],
})
export class SummaryComponent {
  @Input()
  counts!: DashboardCounts;
}
