// 급여 명세서 타입
export interface PayrollStatement {
  id: string;
  employee_id: string;
  year: number;
  month: number;
  base_salary: number;
  overtime_pay: number;
  bonus: number;
  allowances: number;
  total_income: number;
  income_tax: number;
  local_tax: number;
  national_pension: number;
  health_insurance: number;
  employment_insurance: number;
  long_term_care: number;
  total_deduction: number;
  net_pay: number;
  payment_date?: string;
  payment_status: 'pending' | 'paid' | 'cancelled';
  payment_method?: string;
  bank_account?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  // 조인된 데이터
  employee?: {
    id: string;
    name: string;
    department: string;
    position: string;
    employee_number: string;
  };
}

// 급여 이체 내역 타입
export interface PayrollTransfer {
  id: string;
  payroll_statement_id: string;
  employee_id: string;
  transfer_date: string;
  transfer_amount: number;
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
  transfer_reference?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  failure_reason?: string;
  created_at?: string;
  updated_at?: string;
  // 조인된 데이터
  payroll_statement?: PayrollStatement;
  employee?: {
    id: string;
    name: string;
  };
}

// 급여 계산 입력 데이터 타입
export interface PayrollCalculationInput {
  employee_id: string;
  year: number;
  month: number;
  base_salary: number;
  overtime_pay?: number;
  bonus?: number;
  allowances?: number;
  payment_date?: string;
  notes?: string;
}

// 세금 계산 결과 타입
export interface TaxCalculation {
  income_tax: number; // 소득세
  local_tax: number; // 지방소득세
  national_pension: number; // 국민연금
  health_insurance: number; // 건강보험
  employment_insurance: number; // 고용보험
  long_term_care: number; // 장기요양보험
  total_deduction: number; // 총 공제액
}

// 급여 명세서 요약 타입
export interface PayrollSummary {
  employee_id: string;
  employee_name: string;
  year: number;
  total_statements: number;
  total_income: number;
  total_deduction: number;
  total_net_pay: number;
  average_net_pay: number;
}



