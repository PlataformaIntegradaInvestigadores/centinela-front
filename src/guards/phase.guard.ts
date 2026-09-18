import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';

@Injectable({
  providedIn: 'root',
})
export class PhaseGuard implements CanActivate {
  constructor(
    private router: Router,
    private topicService: TopicService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const groupId = route.parent?.paramMap.get('groupId');
    const expectedPhase = route.data['expectedPhase'];

    if (!groupId) {
      console.error('Group ID is missing in route parameters');
      this.router.navigate(['/somewhere-else']);
      return false;
    }

    return new Promise<boolean>((resolve) => {
      this.topicService.getUserCurrentPhase(groupId).subscribe(
        (response) => {
          const userPhase = response.phase;
          if (userPhase >= expectedPhase) {
            resolve(true);
          } else {
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
            this.router.navigate([
              `/profile/${route.parent?.parent?.params['id']}/my-groups/${groupId}/consensus/${redirectPhase}`,
            ]);
            resolve(false);
          }
        },
        (error) => {
          console.error('Error fetching user phase:', error);
          this.router.navigate(['/somewhere-else']);
          resolve(false);
        },
      );
    });
  }
}
