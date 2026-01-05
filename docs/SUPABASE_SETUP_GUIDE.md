# Supabase 설정 가이드

이 문서는 인사관리 시스템의 Supabase 백엔드 설정 방법을 안내합니다.

---

## 📋 목차

1. [기본 설정](#기본-설정)
2. [데이터베이스 테이블 생성](#데이터베이스-테이블-생성)
3. [Storage 버킷 생성](#storage-버킷-생성)
4. [RLS 정책 설정](#rls-정책-설정)
5. [사용자 역할 설정](#사용자-역할-설정)

---

## 기본 설정

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: employee-management (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (저장해두세요!)
   - **Region**: 가장 가까운 리전 선택
4. 프로젝트 생성 완료 대기 (약 2분)

### 2. 환경 변수 확인

프로젝트 생성 후, 다음 정보를 확인하세요:

1. Supabase 대시보드 > **Settings** > **API**
2. 다음 값들을 복사:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. `.env.local` 파일에 설정:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 데이터베이스 테이블 생성

### 1. 기본 테이블 생성

Supabase 대시보드 > **SQL Editor**에서 다음 스크립트를 실행하세요:

#### employees 테이블

```sql
-- employees 테이블이 이미 있다면 이 단계를 건너뛰세요
-- 테이블이 없다면 기본 employees 테이블을 먼저 생성해야 합니다
```

#### employee_files 테이블 생성/업데이트

`docs/sql/employee_files_table.sql` 파일의 내용을 SQL Editor에서 실행하세요.

**중요**: 기존 `employee_files` 테이블이 있다면, 다음 ALTER 문으로 필드를 추가하세요:

```sql
-- 버전 관리 필드 추가 (이력서용)
ALTER TABLE employee_files 
ADD COLUMN IF NOT EXISTS version_number INTEGER;

ALTER TABLE employee_files 
ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true;

-- 계약서 만료일 필드 추가
ALTER TABLE employee_files 
ADD COLUMN IF NOT EXISTS expiry_date DATE;
```

### 2. 인덱스 생성

```sql
-- 이미 생성되어 있다면 건너뛰세요
CREATE INDEX IF NOT EXISTS idx_employee_files_employee_id ON employee_files(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_files_file_type ON employee_files(file_type);
CREATE INDEX IF NOT EXISTS idx_employee_files_uploaded_at ON employee_files(uploaded_at DESC);
```

---

## Storage 버킷 생성

### 1. 프로필 이미지 버킷 (`employee-profiles`)

1. Supabase 대시보드 > **Storage** 이동
2. "Create a new bucket" 클릭
3. 설정:
   - **Name**: `employee-profiles`
   - **Public bucket**: ✅ 체크 (공개 버킷)
   - **File size limit**: 5MB (또는 원하는 크기)
   - **Allowed MIME types**: `image/*` (또는 비워두기)

### 2. 문서 저장소 버킷 (`employee-documents`)

1. "Create a new bucket" 클릭
2. 설정:
   - **Name**: `employee-documents`
   - **Public bucket**: ❌ 체크 해제 (비공개 버킷)
   - **File size limit**: 10MB (또는 원하는 크기)
   - **Allowed MIME types**: 
     - `application/pdf`
     - `image/*`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.*`
     - 또는 비워두기 (모든 타입 허용)

### 3. Storage RLS 정책 설정

#### employee-profiles 버킷 (공개)

공개 버킷이므로 별도 RLS 정책이 필요 없습니다. 하지만 추가 보안을 원한다면:

```sql
-- Storage RLS는 Supabase 대시보드에서 설정하거나
-- 다음 SQL을 실행하세요 (선택사항)

-- 읽기 권한 (모든 인증된 사용자)
CREATE POLICY "인증된 사용자는 프로필 이미지 조회 가능"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'employee-profiles');

-- 업로드 권한 (인증된 사용자)
CREATE POLICY "인증된 사용자는 프로필 이미지 업로드 가능"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee-profiles');
```

#### employee-documents 버킷 (비공개)

```sql
-- 읽기 권한 (인증된 사용자)
CREATE POLICY "인증된 사용자는 문서 조회 가능"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'employee-documents');

-- 업로드 권한 (인증된 사용자)
CREATE POLICY "인증된 사용자는 문서 업로드 가능"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee-documents');

-- 삭제 권한 (인증된 사용자)
CREATE POLICY "인증된 사용자는 문서 삭제 가능"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'employee-documents');
```

---

## RLS 정책 설정

### 1. employees 테이블 RLS

`docs/sql/rls_policies.sql` 파일의 내용을 SQL Editor에서 실행하세요.

### 2. employee_files 테이블 RLS

`docs/sql/employee_files_table.sql` 파일에 포함된 RLS 정책을 확인하고 실행하세요.

---

## 사용자 역할 설정

### 1. user_roles 테이블 생성

```sql
-- 사용자 역할 테이블 생성
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'hr', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- RLS 활성화
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 인증된 사용자는 자신의 역할 조회 가능
CREATE POLICY "사용자는 자신의 역할 조회 가능"
ON user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS 정책: 관리자만 역할 관리 가능 (선택사항)
-- 필요시 추가하세요
```

### 2. 관리자 계정 생성

1. Supabase 대시보드 > **Authentication** > **Users**
2. 사용자 이메일 확인 (또는 새 사용자 생성)
3. SQL Editor에서 다음 실행:

```sql
-- 사용자 ID 확인 (이메일로)
SELECT id, email FROM auth.users WHERE email = 'your-admin-email@example.com';

-- 관리자 역할 부여 (위에서 확인한 user_id 사용)
INSERT INTO user_roles (user_id, role)
VALUES ('user-id-from-above', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';
```

---

## 설정 확인

### 1. 테이블 확인

```sql
-- employees 테이블 확인
SELECT COUNT(*) FROM employees;

-- employee_files 테이블 확인
SELECT COUNT(*) FROM employee_files;

-- user_roles 테이블 확인
SELECT * FROM user_roles;
```

### 2. Storage 버킷 확인

1. Supabase 대시보드 > **Storage**
2. 다음 버킷이 생성되어 있는지 확인:
   - ✅ `employee-profiles`
   - ✅ `employee-documents`

### 3. RLS 정책 확인

```sql
-- employees 테이블 RLS 확인
SELECT * FROM pg_policies WHERE tablename = 'employees';

-- employee_files 테이블 RLS 확인
SELECT * FROM pg_policies WHERE tablename = 'employee_files';
```

---

## 문제 해결

### 테이블이 이미 존재하는 경우

```sql
-- 테이블 존재 여부 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'employee_files'
);

-- 필드 존재 여부 확인
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'employee_files';
```

### Storage 버킷이 보이지 않는 경우

1. Storage 페이지 새로고침
2. 버킷 이름 확인 (대소문자 구분)
3. 다른 프로젝트에 생성되지 않았는지 확인

### RLS 정책 오류

```sql
-- 기존 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'employee_files';

-- 정책 삭제 (필요시)
DROP POLICY IF EXISTS "정책이름" ON employee_files;
```

---

## 다음 단계

설정이 완료되면:

1. ✅ 애플리케이션 재시작 (`npm run dev`)
2. ✅ 로그인 테스트
3. ✅ 직원 등록 테스트
4. ✅ 파일 업로드 테스트
5. ✅ 엑셀 임포트 테스트

---

## 참고 문서

- [Supabase 공식 문서](https://supabase.com/docs)
- [RLS 정책 가이드](./QUICK_START_RLS.md)
- [배포 가이드](./DEPLOYMENT_GUIDE.md)


