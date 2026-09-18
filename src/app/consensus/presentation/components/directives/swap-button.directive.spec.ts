import { ElementRef, Renderer2 } from '@angular/core';
import { SwapButtonDirective } from './swap-button.directive';

describe('SwapButtonDirective', () => {
  let nativeElement: any;
  let el: ElementRef;
  let renderer: jasmine.SpyObj<Renderer2>;
  let directive: SwapButtonDirective;

  beforeEach(() => {
    nativeElement = {};
    el = { nativeElement } as ElementRef;
    renderer = jasmine.createSpyObj('Renderer2', ['addClass', 'removeClass']);
    directive = new SwapButtonDirective(el, renderer);
    directive.targetId = 'target-btn';
  });

  it('hides itself (hidden/block classes) on click', () => {
    directive.onClick();
    expect(renderer.addClass).toHaveBeenCalledWith(nativeElement, 'hidden');
    expect(renderer.removeClass).toHaveBeenCalledWith(nativeElement, 'block');
  });

  it('shows the target element when it exists in the DOM', () => {
    const target = {} as HTMLElement;
    spyOn(document, 'getElementById').and.returnValue(target);
    directive.onClick();
    expect(document.getElementById).toHaveBeenCalledWith('target-btn');
    expect(renderer.removeClass).toHaveBeenCalledWith(target, 'hidden');
    expect(renderer.addClass).toHaveBeenCalledWith(target, 'block');
  });

  it('does nothing to a target when it is not found in the DOM', () => {
    spyOn(document, 'getElementById').and.returnValue(null);
    directive.onClick();
    expect(document.getElementById).toHaveBeenCalledWith('target-btn');
    const targetCalls = renderer.addClass
      .calls.all()
      .filter((c) => c.args[0] !== nativeElement);
    expect(targetCalls.length).toBe(0);
  });
});
