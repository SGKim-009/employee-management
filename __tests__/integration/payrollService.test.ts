/**
 * 통합 테스트: payrollService
 * 
 * 주의: 실제 Supabase 연결이 필요한 테스트입니다.
 * 환경 변수가 설정되어 있어야 합니다.
 */

import { payrollService } from '@/lib/payrollService';
import { PayrollCalculationInput } from '@/types/payroll';
import { employeeService } from '@/lib/supabaseClient';

const shouldRunIntegrationTests = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

describe('Integration: payrollService', () => {
  let testEmployeeId: string;
  let testPayrollStatementId: string;
  let testPayrollTransferId: string;
  const testYear = new Date().getFullYear();
  const testMonth = new Date().getMonth() + 1;

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
  });

  describe('급여 명세서 생성 및 다운로드', () => {
    it.skip('should create a payroll statement', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId) {
        return;
      }

      const input: PayrollCalculationInput = {
        employee_id: testEmployeeId,
        year: testYear,
        month: testMonth,
        base_salary: 3000000,
        overtime_pay: 200000,
        bonus: 500000,
        allowances: 100000,
        payment_date: new Date().toISOString().split('T')[0],
        notes: '테스트 급여 명세서'
      };

      const statement = await payrollService.createPayrollStatement(input);
      
      expect(statement).toBeDefined();
      expect(statement.employee_id).toBe(testEmployeeId);
      expect(statement.year).toBe(testYear);
      expect(statement.month).toBe(testMonth);
      expect(statement.base_salary).toBe(3000000);
      expect(statement.total_income).toBe(3800000); // 3000000 + 200000 + 500000 + 100000
      expect(statement.net_pay).toBeGreaterThan(0);
      expect(statement.total_deduction).toBeGreaterThan(0);
      
      testPayrollStatementId = statement.id;
    });

    it.skip('should get payroll statement by id', async () => {
      if (!shouldRunIntegrationTests() || !testPayrollStatementId) {
        return;
      }

      const statement = await payrollService.getPayrollStatementById(testPayrollStatementId);
      
      expect(statement).toBeDefined();
      expect(statement.id).toBe(testPayrollStatementId);
      expect(statement.employee).toBeDefined();
      expect(statement.total_income).toBeDefined();
      expect(statement.net_pay).toBeDefined();
    });

    it.skip('should get payroll statements by employee', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId) {
        return;
      }

      const statements = await payrollService.getPayrollStatementsByEmployee(testEmployeeId, testYear);
      
      expect(Array.isArray(statements)).toBe(true);
      statements.forEach(statement => {
        expect(statement.employee_id).toBe(testEmployeeId);
        expect(statement.year).toBe(testYear);
      });
    });

    it.skip('should update payroll statement', async () => {
      if (!shouldRunIntegrationTests() || !testPayrollStatementId) {
        return;
      }

      const updates: Partial<PayrollCalculationInput> = {
        base_salary: 3200000,
        notes: '수정된 급여 명세서'
      };

      const updated = await payrollService.updatePayrollStatement(testPayrollStatementId, updates);
      
      expect(updated.base_salary).toBe(3200000);
      expect(updated.notes).toBe('수정된 급여 명세서');
      // 급여가 변경되면 재계산되어야 함
      expect(updated.total_income).toBeGreaterThan(0);
    });

    it.skip('should calculate taxes correctly', () => {
      // 세금 계산은 순수 함수이므로 실제 DB 연결 없이 테스트 가능
      const totalIncome = 5000000;
      const taxes = payrollService.calculateTaxes(totalIncome);
      
      expect(taxes).toBeDefined();
      expect(taxes.income_tax).toBeGreaterThan(0);
      expect(taxes.local_tax).toBeGreaterThan(0);
      expect(taxes.national_pension).toBeGreaterThan(0);
      expect(taxes.health_insurance).toBeGreaterThan(0);
      expect(taxes.employment_insurance).toBeGreaterThan(0);
      expect(taxes.long_term_care).toBeGreaterThan(0);
      expect(taxes.total_deduction).toBeGreaterThan(0);
      
      // 지방소득세는 소득세의 10%
      expect(taxes.local_tax).toBe(Math.floor(taxes.income_tax * 0.1));
      
      // 총 공제액은 모든 항목의 합
      const calculatedTotal = taxes.income_tax + taxes.local_tax + 
                              taxes.national_pension + taxes.health_insurance + 
                              taxes.employment_insurance + taxes.long_term_care;
      expect(taxes.total_deduction).toBe(calculatedTotal);
    });
  });

  describe('세금 계산 정확성', () => {
    it('should calculate taxes for low income correctly', () => {
      const totalIncome = 10000000; // 1천만원
      const taxes = payrollService.calculateTaxes(totalIncome);
      
      expect(taxes.income_tax).toBeGreaterThan(0);
      expect(taxes.total_deduction).toBeLessThan(totalIncome);
    });

    it('should calculate taxes for medium income correctly', () => {
      const totalIncome = 30000000; // 3천만원
      const taxes = payrollService.calculateTaxes(totalIncome);
      
      expect(taxes.income_tax).toBeGreaterThan(0);
      expect(taxes.total_deduction).toBeLessThan(totalIncome);
    });

    it('should calculate taxes for high income correctly', () => {
      const totalIncome = 100000000; // 1억원
      const taxes = payrollService.calculateTaxes(totalIncome);
      
      expect(taxes.income_tax).toBeGreaterThan(0);
      expect(taxes.total_deduction).toBeLessThan(totalIncome);
    });

    it('should have correct tax brackets', () => {
      // 1200만원 이하: 6%
      const lowIncome = 10000000;
      const lowTaxes = payrollService.calculateTaxes(lowIncome);
      expect(lowTaxes.income_tax).toBe(Math.floor(lowIncome * 0.06));
      
      // 1200만원 초과 4600만원 이하: 15%
      const midIncome = 30000000;
      const midTaxes = payrollService.calculateTaxes(midIncome);
      expect(midTaxes.income_tax).toBeGreaterThan(Math.floor(720000 + (midIncome - 12000000) * 0.15) - 1000);
      expect(midTaxes.income_tax).toBeLessThan(Math.floor(720000 + (midIncome - 12000000) * 0.15) + 1000);
    });

    it('should calculate 4대 보험 correctly', () => {
      const totalIncome = 5000000;
      const taxes = payrollService.calculateTaxes(totalIncome);
      
      // 국민연금: 4.5%
      expect(taxes.national_pension).toBe(Math.floor(totalIncome * 0.045));
      
      // 건강보험: 3.545%
      expect(taxes.health_insurance).toBe(Math.floor(totalIncome * 0.03545));
      
      // 장기요양보험: 건강보험료의 12.27%
      expect(taxes.long_term_care).toBe(Math.floor(taxes.health_insurance * 0.1227));
      
      // 고용보험: 0.9%
      expect(taxes.employment_insurance).toBe(Math.floor(totalIncome * 0.009));
    });
  });

  describe('급여 이체 내역 관리', () => {
    it.skip('should create payroll transfer', async () => {
      if (!shouldRunIntegrationTests() || !testPayrollStatementId) {
        return;
      }

      const transferData = {
        transfer_date: new Date().toISOString().split('T')[0],
        transfer_amount: 2500000,
        bank_name: '테스트 은행',
        account_number: '123-456-789012',
        account_holder: '테스트 계좌',
        transfer_reference: 'TEST-REF-001'
      };

      const transfer = await payrollService.createPayrollTransfer(
        testPayrollStatementId,
        transferData
      );
      
      expect(transfer).toBeDefined();
      expect(transfer.payroll_statement_id).toBe(testPayrollStatementId);
      expect(transfer.transfer_amount).toBe(2500000);
      expect(transfer.bank_name).toBe('테스트 은행');
      expect(transfer.status).toBe('pending');
      
      testPayrollTransferId = transfer.id;
    });

    it.skip('should get payroll transfer by id', async () => {
      if (!shouldRunIntegrationTests() || !testPayrollTransferId) {
        return;
      }

      const transfer = await payrollService.getPayrollTransferById(testPayrollTransferId);
      
      expect(transfer).toBeDefined();
      expect(transfer.id).toBe(testPayrollTransferId);
      expect(transfer.payroll_statement).toBeDefined();
      expect(transfer.employee).toBeDefined();
    });

    it.skip('should get payroll transfers by employee', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId) {
        return;
      }

      const transfers = await payrollService.getPayrollTransfersByEmployee(testEmployeeId, testYear);
      
      expect(Array.isArray(transfers)).toBe(true);
      transfers.forEach(transfer => {
        expect(transfer.employee_id).toBe(testEmployeeId);
      });
    });

    it.skip('should update payroll transfer status', async () => {
      if (!shouldRunIntegrationTests() || !testPayrollTransferId) {
        return;
      }

      const updated = await payrollService.updatePayrollTransferStatus(
        testPayrollTransferId,
        'completed'
      );
      
      expect(updated.status).toBe('completed');
    });

    it.skip('should update payroll transfer status with failure reason', async () => {
      if (!shouldRunIntegrationTests() || !testPayrollTransferId) {
        return;
      }

      const failureReason = '잔액 부족';
      const updated = await payrollService.updatePayrollTransferStatus(
        testPayrollTransferId,
        'failed',
        failureReason
      );
      
      expect(updated.status).toBe('failed');
      expect(updated.failure_reason).toBe(failureReason);
    });
  });

  describe('급여 요약', () => {
    it.skip('should get payroll summary for employee', async () => {
      if (!shouldRunIntegrationTests() || !testEmployeeId) {
        return;
      }

      const summary = await payrollService.getPayrollSummary(testEmployeeId, testYear);
      
      expect(summary).toBeDefined();
      expect(summary.employee_id).toBe(testEmployeeId);
      expect(summary.year).toBe(testYear);
      expect(typeof summary.total_statements).toBe('number');
      expect(typeof summary.total_income).toBe('number');
      expect(typeof summary.total_deduction).toBe('number');
      expect(typeof summary.total_net_pay).toBe('number');
      expect(typeof summary.average_net_pay).toBe('number');
    });
  });
});

