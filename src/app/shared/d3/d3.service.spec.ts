import { D3Service } from './d3.service';
import { ForceDirectedGraph, Node, Link } from './models';

describe('D3Service', () => {
  let service: D3Service;

  beforeEach(() => {
    service = new D3Service();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('applyZoomableBehaviour', () => {
    it('attaches zoom behaviour and exposes __zoomBehavior', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '800');
      svg.setAttribute('height', '600');
      const container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      expect(() => service.applyZoomableBehaviour(svg as any, container)).not.toThrow();
      expect((svg as any).__zoomBehavior).toBeTruthy();
    });
  });

  describe('applyDraggableNodeBehaviour', () => {
    it('attaches drag behaviour to a node without throwing', () => {
      const popover = { enablePopover: false };
      const node = new Node('1', 10, 'A', popover);
      const graph = new ForceDirectedGraph(
        [node],
        [],
        { width: 800, height: 600 },
        { manyBody: -150, collide: 1 },
      );
      const element = document.createElement('div');
      expect(() =>
        service.applyDraggableNodeBehaviour(element, node, graph),
      ).not.toThrow();
    });
  });

  describe('applyDraggableBehavior', () => {
    it('attaches drag behaviour to an element without throwing', () => {
      const element = document.createElement('div');
      expect(() => service.applyDraggableBehavior(element)).not.toThrow();
    });
  });

  describe('getForceDirectedGraph', () => {
    it('returns a ForceDirectedGraph instance built from the arguments', () => {
      const popover = { enablePopover: false };
      const nodes = [new Node('1', 10, 'A', popover)];
      const links: Link[] = [];
      const graph = service.getForceDirectedGraph(
        nodes,
        links,
        { width: 800, height: 600 },
        { manyBody: -150, collide: 1 },
      );
      expect(graph instanceof ForceDirectedGraph).toBeTrue();
      expect(graph.nodes).toBe(nodes);
      expect(graph.links).toBe(links);
    });
  });
});
