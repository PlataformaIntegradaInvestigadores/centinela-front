import { Component, Input } from '@angular/core';
import { Author } from '../../../../../shared/interfaces/author.interface';

@Component({
  selector: 'app-author-information',
  templateUrl: './author-information.component.html',
  styleUrls: ['./author-information.component.css'],
})
export class AuthorInformationComponent {
  @Input()
  author!: Author;
}
