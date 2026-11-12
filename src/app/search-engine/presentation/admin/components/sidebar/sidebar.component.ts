import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminSessionService } from 'src/app/search-engine/domain/services/admin-session.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarDashboardComponent {
  constructor(
    private router: Router,
    private adminSession: AdminSessionService,
  ) {}

  logout() {
    this.adminSession.clear();
    this.router.navigate(['/admin']);
  }
}
