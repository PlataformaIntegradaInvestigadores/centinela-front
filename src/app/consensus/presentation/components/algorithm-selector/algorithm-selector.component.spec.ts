import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { AlgorithmSelectorComponent } from './algorithm-selector.component';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';
import { Result } from 'src/app/consensus/domain/repositories/rest-consensus-results.interface';

describe('AlgorithmSelectorComponent', () => {
  let component: AlgorithmSelectorComponent;
  let topicServiceSpy: jasmine.SpyObj<TopicService>;

  // calculateRankings() sorts this.rankings/compareRankings IN PLACE, so each test
  // must get its own fresh array -- sharing one const across tests lets an earlier
  // test's sort mutate the fixture for every test that runs after it.
  function makePositional(): Result[] {
    return [
      { id_topic: 1, topic_name: 'A', final_value: 3, labels: [] },
      { id_topic: 2, topic_name: 'B', final_value: 5, labels: [] },
    ];
  }
  function makeNonPositional(): Result[] {
    return [
      { id_topic: 1, topic_name: 'A', final_value: 1, labels: [] },
      { id_topic: 2, topic_name: 'B', final_value: 9, labels: [] },
    ];
  }

  beforeEach(() => {
    topicServiceSpy = jasmine.createSpyObj('TopicService', ['getConsensusResultsByVotingType']);
    topicServiceSpy.getConsensusResultsByVotingType.and.callFake((_groupId, type) =>
      of(type === 'positional-voting' ? makePositional() : makeNonPositional()),
    );

    TestBed.configureTestingModule({
      declarations: [AlgorithmSelectorComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: TopicService, useValue: topicServiceSpy }],
    });
    component = TestBed.createComponent(AlgorithmSelectorComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit loads both ranking sets', () => {
    component.ngOnInit();
    expect(component.rankings).toEqual(makePositional());
    expect(component.compareRankings).toEqual(makeNonPositional());
  });

  describe('calculateRankings', () => {
    beforeEach(() => component.ngOnInit());

    it('sorts positional rankings descending by final_value', () => {
      const result = component.calculateRankings('Positional Voting');
      expect(result.map((r) => r.id_topic)).toEqual([2, 1]);
    });

    it('sorts non-positional (compare) rankings descending', () => {
      const result = component.calculateRankings('Non Positional Voting');
      expect(result.map((r) => r.id_topic)).toEqual([2, 1]);
    });

    it('returns an empty array for an unknown algorithm', () => {
      expect(component.calculateRankings('unknown')).toEqual([]);
    });
  });

  describe('getRankingIndex', () => {
    beforeEach(() => component.ngOnInit());

    it('returns the 1-based rank for a topic present in the rankings', () => {
      const topicOne = component.rankings.find((r) => r.id_topic === 1)!;
      const idx = component.getRankingIndex(topicOne, 'Positional Voting');
      expect(idx).toBe(2); // id_topic 1 has final_value 3, ranked 2nd
    });

    it('returns -1 for a topic missing from the rankings', () => {
      const idx = component.getRankingIndex(
        { id_topic: 999, topic_name: 'X', final_value: 0, labels: [] },
        'Positional Voting',
      );
      expect(idx).toBe(-1);
    });
  });

  it('differenceValue is the gap between the compare and selected algorithm ranks', () => {
    component.ngOnInit();
    const topicOne = component.rankings.find((r) => r.id_topic === 1)!;
    const diff = component.differenceValue(topicOne);
    expect(diff).toBe(
      component.getRankingIndex(topicOne, component.compareAlgorithm) -
        component.getRankingIndex(topicOne, component.selectedAlgorithm),
    );
  });

  it('openModal/closeModal toggle showModal', () => {
    component.openModal();
    expect(component.showModal).toBeTrue();
    component.closeModal();
    expect(component.showModal).toBeFalse();
  });
});
