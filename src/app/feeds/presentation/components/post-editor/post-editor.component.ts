import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ViewChild,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { FeedPost } from '../../../domain/entities/feed.interface';

@Component({
  selector: 'app-post-editor',
  templateUrl: './post-editor.component.html',
  styleUrls: ['./post-editor.component.css'],
})
export class PostEditorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() post: FeedPost | null = null;
  @Input() showModal: boolean = false;

  @Output() closeEditor = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ content: string; tags: string[] }>();

  @ViewChild('modalTemplate', { static: true }) modalTemplate!: TemplateRef<any>;
  @ViewChild('contentTextarea') contentTextarea: any;
  @ViewChild('tagInputRef') tagInputRef: any;

  editedContent: string = '';
  editedTags: string[] = [];
  tagInput: string = '';
  isSubmitting: boolean = false;

  private overlayRef: OverlayRef | null = null;
  private portal: TemplatePortal | null = null;

  constructor(
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
  ) {}

  ngOnInit(): void {
    this.initializeEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showModal']) {
      if (this.showModal) {
        this.openModal();
      } else {
        this.closeModal();
      }
    }

    if (changes['post'] || changes['showModal']) {
      this.initializeEditor();
    }
  }

  ngOnDestroy(): void {
    this.closeModal();
    // Limpiar overlay si existe
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private openModal(): void {
    if (!this.overlayRef) {
      // Crear overlay que renderiza en el body
      this.overlayRef = this.overlay.create({
        positionStrategy: this.overlay.position().global(),
        hasBackdrop: false, // Manejamos nuestro propio backdrop
        panelClass: 'post-editor-overlay-panel',
        scrollStrategy: this.overlay.scrollStrategies.block(),
      });
    }

    if (!this.portal) {
      this.portal = new TemplatePortal(this.modalTemplate, this.viewContainerRef);
    }

    // Renderizar el modal en el overlay (fuera del árbol de componentes)
    if (!this.overlayRef.hasAttached()) {
      this.overlayRef.attach(this.portal);
    }

    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    // Auto-focus en el textarea después de renderizar
    setTimeout(() => {
      if (this.contentTextarea?.nativeElement) {
        this.contentTextarea.nativeElement.focus();
        // Posicionar cursor al final del texto
        const textarea = this.contentTextarea.nativeElement;
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }, 150);
  }

  private closeModal(): void {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }

    // Restaurar scroll del body
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');

    this.resetForm();
  }

  private resetForm(): void {
    this.isSubmitting = false;
    this.tagInput = '';
  }

  private initializeEditor(): void {
    if (this.post && this.showModal) {
      this.editedContent = this.post.content;
      this.editedTags = [...(this.post.tags || [])];
      console.log(
        'PostEditor initialized with content:',
        this.editedContent,
        'tags:',
        this.editedTags,
      );
    }
  }

  /**
   * Cierra el modal
   */
  onClose(): void {
    if (!this.isSubmitting) {
      this.closeEditor.emit();
    }
  }

  /**
   * Guarda los cambios
   */
  onSave(): void {
    if (this.editedContent.trim() && !this.isSubmitting) {
      this.isSubmitting = true;

      console.log('PostEditor emitting save event');
      setTimeout(() => {
        this.save.emit({
          content: this.editedContent.trim(),
          tags: this.editedTags,
        });
        // El isSubmitting se resetea cuando se cierra el modal
      }, 100);
    }
  }

  /**
   * Agrega un tag
   */
  addTag(): void {
    const tag = this.tagInput.trim();
    if (tag && !this.editedTags.includes(tag) && this.editedTags.length < 10) {
      this.editedTags.push(tag);
      this.tagInput = '';

      // Focus de vuelta al input después de agregar un tag
      setTimeout(() => {
        if (this.tagInputRef?.nativeElement) {
          this.tagInputRef.nativeElement.focus();
        }
      }, 0);
    }
  }

  /**
   * Remueve un tag
   */
  removeTag(index: number): void {
    if (index >= 0 && index < this.editedTags.length) {
      this.editedTags.splice(index, 1);
    }
  }

  /**
   * Maneja el evento de tecla en el input de tag
   */
  onTagKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  /**
   * Maneja el click en el overlay
   */
  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget && !this.isSubmitting) {
      this.onClose();
    }
  }

  /**
   * Maneja las teclas especiales
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && !this.isSubmitting) {
      this.onClose();
    }
  }

  /**
   * Función de tracking para ngFor
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Verifica si se puede guardar
   */
  canSave(): boolean {
    return this.editedContent.trim().length > 0 && !this.isSubmitting;
  }

  /**
   * Obtiene el número de caracteres restantes
   */
  getRemainingCharacters(): number {
    return 5000 - this.editedContent.length;
  }

  /**
   * Verifica si el límite de caracteres está cerca
   */
  isNearCharacterLimit(): boolean {
    return this.getRemainingCharacters() < 100;
  }

  /**
   * Verifica si excede el límite de caracteres
   */
  isOverCharacterLimit(): boolean {
    return this.editedContent.length > 5000;
  }
}
