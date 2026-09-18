import { Component } from '@angular/core';
import { SummaryService } from 'src/app/search-engine/domain/services/summary.service';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css'],
})
export class SummaryComponent {
  authorsCount: number = 0;
  articlesCount: number = 0;
  topicsCount: number = 0;
  constructor(private summaryService: SummaryService) {
    this.getSummary();
  }

  getSummary() {
    this.summaryService.getSummary().subscribe((summary) => {
      this.authorsCount = summary.authors;
      this.articlesCount = summary.articles;
      this.topicsCount = summary.topics;
    });
  }
}
