# 빠른 시작 가이드

인사관리 시스템을 빠르게 시작하는 방법을 안내합니다.

---

## 🚀 5분 안에 시작하기

### 1단계: 저장소 클론 및 의존성 설치

```bash
# 저장소 클론 (또는 다운로드)
cd employee-management

# 의존성 설치
npm install
```

### 2단계: 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Supabase 프로젝트가 없다면:**
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. Settings > API에서 URL과 Key 복사
3. `.env.local`에 붙여넣기

### 3단계: Supabase 데이터베이스 설정

1. Supabase 대시보드 > **SQL Editor** 열기
2. 다음 파일들을 순서대로 실행:
   - `docs/sql/rls_policies.sql` (RLS 정책)
   - `docs/sql/employee_files_table.sql` (파일 관리 테이블)

**자세한 설정**: [Supabase 설정 가이드](./SUPABASE_SETUP_GUIDE.md) 참고

### 4단계: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

### 5단계: 첫 관리자 계정 생성

1. `/signup` 페이지에서 회원가입
2. Supabase 대시보드 > **SQL Editor**에서 다음 실행:

```sql
-- 이메일을 실제 이메일로 변경
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

---

## ✅ 설정 확인 체크리스트

- [ ] `.env.local` 파일 생성 및 환경 변수 설정
- [ ] Supabase 프로젝트 생성
- [ ] `employees` 테이블 생성 (또는 기존 테이블 확인)
- [ ] `employee_files` 테이블 생성
- [ ] `user_roles` 테이블 생성
- [ ] RLS 정책 적용
- [ ] `employee-profiles` Storage 버킷 생성
- [ ] `employee-documents` Storage 버킷 생성
- [ ] 관리자 계정 역할 부여
- [ ] 개발 서버 실행 성공
- [ ] 로그인 성공
- [ ] 직원 등록 테스트

---

## 🎯 주요 기능 테스트

### 직원 관리
1. **직원 등록**: 메인 페이지 > "새 직원 등록" 버튼
2. **직원 검색**: 상단 검색창에서 이름, 부서, 직급으로 검색
3. **필터링**: 부서, 직급, 입사일 범위로 필터링
4. **정렬**: 이름, 입사일, 급여, 부서별 정렬

### 대시보드
1. 네비게이션 > "대시보드" 클릭
2. 통계 및 차트 확인
3. 리포트 다운로드 (CSV, JSON, 텍스트)

### 알림 시스템
1. 네비게이션 > 알림 아이콘 클릭
2. 자격증 만료, 생일, 계약 갱신 알림 확인

### 파일 관리
1. 직원 상세보기 > "파일 관리" 링크
2. 파일 업로드 테스트
3. 이력서 버전 관리 테스트
4. 계약서 만료일 설정 테스트

### 엑셀 연동
1. 네비게이션 > "엑셀 임포트" 클릭
2. 템플릿 다운로드
3. 엑셀 파일 업로드 및 임포트 테스트
4. 메인 페이지 > "엑셀 다운로드" 버튼으로 익스포트 테스트

---

## 🐛 문제 해결

### 환경 변수 오류

**증상**: "Missing required environment variables" 오류

**해결**:
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일 내용에 공백이나 따옴표가 없는지 확인
3. Supabase URL과 Key가 올바른지 확인
4. 개발 서버 재시작

### 로그인 실패

**증상**: 로그인 후 리다이렉트되지 않음

**해결**:
1. Supabase 대시보드 > Authentication > Users에서 계정 확인
2. 이메일 인증이 필요한 경우 확인 이메일 발송
3. Supabase 프로젝트 설정에서 이메일 인증 비활성화 가능

### 역할이 표시되지 않음

**증상**: 네비게이션에 "역할 없음" 표시

**해결**:
1. `user_roles` 테이블이 생성되었는지 확인
2. SQL로 역할 부여:
```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'your-email@example.com';
```

### 파일 업로드 실패

**증상**: "파일 업로드 실패" 오류

**해결**:
1. `employee-documents` Storage 버킷이 생성되었는지 확인
2. Storage 버킷의 RLS 정책 확인
3. 파일 크기가 제한을 초과하지 않는지 확인

---

## 📚 추가 문서

- [프로젝트 요약](./PROJECT_SUMMARY.md) - 전체 기능 목록
- [Supabase 설정 가이드](./SUPABASE_SETUP_GUIDE.md) - 상세 설정 방법
- [배포 가이드](./DEPLOYMENT_GUIDE.md) - 프로덕션 배포
- [개발 작업 목록](../TASK.md) - 전체 작업 목록

---

## 💡 팁

1. **개발 환경**: `.env.local`은 Git에 커밋하지 마세요 (이미 `.gitignore`에 포함됨)
2. **프로덕션 환경**: Vercel 배포 시 환경 변수를 Vercel 대시보드에서 설정하세요
3. **데이터베이스 백업**: Supabase 대시보드 > Database > Backups에서 정기 백업 설정 가능
4. **성능 최적화**: 이미지 최적화, 코드 스플리팅이 이미 적용되어 있습니다

---

## 🎉 시작 완료!

모든 설정이 완료되었다면, 이제 인사관리 시스템을 사용할 수 있습니다!

**다음 단계**:
- 직원 정보 등록
- 대시보드 확인
- 알림 기능 테스트
- 파일 관리 기능 사용
- 엑셀 연동 테스트

문제가 발생하면 [문제 해결](#-문제-해결) 섹션을 참고하거나 문서를 확인하세요.




