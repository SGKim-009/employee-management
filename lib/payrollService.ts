import { supabase } from './supabaseClient';
import { PayrollStatement, PayrollTransfer, PayrollCalculationInput, TaxCalculation, PayrollSummary } from '@/types/payroll';

export const payrollService = {
  // 세금 및 공제액 계산
  calculateTaxes(totalIncome: number): TaxCalculation {
    // 국민연금: 총 지급액의 4.5% (근로자 부담분)
    const nationalPension = Math.floor(totalIncome * 0.045);

    // 건강보험: 총 지급액의 3.545% (근로자 부담분)
    const healthInsurance = Math.floor(totalIncome * 0.03545);

    // 장기요양보험: 건강보험료의 12.27%
    const longTermCare = Math.floor(healthInsurance * 0.1227);

    // 고용보험: 총 지급액의 0.9% (근로자 부담분)
    const employmentInsurance = Math.floor(totalIncome * 0.009);

    // 소득세 계산 (간소화된 계산식)
    // 실제로는 누진세율표를 사용해야 함
    let incomeTax = 0;
    if (totalIncome <= 12000000) {
      incomeTax = Math.floor(totalIncome * 0.06);
    } else if (totalIncome <= 46000000) {
      incomeTax = Math.floor(720000 + (totalIncome - 12000000) * 0.15);
    } else if (totalIncome <= 88000000) {
      incomeTax = Math.floor(5820000 + (totalIncome - 46000000) * 0.24);
    } else if (totalIncome <= 150000000) {
      incomeTax = Math.floor(15900000 + (totalIncome - 88000000) * 0.35);
    } else {
      incomeTax = Math.floor(37600000 + (totalIncome - 150000000) * 0.38);
    }

    // 지방소득세: 소득세의 10%
    const localTax = Math.floor(incomeTax * 0.1);

    const totalDeduction = nationalPension + healthInsurance + longTermCare + 
                          employmentInsurance + incomeTax + localTax;

    return {
      income_tax: incomeTax,
      local_tax: localTax,
      national_pension: nationalPension,
      health_insurance: healthInsurance,
      employment_insurance: employmentInsurance,
      long_term_care: longTermCare,
      total_deduction: totalDeduction
    };
  },

  // 급여 명세서 생성
  async createPayrollStatement(input: PayrollCalculationInput, createdBy?: string): Promise<PayrollStatement> {
    const overtimePay = input.overtime_pay || 0;
    const bonus = input.bonus || 0;
    const allowances = input.allowances || 0;

    // 총 지급액 계산
    const totalIncome = input.base_salary + overtimePay + bonus + allowances;

    // 세금 및 공제액 계산
    const taxes = this.calculateTaxes(totalIncome);

    // 실지급액 계산
    const netPay = totalIncome - taxes.total_deduction;

    const { data, error } = await supabase
      .from('payroll_statements')
      .insert([{
        employee_id: input.employee_id,
        year: input.year,
        month: input.month,
        base_salary: input.base_salary,
        overtime_pay: overtimePay,
        bonus: bonus,
        allowances: allowances,
        total_income: totalIncome,
        income_tax: taxes.income_tax,
        local_tax: taxes.local_tax,
        national_pension: taxes.national_pension,
        health_insurance: taxes.health_insurance,
        employment_insurance: taxes.employment_insurance,
        long_term_care: taxes.long_term_care,
        total_deduction: taxes.total_deduction,
        net_pay: netPay,
        payment_date: input.payment_date,
        notes: input.notes,
        created_by: createdBy
      }])
      .select()
      .single();

    if (error) throw error;
    return await this.getPayrollStatementById(data.id);
  },

  // 급여 명세서 조회 (ID로)
  async getPayrollStatementById(id: string): Promise<PayrollStatement> {
    const { data, error } = await supabase
      .from('payroll_statements')
      .select(`
        *,
        employee:employees(id, name, department, position, employee_number)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as PayrollStatement;
  },

  // 직원별 급여 명세서 목록 조회
  async getPayrollStatementsByEmployee(employeeId: string, year?: number): Promise<PayrollStatement[]> {
    let query = supabase
      .from('payroll_statements')
      .select(`
        *,
        employee:employees(id, name, department, position, employee_number)
      `)
      .eq('employee_id', employeeId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (year) {
      query = query.eq('year', year);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // 급여 명세서 수정
  async updatePayrollStatement(id: string, updates: Partial<PayrollCalculationInput>): Promise<PayrollStatement> {
    const existing = await this.getPayrollStatementById(id);
    
    // 급여 항목이 변경된 경우 재계산
    let recalculated = false;
    const updateData: any = {};

    if (updates.base_salary !== undefined || updates.overtime_pay !== undefined || 
        updates.bonus !== undefined || updates.allowances !== undefined) {
      recalculated = true;
      const baseSalary = updates.base_salary ?? existing.base_salary;
      const overtimePay = updates.overtime_pay ?? existing.overtime_pay;
      const bonus = updates.bonus ?? existing.bonus;
      const allowances = updates.allowances ?? existing.allowances;

      const totalIncome = baseSalary + overtimePay + bonus + allowances;
      const taxes = this.calculateTaxes(totalIncome);
      const netPay = totalIncome - taxes.total_deduction;

      updateData.base_salary = baseSalary;
      updateData.overtime_pay = overtimePay;
      updateData.bonus = bonus;
      updateData.allowances = allowances;
      updateData.total_income = totalIncome;
      updateData.income_tax = taxes.income_tax;
      updateData.local_tax = taxes.local_tax;
      updateData.national_pension = taxes.national_pension;
      updateData.health_insurance = taxes.health_insurance;
      updateData.employment_insurance = taxes.employment_insurance;
      updateData.long_term_care = taxes.long_term_care;
      updateData.total_deduction = taxes.total_deduction;
      updateData.net_pay = netPay;
    }

    if (updates.payment_date !== undefined) updateData.payment_date = updates.payment_date;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await supabase
      .from('payroll_statements')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return await this.getPayrollStatementById(id);
  },

  // 급여 명세서 삭제
  async deletePayrollStatement(id: string): Promise<void> {
    const { error } = await supabase
      .from('payroll_statements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 급여 이체 내역 생성
  async createPayrollTransfer(
    payrollStatementId: string,
    transferData: {
      transfer_date: string;
      transfer_amount: number;
      bank_name?: string;
      account_number?: string;
      account_holder?: string;
      transfer_reference?: string;
    }
  ): Promise<PayrollTransfer> {
    const statement = await this.getPayrollStatementById(payrollStatementId);

    const { data, error } = await supabase
      .from('payroll_transfers')
      .insert([{
        payroll_statement_id: payrollStatementId,
        employee_id: statement.employee_id,
        transfer_date: transferData.transfer_date,
        transfer_amount: transferData.transfer_amount,
        bank_name: transferData.bank_name,
        account_number: transferData.account_number,
        account_holder: transferData.account_holder,
        transfer_reference: transferData.transfer_reference,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    // 급여 명세서 상태를 'paid'로 업데이트
    await supabase
      .from('payroll_statements')
      .update({ 
        payment_status: 'paid',
        payment_method: 'bank_transfer',
        bank_account: transferData.account_number
      })
      .eq('id', payrollStatementId);

    return await this.getPayrollTransferById(data.id);
  },

  // 급여 이체 내역 조회 (ID로)
  async getPayrollTransferById(id: string): Promise<PayrollTransfer> {
    const { data, error } = await supabase
      .from('payroll_transfers')
      .select(`
        *,
        payroll_statement:payroll_statements(*),
        employee:employees(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as PayrollTransfer;
  },

  // 직원별 급여 이체 내역 조회
  async getPayrollTransfersByEmployee(employeeId: string, year?: number): Promise<PayrollTransfer[]> {
    let query = supabase
      .from('payroll_transfers')
      .select(`
        *,
        payroll_statement:payroll_statements(*)
      `)
      .eq('employee_id', employeeId)
      .order('transfer_date', { ascending: false });

    if (year) {
      query = query.gte('transfer_date', `${year}-01-01`)
                   .lte('transfer_date', `${year}-12-31`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // 급여 이체 내역 상태 업데이트
  async updatePayrollTransferStatus(
    id: string,
    status: PayrollTransfer['status'],
    failureReason?: string
  ): Promise<PayrollTransfer> {
    const updateData: any = { status };
    if (failureReason) updateData.failure_reason = failureReason;

    const { error } = await supabase
      .from('payroll_transfers')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return await this.getPayrollTransferById(id);
  },

  // 급여 요약 조회
  async getPayrollSummary(employeeId: string, year: number): Promise<PayrollSummary> {
    const statements = await this.getPayrollStatementsByEmployee(employeeId, year);
    
    if (statements.length === 0) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id, name')
        .eq('id', employeeId)
        .single();

      return {
        employee_id: employeeId,
        employee_name: employee?.name || '',
        year: year,
        total_statements: 0,
        total_income: 0,
        total_deduction: 0,
        total_net_pay: 0,
        average_net_pay: 0
      };
    }

    const totalIncome = statements.reduce((sum, stmt) => sum + stmt.total_income, 0);
    const totalDeduction = statements.reduce((sum, stmt) => sum + stmt.total_deduction, 0);
    const totalNetPay = statements.reduce((sum, stmt) => sum + stmt.net_pay, 0);
    const averageNetPay = totalNetPay / statements.length;

    return {
      employee_id: employeeId,
      employee_name: statements[0].employee?.name || '',
      year: year,
      total_statements: statements.length,
      total_income: totalIncome,
      total_deduction: totalDeduction,
      total_net_pay: totalNetPay,
      average_net_pay: averageNetPay
    };
  }
};


