import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/search-engine/domain/services/authentication.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent {
  username: string = '';
  password: string = '';
  constructor(
    private AuthenticationService: AuthenticationService,
    private router: Router,
  ) {}
  message: string = '';

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
