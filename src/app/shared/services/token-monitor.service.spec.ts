import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TokenMonitorService } from './token-monitor.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { AuthResponse } from 'src/app/auth/domain/entities/interfaces';

describe('TokenMonitorService', () => {
  let service: TokenMonitorService;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    jasmine.clock().install();
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isLoggedIn',
      'getTokenExpirationTime',
      'clearLocalSession',
      'refreshToken',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy.isLoggedIn.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        TokenMonitorService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(TokenMonitorService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    jasmine.clock().uninstall();
  });

  it('does nothing on tick when the user is not logged in', () => {
    jasmine.clock().tick(30000);
    expect(authServiceSpy.getTokenExpirationTime).not.toHaveBeenCalled();
  });

  it('logs out and redirects when the token has already expired', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getTokenExpirationTime.and.returnValue(0);

    jasmine.clock().tick(30000);

    expect(authServiceSpy.clearLocalSession).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('attempts a refresh when the token expires in under 2 minutes', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getTokenExpirationTime.and.returnValue(100);
    authServiceSpy.refreshToken.and.returnValue(of({ access: 'new-tok' } as AuthResponse));

    jasmine.clock().tick(30000);

    expect(authServiceSpy.refreshToken).toHaveBeenCalled();
    expect(authServiceSpy.clearLocalSession).not.toHaveBeenCalled();
  });

  it('logs out when a refresh attempt fails', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getTokenExpirationTime.and.returnValue(100);
    authServiceSpy.refreshToken.and.returnValue(throwError(() => new Error('fail')));

    jasmine.clock().tick(30000);

    expect(authServiceSpy.clearLocalSession).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not act (beyond logging) when the token has more than 5 minutes left', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getTokenExpirationTime.and.returnValue(3600);

    jasmine.clock().tick(30000);

    expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
    expect(authServiceSpy.clearLocalSession).not.toHaveBeenCalled();
  });

  it('restartMonitoring clears and reschedules the interval', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getTokenExpirationTime.and.returnValue(3600);

    service.restartMonitoring();
    jasmine.clock().tick(30000);

    expect(authServiceSpy.getTokenExpirationTime).toHaveBeenCalled();
  });

  it('stopMonitoring prevents further checks', () => {
    service.stopMonitoring();
    authServiceSpy.isLoggedIn.and.returnValue(true);

    jasmine.clock().tick(60000);

    expect(authServiceSpy.getTokenExpirationTime).not.toHaveBeenCalled();
  });
});
