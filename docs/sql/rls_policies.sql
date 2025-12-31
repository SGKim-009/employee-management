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

