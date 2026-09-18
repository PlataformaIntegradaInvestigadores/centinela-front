import { Node, PopoverNode } from './node';

describe('Node', () => {
  const popover: PopoverNode = { enablePopover: false };

  it('constructs with the given fields', () => {
    const node = new Node('1', 10, 'Label', popover, 5, 'role', 2);
    expect(node.id).toBe('1');
    expect(node.totalNodes).toBe(10);
    expect(node.label).toBe('Label');
    expect(node.popover).toBe(popover);
    expect(node.weight).toBe(5);
    expect(node.rol).toBe('role');
    expect(node.level).toBe(2);
    expect(node.degree).toBe(0);
    expect(node.isSelected).toBeFalse();
    expect(node.isExpanded).toBeFalse();
  });

  describe('normal()', () => {
    it('is the sqrt of degree/totalNodes', () => {
      const node = new Node('1', 100, 'L', popover);
      node.degree = 25;
      expect(node.normal()).toBeCloseTo(0.5, 5);
    });

    it('falls back to a totalNodes of 1 to avoid dividing by zero', () => {
      const node = new Node('1', 0, 'L', popover);
      node.degree = 1;
      expect(node.normal()).toBeCloseTo(1, 5);
    });
  });

  describe('r (radius)', () => {
    it('uses the weight-scaled formula at each totalNodes tier when weight is set', () => {
      expect(new Node('1', 50, 'L', popover, 4).r).toBeCloseTo(Math.sqrt(4) * 50, 5);
      expect(new Node('1', 100, 'L', popover, 4).r).toBeCloseTo(Math.sqrt(4) * 42, 5);
      expect(new Node('1', 150, 'L', popover, 4).r).toBeCloseTo(Math.sqrt(4) * 35, 5);
      expect(new Node('1', 200, 'L', popover, 4).r).toBeCloseTo(Math.sqrt(4) * 28, 5);
    });

    it('is 0 for weighted nodes beyond the 200-node tier', () => {
      expect(new Node('1', 201, 'L', popover, 4).r).toBe(0);
    });

    it('uses the degree-normalized formula without a weight', () => {
      const node = new Node('1', 100, 'L', popover);
      node.degree = 25;
      expect(node.r).toBeCloseTo(55 * 0.5 + 65, 5);
    });

    it('falls back to 110 for an unweighted node with zero normal()', () => {
      const node = new Node('1', 100, 'L', popover);
      node.degree = 0;
      expect(node.r).toBe(110);
    });
  });

  describe('fontSize', () => {
    it('uses the weight-scaled formula at each totalNodes tier when weight is set', () => {
      expect(new Node('1', 50, 'L', popover, 4).fontSize).toBe(
        Math.max(16, Math.sqrt(4) * 14) + 'px',
      );
      expect(new Node('1', 100, 'L', popover, 4).fontSize).toBe(
        Math.max(15, Math.sqrt(4) * 11) + 'px',
      );
      expect(new Node('1', 150, 'L', popover, 4).fontSize).toBe(
        Math.max(14, Math.sqrt(4) * 9) + 'px',
      );
      expect(new Node('1', 200, 'L', popover, 4).fontSize).toBe(
        Math.max(13, Math.sqrt(4) * 7) + 'px',
      );
    });

    it('computes an unweighted size from normal(), with a minimum floor for long labels', () => {
      const node = new Node('1', 100, 'a'.repeat(25), popover);
      node.degree = 25;
      const baseSize = 16 + Math.round(node.normal() * 10);
      expect(node.fontSize).toBe(Math.max(15, baseSize - 1) + 'px');
    });

    it('does not apply the long-label penalty for short labels', () => {
      const node = new Node('1', 100, 'short', popover);
      node.degree = 25;
      const baseSize = 16 + Math.round(node.normal() * 10);
      expect(node.fontSize).toBe(baseSize + 'px');
    });
  });

  describe('color', () => {
    it('returns the expand-success color', () => {
      const node = new Node('1', 10, 'L', popover);
      node.expandStatus = 'success';
      expect(node.color).toBe('#ca8a04');
    });

    it('returns the expand-empty color', () => {
      const node = new Node('1', 10, 'L', popover);
      node.expandStatus = 'empty';
      expect(node.color).toBe('#991b1b');
    });

    it('maps each defined level to its own color', () => {
      const colors = ['#111827', '#ea580c', '#7c3aed', '#2563eb', '#059669', '#0891b2', '#db2777'];
      colors.forEach((expected, level) => {
        const node = new Node('1', 10, 'L', popover, undefined, undefined, level);
        expect(node.color).toBe(expected);
      });
    });

    it('falls back to a shared color for a level beyond the mapped range', () => {
      const node = new Node('1', 10, 'L', popover, undefined, undefined, 7);
      expect(node.color).toBe('#4f46e5');
    });

    it('falls back to a spectrum color derived from degree when there is no level', () => {
      const node = new Node('1', 10, 'L', popover);
      node.degree = 5;
      expect(node.color).toMatch(/^rgb\(/);
    });
  });
});
