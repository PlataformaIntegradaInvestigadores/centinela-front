import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { UserDataService } from 'src/app/profile/domain/services/user_data.service';
import { UserProfile } from 'src/app/profile/domain/entities/user.interfaces';
import { Author } from 'src/app/shared/interfaces/author.interface';

@Component({
  selector: 'app-data-nav',
  templateUrl: './data-nav.component.html',
  styleUrls: ['./data-nav.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class DataNavComponent implements OnChanges {
  @Input() user: UserProfile | null = null;
  @Input() isOwnProfile: boolean = false;
  @Input() authorCentinela: Author | undefined;
  isLoggedIn: boolean = false;
  navOpen: boolean = false;

  constructor(
    private userDataService: UserDataService,
    private authService: AuthService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']) {
      this.userDataService.changeUser(this.user);
      this.isLoggedIn = this.authService.isLoggedIn();
    }
  }

  toggleNav(): void {
    this.navOpen = !this.navOpen;
  }
}
