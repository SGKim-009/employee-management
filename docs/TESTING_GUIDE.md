# 테스트 가이드

이 문서는 인사관리 시스템의 테스트 실행 방법과 테스트 구조를 설명합니다.

## 테스트 구조

### 단위 테스트 (Unit Tests)
- 위치: `lib/__tests__/`, `components/__tests__/`
- 목적: 개별 함수와 컴포넌트의 동작 검증
- 예시:
  - `lib/__tests__/reportUtils.test.ts`: 리포트 유틸리티 함수 테스트
  - `lib/__tests__/notificationUtils.test.ts`: 알림 유틸리티 함수 테스트
  - `components/__tests__/LoadingSpinner.test.tsx`: 로딩 스피너 컴포넌트 테스트

### 통합 테스트 (Integration Tests)
- 위치: `__tests__/api/`, `__tests__/integration/`
- 목적: API 엔드포인트와 서비스 레이어의 통합 동작 검증
- 예시:
  - `__tests__/api/check-duplicate.test.ts`: 중복 확인 API 테스트
  - `__tests__/integration/employeeService.test.ts`: 직원 서비스 통합 테스트

## 테스트 실행

### 단위 테스트 및 통합 테스트

#### 모든 테스트 실행
```bash
npm test
```

#### Watch 모드로 실행 (파일 변경 시 자동 재실행)
```bash
npm run test:watch
```

#### 커버리지 리포트 생성
```bash
npm run test:coverage
```

#### 특정 테스트 파일만 실행
```bash
npm test -- lib/__tests__/reportUtils.test.ts
```

### E2E 테스트 (Playwright)

#### 모든 E2E 테스트 실행
```bash
npm run test:e2e
```

#### UI 모드로 실행 (시각적 테스트 실행)
```bash
npm run test:e2e:ui
```

#### 헤드 모드로 실행 (브라우저 표시)
```bash
npm run test:e2e:headed
```

#### 특정 브라우저만 테스트
```bash
npx playwright test --project=chromium
```

#### Playwright 브라우저 설치 (최초 1회)
```bash
npx playwright install
```

## 테스트 커버리지 목표

현재 목표: **50% 이상**
- Statements: 50%
- Branches: 50%
- Functions: 50%
- Lines: 50%

향후 목표: **70% 이상**

## 통합 테스트 실행 조건

통합 테스트는 실제 Supabase 데이터베이스 연결이 필요합니다. 다음 환경 변수가 설정되어 있어야 합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

환경 변수가 설정되지 않은 경우, 통합 테스트는 자동으로 건너뜁니다 (`it.skip` 사용).

## 테스트 작성 가이드

### 단위 테스트 예시

```typescript
import { formatFileSize } from '../fileService';

describe('fileService', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
    });
  });
});
```

### 컴포넌트 테스트 예시

```typescript
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render loading spinner', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toBeInTheDocument();
  });
});
```

### API 통합 테스트 예시

```typescript
describe('API: /api/employees/check-duplicate', () => {
  it('should return 400 if field is missing', async () => {
    const { POST } = await import('@/app/api/employees/check-duplicate/route');
    const request = createMockRequest({ value: 'test@example.com' });
    
    const result = await POST(request as any);
    expect(result.status).toBe(400);
  });
});
```

## 테스트 모범 사례

1. **테스트는 독립적이어야 함**: 각 테스트는 다른 테스트에 의존하지 않아야 합니다.
2. **명확한 테스트 이름**: 테스트 이름은 무엇을 테스트하는지 명확히 설명해야 합니다.
3. **AAA 패턴**: Arrange (준비), Act (실행), Assert (검증) 패턴을 따르세요.
4. **Mock 사용**: 외부 의존성(API, 데이터베이스)은 Mock으로 대체하세요.
5. **에러 케이스 테스트**: 정상 케이스뿐만 아니라 에러 케이스도 테스트하세요.

## 문제 해결

### 테스트가 실패하는 경우

1. **환경 변수 확인**: `.env.local` 파일에 필요한 환경 변수가 설정되어 있는지 확인하세요.
2. **의존성 확인**: `npm install`을 실행하여 모든 의존성이 설치되었는지 확인하세요.
3. **캐시 정리**: `npm test -- --clearCache`로 Jest 캐시를 정리하세요.

### 커버리지가 낮은 경우

1. **테스트 추가**: 커버리지 리포트를 확인하여 테스트되지 않은 코드를 찾아 테스트를 추가하세요.
2. **중요 코드 우선**: 비즈니스 로직이 있는 코드부터 테스트를 작성하세요.

## 참고 자료

- [Jest 공식 문서](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Next.js 테스팅 가이드](https://nextjs.org/docs/app/building-your-application/testing)
