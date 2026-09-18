import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import {
  RecommendedTopic,
  TopicAddedUser,
} from 'src/app/consensus/domain/entities/topic.interface';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';
import { WebSocketService } from 'src/app/consensus/domain/services/WebSocketService.service';
import { ChangeDetectorRef } from '@angular/core';
import { initFlowbite } from 'flowbite';
import { DebateService } from '../../../domain/services/debate.service';
import { Debate } from '../../../domain/entities/debate.interface';
import { UserPostureService } from 'src/app/consensus/domain/services/user-posture.service';
import { UserPosture } from 'src/app/consensus/domain/entities/user-posture.interface';
import { SelectPostureComponent } from '../select-posture/select-posture.component';
import { DebateStatisticsService } from 'src/app/consensus/domain/services/debate-statistics.service';

@Component({
  selector: 'phase1-consensus',
  templateUrl: './phase1-consensus.component.html',
  styleUrls: ['./phase1-consensus.component.css'],
})
export class Phase1ConsensusComponent implements OnInit, OnDestroy {
  rangeValues: number[] = [];
  showSliders: boolean = false;
  showLabel: boolean[] = [];
  showCheckTopics: boolean[] = [];
  newTopic: string = '';
  userAddedTopicsIndexes: number[] = [];
  combinedChecksState: boolean[] = [];
  enableCombinedSearch: boolean = false;
  showAddTopicForm: boolean = false;
  showModal: boolean = false;

  groupId: string = '';
  recommendedTopics: RecommendedTopic[] = [];
  addedTopics: TopicAddedUser[] = [];
  socketSubscription: Subscription | undefined;
  topicsSubscription: Subscription | undefined;
  newTopicSubscription: Subscription | undefined;
  newNotificationSubscription: Subscription | undefined;
  activeConnections: number = 0;

  showError: boolean = false;
  errorMessage: string = '';

  notifications: any[] = [];

  userPhase: number = 0;

  // Estados de los modales
  isModalOpenDebate: boolean = false;
  isModalOpenPosture: boolean = false;

  // Variables para el debate
  debateTitle: string = '';
  debateDescription: string = '';
  durationHours: number = 0;
  durationMinutes: number = 0;

  // Debate activo y grupo
  activeDebateId: number = 0;
  isDebateActive: boolean = false;

  // Subscripciones
  private subscriptions: Subscription[] = [];
  debates: Debate[] = [];

  // Variables para la postura del usuario
  @ViewChild(SelectPostureComponent) selectedPostureComponent!: SelectPostureComponent;
  isModalOpenChat: boolean = false;

  constructor(
    private topicService: TopicService,
    private webSocketService: WebSocketService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private debateService: DebateService,
    private postureService: UserPostureService,
    private debateStatisticsService: DebateStatisticsService,
  ) {}

