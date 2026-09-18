import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeMapChartComponent } from './tree-map-chart.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { VisualsService } from '../../../domain/services/visuals.service';
import { NameValue } from '../../../interfaces/dashboard.interface';

describe('TreeMapChartComponent', () => {
  let component: TreeMapChartComponent;
  let fixture: ComponentFixture<TreeMapChartComponent>;
  let visualsSpy: jasmine.SpyObj<VisualsService>;

  const single: NameValue[] = [
    { name: 'a', value: 10 },
    { name: 'b', value: 20 },
    { name: 'c', value: 30 },
    { name: 'd', value: 40 },
    { name: 'e', value: 50 },
    { name: 'f', value: 60 },
  ];

  const fakeColor = { name: 'custom', selectable: true, group: 0, domain: [] } as any;

  beforeEach(() => {
    visualsSpy = jasmine.createSpyObj('VisualsService', ['createColorScheme']);
    visualsSpy.createColorScheme.and.returnValue(fakeColor);

    TestBed.configureTestingModule({
      declarations: [TreeMapChartComponent],
      providers: [{ provide: VisualsService, useValue: visualsSpy }],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(TreeMapChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit builds the color schemes and top-5 slice when single is set', () => {
    component.single = single;
    fixture.detectChanges();

    expect(visualsSpy.createColorScheme).toHaveBeenCalledWith(single.length);
    expect(visualsSpy.createColorScheme).toHaveBeenCalledWith(5);
    expect(component.colorsCharged).toBeTrue();
    expect(component.colorScheme).toEqual(fakeColor);
    expect(component.colorScheme1).toEqual(fakeColor);
    expect(component.single1.length).toBe(5);
  });

  it('ngOnInit leaves the scheme unbuilt when single is undefined', () => {
    component.single = undefined as any;
    fixture.detectChanges();

    expect(component.colorsCharged).toBeFalse();
    expect(component.colorScheme).toBeUndefined();
    expect(visualsSpy.createColorScheme).not.toHaveBeenCalled();
  });

  it('ngOnChanges rebuilds the schemes when single changes', () => {
    component.single = single;
    component.ngOnChanges({
      single: { currentValue: single, previousValue: undefined, firstChange: false, isFirstChange: () => false },
    } as any);

    expect(component.colorsCharged).toBeTrue();
    expect(component.single1.length).toBe(5);
    expect(visualsSpy.createColorScheme).toHaveBeenCalledTimes(2);
  });

  it('onSelect emits the selected topic name', () => {
    const emitted: any[] = [];
    component.selectedTopic.subscribe((name: any) => emitted.push(name));
    component.onSelect({ name: 'topic-x', value: 1 } as any);
    expect(emitted).toEqual(['topic-x']);
  });

  it('tmStatic reflects the clickable flag (host binding)', () => {
    component.clickable = true;
    expect(component.tmStatic).toBeFalse();
    component.clickable = false;
    expect(component.tmStatic).toBeTrue();
  });
});
