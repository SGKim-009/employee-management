# 배포 가이드

이 문서는 인사관리 시스템을 배포하는 방법을 안내합니다.

## 📋 목차

1. [Vercel 배포 (권장)](#1-vercel-배포-권장)
2. [Netlify 배포](#2-netlify-배포)
3. [기타 배포 옵션](#3-기타-배포-옵션)
4. [배포 후 확인사항](#4-배포-후-확인사항)

---

## 1. Vercel 배포 (권장)

Vercel은 Next.js를 만든 회사에서 제공하는 플랫폼으로, Next.js 애플리케이션 배포에 최적화되어 있습니다.

### 1.1 사전 준비

1. **Git 저장소 준비**
   - GitHub, GitLab, 또는 Bitbucket에 프로젝트를 푸시해야 합니다.
   - 아직 Git 저장소가 없다면 [MULTI_PC_SETUP.md](./MULTI_PC_SETUP.md)를 참고하세요.

2. **환경 변수 확인**
   - Supabase URL과 Anon Key를 준비해두세요.
   - Supabase 대시보드 > Settings > API에서 확인할 수 있습니다.

### 1.2 Vercel 배포 단계

#### 단계 1: Vercel 계정 생성

1. [Vercel](https://vercel.com)에 접속
2. **Sign Up** 클릭
3. GitHub, GitLab, 또는 Bitbucket 계정으로 로그인 (권장)

#### 단계 2: 프로젝트 가져오기

1. Vercel 대시보드에서 **Add New...** > **Project** 클릭
2. Git 저장소 선택 (GitHub/GitLab/Bitbucket)
3. 저장소 목록에서 `employee-management` 선택
4. **Import** 클릭

#### 단계 3: 프로젝트 설정

1. **Framework Preset**: Next.js가 자동으로 감지됩니다.
2. **Root Directory**: `.` (기본값 유지)
3. **Build Command**: `npm run build` (기본값)
4. **Output Directory**: `.next` (기본값)
5. **Install Command**: `npm install` (기본값)

#### 단계 4: 환경 변수 설정

**Environment Variables** 섹션에서 다음 변수를 추가하세요:

1. **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Supabase 프로젝트 URL (예: `https://abcdefghijklmnop.supabase.co`)
   - **Environment**: Production, Preview, Development 모두 선택

2. **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Supabase Anon Key
   - **Environment**: Production, Preview, Development 모두 선택

**추가 방법:**
- 각 변수 입력 후 **Add** 클릭
- 또는 **Bulk Edit** 버튼을 클릭하여 한 번에 입력:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  ```

#### 단계 5: 배포 실행

1. **Deploy** 버튼 클릭
2. 배포가 완료될 때까지 대기 (약 2-3분)
3. 배포 완료 후 제공되는 URL로 접속 (예: `https://employee-management.vercel.app`)

### 1.3 자동 배포 설정

Vercel은 Git 저장소와 연결되면 자동으로 배포됩니다:

- **Production**: `main` 또는 `master` 브랜치에 푸시할 때마다 자동 배포
- **Preview**: 다른 브랜치에 푸시할 때마다 프리뷰 URL 생성
- **Pull Request**: PR 생성 시 자동으로 프리뷰 배포

### 1.4 커스텀 도메인 설정 (선택사항)

1. Vercel 대시보드 > 프로젝트 > **Settings** > **Domains**
2. 원하는 도메인 입력 (예: `employee.yourcompany.com`)
3. DNS 설정 안내에 따라 도메인 연결

---

## 2. Netlify 배포

### 2.1 사전 준비

Git 저장소가 필요합니다.

### 2.2 배포 단계

1. [Netlify](https://www.netlify.com)에 로그인
2. **Add new site** > **Import an existing project** 클릭
3. Git 저장소 선택 및 연결
4. **Build settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. **Environment variables** 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. **Deploy site** 클릭

**참고**: Netlify는 Next.js를 지원하지만, 일부 기능(Server Actions 등)은 제한될 수 있습니다.

---

## 3. 기타 배포 옵션

### 3.1 자체 서버 배포

#### 빌드 및 실행

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

#### 환경 변수 설정

서버에서 환경 변수를 설정하세요:

```bash
# Linux/Mac
export NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Windows (PowerShell)
$env:NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

또는 `.env.production` 파일을 사용할 수 있습니다.

#### PM2로 실행 (권장)

```bash
# PM2 설치
npm install -g pm2

# 애플리케이션 실행
pm2 start npm --name "employee-management" -- start

# 자동 시작 설정
pm2 startup
pm2 save
```

### 3.2 Docker 배포

`Dockerfile` 예시:

```dockerfile
FROM node:20-alpine AS base

# 의존성 설치
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 빌드
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 실행
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

`next.config.ts`에 다음 설정 추가:

```typescript
output: 'standalone',
```

### 3.3 클라우드 플랫폼

- **AWS**: AWS Amplify, Elastic Beanstalk, EC2
- **Azure**: Azure App Service
- **Google Cloud**: Cloud Run, App Engine
- **DigitalOcean**: App Platform

각 플랫폼의 Next.js 배포 가이드를 참고하세요.

---

## 4. 배포 후 확인사항

### 4.1 필수 확인

1. **환경 변수 확인**
   - 배포된 사이트에서 환경 변수가 제대로 설정되었는지 확인
   - 브라우저 콘솔에서 에러가 없는지 확인

2. **기능 테스트**
   - 로그인/회원가입 기능
   - 직원 목록 조회
   - 직원 추가/수정/삭제
   - 검색 및 필터링
   - 대시보드 차트

3. **Supabase 설정 확인**
   - Supabase 대시보드 > Settings > API에서 **Site URL** 설정
   - 인증 > URL Configuration에서 배포된 URL 추가

### 4.2 Supabase 인증 설정

배포된 URL을 Supabase에 등록해야 합니다:

1. Supabase 대시보드 > **Authentication** > **URL Configuration**
2. **Site URL**에 배포된 URL 입력 (예: `https://employee-management.vercel.app`)
3. **Redirect URLs**에 다음 추가:
   - `https://employee-management.vercel.app/**`
   - `https://employee-management.vercel.app/login`
   - `https://employee-management.vercel.app/signup`

### 4.3 성능 최적화

1. **이미지 최적화**: Supabase Storage URL이 `next.config.ts`에 등록되어 있는지 확인
2. **캐싱**: Vercel은 자동으로 최적화하지만, 필요시 추가 설정 가능
3. **모니터링**: Vercel Analytics 또는 다른 모니터링 도구 사용 고려

### 4.4 보안 확인

1. **환경 변수**: `.env.local` 파일이 Git에 커밋되지 않았는지 확인
2. **RLS 정책**: Supabase RLS 정책이 제대로 설정되어 있는지 확인
3. **API 키**: Anon Key는 공개되어도 되지만, Service Role Key는 절대 노출하지 마세요

---

## 5. 문제 해결

### 5.1 빌드 실패

**원인**: 환경 변수 누락, 의존성 문제, TypeScript 오류

**해결**:
1. 로컬에서 `npm run build` 실행하여 오류 확인
2. 환경 변수가 모두 설정되었는지 확인
3. Vercel/Netlify 빌드 로그 확인

### 5.2 런타임 오류

**원인**: 환경 변수 미설정, Supabase 연결 실패

**해결**:
1. 브라우저 콘솔에서 에러 확인
2. 배포 플랫폼의 환경 변수 설정 확인
3. Supabase 프로젝트가 활성화되어 있는지 확인

### 5.3 인증 오류

**원인**: Supabase Site URL 미설정, Redirect URL 미등록

**해결**:
1. Supabase 대시보드에서 Site URL 설정
2. Redirect URLs에 배포된 URL 추가
3. 브라우저에서 쿠키/로컬 스토리지 확인

---

## 6. 빠른 체크리스트

배포 전 확인사항:

- [ ] Git 저장소에 코드가 푸시되어 있음
- [ ] `.env.local`이 `.gitignore`에 포함되어 있음
- [ ] 로컬에서 `npm run build`가 성공함
- [ ] Supabase 프로젝트가 활성화되어 있음
- [ ] Supabase URL과 Anon Key를 준비함
- [ ] RLS 정책이 설정되어 있음
- [ ] 관리자 계정이 생성되어 있음

배포 후 확인사항:

- [ ] 배포된 사이트가 정상적으로 로드됨
- [ ] 환경 변수가 제대로 설정됨
- [ ] 로그인/회원가입이 작동함
- [ ] 직원 목록이 표시됨
- [ ] Supabase Site URL이 설정됨
- [ ] 브라우저 콘솔에 에러가 없음

---

## 참고 자료

- [Vercel 배포 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Supabase 인증 설정](https://supabase.com/docs/guides/auth)
- [환경 변수 설정 가이드](./ENV_SETUP.md)