  ngOnInit(): void {
    initFlowbite();
    this.route.parent?.paramMap.subscribe((params) => {
      this.groupId = params.get('groupId') || '';
      this.checkUserPhase(); // Llama a esta función para verificar la fase del usuario
      this.validateDebateStatus(); // Llama a esta función para verificar el estado del debate
    });

    // Suscribirse a las notificaciones de la creacion de debates

    this.webSocketService.notificationsReceived.subscribe((message) => {
      if (message.type === 'debate_created') {
        console.log('Debate creado:', message);
        this.isDebateActive = true; // Actualiza el estado
        this.cdr.detectChanges(); // Actualiza la vista
        this.loadDebates(this.groupId);
      }
    });

    // Suscribirse a las notificaciones del cierre de debates

    this.webSocketService.notificationsReceived.subscribe((message) => {
      if (message.type === 'debate_closed') {
        console.log('Debate cerrado:', message);
        this.isDebateActive = true; // Actualiza el estado
        this.cdr.detectChanges(); // Actualiza la vista
      }
    });

    // Suscribirse a las notificaciones de la postura del usuario

    this.webSocketService.notificationsReceived.subscribe((message) => {
      if (message.type === 'posture_created') {
        console.log('Postura registrada:', message);
        this.isDebateActive = true; // Actualiza el estado
        this.cdr.detectChanges(); // Actualiza la vista
      }
    });

    // Suscribirse a las notificaciones de la postura del usuario

    this.webSocketService.notificationsReceived.subscribe((message) => {
      if (message.type === 'posture_updated') {
        console.log('Postura Actualizada:', message);
        this.isDebateActive = true; // Actualiza el estado
        this.cdr.detectChanges(); // Actualiza la vista
      }
    });

    this.debateService.validateDebateStatus$.subscribe(() => {
      this.validateDebateStatus();
    });

    this.topicsSubscription = this.topicService.topics$.subscribe((topics) => {
      this.addedTopics = topics;
      this.cdr.detectChanges();
    });

    this.newTopicSubscription = this.webSocketService.newTopicReceived.subscribe((topic) => {
      if (!this.recommendedTopics.some((t) => t.topic_name === topic.topic_name)) {
        this.recommendedTopics.push(topic);
        this.rangeValues = [...this.rangeValues, 0]; // Fix: Assign the value directly to the array
        this.cdr.detectChanges();
      }
      if (!this.notifications.some((t) => t.notification_message === topic.notification_message)) {
        this.notifications.push(topic);
        this.cdr.detectChanges();
      }
    });

    this.newNotificationSubscription = this.webSocketService.notificationsReceived.subscribe(
      (notification) => {
        this.notifications.push(notification);
        this.cdr.detectChanges();
      },
    );
  }

  loadDebates(groupId: string): void {
    if (!groupId || groupId.trim() === '') {
      console.error('El groupId es inválido o está vacío. No se pueden cargar los debates.');
      return;
    }

    this.debateService.getDebates(groupId).subscribe({
      next: (debates: Debate[]) => {
        this.debates = debates; // Actualiza la propiedad debates
        console.log('Debates cargados correctamente:', debates);
      },
      error: (err) => {
        console.error('Error al cargar los debates:', err);
      },
    });
  }

  /**
   * Enviar solicitud para crear un debate
   */
  onSubmitDebate(): void {
    const end_time = this.calculateInterval(this.durationHours, this.durationMinutes);
    const newDebate: Debate = {
      group: this.groupId,
      title: this.debateTitle,
      description: this.debateDescription,
      end_time: end_time,
    };

    this.debateService.createDebate(this.groupId, newDebate).subscribe({
      next: (response: { id?: number }) => {
        console.log('Debate creado exitosamente:', response);

        if (response.id !== undefined) {
          // Abre el modal de postura
          this.openSelectPostureModal(
            Number(response.id),
            {} as UserPosture,
            Number(response.id),
            this.debateTitle,
          );
        } else {
          console.error('El ID del debate no está definido en la respuesta.');
        }

        this.resetForm(); // Limpia el formulario
        this.toggleDebate(); // Cierra el modal
      },
      error: (error) => {
        console.error('Error creando el debate:', error);
      },
    });
  }

  onPostureSaved(args: UserPosture) {
    console.log('Postura guardada:', args);
    this.activeDebateId = args.debate;
    this.openSelectPostureModal(args.debate, args, args.debate, this.debateTitle);
  }

  toggleDebate() {
    this.isModalOpenDebate = !this.isModalOpenDebate;
  }

