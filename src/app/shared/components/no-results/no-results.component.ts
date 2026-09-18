import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-no-results',
  templateUrl: './no-results.component.html',
})
export class NoResultsComponent {
  @Input() title: string = 'No results found';
  @Input() isServerOnline: boolean = true;
}
