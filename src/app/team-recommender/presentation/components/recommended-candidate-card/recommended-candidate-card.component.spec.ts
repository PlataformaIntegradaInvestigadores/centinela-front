import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
  flushMicrotasks,
  tick,
} from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowDown, faArrowUp, faMinus } from '@fortawesome/free-solid-svg-icons';

import {
  INVITE_FEEDBACK_MS,
  RecommendedCandidateCardComponent,
} from './recommended-candidate-card.component';
import { InstitutionNamePipe } from '../../pipes/institution-name.pipe';
import { RecommendedProfile } from '../../../domain/entities/team-recommendation.interface';

export function makeCandidate(overrides: Partial<RecommendedProfile> = {}): RecommendedProfile {
  return {
    author_id: '57190000001',
    name: 'Astudillo-Sánchez E.',
    institution: 'universidad espíritu santo',
    low_visibility: false,
    rank: 5,
    baseline_rank: 5,
    relevance_score: 0.61234,
    relevance_norm: 0.5,
    institution_novelty: 1,
    final_score: 0.6,
    selection_reason: 'score',
    ...overrides,
  };
}

describe('RecommendedCandidateCardComponent', () => {
  let fixture: ComponentFixture<RecommendedCandidateCardComponent>;
  let component: RecommendedCandidateCardComponent;

  const render = (overrides: Partial<RecommendedProfile> = {}, fairnessEnabled = true) => {
    component.candidate = makeCandidate(overrides);
    component.fairnessEnabled = fairnessEnabled;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecommendedCandidateCardComponent, InstitutionNamePipe],
      imports: [FontAwesomeModule, RouterTestingModule],
    });
    fixture = TestBed.createComponent(RecommendedCandidateCardComponent);
    component = fixture.componentInstance;
  });

  it('renders rank, name, formatted institution, relevance and profile link', () => {
    const el = render({ rank: 3, relevance_norm: 0.874 });
    expect(el.querySelector('.rank-badge')?.textContent?.trim()).toBe('3');
    expect(el.querySelector('.candidate-name')?.textContent).toContain('Astudillo-Sánchez E.');
    expect(el.querySelector('.candidate-institution')?.textContent).toContain(
      'Universidad Espíritu Santo',
    );
    expect(el.querySelector('.relevance-value')?.textContent).toContain('87 %');
    expect(el.querySelector('.relevance-value')?.textContent).toContain('0.612');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/profile/57190000001');
    expect(component.initials).toBe('AS');
  });

  it('falls back to the Scopus id when the name is missing', () => {
    render({ name: null });
    expect(component.displayName).toBe('Autor Scopus 57190000001');
    expect(component.initials).toBe('AS');
    render({ name: '   ' });
    expect(component.displayName).toBe('Autor Scopus 57190000001');
    render({ name: '.' });
    expect(component.initials).toBe('?');
  });

  it('shows upward movement and fairness badges for a quota pick', () => {
    const el = render({
      rank: 5,
      baseline_rank: 26,
      low_visibility: true,
      selection_reason: 'quota',
    });
    expect(component.movement).toBe(21);
    expect(component.movementLabel).toBe('Sube 21 puestos');
    expect(component.movementIcon).toBe(faArrowUp);
    const labels = Array.from(el.querySelectorAll('.candidate-badge')).map((b) =>
      b.textContent?.trim(),
    );
    expect(labels).toEqual(['Baja visibilidad', 'Priorizado por equidad']);
    expect(el.querySelector('.movement')?.textContent).toContain('Sube 21 puestos');
  });

  it('describes a single-step drop, no change and the relaxed-cap badge', () => {
    render({ rank: 2, baseline_rank: 1, selection_reason: 'cap_relaxed' });
    expect(component.movementLabel).toBe('Baja 1 puesto');
    expect(component.movementIcon).toBe(faArrowDown);
    expect(component.badges.map((b) => b.label)).toEqual(['Cupo institucional relajado']);
    render({ rank: 4, baseline_rank: 4 });
    expect(component.movementLabel).toBe('Sin cambio');
    expect(component.movementIcon).toBe(faMinus);
    expect(component.badges).toEqual([]);
    render({ rank: 1, baseline_rank: 2 });
    expect(component.movementLabel).toBe('Sube 1 puesto');
  });

  it('hides the movement when the re-ranking is disabled', () => {
    const el = render({}, false);
    expect(el.querySelector('.movement')).toBeNull();
  });

  it('clamps the relevance bar to 0–100', () => {
    render({ relevance_norm: 1.7 });
    expect(component.relevancePercent).toBe(100);
    render({ relevance_norm: -0.2 });
    expect(component.relevancePercent).toBe(0);
    render({ relevance_norm: NaN });
    expect(component.relevancePercent).toBe(0);
  });
  describe('invite to the team (mock)', () => {
    const inviteButton = (el: HTMLElement) =>
      el.querySelector('.invite-button') as HTMLButtonElement | null;

    it('shows «Invitar al equipo» unless the candidate already has an account', () => {
      let el = render();
      expect(inviteButton(el)?.textContent).toContain('Invitar al equipo');
      expect(inviteButton(el)?.getAttribute('aria-label')).toBe(
        'Invitar al equipo a Astudillo-Sánchez E.',
      );
      el = render({ has_account: false });
      expect(inviteButton(el)).not.toBeNull();
      el = render({ has_account: true });
      expect(inviteButton(el)).toBeNull();
    });

    it('builds a registration link with the Scopus id', () => {
      render();
      expect(component.inviteLink).toBe(
        `${window.location.origin}/register?invite=57190000001&ref=team-builder`,
      );
    });

    it('copies the link and confirms it, then hides the notice', fakeAsync(() => {
      const write = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      const el = render();
      inviteButton(el)!.click();
      flushMicrotasks();
      fixture.detectChanges();
      expect(write).toHaveBeenCalledOnceWith(component.inviteLink);
      expect(component.inviteState).toBe('copied');
      expect(el.querySelector('.invite-feedback')?.textContent).toContain(
        'Enlace copiado para invitar a Astudillo-Sánchez E.',
      );
      tick(INVITE_FEEDBACK_MS);
      fixture.detectChanges();
      expect(component.inviteState).toBe('idle');
      expect(el.querySelector('.invite-feedback')).toBeNull();
    }));

    it('opens a small modal with the link when copying fails', fakeAsync(() => {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject(new Error('denied')));
      const el = render();
      component.invite();
      flush();
      fixture.detectChanges();
      expect(component.inviteState).toBe('manual');
      const modal = el.querySelector('.invite-modal') as HTMLElement;
      expect(modal.textContent).toContain('Invitar a Astudillo-Sánchez E.');
      const input = modal.querySelector('.invite-link') as HTMLInputElement;
      expect(input.value).toBe(component.inviteLink);
      input.dispatchEvent(new Event('focus'));
      (modal.querySelector('.invite-close') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(el.querySelector('.invite-modal')).toBeNull();
    }));

    it('falls back to the modal without a clipboard API and closes on backdrop click', fakeAsync(() => {
      spyOnProperty(Navigator.prototype, 'clipboard', 'get').and.returnValue(
        undefined as unknown as Clipboard,
      );
      const el = render();
      component.invite();
      flush();
      fixture.detectChanges();
      expect(component.inviteState).toBe('manual');
      (el.querySelector('.invite-modal > div') as HTMLElement).click();
      fixture.detectChanges();
      expect(component.inviteState).toBe('manual');
      (el.querySelector('.invite-modal') as HTMLElement).click();
      expect(component.inviteState).toBe('idle');
      component.ngOnDestroy();
    }));
  });
});
