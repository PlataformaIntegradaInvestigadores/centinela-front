import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConsensusResult } from 'src/app/consensus/domain/entities/consensus-result.interface';
import { DebateStatisticsService } from 'src/app/consensus/domain/services/debate-statistics.service';
import { TopicService } from 'src/app/consensus/domain/services/TopicDataService.service';
import { WebSocketPhase3Service } from 'src/app/consensus/domain/services/websocket-phase3.service';

@Component({
  selector: 'phase3-consensus',
  templateUrl: './phase3-consensus.component.html',
  styleUrls: ['./phase3-consensus.component.css'],
})
export class Phase3ConsensusComponent implements OnInit, OnDestroy {
  groupId: string = '';
  consensusResults: ConsensusResult[] = [];
  private wsSubscription: Subscription | undefined;
  activeConnections: number = 0;
  showResults: boolean = false;
  isDraw: boolean = false;
  userId: string = '';

  debateId: number = 0;
  totalAgree: number = 0;
  totalDisagree: number = 0;
  totalNeutral: number = 0;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private topicDataService: TopicService,
    private route: ActivatedRoute,
    private webSocketService: WebSocketPhase3Service,
    private router: Router,
    private dashboardService: DebateStatisticsService,
  ) {}

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe((params) => {
      this.groupId = params.get('groupId') || '';
      this.userId = params.get('id') || '';
      this.loadConsensusResults();
      this.connectWebSocket();
    });

    // Suscribirse al servicio para recibir el debateId
    this.dashboardService.debateId$.subscribe((debateId: number) => {
      console.log('Debate ID recibido:', debateId);
      this.debateId = debateId; // Almacenar el debateId
      this.loadPostureStatistics(); // Cargar estadísticas basadas en el debateId actualizado
    });
  }

  validateDebateStatus(debateId: number): void {
    // Implementa la lógica con el debateId
    console.log('Validando el debate con ID:', debateId);
    // Llama a tus servicios o ajusta la lógica según sea necesario
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  loadConsensusResults(): void {
    this.topicDataService.getConsensusResults(this.groupId).subscribe(
      (results) => {
        this.showResults = true;
        this.consensusResults = results.results;
        this.checkForTie();
      },
      (error) => {
        if (error.error === 'Not all users have completed phase 1 and 2') {
          this.showResults = false;
        }
        console.error('Error loading consensus results:', error);
      },
    );
  }

  connectWebSocket(): void {
    if (this.groupId) {
      const socket = this.webSocketService.connect(this.groupId);
      this.wsSubscription = socket.subscribe(
        (message) => {
          if (message.message.type === 'connection_count') {
            this.activeConnections = message.message.active_connections;
          }

          if (message.message.type === 'consensus_calculation_completed') {
            this.consensusResults = message.message.results;
            this.showResults = true;
            this.checkForTie();
          }

          if (message.message.type === 'phase_update') {
            const phase = message.message.phase;
            if (phase === 1) {
              const phaseKey = `phase_${this.groupId}`;
              localStorage.setItem(phaseKey, '1');
              setTimeout(() => {
                this.router.navigate([
                  `/profile/${this.userId}/my-groups/${this.groupId}/consensus/valuation`,
                ]);
              }, 1500);
            }
            if (phase === 0) {
              const phaseKey = `phase_${this.groupId}`;
              localStorage.setItem(phaseKey, '0');
              setTimeout(() => {
                this.router.navigate([
                  `/profile/${this.userId}/my-groups/${this.groupId}/consensus/recommend-topics`,
                ]);
              }, 1500);
            }
          }

          if (message.message.type === 'remove_member') {
            this.loadConsensusResults();
          }
        },
        (error) => {
          console.error('Error receiving consensus results via WebSocket:', error);
        },
      );
    }
  }
  private checkForTie(): void {
    const valueCounts = new Map<number, number>();

    this.consensusResults.forEach((result) => {
      const count = valueCounts.get(result.final_value) || 0;
      valueCounts.set(result.final_value, count + 1);
    });

    this.isDraw = Array.from(valueCounts.values()).some((count) => count > 1);
  }

  loadPostureStatistics(): void {
    console.log('Cargando estadísticas para debate ID:', this.debateId);

    // Llamada al servicio para obtener las estadísticas
    const postureSub = this.dashboardService.getStatistics(this.debateId).subscribe(
      (statistics) => {
        console.log('Estadísticas recibidas:', statistics);

        // Asignar valores recibidos a las variables locales
        this.totalAgree = statistics.total_agree || 0; // Validación en caso de valores undefined
        this.totalDisagree = statistics.total_disagree || 0;
        this.totalNeutral = statistics.total_neutral || 0;

        // Confirmar los datos asignados
        console.log('Datos asignados:', {
          totalAgree: this.totalAgree,
          totalDisagree: this.totalDisagree,
          totalNeutral: this.totalNeutral,
        });
      },
      (error) => {
        console.error('Error loading posture statistics:', error);
      },
    );

    // Añadir la suscripción a un grupo de suscripciones (para manejo centralizado)
    this.subscriptions.add(postureSub);
  }
}
