# Sentry 설정 가이드

이 문서는 Sentry를 프로젝트에 설정하는 단계별 가이드를 제공합니다.

## 📋 목차

1. [Sentry 계정 생성](#sentry-계정-생성)
2. [패키지 설치](#패키지-설치)
3. [Sentry 초기화](#sentry-초기화)
4. [환경 변수 설정](#환경-변수-설정)
5. [ErrorBoundary 연동](#errorboundary-연동)
6. [테스트](#테스트)

---

## Sentry 계정 생성

1. [Sentry](https://sentry.io/)에 가입
2. 새 프로젝트 생성:
   - Platform: **Next.js** 선택
   - Project Name: `employee-management` (또는 원하는 이름)
3. DSN (Data Source Name) 복사 (나중에 사용)

---

## 패키지 설치

```bash
npm install @sentry/nextjs
```

---

## Sentry 초기화

Sentry Wizard를 사용하여 자동 설정:

```bash
npx @sentry/wizard@latest -i nextjs
```

이 명령어는 다음을 수행합니다:
- `sentry.client.config.ts` 생성
- `sentry.server.config.ts` 생성
- `sentry.edge.config.ts` 생성
- `next.config.js` 업데이트

---

## 환경 변수 설정

`.env.local` 파일에 추가:

```env
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
SENTRY_ORG=your-org-name
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token
```

**참고:**
- DSN은 Sentry 프로젝트 설정에서 확인
- Auth Token은 Sentry → Settings → Account → Auth Tokens에서 생성

---

## ErrorBoundary 연동

`components/ErrorBoundary.tsx` 수정:

```typescript
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Sentry에 에러 리포트 (프로덕션 환경에서만)
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          errorBoundary: true,
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="text-red-500" size={64} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">오류가 발생했습니다</h1>
            <p className="text-gray-600 mb-6">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>
            {this.state.error && process.env.NODE_ENV === 'development' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-red-800 mb-2">에러 상세:</p>
                <p className="text-xs text-red-700 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                페이지 새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## API 라우트 에러 추적

API 라우트에서도 에러를 추적할 수 있습니다:

`app/api/employees/route.ts` 예시:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { employeeService } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const employees = await employeeService.getAll();
    return NextResponse.json(employees);
  } catch (error) {
    // Sentry에 에러 리포트
    Sentry.captureException(error, {
      tags: {
        api_route: '/api/employees',
        method: 'GET',
      },
    });
    
    return NextResponse.json(
      { error: '직원 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
```

---

## 테스트

### 1. 프로덕션 빌드 생성

```bash
npm run build
```

### 2. 프로덕션 서버 실행

```bash
npm start
```

### 3. 에러 발생 테스트

1. `/test/error-boundary` 페이지 접속
2. "에러 발생시키기" 버튼 클릭
3. Sentry 대시보드에서 에러 리포트 확인

### 4. Sentry 대시보드 확인

1. [Sentry 대시보드](https://sentry.io/) 접속
2. 프로젝트 선택
3. Issues 탭에서 에러 확인
4. 에러 상세 정보 확인:
   - 에러 메시지
   - 스택 트레이스
   - 사용자 정보
   - 브라우저 정보
   - 발생 빈도

---

## 추가 설정

### Source Maps 업로드

프로덕션 빌드에서 소스맵을 업로드하여 더 나은 에러 추적:

```bash
npx @sentry/wizard@latest -i nextjs
```

또는 수동 설정:

```bash
npm install --save-dev @sentry/cli
```

`package.json`에 스크립트 추가:

```json
{
  "scripts": {
    "sentry:sourcemaps": "sentry-cli sourcemaps inject --org=your-org --project=your-project .next && sentry-cli sourcemaps upload --org=your-org --project=your-project .next"
  }
}
```

---

## 알림 설정

Sentry에서 알림을 설정할 수 있습니다:

1. Settings → Alerts
2. 새 Alert Rule 생성
3. 조건 설정 (예: 에러 발생 빈도)
4. 알림 채널 선택 (이메일, Slack 등)

---

## ✅ 체크리스트

- [ ] Sentry 계정 생성
- [ ] 프로젝트 생성 및 DSN 복사
- [ ] 패키지 설치
- [ ] Sentry 초기화
- [ ] 환경 변수 설정
- [ ] ErrorBoundary에 Sentry 연동
- [ ] API 라우트 에러 추적 설정
- [ ] 프로덕션 빌드 및 테스트
- [ ] Sentry 대시보드에서 에러 확인
- [ ] 알림 설정 (선택)

---

**마지막 업데이트:** 2024년



