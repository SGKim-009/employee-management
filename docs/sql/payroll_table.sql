-- 급여 관리 테이블 생성

-- 급여 명세서 테이블
CREATE TABLE IF NOT EXISTS payroll_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  base_salary DECIMAL(12, 2) NOT NULL, -- 기본급
  overtime_pay DECIMAL(12, 2) DEFAULT 0, -- 연장근로수당
  bonus DECIMAL(12, 2) DEFAULT 0, -- 상여금
  allowances DECIMAL(12, 2) DEFAULT 0, -- 제수당
  total_income DECIMAL(12, 2) NOT NULL, -- 총 지급액
  income_tax DECIMAL(12, 2) DEFAULT 0, -- 소득세
  local_tax DECIMAL(12, 2) DEFAULT 0, -- 지방소득세
  national_pension DECIMAL(12, 2) DEFAULT 0, -- 국민연금
  health_insurance DECIMAL(12, 2) DEFAULT 0, -- 건강보험
  employment_insurance DECIMAL(12, 2) DEFAULT 0, -- 고용보험
  long_term_care DECIMAL(12, 2) DEFAULT 0, -- 장기요양보험
  total_deduction DECIMAL(12, 2) NOT NULL, -- 총 공제액
  net_pay DECIMAL(12, 2) NOT NULL, -- 실지급액
  payment_date DATE, -- 지급일
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  payment_method TEXT, -- 지급 방법 (bank_transfer, cash, etc.)
  bank_account TEXT, -- 계좌번호
  notes TEXT, -- 비고
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(employee_id, year, month)
);

-- 급여 이체 내역 테이블
CREATE TABLE IF NOT EXISTS payroll_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_statement_id UUID NOT NULL REFERENCES payroll_statements(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  transfer_date DATE NOT NULL,
  transfer_amount DECIMAL(12, 2) NOT NULL,
  bank_name TEXT, -- 은행명
  account_number TEXT, -- 계좌번호
  account_holder TEXT, -- 예금주
  transfer_reference TEXT, -- 이체 참조번호
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  failure_reason TEXT, -- 실패 사유
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payroll_statements_employee_id ON payroll_statements(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_statements_year_month ON payroll_statements(year, month);
CREATE INDEX IF NOT EXISTS idx_payroll_statements_payment_status ON payroll_statements(payment_status);
CREATE INDEX IF NOT EXISTS idx_payroll_transfers_payroll_statement_id ON payroll_transfers(payroll_statement_id);
CREATE INDEX IF NOT EXISTS idx_payroll_transfers_employee_id ON payroll_transfers(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_transfers_transfer_date ON payroll_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_payroll_transfers_status ON payroll_transfers(status);

-- RLS 정책 설정
ALTER TABLE payroll_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_transfers ENABLE ROW LEVEL SECURITY;

-- 급여 명세서 조회 권한 (본인 또는 관리자)
CREATE POLICY "직원은 자신의 급여 명세서 조회 가능"
  ON payroll_statements
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE id = payroll_statements.employee_id
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- 급여 명세서 생성 권한 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 급여 명세서 생성 가능"
  ON payroll_statements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 급여 명세서 수정 권한 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 급여 명세서 수정 가능"
  ON payroll_statements
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 급여 이체 내역 조회 권한 (본인 또는 관리자)
CREATE POLICY "직원은 자신의 급여 이체 내역 조회 가능"
  ON payroll_transfers
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE id = payroll_transfers.employee_id
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- 급여 이체 내역 생성 권한 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 급여 이체 내역 생성 가능"
  ON payroll_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 급여 이체 내역 수정 권한 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 급여 이체 내역 수정 가능"
  ON payroll_transfers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_payroll_statements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_payroll_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_payroll_statements_updated_at
  BEFORE UPDATE ON payroll_statements
  FOR EACH ROW
  EXECUTE FUNCTION update_payroll_statements_updated_at();

CREATE TRIGGER update_payroll_transfers_updated_at
  BEFORE UPDATE ON payroll_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_payroll_transfers_updated_at();


