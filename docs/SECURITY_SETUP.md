# 보안 설정 가이드

이 문서는 인사관리 시스템의 보안 강화를 위한 Supabase 설정 가이드를 제공합니다.

## 1. Row Level Security (RLS) 정책 설정

### 1.1 employees 테이블 RLS 활성화

1. Supabase 대시보드에서 `employees` 테이블로 이동
2. "Enable RLS" 버튼 클릭

### 1.2 읽기 권한 정책 (인증된 사용자만)

```sql
-- 인증된 사용자는 모든 직원 정보를 읽을 수 있음
CREATE POLICY "인증된 사용자는 직원 정보 조회 가능"
ON employees
FOR SELECT
TO authenticated
USING (true);
```

### 1.3 쓰기 권한 정책 (인증된 사용자만)

```sql
-- 인증된 사용자는 직원 정보를 생성/수정할 수 있음
CREATE POLICY "인증된 사용자는 직원 정보 생성/수정 가능"
ON employees
FOR INSERT, UPDATE
TO authenticated
WITH CHECK (true);
```

### 1.4 삭제 권한 정책 (관리자만)

먼저 사용자 역할 테이블을 생성해야 합니다:

```sql
-- 사용자 역할 테이블 생성
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'hr', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 역할을 볼 수 있음
CREATE POLICY "사용자는 자신의 역할 조회 가능"
ON user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

그 다음 employees 테이블의 삭제 정책:

```sql
-- 관리자만 직원 정보를 삭제할 수 있음
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
```

### 1.5 salary_history 테이블 RLS 정책

```sql
-- RLS 활성화
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 급여 이력을 조회/생성/수정 가능
CREATE POLICY "인증된 사용자는 급여 이력 관리 가능"
ON salary_history
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

### 1.6 position_history 테이블 RLS 정책

```sql
-- RLS 활성화
ALTER TABLE position_history ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 인사 이력을 조회/생성/수정 가능
CREATE POLICY "인증된 사용자는 인사 이력 관리 가능"
ON position_history
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

### 1.7 Storage 버킷 RLS 정책

1. Supabase 대시보드에서 Storage > Policies로 이동
2. `employee-profiles` 버킷 선택
3. 다음 정책 추가:

```sql
-- 인증된 사용자는 프로필 이미지를 업로드/조회 가능
CREATE POLICY "인증된 사용자는 프로필 이미지 관리 가능"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'employee-profiles')
WITH CHECK (bucket_id = 'employee-profiles');
```

## 2. 인증 시스템 설정

### 2.1 Supabase Auth 활성화

1. Supabase 대시보드 > Authentication > Settings
2. "Enable Email Signup" 활성화
3. "Enable Email Confirmations" 설정 (선택)

### 2.2 이메일 템플릿 커스터마이징 (선택)

Authentication > Email Templates에서 이메일 템플릿을 커스터마이징할 수 있습니다.

## 3. 역할 기반 접근 제어 (RBAC)

### 3.1 초기 관리자 계정 생성

첫 번째 사용자를 관리자로 설정하는 함수:

```sql
-- 함수: 첫 번째 사용자를 자동으로 관리자로 설정
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거: 새 사용자 생성 시 자동 실행
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3.2 역할 확인 함수

```sql
-- 사용자의 역할을 반환하는 함수
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
```

## 4. 환경 변수 설정

`.env.local` 파일에 다음 변수들이 설정되어 있는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 5. 테스트 체크리스트

- [ ] 비인증 사용자가 데이터에 접근할 수 없음
- [ ] 인증된 사용자가 직원 정보를 조회/생성/수정할 수 있음
- [ ] 관리자만 직원 정보를 삭제할 수 있음
- [ ] 각 역할(admin, hr, viewer)에 따라 권한이 올바르게 적용됨
- [ ] Storage 버킷에 인증 없이 접근할 수 없음

## 참고사항

- RLS 정책은 즉시 적용됩니다
- 정책을 수정한 후에는 테스트를 반드시 수행하세요
- 프로덕션 환경에서는 더 엄격한 정책을 적용하는 것을 권장합니다




