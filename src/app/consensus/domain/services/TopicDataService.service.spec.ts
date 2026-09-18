import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TopicService } from './TopicDataService.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { environment } from 'src/environments/environment';

describe('TopicService', () => {
  let service: TopicService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  const apiUrl = `${environment.apiSocial}/v1/groups/`;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TopicService, { provide: AuthService, useValue: authServiceSpy }],
    });
    service = TestBed.inject(TopicService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('topics$ starts empty', (done) => {
    service.topics$.subscribe((topics) => {
      expect(topics).toEqual([]);
      done();
    });
  });

  it('updateTopics appends to topics$', (done) => {
    service.updateTopics({ id: 1 } as any);
    service.topics$.subscribe((topics) => {
      expect(topics).toEqual([{ id: 1 } as any]);
      done();
    });
  });

  it('getRandomRecommendedTopics GETs the random topics endpoint', () => {
    service.getRandomRecommendedTopics('g-1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/topics/random/`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getRecommendedTopicsByGroup GETs the recommended-topics endpoint', () => {
    service.getRecommendedTopicsByGroup('g-1').subscribe((res) => expect(res).toEqual([]));
    httpMock.expectOne(`${apiUrl}g-1/recommended-topics/`).flush([]);
  });

  it('getFinalsTopicsByGroup GETs the finals-topics endpoint', () => {
    service.getFinalsTopicsByGroup('g-1').subscribe((res) => expect(res).toEqual({}));
    httpMock.expectOne(`${apiUrl}g-1/finals-topics/`).flush({});
  });

  it('getTopicsAddedByGroup GETs the added-topics endpoint', () => {
    service.getTopicsAddedByGroup('g-1').subscribe((res) => expect(res).toEqual([]));
    httpMock.expectOne(`${apiUrl}g-1/added-topics/`).flush([]);
  });

  it('getGroupTopics GETs the combined topics endpoint', () => {
    service.getGroupTopics('g-1').subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${apiUrl}g-1/topics/`).flush({ recommended_topics: [], added_topics: [] });
  });

  it('a failed GET is formatted through handleError', (done) => {
    spyOn(console, 'error');
    service.getRandomRecommendedTopics('g-1').subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('Server-side error: boom');
        done();
      },
    });
    httpMock
      .expectOne(`${apiUrl}g-1/topics/random/`)
      .flush({ detail: 'boom' }, { status: 400, statusText: 'Bad Request' });
  });

  describe('addNewTopic', () => {
    it('adds the topic and updates topics$ when phase is under 2', (done) => {
      authServiceSpy.getUserId.and.returnValue('u-1');

      service.addNewTopic('g-1', 'New Topic').subscribe((response) => {
        expect(response).toEqual({ id: 5, topic: 'New Topic' });
      });

      const phaseReq = httpMock.expectOne(`${apiUrl}g-1/current-phase/`);
      phaseReq.flush({ phase: 1 });

      const addReq = httpMock.expectOne(`${apiUrl}g-1/add-topic/`);
      expect(addReq.request.body).toEqual({ topic: 'New Topic', user_id: 'u-1' });
      addReq.flush({ id: 5, topic: 'New Topic' });

      service.topics$.subscribe((topics) => {
        expect(topics).toEqual([{ id: 5, topic: 'New Topic' } as any]);
        done();
      });
    });

    it('rejects with a 403 when the group is already in phase 2+', (done) => {
      authServiceSpy.getUserId.and.returnValue('u-1');

      service.addNewTopic('g-1', 'Late Topic').subscribe({
        error: (err: any) => {
          expect(err.status).toBe(403);
          done();
        },
      });

      const phaseReq = httpMock.expectOne(`${apiUrl}g-1/current-phase/`);
      phaseReq.flush({ phase: 2 });

      httpMock.expectNone(`${apiUrl}g-1/add-topic/`);
    });
  });

  it('notifyTopicVisited POSTs the topic/user ids', () => {
    service.notifyTopicVisited('g-1', 't-1', 'u-1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/topic-visited/`);
    expect(req.request.body).toEqual({ topic_id: 't-1', user_id: 'u-1' });
    req.flush({});
  });

  it('notifyCombinedSearch POSTs the topic ids', () => {
    service.notifyCombinedSearch('g-1', ['t-1', 't-2'], 'u-1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/combined-search/`);
    expect(req.request.body).toEqual({ topics: ['t-1', 't-2'], user_id: 'u-1' });
    req.flush({});
  });

  it('notifyExpertice POSTs the expertise payload', () => {
    service.notifyExpertice('g-1', 3, 'u-1', 5).subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/user-expertise/`);
    expect(req.request.body).toEqual({
      group_id: 'g-1',
      topic_id: 3,
      user_id: 'u-1',
      expertise_level: 5,
    });
    req.flush({});
  });

  it('notifyPhaseOneCompleted POSTs the user id', () => {
    service.notifyPhaseOneCompleted('g-1', 'u-1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/phase-one-completed/`);
    expect(req.request.body).toEqual({ user_id: 'u-1' });
    req.flush({});
  });

  it('notifyTopicReorder POSTs the reorder payload', () => {
    service.notifyTopicReorder('g-1', 'u-1', 't-1', 0, 2).subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/topic-reorder/`);
    expect(req.request.body).toEqual({
      user_id: 'u-1',
      topic_id: 't-1',
      original_position: 0,
      new_position: 2,
    });
    req.flush({});
  });

  it('notifyTopicTagChange POSTs the tag payload', () => {
    service.notifyTopicTagChange('g-1', 'u-1', 3, 'important').subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/tag-topic/`);
    expect(req.request.body).toEqual({ user_id: 'u-1', topic_id: 3, tag: 'important' });
    req.flush({});
  });

  it('saveFinalTopicOrder POSTs the final order payload', () => {
    service.saveFinalTopicOrder('g-1', 'u-1', [{ id: 1, position: 0 }]).subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/save-final-topic-order/`);
    expect(req.request.body).toEqual({ final_topic_orders: [{ id: 1, position: 0 }] });
    req.flush({});
  });

  it('getConsensusResults GETs the calculations endpoint', () => {
    service.getConsensusResults('g-1').subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${apiUrl}g-1/execute_consensus_calculations/`).flush({});
  });

  describe('getConsensusResultsByVotingType', () => {
    it('errors immediately for an empty groupId without hitting the API', (done) => {
      service.getConsensusResultsByVotingType('', 'majority').subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('Group ID is empty');
          done();
        },
      });
      httpMock.expectNone(() => true);
    });

    it('maps the response to its results array', (done) => {
      service.getConsensusResultsByVotingType('g-1', 'majority').subscribe((results) => {
        expect(results).toEqual([{ topic: 'A' } as any]);
        done();
      });
      httpMock
        .expectOne(`${apiUrl}g-1/execute_consensus_calculations/majority/`)
        .flush({ results: [{ topic: 'A' }] });
    });

    it('formats a fetch failure', (done) => {
      spyOn(console, 'error');
      service.getConsensusResultsByVotingType('g-1', 'majority').subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('Error fetching consensus results');
          done();
        },
      });
      httpMock
        .expectOne(`${apiUrl}g-1/execute_consensus_calculations/majority/`)
        .flush('fail', { status: 500, statusText: 'Server Error' });
    });
  });

  it('saveUserSatisfaction POSTs the satisfaction level', () => {
    service.saveUserSatisfaction('g-1', 'u-1', 'high').subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/user_satisfaction/`);
    expect(req.request.body).toEqual({ satisfaction_level: 'high' });
    req.flush({});
  });

  it('getUserSatisfactionNotifications GETs the satisfaction notifications endpoint', () => {
    service.getUserSatisfactionNotifications('g-1').subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${apiUrl}g-1/satisfaction/notifications/`).flush({});
  });

  it('getSatisfactionCounts GETs the satisfaction-counts endpoint', () => {
    service.getSatisfactionCounts('g-1').subscribe((res) => expect(res).toBeTruthy());
    httpMock.expectOne(`${apiUrl}g-1/satisfaction-counts/`).flush({});
  });

  it('getUserCurrentPhase GETs the current-phase endpoint', () => {
    service.getUserCurrentPhase('g-1').subscribe((res: any) => expect(res.phase).toBe(1));
    httpMock.expectOne(`${apiUrl}g-1/current-phase/`).flush({ phase: 1 });
  });

  it('changeUserPhase POSTs the new phase', () => {
    service.changeUserPhase('g-1', 2).subscribe();
    const req = httpMock.expectOne(`${apiUrl}g-1/update-phase/`);
    expect(req.request.body).toEqual({ phase: 2 });
    req.flush({});
  });
});
