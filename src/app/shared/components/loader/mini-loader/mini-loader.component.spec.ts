import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MiniLoaderComponent } from './mini-loader.component';

describe('MiniLoaderComponent', () => {
  let fixture: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MiniLoaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(MiniLoaderComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('defaults size and color', () => {
    expect(fixture.componentInstance.size).toBe('5');
    expect(fixture.componentInstance.color).toBe('text-red-700');
  });

  it('accepts custom size/color inputs', () => {
    fixture.componentInstance.size = '10';
    fixture.componentInstance.color = 'text-blue-500';
    expect(fixture.componentInstance.size).toBe('10');
    expect(fixture.componentInstance.color).toBe('text-blue-500');
  });
});
