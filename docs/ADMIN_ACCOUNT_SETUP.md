# 관리자 계정 생성 가이드

이 문서는 인사관리 시스템에 관리자 계정을 생성하는 방법을 안내합니다.

## 방법 1: 회원가입 후 관리자 역할 부여 (권장)

### 1단계: 회원가입

1. 애플리케이션의 `/signup` 페이지로 이동
2. 이메일과 비밀번호를 입력하여 계정 생성
   - 예시:
     - 이메일: `admin@company.com`
     - 비밀번호: `admin123456` (최소 6자 이상)

### 2단계: 사용자 ID 확인

1. Supabase 대시보드 > Authentication > Users로 이동
2. 방금 생성한 이메일 계정을 찾아 `UUID` (user_id) 복사

### 3단계: 관리자 역할 부여

**방법 A: 이메일로 자동 부여 (권장)**

1. Supabase 대시보드 > SQL Editor로 이동
2. `docs/sql/create_admin_role.sql` 파일을 열거나 다음 SQL을 복사하여 실행
3. 이메일 주소를 실제 관리자 이메일로 변경:

```sql
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
  
  -- 관리자 역할 부여
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  
  RAISE NOTICE '관리자 역할이 성공적으로 부여되었습니다: %', target_email;
END $$;
```

**방법 B: 사용자 ID로 직접 부여**

1. Supabase 대시보드 > Authentication > Users에서 사용자 UUID 복사
2. SQL Editor에서 다음 실행 (user_id를 실제 값으로 교체):

```sql
-- user_roles 테이블이 없으면 먼저 생성
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

-- 관리자 역할 부여 (user_id를 실제 값으로 교체)
INSERT INTO user_roles (user_id, role)
VALUES ('여기에_실제_user_id_입력', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

**예시:**
```sql
-- 예를 들어 user_id가 '123e4567-e89b-12d3-a456-426614174000'인 경우
INSERT INTO user_roles (user_id, role)
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

## 방법 2: Supabase 대시보드에서 직접 사용자 생성

### 1단계: 사용자 생성

1. Supabase 대시보드 > Authentication > Users
2. "Add user" 버튼 클릭
3. 이메일과 비밀번호 입력
4. "Auto Confirm User" 체크 (이메일 확인 없이 바로 사용 가능)
5. "Create user" 클릭

### 2단계: 관리자 역할 부여

방법 1의 3단계와 동일하게 SQL Editor에서 관리자 역할 부여

## 방법 3: 첫 번째 사용자를 자동으로 관리자로 설정 (자동화)

첫 번째 사용자가 자동으로 관리자 역할을 받도록 트리거를 설정:

```sql
-- 함수: 첫 번째 사용자를 자동으로 관리자로 설정
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- user_roles 테이블이 비어있으면 (첫 번째 사용자) 관리자로 설정
  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- 그 외의 경우 기본적으로 viewer로 설정
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'viewer');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거: 새 사용자 생성 시 자동 실행
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

이 방법을 사용하면 첫 번째로 회원가입한 사용자가 자동으로 관리자가 됩니다.

## 역할 확인

관리자 역할이 제대로 부여되었는지 확인:

```sql
-- 현재 사용자의 역할 확인
SELECT ur.role, au.email
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'admin@company.com';
```

또는 애플리케이션에서 로그인 후 관리자 권한이 있는지 확인:
- 직원 삭제 버튼이 보이는지 확인
- 새 직원 등록 버튼이 보이는지 확인

## 역할 변경

기존 사용자의 역할을 변경하려면:

```sql
-- 사용자 역할 업데이트
UPDATE user_roles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@company.com'
);
```

## 참고사항

- 관리자(`admin`): 모든 권한 (읽기, 쓰기, 삭제)
- HR(`hr`): 읽기, 쓰기 권한 (삭제 불가)
- Viewer(`viewer`): 읽기 전용 권한

## 문제 해결

### 역할이 표시되지 않는 경우

1. `user_roles` 테이블이 생성되었는지 확인
2. RLS 정책이 올바르게 설정되었는지 확인
3. 브라우저 콘솔에서 에러 메시지 확인
4. Supabase 대시보드에서 데이터가 올바르게 저장되었는지 확인

