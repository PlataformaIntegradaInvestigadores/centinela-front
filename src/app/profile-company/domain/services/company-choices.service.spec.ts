import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CompanyChoicesService } from './company-choices.service';
import { environment } from 'src/environments/environment';

describe('CompanyChoicesService', () => {
  let service: CompanyChoicesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CompanyChoicesService],
    });
    service = TestBed.inject(CompanyChoicesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getCompanyChoices GETs the choices endpoint', () => {
    service.getCompanyChoices().subscribe((choices) => {
      expect(choices.industries.length).toBe(1);
    });
    const req = httpMock.expectOne(`${environment.apiIdentity}/companies/choices/`);
    expect(req.request.method).toBe('GET');
    req.flush({ industries: [{ value: 'tech', label: 'Tech' }], employee_counts: [] });
  });
});
