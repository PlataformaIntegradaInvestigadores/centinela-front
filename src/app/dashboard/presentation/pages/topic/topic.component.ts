import { Component } from '@angular/core';
import { NameValue } from '../../../../shared/interfaces/dashboard.interface';
import { DashboardService } from '../../../domain/services/dashboard.service';
import { TopicService } from '../../../domain/services/topic.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-topic',
  templateUrl: './topic.component.html',
  styleUrls: ['./topic.component.css'],
})
export class TopicComponent {
  tops!: NameValue[];
  constructor(
    private dashboardService: DashboardService,
    private topicService: TopicService,
    private router: Router,
  ) {
    this.dashboardService.getTreeMap().subscribe((data) => {
      this.tops = data;
    });
  }
  onSearchEntity(event: string) {
    this.router.navigate(['home/analitica/dashboard/by-topic', event]).then(() => {});
  }
  navigateGeneral() {
    this.router.navigate(['home/analitica/dashboard/']).then(() => {});
  }
  navigateAffiliation() {
    this.router.navigate(['home/analitica/dashboard/affiliations/']).then(() => {});
  }

  isCharged() {
    return this.tops;
  }
}
