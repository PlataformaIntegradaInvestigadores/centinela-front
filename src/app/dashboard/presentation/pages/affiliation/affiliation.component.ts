import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../domain/services/dashboard.service';
import { NameValue } from '../../../../shared/interfaces/dashboard.interface';
import { AffiliationService } from '../../../domain/services/affiliation.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-affiliation',
  templateUrl: './affiliation.component.html',
  styleUrls: ['./affiliation.component.css'],
})
export class AffiliationComponent implements OnInit {
  affiliations!: NameValue[];
  size!: string;

  constructor(
    private dashboardService: DashboardService,
    private affiliationService: AffiliationService,
    private route: ActivatedRoute,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
  ) {
    this.initSize();
  }

  private initSize() {
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .subscribe((result) => {
        if (result.matches) {
          if (result.breakpoints[Breakpoints.XSmall]) {
            this.size = 'xSmall';
          } else if (result.breakpoints[Breakpoints.Small]) {
            this.size = 'small';
          } else if (result.breakpoints[Breakpoints.Medium]) {
            this.size = 'medium';
          } else if (result.breakpoints[Breakpoints.Large]) {
            this.size = 'large';
          } else if (result.breakpoints[Breakpoints.XLarge]) {
            this.size = 'xLarge';
          }
        }
      });
  }

  onSearchEntity(event: string) {
    this.router.navigate(['home/analitica/dashboard/by-affiliation', event]).then(() => {});
  }

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary() {
    this.dashboardService.getBarInfo().subscribe((data) => {
      this.affiliations = data;
      // this.charged = false;
    });
  }

  getId(name: string) {
    this.affiliationService.getId(name).subscribe((data) => {
      this.onSearchEntity(data.scopus_id);
    });
  }

  navigateGeneral() {
    this.router.navigate(['home/analitica/dashboard/']).then(() => {});
  }

  navigateTopic() {
    this.router.navigate(['home/analitica/dashboard/topic/']).then(() => {});
  }

  isCharged() {
    return this.affiliations;
  }
}
