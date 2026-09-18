import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, EventEmitter } from '@angular/core';
import { GraphComponent } from './graph.component';
import { D3Service } from '../../../d3';

describe('GraphComponent', () => {
  let component: GraphComponent;
  let d3ServiceSpy: jasmine.SpyObj<D3Service>;
  let fakeGraph: { ticker: EventEmitter<any>; initSimulation: jasmine.Spy };

  beforeEach(() => {
    fakeGraph = { ticker: new EventEmitter(), initSimulation: jasmine.createSpy('initSimulation') };
    d3ServiceSpy = jasmine.createSpyObj('D3Service', ['getForceDirectedGraph']);
    d3ServiceSpy.getForceDirectedGraph.and.returnValue(fakeGraph as any);

    TestBed.configureTestingModule({
      declarations: [GraphComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: D3Service, useValue: d3ServiceSpy }],
    });
    component = TestBed.createComponent(GraphComponent).componentInstance;
    component.nodes = [];
    component.links = [];
    component.forces = { manyBody: 1, collide: 50 };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('builds the graph via D3Service and subscribes to the ticker', () => {
      component.ngOnInit();
      expect(d3ServiceSpy.getForceDirectedGraph).toHaveBeenCalledWith(
        component.nodes,
        component.links,
        jasmine.any(Object),
        component.forces,
      );
      expect(component.graph).toBe(fakeGraph as any);
    });

    it('calls markForCheck when the ticker emits', () => {
      component.ngOnInit();
      const markSpy = spyOn((component as any).ref, 'markForCheck');
      fakeGraph.ticker.emit();
      expect(markSpy).toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit', () => {
    it('initializes the simulation with the current options', () => {
      component.ngOnInit();
      component.ngAfterViewInit();
      expect(fakeGraph.initSimulation).toHaveBeenCalledWith(jasmine.objectContaining({ height: 600 }));
    });
  });

  describe('onResize', () => {
    it('re-initializes the simulation', () => {
      component.ngOnInit();
      component.onResize();
      expect(fakeGraph.initSimulation).toHaveBeenCalled();
    });
  });

  it('refreshView calls markForCheck', () => {
    const markSpy = spyOn((component as any).ref, 'markForCheck');
    component.refreshView();
    expect(markSpy).toHaveBeenCalled();
  });

  describe('options', () => {
    it('uses 0.7x width on wide viewports', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(1200);
      expect(component.options.width).toBe(1200 * 0.7);
      expect(component.options.height).toBe(600);
    });

    it('uses 0.8x width on narrow viewports', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(500);
      expect(component.options.width).toBe(500 * 0.8);
    });
  });
});
