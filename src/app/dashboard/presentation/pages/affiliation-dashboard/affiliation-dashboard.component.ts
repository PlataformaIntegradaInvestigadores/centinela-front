import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { LineChartInfo, NameValue } from '../../../../shared/interfaces/dashboard.interface';
import { DashboardService } from '../../../domain/services/dashboard.service';
import { AffiliationService } from '../../../domain/services/affiliation.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-affiliation-dashboard',
  templateUrl: './affiliation-dashboard.component.html',
  styleUrls: ['./affiliation-dashboard.component.css'],
})
export class AffiliationDashboardComponent implements OnInit, OnChanges {
  affiliation: string = '';
  options: string[] = ['Until', 'In'];
  selectedOption: string = this.options[0];
  lineChartAffiliation!: LineChartInfo[];
  treeMapInfo!: NameValue[];
  scopusId!: string;
  charged: boolean = false;
  year!: number;
  articles!: number;
  topics!: number;
  yearOptions!: number[];

  constructor(
    private dashboardService: DashboardService,
    private affiliationService: AffiliationService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  onSearchEntity(event: string) {
    this.router.navigate(['home/analitica/dashboard/by-affiliation', event]).then(() => {});
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.getScopusId(id);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scopusId']) {
      this.getScopusId(this.scopusId);
    }
  }

  getScopusId(scopus_id: string) {
    this.scopusId = scopus_id;
    this.getYears();
    this.affiliationService.getLineChartAffiliationInfo(scopus_id).subscribe((data) => {
      this.affiliation = data[0].name;
      this.lineChartAffiliation = data;
      this.charged = true;
    });
    this.affiliationService.getTreeMapInfo(scopus_id).subscribe((data) => {
      this.treeMapInfo = data;
    });
  }

  getYears() {
    this.affiliationService.getOptionYears(this.scopusId).subscribe((data) => {
      this.yearOptions = data.map((item) => item.year);
      this.year = this.yearOptions[this.yearOptions.length - 1];
      this.updateData(this.year);
    });
  }

  updateData(year: number) {
    this.year = year;
    if (this.selectedOption === 'Until') {
      if (this.year.toString() === this.yearOptions[this.yearOptions.length - 1].toString()) {
        this.affiliationService.getLineChartAffiliationInfo(this.scopusId).subscribe((data) => {
          this.affiliation = data[0].name;
          this.lineChartAffiliation = data;
          this.charged = true;
        });
        this.affiliationService.getTreeMapInfo(this.scopusId).subscribe((data) => {
          this.treeMapInfo = data;
        });
        this.affiliationService.getSummary(this.scopusId).subscribe((data) => {
          this.articles = data.articles;
          this.topics = data.topics;
        });
      } else {
        this.affiliationService.getSummaryAcumulated(this.scopusId, this.year).subscribe((data) => {
          this.articles = data.articles;
          this.topics = data.topics;
        });
        this.affiliationService
          .getLineChartAffiliationRange(this.scopusId, this.year)
          .subscribe((data) => {
            this.affiliation = data[0].name;
            this.lineChartAffiliation = data;
            this.charged = true;
          });
        this.affiliationService.getTreeMapAcumulated(this.scopusId, this.year).subscribe((data) => {
          this.treeMapInfo = data;
        });
      }
    } else if (this.selectedOption === 'In') {
      this.affiliationService.getSummaryYear(this.scopusId, year).subscribe((data) => {
        this.articles = data.articles;
        this.topics = data.topics;
      });
      this.affiliationService
        .getLineChartAffiliationYear(this.scopusId, this.year)
        .subscribe((data) => {
          this.affiliation = data[0].name;
          this.lineChartAffiliation = data;
          this.charged = true;
        });
      this.affiliationService.getTreeMapYear(this.scopusId, this.year).subscribe((data) => {
        this.treeMapInfo = data;
      });
    }
  }
  onSearchTopic(event: string) {
    this.router.navigate(['home/analitica/dashboard/by-topic', event]).then(() => {});
  }
  navigateGeneral() {
    this.router.navigate(['home/analitica/dashboard/']).then(() => {});
  }
  navigateTopic() {
    this.router.navigate(['home/analitica/dashboard/topic/']).then(() => {});
  }
  isCharged() {
    return this.articles && this.topics && this.yearOptions.length > 0;
  }
  protected readonly top = top;
}
