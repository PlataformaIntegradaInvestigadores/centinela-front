import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { LineChartInfo, NameValue } from '../../../interfaces/dashboard.interface';

@Component({
  selector: 'app-evolution-line-chart',
  templateUrl: './evolution-line-chart.component.html',
  styleUrls: ['./evolution-line-chart.component.css'],
})
export class EvolutionLineChartComponent implements OnInit, AfterViewInit {
  @Input() multi!: LineChartInfo[];
  multi1!: LineChartInfo[];
  @Input() width!: number;
  @Input() height: number = 250;

  @Input()
  general: boolean = false;
  @Input()
  affiliation: boolean = false;
  @Input()
  topic: boolean = false;

  @ViewChild('ContainerRef')
  cont!: ElementRef<HTMLInputElement>;
  drawed: boolean = false;
  view!: [number, number];
  @Output() selectedYear = new EventEmitter<any>();
  @Input() boolean = false;

  selectedSeries: string | null = null;
  selectedItem: NameValue | null = null;

  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Year';
  yAxisLabel: string = 'Articles';
  timeline: boolean = true;

  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#0000ff'],
  };

  ngOnInit() {
    this.multi1 = JSON.parse(JSON.stringify(this.multi));
    this.multi1[0].series = this.multi1[0].series.slice(-10);
  }

  ngAfterViewInit() {
    this.view = [this.cont.nativeElement.offsetWidth, this.height];
    this.drawed = true;
  }

  onSelect(event: NameValue): void {
    this.selectedYear.emit(event.name);
    this.selectedItem = event;
  }

  onResize(event: any) {
    this.view = [event.target.cont.nativeElement.offsetWidth - 50, this.height];
  }

  protected readonly window = window;
}
