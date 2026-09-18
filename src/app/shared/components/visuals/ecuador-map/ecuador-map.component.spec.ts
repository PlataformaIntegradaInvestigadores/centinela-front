import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EcuadorMapComponent } from './ecuador-map.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('EcuadorMapComponent', () => {
  let component: EcuadorMapComponent;
  let fixture: ComponentFixture<EcuadorMapComponent>;
  let jsonSpy: jasmine.Spy;
  let figure: HTMLElement;

  const geoData = {
    features: [
      { properties: { dpa_despro: 'Pichincha' } },
      { properties: { dpa_despro: 'Azulfina' } },
    ],
  };
  const articlesData = [
    { province_name: 'Pichincha', total_articles: 120 },
    { province_name: 'Azulfina', total_articles: 40 },
  ];

  // d3.json's fetch() call is not tracked by NgZone as a pending task, so a
  // single whenStable() can resolve before a *chained* fetch (the one inside
  // updateMap's .then()) has actually settled. Flushing an extra macrotask
  // turn lets that second promise chain complete before we assert on it.
  async function flush(): Promise<void> {
    for (let i = 0; i < 3; i++) {
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  beforeEach(() => {
    jsonSpy = spyOn(window, 'fetch').and.callFake(((input: unknown) => {
      const url = String(input);
      const body = url.includes('ecuador.geojson') ? geoData : articlesData;
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }) as any);

    figure = document.createElement('figure');
    figure.id = 'map';
    figure.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    document.body.appendChild(figure);

    TestBed.configureTestingModule({
      declarations: [EcuadorMapComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(EcuadorMapComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    figure.remove();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit loads the geojson and draws the map when a response is set', async () => {
    component.response = 'assets/data/articles.json';
    component.width = 500;
    fixture.detectChanges();
    await flush();

    expect((component as any).geoJson).toEqual(geoData);
    const paths = figure.querySelectorAll('path');
    expect(paths.length).toBe(geoData.features.length);
  });

  it('ngOnInit does not draw when no response is provided', async () => {
    fixture.detectChanges();
    await flush();
    expect((component as any).geoJson).toEqual(geoData);
    expect(figure.querySelectorAll('path').length).toBe(0);
  });

  it('ngOnChanges updates the map on a non-first response change', async () => {
    fixture.detectChanges();
    await flush();
    (component as any).geoJson = geoData;
    component.response = 'assets/data/articles.json';
    component.ngOnChanges({
      response: { currentValue: 'x', previousValue: '', firstChange: false, isFirstChange: () => false },
    } as any);
    await flush();
    expect(figure.querySelectorAll('path').length).toBe(geoData.features.length);
  });

  it('ngOnChanges updates the map when width changes', async () => {
    fixture.detectChanges();
    await flush();
    (component as any).geoJson = geoData;
    component.response = 'assets/data/articles.json';
    component.ngOnChanges({
      width: { currentValue: 600, previousValue: 380, firstChange: false, isFirstChange: () => false },
    } as any);
    await flush();
    expect(figure.querySelectorAll('path').length).toBe(geoData.features.length);
  });

  it('ngOnChanges does nothing on the first change', () => {
    (component as any).geoJson = geoData;
    component.response = 'assets/data/articles.json';
    component.ngOnChanges({
      response: { currentValue: 'x', previousValue: '', firstChange: true, isFirstChange: () => true },
    } as any);
    expect(jsonSpy).toHaveBeenCalledTimes(0);
  });

  it('drawMap mouseover/mouseout handlers run without error', async () => {
    component.response = 'assets/data/articles.json';
    fixture.detectChanges();
    await flush();

    const path = figure.querySelector('path') as SVGPathElement;
    expect(path).toBeTruthy();
    path.dispatchEvent(new MouseEvent('mouseover'));
    path.dispatchEvent(new MouseEvent('mouseout'));
    expect(true).toBeTrue();
  });

  it('updateMap is a no-op when the geojson is not loaded yet', async () => {
    component.response = 'assets/data/articles.json';
    (component as any).geoJson = undefined;
    component.ngOnChanges({
      response: { currentValue: 'x', previousValue: '', firstChange: false, isFirstChange: () => false },
    } as any);
    await flush();
    expect(figure.querySelectorAll('path').length).toBe(0);
  });
});
