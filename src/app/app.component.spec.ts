import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { AppComponent } from './app.component';
import { TokenMonitorService } from './shared/services/token-monitor.service';
import { AuthService } from './auth/domain/services/auth.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let titleSpy: jasmine.SpyObj<Title>;
  let tokenMonitorSpy: jasmine.SpyObj<TokenMonitorService>;
  let tokenRefresh$: Subject<void>;

  beforeEach(() => {
    titleSpy = jasmine.createSpyObj('Title', ['setTitle']);
    tokenMonitorSpy = jasmine.createSpyObj('TokenMonitorService', ['restartMonitoring']);
    tokenRefresh$ = new Subject<void>();

    TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: Title, useValue: titleSpy },
        { provide: TokenMonitorService, useValue: tokenMonitorSpy },
        { provide: AuthService, useValue: { tokenRefresh$: tokenRefresh$.asObservable() } },
      ],
    });
    component = TestBed.createComponent(AppComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets the page title on init', () => {
    component.ngOnInit();
    expect(titleSpy.setTitle).toHaveBeenCalledWith('Welcome');
  });

  it('restarts token monitoring when tokenRefresh$ emits', () => {
    component.ngOnInit();
    tokenRefresh$.next();
    expect(tokenMonitorSpy.restartMonitoring).toHaveBeenCalled();
  });

  it('stops reacting to tokenRefresh$ after ngOnDestroy', () => {
    component.ngOnInit();
    component.ngOnDestroy();
    tokenRefresh$.next();
    expect(tokenMonitorSpy.restartMonitoring).not.toHaveBeenCalled();
  });
});
