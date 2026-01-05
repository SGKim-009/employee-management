# 인사관리 시스템 (Employee Management System)

Supabase와 Next.js로 구축한 직원 관리 시스템입니다.

## 주요 기능

### 핵심 기능
- ✅ 직원 정보 관리 (CRUD)
- ✅ 인증 시스템 (Supabase Auth)
- ✅ 역할 기반 접근 제어 (RBAC)
- ✅ 급여 및 인사 변동 이력 관리
- ✅ 자격증 및 경력 관리
- ✅ 프로필 이미지 업로드

### UI/UX
- ✅ 반응형 디자인
- ✅ 다크 모드 지원
- ✅ 고급 검색 및 필터링
- ✅ 필터 프리셋 저장
- ✅ 무한 스크롤
- ✅ 성능 최적화

### 대시보드 및 분석
- ✅ 통계 대시보드
- ✅ 차트/그래프 (부서별, 직급별, 입사 추이, 급여 분포)
- ✅ 리포트 생성 (CSV, JSON, 텍스트)

### 알림 시스템
- ✅ 자격증 만료 알림
- ✅ 계약 갱신 알림
- ✅ 생일 알림
- ✅ 알림 목록 페이지

### 파일 관리
- ✅ 문서 업로드/다운로드
- ✅ 이력서 버전 관리
- ✅ 계약서 만료일 관리

### 엑셀 연동
- ✅ 엑셀 파일 임포트 (일괄 직원 등록)
- ✅ 엑셀 템플릿 제공
- ✅ 직원 목록 엑셀 다운로드

## 기술 스택

- **프레임워크**: Next.js 16.1.1 (App Router)
- **언어**: TypeScript
- **백엔드**: Supabase (Database, Auth, Storage)
- **스타일링**: Tailwind CSS 4
- **폼 관리**: React Hook Form + Zod
- **차트**: Recharts
- **엑셀**: xlsx
- **아이콘**: Lucide React
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

- [**빠른 시작 가이드**](./docs/QUICK_START.md) ⚡ **5분 안에 시작하기**
- [**프로젝트 요약**](./docs/PROJECT_SUMMARY.md) 📊 **전체 기능 및 진행 현황**
- [**Supabase 설정 가이드**](./docs/SUPABASE_SETUP_GUIDE.md) 🗄️ **데이터베이스 및 Storage 설정**
- [**배포 가이드**](./docs/DEPLOYMENT_GUIDE.md) 🚀 **프로덕션 배포**
- [**재배포 가이드**](./docs/REDEPLOYMENT_GUIDE.md) 🔄 **재배포 방법**
- [**다중 PC 개발 환경 설정**](./docs/MULTI_PC_SETUP.md) 💻 **여러 PC에서 코드 편집**
- [개발 작업 목록](./TASK.md) - 전체 작업 목록 및 진행률

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
