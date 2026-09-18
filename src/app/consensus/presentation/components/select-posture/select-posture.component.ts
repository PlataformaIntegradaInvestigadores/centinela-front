import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { UserPosture } from 'src/app/consensus/domain/entities/user-posture.interface';
import { DebateStatisticsService } from 'src/app/consensus/domain/services/debate-statistics.service';
import { DebateService } from 'src/app/consensus/domain/services/debate.service';
import { ConsensusService } from 'src/app/consensus/domain/services/GetGroupDataService.service';
import { UserPostureService } from 'src/app/consensus/domain/services/user-posture.service';

@Component({
  selector: 'app-select-posture',
  templateUrl: './select-posture.component.html',
  styleUrls: ['./select-posture.component.css'],
})
export class SelectPostureComponent {
  @Input() isModalOpen: boolean = false; // Controla la visibilidad del modal

  @Output() closeModal = new EventEmitter<void>();
  @Output() postureSelected = new EventEmitter<UserPosture>();
  @Output() openChat = new EventEmitter<void>();
  @Input() debateTitle: string = '';

  groupId: string = '';
  debateId!: number | null; // ID del debate

  @Input() set debateIdInput(value: number | null) {
    this.debateId = value;
    this.checkDebateId();
  }
  @Input() set groupIdInput(value: string | null) {
    this.groupId = value ?? '';
    this.checkDebateId();
    if (this.groupId) {
      this.checkAdminStatus();
    }
  }

  selectedPosture: 'agree' | 'disagree' | 'neutral' = 'agree'; // Postura predeterminada
  existingPostureId: number | null = null; // ID de la postura existente
  existingPosture: UserPosture | null = null; // Postura existente
  isModalOpenPostureSelection: boolean | undefined;
  isModalOpenExistingPosture: boolean | undefined;
  isModalOpenChat: boolean = false;

  //Administrador

  isAdmin: boolean = false;

  // Incentivo de participacion
  showDiscussionPrompt: boolean = false; // Estado para mostrar el modal de invitación

  constructor(
    private postureService: UserPostureService,
    private authService: AuthService,
    private debateService: DebateService,
    private debateStatisticsService: DebateStatisticsService,
    private consensusService: ConsensusService,
  ) {}

  checkDebateId(): void {
    console.log('Debate ID:', this.debateId);
    console.log('Group ID:', this.groupId);
    if (this.debateId != null && this.debateId != 0 && this.groupId != null) {
      this.checkExistingPosture();
      console.log('ID del debate:', this.debateId);
      console.log('ID del grupo:', this.groupId);
    } else {
      console.error('Faltan valores para debateId o groupId');
    }
  }

  checkAdminStatus(): void {
    if (!this.groupId) {
      console.error('Group ID no definido');
      return;
    }

    this.consensusService.getGroupById(this.groupId).subscribe({
      next: (group) => {
        const userId = this.authService.getUserId();
        if (group.admin_id === userId) {
          this.isAdmin = true;
          console.log('El usuario es administrador del grupo.');
        } else {
          this.isAdmin = false;
          console.log('El usuario NO es administrador del grupo.');
        }
      },
      error: (err) => {
        console.error('Error obteniendo datos del grupo:', err);
      },
    });
  }

  onAction(): void {
    this.debateService.triggerValidateDebateStatus();
  }

  closeDebate(): void {
    if (!this.debateId) {
      console.error('El debateId no está definido.');
      return;
    }

    this.debateService.closeDebate(this.groupId, this.debateId).subscribe({
      next: (debate) => {
        console.log('Debate cerrado:', debate);
        this.onAction(); // Dispara la acción
        this.closeModal.emit(); // Cierra el modal
      },
      error: (err) => {
        console.error('Error al cerrar el debate:', err);
      },
    });
  }

  checkExistingPosture(): void {
    if (this.debateId) {
      this.postureService.getUserPosture(this.debateId).subscribe({
        next: (posture) => {
          this.existingPosture = posture;
          this.existingPostureId = posture.id ?? null;
          console.log('Postura existente encontrada:', posture);
        },
        error: () => {
          this.existingPosture = null;
          this.existingPostureId = null;
          console.log('No se encontró una postura existente');
        },
      });
    }
  }

  // submitPosture(): void {
  //   const data: UserPosture = {
  //     user: this.authService.getUserId() || '', // Obtén el ID del usuario autenticado
  //     debate: this.debateId || 0, // ID del debate actual
  //     posture: this.selectedPosture as 'agree' | 'disagree', // Asegúrate de que el valor sea 'agree' o 'disagree'
  //   };

  //   if (this.existingPostureId) {
  //     this.postureService.updateUserPosture(this.existingPostureId, { posture: this.selectedPosture as 'agree' | 'disagree' }).subscribe({
  //       next: (response) => {
  //         console.log('Postura actualizada:', response);
  //         this.postureSelected.emit(response);
  //         console.log('Postura actualizada:', response);
  //         this.triggerSendDebateId();
  //       },
  //       error: (error) => console.error('Error actualizando postura:', error),
  //     });
  //   } else {
  //     this.postureService.createUserPosture(data).subscribe({
  //       next: (response) => {
  //         console.log('Postura registrada:', response);
  //         this.postureSelected.emit(response);
  //       },
  //       error: (error) => console.error('Error registrando postura:', error),
  //     });
  //   }
  // }

