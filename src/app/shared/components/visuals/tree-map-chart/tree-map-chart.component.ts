import {
  Component,
  EventEmitter,
  HostBinding,
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
  selector: 'app-tree-map-chart',
  templateUrl: './tree-map-chart.component.html',
  styleUrls: ['./tree-map-chart.component.css'],
})
export class TreeMapChartComponent implements OnInit, OnChanges {
  @Input()
  single!: NameValue[];

  @Input()
  width!: number;
  @Input()
  height!: number;
  @Output() selectedTopic = new EventEmitter<any>();

  // Cuando es false, los recuadros no actuan (no hay accion al clic) y se muestra el
  // cursor por defecto en vez del de mano (p. ej. en el fingerprint del perfil).
  @Input() clickable: boolean = true;
  @HostBinding('class.tm-static') get tmStatic(): boolean {
    return !this.clickable;
  }

  gradient: boolean = false;
  animations: boolean = true;
  colorsCharged: boolean = false;
  colorScheme!: Color;

  @Input()
  general: boolean = false;
  @Input()
  affiliation: boolean = false;
  @Input()
  topic: boolean = false;
  single1!: NameValue[];
  colorScheme1!: Color;

  ngOnInit() {
    if (this.single) {
      this.colorScheme = this.visualsService.createColorScheme(this.single.length);
      this.colorsCharged = true;
      this.single1 = this.single.slice(0, 5);
      this.colorScheme1 = this.visualsService.createColorScheme(this.single1.length);
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['single']) {
      this.colorsCharged = false;
      this.colorScheme = this.visualsService.createColorScheme(this.single.length);
      this.single1 = this.single.slice(0, 5);
      this.colorScheme1 = this.visualsService.createColorScheme(this.single1.length);
      this.colorsCharged = true;
    }
  }

  constructor(private visualsService: VisualsService) {}

  onSelect(event: NameValue): void {
    this.selectedTopic.emit(event.name);
  }

  protected readonly window = window;
}
