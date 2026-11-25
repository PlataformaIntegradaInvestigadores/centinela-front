import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LayerRelease } from '../entities/lineage';

@Injectable({ providedIn: 'root' })
export class LineageService {
  constructor(private readonly http: HttpClient) {}
  current(): Observable<LayerRelease> {
    return this.http.get<LayerRelease>(`${environment.apiAnalytics}/lineage/current`);
  }
}
