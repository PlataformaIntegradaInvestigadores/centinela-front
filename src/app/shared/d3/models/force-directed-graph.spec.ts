import { ForceDirectedGraph } from './force-directed-graph';
import { Node, Link } from './';

describe('ForceDirectedGraph', () => {
  const popover = { enablePopover: false };
  const makeNodes = () => [
    new Node('1', 10, 'A', popover, 5, 'role', 0),
    new Node('2', 10, 'B', popover),
  ];
  const makeLinks = (nodes: Node[]) => [new Link(nodes[0], nodes[1], 2)];

  const options = { width: 800, height: 600 };
  const forces = { manyBody: -150, collide: 1 };

  it('initializes nodes, links, forces and a simulation', () => {
    const nodes = makeNodes();
    const links = makeLinks(nodes);
    const graph = new ForceDirectedGraph(nodes, links, options, forces);
    expect(graph.nodes).toBe(nodes);
    expect(graph.links).toBe(links);
    expect(graph.forces).toBe(forces);
    expect(graph.simulation).toBeTruthy();
  });

  it('pins level-0 nodes to the center', () => {
    const nodes = makeNodes();
    const links = makeLinks(nodes);
    const graph = new ForceDirectedGraph(nodes, links, options, forces);
    expect(nodes[0].fx).toBe(400);
    expect(nodes[0].fy).toBe(300);
  });

  it('throws when options are missing width/height', () => {
    const nodes = makeNodes();
    const links = makeLinks(nodes);
    expect(
      () => new ForceDirectedGraph(nodes, links, { width: 0, height: 600 } as any, forces),
    ).toThrowError(/missing options/);
    expect(
      () => new ForceDirectedGraph(nodes, links, undefined as any, forces),
    ).toThrowError(/missing options/);
  });

  it('initNodes throws when simulation is not initialized', () => {
    const nodes = makeNodes();
    const links = makeLinks(nodes);
    const graph = new ForceDirectedGraph(nodes, links, options, forces);
    graph.simulation = undefined as any;
    expect(() => graph.initNodes()).toThrowError(/simulation was not initialized yet/);
  });

  it('initLinks throws when simulation is not initialized', () => {
    const nodes = makeNodes();
    const links = makeLinks(nodes);
    const graph = new ForceDirectedGraph(nodes, links, options, forces);
    graph.simulation = undefined as any;
    expect(() => graph.initLinks()).toThrowError(/simulation was not initialized yet/);
  });

  it('initNodes and initLinks run without throwing on a live simulation', () => {
    const nodes = makeNodes();
    const links = makeLinks(nodes);
    const graph = new ForceDirectedGraph(nodes, links, options, forces);
    expect(() => graph.initNodes()).not.toThrow();
    expect(() => graph.initLinks()).not.toThrow();
  });

  it('emits on the ticker when the simulation ticks', () => {
    const nodes = makeNodes();
    const links = makeLinks(nodes);
    const graph = new ForceDirectedGraph(nodes, links, options, forces);
    let emitted: any;
    graph.ticker.subscribe((s) => (emitted = s));
    const tickFn = graph.simulation.on('tick') as ((this: any) => void) | undefined;
    expect(tickFn).toBeDefined();
    expect(typeof tickFn).toBe('function');
    tickFn!.call(graph.simulation);
    expect(emitted).toBe(graph.simulation);
  });

  it('reinitializes the center force when called again with new options', () => {
    const nodes = makeNodes();
    const links = makeLinks(nodes);
    const graph = new ForceDirectedGraph(nodes, links, options, forces);
    expect(() => graph.initSimulation({ width: 1000, height: 800 })).not.toThrow();
  });
});
