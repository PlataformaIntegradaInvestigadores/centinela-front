import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../domain/services/dashboard.service';
import {
  DashboardCounts,
  LineChartInfo,
  NameValue,
} from '../../../../shared/interfaces/dashboard.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { AffiliationService } from '../../../domain/services/affiliation.service';
import { environment } from '../../../../../environments/environment';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.css'],
})
export class GeneralComponent implements OnInit {
  lineChartInfo!: LineChartInfo[];
  counts!: DashboardCounts;
  treeMapInfo!: NameValue[];
  barChartInfo!: NameValue[];
  provinces!: string;
  options: string[] = ['Until', 'In'];
  selectedOption: string = this.options[0];
  yearOptions: number[] = [];
  year!: number;
  width!: number;
  heigth!: number;
  scale!: number;
  x!: number;
  y!: number;
  barS!: NameValue[];
  size!: string;
  ecW!: number;

  actualWidth = window.innerWidth;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dashboardService: DashboardService,
    private affiliationService: AffiliationService,
    private breakpointObserver: BreakpointObserver,
  ) {
    this.getYears();
    this.initSize();
  }

  lineS!: LineChartInfo[];

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
            this.ecW = window.innerWidth * 0.985;
          } else if (result.breakpoints[Breakpoints.Small]) {
            this.size = 'small';
            this.ecW = window.innerWidth * 0.985;
          } else if (result.breakpoints[Breakpoints.Medium]) {
            this.size = 'medium';
            this.ecW = window.innerWidth * 0.39;
          } else if (result.breakpoints[Breakpoints.Large]) {
            this.size = 'large';
            this.ecW = window.innerWidth * 0.295;
          } else if (result.breakpoints[Breakpoints.XLarge]) {
            this.size = 'xLarge';
            this.ecW = window.innerWidth * 0.295;
          }
        }
      });
  }

  ngOnInit(): void {
    this.dashboardService.getLineChartInfo().subscribe((data) => {
      this.lineChartInfo = data;
      this.lineS = this.lineChartInfo;
      // this.lineS[0].name = this.lineChartInfo[0].name
      this.lineS[0].series = this.lineChartInfo[0].series.slice(-10);
    });
    this.dashboardService.getTreeMap().subscribe((data) => {
      this.treeMapInfo = data;
    });
    this.dashboardService.getBarInfo().subscribe((data) => {
      this.barChartInfo = data;
      // this.barS = this.barChartInfo
      // this.barS = this.barChartInfo.slice(-10)
      // console.log('asd' + this.barS)
    });
    this.provinces = environment.apiSearch + '/v1/dashboard/province/get_provinces/';
  }

  isCharged() {
    return (
      this.lineChartInfo && this.counts && this.treeMapInfo && this.barChartInfo && this.provinces
    );
  }

  getYears() {
    this.dashboardService.getYears().subscribe((data) => {
      this.yearOptions = data.map((item) => item.year);
      this.year = this.yearOptions[this.yearOptions.length - 1]; // Inicializamos con el último año
      this.updateData(this.year); // Inicializamos los datos con el año seleccionado
    });
  }

  updateData(year: number) {
    console.log(year);
    this.year = year;
    if (this.selectedOption === 'Until') {
      if (this.year.toString() === this.yearOptions[this.yearOptions.length - 1].toString()) {
        this.dashboardService.getTreeMap().subscribe((data) => {
          this.treeMapInfo = data;
        });
        this.dashboardService.getBarInfo().subscribe((data) => {
          this.barChartInfo = data;
        });
        this.provinces = this.dashboardService.getProvinces();
      } else {
        this.dashboardService.getTreeMapInfoAcumulated(year).subscribe((data) => {
          this.treeMapInfo = data;
        });
        this.dashboardService.getBarInfoAcumulated(year).subscribe((data) => {
          this.barChartInfo = data;
        });
        this.provinces = this.dashboardService.getProvincesAcumulated(year);
      }
      this.dashboardService.getCounts(year).subscribe((data) => {
        this.counts = data;
      });
      this.dashboardService.getLineChartInfoRange(year).subscribe((data) => {
        this.lineChartInfo = data;
      });
    } else if (this.selectedOption === 'In') {
      this.dashboardService.getCountsYear(year).subscribe((data) => {
        this.counts = data;
      });
      this.dashboardService.getBarInfoYear(year).subscribe((data) => {
        this.barChartInfo = data;
      });
      this.dashboardService.getTreeMapInfo(year).subscribe((data) => {
        this.treeMapInfo = data;
      });
      this.dashboardService.getLineChartInfoYear(year).subscribe((data) => {
        this.lineChartInfo = data;
      });
      this.provinces = this.dashboardService.getProvincesYear(year);
    }
  }

  onSearchEntity(event: string) {
    this.router.navigate(['home/analitica/dashboard/by-affiliation', event]).then(() => {});
  }

  getId(name: string) {
    this.affiliationService.getId(name).subscribe((data) => {
      this.onSearchEntity(data.scopus_id);
    });
  }

  onSearchTopic(event: string) {
    this.router.navigate(['home/analitica/dashboard/by-topic', event]).then(() => {});
  }

  protected readonly window = window;
}
