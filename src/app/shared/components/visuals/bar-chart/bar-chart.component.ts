import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NameValue } from '../../../interfaces/dashboard.interface';
import { Color } from '@swimlane/ngx-charts';
import { VisualsService } from '../../../domain/services/visuals.service';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css'],
})
export class BarChartComponent implements OnInit, OnChanges {
  @Input()
  single!: NameValue[];
  @Input()
  width!: number;
  @Input()
  height!: number;
  @Output() selectedAffiliation = new EventEmitter<any>();

  single1!: NameValue[];
  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = false;
  xAxisLabel = 'Affiliation';
  showYAxisLabel = true;
  yAxisLabel = 'Articles';

  colorScheme!: Color;

  colorScheme1!: Color;
  @Input()
  general: boolean = false;
  @Input()
  affiliation: boolean = false;
  @Input()
  topic: boolean = false;
  colorsCharged: boolean = false;
  ngOnInit() {
    if (this.single) {
      // console.log('single' + this.single)
      this.colorScheme = this.visualsService.createColorScheme(this.single.length);
      this.single1 = this.single.slice(0, 20);
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['single']) {
      this.colorsCharged = false;
      this.colorScheme = this.visualsService.createColorScheme(this.single.length);
      this.colorsCharged = true;
      this.single1 = this.single.slice(0, 20);
      this.colorScheme1 = this.visualsService.createColorScheme(this.single1.length);
    }
  }

  constructor(private visualsService: VisualsService) {
    // console.log('constructor: ' + this.single)
  }

  onSelect(event: NameValue): void {
    // console.log('Selected item:', event.name); // Log para verificar el elemento seleccionado
    this.selectedAffiliation.emit(event.name);
  }

  protected readonly window = window;
}
