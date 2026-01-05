# CI/CD 가이드

인사관리 시스템의 CI/CD 파이프라인 설정 및 사용 가이드입니다.

---

## 📋 목차

1. [개요](#개요)
2. [GitHub Actions 워크플로우](#github-actions-워크플로우)
3. [설정 방법](#설정-방법)
4. [워크플로우 설명](#워크플로우-설명)
5. [환경 변수 설정](#환경-변수-설정)
6. [문제 해결](#문제-해결)

---

## 개요

이 프로젝트는 GitHub Actions를 사용하여 CI/CD 파이프라인을 구성합니다.

### 제공되는 워크플로우

1. **CI (Continuous Integration)**: 코드 품질 검사 및 빌드
2. **Test**: 타입 체크, 린트, 빌드 테스트
3. **Deploy**: 자동 배포 (Vercel)
4. **Rollback**: 배포 롤백 (Vercel)

---

## GitHub Actions 워크플로우

### 1. CI 워크플로우 (`.github/workflows/ci.yml`)

**트리거**:
- `main` 또는 `develop` 브랜치에 푸시
- `main` 또는 `develop` 브랜치로 Pull Request

**작업**:
1. 코드 체크아웃
2. Node.js 20 설정
3. 의존성 설치 (`npm ci`)
4. ESLint 실행
5. 애플리케이션 빌드
6. 빌드 아티팩트 업로드

### 2. Test 워크플로우 (`.github/workflows/test.yml`)

**트리거**:
- `main` 또는 `develop` 브랜치에 푸시
- `main` 또는 `develop` 브랜치로 Pull Request
- 수동 실행 (workflow_dispatch)

**작업**:
1. 코드 체크아웃
2. Node.js 20 설정
3. 의존성 설치
4. TypeScript 타입 체크
5. ESLint 실행
6. 애플리케이션 빌드

### 3. Deploy 워크플로우 (`.github/workflows/deploy.yml`)

**트리거**:
- `main` 브랜치에 푸시
- 수동 실행 (workflow_dispatch)

**작업**:
1. 코드 체크아웃
2. Node.js 20 설정
3. 의존성 설치
4. 애플리케이션 빌드
5. Vercel에 배포

---

## 설정 방법

### 1. GitHub 저장소 설정

1. GitHub 저장소에 코드 푸시
2. 저장소 Settings > Secrets and variables > Actions 이동

### 2. GitHub Secrets 설정

다음 Secrets를 추가하세요:

#### 필수 Secrets

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key

#### Vercel 배포용 Secrets (선택)

- `VERCEL_TOKEN`: Vercel API 토큰
- `VERCEL_ORG_ID`: Vercel 조직 ID
- `VERCEL_PROJECT_ID`: Vercel 프로젝트 ID

### 3. Vercel 토큰 생성

1. [Vercel 대시보드](https://vercel.com/account/tokens) 접속
2. **Create Token** 클릭
3. 토큰 이름 입력 및 생성
4. 생성된 토큰을 `VERCEL_TOKEN` Secret에 추가

### 4. Vercel 프로젝트 ID 확인

1. Vercel 대시보드 > 프로젝트 선택
2. Settings > General
3. **Project ID** 복사하여 `VERCEL_PROJECT_ID` Secret에 추가

### 5. Vercel 조직 ID 확인

1. Vercel 대시보드 > Settings > General
2. **Team ID** 또는 **Personal Account ID** 복사하여 `VERCEL_ORG_ID` Secret에 추가

---

## 워크플로우 설명

### CI 워크플로우

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    # ... 작업 단계
```

**동작**:
- 코드 푸시 또는 PR 생성 시 자동 실행
- 린트 및 빌드 검증
- 빌드 성공 시 아티팩트 저장

### Test 워크플로우

```yaml
name: Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    # ... 작업 단계
```

**동작**:
- 타입 체크, 린트, 빌드 테스트
- 수동 실행 가능

### Deploy 워크플로우

```yaml
name: Deploy

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    # ... 작업 단계
```

**동작**:
- `main` 브랜치에 푸시 시 자동 배포
- 수동 실행 가능
- Vercel 프로덕션 환경에 배포

---

## 환경 변수 설정

### GitHub Secrets 추가 방법

1. GitHub 저장소 > **Settings** > **Secrets and variables** > **Actions**
2. **New repository secret** 클릭
3. Name과 Value 입력
4. **Add secret** 클릭

### 필요한 Secrets

| Secret 이름 | 설명 | 예시 |
|------------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VERCEL_TOKEN` | Vercel API 토큰 | `vercel_xxx...` |
| `VERCEL_ORG_ID` | Vercel 조직 ID | `team_xxx` 또는 `user_xxx` |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID | `prj_xxx` |

---

## 문제 해결

### 빌드 실패

**원인**: 환경 변수 누락, TypeScript 오류, 의존성 문제

**해결**:
1. GitHub Actions 로그 확인
2. Secrets가 올바르게 설정되었는지 확인
3. 로컬에서 `npm run build` 실행하여 오류 확인

### 배포 실패

**원인**: Vercel 토큰 오류, 프로젝트 ID 오류

**해결**:
1. Vercel 토큰이 유효한지 확인
2. `VERCEL_ORG_ID`와 `VERCEL_PROJECT_ID` 확인
3. Vercel 대시보드에서 프로젝트 설정 확인

### 워크플로우가 실행되지 않음

**원인**: 브랜치 이름 불일치, 워크플로우 파일 오류

**해결**:
1. `.github/workflows/` 폴더에 워크플로우 파일이 있는지 확인
2. YAML 문법 오류 확인
3. 브랜치 이름이 `main` 또는 `develop`인지 확인

### 환경 변수 오류

**원인**: Secrets 미설정, 잘못된 값

**해결**:
1. GitHub Secrets에 모든 필수 변수가 설정되었는지 확인
2. 값에 공백이나 따옴표가 없는지 확인
3. Secrets 이름이 정확한지 확인

---

## 워크플로우 실행 확인

### GitHub Actions 탭에서 확인

1. GitHub 저장소 > **Actions** 탭
2. 실행 중인 워크플로우 확인
3. 각 단계의 로그 확인

### 성공 확인

- ✅ 모든 단계가 녹색 체크 표시
- ✅ "All checks have passed" 메시지
- ✅ 배포 워크플로우의 경우 Vercel에서 배포 확인

---

## 수동 실행

### Test 워크플로우 수동 실행

1. GitHub 저장소 > **Actions** 탭
2. **Test** 워크플로우 선택
3. **Run workflow** 클릭
4. 브랜치 선택 및 실행

### Deploy 워크플로우 수동 실행

1. GitHub 저장소 > **Actions** 탭
2. **Deploy** 워크플로우 선택
3. **Run workflow** 클릭
4. 브랜치 선택 (main) 및 실행

---

## 커스터마이징

### 다른 브랜치에 배포

`.github/workflows/deploy.yml`에서 브랜치를 변경:

```yaml
on:
  push:
    branches: [ main, develop ]  # develop 브랜치 추가
```

### 다른 배포 플랫폼 사용

Deploy 워크플로우를 수정하여 다른 플랫폼에 배포할 수 있습니다:

- **Netlify**: `netlify-cli` 사용
- **AWS**: AWS CLI 사용
- **자체 서버**: SSH 배포

---

## 모범 사례

1. **작은 커밋**: 자주 커밋하고 푸시하여 빠른 피드백
2. **브랜치 전략**: `main`은 프로덕션, `develop`은 개발
3. **PR 검토**: 배포 전 코드 리뷰
4. **테스트**: 로컬에서 테스트 후 푸시
5. **모니터링**: GitHub Actions 로그 정기 확인

---

## 롤백

### Rollback 워크플로우 (`.github/workflows/rollback.yml`)

**트리거**:
- 수동 실행 (workflow_dispatch)

**작업**:
1. 코드 체크아웃
2. Node.js 20 설정
3. Vercel CLI 설치
4. 지정된 배포로 롤백
5. 프로덕션 환경인 경우 프로모트

**사용 방법**:
1. GitHub 저장소 > **Actions** > **Rollback** 워크플로우 선택
2. **Run workflow** 클릭
3. Deployment URL과 Environment 입력
4. 실행

자세한 내용은 [롤백 가이드](./ROLLBACK_GUIDE.md)를 참고하세요.

---

## 참고 자료

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/concepts/git)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [롤백 가이드](./ROLLBACK_GUIDE.md)

---

**최종 업데이트**: 2024년

