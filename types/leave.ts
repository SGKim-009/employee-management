// 휴가 유형 타입
export interface LeaveType {
  id: string;
  name: string;
  code: string;
  is_paid: boolean;
  max_days_per_year?: number;
  requires_approval: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// 휴가 신청 타입
export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approver_id?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
  // 조인된 데이터
  employee?: {
    id: string;
    name: string;
    department: string;
    position: string;
  };
  leave_type?: LeaveType;
  approver?: {
    id: string;
    email: string;
  };
}

// 휴가 잔여일 타입
export interface EmployeeLeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  created_at?: string;
  updated_at?: string;
  // 조인된 데이터
  leave_type?: LeaveType;
}

// 휴가 신청 폼 데이터 타입
export interface LeaveRequestFormData {
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

// 연차 계산 결과 타입
export interface AnnualLeaveCalculation {
  employee_id: string;
  year: number;
  total_annual_leave: number; // 총 연차 일수
  used_annual_leave: number; // 사용한 연차 일수
  remaining_annual_leave: number; // 잔여 연차 일수
  calculation_date: string; // 계산 기준일
}


