import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import cloud from 'd3-cloud';
import { Word } from '../../../interfaces/dashboard.interface';
import { interpolateViridis, scaleSequential } from 'd3';

@Component({
  selector: 'app-word-cloud',
  templateUrl: './word-cloud.component.html',
  styleUrls: ['./word-cloud.component.css'],
})
export class WordCloudComponent implements AfterViewInit {
  @ViewChild('svg') svgElement!: ElementRef<SVGElement>;
  @Input()
  width = 380; // Asumiendo un ancho fijo para el SVG
  @Input()
  height = 420; // Asumiendo una altura fija para el SVG

  @Output()
  eventEmitter: EventEmitter<string> = new EventEmitter();

  @Input()
  words!: Word[];

  @Input()
  size = 7;

  @Input()
  x = 190;

  @Input()
  y = 230;

  @Input()
  padding = 0.25;

  @Input()
  min = 100;

  constructor(private el: ElementRef) {}

  @Input()
  marginX = 40;
  @Input()
  marginY = 30;
  ngAfterViewInit(): void {
    this.generateWordCloud(); // Asegúrate de llamarlo aquí, después de que el SVG esté disponible
  }
  private generateWordCloud(): void {
    const layout = cloud()
      .size([this.width - this.marginX, this.height - this.marginY])
      .words(this.words.map((d) => ({ text: d.text, size: Math.max(d.size, 100) })))
      .padding(this.padding)
      .rotate(0)
      .fontSize((d) =>
        Math.max(100 / this.size, Math.min((d.size || 300) / this.size, 300 / this.size)),
      )
      .on('end', (words) => this.draw(words));

    layout.start();
  }
  // private generateWordCloud(): void {
  //   const layout = cloud()
  //     .size([this.width - 50, this.height -60])
  //     .words(this.words.map(d => ({text: d.text, size:Math.max(d.size,100)||Math.min(d.size,200)})))
  //     .padding(this.padding)
  //     .rotate(0)
  //     .fontSize(d =>
  //       (d.size || 400) / this.size
  //     )
  //     .on('end', words => this.draw(words));
  //
  //   layout.start();
  // }

  private draw(words: any[]): void {
    const svg = d3.select(this.svgElement.nativeElement);

    const g = svg.select('g').attr('transform', `translate(${this.x}, ${this.y})`);
    const colorScale = scaleSequential(interpolateViridis).domain([0, words.length - 1]);

    g.selectAll('text')
      .data(words)
      .enter()
      .append('text')
      .attr('draggable', '')
      .style('font-size', (d) => `${d.size}px`)
      .style('font-family', 'Impact')
      .style('fill', (d, i) => colorScale(i))
      .attr('text-anchor', 'middle')
      .attr('transform', (d) => `translate(${d.x},${d.y})rotate(${d.rotate})`)
      .text((d) => d.text)
      .call(
        d3
          .drag<SVGTextElement, any>()
          .on('start', function () {
            d3.select(this).raise().attr('stroke', 'black');
            d3.select(this).interrupt(); // Detiene cualquier animación en curso durante el arrastre
          })
          .on('drag', function (event, d) {
            d3.select(this).attr(
              'transform',
              `translate(${event.x},${event.y})rotate(${d.rotate})`,
            );
          })
          .on('end', (event) => {
            d3.select(event.sourceEvent.target).attr('stroke', null);
          }),
      )
      .on('click', (event, d) => this.onWordClick(d));
  }

  private animateFloating(
    textSelection: d3.Selection<SVGTextElement, any, SVGGElement, any>,
  ): void {
    textSelection.each((d, i, nodes) => {
      this.float(d3.select(nodes[i]));
    });
  }

  private float(element: d3.Selection<SVGTextElement, any, any, any>): void {
    const randomX = Math.random() * 3;
    const randomY = Math.random() * 3;
    element
      .transition()
      .duration(1000)
      .ease(d3.easeSinInOut)
      .attr('transform', function (d) {
        const currentTransform = d3.select(this).attr('transform');
        const translate = currentTransform.match(/translate\(([^)]+)\)/);
        const [x, y] = translate ? translate[1].split(',').map(Number) : [d.x, d.y];
        return `translate(${x + randomX},${y + randomY})rotate(${d.rotate})`;
      })
      .on('end', () => this.float(element));
  }

  //
  private onWordClick(word: any): void {
    this.eventEmitter.emit(word.text);
  }
}
