import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LineageService } from './lineage.service';
import { environment } from 'src/environments/environment';

describe('LineageService', () => {
  it('queries the existing gateway prefix and propagates access denial', () => {
    TestBed.configureTestingModule({imports: [HttpClientTestingModule]});
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(LineageService).current().subscribe({error: error => expect(error.status).toBe(403)});
    http.expectOne(`${environment.apiAnalytics}/lineage/current`).flush({}, {status: 403, statusText: 'Forbidden'});
    http.verify();
  });
});
