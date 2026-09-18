import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Company } from 'src/app/profile-company/domain/entities/company.interface';
import { CompanyService } from 'src/app/profile-company/domain/services/company.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';

@Component({
  selector: 'app-company-profile',
  templateUrl: './profile-company-page.component.html',
  styleUrls: ['./profile-company-page.component.css'],
})
export class CompanyProfilePageComponent implements OnInit {
  company: Company | null = null;
  activeTab = 'about' as const; // Solo mantenemos la pestaña "about"
  loading = false;
  companyId: string | null = null;
  showEditModal = false;

  constructor(
    private companyService: CompanyService,
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    // Obtener el ID de la empresa desde la ruta
    this.route.params.subscribe((params) => {
      this.companyId = params['id'];
      if (this.companyId) {
        this.loadCompanyProfile();
      }
    });
  }

  loadCompanyProfile(): void {
    if (!this.companyId) return;

    this.loading = true;
    // Si es la empresa autenticada, usar getMyProfile, sino getCompanyProfile
    const currentCompanyId = this.authService.getCompanyId();

    if (currentCompanyId === this.companyId) {
      this.companyService.getMyProfile().subscribe({
        next: (company: Company) => {
          this.company = company;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading company profile:', error);
          this.loading = false;
        },
      });
    } else {
      this.companyService.getCompanyProfile(this.companyId).subscribe({
        next: (company: Company) => {
          this.company = company;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading company profile:', error);
          this.loading = false;
        },
      });
    }
  }

  setActiveTab(tab: 'about'): void {
    this.activeTab = tab;
  }

  /**
   * Check if current user is the company owner
   */
  isCompanyOwner(): boolean {
    const currentCompanyId = this.authService.getCompanyId();
    return currentCompanyId === this.companyId;
  }

  /**
   * Abre el modal de edición de perfil
   */
  openEditModal(): void {
    this.showEditModal = true;
  }

  /**
   * Cierra el modal de edición de perfil
   */
  closeEditModal(): void {
    this.showEditModal = false;
  }

  /**
   * Maneja la actualización del perfil de la empresa
   */
  onProfileUpdated(updatedCompany: Company): void {
    // Asegurar que el ID se mantenga
    if (this.company && !updatedCompany.id) {
      updatedCompany.id = this.company.id;
    }

    // Crear una nueva referencia del objeto para forzar la detección de cambios
    this.company = { ...updatedCompany };
    this.showEditModal = false;
    console.log('Perfil actualizado exitosamente:', this.company);
  }
}
