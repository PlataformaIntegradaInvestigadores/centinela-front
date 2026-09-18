import { AfterContentChecked, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Search } from '../../../../../shared/interfaces/search-type.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { VisualsService } from '../../../../../shared/domain/services/visuals.service';
import { DashboardCounts, Word } from '../../../../../shared/interfaces/dashboard.interface';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-search-result',
  templateUrl: './search-result.component.html',
  styleUrls: ['./search-result.component.css'],
})
export class SearchResultComponent implements OnInit, AfterContentChecked {
  showComponent: boolean = true;
  searchValue!: Search;
  setSearch!: Search;
  loading: boolean = false;
  public countsLoaded: boolean = false;
  public topicsLoaded: boolean = false;

  counts!: DashboardCounts;
  words!: Word[];
  provinces: string = environment.apiSearch + '/v1/dashboard/province/get_provinces/';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private changeDetector: ChangeDetectorRef,
    private title: Title,
    private visualsService: VisualsService,
  ) {
    const { option, query } = route.snapshot.queryParams;
    if (option && query) {
      this.setSearch = { option, query };
    }
    this.searchValue = { option: 'au', query: '' };
  }

  onSearch(searchValue: Search) {
    const normalizedSearch = {
      ...searchValue,
      query: searchValue.query.trim().replace(/\s\s+/g, ' '),
    };
    const currentParams = this.route.snapshot.queryParamMap;
    const isRestoredSearch =
      currentParams.get('option') === normalizedSearch.option &&
      currentParams.get('query') === normalizedSearch.query;

    this.searchValue = normalizedSearch;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        option: normalizedSearch.option,
        query: normalizedSearch.query,
        page: isRestoredSearch ? currentParams.get('page') : null,
        size: isRestoredSearch ? currentParams.get('size') : null,
        activeFilter: isRestoredSearch ? currentParams.get('activeFilter') : null,
        years: isRestoredSearch ? currentParams.get('years') : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    // Scroll down to results section smoothly
    setTimeout(() => {
      const headerHeight = document.querySelector('.custom-bg')?.clientHeight || 500;
      window.scrollTo({
        top: headerHeight,
        behavior: 'smooth',
      });
    }, 100);
  }

  yearSelected() {}

  ngAfterContentChecked(): void {
    this.changeDetector.detectChanges();
  }

  ngOnInit(): void {
    this.title.setTitle('Welcome');
    this.visualsService.getCounts().subscribe((data) => {
      this.counts = data;
      this.countsLoaded = true;
    });
    this.visualsService.getTopics(100).subscribe((data) => {
      this.words = data;
      this.topicsLoaded = true;
    });
  }

  topicClcked(se: Search) {
    this.setSearch = { option: se.option, query: se.query };
  }

  isAuthorSearch() {
    return this.searchValue.option === 'au';
  }
}
