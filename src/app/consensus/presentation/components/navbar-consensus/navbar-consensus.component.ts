import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { PhaseStateService } from 'src/app/consensus/domain/services/phaseState.service';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';

@Component({
  selector: 'navbar-consensus',
  templateUrl: './navbar-consensus.component.html',
  styleUrls: ['./navbar-consensus.component.css'],
})
export class NavbarConsensusComponent implements OnInit, OnDestroy {
  currentPhase: number = 0;
  private phaseSubscription: Subscription | undefined;
  private routerSubscription: Subscription | undefined;
  @Input() groupId: string | null = null;
  showModal: boolean = false;
  @Input() isDecisionPhase: boolean = false;
  @Input() isPhaseTwo: boolean = false;
  @Input() userId: string | null = null;
  @Input() idOwnerGroup: string = '';
  private authenticatedUserId: string | null = null;
  showRepeatButton: boolean = false; // Controla la visibilidad del botón

  constructor(
    private phaseStateService: PhaseStateService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private topicService: TopicService,
  ) {}

  ngOnInit(): void {
    if (this.isPhaseTwo) {
      this.phaseStateService.setPhase(1, this.groupId!);
    }

    if (this.isDecisionPhase) {
      this.phaseStateService.setPhase(2, this.groupId!);
    }

    this.routerSubscription = this.router.events.subscribe(() => {
      this.groupId = this.route.snapshot.paramMap.get('groupId');
      this.userId = this.route.snapshot.paramMap.get('id');

      if (this.groupId) {
        const storedPhase = this.phaseStateService.getPhase(this.groupId);
        this.currentPhase = storedPhase;
        this.phaseStateService.setPhase(storedPhase, this.groupId);
      }
    });

    this.phaseSubscription = this.phaseStateService.phase$.subscribe((phase) => {
      this.currentPhase = phase;
    });

    this.updateComponentVisibility();
    this.authenticatedUserId = this.authService.getUserId();
    this.updateShowRepeatButton();
  }

  ngOnDestroy(): void {
    if (this.phaseSubscription) {
      this.phaseSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  cancelRepeatVote(): void {
    this.closeModal();
  }

  confirmRepeatVote(): void {
    this.closeModal();
    this.topicService.changeUserPhase(this.groupId!, 1).subscribe(
      () => {},
      (error) => {
        console.error('Error:', error);
      },
    );
  }

  updateComponentVisibility(): void {
    const url = this.router.url;
    this.isDecisionPhase = url.includes(
      `/profile/${this.userId}/my-groups/${this.groupId}/consensus/decision`,
    );
  }

  updateShowRepeatButton(): void {
    if (this.authenticatedUserId) {
      this.showRepeatButton = this.idOwnerGroup === this.authenticatedUserId;
      // console.log(`Authenticated: ${this.authenticatedUserId}, Owner: ${this.idOwnerGroup}, Show: ${this.showRepeatButton}`);
    }
  }
}
