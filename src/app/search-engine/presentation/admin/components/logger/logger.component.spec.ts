import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { LoggerComponent } from './logger.component';
import { LogService } from 'src/app/search-engine/domain/services/logger.service';

describe('LoggerComponent', () => {
  let component: LoggerComponent;
  let logServiceSpy: jasmine.SpyObj<LogService>;

  beforeEach(() => {
    logServiceSpy = jasmine.createSpyObj('LogService', ['getLogs']);
    logServiceSpy.getLogs.and.returnValue(of({ logs: [], total_lines: 0 }));

    TestBed.configureTestingModule({
      declarations: [LoggerComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: LogService, useValue: logServiceSpy }],
    });
    component = TestBed.createComponent(LoggerComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit fetches the first page of logs', () => {
    component.ngOnInit();
    expect(logServiceSpy.getLogs).toHaveBeenCalledWith(1, 10, '', '', '', '');
  });

  describe('fetchLogs', () => {
    it('populates logs, totalLogs and computes totalPages', () => {
      logServiceSpy.getLogs.and.returnValue(
        of({ logs: ['a', 'b'], total_lines: 25 }),
      );
      component.linesPerPage = 10;
      component.fetchLogs();
      expect(component.logs).toEqual(['a', 'b']);
      expect(component.totalLogs).toBe(25);
      expect(component.totalPages).toBe(3);
    });

    it('logs the error and does not throw on failure', () => {
      spyOn(console, 'log');
      logServiceSpy.getLogs.and.returnValue(throwError(() => new Error('boom')));
      expect(() => component.fetchLogs()).not.toThrow();
    });
  });

  describe('prevPage', () => {
    it('decrements and refetches when not on the first page', () => {
      component.currentPage = 2;
      spyOn(component, 'fetchLogs');
      component.prevPage();
      expect(component.currentPage).toBe(1);
      expect(component.fetchLogs).toHaveBeenCalled();
    });

    it('does nothing on the first page', () => {
      component.currentPage = 1;
      spyOn(component, 'fetchLogs');
      component.prevPage();
      expect(component.currentPage).toBe(1);
      expect(component.fetchLogs).not.toHaveBeenCalled();
    });
  });

  describe('nextPage', () => {
    it('increments and refetches when below totalPages', () => {
      component.currentPage = 1;
      component.totalPages = 3;
      spyOn(component, 'fetchLogs');
      component.nextPage();
      expect(component.currentPage).toBe(2);
      expect(component.fetchLogs).toHaveBeenCalled();
    });

    it('does nothing on the last page', () => {
      component.currentPage = 3;
      component.totalPages = 3;
      spyOn(component, 'fetchLogs');
      component.nextPage();
      expect(component.currentPage).toBe(3);
      expect(component.fetchLogs).not.toHaveBeenCalled();
    });
  });
});
