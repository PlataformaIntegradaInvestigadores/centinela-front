import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-post-poll',
  templateUrl: './post-poll.component.html',
  styleUrls: ['./post-poll.component.css'],
})
export class PostPollComponent {
  @Input() poll: any;

  @Output() optionClick = new EventEmitter<any>();

  onOptionClick(option: any): void {
    this.optionClick.emit(option);
  }

  getOptionPercentage(option: any): number {
    if (!this.poll.total_votes || this.poll.total_votes === 0) {
      return 0;
    }
    return Math.round((option.votes_count / this.poll.total_votes) * 100);
  }

  isWinningOption(option: any): boolean {
    if (!this.poll.options || this.poll.options.length === 0) return false;
    const maxVotes = Math.max(...this.poll.options.map((o: any) => o.votes_count || 0));
    return maxVotes > 0 && option.votes_count === maxVotes;
  }

  getTimeUntilExpiry(): string {
    if (!this.poll.expires_at) return '';

    const now = new Date();
    const expiryDate = new Date(this.poll.expires_at);
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) return 'expirada';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `en ${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `en ${diffHours}h`;
    } else {
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `en ${diffMins}m`;
    }
  }
}
