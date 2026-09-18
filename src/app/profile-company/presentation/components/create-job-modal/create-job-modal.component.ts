import { Component, EventEmitter, Output } from '@angular/core';
import { JobCreate } from 'src/app/jobs/domain/entities/job.interface';

@Component({
  selector: 'app-create-job-modal',
  templateUrl: './create-job-modal.component.html',
  styleUrls: ['./create-job-modal.component.css'],
})
export class CreateJobModalComponent {
  @Output() jobCreated = new EventEmitter<JobCreate>();
  @Output() closeModal = new EventEmitter<void>();

  jobForm = {
    title: '',
    location: '',
    type: 'full_time',
    salary: '',
    description: '',
    requirements: [''],
    benefits: [''],
    remote: false,
    applicationDeadline: '',
  };

  jobTypes = ['full_time', 'part_time', 'contract', 'internship'];

  constructor() {}

  onSubmit(): void {
    if (this.isFormValid()) {
      const newJob: JobCreate = {
        title: this.jobForm.title,
        description: this.jobForm.description,
        requirements: this.jobForm.requirements.filter((req) => req.trim() !== '').join('\n'),
        benefits: this.jobForm.benefits.filter((benefit) => benefit.trim() !== '').join('\n'),
        location: this.jobForm.location,
        job_type: this.jobForm.type,
        experience_level: 'junior', // Default value, could be added to form
        is_remote: this.jobForm.remote,
        application_deadline: this.jobForm.applicationDeadline,
        salary_min: this.jobForm.salary ? parseInt(this.jobForm.salary.split('-')[0]) : undefined,
        salary_max: this.jobForm.salary
          ? parseInt(this.jobForm.salary.split('-')[1] || this.jobForm.salary.split('-')[0])
          : undefined,
      };

      this.jobCreated.emit(newJob);
      this.resetForm();
    }
  }

  onClose(): void {
    this.closeModal.emit();
    this.resetForm();
  }

  addRequirement(): void {
    this.jobForm.requirements.push('');
  }

  removeRequirement(index: number): void {
    if (this.jobForm.requirements.length > 1) {
      this.jobForm.requirements.splice(index, 1);
    }
  }

  addBenefit(): void {
    this.jobForm.benefits.push('');
  }

  removeBenefit(index: number): void {
    if (this.jobForm.benefits.length > 1) {
      this.jobForm.benefits.splice(index, 1);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  isFormValid(): boolean {
    return !!(
      this.jobForm.title.trim() &&
      this.jobForm.location.trim() &&
      this.jobForm.salary.trim() &&
      this.jobForm.description.trim() &&
      this.jobForm.applicationDeadline &&
      this.jobForm.requirements.some((req) => req.trim() !== '') &&
      this.jobForm.benefits.some((benefit) => benefit.trim() !== '')
    );
  }

  private resetForm(): void {
    this.jobForm = {
      title: '',
      location: '',
      type: 'full_time',
      salary: '',
      description: '',
      requirements: [''],
      benefits: [''],
      remote: false,
      applicationDeadline: '',
    };
  }
}
