import { EventEmitter } from '@angular/core';
import { Link } from './link';
import { Node } from './node';
import * as d3 from 'd3';

const FORCES = {
  LINKS: 1 / 500,
  COLLISION: 1,
  CHARGE: -1,
};

export class ForceDirectedGraph {
  public ticker: EventEmitter<d3.Simulation<Node, Link>> = new EventEmitter();
  public simulation!: d3.Simulation<any, any>;

  public nodes: Node[] = [];
  public links: Link[] = [];
  public forces: { manyBody: number; collide: number };

  constructor(
    nodes: Node[],
    links: Link[],
    options: { width: number; height: number },
    forces: { manyBody: number; collide: number },
  ) {
    this.nodes = nodes;
    this.links = links;
    this.forces = forces;
    this.initSimulation(options);
  }

  initNodes() {
    if (!this.simulation) {
      throw new Error('simulation was not initialized yet');
    }

    this.simulation.nodes(this.nodes);
  }

  initLinks() {
    if (!this.simulation) {
      throw new Error('simulation was not initialized yet');
    }

    this.simulation.force(
      'links',
      d3
        .forceLink(this.links)
        .id((d) => {
          // @ts-expect-error d3 force-link node datum typing doesn't expose custom 'id' property
          return d['id'];
        })
        .distance((d: any) => {
          const sourceR = d.source?.r || 35;
          const targetR = d.target?.r || 35;
          return sourceR + targetR + 80;
        })
        .iterations(4),
      /*.strength(d =>{
        return d['strokeWidth'] / 100
      })*/
      // .strength(FORCES.LINKS)
      // .strength(1 / (this.nodes.length * 10))
    );
  }

  initSimulation(options: { width: number; height: number }) {
    if (!options || !options.width || !options.height) {
      throw new Error('missing options when initializing simulation');
    }

    const centerX = options.width / 2;
    const centerY = options.height / 2;
    this.nodes.forEach((node) => {
      if (node.level === 0) {
        node.fx = centerX;
        node.fy = centerY;
      }
    });

    /** Creating the simulation */
    if (!this.simulation) {
      const ticker = this.ticker;

      this.simulation = d3
        .forceSimulation()
        .velocityDecay(0.45)
        .force(
          'charge',
          d3.forceManyBody().strength(() => -150),
        )
        .force(
          'collide',
          d3
            .forceCollide()
            .strength(FORCES.COLLISION)
            .radius((d) => {
              // @ts-expect-error d3 force-collide node datum typing doesn't expose custom 'r' property
              return (d['r'] || 35) + 15;
            })
            .iterations(4),
        );

      // Connecting the d3 ticker to an angular event emitter
      this.simulation.on('tick', function () {
        ticker.emit(this);
      });

      this.initNodes();
      this.initLinks();
    }

    /** Updating the central force of the simulation */
    this.simulation.force('centers', d3.forceCenter(options.width / 2, options.height / 2));

    /** Restarting the simulation internal timer */
    this.simulation.restart();
  }
}
