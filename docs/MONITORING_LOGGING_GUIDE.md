# 모니터링 및 로깅 가이드

이 문서는 프로젝트의 모니터링 및 로깅 설정 방법을 안내합니다.

## 📋 목차

1. [에러 추적 (Sentry)](#에러-추적-sentry)
2. [성능 모니터링](#성능-모니터링)
3. [사용자 분석 (Google Analytics)](#사용자-분석-google-analytics)

---

## 에러 추적 (Sentry)

### 개요

Sentry는 실시간 에러 추적 및 모니터링 서비스입니다. 프로덕션 환경에서 발생하는 에러를 자동으로 수집하고 알림을 제공합니다.

### 설치 및 설정

#### 1. Sentry 계정 생성 및 프로젝트 설정

1. [Sentry](https://sentry.io/)에 가입
2. 새 프로젝트 생성 (Next.js 선택)
3. DSN (Data Source Name) 복사

#### 2. 패키지 설치

```bash
npm install @sentry/nextjs
```

#### 3. Sentry 초기화

```bash
npx @sentry/wizard@latest -i nextjs
```

이 명령어는 자동으로:
- `sentry.client.config.ts` 생성
- `sentry.server.config.ts` 생성
- `sentry.edge.config.ts` 생성
- `next.config.js` 업데이트

#### 4. 환경 변수 설정

`.env.local` 파일에 추가:

```env
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token
```

#### 5. ErrorBoundary에 Sentry 연동

`components/ErrorBoundary.tsx` 수정:

```typescript
import * as Sentry from '@sentry/nextjs';

componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  console.error('ErrorBoundary caught an error:', error, errorInfo);
  
  // Sentry에 에러 리포트
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }
}
```

#### 6. API 라우트 에러 추적

`app/api/employees/route.ts` 예시:

```typescript
import * as Sentry from '@sentry/nextjs';

export async function POST(request: Request) {
  try {
    // API 로직
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}
```

### 테스트

1. 프로덕션 빌드 생성: `npm run build`
2. 프로덕션 서버 실행: `npm start`
3. 의도적으로 에러 발생 (예: `/test/error-boundary` 페이지)
4. Sentry 대시보드에서 에러 리포트 확인

---

## 성능 모니터링

### 개요

애플리케이션의 성능을 모니터링하여 느린 쿼리, 느린 API 응답, 렌더링 성능 등을 추적합니다.

### 1. Web Vitals 측정

Next.js는 자동으로 Web Vitals를 측정합니다. 커스텀 리포트를 위해 `app/layout.tsx`에 추가:

```typescript
import { reportWebVitals } from 'next/web-vitals';

export function reportWebVitals(metric: any) {
  // 성능 메트릭을 로깅하거나 분석 서비스로 전송
  console.log(metric);
  
  // 예: Google Analytics로 전송
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}
```

### 2. API 응답 시간 모니터링

`lib/apiLogger.ts` 생성:

```typescript
export function logApiPerformance(
  endpoint: string,
  method: string,
  duration: number,
  status: number
) {
  if (duration > 1000) {
    console.warn(`Slow API call: ${method} ${endpoint} took ${duration}ms`);
    // Sentry에 느린 쿼리 리포트
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureMessage(`Slow API: ${endpoint}`, {
        level: 'warning',
        extra: {
          endpoint,
          method,
          duration,
          status,
        },
      });
    }
  }
}
```

### 3. 데이터베이스 쿼리 모니터링

Supabase 대시보드에서:
1. Database → Logs 메뉴 접속
2. 느린 쿼리 확인
3. 쿼리 최적화

또는 Supabase Edge Functions에서 로깅:

```typescript
const startTime = Date.now();
const { data, error } = await supabase
  .from('employees')
  .select('*');

const duration = Date.now() - startTime;
if (duration > 500) {
  console.warn(`Slow query: ${duration}ms`);
}
```

### 4. React 성능 모니터링

React DevTools Profiler 사용:
1. Chrome 확장 프로그램 설치
2. 개발자 도구 → Profiler 탭
3. 녹화 시작 → 액션 수행 → 녹화 중지
4. 느린 컴포넌트 확인 및 최적화

### 테스트

1. 브라우저 개발자 도구 → Performance 탭
2. 페이지 로드 성능 측정
3. 느린 API 호출 확인
4. Web Vitals 점수 확인 (Lighthouse 사용)

---

## 사용자 분석 (Google Analytics)

### 개요

Google Analytics를 사용하여 사용자 행동을 추적하고 분석합니다.

### 설치 및 설정

#### 1. Google Analytics 계정 생성

1. [Google Analytics](https://analytics.google.com/)에 가입
2. 속성(Property) 생성
3. 측정 ID (G-XXXXXXXXXX) 복사

#### 2. Next.js에 Google Analytics 추가

`app/layout.tsx`에 추가:

```typescript
import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="ko">
      <head>
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### 3. 환경 변수 설정

`.env.local` 파일에 추가:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### 4. 커스텀 이벤트 추적

`lib/analytics.ts` 생성:

```typescript
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// 사용 예시
// trackEvent('click', 'employee', 'add_button');
// trackEvent('submit', 'form', 'employee_form');
```

#### 5. 페이지뷰 추적

`app/page.tsx` 예시:

```typescript
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
        page_path: pathname,
      });
    }
  }, [pathname]);

  return null;
}
```

### 주요 추적 이벤트

- **직원 추가**: `trackEvent('click', 'employee', 'add')`
- **직원 수정**: `trackEvent('click', 'employee', 'edit')`
- **직원 삭제**: `trackEvent('click', 'employee', 'delete')`
- **검색**: `trackEvent('search', 'employee', searchTerm)`
- **필터 적용**: `trackEvent('filter', 'employee', filterType)`
- **엑셀 다운로드**: `trackEvent('download', 'excel', 'employee_list')`

### 테스트

1. Google Analytics 실시간 보고서 확인
2. 이벤트 발생 시 실시간으로 표시되는지 확인
3. 페이지뷰가 정확히 추적되는지 확인

---

## 대안 도구

### 에러 추적
- **LogRocket**: 세션 재생 기능 포함
- **Rollbar**: 간단한 설정
- **Bugsnag**: 모바일 앱 지원

### 성능 모니터링
- **New Relic**: 종합 APM 솔루션
- **Datadog**: 인프라 모니터링 포함
- **Vercel Analytics**: Next.js 통합

### 사용자 분석
- **Mixpanel**: 이벤트 기반 분석
- **Amplitude**: 제품 분석
- **Plausible**: 프라이버시 친화적

---

## ✅ 체크리스트

### 에러 추적
- [ ] Sentry 계정 생성 및 프로젝트 설정
- [ ] Sentry 패키지 설치
- [ ] Sentry 초기화
- [ ] 환경 변수 설정
- [ ] ErrorBoundary에 Sentry 연동
- [ ] API 라우트 에러 추적 설정
- [ ] 테스트: 에러 발생 시 Sentry에 리포트 확인

### 성능 모니터링
- [ ] Web Vitals 측정 설정
- [ ] API 응답 시간 모니터링 구현
- [ ] 데이터베이스 쿼리 모니터링 설정
- [ ] React 성능 모니터링 (DevTools)
- [ ] 테스트: 성능 메트릭 수집 확인

### 사용자 분석
- [ ] Google Analytics 계정 생성
- [ ] Google Analytics 설정
- [ ] 환경 변수 설정
- [ ] 커스텀 이벤트 추적 구현
- [ ] 페이지뷰 추적 설정
- [ ] 테스트: 분석 데이터 수집 확인

---

## 📝 참고사항

### 프라이버시 고려사항

- 사용자 동의 없이 개인정보를 추적하지 않음
- GDPR, CCPA 등 개인정보 보호 규정 준수
- IP 주소 익명화 설정

### 비용 고려사항

- Sentry: 무료 플랜 (5,000 이벤트/월)
- Google Analytics: 무료
- 대안 도구들은 각각 다른 가격 정책

---

**마지막 업데이트:** 2024년



