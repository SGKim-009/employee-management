-- ============================================
-- 관리자 역할 부여 스크립트
-- ============================================
-- 이 스크립트는 Supabase SQL Editor에서 실행하세요.
-- 관리자 역할을 부여할 사용자의 이메일을 아래에 입력하세요.

-- ============================================
-- 방법 1: 이메일로 관리자 역할 부여 (권장)
-- ============================================

-- 아래 이메일 주소를 실제 관리자 이메일로 변경하세요
DO $$
DECLARE
  target_email TEXT := 'admin@company.com';  -- 여기에 관리자 이메일 입력
  target_user_id UUID;
BEGIN
  -- 이메일로 사용자 ID 찾기
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION '사용자를 찾을 수 없습니다: %', target_email;
  END IF;
  
  -- user_roles 테이블이 없으면 생성
  CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'hr', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- RLS 활성화
  ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
  
  -- 정책이 없으면 생성
  DROP POLICY IF EXISTS "사용자는 자신의 역할 조회 가능" ON user_roles;
  CREATE POLICY "사용자는 자신의 역할 조회 가능"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
  
  -- 관리자 역할 부여 (이미 있으면 업데이트)
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  
  RAISE NOTICE '관리자 역할이 성공적으로 부여되었습니다: %', target_email;
END $$;

-- ============================================
-- 방법 2: 사용자 ID로 직접 관리자 역할 부여
-- ============================================
-- 아래 주석을 해제하고 실제 user_id를 입력하세요

/*
-- user_roles 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'hr', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 정책이 없으면 생성
DROP POLICY IF EXISTS "사용자는 자신의 역할 조회 가능" ON user_roles;
CREATE POLICY "사용자는 자신의 역할 조회 가능"
ON user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 관리자 역할 부여 (여기에 실제 user_id 입력)
INSERT INTO user_roles (user_id, role)
VALUES ('여기에_실제_user_id_입력', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
*/

-- ============================================
-- 역할 확인
-- ============================================
-- 아래 쿼리로 현재 사용자의 역할을 확인할 수 있습니다

SELECT 
  au.email,
  ur.role,
  ur.created_at
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
ORDER BY ur.created_at DESC;



