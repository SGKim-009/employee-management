# RLS 정책 설정 빠른 가이드

## 📍 파일 위치

`docs/sql/rls_policies.sql` 파일은 **로컬 프로젝트 폴더**에 있습니다.

**경로**: `C:\Users\인사총무팀\employee-management\docs\sql\rls_policies.sql`

---

## 🚀 실행 방법 (단계별)

### 1단계: 로컬 파일 열기

1. **VS Code 또는 텍스트 에디터**에서 다음 파일을 엽니다:
   ```
   docs/sql/rls_policies.sql
   ```
   
   또는 파일 탐색기에서:
   - `employee-management` 폴더 열기
   - `docs` → `sql` → `rls_policies.sql` 파일 열기

### 2단계: 전체 내용 복사

1. 파일을 열면 전체 SQL 코드가 보입니다
2. **전체 선택** (`Ctrl + A`)
3. **복사** (`Ctrl + C`)

### 3단계: Supabase 대시보드에서 실행

1. **Supabase 대시보드** 접속: https://supabase.com/dashboard
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New Query** 버튼 클릭 (또는 기존 쿼리 창 사용)
5. SQL Editor 텍스트 영역에 **붙여넣기** (`Ctrl + V`)
6. **Run** 버튼 클릭 (또는 `Ctrl + Enter`)

### 4단계: 실행 결과 확인

- ✅ **성공**: "Success. No rows returned" 또는 유사한 메시지
- ❌ **실패**: 에러 메시지 확인

---

## 📋 전체 SQL 코드 (복사용)

아래 전체 코드를 복사하여 Supabase SQL Editor에 붙여넣으세요:

```sql
-- ============================================
-- 인사관리 시스템 RLS 정책 설정 스크립트
-- ============================================
-- 이 스크립트는 Supabase SQL Editor에서 실행하세요.
-- 실행 전에 employees, salary_history, position_history 테이블이 존재하는지 확인하세요.

-- ============================================
-- 1. user_roles 테이블 생성 (아직 없는 경우)
-- ============================================

-- 테이블이 이미 존재하는지 확인하고 없으면 생성
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'hr', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 삭제 (재실행 시 충돌 방지)
DROP POLICY IF EXISTS "사용자는 자신의 역할 조회 가능" ON user_roles;

-- 사용자는 자신의 역할을 볼 수 있음
CREATE POLICY "사용자는 자신의 역할 조회 가능"
ON user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 2. employees 테이블 RLS 정책
-- ============================================

-- RLS 활성화
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재실행 시 충돌 방지)
DROP POLICY IF EXISTS "인증된 사용자는 직원 정보 조회 가능" ON employees;
DROP POLICY IF EXISTS "인증된 사용자는 직원 정보 생성 가능" ON employees;
DROP POLICY IF EXISTS "인증된 사용자는 직원 정보 수정 가능" ON employees;
DROP POLICY IF EXISTS "관리자만 직원 정보 삭제 가능" ON employees;

-- 읽기 권한 정책 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 직원 정보 조회 가능"
ON employees
FOR SELECT
TO authenticated
USING (true);

-- 생성 권한 정책 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 직원 정보 생성 가능"
ON employees
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 수정 권한 정책 (인증된 사용자만)
CREATE POLICY "인증된 사용자는 직원 정보 수정 가능"
ON employees
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 삭제 권한 정책 (관리자만)
CREATE POLICY "관리자만 직원 정보 삭제 가능"
ON employees
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- ============================================
-- 3. salary_history 테이블 RLS 정책
-- ============================================

-- RLS 활성화
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "인증된 사용자는 급여 이력 관리 가능" ON salary_history;

-- 인증된 사용자는 급여 이력을 조회/생성/수정 가능
CREATE POLICY "인증된 사용자는 급여 이력 관리 가능"
ON salary_history
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 4. position_history 테이블 RLS 정책
-- ============================================

-- RLS 활성화
ALTER TABLE position_history ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "인증된 사용자는 인사 이력 관리 가능" ON position_history;

-- 인증된 사용자는 인사 이력을 조회/생성/수정 가능
CREATE POLICY "인증된 사용자는 인사 이력 관리 가능"
ON position_history
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 5. Storage 버킷 정책 (참고용)
-- ============================================
-- Storage 정책은 Supabase 대시보드의 Storage > Policies에서 설정하세요.
-- 또는 다음 SQL을 실행하세요 (employee-profiles 버킷이 존재하는 경우):

-- 기존 정책 삭제
DROP POLICY IF EXISTS "인증된 사용자는 프로필 이미지 관리 가능" ON storage.objects;

-- 인증된 사용자는 프로필 이미지를 업로드/조회 가능
CREATE POLICY "인증된 사용자는 프로필 이미지 관리 가능"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'employee-profiles')
WITH CHECK (bucket_id = 'employee-profiles');

-- ============================================
-- 완료 메시지
-- ============================================
-- 모든 RLS 정책이 성공적으로 설정되었습니다.
-- 이제 비인증 사용자는 데이터에 접근할 수 없습니다.
```

---

## ✅ 실행 후 확인 사항

### 1. RLS 활성화 확인

1. Supabase 대시보드 → **Table Editor**
2. 각 테이블을 선택하고 **Settings** 탭 확인:
   - ✅ `employees` 테이블: RLS Enabled 체크
   - ✅ `salary_history` 테이블: RLS Enabled 체크
   - ✅ `position_history` 테이블: RLS Enabled 체크
   - ✅ `user_roles` 테이블: RLS Enabled 체크

### 2. 정책 확인

1. 각 테이블의 **Policies** 탭에서 정책이 생성되었는지 확인:
   - `employees`: 3개 정책 (조회, 생성/수정, 삭제)
   - `user_roles`: 1개 정책 (조회)
   - `salary_history`: 1개 정책 (전체)
   - `position_history`: 1개 정책 (전체)

---

## ❓ 문제 해결

### 에러: "relation does not exist"
**원인**: 테이블이 아직 생성되지 않음

**해결 방법**:
1. `employees`, `salary_history`, `position_history` 테이블이 존재하는지 확인
2. 테이블이 없다면 먼저 테이블을 생성하세요

### 에러: "permission denied"
**원인**: 권한 부족

**해결 방법**:
1. Supabase 프로젝트의 Owner 권한이 있는지 확인
2. 또는 프로젝트 관리자에게 권한 요청

### 정책이 생성되지 않음
**원인**: 스크립트 실행 중 에러 발생

**해결 방법**:
1. SQL Editor의 에러 메시지 확인
2. 에러가 발생한 부분만 수정하여 다시 실행
3. 또는 각 정책을 개별적으로 생성

---

## 📝 다음 단계

RLS 정책 설정이 완료되면:
1. 관리자 계정 생성: `docs/ADMIN_ACCOUNT_SETUP.md` 참고
2. 테스트 수행: `docs/MANUAL_SETUP_GUIDE.md` 참고

---

**마지막 업데이트**: 2024년

