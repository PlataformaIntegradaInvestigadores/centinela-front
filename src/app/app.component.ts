import { Component, OnInit, OnDestroy } from '@angular/core';
import { initFlowbite } from 'flowbite';
import { Title } from '@angular/platform-browser';
import { TokenMonitorService } from './shared/services/token-monitor.service';
import { AuthService } from './auth/domain/services/auth.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private title: Title,
    private tokenMonitorService: TokenMonitorService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Welcome');
    initFlowbite();

    // Suscribirse a eventos de refresh de token para reiniciar el monitoreo
    this.authService.tokenRefresh$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.tokenMonitorService.restartMonitoring();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