  /**
   * Unirse al debate y flujo según postura del usuario
   */
  joinDebate(): void {
    const activeDebate = this.debates.find((debate) => !debate.is_closed);

    if (activeDebate && activeDebate.id !== undefined) {
      this.activeDebateId = activeDebate.id;

      this.postureService.getUserPosture(activeDebate.id).subscribe({
        next: (response) => {
          console.log('Verificación de postura del usuario:', response);

          this.openSelectPostureModal(
            activeDebate.id!,
            response,
            activeDebate.id!,
            activeDebate.title,
          );
        },
        error: (err) => {
          if (err.status === 404) {
            console.log('No se encontró postura existente, abriendo modal de selección...');
            this.openSelectPostureModal(
              activeDebate.id,
              null,
              activeDebate.id!,
              activeDebate.title,
            );
          } else {
            console.error('Error inesperado al verificar la postura del usuario:', err);
          }
        },
      });
    } else {
      console.warn('No se pudo encontrar un debate activo para unirse.');
    }
  }

  openSelectPostureModal(
    id: number | undefined,
    response: UserPosture | null,
    debateId: number,
    debateTitle: string,
  ): void {
    this.isModalOpenPosture = true; // Muestra el modal
    this.activeDebateId = debateId; // Guarda el ID del debate activo
    this.debateTitle = debateTitle; // Asigna el título del debate

    if (response) {
      // Caso: El usuario ya tiene una postura
      this.selectedPostureComponent.isModalOpenPostureSelection = false;
      this.selectedPostureComponent.isModalOpenExistingPosture = true;
      this.selectedPostureComponent.existingPosture = response;
      this.selectedPostureComponent.existingPostureId = response.id ?? null; // Asigna el ID de la postura
      this.selectedPostureComponent.selectedPosture = response.posture; // Preselecciona la postura
      this.selectedPostureComponent.debateId = debateId; // Asigna el ID del debate

      console.log('Modal de postura existente abierto para el debate:', debateId);
    } else {
      // Caso: El usuario no tiene una postura
      this.selectedPostureComponent.isModalOpenPostureSelection = true;
      this.selectedPostureComponent.isModalOpenExistingPosture = false;
      this.selectedPostureComponent.existingPosture = null;
      this.selectedPostureComponent.existingPostureId = null; // Asegúrate de resetear el ID
      console.log('Modal de selección de postura abierto para el debate:', debateId);
    }
  }

  closePostureModal(args: any): void {
    (console.log('Cerrando modal de postura con argumentos:', args),
      (this.isModalOpenPosture = false)); // Oculta el modal
  }

  private calculateInterval(hours: number, minutes: number): string {
    const totalMinutes = hours * 60 + minutes;
    const days = Math.floor(totalMinutes / 1440);
    const remainingMinutes = totalMinutes % 1440;
    const formattedHours = Math.floor(remainingMinutes / 60)
      .toString()
      .padStart(2, '0');
    const formattedMinutes = (remainingMinutes % 60).toString().padStart(2, '0');

    return days > 0
      ? `${days} ${formattedHours}:${formattedMinutes}:00`
      : `${formattedHours}:${formattedMinutes}:00`; // Formato [DD] [HH:[MM:]]ss
  }

