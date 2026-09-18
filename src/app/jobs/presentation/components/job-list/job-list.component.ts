import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Job } from 'src/app/jobs/domain/entities/job.interface';

@Component({
  selector: 'app-job-list',
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css'],
})
export class JobListComponent {
  @Input() jobs: Job[] = [];
  @Input() selectedJob: Job | null = null;
  @Input() loading = false;
  @Input() title = 'Trabajos Disponibles';
  @Output() jobSelected = new EventEmitter<Job>();

  onJobSelect(job: Job): void {
    this.jobSelected.emit(job);
  }

  isJobSelected(job: Job): boolean {
    return this.selectedJob?.id === job.id;
  }

  trackByJobId(index: number, job: Job): number {
    return job.id;
  }

  /**
   * Get CSS classes for job type badge
   */
  getJobTypeClasses(jobType: string): string {
    switch (jobType) {
      case 'full_time':
        return 'bg-green-100 text-green-800';
      case 'part_time':
        return 'bg-blue-100 text-blue-800';
      case 'contract':
        return 'bg-purple-100 text-purple-800';
      case 'internship':
        return 'bg-yellow-100 text-yellow-800';
      case 'freelance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get formatted salary for display
   */
  getFormattedSalary(job: Job): string {
    if (job.salary_min && job.salary_max) {
      return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
    } else if (job.salary_min) {
      return `Desde $${job.salary_min.toLocaleString()}`;
    } else if (job.salary_max) {
      return `Hasta $${job.salary_max.toLocaleString()}`;
    }
    return 'Salario a convenir';
  }
}
