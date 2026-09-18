import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReactionService } from './reaction.service';
import { environment } from 'src/environments/environment';

describe('ReactionService', () => {
  let service: ReactionService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiSocial}/v1/reactions`;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReactionService],
    });
    service = TestBed.inject(ReactionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('adds a reaction with the auth header and JSON content type', () => {
    localStorage.setItem('accessToken', 'tok-1');
    service.addReaction({ message_id: 5 }).subscribe();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-1');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.body).toEqual({ message_id: 5 });
    req.flush({});
  });

  it('removes a reaction by id with the auth header', () => {
    localStorage.setItem('accessToken', 'tok-2');
    service.removeReaction(9).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/9/`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-2');
    req.flush({});
  });
});