  validateDebateStatus(): void {
    this.debateService.getDebates(this.groupId).subscribe({
      next: (debates: Debate[]) => {
        this.debates = debates;
        const activeDebate = debates.find((debate) => !debate.is_closed);
        this.isDebateActive = !!activeDebate;
        if (activeDebate) {
          this.activeDebateId = activeDebate.id ?? 0;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error validando el estado del debate:', error);
      },
    });
  }

  /**
   * Reiniciar formulario de creación de debate
   */
  resetForm(): void {
    this.debateTitle = '';
    this.debateDescription = '';
    this.durationHours = 0;
    this.durationMinutes = 0;
  }

  handleOpenChat(): void {
    console.log('Evento openChat recibido en el padre.');
    this.isModalOpenChat = true; // Cambiamos el estado del modal del chat a "abierto"
  }

  handleCloseChat(): void {
    console.log('Modal del chat cerrado.');
    this.isModalOpenChat = false; // Cambiamos el estado del modal del chat a "cerrado"
  }

  checkUserPhase(): void {
    this.topicService.getUserCurrentPhase(this.groupId).subscribe(
      (response) => {
        this.userPhase = response.phase;
        if (this.userPhase === 0) {
          this.loadTopics();
          this.connectWebSocket();
        }
      },
      (error) => {
        console.error('Error fetching user phase:', error);
      },
    );
  }

  ngOnDestroy(): void {
    this.disconnectWebSocket();
    if (this.topicsSubscription) {
      this.topicsSubscription.unsubscribe();
    }
    if (this.newTopicSubscription) {
      this.newTopicSubscription.unsubscribe();
    }
  }

  loadTopics(): void {
    if (this.groupId) {
      this.topicService.getRecommendedTopicsByGroup(this.groupId).subscribe(
        (response) => {
          if (response.length > 0) {
            this.recommendedTopics = response;
            //console.log('Recommended topics:', this.recommendedTopics);
          } else {
            this.getAndAssignRandomTopics();
          }
          this.initializeProperties();
        },
        (error) => {
          console.error('Error loading recommended topics:', error);
        },
      );

      this.topicService.getTopicsAddedByGroup(this.groupId).subscribe(
        (response) => {
          this.addedTopics = response;
        },
        (error) => {
          console.error('Error loading added topics:', error);
        },
      );
    }
  }

  getAndAssignRandomTopics(): void {
    this.topicService.getRandomRecommendedTopics(this.groupId).subscribe(
      (response) => {
        this.recommendedTopics = response;

        this.initializeProperties();
      },
      (error) => {
        console.error('Error assigning random topics:', error);
      },
    );
  }

  connectWebSocket(): void {
    if (this.groupId) {
      const socket = this.webSocketService.connect(this.groupId);
      this.socketSubscription = socket.subscribe(
        (message) => {
          if (message.message.type === 'connection_count') {
            this.activeConnections = message.message.active_connections;
            this.cdr.detectChanges();
          }

          if (message.message.type === 'new_topic') {
            const newTopic = message.message.topic_name;
            this.topicService.updateTopics(newTopic);
            this.cdr.detectChanges();
          }
        },
        (err) => {
          console.error(`WebSocket error for group ${this.groupId}:`, err);
        },
      );
    }
  }

  disconnectWebSocket(): void {
    if (this.groupId) {
      this.webSocketService.close(this.groupId);
      if (this.socketSubscription) {
        this.socketSubscription.unsubscribe();
      }
      this.webSocketService.closeAll();
    }
  }

  addTopic(): void {
    const userId = this.authService.getUserId();
    console.log('Inicio ADD tOPIC', this.newTopic.trim(), userId, this.groupId);
    if (this.newTopic.trim() && userId && this.groupId) {
      this.topicService.addNewTopic(this.groupId, this.newTopic.trim()).subscribe(
        (response) => {
          this.newTopic = '';
          this.webSocketService.sendMessage(this.groupId, {
            type: 'new_topic',
            topic: {
              id: response.id,
              topic: response.topic.topic_name,
              user_id: userId,
              group_id: this.groupId,
              added_at: response.added_at,
            },
          });
        },
        (error) => {
          console.error('Error adding new topic:', error);

          if (error.status === 403) {
            this.errorMessage = error.error.error;
          } else if (error.status === 400) {
            this.errorMessage = 'This topic already exists in the group.';
          } else {
            this.errorMessage = 'An error occurred.';
          }

          this.showError = true;

          setTimeout(() => {
            const errorElement = document.getElementById('error-message');
            if (errorElement) {
              errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            setTimeout(() => {
              this.showError = false;
              this.cdr.detectChanges();
            }, 8000);
          }, 0);
        },
      );
      console.log('Fin ADD tOPIC');
    }
  }

  sendUserExpertise(index: number): void {
    const userId = this.authService.getUserId();
    if (userId && this.groupId) {
      const topicId = this.recommendedTopics[index].id;
      const expertiseLevel = this.rangeValues[index];
      this.topicService.notifyExpertice(this.groupId, topicId, userId, expertiseLevel).subscribe();
    }
  }

  initializeProperties(): void {
    this.rangeValues = new Array(this.recommendedTopics.length).fill(0);
    this.showLabel = new Array(this.recommendedTopics.length).fill(false);
    this.showCheckTopics = new Array(this.recommendedTopics.length).fill(false);
    this.combinedChecksState = new Array(this.recommendedTopics.length).fill(false);
  }

  showLabels(index: number) {
    this.showLabel[index] = true;
  }

  hideLabels(index: number) {
    this.showLabel[index] = false;
  }

  showCheckTopic(index: number) {
    this.showCheckTopics[index] = true;
  }

  hideCheckTopic(index: number) {
    this.showCheckTopics[index] = false;
  }

  onSliderChange(index: number, event: Event): void {
    this.rangeValues[index] = Number((event.target as HTMLInputElement).value);
  }

  getGradient(value: number): string {
    const hue = 227;
    const saturation = 65;
    const lightness = 80 - (80 - 34) * (value / 100);
    return `linear-gradient(90deg, hsl(${hue}, ${saturation}%, ${lightness}%) 0%, hsl(${hue}, ${saturation}%, ${lightness}%) 100%)`;
  }

  redirectToGoogleScholar(topic: RecommendedTopic): void {
    const query = encodeURIComponent(topic.topic_name);
    const url = `https://scholar.google.com/scholar?q=${query}`;
    window.open(url, '_blank');

    const userId = this.authService.getUserId();
    if (this.groupId && topic.id && userId) {
      this.topicService.notifyTopicVisited(this.groupId, topic.id.toString(), userId).subscribe(
        () => {
          //console.log('Topic visited notification sent:', response);
        },
        (error) => {
          console.error('Error sending topic visited notification:', error);
        },
      );
    }
  }

  combinedSearch(): void {
    const selectedTopics = this.recommendedTopics
      .filter((_, index) => this.combinedChecksState[index])
      .map((topic) => topic);

    if (selectedTopics.length > 0) {
      const query = encodeURIComponent(selectedTopics.map((t) => t.topic_name).join(' '));
      const url = `https://scholar.google.com/scholar?q=${query}`;
      window.open(url, '_blank');

      const userId = this.authService.getUserId();
      if (this.groupId && selectedTopics.length > 0 && userId) {
        const topicIds = selectedTopics.map((topic) => topic.id.toString());
        this.topicService.notifyCombinedSearch(this.groupId, topicIds, userId).subscribe(
          () => {
            //console.log('Combined search notification sent:', response);
          },
          (error) => {
            console.error('Error sending combined search notification:', error);
          },
        );
      }
    } else {
      alert('Please select at least one topic for a combined search.');
    }
  }

  checkAndCombinedSearch(): void {
    if (this.enableCombinedSearch) {
      this.combinedSearch();
    } else {
      alert('Enable combined search by checking the box.');
      this.enableCombinedSearch = !this.enableCombinedSearch;
    }
  }

  toggleExpertise(): void {
    this.showSliders = !this.showSliders;
  }

  toggleAddTopicForm(): void {
    this.showAddTopicForm = !this.showAddTopicForm;
  }

  completeConsensusPhaseOne(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  confirmPhaseCompletion(): void {
    const userId = this.authService.getUserId();
    if (this.groupId && userId) {
      this.topicService.notifyPhaseOneCompleted(this.groupId, userId).subscribe(
        () => {
          const phaseKey = `phase_${this.groupId}`;
          localStorage.setItem(phaseKey, '1');
          const currentUrl = this.router.url;
          const newUrl = currentUrl.replace('recommend-topics', 'valuation');
          this.router.navigateByUrl(newUrl);
          this.closeModal();
        },
        (error) => {
          console.error('Error sending consensus completed notification:', error);
        },
      );
    }
  }

  cancelPhaseCompletion(): void {
    this.closeModal();
  }
}
