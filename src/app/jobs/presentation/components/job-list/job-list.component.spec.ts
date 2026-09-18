import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { JobListComponent } from './job-list.component';

describe('JobListComponent', () => {
  let component: JobListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [JobListComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    component = TestBed.createComponent(JobListComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onJobSelect emits the selected job', () => {
    let emitted: any = null;
    component.jobSelected.subscribe((j: any) => (emitted = j));
    const job = { id: 1 } as any;
    component.onJobSelect(job);
    expect(emitted).toBe(job);
  });

  describe('isJobSelected', () => {
    it('returns true when ids match', () => {
      component.selectedJob = { id: 5 } as any;
      expect(component.isJobSelected({ id: 5 } as any)).toBeTrue();
    });

    it('returns false when ids differ or nothing is selected', () => {
      component.selectedJob = { id: 5 } as any;
      expect(component.isJobSelected({ id: 6 } as any)).toBeFalse();
      component.selectedJob = null;
      expect(component.isJobSelected({ id: 5 } as any)).toBeFalse();
    });
  });

  it('trackByJobId returns the job id', () => {
    expect(component.trackByJobId(0, { id: 9 } as any)).toBe(9);
  });

  describe('getJobTypeClasses', () => {
    it('maps every known job type to its badge classes', () => {
      expect(component.getJobTypeClasses('full_time')).toBe('bg-green-100 text-green-800');
      expect(component.getJobTypeClasses('part_time')).toBe('bg-blue-100 text-blue-800');
      expect(component.getJobTypeClasses('contract')).toBe('bg-purple-100 text-purple-800');
      expect(component.getJobTypeClasses('internship')).toBe('bg-yellow-100 text-yellow-800');
      expect(component.getJobTypeClasses('freelance')).toBe('bg-orange-100 text-orange-800');
    });

    it('falls back to gray for an unknown type', () => {
      expect(component.getJobTypeClasses('unknown')).toBe('bg-gray-100 text-gray-800');
    });
  });

  describe('getFormattedSalary', () => {
    it('formats a min-max range', () => {
      expect(
        component.getFormattedSalary({ salary_min: 1000, salary_max: 2000 } as any),
      ).toBe('$1,000 - $2,000');
    });

    it('formats a min-only salary', () => {
      expect(component.getFormattedSalary({ salary_min: 1000 } as any)).toBe('Desde $1,000');
    });

    it('formats a max-only salary', () => {
      expect(component.getFormattedSalary({ salary_max: 2000 } as any)).toBe('Hasta $2,000');
    });

    it('falls back when neither is set', () => {
      expect(component.getFormattedSalary({} as any)).toBe('Salario a convenir');
    });
  });
});
