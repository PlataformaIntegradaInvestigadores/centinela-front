import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  let component: AboutComponent;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', [], { url: '/home/about-us/getting-started' });
    TestBed.configureTestingModule({
      declarations: [AboutComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: Router, useValue: routerSpy }],
    });
    component = TestBed.createComponent(AboutComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('isActive checks whether the current url includes the given route', () => {
    expect(component.isActive('getting-started')).toBeTrue();
    expect(component.isActive('team')).toBeFalse();
  });

  it('toggleMenu flips menuOpen', () => {
    expect(component.menuOpen).toBeFalse();
    component.toggleMenu();
    expect(component.menuOpen).toBeTrue();
    component.toggleMenu();
    expect(component.menuOpen).toBeFalse();
  });

  it('closeMenu always sets menuOpen to false', () => {
    component.toggleMenu();
    component.closeMenu();
    expect(component.menuOpen).toBeFalse();
  });
});
