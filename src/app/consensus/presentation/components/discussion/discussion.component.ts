import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { DebateChatService } from 'src/app/consensus/domain/services/debate-chat.service';
import { ReactionService } from 'src/app/consensus/domain/services/reaction.service';
import { UserPostureService } from 'src/app/consensus/domain/services/user-posture.service';
import { Filter as BadWordsFilter } from 'bad-words';

@Component({
  selector: 'app-discussion',
  templateUrl: './discussion.component.html',
  styleUrls: ['./discussion.component.css'],
})
export class DiscussionComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isModalOpen: boolean = false;
  @Input() debateIdInput!: number;
  @Input() groupIdInput!: string;
  @Output() closeChat = new EventEmitter<void>();
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  debateIdString!: string;
  messages: any[] = [];
  newMessage = '';
  userPosture!: string;
  currentUser: string = '';
  userColors: { [key: string]: string } = {}; // Mapa de colores para cada usuario
  currentParentId: number | null = null; // ID del mensaje principal al que se responde
  private filter = new BadWordsFilter(); // Instancia de bad-words
  containsBadWords: boolean = false; // Nueva propiedad para controlar el estado del botón

  private subscription!: Subscription;

  constructor(
    private chatService: DebateChatService,
    private reactionService: ReactionService,
    private userPostureService: UserPostureService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    if (this.debateIdInput) {
      this.initializeCurrentUser(); // Inicializa el usuario actual
      this.initializeChat();
      this.fetchUserPosture();
      this.loadMessageHistory();
    } else {
      console.error('debateId no está definido en ngOnInit');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['debateId'] && changes['debateId'].currentValue) {
      console.log('Nuevo debateId recibido:', changes['debateId'].currentValue);
      this.initializeChat();
      this.fetchUserPosture();
      this.loadMessageHistory();
    }
  }

  private initializeChat(): void {
    try {
      this.chatService.connect(this.groupIdInput, this.debateIdInput.toString());
      this.subscription = this.chatService.getMessages().subscribe((message) => {
        if (message.parent) {
          this.addReplyToThread(message);
        } else {
          this.messages.push({
            ...message,
            replies: [],
          });
        }
      });
    } catch (error) {
      console.error('Error al inicializar el chat:', error);
    }
  }
  // También cuando se recibe un nuevo mensaje
  // private initializeChat(): void {
  //   try {
  //     console.log('Intentando conectar a WebSocket con:', this.groupIdInput, this.debateIdInput.toString());

  //     this.chatService.connect(this.groupIdInput, this.debateIdInput.toString());

  //     this.subscription = this.chatService.getMessages().subscribe((message) => {
  //       console.log('Mensaje recibido del WebSocket:', message); // Verificar si llegan mensajes

  //       if (message.parent) {
  //         this.addReplyToThread(message);
  //       } else {
  //         this.messages.push({
  //           ...message,
  //           replies: [],
  //         });
  //       }

  //       setTimeout(() => this.scrollToBottom(), 100);
  //     });
  //   } catch (error) {
  //     console.error('Error al inicializar el chat:', error);
  //   }
  // }

  private addReplyToThread(reply: any): void {
    const parentMessage = this.messages.find((msg) => msg.id === reply.parent);
    if (parentMessage) {
      parentMessage.replies.push(reply);
    }
  }

  private initializeCurrentUser(): void {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.currentUser = payload.username;
    } else {
      console.error('No se encontró el token de usuario.');
    }
  }

  private fetchUserPosture(): void {
    this.userPostureService.getUserPostureByDebate(this.debateIdInput).subscribe({
      next: (posture) => {
        this.userPosture = posture.posture; // Asigna la postura al componente
        console.log('Postura del usuario obtenida:', this.userPosture);
      },
      error: (err) => {
        console.error('Error al obtener la postura del usuario:', err);
        this.userPosture = 'neutral'; // Valor predeterminado si ocurre un error
      },
    });
  }

  private loadMessageHistory(): void {
    if (!this.debateIdInput) {
      console.error('El debateId no está definido.');
      return;
    }

    this.chatService.getMessageHistory(this.debateIdInput).subscribe({
      next: (messages) => {
        this.messages = messages.map((message) => {
          this.assignColorToUser(message.user); // Asigna un color al usuario
          return {
            ...message,
            replies: message.replies || [],
            timestamp: new Date(message.created_at),
          };
        });
      },
      error: (err) => {
        console.error('Error al cargar los mensajes históricos:', err);
        this.messages = [];
      },
    });
  }

  // private loadMessageHistory(): void {
  //   if (!this.debateIdInput) {
  //     console.error('El debateId no está definido.');
  //     return;
  //   }

  //   this.chatService.getMessageHistory(this.debateIdInput).subscribe({
  //     next: (messages) => {
  //       console.log('Mensajes históricos cargados:', messages); // Verifica si llegan los mensajes históricos

  //       this.messages = messages.map((message) => ({
  //         ...message,
  //         replies: message.replies || [],
  //         timestamp: new Date(message.created_at),
  //       }));

  //       setTimeout(() => this.scrollToBottom(), 100); // Asegura que se muestren los mensajes más recientes
  //     },
  //     error: (err) => {
  //       console.error('Error al cargar los mensajes históricos:', err);
  //       this.messages = [];
  //     },
  //   });
  // }

  // Función para hacer scroll al último mensaje
  // private scrollToBottom(): void {
  //   if (this.messagesContainer) {
  //     setTimeout(() => {
  //       this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
  //     }, 100);
  //   }
  // }

  sendMessage(): void {
    const sanitizedMessage = this.filter.clean(this.newMessage); // Limpia el mensaje usando bad-words

    if (this.containsBadWords) {
      alert('El mensaje contiene lenguaje inapropiado.');
      return;
    }

    this.chatService.sendMessage({
      text: sanitizedMessage,
      posture: this.userPosture,
      parent: this.currentParentId ?? undefined, // Mensaje padre si existe
    });

    this.newMessage = '';
    this.currentParentId = null;
    this.containsBadWords = false; // Reinicia el estado del control de malas palabras
  }
  // sendMessage(): void {
  //   const sanitizedMessage = this.filter.clean(this.newMessage);

  //   if (this.containsBadWords) {
  //     alert('El mensaje contiene lenguaje inapropiado.');
  //     return;
  //   }

  //   const messageData = {
  //     text: sanitizedMessage,
  //     posture: this.userPosture,
  //     parent: this.currentParentId ?? undefined, // Mensaje padre si existe
  //     user: this.currentUser, // Agrega el usuario actual
  //     created_at: new Date().toISOString(), // Marca de tiempo
  //   };

  //   this.chatService.sendMessage(messageData);

  //   // Agregar el mensaje localmente para reflejarlo en el chat de inmediato
  //   this.messages.push({
  //     ...messageData,
  //     replies: [],
  //     timestamp: new Date(), // Asegurar que tenga un timestamp válido
  //   });

  //   this.newMessage = '';
  //   this.currentParentId = null;
  //   this.containsBadWords = false;

  //   setTimeout(() => this.scrollToBottom(), 100); // Asegurar el desplazamiento al último mensaje
  // }

  onMessageChange(): void {
    // Verifica si el mensaje contiene lenguaje ofensivo
    this.containsBadWords = this.filter.isProfane(this.newMessage);

    // Si el mensaje está vacío, también considera deshabilitar el botón
    if (!this.newMessage.trim()) {
      this.containsBadWords = false; // El botón se habilita si no hay palabras ofensivas
    }
  }

  private detectLinks(message: string): string {
    const urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;
    return message.replace(urlRegex, (url) => {
      const href = url.startsWith('http') ? url : `http://${url}`;
      return `<a href="${href}" target="_blank" class="text-blue-500 underline">${url}</a>`;
    });
  }

  getParentMessageText(): string {
    if (this.currentParentId) {
      const parentMessage = this.messages.find((msg) => msg.id === this.currentParentId);
      return parentMessage ? parentMessage.text : 'Mensaje';
    }
    return '';
  }

  replyToMessage(parentId: number): void {
    this.currentParentId = parentId; // Asigna el mensaje padre
  }

  addReaction(messageId: number): void {
    this.reactionService.addReaction({ message: messageId }).subscribe((response) => {
      console.log('Reacción registrada:', response);
    });
  }

  closeModal(): void {
    this.closeChat.emit(); // Notifica al padre que se debe cerrar el modal
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Genera un color único para un usuario y lo guarda en el mapa de colores.
   * @param username Nombre del usuario.
   */
  private assignColorToUser(username: string): void {
    if (!this.userColors[username]) {
      // Generar un color único
      const color = this.generateColor(username);
      this.userColors[username] = color;
    }
  }

  /**
   * Genera un color basado en el hash del nombre de usuario.
   * @param username Nombre del usuario.
   * @returns Un color hexadecimal.
   */
  private generateColor(username: string): string {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 70%, 50%)`; // Genera un color HSL
    return color;
  }

  /**
   * Obtiene el color asignado a un usuario.
   * @param username Nombre del usuario.
   * @returns Color en formato CSS.
   */
  getUserColor(username: string): string {
    return this.userColors[username] || '#000000'; // Negro por defecto si no hay color asignado
  }

  formatMessage(message: string): SafeHtml {
    const formattedMessage = this.detectLinks(message);
    return this.sanitizer.bypassSecurityTrustHtml(formattedMessage);
  }
}
