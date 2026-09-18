import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CardGroupComponent } from './card-group.component';
import { ModalService } from 'src/app/group/domain/services/modalService.service';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';

describe('CardGroupComponent', () => {
  let component: CardGroupComponent;
  let topicServiceSpy: jasmine.SpyObj<TopicService>;
  let modalOpen$: BehaviorSubject<boolean>;

  beforeEach(() => {
    modalOpen$ = new BehaviorSubject<boolean>(false);
    topicServiceSpy = jasmine.createSpyObj('TopicService', ['getUserCurrentPhase']);
    topicServiceSpy.getUserCurrentPhase.and.returnValue(of({ phase: 0 }));

    TestBed.configureTestingModule({
      declarations: [CardGroupComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: ModalService, useValue: { modalOpen$: modalOpen$.asObservable() } },
        { provide: TopicService, useValue: topicServiceSpy },
      ],
    });
    component = TestBed.createComponent(CardGroupComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('tracks the shared modalOpen$ state', () => {
    modalOpen$.next(true);
    expect(component.modalOpen).toBeTrue();
  });

  describe('ngOnChanges', () => {
    it('fetches the current phase when a group is set', () => {
      component.group = { id: 'g-1' } as any;
      component.ngOnChanges();
      expect(topicServiceSpy.getUserCurrentPhase).toHaveBeenCalledWith('g-1');
      expect(component.currentPhase).toBe('1 of 3');
    });

    it('does nothing when there is no group', () => {
      component.group = undefined;
      component.ngOnChanges();
      expect(topicServiceSpy.getUserCurrentPhase).not.toHaveBeenCalled();
    });

    it('logs an error when the phase fetch fails', () => {
      spyOn(console, 'error');
      topicServiceSpy.getUserCurrentPhase.and.returnValue(throwError(() => new Error('boom')));
      component.group = { id: 'g-1' } as any;
      component.ngOnChanges();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('transformPhase', () => {
    it('maps every known phase and falls back for unknown ones', () => {
      expect(component.transformPhase(0)).toBe('1 of 3');
      expect(component.transformPhase(1)).toBe('2 of 3');
      expect(component.transformPhase(2)).toBe('3 of 3 complete');
      expect(component.transformPhase(99)).toBe('Unknown phase');
    });
  });

  describe('onNavigate', () => {
    it('emits the group when the modal is closed', () => {
      component.group = { id: 'g-1' } as any;
      let emitted: any = null;
      component.navigate.subscribe((g: any) => (emitted = g));
      component.onNavigate();
      expect(emitted).toEqual({ id: 'g-1' });
    });

    it('does not emit while the modal is open', () => {
      modalOpen$.next(true);
      component.group = { id: 'g-1' } as any;
      let emitted = false;
      component.navigate.subscribe(() => (emitted = true));
      component.onNavigate();
      expect(emitted).toBeFalse();
    });

    it('does not emit without a group', () => {
      component.group = undefined;
      let emitted = false;
      component.navigate.subscribe(() => (emitted = true));
      component.onNavigate();
      expect(emitted).toBeFalse();
    });
  });

  it('onGroupDeleted emits groupDeleted', () => {
    let emitted: string | null | undefined;
    component.groupDeleted.subscribe((id: string) => (emitted = id));
    component.onGroupDeleted('g-1');
    expect(emitted).toBe('g-1');
  });

  it('onGroupLeaveed emits groupLeaveed', () => {
    let emitted: string | null | undefined;
    component.groupLeaveed.subscribe((id: string) => (emitted = id));
    component.onGroupLeaveed('g-1');
    expect(emitted).toBe('g-1');
  });
});
