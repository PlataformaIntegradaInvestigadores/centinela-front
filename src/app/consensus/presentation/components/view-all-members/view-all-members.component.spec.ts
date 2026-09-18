import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ViewAllMembersComponent } from './view-all-members.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Renderer2, NO_ERRORS_SCHEMA } from '@angular/core';

describe('ViewAllMembersComponent', () => {
  let component: ViewAllMembersComponent;
  let fixture: ComponentFixture<ViewAllMembersComponent>;

  let renderer: any;
  let router: any;

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    (router as any).events = of(new NavigationEnd(0, '/x', '/x'));

    TestBed.configureTestingModule({
      declarations: [ViewAllMembersComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: Router, useValue: router }],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(ViewAllMembersComponent);
    component = fixture.componentInstance;
    // Ivy resolves Renderer2 through its own internal path, not the regular provider
    // chain, so `{ provide: Renderer2, useValue: ... }` above is silently ignored. Spy
    // on the real instance the component actually receives instead.
    renderer = fixture.debugElement.injector.get(Renderer2);
    spyOn(renderer, 'addClass');
    spyOn(renderer, 'removeClass');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close modal on navigation end', () => {
    spyOn(document, 'getElementById').and.returnValue(null);
    component.ngOnInit();
    expect(renderer.removeClass).toHaveBeenCalled();
  });

  it('should filter members on delete', () => {
    component.members = [{ id: 'a' }, { id: 'b' }] as any;
    component.onMemberDeleted('a');
    expect(component.members?.length).toBe(1);
    expect(component.members?.[0].id).toBe('b');
  });

  it('should not filter when members null', () => {
    component.members = null;
    component.onMemberDeleted('a');
    expect(component.members).toBeNull();
  });

  it('should open modal', () => {
    const fakeEl = { classList: { remove: jasmine.createSpy('remove') } } as any;
    spyOn(document, 'getElementById').and.returnValue(fakeEl);
    component.openModal();
    expect(fakeEl.classList.remove).toHaveBeenCalledWith('hidden');
    expect(renderer.addClass).toHaveBeenCalledWith(document.body, 'overflow-hidden');
  });

  it('should close modal', () => {
    const fakeEl = { classList: { add: jasmine.createSpy('add') } } as any;
    spyOn(document, 'getElementById').and.returnValue(fakeEl);
    component.closeModal();
    expect(fakeEl.classList.add).toHaveBeenCalledWith('hidden');
    expect(renderer.removeClass).toHaveBeenCalledWith(document.body, 'overflow-hidden');
  });
});
