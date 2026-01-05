-- 휴가 관리 테이블 생성

-- 휴가 유형 테이블
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 휴가 유형명 (예: "연차", "반차", "병가", "경조사", "출산휴가")
  code TEXT NOT NULL UNIQUE, -- 휴가 코드 (예: "annual", "half_day", "sick", "personal", "maternity")
  is_paid BOOLEAN DEFAULT true, -- 유급 여부
  max_days_per_year INTEGER, -- 연간 최대 일수 (NULL이면 제한 없음)
  requires_approval BOOLEAN DEFAULT true, -- 승인 필요 여부
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 휴가 신청 테이블
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days DECIMAL(5, 2) NOT NULL, -- 휴가 일수 (반차는 0.5)
  reason TEXT, -- 사유
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approver_id UUID REFERENCES auth.users(id), -- 승인자
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT, -- 거절 사유
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- 직원별 휴가 잔여일 관리 테이블
CREATE TABLE IF NOT EXISTS employee_leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  year INTEGER NOT NULL, -- 연도
  total_days DECIMAL(5, 2) NOT NULL DEFAULT 0, -- 총 부여 일수
  used_days DECIMAL(5, 2) NOT NULL DEFAULT 0, -- 사용 일수
  remaining_days DECIMAL(5, 2) GENERATED ALWAYS AS (total_days - used_days) STORED, -- 잔여 일수 (자동 계산)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, year)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date ON leave_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_end_date ON leave_requests(end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_leave_type_id ON leave_requests(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_employee_leave_balances_employee_id ON employee_leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_leave_balances_year ON employee_leave_balances(year);
CREATE INDEX IF NOT EXISTS idx_leave_types_code ON leave_types(code);
CREATE INDEX IF NOT EXISTS idx_leave_types_is_active ON leave_types(is_active);

-- RLS 정책 설정
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_leave_balances ENABLE ROW LEVEL SECURITY;

-- 휴가 유형 조회 권한 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 휴가 유형 조회 가능"
  ON leave_types
  FOR SELECT
  TO authenticated
  USING (true);

-- 휴가 유형 생성/수정 권한 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 휴가 유형 생성/수정 가능"
  ON leave_types
  FOR INSERT, UPDATE
  TO authenticated
  WITH CHECK (true);

-- 휴가 신청 조회 권한 (본인 또는 승인자)
CREATE POLICY "직원은 자신의 휴가 신청 조회 가능"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE id = leave_requests.employee_id
    ) OR
    approver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- 휴가 신청 생성 권한 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 휴가 신청 생성 가능"
  ON leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 휴가 신청 수정 권한 (본인 또는 승인자)
CREATE POLICY "직원은 자신의 휴가 신청 수정 가능"
  ON leave_requests
  FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE id = leave_requests.employee_id
    ) OR
    approver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- 휴가 잔여일 조회 권한 (본인 또는 관리자)
CREATE POLICY "직원은 자신의 휴가 잔여일 조회 가능"
  ON employee_leave_balances
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE id = employee_leave_balances.employee_id
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- 휴가 잔여일 생성/수정 권한 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 휴가 잔여일 생성/수정 가능"
  ON employee_leave_balances
  FOR INSERT, UPDATE
  TO authenticated
  WITH CHECK (true);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_leave_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_leave_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_employee_leave_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_leave_types_updated_at
  BEFORE UPDATE ON leave_types
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_types_updated_at();

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_requests_updated_at();

CREATE TRIGGER update_employee_leave_balances_updated_at
  BEFORE UPDATE ON employee_leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_leave_balances_updated_at();

-- 기본 휴가 유형 데이터 삽입
INSERT INTO leave_types (name, code, is_paid, max_days_per_year, requires_approval) VALUES
  ('연차', 'annual', true, 15, true),
  ('반차', 'half_day', true, NULL, true),
  ('병가', 'sick', true, NULL, true),
  ('경조사', 'personal', true, 5, true),
  ('출산휴가', 'maternity', true, 90, true),
  ('육아휴직', 'parental', true, 365, true),
  ('무급휴가', 'unpaid', false, NULL, true)
ON CONFLICT (code) DO NOTHING;


