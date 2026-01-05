# 환경별 설정 가이드

인사관리 시스템의 개발, 스테이징, 프로덕션 환경별 설정 가이드입니다.

---

## 📋 목차

1. [환경 개요](#환경-개요)
2. [환경 변수 파일](#환경-변수-파일)
3. [개발 환경 설정](#개발-환경-설정)
4. [스테이징 환경 설정](#스테이징-환경-설정)
5. [프로덕션 환경 설정](#프로덕션-환경-설정)
6. [환경 변수 우선순위](#환경-변수-우선순위)
7. [배포 플랫폼별 설정](#배포-플랫폼별-설정)

---

## 환경 개요

### 개발 환경 (Development)

- **목적**: 로컬 개발 및 테스트
- **환경 변수 파일**: `.env.local` 또는 `.env.development.local`
- **실행 방법**: `npm run dev`
- **특징**: 
  - 핫 리로드 지원
  - 상세한 에러 메시지
  - 개발 도구 활성화

### 스테이징 환경 (Staging)

- **목적**: 배포 전 최종 테스트
- **환경 변수 파일**: 배포 플랫폼에서 설정
- **실행 방법**: 배포 플랫폼에서 자동 실행
- **특징**:
  - 프로덕션과 유사한 환경
  - 실제 데이터베이스 사용 가능
  - 테스트 데이터 사용

### 프로덕션 환경 (Production)

- **목적**: 실제 서비스 운영
- **환경 변수 파일**: 배포 플랫폼에서 설정
- **실행 방법**: 배포 플랫폼에서 자동 실행
- **특징**:
  - 최적화된 빌드
  - 에러 로깅
  - 성능 모니터링

---

## 환경 변수 파일

### Next.js 환경 변수 파일 우선순위

1. `.env.local` (모든 환경, Git에 커밋하지 않음)
2. `.env.development.local` (개발 환경)
3. `.env.production.local` (프로덕션 환경)
4. `.env.development` (개발 환경, Git에 커밋 가능)
5. `.env.production` (프로덕션 환경, Git에 커밋 가능)
6. `.env` (모든 환경, Git에 커밋 가능)

**권장**: `.env.local` 파일만 사용 (보안상 안전)

### 파일 구조 예시

```
employee-management/
├── .env.local              # 로컬 개발용 (Git에 커밋하지 않음)
├── .env.example            # 예시 파일 (Git에 커밋)
├── .env.development        # 개발 환경 기본값 (선택)
├── .env.production         # 프로덕션 환경 기본값 (선택)
└── ...
```

---

## 개발 환경 설정

### 1. `.env.local` 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성합니다:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
```

### 2. 개발 서버 실행

```bash
npm run dev
```

### 3. 환경 변수 확인

브라우저 콘솔에서 환경 변수가 올바르게 로드되었는지 확인:

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
```

**참고**: `NEXT_PUBLIC_` 접두사가 있는 변수만 클라이언트에서 접근 가능합니다.

---

## 스테이징 환경 설정

### Vercel 스테이징 환경

1. Vercel 대시보드 > 프로젝트 > **Settings** > **Environments**
2. **Preview** 환경 선택
3. 환경 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`: 스테이징 Supabase 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 스테이징 Supabase Anon Key

### 스테이징 브랜치 설정

`.github/workflows/deploy.yml`에서 스테이징 브랜치 추가:

```yaml
on:
  push:
    branches: [ main, staging ]  # staging 브랜치 추가
```

### 스테이징 Supabase 프로젝트

- 별도의 Supabase 프로젝트 생성 권장
- 또는 프로덕션 프로젝트의 별도 스키마 사용

---

## 프로덕션 환경 설정

### Vercel 프로덕션 환경

1. Vercel 대시보드 > 프로젝트 > **Settings** > **Environments**
2. **Production** 환경 선택
3. 환경 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`: 프로덕션 Supabase 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 프로덕션 Supabase Anon Key

### 프로덕션 Supabase 프로젝트

- 프로덕션 전용 Supabase 프로젝트 사용
- 백업 설정 활성화
- 모니터링 활성화

---

## 환경 변수 우선순위

### Next.js 빌드 시

1. `.env.production.local` (최우선)
2. `.env.production`
3. `.env.local`
4. `.env`

### 개발 서버 실행 시

1. `.env.development.local` (최우선)
2. `.env.development`
3. `.env.local`
4. `.env`

### 배포 플랫폼

배포 플랫폼(Vercel 등)에서 설정한 환경 변수가 파일보다 우선합니다.

---

## 배포 플랫폼별 설정

### Vercel

#### 환경별 환경 변수 설정

1. Vercel 대시보드 > 프로젝트 > **Settings** > **Environment Variables**
2. 각 환경별로 변수 추가:
   - **Production**: 프로덕션 환경
   - **Preview**: 스테이징/프리뷰 환경
   - **Development**: 개발 환경 (로컬)

#### 환경 변수 추가 방법

1. **Name**: 환경 변수 이름 (예: `NEXT_PUBLIC_SUPABASE_URL`)
2. **Value**: 환경 변수 값
3. **Environment**: 적용할 환경 선택
   - Production
   - Preview
   - Development

#### Vercel CLI로 환경 변수 설정

```bash
# 프로덕션 환경 변수 추가
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# 프리뷰 환경 변수 추가
vercel env add NEXT_PUBLIC_SUPABASE_URL preview

# 개발 환경 변수 추가
vercel env add NEXT_PUBLIC_SUPABASE_URL development
```

### Netlify

1. Netlify 대시보드 > 프로젝트 > **Site settings** > **Environment variables**
2. 환경별 변수 추가:
   - **Production**: 프로덕션
   - **Deploy previews**: 프리뷰
   - **Branch deploys**: 브랜치 배포

### 자체 서버

#### `.env.production` 파일 사용

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
```

#### 환경 변수 직접 설정

```bash
# Linux/Mac
export NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
npm run build
npm start

# Windows (PowerShell)
$env:NEXT_PUBLIC_SUPABASE_URL="https://your-prod-project.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY="your-prod-anon-key"
npm run build
npm start
```

---

## 환경별 Supabase 프로젝트 설정

### 개발 환경

- **프로젝트**: 개발 전용 Supabase 프로젝트
- **데이터**: 테스트 데이터
- **RLS 정책**: 개발용 정책

### 스테이징 환경

- **프로젝트**: 스테이징 전용 Supabase 프로젝트
- **데이터**: 스테이징 데이터 (프로덕션 복사본)
- **RLS 정책**: 프로덕션과 동일

### 프로덕션 환경

- **프로젝트**: 프로덕션 Supabase 프로젝트
- **데이터**: 실제 운영 데이터
- **RLS 정책**: 프로덕션 정책
- **백업**: 자동 백업 활성화

---

## 환경 변수 체크리스트

### 개발 환경

- [ ] `.env.local` 파일 생성
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
- [ ] 개발 서버 실행 확인
- [ ] 환경 변수 로드 확인

### 스테이징 환경

- [ ] Vercel Preview 환경 변수 설정
- [ ] 스테이징 Supabase 프로젝트 생성
- [ ] 스테이징 브랜치 설정
- [ ] 배포 테스트
- [ ] 환경 변수 확인

### 프로덕션 환경

- [ ] Vercel Production 환경 변수 설정
- [ ] 프로덕션 Supabase 프로젝트 생성
- [ ] RLS 정책 설정
- [ ] 백업 설정
- [ ] 모니터링 설정
- [ ] 배포 테스트
- [ ] 환경 변수 확인

---

## 보안 주의사항

### 절대 Git에 커밋하지 말 것

- `.env.local`
- `.env.development.local`
- `.env.production.local`

### Git에 커밋 가능한 파일

- `.env.example` (예시 값만 포함)
- `.env.development` (공개 가능한 기본값만)
- `.env.production` (공개 가능한 기본값만)

### 환경 변수 관리

1. **로컬**: `.env.local` 파일 사용
2. **배포 플랫폼**: 플랫폼의 환경 변수 설정 사용
3. **팀 공유**: `.env.example` 파일 업데이트

---

## 문제 해결

### 환경 변수가 적용되지 않음

1. **파일 이름 확인**: `.env.local`이 정확한지 확인
2. **위치 확인**: 프로젝트 루트에 있는지 확인
3. **서버 재시작**: 환경 변수 변경 후 서버 재시작
4. **캐시 삭제**: `.next` 폴더 삭제 후 재빌드

### 배포 환경에서 환경 변수 오류

1. **배포 플랫폼 설정 확인**: Vercel/Netlify에서 환경 변수 확인
2. **환경 선택 확인**: Production/Preview 환경 확인
3. **재배포**: 환경 변수 변경 후 재배포

### 환경별로 다른 값이 필요함

1. **로컬**: `.env.local` 사용
2. **스테이징**: Vercel Preview 환경 변수 사용
3. **프로덕션**: Vercel Production 환경 변수 사용

---

## 참고 자료

- [Next.js 환경 변수 문서](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel 환경 변수 설정](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase 프로젝트 관리](https://supabase.com/docs/guides/platform/managing-projects)

---

**최종 업데이트**: 2024년


