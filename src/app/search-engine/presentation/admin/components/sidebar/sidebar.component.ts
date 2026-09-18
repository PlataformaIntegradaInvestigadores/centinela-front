import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarDashboardComponent {
  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('authState');
    this.router.navigate(['/admin']);
  }
}
