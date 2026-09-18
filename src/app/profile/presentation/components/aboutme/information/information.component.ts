import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { ContactInfo, User, UserInfo } from 'src/app/profile/domain/entities/user.interfaces';
import { InformationService } from 'src/app/profile/domain/services/information.service';
import { UserDataService } from 'src/app/profile/domain/services/user_data.service';

@Component({
  selector: 'app-information',
  templateUrl: './information.component.html',
  styleUrls: ['./information.component.css'],
})
export class InformationComponent implements OnInit {
  @Input() user: User | null = null;
  userInfo: UserInfo = {};
  disciplines: string[] = [];
  contactInfo: ContactInfo[] = [];
  isLoggedIn: boolean = false;

  constructor(
    private informationService: InformationService,
    private authService: AuthService,
    private userDataService: UserDataService,
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.user) {
      this.fetchPublicInformation(this.user.id!);
    }
  }

  /**
   * Obtiene la información pública del usuario.
   * @param userId - El ID del usuario.
   */
  fetchPublicInformation(userId: string): void {
    this.informationService.getPublicInformation(userId).subscribe((info: UserInfo) => {
      this.userInfo = info || {};
      this.disciplines = info.disciplines || [];
      this.contactInfo = info.contact_info || [];
    });
  }

  /**
   * Guarda la información de "Sobre mí".
   * @param aboutMe - El contenido de "Sobre mí".
   */
  saveAboutMe(aboutMe: string): void {
    this.informationService
      .updateInformation({ about_me: aboutMe })
      .subscribe((response: UserInfo) => {
        this.userInfo.about_me = response.about_me;
      });
  }

  /**
   * Guarda las disciplinas del usuario.
   * @param disciplines - Las disciplinas a guardar.
   */
  saveDisciplines(disciplines: string[]): void {
    this.informationService.updateInformation({ disciplines }).subscribe((response: UserInfo) => {
      this.disciplines = response.disciplines || [];
    });
  }

  /**
   * Guarda la información de contacto del usuario.
   * @param contactInfo - La información de contacto a guardar.
   */
  saveContactInfo(contactInfo: ContactInfo[]): void {
    this.informationService
      .updateInformation({ contact_info: contactInfo })
      .subscribe((response: UserInfo) => {
        this.contactInfo = response.contact_info || [];
      });
  }

  /**
   * Alterna el estado de edición.
   */
  toggleEdit(): void {
    // Implementa la lógica para manejar el estado de edición si es necesario
  }
}
