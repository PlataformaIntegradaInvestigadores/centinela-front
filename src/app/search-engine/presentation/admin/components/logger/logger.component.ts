import { Component, OnInit } from '@angular/core';
import { LogService } from 'src/app/search-engine/domain/services/logger.service';

@Component({
  selector: 'app-models',
  templateUrl: './logger.component.html',
  styleUrls: ['./logger.component.css'],
})
export class LoggerComponent implements OnInit {
  logs: string[] = [];
  currentPage: number = 1;
  linesPerPage: number = 10;
  totalLogs: number = 0;
  totalPages: number = 0;

  logLevel: string = '';
  startDate: string = '';
  endDate: string = '';
  keyword: string = '';

  constructor(private logService: LogService) {}

  ngOnInit(): void {
    this.fetchLogs();
  }

  fetchLogs(): void {
    this.logService
      .getLogs(
        this.currentPage,
        this.linesPerPage,
        this.logLevel,
        this.startDate,
        this.endDate,
        this.keyword,
      )
      .subscribe(
        (response) => {
          console.log(response);
          this.logs = response.logs;
          this.totalLogs = response.total_lines;
          this.totalPages = Math.ceil(this.totalLogs / this.linesPerPage);
        },
        (error) => {
          console.log(error);
        },
      );
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchLogs();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.fetchLogs();
    }
  }
}
