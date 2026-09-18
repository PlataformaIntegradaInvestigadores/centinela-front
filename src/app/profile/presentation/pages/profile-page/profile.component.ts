import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { UserService } from 'src/app/profile/domain/services/user.service';
import { Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { UserDataService } from 'src/app/profile/domain/services/user_data.service';
import { UserProfile, User } from 'src/app/profile/domain/entities/user.interfaces';
import { AuthorService } from 'src/app/search-engine/domain/services/author.service';
import { Author } from 'src/app/shared/interfaces/author.interface';
import { FeedPost } from 'src/app/feeds/presentation/types/post.types';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  userId: string = '0';
  user: User | null = null;
  isOwnProfile: boolean = false;
  private routeSub: Subscription = new Subscription();
  authorCentinela: Author | undefined;
  returnToResultsUrl: string | null = null;
  editModalVisible: boolean = false;
  postToEdit: FeedPost | null = null;

  @ViewChild('tabsTop') tabsTop?: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private authService: AuthService,
    private userDataService: UserDataService,
    private titleService: Title,
    private authorService: AuthorService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.returnToResultsUrl = returnUrl?.startsWith('/home') ? returnUrl : null;

    this.routeSub = this.route.params.subscribe((params) => {
      this.userId = params['id'];
      this.loadUserData();
    });

    // Al cambiar entre pestanas (network/article/fingerprint/...) el alto del
    // contenido cambia y el navegador deja el scroll donde estaba, lo que se
    // percibe como un "salto". Llevamos la vista al inicio de la barra de
    // pestanas para que el cambio de alto ocurra fuera del area visible.
    this.routeSub.add(
      this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects;
        if (/\/(network|article|fingerprint|about-me|my-groups)(\/|$|\?)/.test(url)) {
          this.tabsTop?.nativeElement?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
      }),
    );
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  /**
   * Carga los datos del usuario si están disponibles, de lo contrario, carga los datos del autor.
   */
  private loadUserData(): void {
    // Vista publica de autor (Opcion B): si el id es un scopus_id numerico (un autor
    // proveniente del buscador), se carga el detalle academico publico directamente.
    // Asi se evita la llamada autenticada a userService, que para un usuario SIN sesion
    // provoca un 401 y la redireccion a login. Las pestanas (network/article/fingerprint)
    // ya resuelven el autor por scopus_id contra la API publica del microservicio v2.
    if (/^\d+$/.test(String(this.userId))) {
      this.loadAuthorData();
      return;
    }
    this.userService.getUserById(this.userId).subscribe({
      next: (data: UserProfile) => {
        this.user = { ...data, id: this.userId, isOwnProfile: this.isOwnProfile };
        this.authorCentinela = undefined; // Limpiar datos del autor
        this.checkIfOwnProfile();
        this.userDataService.setUser(this.user, this.authorCentinela);
        this.setTitle();
        console.log('User data:', this.user);
      },
      error: (err) => {
        console.error('Error fetching user data', err);
        this.loadAuthorData(); // Si ocurre un error, cargar los datos del autor
      },
    });
  }

  /**
   * Carga los datos del autor.
   */
  private loadAuthorData(): void {
    this.authorService.getAuthorById(this.userId).subscribe({
      next: (data: Author) => {
        this.authorCentinela = data;
        this.user = null; // Limpiar datos del usuario
        this.titleService.setTitle(`${data.first_name} ${data.last_name}`);
        console.log('Author data:', this.authorCentinela);
      },
      error: (err) => {
        console.error('Error fetching author data', err);
      },
    });
  }

  /**
   * Verifica si el perfil pertenece al usuario autenticado.
   */
  private checkIfOwnProfile(): void {
    this.isOwnProfile = this.userId === this.authService.getUserId();
    if (this.user) {
      this.user.isOwnProfile = this.isOwnProfile;
    }
  }

  /**
   * Establece el título de la página usando el nombre y apellido del usuario o del autor.
   */
  private setTitle(): void {
    if (this.user) {
      const title = `${this.user.first_name} ${this.user.last_name}`;
      this.titleService.setTitle(title);
    } else if (this.authorCentinela) {
      const title = `${this.authorCentinela.first_name} ${this.authorCentinela.last_name}`;
      this.titleService.setTitle(title);
    }
  }

  backToResults(): void {
    if (this.returnToResultsUrl) {
      this.router.navigateByUrl(this.returnToResultsUrl);
    }
  }

  closeEditModal(): void {
    this.editModalVisible = false;
    this.postToEdit = null;
  }

  saveEditPost(editData: { content: string; tags: string[] }): void {
    // Aquí deberías emitir un evento o llamar a un servicio para actualizar el post
    // y luego cerrar el modal. Puedes personalizar según tu lógica.
    void editData;
    this.closeEditModal();
  }
}
