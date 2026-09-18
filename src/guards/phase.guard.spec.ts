import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PhaseGuard } from './phase.guard';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';

describe('PhaseGuard', () => {
  let guard: PhaseGuard;
  let routerSpy: jasmine.SpyObj<Router>;
  let topicServiceSpy: jasmine.SpyObj<TopicService>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    topicServiceSpy = jasmine.createSpyObj('TopicService', ['getUserCurrentPhase']);

    TestBed.configureTestingModule({
      providers: [
        PhaseGuard,
        { provide: Router, useValue: routerSpy },
        { provide: TopicService, useValue: topicServiceSpy },
      ],
    });

    guard = TestBed.inject(PhaseGuard);
  });

  function route(groupId: string | null, expectedPhase: number, parentId = 'p-1'): any {
    return {
      parent: {
        paramMap: { get: (_: string) => groupId },
        parent: { params: { id: parentId } },
      },
      data: { expectedPhase },
    };
  }

  it('blocks and redirects when groupId is missing', async () => {
    const result = await guard.canActivate(route(null, 1));
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/somewhere-else']);
  });

  it('allows access when the user phase meets the expected phase', async () => {
    topicServiceSpy.getUserCurrentPhase.and.returnValue(of({ phase: 2 }));
    const result = await guard.canActivate(route('g-1', 2));
    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('redirects to the phase-specific route when the user is behind', async () => {
    topicServiceSpy.getUserCurrentPhase.and.returnValue(of({ phase: 1 }));
    const result = await guard.canActivate(route('g-1', 2));
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith([
      '/profile/p-1/my-groups/g-1/consensus/valuation',
    ]);
  });

  it('falls back to recommend-topics for an unknown phase', async () => {
    topicServiceSpy.getUserCurrentPhase.and.returnValue(of({ phase: 99 }));
    const result = await guard.canActivate(route('g-1', 100));
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith([
      '/profile/p-1/my-groups/g-1/consensus/recommend-topics',
    ]);
  });

  it('redirects to /somewhere-else on service error', async () => {
    topicServiceSpy.getUserCurrentPhase.and.returnValue(throwError(() => 'boom'));
    const result = await guard.canActivate(route('g-1', 1));
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/somewhere-else']);
  });
});
