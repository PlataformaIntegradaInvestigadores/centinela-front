import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/search-engine/domain/services/authentication.service';
import { ModerationService } from 'src/app/moderation/domain/services/moderation.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarDashboardComponent implements OnInit {
  /** Admin session from the /admin login (existing loginGuard pattern). */
  isAdmin = false;
  /** Centinela account listed as moderator in social-service. */
  isModerator = false;

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private moderationService: ModerationService,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authenticationService.isAuthenticated();
    this.moderationService
      .isModerator()
      .subscribe((isModerator) => (this.isModerator = isModerator));
  }

  logout() {
    localStorage.removeItem('authState');
    this.router.navigate(['/admin']);
  }
}
