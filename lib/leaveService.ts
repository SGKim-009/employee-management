import { supabase } from './supabaseClient';
import { LeaveRequest, LeaveType, EmployeeLeaveBalance, LeaveRequestFormData, AnnualLeaveCalculation } from '@/types/leave';

export const leaveService = {
  // 휴가 유형 목록 조회
  async getLeaveTypes(): Promise<LeaveType[]> {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 휴가 신청 생성
  async createLeaveRequest(formData: LeaveRequestFormData): Promise<LeaveRequest> {
    // 휴가 일수 계산
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const days = calculateLeaveDays(startDate, endDate);

    const { data, error } = await supabase
      .from('leave_requests')
      .insert([{
        employee_id: formData.employee_id,
        leave_type_id: formData.leave_type_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        days: days,
        reason: formData.reason,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return await this.getLeaveRequestById(data.id);
  },

  // 휴가 신청 조회 (ID로)
  async getLeaveRequestById(id: string): Promise<LeaveRequest> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        employee:employees(id, name, department, position),
        leave_type:leave_types(*),
        approver:auth.users(id, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as LeaveRequest;
  },

  // 직원별 휴가 신청 목록 조회
  async getLeaveRequestsByEmployee(employeeId: string, year?: number): Promise<LeaveRequest[]> {
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        leave_type:leave_types(*),
        approver:auth.users(id, email)
      `)
      .eq('employee_id', employeeId)
      .order('start_date', { ascending: false });

    if (year) {
      query = query.gte('start_date', `${year}-01-01`)
                   .lte('start_date', `${year}-12-31`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // 승인 대기 중인 휴가 신청 목록 조회
  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        employee:employees(id, name, department, position),
        leave_type:leave_types(*),
        approver:auth.users(id, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 휴가 신청 승인
  async approveLeaveRequest(id: string, approverId: string): Promise<LeaveRequest> {
    const request = await this.getLeaveRequestById(id);
    
    // 휴가 잔여일 업데이트
    await this.updateLeaveBalance(
      request.employee_id,
      request.leave_type_id,
      new Date(request.start_date).getFullYear(),
      request.days
    );

    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        approver_id: approverId,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return await this.getLeaveRequestById(id);
  },

  // 휴가 신청 거절
  async rejectLeaveRequest(id: string, approverId: string, rejectionReason: string): Promise<LeaveRequest> {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        approver_id: approverId,
        rejection_reason: rejectionReason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return await this.getLeaveRequestById(id);
  },

  // 휴가 신청 취소
  async cancelLeaveRequest(id: string): Promise<LeaveRequest> {
    const request = await this.getLeaveRequestById(id);
    
    // 이미 승인된 경우 잔여일 복구
    if (request.status === 'approved') {
      await this.updateLeaveBalance(
        request.employee_id,
        request.leave_type_id,
        new Date(request.start_date).getFullYear(),
        -request.days
      );
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return await this.getLeaveRequestById(id);
  },

  // 휴가 잔여일 조회
  async getLeaveBalance(employeeId: string, leaveTypeId: string, year: number): Promise<EmployeeLeaveBalance | null> {
    const { data, error } = await supabase
      .from('employee_leave_balances')
      .select(`
        *,
        leave_type:leave_types(*)
      `)
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .eq('year', year)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data || null;
  },

  // 직원의 모든 휴가 잔여일 조회
  async getLeaveBalancesByEmployee(employeeId: string, year: number): Promise<EmployeeLeaveBalance[]> {
    const { data, error } = await supabase
      .from('employee_leave_balances')
      .select(`
        *,
        leave_type:leave_types(*)
      `)
      .eq('employee_id', employeeId)
      .eq('year', year);

    if (error) throw error;
    return data || [];
  },

  // 휴가 잔여일 업데이트 (내부 함수)
  async updateLeaveBalance(
    employeeId: string,
    leaveTypeId: string,
    year: number,
    daysToAdd: number
  ): Promise<void> {
    const existing = await this.getLeaveBalance(employeeId, leaveTypeId, year);
    
    if (existing) {
      // 기존 잔여일 업데이트
      const { error } = await supabase
        .from('employee_leave_balances')
        .update({
          used_days: existing.used_days + daysToAdd
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // 새 잔여일 생성 (연차의 경우 기본값 설정)
      const leaveType = await supabase
        .from('leave_types')
        .select('*')
        .eq('id', leaveTypeId)
        .single();

      if (leaveType.error) throw leaveType.error;

      const totalDays = leaveType.data.code === 'annual' 
        ? await this.calculateAnnualLeave(employeeId, year)
        : 0;

      const { error } = await supabase
        .from('employee_leave_balances')
        .insert([{
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          year: year,
          total_days: totalDays,
          used_days: Math.max(0, daysToAdd)
        }]);

      if (error) throw error;
    }
  },

  // 연차 계산
  async calculateAnnualLeave(employeeId: string, year: number): Promise<number> {
    // 직원 정보 조회
    const { data: employee, error } = await supabase
      .from('employees')
      .select('hire_date')
      .eq('id', employeeId)
      .single();

    if (error) throw error;

    const hireDate = new Date(employee.hire_date);
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    // 입사일이 해당 연도보다 이전인 경우
    if (hireDate < yearStart) {
      // 1년 이상 근무 시 15일, 이후 1년마다 1일 추가 (최대 25일)
      const yearsOfWork = year - hireDate.getFullYear();
      return Math.min(15 + Math.max(0, yearsOfWork - 1), 25);
    } else {
      // 입사일이 해당 연도인 경우, 입사일부터 연말까지의 비율로 계산
      const daysInYear = Math.ceil((yearEnd.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalDaysInYear = 365;
      return Math.floor((15 * daysInYear) / totalDaysInYear);
    }
  },

  // 연차 계산 결과 조회
  async getAnnualLeaveCalculation(employeeId: string, year: number): Promise<AnnualLeaveCalculation> {
    const totalAnnualLeave = await this.calculateAnnualLeave(employeeId, year);
    
    // 'annual' 코드를 가진 휴가 유형 찾기
    const { data: annualLeaveType, error: typeError } = await supabase
      .from('leave_types')
      .select('id')
      .eq('code', 'annual')
      .single();

    if (typeError) throw typeError;

    const balance = await this.getLeaveBalance(employeeId, annualLeaveType.id, year);
    const usedDays = balance?.used_days || 0;
    const remainingDays = totalAnnualLeave - usedDays;

    return {
      employee_id: employeeId,
      year: year,
      total_annual_leave: totalAnnualLeave,
      used_annual_leave: usedDays,
      remaining_annual_leave: remainingDays,
      calculation_date: new Date().toISOString()
    };
  }
};

// 휴가 일수 계산 헬퍼 함수
function calculateLeaveDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 시간을 0으로 설정하여 날짜만 비교
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 시작일과 종료일 포함
  
  return diffDays;
}

