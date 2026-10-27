import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/search-engine/domain/services/authentication.service';
import { ModerationService } from 'src/app/moderation/domain/services/moderation.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  username: string = '';
  password: string = '';
  constructor(
    private AuthenticationService: AuthenticationService,
    private router: Router,
    private moderationService: ModerationService,
  ) {}
  message: string = '';
  /** Signed in to Centinela as a moderator: can enter the admin area without admin credentials. */
  isModerator = false;

  ngOnInit(): void {
    this.moderationService
      .isModerator()
      .subscribe((isModerator) => (this.isModerator = isModerator));
  }

  login() {
    this.AuthenticationService.login(this.username, this.password).subscribe({
      next: (success) => {
        if (success) {
          localStorage.setItem('authState', 'authenticated');
          this.router.navigate(['/admin/dashboard']);
        }
      },
      error: (error) => {
        this.message = error.error.message;
        console.log(error.error.message);
      },
    });
  }
}
