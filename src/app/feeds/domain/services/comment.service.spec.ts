import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CommentService } from './comment.service';
import { environment } from 'src/environments/environment';

describe('CommentService', () => {
  let service: CommentService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiSocial}/v1`;

  const rawComment = {
    id: 'c-1',
    content: 'hi',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CommentService],
    });
    service = TestBed.inject(CommentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getPostComments converts dates on every comment', (done) => {
    service.getPostComments('p-1').subscribe((comments) => {
      expect(comments[0].created_at instanceof Date).toBeTrue();
      expect(comments[0].updated_at instanceof Date).toBeTrue();
      done();
    });
    httpMock.expectOne(`${apiUrl}/posts/p-1/comments/`).flush([rawComment]);
  });

  it('createComment converts dates on the returned comment', (done) => {
    service.createComment('p-1', { content: 'hi' }).subscribe((comment) => {
      expect(comment.created_at instanceof Date).toBeTrue();
      done();
    });
    const req = httpMock.expectOne(`${apiUrl}/posts/p-1/comments/`);
    expect(req.request.method).toBe('POST');
    req.flush(rawComment);
  });

  it('getCommentReplies converts dates on every reply', (done) => {
    service.getCommentReplies('c-1').subscribe((replies) => {
      expect(replies[0].created_at instanceof Date).toBeTrue();
      done();
    });
    httpMock.expectOne(`${apiUrl}/comments/c-1/replies/`).flush([rawComment]);
  });

  it('updateComment PATCHes the content and converts dates', (done) => {
    service.updateComment('c-1', 'edited').subscribe((comment) => {
      expect(comment.updated_at instanceof Date).toBeTrue();
      done();
    });
    const req = httpMock.expectOne(`${apiUrl}/comments/c-1/`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ content: 'edited' });
    req.flush(rawComment);
  });

  it('deleteComment DELETEs the comment', () => {
    service.deleteComment('c-1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/comments/c-1/`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('toggleCommentLike POSTs to the like endpoint', () => {
    service.toggleCommentLike('c-1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/comments/c-1/like/`);
    expect(req.request.method).toBe('POST');
    req.flush({ liked: true, likes_count: 1 });
  });
});
