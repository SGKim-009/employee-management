# 급여 관리 시스템 설정 가이드

## 📋 개요

이 가이드는 Supabase에서 급여 관리 시스템을 위한 데이터베이스 테이블을 생성하는 방법을 설명합니다.

---

## 🗄️ 생성되는 테이블

1. **payroll_statements** - 급여 명세서 테이블
2. **payroll_transfers** - 급여 이체 내역 테이블

---

## 📝 단계별 설정 방법

### 1단계: Supabase 대시보드 접속

1. [Supabase 대시보드](https://app.supabase.com)에 로그인합니다.
2. 프로젝트를 선택합니다.

### 2단계: SQL Editor 열기

1. 왼쪽 사이드바에서 **SQL Editor**를 클릭합니다.
2. **New query** 버튼을 클릭하여 새 쿼리 창을 엽니다.

### 3단계: SQL 스크립트 복사 및 실행

#### 방법 A: 파일에서 직접 복사

1. 프로젝트의 `docs/sql/payroll_table.sql` 파일을 엽니다.
2. 전체 내용을 복사합니다 (Ctrl+A, Ctrl+C).
3. Supabase SQL Editor에 붙여넣습니다 (Ctrl+V).
4. **Run** 버튼을 클릭하거나 `Ctrl+Enter`를 눌러 실행합니다.

#### 방법 B: 아래 SQL 스크립트 사용

```sql
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
```

### 4단계: 실행 결과 확인

1. SQL Editor 하단의 **Results** 탭에서 실행 결과를 확인합니다.
2. 성공 메시지가 표시되면 테이블이 정상적으로 생성된 것입니다.
3. 왼쪽 사이드바의 **Table Editor**에서 다음 테이블들이 생성되었는지 확인합니다:
   - `payroll_statements`
   - `payroll_transfers`

### 5단계: 테이블 구조 확인 (선택사항)

1. **Table Editor**에서 `payroll_statements` 테이블을 클릭합니다.
2. 테이블 구조가 올바르게 생성되었는지 확인합니다.
3. 동일하게 `payroll_transfers` 테이블도 확인합니다.

---

## ✅ 검증 방법

### 1. 테이블 존재 확인

SQL Editor에서 다음 쿼리를 실행하여 테이블이 생성되었는지 확인합니다:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payroll_statements', 'payroll_transfers');
```

결과에 두 테이블이 모두 표시되어야 합니다.

### 2. RLS 정책 확인

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('payroll_statements', 'payroll_transfers');
```

결과에 4개의 정책이 표시되어야 합니다:
- `직원은 자신의 급여 명세서 조회 가능`
- `인증된 사용자는 급여 명세서 생성/수정 가능`
- `직원은 자신의 급여 이체 내역 조회 가능`
- `인증된 사용자는 급여 이체 내역 생성/수정 가능`

### 3. 인덱스 확인

```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('payroll_statements', 'payroll_transfers');
```

결과에 6개의 인덱스가 표시되어야 합니다.

---

## ⚠️ 주의사항

1. **기존 데이터**: 이 스크립트는 `CREATE TABLE IF NOT EXISTS`를 사용하므로 기존 테이블이 있으면 건너뜁니다.
2. **외래 키**: `employees` 테이블이 먼저 생성되어 있어야 합니다.
3. **RLS 정책**: `user_roles` 테이블이 존재해야 RLS 정책이 정상 작동합니다.
4. **권한**: 관리자 권한이 필요합니다.

---

## 🔧 문제 해결

### 오류: "relation 'employees' does not exist"
- **원인**: `employees` 테이블이 아직 생성되지 않았습니다.
- **해결**: 먼저 `employees` 테이블을 생성하세요.

### 오류: "relation 'user_roles' does not exist"
- **원인**: `user_roles` 테이블이 아직 생성되지 않았습니다.
- **해결**: RLS 정책에서 `user_roles` 참조를 제거하거나, `user_roles` 테이블을 먼저 생성하세요.

### 오류: "permission denied"
- **원인**: 권한이 부족합니다.
- **해결**: 프로젝트 관리자 계정으로 로그인하거나, 적절한 권한을 요청하세요.

---

## 📚 다음 단계

데이터베이스 설정이 완료되면:

1. ✅ **기능 테스트**: 급여 명세서 생성 및 PDF 다운로드 테스트
2. ✅ **세금 계산 확인**: 다양한 급여 금액으로 세금 계산 정확성 확인
3. ✅ **권한 테스트**: 일반 사용자와 관리자 권한 차이 확인

---

## 💡 참고

- 테이블 구조 변경이 필요한 경우 `ALTER TABLE` 문을 사용하세요.
- 데이터를 삭제하려면 `DROP TABLE` 문을 사용하세요 (주의: 모든 데이터가 삭제됩니다).
- 더 자세한 정보는 `docs/SUPABASE_SETUP_GUIDE.md`를 참고하세요.

