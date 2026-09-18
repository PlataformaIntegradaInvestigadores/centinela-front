import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FairnessSummary } from '../entities/fairness.interface';

/**
 * Consume los endpoints del dashboard de fairness (modulo admin).
 * Sirven los resultados pre-calculados de la mitigacion de sesgos (S5-S10).
 */
@Injectable({
  providedIn: 'root',
})
export class FairnessService {
  private rootURL: string = environment.apiSearch;

  constructor(private httpClient: HttpClient) {}

  /** Todos los resultados consolidados en una sola llamada. */
  getSummary(): Observable<FairnessSummary> {
    return this.httpClient.get<FairnessSummary>(`${this.rootURL}/v1/dashboard/fairness/summary/`);
  }

  /** Linea base de equidad (diagnostico S5) + importancia SHAP. */
  getBaseline(): Observable<Partial<FairnessSummary>> {
    return this.httpClient.get<Partial<FairnessSummary>>(
      `${this.rootURL}/v1/dashboard/fairness/baseline/`,
    );
  }

  /** Impacto antes/despues, veredicto contra umbrales y seleccion final (S10). */
  getMitigation(): Observable<Partial<FairnessSummary>> {
    return this.httpClient.get<Partial<FairnessSummary>>(
      `${this.rootURL}/v1/dashboard/fairness/mitigation/`,
    );
  }

  /** Barridos de sensibilidad de alpha (modelo) y lambda (buscador). */
  getSensitivity(): Observable<Partial<FairnessSummary>> {
    return this.httpClient.get<Partial<FairnessSummary>>(
      `${this.rootURL}/v1/dashboard/fairness/sensitivity/`,
    );
  }
}