  submitPosture(): void {
    const data: UserPosture = {
      user: this.authService.getUserId() || '',
      debate: this.debateId || 0,
      posture: this.selectedPosture,
    };

    if (this.existingPostureId) {
      this.postureService
        .updateUserPosture(this.existingPostureId, { posture: this.selectedPosture })
        .subscribe({
          next: (response) => {
            this.postureSelected.emit(response);
            this.showDiscussionPrompt = true; // Mostrar modal después de registrar postura
          },
          error: (error) => console.error('Error updating posture:', error),
        });
    } else {
      this.postureService.createUserPosture(data).subscribe({
        next: (response) => {
          this.postureSelected.emit(response);
          this.showDiscussionPrompt = true; // Mostrar modal después de registrar postura
        },
        error: (error) => console.error('Error registering posture:', error),
      });
    }
  }

  // Método para mostrar el modal después de registrar la postura
  // submitPosture(): void {
  //   const data: UserPosture = {
  //     user: this.authService.getUserId() || '',
  //     debate: this.debateId || 0,
  //     posture: this.selectedPosture,
  //   };

  //   this.postureService.createUserPosture(data).subscribe({
  //     next: (response) => {
  //       this.postureSelected.emit(response);
  //       this.showDiscussionPrompt = true; // Mostrar el modal después de registrar postura
  //     },
  //     error: (error) => console.error('Error registrando postura:', error),
  //   });
  // }

  closeDiscussionPrompt(): void {
    this.showDiscussionPrompt = false; // Cerrar modal sin unirse
  }

  updatePosture(): void {
    if (!this.existingPostureId) {
      console.error('No hay una postura existente para actualizar.');
      return;
    }

    const updatedPosture = {
      posture: this.selectedPosture as 'agree' | 'disagree', // La postura seleccionada
    };

    this.postureService.updateUserPosture(this.existingPostureId, updatedPosture).subscribe({
      next: (response) => {
        console.log('Postura actualizada con éxito:', response);
        this.postureSelected.emit(response); // Notifica el cambio al componente padre
        this.closeModal.emit(); // Cierra el modal
        console.log('Postura actualizada:', response);
        this.triggerSendDebateId();
      },
      error: (error) => {
        console.error('Error al actualizar la postura:', error);
      },
    });
  }

  openUpdatePosture(): void {
    this.isModalOpenPostureSelection = true; // Mostrar el formulario de selección
    this.isModalOpenExistingPosture = false; // Ocultar la vista de postura existente
  }

  openChatModal(): void {
    console.log('Abriendo chat...');
    console.log('Debate ID:', this.debateId);
    console.log('Group ID:', this.groupId);

    if (!this.debateId || !this.groupId) {
      console.error('Faltan valores para debateId o groupId. No se puede abrir el chat.');
      return;
    }

    this.openChat.emit(); // Emite el evento al padre
    console.log('Evento openChat emitido desde SelectPostureComponent.');
    this.showDiscussionPrompt = false; // Cierra el modal de invitación
  }

  // setPosture(posture: 'agree' | 'disagree'): void {
  //   this.selectedPosture = posture;

  //   const data: UserPosture = {
  //     user: this.authService.getUserId() || '', // Obtén el ID del usuario autenticado
  //     debate: this.debateId || 0, // ID del debate actual
  //     posture: this.selectedPosture as 'agree' | 'disagree', // Asegúrate de que el valor sea del tipo correcto
  //   };

  //   if (this.existingPostureId) {
  //     // Si ya existe una postura, se actualiza
  //     this.postureService.updateUserPosture(this.existingPostureId, { posture: this.selectedPosture as 'agree' | 'disagree' }).subscribe({
  //       next: (response) => {
  //         console.log('Postura actualizada:', response);
  //         this.postureSelected.emit(response); // Notifica al componente padre
  //       },
  //       error: (error) => {
  //         console.error('Error actualizando postura:', error);
  //       },
  //     });
  //   } else {
  //     // Si no existe una postura, se crea una nueva
  //     this.postureService.createUserPosture(data).subscribe({
  //       next: (response) => {
  //         console.log('Postura registrada:', response);
  //         this.postureSelected.emit(response); // Notifica al componente padre
  //       },
  //       error: (error) => {
  //         console.error('Error registrando postura:', error);
  //       },
  //     });
  //   }
  // }

  setPosture(posture: 'agree' | 'disagree' | 'neutral'): void {
    this.selectedPosture = posture;

    const data: UserPosture = {
      user: this.authService.getUserId() || '', // Asegura que siempre haya un valor
      debate: this.debateId || 0,
      posture: this.selectedPosture,
    };

    if (this.existingPostureId) {
      // Actualizar postura existente
      this.postureService
        .updateUserPosture(this.existingPostureId, { posture: this.selectedPosture })
        .subscribe({
          next: (response) => {
            console.log('Postura actualizada:', response);
            this.existingPosture = {
              ...(this.existingPosture || {}),
              posture: this.selectedPosture,
              user: data.user,
              debate: data.debate,
            }; // Actualiza la postura localmente
            this.postureSelected.emit(response); // Notifica al componente padre
            console.log('Postura actualizada:', response);
            this.triggerSendDebateId();
          },
          error: (error) => {
            console.error('Error actualizando postura:', error);
          },
        });
    } else {
      // Crear nueva postura
      this.postureService.createUserPosture(data).subscribe({
        next: (response) => {
          console.log('Postura registrada:', response);
          this.existingPosture = response; // Actualiza la postura localmente
          this.postureSelected.emit(response); // Notifica al componente padre
        },
        error: (error) => {
          console.error('Error registrando postura:', error);
        },
      });
    }
  }

  triggerSendDebateId(): void {
    if (this.debateId !== null) {
      this.debateStatisticsService.sendDebateId(this.debateId); // Envía el debateId al servicio
      console.log('Debate ID enviado:', this.debateId);
    } else {
      console.error('Debate ID is null and cannot be sent.');
    }
  }
}
