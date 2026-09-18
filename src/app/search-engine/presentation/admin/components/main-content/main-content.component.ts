import { Component, OnInit } from '@angular/core';
import {
  ArticleComparator,
  AuthorComparator,
  Status,
} from 'src/app/search-engine/domain/entities/author.comparator.interface';
import { DashboardAdminService } from 'src/app/search-engine/domain/services/dashboard-admin.service';
import { UpdateCentinelaService } from 'src/app/search-engine/domain/services/update-centinela.service';

@Component({
  selector: 'app-main-content',
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.css'],
})
export class MainContentComponent implements OnInit {
  modelExists: boolean = true;
  authorComparator: AuthorComparator | undefined;
  articleComparator: ArticleComparator | undefined;
  articlePercentage: number = 0;
  authorPercentage: number = 0;
  existsModel: boolean = false;
  existsCorpus: boolean = false;
  corpusStatus: Status | undefined;
  modelStatus: Status | undefined;
  generalStatus: Status | undefined;
  updateAuthorStatus: Status | undefined;
  loadingAuthors: boolean = false;
  loadingArticles: boolean = false;
  updateArticleStatus: Status | undefined;
  loadingArticleComparator: boolean = false;
  loadingAuthorsComparator: boolean = false;
  loadingModel: boolean = false;
  loadingCorpus: boolean = false;
  authorsNumberNoSqlDb: number = 0;
  lastYearInfoNoSqlDB: number = 0;
  messageNoSqlDb: string = '';
  isErrorUpdatingNoSqlDb: boolean = false;
  populating: boolean = false;

  constructor(
    private dashboardAdminService: DashboardAdminService,
    private updateCentinela: UpdateCentinelaService,
  ) {}

  ngOnInit(): void {
    this.getAuthorComparator();
    this.getArticlesComparator();
    this.getModelCorpusObserver();
    this.getNoSqlDbYears();
  }

  getAuthorComparator() {
    this.loadingAuthorsComparator = true;
    this.dashboardAdminService.getAuthorComparator().subscribe({
      next: (data) => {
        this.authorComparator = data;
        this.calculateAuthorPercentage();
        this.loadingAuthorsComparator = false;
      },
      error: (error) => {
        if (error.status === 0) {
          this.generalStatus = {
            success: false,
            message: 'Unable to connect to the server. Please try again later.',
          };
        } else if (error.status === 400) {
          if (error.error && error.error.message) {
            this.generalStatus = {
              success: false,
              message: error.error.message,
            };
          } else {
            this.generalStatus = {
              success: false,
              message: 'Error getting author comparator',
            };
          }
        } else {
          this.generalStatus = {
            success: false,
            message: 'Error getting author comparator',
          };
        }
        this.loadingAuthorsComparator = false;
        this.authorComparator = { authors_no_updated: 0, total_authors: 0 };
      },
    });
  }

  getArticlesComparator() {
    this.loadingArticleComparator = true;
    this.dashboardAdminService.getArticlesComparator().subscribe({
      next: (data) => {
        this.articleComparator = data;
        this.calculateArticlePercentage();
        this.loadingArticleComparator = false;
      },
      error: (error) => {
        if (error.status === 0) {
          this.generalStatus = {
            success: false,
            message: 'Unable to connect to the server. Please try again later.',
          };
        } else if (error.status === 400) {
          if (error.error && error.error.message) {
            this.generalStatus = {
              success: false,
              message: error.error.message,
            };
          } else {
            this.generalStatus = {
              success: false,
              message: 'Error getting article comparator',
            };
          }
        } else {
          this.generalStatus = {
            success: false,
            message: 'Error getting article comparator',
          };
        }
        this.loadingArticleComparator = false;
        this.articleComparator = { total_centinela: 0, total_scopus: 0 };
      },
    });
  }

  calculateAuthorPercentage() {
    const HUNDRED = 100;

    if (!this.authorComparator) {
      this.authorPercentage = 0;
      return;
    }

    const { authors_no_updated, total_authors } = this.authorComparator;

    if (total_authors === 0) {
      this.authorPercentage = 0;
      return;
    }

    this.authorPercentage = Number(((authors_no_updated / total_authors) * HUNDRED).toFixed(2));
  }

  calculateArticlePercentage() {
    const HUNDRED = 100;

    if (!this.articleComparator) {
      this.articlePercentage = 0;
      return;
    }

    const { total_centinela, total_scopus } = this.articleComparator;

    if (total_scopus === 0) {
      this.articlePercentage = 0;
      return;
    }

    this.articlePercentage = Number(((total_centinela / total_scopus) * HUNDRED).toFixed(2));
  }

  getModelCorpusObserver() {
    this.dashboardAdminService.getmodelCorpusObserver().subscribe({
      next: (data) => {
        this.existsModel = data.model;
        this.existsCorpus = data.corpus;
      },
      error: (error) => {
        if (error.status === 0) {
          this.generalStatus = {
            success: false,
            message: 'Unable to connect to the server. Please try again later.',
          };
        } else if (error.status === 400) {
          if (error.error && error.error.message) {
            this.generalStatus = {
              success: false,
              message: error.error.message,
            };
          } else {
            this.generalStatus = {
              success: false,
              message: 'Error getting model corpus observer',
            };
          }
        } else {
          this.generalStatus = {
            success: false,
            message: 'Error getting model corpus observer',
          };
        }
      },
    });
  }

