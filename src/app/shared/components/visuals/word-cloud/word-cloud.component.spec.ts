import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WordCloudComponent } from './word-cloud.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Word } from '../../../interfaces/dashboard.interface';

describe('WordCloudComponent', () => {
  let component: WordCloudComponent;
  let fixture: ComponentFixture<WordCloudComponent>;
  let svg: SVGElement;

  const words: Word[] = [
    { text: 'ai', size: 200 },
    { text: 'ml', size: 150 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WordCloudComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(WordCloudComponent);
    component = fixture.componentInstance;
    component.words = words;
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGElement;
    svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
    (component as any).svgElement = { nativeElement: svg };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes its @Input configuration with the documented defaults', () => {
    expect(component.width).toBe(380);
    expect(component.height).toBe(420);
    expect(component.size).toBe(7);
    expect(component.x).toBe(190);
    expect(component.y).toBe(230);
    expect(component.padding).toBe(0.25);
    expect(component.min).toBe(100);
    expect(component.marginX).toBe(40);
    expect(component.marginY).toBe(30);
  });

  it('renders words into the svg via generateWordCloud/draw', () => {
    const sample = [
      { text: 'ai', size: 200, x: 0, y: 0, rotate: 0 },
      { text: 'ml', size: 150, x: 10, y: 10, rotate: 0 },
    ];
    spyOn(component as any, 'generateWordCloud').and.callFake(() =>
      (component as any).draw(sample),
    );
    // ngAfterViewInit runs as part of this detectChanges() and Angular's own @ViewChild
    // resolution overwrites the manual svgElement stub from beforeEach with the real
    // template-bound <svg #svg>, so assertions must query that element, not the
    // detached `svg` stub.
    fixture.detectChanges();

    const realSvg: SVGElement = (component as any).svgElement.nativeElement;
    const texts = realSvg.querySelectorAll('text');
    expect(texts.length).toBe(2);
    expect(texts[0].textContent).toContain('ai');
    expect(texts[1].textContent).toContain('ml');
  });

  it('emits the clicked word text through the output', () => {
    const emitted: string[] = [];
    component.eventEmitter.subscribe((t: string) => emitted.push(t));
    (component as any).onWordClick({ text: 'quantum' });
    expect(emitted).toEqual(['quantum']);
  });
});
