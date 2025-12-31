# 인사관리 시스템 (Employee Management System)

Supabase와 Next.js로 구축한 직원 관리 시스템입니다.

## 주요 기능

- ✅ 직원 정보 관리 (CRUD)
- ✅ 인증 시스템 (Supabase Auth)
- ✅ 역할 기반 접근 제어 (RBAC)
- ✅ 급여 및 인사 변동 이력 관리
- ✅ 자격증 및 경력 관리
- ✅ 프로필 이미지 업로드
- ✅ 검색 및 필터링
- ✅ 반응형 디자인

## 기술 스택

- **프레임워크**: Next.js 16 (App Router)
- **언어**: TypeScript
- **백엔드**: Supabase (Database, Auth, Storage)
- **스타일링**: Tailwind CSS
- **폼 관리**: React Hook Form + Zod
- **알림**: react-hot-toast

## 시작하기

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**자세한 설정 방법**: [환경 변수 설정 가이드](./docs/ENV_SETUP.md)를 참고하세요.

**빠른 설정**:
1. `.env.example` 파일을 복사하여 `.env.local` 생성
2. Supabase 대시보드 > Settings > API에서 값 확인
3. `.env.local`에 실제 값 입력

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 4. Supabase 설정

1. Supabase 프로젝트 생성
2. `docs/sql/rls_policies.sql` 스크립트를 SQL Editor에서 실행
3. `docs/ADMIN_ACCOUNT_SETUP.md`를 참고하여 관리자 계정 생성

## 테스트 페이지

다음 테스트 페이지를 통해 주요 기능을 테스트할 수 있습니다:

- **에러 바운더리 테스트**: `/test/error-boundary`
- **서버 사이드 검증 API 테스트**: `/test/api-validation`

자세한 테스트 가이드는 [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)를 참고하세요.

## 문서

- [**수동 설정 가이드**](./docs/MANUAL_SETUP_GUIDE.md) ⭐ **시작하기 전 필수 읽기**
- [**배포 가이드**](./docs/DEPLOYMENT_GUIDE.md) 🚀 **배포하려면 여기를 확인하세요**
- [**다른 PC에서 작업하기**](./docs/MULTI_PC_SETUP.md) 💻 **여러 PC에서 코드 편집하려면**
- [**RLS 정책 설정 빠른 가이드**](./docs/QUICK_START_RLS.md) ⚡ **RLS 설정만 빠르게 하려면**
- [보안 설정 가이드](./docs/SECURITY_SETUP.md)
- [관리자 계정 설정](./docs/ADMIN_ACCOUNT_SETUP.md)
- [테스트 가이드](./docs/TESTING_GUIDE.md)
- [Phase 1 완료 요약](./docs/PHASE1_SUMMARY.md)
- [개발 작업 목록](./TASK.md)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
