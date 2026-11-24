// header.component.ts
import { Component, Input, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { AuthModalService } from 'src/app/auth/domain/services/auth-modal.service';
import { User } from 'src/app/group/presentation/user.interface';
import {
  faSearch,
  faHome,
  faBell,
  faUser,
  faRss,
  faBriefcase,
  faChevronDown,
  faCog,
  faSignOutAlt,
  faUsers,
  faBuilding,
  faBars,
  faTimes,
  faChartBar,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  navOpen: boolean = false;
  isActive: boolean = true;
  showLogin: boolean = false;
  user: any;
  userId: any;
  users: User[] = [];
  filteredUsers: User[] = [];
  searchQuery: string = '';
  searchOpen: boolean = false; // Variable para controlar la apertura del buscador
  userMenuOpen: boolean = false; // Variable para controlar la apertura del menú de usuario

  // FontAwesome icons
  faSearch = faSearch;
  faHome = faHome;
  faBell = faBell;
  faUser = faUser;
  faRss = faRss;
  faBriefcase = faBriefcase;
  faChevronDown = faChevronDown;
  faCog = faCog;
  faSignOutAlt = faSignOutAlt;
  faUsers = faUsers;
  faBuilding = faBuilding;
  faBars = faBars;
  faTimes = faTimes;
  faChartBar = faChartBar;
  faInfoCircle = faInfoCircle;

  constructor(
    private router: Router,
    private authService: AuthService,
    private authModalService: AuthModalService,
  ) {}

  toggleNav() {
    this.navOpen = !this.navOpen;
  }

  openSearch() {
    this.searchOpen = true;
  }

  closeSearch() {
    this.searchOpen = false;
    this.searchQuery = '';
    this.filteredUsers = [];
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Close search dropdown if clicking outside
    if (!target.closest('.search-container')) {
      this.closeSearch();
    }

    // Close user menu dropdown if clicking outside the user dropdown container
    const userDropdownContainer = target.closest('.nav-item.relative');
    if (!userDropdownContainer && this.userMenuOpen) {
      this.userMenuOpen = false;
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.userMenuOpen) {
      this.userMenuOpen = false;
      event.preventDefault();
    }
  }

  @Input({ required: false })
  showInformation: boolean = false;

  // Check if current route is jobs
  get isJobsActive(): boolean {
    return this.router.url.includes('/jobs');
  }

  ngOnInit(): void {
    this.showLogin = !this.authService.isLoggedIn();
    if (!this.showLogin && this.authService.isUser()) {
      this.loadUsers();
    }
  }
  logout() {
    this.authService.logout();
    this.router.navigate(['/home']).then(() => {
      window.location.reload();
    });
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

  profile() {
    const userType = this.authService.getUserType();
    if (userType === 'company') {
      const companyId = this.authService.getCompanyId();
      if (companyId) {
        this.router.navigate([`/company/${companyId}`]);
      }
    } else {
      const userId = this.authService.getUserId();
      if (userId) {
        this.router.navigate([`/profile/${userId}/about-me`]);
      }
    }
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe(
      (users: User[]) => {
        this.users = users;
        this.filteredUsers = users;
      },
      () => {
        this.users = [];
        this.filteredUsers = [];
      },
    );
  }

  filterUsers(): void {
    const filterValue = this.searchQuery.toLowerCase();
    this.filteredUsers = this.users.filter((user) =>
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(filterValue),
    );
  }

  generateUserGroupUrl(userId: string): string {
    return `/profile/${userId}/about-me`;
  }

  /**
   * Navigate to feeds page
   */
  navigateToFeeds(): void {
    this.router.navigate(['/feeds']);
  }

  /**
   * Navigate to jobs page
   */
  navigateToJobs(): void {
    const currentUserId = this.authService.getCurrentUserId();
    if (currentUserId) {
      this.router.navigate([`/jobs/${currentUserId}`]);
    }
  }

  /**
   * Check if current user is a company
   */
  isCompany(): boolean {
    return this.authService.isCompany();
  }

  /**
   * Check if current user is a researcher
   */
  isUser(): boolean {
    return this.authService.isUser();
  }

  /**
   * Get current user type for display purposes
   */
  getUserType(): string {
    const userType = this.authService.getUserType();
    return userType === 'company' ? 'Company' : 'Researcher';
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }
}
