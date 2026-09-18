import { Component, OnChanges, SimpleChanges } from '@angular/core';
import { LineChartInfo, NameValue } from '../../../../shared/interfaces/dashboard.interface';
import { DashboardService } from '../../../domain/services/dashboard.service';
import { TopicService } from '../../../domain/services/topic.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AffiliationService } from '../../../domain/services/affiliation.service';

@Component({
  selector: 'app-topic-dashboard',
  templateUrl: './topic-dashboard.component.html',
  styleUrls: ['./topic-dashboard.component.css'],
})
export class TopicDashboardComponent implements OnChanges {
  name: string = '';
  options: string[] = ['Until', 'In'];
  selectedOption: string = this.options[0];
  lineChartAffiliation!: LineChartInfo[];
  barMapInfo!: NameValue[];
  topic_name!: string;
  charged: boolean = false;
  year!: number;
  articles!: number;
  topics!: number;
  yearOptions!: number[];

  constructor(
    private dashboardService: DashboardService,
    private topicService: TopicService,
    private route: ActivatedRoute,
    private router: Router,
    private affiliationService: AffiliationService,
  ) {
    this.route.params.subscribe((params) => {
      const name = params['name'];
      if (name) {
        this.getTopicName(name);
      }
    });
  }

  getYears() {
    this.topicService.getOptionYears(this.topic_name).subscribe((data) => {
      this.yearOptions = data.map((item) => item.year);
      this.year = this.yearOptions[this.yearOptions.length - 1]; // Inicializamos con el último año
      this.updateData(this.year); // Inicializamos los datos con el año seleccionado
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scopusId']) {
      this.getTopicName(this.topic_name);
    }
  }

  getTopicName(topic: string) {
    this.charged = false;
    this.topic_name = topic;
    this.getYears();
    this.topicService.getLineChartTopicInfo(topic).subscribe((data) => {
      this.name = data[0].name;
      this.lineChartAffiliation = data;
    });
    this.topicService.getBarMapInfo(topic).subscribe((data) => {
      this.barMapInfo = data;
    });
    this.charged = true;
  }

  updateData(year: number) {
    this.year = year;
    if (this.selectedOption === 'Until') {
      if (this.year.toString() === this.yearOptions[this.yearOptions.length - 1].toString()) {
        this.topicService.getLineChartTopicInfo(this.topic_name).subscribe((data) => {
          this.name = data[0].name;
          this.lineChartAffiliation = data;
          this.charged = true;
        });
        this.topicService.getBarMapInfo(this.topic_name).subscribe((data) => {
          this.barMapInfo = data;
        });
        this.topicService.getSummary(this.topic_name).subscribe((data) => {
          this.articles = data.articles;
          this.topics = data.affiliations;
        });
      } else {
        this.topicService.getSummaryAcumulated(this.topic_name, this.year).subscribe((data) => {
          this.articles = data.articles;
          this.topics = data.affiliations;
        });
        this.topicService
          .getLineChartAffiliationRange(this.topic_name, this.year)
          .subscribe((data) => {
            this.name = data[0].name;
            this.lineChartAffiliation = data;
            this.charged = true;
          });
        this.topicService.getBarMapAcumulated(this.topic_name, this.year).subscribe((data) => {
          this.barMapInfo = data;
        });
      }
    } else if (this.selectedOption === 'In') {
      this.topicService.getSummaryYear(this.topic_name, year).subscribe((data) => {
        this.articles = data.articles;
        this.topics = data.affiliations;
      });
      this.topicService
        .getLineChartAffiliationYear(this.topic_name, this.year)
        .subscribe((data) => {
          this.name = data[0].name;
          this.lineChartAffiliation = data;
          this.charged = true;
        });
      this.topicService.getBarMapYear(this.topic_name, this.year).subscribe((data) => {
        this.barMapInfo = data;
      });
    }
  }

  getId(name: string) {
    this.affiliationService.getId(name).subscribe((data) => {
      this.onSearchEntity(data.scopus_id);
    });
  }

  onSearch(event: string) {
    this.router.navigate(['home/analitica/dashboard/by-topic', event]).then(() => {});
  }

  onSearchEntity(event: string) {
    this.router.navigate(['home/analitica/dashboard/by-affiliation', event]).then(() => {});
  }

  navigateGeneral() {
    this.router.navigate(['home/analitica/dashboard/']).then(() => {});
  }

  navigateAffiliation() {
    this.router.navigate(['home/analitica/dashboard/affiliations/']).then(() => {});
  }

  isCharged() {
    return this.articles && this.barMapInfo.length && this.yearOptions.length > 0 && this.year;
  }
}
