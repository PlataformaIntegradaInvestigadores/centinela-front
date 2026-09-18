import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-filters-sidebar',
  templateUrl: './filters-sidebar.component.html',
})
export class FiltersSidebarComponent {
  @Input() title: string = 'FILTERS';
  @Input() isFirstLoad: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() isDisabled: boolean = false;
}
