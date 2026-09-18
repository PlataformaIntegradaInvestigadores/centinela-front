import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule, NgFor } from '@angular/common';
import { RecommendedTopic } from 'src/app/consensus/domain/entities/topic.interface';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WebSocketPhase2Service } from 'src/app/consensus/domain/services/websocket-phase2.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { WebSocketService } from 'src/app/consensus/domain/services/WebSocketService.service';

@Component({
  selector: 'phase2-consensus',
  templateUrl: './phase2-consensus.component.html',
  styleUrls: ['./phase2-consensus.component.css'],
  standalone: true,
  imports: [CdkDropList, NgFor, CdkDrag, CdkDragPlaceholder, CommonModule],
})
export class Phase2ConsensusComponent implements OnInit, OnDestroy {
  recommendedTopics: RecommendedTopic[] = [];
  groupId: string = '';
  activeConnections: number = 0;
  private socketSubscription?: Subscription;
  private newTopicSubscription?: Subscription;
  private notificationsSubscription?: Subscription;
  finalOrderedTopics: { id: number; topic_name: string; tags: string[] }[] = [];
  hasFinalOrderedTopics: boolean = false;

  showModalPhaseTwo: boolean = false;

  userPhase: number = 1;

  constructor(
    private topicService: TopicService,
    private webSocketService: WebSocketPhase2Service,
    private route: ActivatedRoute,
    private authService: AuthService,
    private webSocket1Service: WebSocketService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe((params) => {
      this.groupId = params.get('groupId') || '';
      this.loadFinalOrderedTopics();
      if (!this.hasFinalOrderedTopics) {
        this.loadRecommendedTopics();
      }
      this.connectWebSocket();
      this.checkUserPhase();
    });
  }

  ngOnDestroy(): void {
    this.disconnectWebSocket();
  }

  checkUserPhase(): void {
    this.topicService.getUserCurrentPhase(this.groupId).subscribe(
      (response) => {
        this.userPhase = response.phase;
      },
      (error) => {
        console.error('Error fetching user phase:', error);
      },
    );
  }

  loadRecommendedTopics(): void {
    if (!this.groupId) return;

    this.topicService.getRecommendedTopicsByGroup(this.groupId).subscribe(
      (topics) => {
        this.recommendedTopics = topics.map((topic) => {
          const savedTags = localStorage.getItem(`topic_${topic.id}_tags`);
          return { ...topic, tags: savedTags ? JSON.parse(savedTags) : [] };
        });
        this.updateFinalOrderedTopics();
      },
      (error) => {
        console.error('Error loading recommended topics:', error);
      },
    );
  }

  loadFinalOrderedTopics(): void {
    if (!this.groupId) return;

    this.topicService.getFinalsTopicsByGroup(this.groupId).subscribe(
      (response: { data: RecommendedTopic[] }) => {
        if (response.data.length !== 0) {
          this.hasFinalOrderedTopics = true;
          this.recommendedTopics = response.data;
          this.updateFinalOrderedTopics();
        }
      },
      (error) => {
        console.error('Error loading final ordered topics:', error);
      },
    );
  }

  drop(event: CdkDragDrop<RecommendedTopic[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      const previousTopic = this.recommendedTopics[event.previousIndex];

      //console.log(`Topic moved: "${previousTopic.topic_name}" from position ${event.previousIndex + 1} to ${event.currentIndex + 1}`);

      this.sendTopicMovedNotification(previousTopic, event.previousIndex, event.currentIndex);
    }

    moveItemInArray(this.recommendedTopics, event.previousIndex, event.currentIndex);
    this.updateFinalOrderedTopics();
  }

  updateFinalOrderedTopics(): void {
    this.finalOrderedTopics = this.recommendedTopics.map((topic) => ({
      id: topic.id,
      topic_name: topic.topic_name,
      tags: topic.tags ?? [],
    }));
  }

