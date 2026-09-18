import { Component, Input, OnInit } from '@angular/core';
import { Result } from 'src/app/consensus/domain/repositories/rest-consensus-results.interface';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';

@Component({
  selector: 'consensus-algorithm-selector',
  templateUrl: './algorithm-selector.component.html',
  styleUrls: ['./algorithm-selector.component.css'],
})
export class AlgorithmSelectorComponent implements OnInit {
  selectedAlgorithm: string = 'Positional Voting';
  compareAlgorithm: string = 'Non Positional Voting';
  @Input() groupId: string = '';
  rankings: Result[] = [];
  compareRankings: Result[] = [];

  showModal: boolean = false;

  constructor(private topicService: TopicService) {}

  ngOnInit(): void {
    this.topicService
      .getConsensusResultsByVotingType(this.groupId, 'positional-voting')
      .subscribe((results) => {
        this.rankings = results;
      });
    this.topicService
      .getConsensusResultsByVotingType(this.groupId, 'non-positional-voting')
      .subscribe((results) => {
        this.compareRankings = results;
      });
  }

  calculateRankings(algorithm: string): Result[] {
    let rankings: Result[] = [];
    if (algorithm === 'Positional Voting') {
      rankings = this.rankings;
    } else if (algorithm === 'Non Positional Voting') {
      rankings = this.compareRankings;
    }
    return rankings.sort((a, b) => b.final_value - a.final_value);
  }

  // Method to find the ranking index for a given topic
  getRankingIndex(topic: Result, algorithm: string): number {
    const rankings = this.calculateRankings(algorithm);
    const index = rankings.findIndex((t) => t.id_topic === topic.id_topic);
    return index !== -1 ? index + 1 : -1; // Return 1-based index
  }

  differenceValue(topic: Result): number {
    return (
      this.getRankingIndex(topic, this.compareAlgorithm) -
      this.getRankingIndex(topic, this.selectedAlgorithm)
    );
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }
}
