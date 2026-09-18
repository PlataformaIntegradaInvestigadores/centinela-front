import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { UserProfile, ScopusData } from 'src/app/profile/domain/entities/user.interfaces';
import { Author } from 'src/app/shared/interfaces/author.interface';
import { LineChartInfo } from '../../../../shared/interfaces/dashboard.interface';
import { AuthorService } from '../../../../search-engine/domain/services/author.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-profile-data',
  templateUrl: './profile-data.component.html',
  styleUrls: ['./profile-data.component.css'],
})
export class ProfileDataComponent implements OnChanges, OnInit {
  @Input() user: UserProfile | undefined;
  @Input() isOwnProfile: boolean = false;
  @Input() authorCentinela: Author | undefined;

  showForm = false;
  isLoggedIn: boolean = false;
  scopusData: ScopusData = { citations: 0, articles: 0 };
  isAuthor: boolean = false;
  idRoute!: string;

  years: LineChartInfo[] | undefined;
  charged: boolean = false;
  isLoading: boolean = true;
  chartError: boolean = false;

  name!: string;

  constructor(
    private authorService: AuthorService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']) {
      this.checkLoginStatus();
    }
    this.isAuthor = this.isNumeric(this.idRoute);

    // Solo hacer la request si user y scopus_id existen
    if (this.user?.scopus_id) {
      this.authorService.getAuthorById(this.user.scopus_id).subscribe((data) => {
        this.scopusData.citations = data.citation_count;
        this.scopusData.articles = data.articles;
        this.isLoading = false;
      });
    } else {
      setTimeout(() => (this.isLoading = false), 500); // Falback if no scopus ID
    }
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.idRoute = params.get('id') ?? '';
      if (this.idRoute && this.isNumeric(this.idRoute)) {
        this.authorService.getAuthorById(this.idRoute).subscribe({
          next: (data) => {
            this.name = data.auth_name;
            this.authorService.getLineChartInfo(this.idRoute, this.name).subscribe({
              next: (chartData) => {
                this.years = chartData;
                this.charged = true;
                this.isLoading = false;
              },
              error: (err) => {
                console.error('Chart data not available', err);
                this.chartError = true;
                this.isLoading = false;
              },
            });
          },
          error: (err) => {
            console.error('Error fetching author data', err);
            this.chartError = true;
            this.isLoading = false;
          },
        });
      } else {
        this.isLoading = false;
      }
    });
    this.isAuthor = this.isNumeric(this.idRoute);
  }

  isNumeric(value: string): boolean {
    return /^\d+$/.test(value);
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  /**
   * Verifica el estado de inicio de sesión del usuario.
   */
  checkLoginStatus(): void {
    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    this.isLoggedIn = !!(accessToken && userId);
  }

  /**
   * Indica si debe mostrarse el mensaje para usuarios conectados.
   */
  get shouldShowLoggedInMessage(): boolean {
    return this.isLoggedIn && this.isOwnProfile && !this.hasUserDetails;
  }

  /**
   * Indica si debe mostrarse el mensaje para usuarios desconectados.
   */
  get shouldShowLoggedOutMessage(): boolean {
    return (
      (!this.isLoggedIn && !this.hasUserDetails) ||
      (this.isLoggedIn && !this.isOwnProfile && !this.hasUserDetails)
    );
  }

  /**
   * Indica si el usuario tiene detalles en su perfil.
   */
  get hasUserDetails(): boolean {
    return (
      !!this.user &&
      !!(
        this.user.institution ||
        this.user.website ||
        this.user.investigation_camp ||
        this.user.email_institution
      )
    );
  }
  goToScopus(scopus_id: string | number | undefined) {
    window.open(`https://www.scopus.com/authid/detail.uri?authorId=${scopus_id}`, '_blank');
  }

  goBack() {
    this.location.back();
  }

  goToArticle(scopus_id: string) {
    const url = this.router.serializeUrl(this.router.createUrlTree(['article/', scopus_id]));
    window.open(url, '_blank');
  }
}
