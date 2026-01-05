import { z } from 'zod';

// 자격증 스키마
export const certificationSchema = z.object({
  name: z.string().min(1, '자격증명을 입력하세요'),
  issuer: z.string().min(1, '발급기관을 입력하세요'),
  issue_date: z.string().min(1, '발급일을 입력하세요'),
  expiry_date: z.string().optional(),
  certification_number: z.string().optional(),
});

// 경력 스키마
export const careerSchema = z.object({
  company: z.string().min(1, '회사명을 입력하세요'),
  position: z.string().min(1, '직책을 입력하세요'),
  department: z.string().optional(),
  start_date: z.string().min(1, '시작일을 입력하세요'),
  end_date: z.string().min(1, '종료일을 입력하세요'),
  description: z.string().optional(),
});

// 직원 스키마
export const employeeSchema = z.object({
  employee_number: z.string().optional(),
  name: z.string().min(1, '이름을 입력하세요').max(50, '이름은 50자 이하여야 합니다'),
  position: z.string().min(1, '직책을 입력하세요'),
  rank: z.string().min(1, '직급을 선택하세요'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  phone: z.string().optional(),
  company: z.string().min(1, '회사를 입력하세요'),
  department: z.string().min(1, '부서를 입력하세요'),
  team: z.string().optional(),
  hire_date: z.string().min(1, '입사일을 입력하세요'),
  resignation_date: z.string().optional(),
  current_salary: z.number().min(0, '급여는 0 이상이어야 합니다'),
  salary_type: z.enum(['annual', 'hourly']).optional().default('annual'),
  contract_start_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  contract_renewal_date: z.string().optional(),
  resident_number: z.string().optional(),
  address: z.string().optional(),
  birth_date: z.string().optional(),
  education_level: z.string().optional(),
  education_school: z.string().optional(),
  education_major: z.string().optional(),
  education_graduation_year: z.number().optional(),
  certifications: z.array(certificationSchema).default([]),
  career_history: z.array(careerSchema).default([]),
  profile_image_url: z.string().optional(),
  status: z.enum(['active', 'inactive', 'resigned']).default('active'),
  notes: z.string().optional().default(''),
  manager_id: z.string().optional(),
}).refine((data) => {
  // 퇴사 상태일 때 퇴사일 필수
  if (data.status === 'resigned' && !data.resignation_date) {
    return false;
  }
  return true;
}, {
  message: '퇴사일을 입력하세요',
  path: ['resignation_date'],
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

