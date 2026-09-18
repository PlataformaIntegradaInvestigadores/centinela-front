import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ConsensusExitGuard } from './consensus-exit.guard';
import { ConsensusPageComponent } from 'src/app/consensus/presentation/pages/consensus-page/consensus-page.component';

describe('ConsensusExitGuard', () => {
  let guard: ConsensusExitGuard;
  let routerSpy: any;

  function makeComponent(userId: string | null): Partial<ConsensusPageComponent> {
    return { userId } as Partial<ConsensusPageComponent>;
  }

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.url = '/profile/u-1/my-groups/g-1/consensus/recommend-topics';

    TestBed.configureTestingModule({
      providers: [
        ConsensusExitGuard,
        { provide: Router, useValue: routerSpy },
      ],
    });
    guard = TestBed.inject(ConsensusExitGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('returns false and redirects to my-groups when on recommend-topics', () => {
    routerSpy.url = '/profile/u-1/my-groups/g-1/consensus/recommend-topics';
    const result = guard.canDeactivate(makeComponent('u-1') as ConsensusPageComponent);
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/profile/u-1/my-groups']);
  });

  it('returns false and redirects to my-groups when on valuation', () => {
    routerSpy.url = '/profile/u-1/my-groups/g-1/consensus/valuation';
    const result = guard.canDeactivate(makeComponent('u-1') as ConsensusPageComponent);
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/profile/u-1/my-groups']);
  });

  it('returns false and redirects to my-groups when on decision', () => {
    routerSpy.url = '/profile/u-1/my-groups/g-1/consensus/decision';
    const result = guard.canDeactivate(makeComponent('u-1') as ConsensusPageComponent);
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/profile/u-1/my-groups']);
  });

  it('uses the component userId in the redirect target', () => {
    routerSpy.url = '/profile/someone/my-groups/g-1/consensus/decision';
    const result = guard.canDeactivate(makeComponent('abc') as ConsensusPageComponent);
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/profile/abc/my-groups']);
  });

  it('returns true and does not navigate when not on a blocked route', () => {
    routerSpy.url = '/profile/u-1/my-groups/g-1/consensus/summary';
    const result = guard.canDeactivate(makeComponent('u-1') as ConsensusPageComponent);
    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
