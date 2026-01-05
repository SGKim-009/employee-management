# 개발자 가이드

인사관리 시스템 개발을 위한 가이드입니다.

---

## 📋 목차

1. [프로젝트 구조](#프로젝트-구조)
2. [개발 환경 설정](#개발-환경-설정)
3. [코딩 컨벤션](#코딩-컨벤션)
4. [주요 기술 스택](#주요-기술-스택)
5. [아키텍처 개요](#아키텍처-개요)
6. [주요 컴포넌트](#주요-컴포넌트)
7. [데이터베이스 스키마](#데이터베이스-스키마)
8. [API 구조](#api-구조)
9. [테스트](#테스트)
10. [배포](#배포)

---

## 프로젝트 구조

```
employee-management/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # 인증 관련 페이지
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/               # 대시보드
│   ├── import/                  # 엑셀 임포트
│   ├── notifications/           # 알림 목록
│   ├── employees/               # 직원 관련
│   │   └── [id]/
│   │       └── files/           # 파일 관리
│   ├── api/                     # API Routes
│   │   └── employees/
│   │       └── check-duplicate/
│   ├── layout.tsx               # 루트 레이아웃
│   ├── page.tsx                 # 메인 페이지
│   └── ...
├── components/                   # React 컴포넌트
│   ├── EmployeeCard.tsx
│   ├── EmployeeForm.tsx
│   ├── EmployeeDetails.tsx
│   ├── Navigation.tsx
│   └── ...
├── lib/                          # 유틸리티 함수
│   ├── supabase.ts              # Supabase 클라이언트
│   ├── employeeService.ts       # 직원 서비스
│   ├── excelService.ts          # 엑셀 연동
│   ├── fileService.ts           # 파일 관리
│   ├── notificationUtils.ts     # 알림 관리
│   ├── reportUtils.ts           # 리포트 생성
│   └── ...
├── types/                        # TypeScript 타입 정의
│   ├── employee.ts
│   └── employee.schema.ts
├── docs/                         # 문서
│   ├── sql/                     # SQL 스크립트
│   └── ...
├── public/                       # 정적 파일
├── .env.local                    # 환경 변수 (로컬)
├── .env.example                  # 환경 변수 예시
├── next.config.ts                # Next.js 설정
├── tailwind.config.ts            # Tailwind CSS 설정
├── tsconfig.json                 # TypeScript 설정
└── package.json                  # 의존성 관리
```

---

## 개발 환경 설정

### 필수 요구사항

- **Node.js**: 18.x 이상
- **npm**: 9.x 이상
- **Git**: 최신 버전

### 초기 설정

1. **저장소 클론**
   ```bash
   git clone <repository-url>
   cd employee-management
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   - `.env.example` 파일을 참고하여 `.env.local` 생성
   - Supabase URL과 Anon Key 설정
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **개발 서버 실행**
   ```bash
   npm run dev
   ```

5. **브라우저에서 확인**
   - http://localhost:3000 접속

### Supabase 설정

1. Supabase 프로젝트 생성
2. SQL 스크립트 실행:
   - `docs/sql/rls_policies.sql`
   - `docs/sql/employee_files_table.sql`
3. Storage 버킷 생성:
   - `employee-profiles` (공개)
   - `employee-documents` (비공개)

자세한 내용은 [Supabase 설정 가이드](./SUPABASE_SETUP_GUIDE.md)를 참고하세요.

---

## 코딩 컨벤션

### TypeScript

- **타입 정의**: 모든 함수와 변수에 타입 명시
- **인터페이스**: `interface` 키워드 사용
- **타입 가드**: `as` 사용 최소화, 타입 가드 함수 활용

```typescript
// 좋은 예
interface Employee {
  id: string;
  name: string;
}

function getEmployee(id: string): Employee | null {
  // ...
}

// 나쁜 예
function getEmployee(id: any): any {
  // ...
}
```

### React 컴포넌트

- **함수 컴포넌트**: 함수형 컴포넌트 사용
- **Props 타입**: `interface`로 정의
- **메모이제이션**: `React.memo`, `useMemo`, `useCallback` 적절히 사용

```typescript
interface EmployeeCardProps {
  employee: Employee;
  onEdit: (id: string) => void;
}

const EmployeeCard = React.memo(({ employee, onEdit }: EmployeeCardProps) => {
  // ...
});
```

### 파일 명명 규칙

- **컴포넌트**: PascalCase (예: `EmployeeCard.tsx`)
- **유틸리티**: camelCase (예: `employeeService.ts`)
- **타입**: camelCase (예: `employee.ts`)
- **상수**: UPPER_SNAKE_CASE (예: `MAX_FILE_SIZE`)

### 코드 구조

- **컴포넌트**: 한 파일에 하나의 컴포넌트
- **함수**: 단일 책임 원칙 준수
- **주석**: 복잡한 로직에만 주석 추가

### 에러 처리

- **try-catch**: 비동기 작업에 필수
- **에러 메시지**: 사용자 친화적인 메시지
- **로깅**: `console.error`로 에러 로깅

```typescript
try {
  const result = await employeeService.create(employee);
  showToast.success('직원이 등록되었습니다.');
} catch (error) {
  console.error('Error creating employee:', error);
  showToast.error('직원 등록에 실패했습니다.');
}
```

---

## 주요 기술 스택

### 프론트엔드

- **Next.js 16.1.1**: React 프레임워크 (App Router)
- **TypeScript**: 타입 안정성
- **Tailwind CSS 4**: 스타일링
- **React Hook Form**: 폼 관리
- **Zod**: 스키마 검증
- **Recharts**: 차트 라이브러리
- **xlsx**: 엑셀 파일 처리
- **Lucide React**: 아이콘

### 백엔드

- **Supabase**: BaaS (Database, Auth, Storage)
- **PostgreSQL**: 데이터베이스
- **Row Level Security (RLS)**: 데이터 보안

### 개발 도구

- **ESLint**: 코드 린팅
- **Prettier**: 코드 포맷팅 (선택)
- **TypeScript**: 타입 체크

---

## 아키텍처 개요

### 클라이언트-서버 구조

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │
       │ HTTP/HTTPS
       │
┌──────▼──────┐
│   Supabase  │
│  (Backend)  │
└─────────────┘
```

### 데이터 흐름

1. **사용자 액션** → React 컴포넌트
2. **컴포넌트** → Service 함수 호출
3. **Service** → Supabase 클라이언트
4. **Supabase** → PostgreSQL/Storage
5. **응답** → 컴포넌트 업데이트

### 상태 관리

- **로컬 상태**: `useState`, `useReducer`
- **서버 상태**: Supabase 실시간 구독
- **전역 상태**: Context API (인증, 테마)

---

## 주요 컴포넌트

### EmployeeCard

직원 카드 컴포넌트

```typescript
<EmployeeCard
  employee={employee}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onView={handleView}
/>
```

### EmployeeForm

직원 등록/수정 폼

```typescript
<EmployeeForm
  employee={employee} // 수정 시
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

### Navigation

네비게이션 바

- 인증 상태 표시
- 역할별 메뉴 표시
- 알림 배지

### ProtectedRoute

보호된 라우트

- 인증 확인
- 역할 기반 접근 제어

---

## 데이터베이스 스키마

### employees 테이블

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY,
  employee_number TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  department TEXT,
  position TEXT,
  hire_date DATE,
  -- ... 기타 필드
);
```

### employee_files 테이블

```sql
CREATE TABLE employee_files (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_path TEXT NOT NULL,
  version_number INTEGER, -- 이력서용
  is_latest_version BOOLEAN, -- 이력서용
  expiry_date DATE, -- 계약서용
  -- ...
);
```

### user_roles 테이블

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('admin', 'hr', 'viewer'))
);
```

자세한 스키마는 `docs/sql/` 폴더를 참고하세요.

---

## API 구조

### Supabase 클라이언트

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Service 레이어

각 도메인별 Service 함수 제공:

- `employeeService.ts`: 직원 CRUD
- `fileService.ts`: 파일 관리
- `excelService.ts`: 엑셀 연동
- `notificationUtils.ts`: 알림 관리

### API Routes

Next.js API Routes 사용:

- `/api/employees/check-duplicate`: 중복 체크

---

## 테스트

### 단위 테스트 (예정)

```bash
npm test
```

### 통합 테스트 (예정)

```bash
npm run test:integration
```

### E2E 테스트 (예정)

```bash
npm run test:e2e
```

현재는 수동 테스트를 권장합니다. 자세한 내용은 [테스트 가이드](./TESTING_GUIDE.md)를 참고하세요.

---

## 배포

### 빌드

```bash
npm run build
```

### 프로덕션 실행

```bash
npm start
```

### Vercel 배포

1. Git 저장소에 푸시
2. Vercel에서 프로젝트 연결
3. 환경 변수 설정
4. 자동 배포

자세한 내용은 [배포 가이드](./DEPLOYMENT_GUIDE.md)를 참고하세요.

---

## 성능 최적화

### 이미지 최적화

- `next/image` 컴포넌트 사용
- Lazy loading 적용

### 코드 스플리팅

- 동적 import 사용
- 라우트별 코드 스플리팅

### React 최적화

- `React.memo` 적용
- `useMemo`, `useCallback` 적절히 사용
- 불필요한 리렌더링 방지

---

## 보안

### Row Level Security (RLS)

- 모든 테이블에 RLS 활성화
- 역할 기반 접근 제어

### 데이터 검증

- 클라이언트: Zod 스키마
- 서버: Supabase RLS 정책

### 환경 변수

- `.env.local`은 Git에 커밋하지 않음
- 프로덕션 환경 변수는 배포 플랫폼에서 설정

---

## 문제 해결

### 일반적인 문제

1. **환경 변수 오류**
   - `.env.local` 파일 확인
   - 환경 변수 이름 확인

2. **빌드 오류**
   - TypeScript 오류 확인
   - 의존성 재설치: `npm install`

3. **Supabase 연결 오류**
   - URL과 Key 확인
   - 네트워크 연결 확인

### 디버깅

- 브라우저 개발자 도구 (F12)
- Supabase 대시보드 로그
- Vercel 배포 로그

---

## 추가 리소스

- [Next.js 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [TypeScript 문서](https://www.typescriptlang.org/docs)
- [React 문서](https://react.dev)

---

**최종 업데이트**: 2024년



