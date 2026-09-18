import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { MetricsResponse, ResearchGroup } from '../../../domain/entities/recommendation.interface';

import { RecommendationService } from '../../../domain/services/recommendation.service';

@Component({
  selector: 'app-recommendations-page',
  templateUrl: './recommendations-page.component.html',
  styleUrls: ['./recommendations-page.component.css'],
})
export class RecommendationsPageComponent implements OnInit, OnDestroy {
  groups: ResearchGroup[] = [];
  selectedGroup: ResearchGroup | null = null;

  metrics: MetricsResponse | null = null;

  loadingGroups = false;
  loadingGroupDetail = false;
  loadingMetrics = false;

  groupsError = '';
  groupDetailError = '';
  metricsError = '';

  currentPage = 1;
  itemsPerPage = 10;

  recommendationsLimit = 10;
  groupsLimit = 60;

  private readonly groupSelected$ = new Subject<ResearchGroup>();
  private groupSelectionSubscription?: Subscription;

  constructor(private recommendationService: RecommendationService) {}

  ngOnInit(): void {
    this.loadGroups();
    this.loadMetrics();

    // switchMap cancela la petición anterior si el usuario selecciona otro
    // grupo antes de que responda, evitando que una respuesta tardía
    // sobrescriba la selección más reciente.
    this.groupSelectionSubscription = this.groupSelected$
      .pipe(
        switchMap((group) =>
          this.recommendationService
            .getGroupRecommendations(group.group_id, this.recommendationsLimit)
            .pipe(
              catchError((error) => {
                console.error('Error loading group recommendations', error);

                this.groupDetailError = 'Could not load the group recommendations.';

                return of(null);
              }),
            ),
        ),
      )
      .subscribe((response) => {
        this.loadingGroupDetail = false;

        if (response) {
          this.selectedGroup = response;
        }
      });
  }

  ngOnDestroy(): void {
    this.groupSelectionSubscription?.unsubscribe();
  }

  loadGroups(): void {
    this.loadingGroups = true;
    this.groupsError = '';

    this.recommendationService.getGroups(this.recommendationsLimit, this.groupsLimit).subscribe({
      next: (response) => {
        this.groups = response.groups ?? [];

        if (this.groups.length > 0 && this.selectedGroup === null) {
          this.selectGroup(this.groups[0]);
        }

        this.loadingGroups = false;
      },
      error: (error) => {
        console.error('Error loading recommendation groups', error);

        this.groupsError = 'Could not load the research groups.';

        this.loadingGroups = false;
      },
    });
  }

  loadMetrics(): void {
    this.loadingMetrics = true;
    this.metricsError = '';

    this.recommendationService.getMetrics(this.recommendationsLimit).subscribe({
      next: (response) => {
        this.metrics = response;
        this.loadingMetrics = false;
      },
      error: (error) => {
        console.error('Error loading GRS metrics', error);

        this.metricsError = 'Could not load the GRS metrics.';

        this.loadingMetrics = false;
      },
    });
  }

  selectGroup(group: ResearchGroup): void {
    this.loadingGroupDetail = true;
    this.groupDetailError = '';

    this.groupSelected$.next(group);
  }

  reloadData(): void {
    this.selectedGroup = null;
    this.currentPage = 1;

    this.loadGroups();
    this.loadMetrics();
  }

  trackGroupById(index: number, group: ResearchGroup): number {
    return group.group_id;
  }

  trackRecommendationByRank(index: number, recommendation: { rank: number }): number {
    return recommendation.rank;
  }
}
