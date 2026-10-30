// Isolated integration harness: production components + real HTTP services.
// Does not replace application routes, authenticate users or bypass identity.
import { Component, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({ selector: 'analytics-test-root', template: '<router-outlet></router-outlet>' })
class HarnessComponent {}

@NgModule({
  declarations: [HarnessComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot([
      {
        path: 'research-analytics',
        loadChildren: () =>
          import('../../src/app/research-analytics/research-analytics.module').then(
            (m) => m.ResearchAnalyticsModule,
          ),
      },
    ]),
  ],
  bootstrap: [HarnessComponent],
})
class HarnessModule {}

platformBrowserDynamic()
  .bootstrapModule(HarnessModule)
  .catch((error) => console.error(error));
