import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PhaseResolverGuard implements CanActivate {
  constructor(
    private topicService: TopicService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const groupId = route.paramMap.get('groupId');

    if (!groupId) {
      this.router.navigate(['/error']);
      return new Observable<boolean>((observer) => observer.next(false));
    }

    return this.topicService.getUserCurrentPhase(groupId).pipe(
      map((response) => {
        const userPhase = response.phase;
        let redirectPhase: string;

        switch (userPhase) {
          case 0:
            redirectPhase = 'recommend-topics';
            break;
          case 1:
            redirectPhase = 'valuation';
            break;
          case 2:
            redirectPhase = 'decision';
            break;
          default:
            redirectPhase = 'recommend-topics';
            break;
        }

        if (state.url.includes(redirectPhase)) {
          return true;
        } else {
          this.router.navigate([
            `/profile/${route.parent?.parent?.params['id']}/my-groups/${groupId}/consensus/${redirectPhase}`,
          ]);
          return false;
        }
      }),
      catchError(() => {
        this.router.navigate(['/error']);
        return new Observable<boolean>((observer) => observer.next(false));
      }),
    );
  }
}