  generateCorpus() {
    this.loadingCorpus = true;
    this.dashboardAdminService.generateCorpus().subscribe({
      next: (data) => {
        this.corpusStatus = data;
        this.corpusStatus.message = 'Corpus generated successfully';
        this.getModelCorpusObserver();
        this.loadingCorpus = false;
      },
      error: (error) => {
        if (error.status === 0) {
          this.corpusStatus = {
            success: false,
            message: 'Unable to connect to the server. Please try again later.',
          };
        } else if (error.status === 400) {
          if (error.error && error.error.message) {
            this.generalStatus = {
              success: false,
              message: error.error.message,
            };
          } else {
            this.corpusStatus = {
              success: false,
              message: 'Error generating corpus',
            };
          }
        } else {
          this.corpusStatus = {
            success: false,
            message: error.error.detail,
          };
        }

        this.loadingCorpus = false;
      },
      complete: () => {
        console.log('Request complete');
      },
    });
  }

  generateModel() {
    this.loadingModel = true;
    this.dashboardAdminService.generateModel().subscribe({
      next: (data) => {
        this.modelStatus = data;
        this.modelStatus.message = 'Model generated successfully';
        this.getModelCorpusObserver();
        this.loadingModel = false;
      },
      error: (error) => {
        if (error.status === 0) {
          this.modelStatus = {
            success: false,
            message: 'Unable to connect to the server. Please try again later.',
          };
        } else if (error.status === 400) {
          if (error.error && error.error.message) {
            this.modelStatus = {
              success: false,
              message: error.error.message,
            };
          } else {
            this.modelStatus = {
              success: false,
              message: 'Error generating model',
            };
          }
        } else {
          this.modelStatus = {
            success: false,
            message: error.error.detail,
          };
          this.loadingModel = false;
        }
        this.loadingModel = false;
      },
      complete: () => {},
    });
  }

  updateAuthors() {
    this.loadingAuthors = true;

    return this.updateCentinela.updateAuthorsCentinela().subscribe({
      next: (data) => {
        this.updateAuthorStatus = data;
        this.loadingAuthors = false;
      },
      error: (error) => {
        if (error.status === 0) {
          this.updateAuthorStatus = {
            success: false,
            message: 'Unable to connect to the server. Please try again later.',
          };
        } else if (error.status === 400) {
          if (error.error && error.error.message) {
            this.updateAuthorStatus = {
              success: false,
              message: error.error.message,
            };
          } else {
            this.updateAuthorStatus = {
              success: false,
              message: 'Error getting article comparator',
            };
          }
        } else if (error.status === 405) {
          this.updateAuthorStatus = {
            success: false,
            message: error.statusText,
          };
        } else {
          this.updateAuthorStatus = {
            success: false,
            message: error.error.message,
          };
        }
        this.loadingAuthors = false;
      },
    });
  }

  updateArticlesCentinela() {
    this.loadingArticles = true;

    return this.updateCentinela.searchArticlesCentinela().subscribe({
      next: (data) => {
        this.updateArticleStatus = data;
        this.loadingArticles = false;
      },
      error: (error) => {
        if (error.status === 0) {
          this.updateArticleStatus = {
            success: false,
            message: 'Unable to connect to the server. Please try again later.',
          };
        } else if (error.status === 400) {
          if (error.error && error.error.message) {
            this.updateArticleStatus = {
              success: false,
              message: error.error.message,
            };
          } else {
            this.updateArticleStatus = {
              success: false,
              message: error.error.message,
            };
          }
        } else if (error.status === 405) {
          console.log(error.statusText);
          this.updateArticleStatus = {
            success: false,
            message: error.statusText,
          };
        } else {
          this.updateArticleStatus = {
            success: false,
            message: error.error.message,
          };
        }
        this.loadingArticles = false;
      },
    });
  }

  getNoSqlDbYears() {
    this.dashboardAdminService.getNoSqlDbYears().subscribe((data) => {
      const yearOptions = data.map((item) => item.year);
      this.lastYearInfoNoSqlDB = yearOptions[yearOptions.length - 1];
      this.getNoSqlInfo();
    });
  }

  getNoSqlInfo() {
    this.dashboardAdminService.getNoSqlDbCounts(this.lastYearInfoNoSqlDB).subscribe((data) => {
      this.authorsNumberNoSqlDb = data.author;
    });
  }

  populateNoSqlDb() {
    this.populating = true;
    this.dashboardAdminService.populateNoSqlDb().subscribe({
      next: (response) => {
        this.messageNoSqlDb = response.message;
        this.isErrorUpdatingNoSqlDb = false;
        this.populating = false;
      },
      error: (error) => {
        this.messageNoSqlDb = error.error.error;
        this.isErrorUpdatingNoSqlDb = true;
      },
    });
  }
}
