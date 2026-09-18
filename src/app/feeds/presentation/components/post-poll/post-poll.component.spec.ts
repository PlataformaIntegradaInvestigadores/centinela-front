import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PostPollComponent } from './post-poll.component';

describe('PostPollComponent', () => {
  let component: PostPollComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PostPollComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    component = TestBed.createComponent(PostPollComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onOptionClick emits the clicked option', () => {
    let emitted: any = null;
    component.optionClick.subscribe((opt: any) => (emitted = opt));
    const option = { id: 'o-1' };
    component.onOptionClick(option);
    expect(emitted).toBe(option);
  });

  describe('getOptionPercentage', () => {
    it('returns 0 when total_votes is 0 or missing', () => {
      component.poll = { total_votes: 0 };
      expect(component.getOptionPercentage({ votes_count: 3 })).toBe(0);
      component.poll = {};
      expect(component.getOptionPercentage({ votes_count: 3 })).toBe(0);
    });

    it('computes a rounded percentage of total votes', () => {
      component.poll = { total_votes: 3 };
      expect(component.getOptionPercentage({ votes_count: 1 })).toBe(33);
    });
  });

  describe('isWinningOption', () => {
    it('returns false when there are no options', () => {
      component.poll = { options: [] };
      expect(component.isWinningOption({ votes_count: 1 })).toBeFalse();
    });

    it('returns false when all options have 0 votes', () => {
      component.poll = { options: [{ votes_count: 0 }, { votes_count: 0 }] };
      expect(component.isWinningOption({ votes_count: 0 })).toBeFalse();
    });

    it('returns true for the option matching the max vote count', () => {
      const winner = { votes_count: 5 };
      component.poll = { options: [{ votes_count: 2 }, winner] };
      expect(component.isWinningOption(winner)).toBeTrue();
      expect(component.isWinningOption({ votes_count: 2 })).toBeFalse();
    });
  });

  describe('getTimeUntilExpiry', () => {
    const NOW = new Date('2024-06-01T12:00:00Z').getTime();

    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(NOW));
    });

    afterEach(() => jasmine.clock().uninstall());

    it('returns empty string when there is no expiry', () => {
      component.poll = {};
      expect(component.getTimeUntilExpiry()).toBe('');
    });

    it('returns "expirada" when the expiry is in the past', () => {
      component.poll = { expires_at: new Date(NOW - 1000).toISOString() };
      expect(component.getTimeUntilExpiry()).toBe('expirada');
    });

    it('formats days and hours remaining', () => {
      component.poll = { expires_at: new Date(NOW + 2 * 86400000 + 3 * 3600000).toISOString() };
      expect(component.getTimeUntilExpiry()).toBe('en 2d 3h');
    });

    it('formats hours remaining when under a day', () => {
      component.poll = { expires_at: new Date(NOW + 5 * 3600000).toISOString() };
      expect(component.getTimeUntilExpiry()).toBe('en 5h');
    });

    it('formats minutes remaining when under an hour', () => {
      component.poll = { expires_at: new Date(NOW + 10 * 60000).toISOString() };
      expect(component.getTimeUntilExpiry()).toBe('en 10m');
    });
  });
});
