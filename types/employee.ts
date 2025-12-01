// 자격증 타입
export interface Certification {
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  certification_number?: string;
}

// 경력 타입
export interface Career {
  company: string;
  position: string;
  department?: string;
  start_date: string;
  end_date: string;
  description?: string;
}

// 직원 타입
export interface Employee {
  id: string;
  name: string;
  position: string;
  rank: string;
  email: string;
  phone?: string;
  department: string;
  hire_date: string;
  current_salary: number;
  
  // 학력
  education_level?: string;
  education_school?: string;
  education_major?: string;
  education_graduation_year?: number;
  
  // 자격증 및 경력
  certifications?: Certification[];
  career_history?: Career[];
  
  // 프로필 이미지
  profile_image_url?: string;
  
  // 메타
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// 급여 변동 이력
export interface SalaryHistory {
  id: string;
  employee_id: string;
  previous_salary: number;
  new_salary: number;
  change_date: string;
  change_reason?: string;
  created_at: string;
}

// 인사 변동 이력
export interface PositionHistory {
  id: string;
  employee_id: string;
  previous_position?: string;
  new_position: string;
  previous_rank?: string;
  new_rank: string;
  previous_department?: string;
  new_department: string;
  change_date: string;
  change_reason?: string;
  created_at: string;
}

export type NewEmployee = Omit<Employee, 'id' | 'created_at' | 'updated_at'>;