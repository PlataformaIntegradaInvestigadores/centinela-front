import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appSwapButton]',
})
export class SwapButtonDirective {
  @Input('appSwapButton') targetId!: string; // El ID del botón objetivo para mostrar

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  @HostListener('click') onClick() {
    // Ocultar el botón actual
    this.renderer.addClass(this.el.nativeElement, 'hidden');
    this.renderer.removeClass(this.el.nativeElement, 'block');

    // Mostrar el botón objetivo
    const targetElement = document.getElementById(this.targetId);
    if (targetElement) {
      this.renderer.removeClass(targetElement, 'hidden');
      this.renderer.addClass(targetElement, 'block');
    }
  }
}
