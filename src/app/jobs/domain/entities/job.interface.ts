export interface CompanyInfo {
  id: string;
  company_name: string;
  logo?: string;
  industry: string;
  website?: string;
  address?: string;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  requirements?: string;
  benefits?: string;
  location?: string;
  job_type: string;
  job_type_display: string;
  experience_level: string;
  experience_display: string;
  salary_min?: number;
  salary_max?: number;
  is_remote: boolean;
  application_deadline?: string;
  created_at: string;
  updated_at: string;
  company: string; // ID de la empresa
  company_info: CompanyInfo;
  applications_count: number;
  has_applied?: boolean; // Indica si el usuario actual ya postuló
  user_application?: UserApplication; // Información de la postulación del usuario si existe
  recent_applications?: RecentApplication[]; // Postulaciones recientes para empresas
}

export interface UserApplication {
  id: number;
  status: string;
  status_display: string;
  applied_at: string;
}

export interface RecentApplication {
  id: number;
  status: string;
  status_display: string;
  applied_at: string;
  cover_letter?: string; // Agregar esta propiedad
  resume_file?: string; // Agregar esta propiedad
  notes?: string; // Agregar esta propiedad (opcional)
  user_info: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    username: string;
    profile_picture?: string;
  };
}

export interface JobCreate {
  title: string;
  description: string;
  requirements?: string;
  benefits?: string;
  location?: string;
  job_type: string;
  experience_level: string;
  salary_min?: number;
  salary_max?: number;
  is_remote?: boolean;
  application_deadline?: string;
}

export interface JobFilter {
  q?: string; // búsqueda general
  location?: string;
  type?: string; // job_type
  experience?: string; // experience_level
  remote?: boolean;
}
