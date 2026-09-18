import { Injectable } from '@angular/core';
import { CanDeactivate, Router } from '@angular/router';
import { ConsensusPageComponent } from 'src/app/consensus/presentation/pages/consensus-page/consensus-page.component';

@Injectable({
  providedIn: 'root',
})
export class ConsensusExitGuard implements CanDeactivate<ConsensusPageComponent> {
  constructor(private router: Router) {}

  canDeactivate(component: ConsensusPageComponent): boolean {
    const currentUrl = this.router.url;
    if (
      currentUrl.includes('consensus/recommend-topics') ||
      currentUrl.includes('consensus/valuation') ||
      currentUrl.includes('consensus/decision')
    ) {
      const userId = component.userId;
      this.router.navigate([`/profile/${userId}/my-groups`]);
      return false;
    }
    return true;
  }
}
