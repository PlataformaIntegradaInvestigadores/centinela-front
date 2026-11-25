import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { StudyService } from './study.service';

describe('StudyService', () => {
  it('uses the existing relative analytics prefix', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(StudyService).load().subscribe();
    const request = http.expectOne(`${environment.apiAnalytics}/study`);
    expect(request.request.method).toBe('GET');
    request.flush({});
    TestBed.inject(StudyService).load('published-test-release').subscribe();
    const pinned = http.expectOne((req) => req.url === `${environment.apiAnalytics}/study`);
    expect(pinned.request.params.get('release_id')).toBe('published-test-release');
    pinned.flush({});
    http.verify();
  });
});
