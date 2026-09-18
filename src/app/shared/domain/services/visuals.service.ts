import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardCounts, Word, YearsResponse } from '../../interfaces/dashboard.interface';
import { environment } from '../../../../environments/environment';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import * as d3 from 'd3';

@Injectable({
  providedIn: 'root',
})
export class VisualsService {
  private apiUrl = environment.apiSearch + '/v1/dashboard';

  constructor(private http: HttpClient) {}

  getCounts(year?: number): Observable<DashboardCounts> {
    if (year) {
      const params = new HttpParams().set('year', year.toString());
      return this.http.get<DashboardCounts>(`${this.apiUrl}/country/get_acumulated/`, { params });
    } else {
      return this.http.get<DashboardCounts>(`${this.apiUrl}/country/get_acumulated/`);
    }
  }

  getTopics(number_top: number): Observable<Word[]> {
    const params = new HttpParams().set('number_top', number_top.toString());
    return this.http.get<Word[]>(`${this.apiUrl}/country/get_topics/`, { params });
  }

  getProvinces(): Observable<YearsResponse[]> {
    return this.http.get<YearsResponse[]>(`${this.apiUrl}/province/get_provinces/`);
  }

  generateColorDomain(length: number): d3.ScaleSequential<string> {
    return d3.scaleSequential(d3.interpolateViridis).domain([0, length - 1]);
  }

  createColorScheme(length: number): Color {
    const colorScale = this.generateColorDomain(length);
    const colors: string[] = [];
    for (let i = 0; i < length; i++) {
      colors.push(colorScale(i) as unknown as string);
    }
    return {
      name: 'custom',
      selectable: true,
      group: ScaleType.Ordinal,
      domain: colors,
    };
  }
}
