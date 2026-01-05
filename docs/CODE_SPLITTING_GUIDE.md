# 코드 스플리팅 가이드

이 문서는 프로젝트의 코드 스플리팅 구현 및 확인 방법을 안내합니다.

## 📋 목차

1. [코드 스플리팅 개요](#코드-스플리팅-개요)
2. [동적 Import 구현](#동적-import-구현)
3. [라우트별 코드 스플리팅 확인](#라우트별-코드-스플리팅-확인)
4. [번들 크기 분석](#번들-크기-분석)

---

## 코드 스플리팅 개요

### 현재 구현 상태

- ✅ 동적 import 적용 (모달, 폼 컴포넌트)
  - EmployeeForm
  - EmployeeDetails
  - EmployeePrintCard
  - EmployeeCard
- ✅ Next.js App Router의 자동 코드 스플리팅 활용

---

## 동적 Import 구현

### 현재 사용 중인 동적 Import

#### 1. EmployeeForm

```typescript
const EmployeeForm = dynamic(() => import('@/components/EmployeeForm'), {
  ssr: false,
});
```

**효과:**
- ✅ 초기 번들에서 제외
- ✅ 모달이 열릴 때만 로드
- ✅ SSR 비활성화 (클라이언트 전용)

#### 2. EmployeeDetails

```typescript
const EmployeeDetails = dynamic(() => import('@/components/EmployeeDetails'), {
  ssr: false,
});
```

#### 3. EmployeePrintCard

```typescript
const EmployeePrintCard = dynamic(() => import('@/components/EmployeePrintCard'), {
  ssr: false,
});
```

#### 4. EmployeeCard

```typescript
const EmployeeCard = dynamic(() => import('@/components/EmployeeCard'), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64" />,
});
```

**효과:**
- ✅ 로딩 스켈레톤 표시
- ✅ 초기 로드 시 필요한 컴포넌트만 로드

---

## 라우트별 코드 스플리팅 확인

### Next.js App Router의 자동 코드 스플리팅

Next.js App Router는 자동으로 각 라우트를 별도의 청크로 분리합니다.

### 현재 라우트 구조

```
app/
├── page.tsx                    # 메인 페이지
├── login/page.tsx              # 로그인 페이지
├── signup/page.tsx             # 회원가입 페이지
├── dashboard/page.tsx          # 대시보드
├── resigned/page.tsx           # 퇴사자 페이지
├── notifications/page.tsx      # 알림 페이지
├── employees/[id]/files/      # 파일 관리
└── test/                       # 테스트 페이지
```

### 확인 방법

#### 1. 빌드 결과 확인

**절차:**
1. `npm run build` 실행
2. `.next` 폴더의 빌드 결과 확인

**예상 결과:**
- ✅ 각 페이지가 별도의 청크 파일로 생성됨
- ✅ 공통 코드는 별도 청크로 분리됨
- ✅ 동적 import된 컴포넌트가 별도 청크로 분리됨

#### 2. Network 탭에서 확인

**절차:**
1. 브라우저 개발자 도구의 Network 탭 열기
2. 각 페이지로 이동
3. 로드되는 JavaScript 파일 확인

**예상 결과:**
- ✅ 각 페이지별로 다른 JavaScript 파일 로드
- ✅ 공통 코드는 한 번만 로드
- ✅ 동적 import된 컴포넌트는 필요 시에만 로드

#### 3. 빌드 로그 확인

**절차:**
1. `npm run build` 실행
2. 빌드 로그에서 청크 정보 확인

**예상 결과:**
```
Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         85.3 kB
├ ○ /dashboard                           8.1 kB         88.2 kB
├ ○ /login                               2.5 kB         82.6 kB
├ ○ /resigned                            4.8 kB         84.9 kB
└ ○ /notifications                       6.3 kB         86.4 kB
```

---

## 번들 크기 분석

### 1. 빌드 결과 분석

**절차:**
1. `npm run build` 실행
2. 빌드 로그에서 각 라우트의 크기 확인

**예상 결과:**
- ✅ 각 라우트의 First Load JS가 합리적 (예: 100KB 이하)
- ✅ 공통 코드가 효율적으로 공유됨
- ✅ 동적 import된 컴포넌트가 초기 번들에서 제외됨

### 2. 번들 크기 최적화 확인

**확인 항목:**
- ✅ 불필요한 라이브러리 제거
- ✅ Tree shaking이 작동함
- ✅ 중복 코드가 없음

### 3. 동적 Import 효과 확인

**절차:**
1. 빌드 전후 비교
2. 동적 import 적용 전후 번들 크기 비교

**예상 결과:**
- ✅ 동적 import 적용으로 초기 번들 크기 감소
- ✅ 필요한 시점에만 컴포넌트 로드
- ✅ 초기 로드 시간 단축

---

## 코드 스플리팅 체크리스트

### 구현 확인
- [ ] 주요 모달 컴포넌트가 동적 import로 로드되는가?
- [ ] 로딩 상태가 적절히 표시되는가?
- [ ] SSR이 필요한 컴포넌트는 제대로 처리되는가?

### 성능 확인
- [ ] 초기 번들 크기가 합리적인가?
- [ ] 각 라우트가 별도 청크로 분리되는가?
- [ ] 공통 코드가 효율적으로 공유되는가?

### 사용자 경험 확인
- [ ] 동적 import된 컴포넌트 로드 시 로딩 표시가 적절한가?
- [ ] 로드 시간이 사용자 경험을 해치지 않는가?
- [ ] 모든 기능이 정상 작동하는가?

---

## 📝 참고사항

### Next.js App Router의 자동 코드 스플리팅

Next.js App Router는 다음을 자동으로 수행합니다:
- 각 `page.tsx`를 별도 청크로 분리
- 공통 레이아웃과 컴포넌트를 별도 청크로 분리
- 동적 import를 별도 청크로 분리

### 동적 Import 사용 시 주의사항

- `ssr: false` 옵션은 클라이언트 전용 컴포넌트에만 사용
- 로딩 상태를 적절히 표시해야 함
- SEO가 중요한 컴포넌트는 SSR 유지

---

**마지막 업데이트:** 2024년


