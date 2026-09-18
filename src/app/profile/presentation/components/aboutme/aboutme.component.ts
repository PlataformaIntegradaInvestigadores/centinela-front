import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { AuthModalService } from 'src/app/auth/domain/services/auth-modal.service';
import { User } from 'src/app/profile/domain/entities/user.interfaces';
import { UserDataService } from 'src/app/profile/domain/services/user_data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-aboutme',
  templateUrl: './aboutme.component.html',
  styleUrls: ['./aboutme.component.css'],
})
export class AboutMeComponent implements OnInit, OnDestroy {
  user: User | null = null;
  isLoggedIn: boolean = false;
  isMobileView: boolean = false;
  private userSubscription: Subscription = new Subscription();

  constructor(
    private userDataService: UserDataService,
    private authService: AuthService,
    private authModalService: AuthModalService,
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.userDataService.getUser().subscribe((user: User | null) => {
      this.user = user;
    });

    this.isLoggedIn = this.authService.isLoggedIn();
    this.checkScreenSize();
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }
  /**
   * Verifica el tamaño de la pantalla y establece si es vista móvil.
   */
  checkScreenSize(): void {
    this.isMobileView = window.innerWidth < 768; // Define el punto de quiebre para vista móvil
  }

  /**
   * Abre el modal de login
   */
  openLogin(): void {
    this.authModalService.openLogin();
  }

  /**
   * Abre el modal de registro
   */
  openRegister(): void {
    this.authModalService.openRegister();
  }
}
