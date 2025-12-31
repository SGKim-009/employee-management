# 다른 PC에서 코드 편집하기

이 문서는 여러 PC에서 동일한 프로젝트를 작업하는 방법을 안내합니다.

---

## 📋 목차

1. [Git + GitHub/GitLab 사용 (권장)](#1-git--githubgitlab-사용-권장)
2. [USB/클라우드 드라이브 사용](#2-usb클라우드-드라이브-사용)
3. [주의사항](#주의사항)
4. [빠른 체크리스트](#빠른-체크리스트)

---

## 1. Git + GitHub/GitLab 사용 (권장)

### 1.1 현재 PC에서 초기 설정

#### 단계 1: Git 저장소 초기화 (아직 안 했다면)

```bash
# 프로젝트 루트 디렉토리에서 실행
git init
```

#### 단계 2: 모든 파일 추가 및 첫 커밋

```bash
# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: Employee Management System"
```

#### 단계 3: 원격 저장소 연결

**GitHub 사용 시:**
1. [GitHub](https://github.com)에 로그인
2. **New repository** 클릭
3. 저장소 이름 입력 (예: `employee-management`)
4. **Create repository** 클릭
5. 생성된 저장소 URL 복사 (예: `https://github.com/your-username/employee-management.git`)

**GitLab 사용 시:**
1. [GitLab](https://gitlab.com)에 로그인
2. **New project** 클릭
3. 프로젝트 이름 입력
4. **Create project** 클릭
5. 생성된 프로젝트 URL 복사

#### 단계 4: 원격 저장소 추가 및 푸시

```bash
# 원격 저장소 추가 (URL을 실제 저장소 URL로 변경)
git remote add origin https://github.com/your-username/employee-management.git

# 기본 브랜치를 main으로 설정 (필요한 경우)
git branch -M main

# 코드 푸시
git push -u origin main
```

### 1.2 다른 PC에서 작업 시작하기

#### 단계 1: 저장소 클론

```bash
# 저장소 클론
git clone https://github.com/your-username/employee-management.git

# 프로젝트 폴더로 이동
cd employee-management
```

#### 단계 2: 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 내용을 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**중요**: Supabase URL과 Key는 현재 PC와 동일한 값을 사용합니다.

자세한 설정 방법은 [환경 변수 설정 가이드](./ENV_SETUP.md)를 참고하세요.

#### 단계 3: 의존성 설치

```bash
npm install
```

#### 단계 4: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속하여 확인하세요.

### 1.3 다른 PC에서 작업하는 일상적인 워크플로우

#### 작업 시작 전

```bash
# 최신 코드 가져오기
git pull origin main
```

#### 작업 중

```bash
# 변경사항 확인
git status

# 특정 파일만 확인
git diff
```

#### 작업 완료 후

```bash
# 변경된 파일 추가
git add .

# 또는 특정 파일만 추가
git add app/page.tsx components/Navigation.tsx

# 커밋 (변경사항 설명 작성)
git commit -m "대시보드 차트 기능 추가"

# 원격 저장소에 푸시
git push origin main
```

### 1.4 충돌 해결

두 PC에서 동시에 같은 파일을 수정한 경우 충돌이 발생할 수 있습니다.

```bash
# 최신 코드 가져오기
git pull origin main

# 충돌 발생 시
# 1. 충돌 파일 열기
# 2. <<<<<<< HEAD와 ======= 사이: 현재 PC의 변경사항
# 3. =======와 >>>>>>> 사이: 다른 PC의 변경사항
# 4. 필요한 부분만 남기고 나머지 삭제
# 5. <<<<<<<, =======, >>>>>>> 표시 모두 삭제

# 충돌 해결 후
git add .
git commit -m "충돌 해결"
git push origin main
```

---

## 2. USB/클라우드 드라이브 사용

Git을 사용하지 않는 경우, USB나 클라우드 드라이브를 사용할 수 있습니다.

### 2.1 현재 PC에서 프로젝트 복사

**중요**: 다음 폴더/파일은 복사하지 마세요:
- `node_modules/` (용량이 크고 각 PC에서 설치)
- `.next/` (빌드 결과물)
- `.env.local` (보안상 별도 관리)

**복사해야 할 것:**
- 모든 소스 코드 파일
- `package.json`, `package-lock.json`
- `tsconfig.json`, `next.config.ts` 등 설정 파일
- `docs/` 폴더 전체

### 2.2 다른 PC에서 설정

1. 프로젝트 폴더를 원하는 위치에 복사
2. `.env.local` 파일 생성 및 Supabase 값 입력
3. `npm install` 실행
4. `npm run dev` 실행

---

## 주의사항

### 1. 환경 변수 파일 (`.env.local`)

- `.env.local` 파일은 Git에 포함되지 않습니다 (보안상 이유)
- 각 PC에서 별도로 생성해야 합니다
- Supabase URL과 Key는 모든 PC에서 동일하게 사용합니다
- 파일 내용은 절대 공유하지 마세요

### 2. node_modules 폴더

- `node_modules` 폴더는 복사하지 마세요
- 각 PC에서 `npm install`로 설치합니다
- 용량이 크고 OS별로 다를 수 있습니다

### 3. Git 사용 시

- 작업 전 항상 `git pull`로 최신 코드 가져오기
- 작업 후 `git push`로 변경사항 저장
- 커밋 메시지는 명확하게 작성하기

### 4. Supabase 설정

- Supabase 프로젝트는 모든 PC에서 동일하게 사용합니다
- RLS 정책, 테이블 구조 등은 Supabase 대시보드에서 관리됩니다
- 각 PC는 동일한 Supabase 프로젝트에 연결됩니다

---

## 빠른 체크리스트

### 다른 PC에서 처음 작업 시작 시

- [ ] Git 저장소 클론 또는 프로젝트 폴더 복사
- [ ] `.env.local` 파일 생성 및 Supabase 값 입력
- [ ] `npm install` 실행
- [ ] `npm run dev`로 개발 서버 실행 확인
- [ ] 브라우저에서 `http://localhost:3000` 접속 확인

### 매일 작업 시작 시 (Git 사용 시)

- [ ] `git pull origin main` 실행
- [ ] 최신 코드 확인

### 작업 완료 후 (Git 사용 시)

- [ ] `git add .` 실행
- [ ] `git commit -m "변경사항 설명"` 실행
- [ ] `git push origin main` 실행

---

## 문제 해결

### Git 관련 오류

**"fatal: not a git repository"**
- `git init` 실행 필요

**"remote origin already exists"**
- `git remote remove origin` 후 다시 추가

**"permission denied"**
- GitHub/GitLab 인증 확인
- SSH 키 설정 또는 Personal Access Token 사용

### 환경 변수 오류

- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 파일 내용 형식 확인 (공백, 따옴표 등)
- 개발 서버 재시작

### 의존성 설치 오류

- Node.js 버전 확인 (권장: 18.x 이상)
- `npm cache clean --force` 후 재시도
- `package-lock.json` 삭제 후 `npm install` 재실행

---

## 추가 리소스

- [Git 공식 문서](https://git-scm.com/doc)
- [GitHub 가이드](https://guides.github.com/)
- [환경 변수 설정 가이드](./ENV_SETUP.md)
- [수동 설정 가이드](./MANUAL_SETUP_GUIDE.md)

