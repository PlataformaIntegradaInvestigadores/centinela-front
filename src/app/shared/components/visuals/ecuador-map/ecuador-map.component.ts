import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';
import { json } from 'd3';

@Component({
  selector: 'app-ecuador-map',
  templateUrl: './ecuador-map.component.html',
  styleUrls: ['./ecuador-map.component.css'],
})
export class EcuadorMapComponent implements OnInit, OnChanges {
  @Input()
  response!: string;
  private g: any;
  margin = 25;
  @Input()
  width!: number;
  @Input()
  height = 380;
  @Input()
  scale = 3000;
  @Input()
  x = -75.8;
  @Input()
  y = -3.4;
  private geoJson: any;

  constructor() {}

  private createSvg(): void {
    const svg = d3.select('figure#map').select('svg');
    this.g = svg.append('g').attr('transform', `translate(${this.margin}, ${this.margin})`);
  }

  private drawMap(data: any, articlesData: any): void {
    const projection = d3.geoMercator().center([this.x, this.y]).scale(this.scale);

    const geoGenerator = d3.geoPath().projection(projection);

    const articleMap = new Map<string, number>(
      articlesData.map((d: any) => [d.province_name, d.total_articles]),
    );
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([1000, 30000]); // Ajusta el dominio para mejorar el contraste

    this.g
      .selectAll('path')
      .data(data.features)
      .join('path')
      .attr('d', geoGenerator)
      .attr('fill', (d: any) => {
        const totalArticles = articleMap.get(d.properties.dpa_despro) || 0;
        return colorScale(totalArticles + 10000);
      })
      .append('title');
    // .text((d: any) => `${d.properties.dpa_despro}: ${articleMap.get(d.properties.dpa_despro) || 0} artículos`);

    // Agregar evento de mouseover para mostrar el tooltip
    this.g
      .selectAll('path')
      .on('mouseover', (event: any, d: any) => {
        const tooltip = d3.select('#tooltip');
        tooltip
          .html(
            `<div>${d.properties.dpa_despro}: ${articleMap.get(d.properties.dpa_despro) || 0} artículos</div>`,
          )
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 15}px`)
          .style('opacity', 100);
      })
      .on('mouseout', () => {
        const tooltip = d3.select('#tooltip');
        tooltip.style('opacity', 0);
      });
  }

  ngOnInit(): void {
    this.createSvg();
    json('assets/data/ecuador.geojson').then((geoData) => {
      this.geoJson = geoData;
      if (this.response) {
        this.updateMap();
      }
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['response'] && !changes['response'].isFirstChange()) || changes['width']) {
      this.updateMap();
    }
  }
  private updateMap(): void {
    d3.json(this.response).then((articlesData) => {
      if (!this.geoJson) {
        return;
      }
      this.drawMap(this.geoJson, articlesData);
    });
  }

  protected readonly window = window;
}
