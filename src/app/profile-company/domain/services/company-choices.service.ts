import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ChoiceOption {
  value: string;
  label: string;
}

export interface CompanyChoices {
  industries: ChoiceOption[];
  employee_counts: ChoiceOption[];
}

@Injectable({
  providedIn: 'root',
})
export class CompanyChoicesService {
  private apiUrl = environment.apiIdentity;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las opciones disponibles para los formularios de empresa
   */
  getCompanyChoices(): Observable<CompanyChoices> {
    return this.http.get<CompanyChoices>(`${this.apiUrl}/companies/choices/`);
  }
}
