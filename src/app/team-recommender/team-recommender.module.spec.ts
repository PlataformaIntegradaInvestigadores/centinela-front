import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TeamRecommenderModule } from './team-recommender.module';
import { TeamRecommenderRoutingModule } from './team-recommender-routing.module';
import { TeamRecommenderUiModule } from './team-recommender-ui.module';
import { TeamBuilderPageComponent } from './presentation/pages/team-builder-page/team-builder-page.component';

describe('TeamRecommenderModule', () => {
  it('creates the feature and UI modules', () => {
    expect(new TeamRecommenderModule()).toBeTruthy();
    expect(new TeamRecommenderUiModule()).toBeTruthy();
  });

  it('routes the empty path to the team builder page', () => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, TeamRecommenderRoutingModule],
    });
    const router = TestBed.inject(Router);
    const route = router.config.find((r) => r.path === '');
    expect(route?.component).toBe(TeamBuilderPageComponent);
    expect(new TeamRecommenderRoutingModule()).toBeTruthy();
  });

  it('exports the team builder so other modules can embed it', () => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, TeamRecommenderUiModule],
    });
    const fixture = TestBed.createComponent(TeamBuilderPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