  toggleTag(topic: RecommendedTopic, tag: string): void {
    const userId = this.authService.getUserId();
    const positiveTags = ['Novel', 'Attractive', 'Trend'];
    const negativeTags = ['Obsolete', 'Unfamiliar'];

    if (!topic.tags) {
      topic.tags = [];
    }

    if (positiveTags.includes(tag)) {
      topic.tags = topic.tags.filter((t) => !negativeTags.includes(t));
    } else if (negativeTags.includes(tag)) {
      topic.tags = topic.tags.filter((t) => !positiveTags.includes(t));
    }

    if (topic.tags.includes(tag)) {
      topic.tags = topic.tags.filter((t) => t !== tag);
    } else {
      topic.tags.push(tag);
    }

    if (tag === 'Novel' && topic.tags.includes('Obsolete')) {
      topic.tags = topic.tags.filter((t) => t !== 'Obsolete');
    } else if (tag === 'Obsolete' && topic.tags.includes('Novel')) {
      topic.tags = topic.tags.filter((t) => t !== 'Novel');
    }

    // Guardar estado en localStorage
    localStorage.setItem(`topic_${topic.id}_tags`, JSON.stringify(topic.tags));

    if (tag === 'Novel') {
      this.recommendedTopics = this.recommendedTopics.filter((t) => t.id !== topic.id);
      this.recommendedTopics.unshift(topic);
    } else if (tag === 'Obsolete') {
      this.recommendedTopics = this.recommendedTopics.filter((t) => t.id !== topic.id);
      this.recommendedTopics.push(topic);
    }

    this.updateFinalOrderedTopics();

    if (this.groupId && userId) {
      this.topicService.notifyTopicTagChange(this.groupId, userId, topic.id, tag).subscribe();
    }
  }

  sendTopicMovedNotification(
    topic: RecommendedTopic,
    previousIndex: number,
    currentIndex: number,
  ): void {
    if (this.groupId) {
      const userId = this.authService.getUserId();
      this.topicService
        .notifyTopicReorder(
          this.groupId,
          userId || '',
          topic.id.toString(),
          previousIndex + 1,
          currentIndex + 1,
        )
        .subscribe();
    }
  }

  completeConsensusPhaseTwo(): void {
    this.showModalPhaseTwo = true;
  }

  closeModalPhaseTwo(): void {
    this.showModalPhaseTwo = false;
  }

  confirmPhaseTwoCompletion(): void {
    const userId = this.authService.getUserId();
    if (this.groupId && userId) {
      const totalTopics = this.finalOrderedTopics.length;
      const finalTopicOrders = this.finalOrderedTopics.map((topic, index) => ({
        idTopic: topic.id,
        posFinal: totalTopics - index,
        label: topic.tags.join(', '),
      }));

      this.topicService.saveFinalTopicOrder(this.groupId, userId, finalTopicOrders).subscribe(
        () => {
          const phaseKey = `phase_${this.groupId}`;
          localStorage.setItem(phaseKey, '2');

          // Limpiar el localStorage antes de la redirección
          this.clearLocalStorage();

          const currentUrl = this.router.url;
          const newUrl = currentUrl.replace('valuation', 'decision');
          this.router.navigateByUrl(newUrl);
          this.closeModalPhaseTwo();
        },
        (error) => {
          console.error('Error saving final topic order:', error);
        },
      );
    }
  }

  clearLocalStorage(): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('topic_') && key.endsWith('_tags')) {
        localStorage.removeItem(key);
      }
    }
  }

  cancelPhaseTwoCompletion(): void {
    this.closeModalPhaseTwo();
  }

  connectWebSocket(): void {
    if (this.groupId) {
      this.webSocket1Service.close(this.groupId);

      const socket = this.webSocketService.connect(this.groupId);

      this.socketSubscription = socket.subscribe(
        (message) => {
          if (message.message.type === 'connection_count') {
            this.activeConnections = message.message.active_connections;
          }
        },
        (err) => console.error(`WebSocket error for group ${this.groupId}:`, err),
      );

      this.newTopicSubscription = this.webSocketService.topicReceived.subscribe(() => {
        this.updateFinalOrderedTopics();
      });

      this.notificationsSubscription = this.webSocketService.notificationReceived.subscribe(
        () => {},
      );
    }
  }

  disconnectWebSocket(): void {
    if (this.groupId) {
      this.webSocketService.close(this.groupId);
      this.socketSubscription?.unsubscribe();
      this.newTopicSubscription?.unsubscribe();
      this.notificationsSubscription?.unsubscribe();
    }
  }
}
