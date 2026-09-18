import { Injectable } from '@angular/core';
import { ForceDirectedGraph, Link, Node } from './models';
import * as d3 from 'd3';

@Injectable()
export class D3Service {
  /** This service will provide methods to enable user interaction with elements
   * while maintaining the d3 simulations physics
   */
  constructor() {}

  /** A method to bind a pan and zoom behaviour to an svg element */
  applyZoomableBehaviour(svgElement: HTMLElement, containerElement: any) {
    const svg = d3.select(svgElement);
    const container: d3.Selection<any, unknown, null, undefined> = d3.select(containerElement);

    function zoomed(e: any) {
      const transform = e.transform;
      container.attr(
        'transform',
        'translate(' + transform.x + ',' + transform.y + ') scale(' + transform.k + ')',
      );
    }

    const zoom = d3.zoom().scaleExtent([0.1, 4]).on('zoom', zoomed);
    // @ts-expect-error d3 typings do not model attaching zoom behavior via call() with our selection generics
    svg.call(zoom);

    // Apply an initial zoom-out scale so the graph fits better on the screen
    const width = svgElement.clientWidth || 800;
    const height = svgElement.clientHeight || 600;
    svg.call(
      // @ts-expect-error d3 typings do not model attaching zoom behavior via call() with our selection generics
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(0.6)
        .translate(-width / 2, -height / 2),
    );

    // Attach the behavior for external use
    // @ts-expect-error __zoomBehavior is a custom property attached for external access, not part of HTMLElement
    svgElement.__zoomBehavior = zoom;
  }

  /** A method to bind a draggable behaviour to an svg element */
  applyDraggableNodeBehaviour(element: any, node: Node, graph: ForceDirectedGraph) {
    const d3element = d3.select(element);

    function started(e: any) {
      /** Preventing propagation of dragstart to parent elements */
      e.sourceEvent.stopPropagation();

      if (!e.active) graph.simulation.alphaTarget(0.2).restart();
      node.fx = node.x;
      node.fy = node.y;
    }

    function dragged(e: any) {
      node.fx = e.x;
      node.fy = e.y;
    }

    function ended(e: any) {
      if (!e.active) graph.simulation.alphaTarget(0);
      if (node.level === 0) {
        node.fx = node.x;
        node.fy = node.y;
      } else {
        node.fx = null;
        node.fy = null;
      }
    }

    d3element.call(d3.drag().on('start', started).on('drag', dragged).on('end', ended));
  }

  applyDraggableBehavior(element: any) {
    const drag = d3
      .drag()
      .on('start', () => {
        // Lógica al iniciar el arrastre
      })
      .on('drag', (event: any) => {
        // Lógica durante el arrastre
        d3.select(event.sourceEvent.target).attr('x', event.x).attr('y', event.y);
      })
      .on('end', () => {
        // Lógica al finalizar el arrastre
      });

    d3.select(element).call(drag);
  }

  /** The interactable graph we will simulate in this article
   * This method does not interact with the document, purely physical calculations with d3
   */
  getForceDirectedGraph(
    nodes: Node[],
    links: Link[],
    options: {
      width: number;
      height: number;
    },
    forces: { manyBody: number; collide: number },
  ) {
    return new ForceDirectedGraph(nodes, links, options, forces);
  }
}
