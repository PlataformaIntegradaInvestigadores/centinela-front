import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChartComponent } from './bar-chart.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { VisualsService } from '../../../domain/services/visuals.service';

describe('BarChartComponent', () => {
  let component: BarChartComponent;
  let fixture: ComponentFixture<BarChartComponent>;
  let visualsServiceSpy: jasmine.SpyObj<VisualsService>;

  beforeEach(() => {
    visualsServiceSpy = jasmine.createSpyObj('VisualsService', ['createColorScheme']);
    visualsServiceSpy.createColorScheme.and.returnValue({
      name: 'custom',
      selectable: true,
      group: 'Ordinal',
      domain: ['#000'],
    } as any);

    TestBed.configureTestingModule({
      declarations: [BarChartComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: VisualsService, useValue: visualsServiceSpy }],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(BarChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('builds the color scheme and a capped copy of the data when single is set', () => {
      component.single = Array.from({ length: 25 }, (_, i) => ({ name: `n${i}`, value: i }));
      component.ngOnInit();
      expect(visualsServiceSpy.createColorScheme).toHaveBeenCalledWith(25);
      expect(component.single1.length).toBe(20);
    });

    it('does nothing when single is unset', () => {
      component.single = undefined as any;
      component.ngOnInit();
      expect(visualsServiceSpy.createColorScheme).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('rebuilds both color schemes when single changes', () => {
      component.single = Array.from({ length: 5 }, (_, i) => ({ name: `n${i}`, value: i }));
      component.ngOnChanges({
        single: { currentValue: component.single, previousValue: [], firstChange: false, isFirstChange: () => false },
      } as any);
      expect(component.colorsCharged).toBeTrue();
      expect(visualsServiceSpy.createColorScheme).toHaveBeenCalledTimes(2);
    });

    it('does nothing when single is not part of the changes', () => {
      component.ngOnChanges({} as any);
      expect(visualsServiceSpy.createColorScheme).not.toHaveBeenCalled();
    });
  });

  it('onSelect emits the item name', () => {
    const emitted: any[] = [];
    component.selectedAffiliation.subscribe((v) => emitted.push(v));
    component.onSelect({ name: 'Alpha', value: 1 });
    expect(emitted).toEqual(['Alpha']);
  });
});
