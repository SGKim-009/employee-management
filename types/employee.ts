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
  employee_number?: string;
  name: string;
  position: string;
  rank: string;
  email: string;
  phone?: string;
  company: string; // 🆕 회사
  department: string; // 부서
  team?: string; // 🆕 팀
  hire_date: string;
  resignation_date?: string;
  current_salary: number;
  salary_type?: 'annual' | 'hourly'; // 급여 타입: 연봉 또는 시급
  
  // 계약 정보
  contract_start_date?: string; // 계약 시작일
  contract_end_date?: string; // 계약 종료일
  contract_renewal_date?: string; // 계약 갱신일
  
  // 🆕 개인정보
  resident_number?: string; // 주민등록번호
  address?: string; // 주소
  birth_date?: string; // 생년월일 (YYYY-MM-DD 형식)
  
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
  manager_id?: string; // 🆕 직속 상사(상급자) ID
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
  change_year_month?: string;
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

// 근속 기간 계산 유틸리티
export function calculateTenure(hireDate: string, resignationDate?: string): string {
  const start = new Date(hireDate);
  const end = resignationDate ? new Date(resignationDate) : new Date();
  
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return `${years}년 ${months}개월`;
}