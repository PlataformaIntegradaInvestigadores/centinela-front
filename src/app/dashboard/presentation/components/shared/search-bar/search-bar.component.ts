import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { SuggestionService } from '../../../../domain/services/suggestion.service';
import { AffiliationInfo, TopicInfo } from '../../../../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css'],
})
export class SearchBarComponent implements OnInit {
  private debouncerSubscription?: Subscription;
  searchQuery: string = '';
  affiliations: AffiliationInfo[] = [];
  topics: TopicInfo[] = [];
  provinces: any[] = [];
  searchTerms = new Subject<string>();
  showSuggestions: boolean = false;
  @Input()
  ph!: string;

  @Output()
  entity: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  name: EventEmitter<string> = new EventEmitter<string>();

  @Input()
  code!: string;

  constructor(private suggestionService: SuggestionService) {}

  ngOnInit() {
    switch (this.code) {
      case 'affiliation':
        this.debouncerSubscription = this.searchTerms
          .pipe(debounceTime(1000), distinctUntilChanged())
          .subscribe((query) => {
            this.suggestionService.searchAffiliations(query).subscribe((affs) => {
              this.affiliations = affs;
              this.showSuggestions = true;
            });
          });
        break;
      case 'topic':
        this.debouncerSubscription = this.searchTerms
          .pipe(debounceTime(1000), distinctUntilChanged())
          .subscribe((query) => {
            this.suggestionService.searchTopics(query).subscribe((tops) => {
              this.topics = tops;
              this.showSuggestions = true;
            });
          });
        break;
    }
  }

  onSearchChange(query: string): void {
    this.searchTerms.next(query);
  }

  onFocus(): void {
    this.showSuggestions = true;
  }

  onBlur(): void {
    setTimeout(() => (this.showSuggestions = false), 200); // Para permitir clics en sugerencias
  }

  emitEntity(entity: string): void {
    this.affiliations = [];
    this.topics = [];
    this.provinces = [];
    this.entity.emit(entity);
  }

  selectSuggestion(entity: AffiliationInfo | TopicInfo): void {
    switch (this.code) {
      case 'affiliation':
        this.searchQuery = `${entity.name}`;
        this.showSuggestions = false;
        this.emitEntity((entity as AffiliationInfo).scopus_id.toString());
        break;
      case 'topic':
        this.searchQuery = `${entity.name}`;
        this.showSuggestions = false;
        this.emitEntity(entity.name.toString());
        break;
      case 'province':
        break;
    }
  }
}
// export class SearchBarComponent implements OnInit {
//   private debouncerSubscription?: Subscription;
//   searchQuery: string = '';
//   affiliations: any[] = [];
//   topics: any[] = [];
//   provinces: any[] = []
//   searchTerms = new Subject<string>();
//   showSuggestions: boolean = false;
//   @Output()
//   entity: EventEmitter<string> = new EventEmitter<string>()
//   @Output()
//   name: EventEmitter<string> = new EventEmitter<string>()
//   @Input()
//   code!: string
//
//   constructor(private suggestionService: SuggestionService) {
//
//   }
//
//   ngOnInit() {
//     switch (this.code) {
//       case "affiliation":
//         this.debouncerSubscription = this.searchTerms
//           .pipe(
//             debounceTime(1000),
//             distinctUntilChanged(),
//           ).subscribe(query => {
//               this.suggestionService.searchAffiliations(query).subscribe(affs => {
//                   this.affiliations = affs;
//                   this.showSuggestions = true;
//
//                 }
//               )
//             }
//           )
//         break;
//       case "topic":
//         break;
//       case "province":
//         break;
//     }
//   }
//
//   onSearchChange(query: string): void {
//     this.searchTerms.next(query);
//   }
//
//   onFocus(): void {
//     this.showSuggestions = true;
//   }
//
//   onBlur(): void {
//     setTimeout(() => this.showSuggestions = false, 200); // Para permitir clics en sugerencias
//   }
//
//   emitEntity(entity: string) {
//     this.affiliations = []
//     this.topics = []
//     this.provinces = []
//     this.entity.emit(entity)
//   }
//
//
// }
