import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-filter-sidebar',
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.css'],
})
export class FilterSidebarComponent {
  @Input()
  code!: string;

  @Input()
  years: number[] = [];

  selectedYears: number[] = [];

  affiliations = [
    { nombre: 'Universidad de Guayaquil' },
    { nombre: 'Escuela Politécnica Nacional' },
    { nombre: 'Universidad Técnica de Ambato' },
    { nombre: 'Universidad San Francisco de Quito' },
    { nombre: 'Universidad de las Américas' },
    { nombre: 'Universidad de Cuenca' },
    { nombre: 'Pontificia Universidad Católica del Ecuador' },
    { nombre: 'Universidad Técnica del Norte' },
    { nombre: 'Universidad Técnica de Machala' },
    { nombre: 'Universidad Estatal de Milagro' },
    { nombre: 'Universidad Católica de Santiago de Guayaquil' },
    { nombre: 'Universidad Laica Eloy Alfaro de Manabí' },
  ];

  @Output() yearsSelected: EventEmitter<number[]> = new EventEmitter<number[]>();

  onYearChange(year: number, isChecked: boolean): void {
    if (isChecked) {
      this.selectedYears.push(year);
    } else {
      const index = this.selectedYears.indexOf(year);
      if (index > -1) {
        this.selectedYears.splice(index, 1);
      }
    }
    this.yearsSelected.emit(this.selectedYears);
  }
  yearSelected(years: number[]) {
    console.log(years);
    this.years = years;
    console.log(this.years);
  }
}
