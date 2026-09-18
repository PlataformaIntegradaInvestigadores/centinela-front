import { Node } from './';

export class Link implements d3.SimulationLinkDatum<Node> {
  // optional - defining optional implementation properties - required for relevant typing assistance
  index?: number;

  // must - defining enforced implementation properties
  source: Node;
  target: Node;

  strokeWidth: number;

  constructor(source: Node | string | number, target: Node | string | number, strokeWidth: number) {
    // @ts-expect-error source may be a string/number id before d3 resolves it to a Node instance
    this.source = source;

    // @ts-expect-error target may be a string/number id before d3 resolves it to a Node instance
    this.target = target;
    this.strokeWidth = strokeWidth;
  }
}
