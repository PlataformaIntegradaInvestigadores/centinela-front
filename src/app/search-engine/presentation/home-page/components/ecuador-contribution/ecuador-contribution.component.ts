import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Search } from '../../../../../shared/interfaces/search-type.interface';
import { VisualsService } from '../../../../../shared/domain/services/visuals.service';
import { Word } from '../../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-ecuador-contribution',
  templateUrl: './ecuador-contribution.component.html',
  styleUrls: ['./ecuador-contribution.component.css'],
})
export class EcuadorContributionComponent {
  @Output()
  t: EventEmitter<Search> = new EventEmitter<Search>();

  @Input()
  public words!: Word[];
  @Input()
  public provinces!: string;

  emitT(top: string) {
    const search: Search = { option: 'mrar', query: top };

    this.t.emit(search);
  }

  constructor(private dashboardService: VisualsService) {}

  protected readonly window = window;
}
