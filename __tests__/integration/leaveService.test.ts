/**
 * 통합 테스트: leaveService
 * 
 * 주의: 실제 Supabase 연결이 필요한 테스트입니다.
 * 환경 변수가 설정되어 있어야 합니다.
 */

import { leaveService } from '@/lib/leaveService';
import { LeaveRequestFormData } from '@/types/leave';
import { employeeService } from '@/lib/supabaseClient';

const shouldRunIntegrationTests = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

describe('Integration: leaveService', () => {
  let testEmployeeId: string;
  let testLeaveTypeId: string;
  let testLeaveRequestId: string;
  const testYear = new Date().getFullYear();

  beforeAll(async () => {
    if (!shouldRunIntegrationTests()) {
      console.warn('통합 테스트를 건너뜁니다. 환경 변수가 설정되지 않았습니다.');
      return;
    }

    // 테스트용 직원 조회
    try {
      const employees = await employeeService.getAll(1, 1);
      if (employees.data.length > 0) {
        testEmployeeId = employees.data[0].id;
      }
    } catch (error) {
      console.warn('테스트용 직원을 찾을 수 없습니다.');
    }

    // 테스트용 휴가 유형 조회
    try {
      const leaveTypes = await leaveService.getLeaveTypes();
      if (leaveTypes.length > 0) {
        testLeaveTypeId = leaveTypes[0].id;
      }
    } catch (error) {
      console.warn('테스트용 휴가 유형을 찾을 수 없습니다.');
    }
  });

  describe('휴가 신청 및 승인', () => {
    it.skip('should create a leave request', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId || !testLeaveTypeId) {
        return;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // 7일 후
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 2); // 3일간

      const formData: LeaveRequestFormData = {
        employee_id: testEmployeeId,
        leave_type_id: testLeaveTypeId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        reason: '테스트 휴가 신청'
      };

      const leaveRequest = await leaveService.createLeaveRequest(formData);
      
      expect(leaveRequest).toBeDefined();
      expect(leaveRequest.employee_id).toBe(testEmployeeId);
      expect(leaveRequest.leave_type_id).toBe(testLeaveTypeId);
      expect(leaveRequest.status).toBe('pending');
      expect(leaveRequest.days).toBeGreaterThan(0);
      
      testLeaveRequestId = leaveRequest.id;
    });

    it.skip('should get leave request by id', async () => {
      if (!shouldRunIntegrationTests() || !testLeaveRequestId) {
        return;
      }

      const leaveRequest = await leaveService.getLeaveRequestById(testLeaveRequestId);
      
      expect(leaveRequest).toBeDefined();
      expect(leaveRequest.id).toBe(testLeaveRequestId);
      expect(leaveRequest.employee).toBeDefined();
      expect(leaveRequest.leave_type).toBeDefined();
    });

    it.skip('should get pending leave requests', async () => {
      if (!shouldRunIntegrationTests()) {
        return;
      }

      const pendingRequests = await leaveService.getPendingLeaveRequests();
      
      expect(Array.isArray(pendingRequests)).toBe(true);
      pendingRequests.forEach(request => {
        expect(request.status).toBe('pending');
      });
    });

    it.skip('should approve leave request', async () => {
      if (!shouldRunIntegrationTests() || !testLeaveRequestId) {
        return;
      }

      const approverId = 'test-approver-id';
      const approved = await leaveService.approveLeaveRequest(testLeaveRequestId, approverId);
      
      expect(approved.status).toBe('approved');
      expect(approved.approver_id).toBe(approverId);
      expect(approved.approved_at).toBeDefined();
    });

    it.skip('should reject leave request', async () => {
      if (!shouldRunIntegrationTests() || !testLeaveRequestId) {
        return;
      }

      // 먼저 새로운 휴가 신청 생성
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 14);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      const formData: LeaveRequestFormData = {
        employee_id: testEmployeeId,
        leave_type_id: testLeaveTypeId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        reason: '거절 테스트용 휴가'
      };

      const newRequest = await leaveService.createLeaveRequest(formData);
      const approverId = 'test-approver-id';
      const rejectionReason = '업무 일정상 불가';

      const rejected = await leaveService.rejectLeaveRequest(
        newRequest.id,
        approverId,
        rejectionReason
      );
      
      expect(rejected.status).toBe('rejected');
      expect(rejected.approver_id).toBe(approverId);
      expect(rejected.rejection_reason).toBe(rejectionReason);
    });

    it.skip('should get leave requests by employee', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId) {
        return;
      }

      const requests = await leaveService.getLeaveRequestsByEmployee(testEmployeeId, testYear);
      
      expect(Array.isArray(requests)).toBe(true);
      requests.forEach(request => {
        expect(request.employee_id).toBe(testEmployeeId);
      });
    });
  });

  describe('휴가 일수 계산', () => {
    it.skip('should calculate annual leave correctly', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId) {
        return;
      }

      const annualLeave = await leaveService.calculateAnnualLeave(testEmployeeId, testYear);
      
      expect(typeof annualLeave).toBe('number');
      expect(annualLeave).toBeGreaterThanOrEqual(0);
      expect(annualLeave).toBeLessThanOrEqual(25); // 최대 25일
    });

    it.skip('should get annual leave calculation', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId) {
        return;
      }

      const calculation = await leaveService.getAnnualLeaveCalculation(testEmployeeId, testYear);
      
      expect(calculation).toBeDefined();
      expect(calculation.employee_id).toBe(testEmployeeId);
      expect(calculation.year).toBe(testYear);
      expect(typeof calculation.total_annual_leave).toBe('number');
      expect(typeof calculation.used_annual_leave).toBe('number');
      expect(typeof calculation.remaining_annual_leave).toBe('number');
      expect(calculation.remaining_annual_leave).toBe(
        calculation.total_annual_leave - calculation.used_annual_leave
      );
    });

    it.skip('should get leave balance for employee', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId || !testLeaveTypeId) {
        return;
      }

      const balance = await leaveService.getLeaveBalance(
        testEmployeeId,
        testLeaveTypeId,
        testYear
      );
      
      // balance는 null일 수 있음 (아직 생성되지 않은 경우)
      if (balance) {
        expect(balance.employee_id).toBe(testEmployeeId);
        expect(balance.leave_type_id).toBe(testLeaveTypeId);
        expect(balance.year).toBe(testYear);
        expect(typeof balance.total_days).toBe('number');
        expect(typeof balance.used_days).toBe('number');
      }
    });

    it.skip('should get all leave balances for employee', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId) {
        return;
      }

      const balances = await leaveService.getLeaveBalancesByEmployee(testEmployeeId, testYear);
      
      expect(Array.isArray(balances)).toBe(true);
      balances.forEach(balance => {
        expect(balance.employee_id).toBe(testEmployeeId);
        expect(balance.year).toBe(testYear);
        expect(balance.leave_type).toBeDefined();
      });
    });
  });

  describe('휴가 캘린더 뷰', () => {
    it.skip('should get leave requests for calendar view', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId) {
        return;
      }

      const requests = await leaveService.getLeaveRequestsByEmployee(testEmployeeId);
      
      expect(Array.isArray(requests)).toBe(true);
      
      // 캘린더에 표시하기 위한 데이터 형식 확인
      requests.forEach(request => {
        expect(request.start_date).toBeDefined();
        expect(request.end_date).toBeDefined();
        expect(request.days).toBeDefined();
        expect(request.leave_type).toBeDefined();
        expect(request.status).toBeDefined();
      });
    });

    it.skip('should filter leave requests by year', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId) {
        return;
      }

      const requests = await leaveService.getLeaveRequestsByEmployee(testEmployeeId, testYear);
      
      expect(Array.isArray(requests)).toBe(true);
      requests.forEach(request => {
        const requestYear = new Date(request.start_date).getFullYear();
        expect(requestYear).toBe(testYear);
      });
    });
  });
});

