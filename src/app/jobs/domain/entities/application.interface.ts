export interface UserBasicInfo {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  username: string;
  profile_picture?: string;
}

export interface JobBasicInfo {
  id: number;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  experience_level: string;
}

export interface Application {
  id: number;
  user: string;
  job: number;
  cover_letter?: string;
  resume_file?: string;
  status: ApplicationStatus;
  status_display: string;
  notes?: string;
  applied_at: string;
  updated_at: string;
  user_info?: UserBasicInfo;
  job_info?: JobBasicInfo;
}

export interface ApplicationCreate {
  job: number;
  cover_letter?: string;
  resume_file?: File;
}

export interface ApplicationUpdate {
  status?: ApplicationStatus;
  notes?: string;
  cover_letter?: string;
  resume_file?: File;
}

export type ApplicationStatus =
  'pending' | 'reviewing' | 'interviewed' | 'accepted' | 'rejected' | 'withdrawn';

export interface ApplicationFilter {
  job_id?: number;
  status?: ApplicationStatus;
}
