import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PhaseResolverGuard } from './phase-resolver.guard';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';

describe('PhaseResolverGuard', () => {
  let guard: PhaseResolverGuard;
  let routerSpy: jasmine.SpyObj<Router>;
  let topicServiceSpy: jasmine.SpyObj<TopicService>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    topicServiceSpy = jasmine.createSpyObj('TopicService', ['getUserCurrentPhase']);

    TestBed.configureTestingModule({
      providers: [
        PhaseResolverGuard,
        { provide: Router, useValue: routerSpy },
        { provide: TopicService, useValue: topicServiceSpy },
      ],
    });

    guard = TestBed.inject(PhaseResolverGuard);
  });

  function route(groupId: string | null, parentId = 'p-1'): any {
    return {
      paramMap: { get: (_: string) => groupId },
      parent: { parent: { params: { id: parentId } } },
    };
  }

  it('redirects to /error and blocks when groupId is missing', (done) => {
    (guard.canActivate(route(null), { url: '/x' } as any) as any).subscribe(
      (result: boolean) => {
        expect(result).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/error']);
        done();
      },
    );
  });

  it('allows access when the current URL already matches the resolved phase', (done) => {
    topicServiceSpy.getUserCurrentPhase.and.returnValue(of({ phase: 1 }));
    guard.canActivate(route('g-1'), { url: '/consensus/valuation' } as any).subscribe((result) => {
      expect(result).toBeTrue();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('redirects when the current URL does not match the resolved phase', (done) => {
    topicServiceSpy.getUserCurrentPhase.and.returnValue(of({ phase: 2 }));
    guard.canActivate(route('g-1'), { url: '/consensus/valuation' } as any).subscribe((result) => {
      expect(result).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith([
        '/profile/p-1/my-groups/g-1/consensus/decision',
      ]);
      done();
    });
  });

  it('redirects to /error on service failure', (done) => {
    topicServiceSpy.getUserCurrentPhase.and.returnValue(throwError(() => 'boom'));
    guard.canActivate(route('g-1'), { url: '/x' } as any).subscribe((result) => {
      expect(result).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/error']);
      done();
    });
  });
});
