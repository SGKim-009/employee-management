# 환경 변수 설정 가이드

이 문서는 인사관리 시스템을 실행하기 위해 필요한 환경 변수를 설정하는 방법을 안내합니다.

## 필수 환경 변수

다음 두 가지 환경 변수가 필요합니다:

1. `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon (Public) Key

## 설정 방법

### 1단계: Supabase에서 값 가져오기

1. [Supabase 대시보드](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. **Settings** (왼쪽 메뉴) 클릭
4. **API** 섹션으로 이동
5. 다음 정보 확인:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`에 사용
   - **Project API keys** > **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 사용

### 2단계: `.env.local` 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성합니다.

**Windows (PowerShell):**
```powershell
New-Item -Path .env.local -ItemType File
```

**Windows (CMD):**
```cmd
type nul > .env.local
```

**Mac/Linux:**
```bash
touch .env.local
```

### 3단계: 환경 변수 입력

`.env.local` 파일을 열고 다음 내용을 입력하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**예시:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTIzNDU2NywiZXhwIjoxOTYwODEwNTY3fQ.example
```

### 4단계: 개발 서버 재시작

환경 변수를 변경한 후에는 개발 서버를 재시작해야 합니다:

1. 현재 실행 중인 서버 중지 (`Ctrl + C`)
2. 다시 시작:
   ```bash
   npm run dev
   ```

## 확인 방법

환경 변수가 제대로 설정되었는지 확인:

1. 브라우저 콘솔에서 에러가 없는지 확인
2. 애플리케이션이 정상적으로 로드되는지 확인
3. 로그인 페이지가 표시되는지 확인

## 문제 해결

### "Missing required environment variables" 에러

이 에러가 발생하면:

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일 이름이 정확히 `.env.local`인지 확인 (`.env.local.txt`가 아님)
3. 환경 변수 이름이 정확한지 확인 (대소문자 구분)
4. 값에 따옴표나 공백이 없는지 확인
5. 개발 서버를 재시작했는지 확인

### 환경 변수가 적용되지 않는 경우

1. **파일 위치 확인**: `.env.local` 파일이 프로젝트 루트(`package.json`과 같은 위치)에 있어야 합니다.
2. **파일 이름 확인**: `.env`, `.env.development`가 아닌 `.env.local`이어야 합니다.
3. **서버 재시작**: 환경 변수 변경 후 반드시 개발 서버를 재시작해야 합니다.
4. **캐시 삭제**: `.next` 폴더를 삭제하고 다시 빌드:
   ```bash
   rm -rf .next
   npm run dev
   ```

## 보안 주의사항

⚠️ **중요**: `.env.local` 파일은 절대 Git에 커밋하지 마세요!

- `.env.local`은 이미 `.gitignore`에 포함되어 있습니다
- 이 파일에는 민감한 정보(API 키)가 포함되어 있습니다
- 공개 저장소에 업로드하지 마세요

## 참고

- `.env.example` 파일을 참고하여 필요한 환경 변수를 확인할 수 있습니다
- Next.js 환경 변수 문서: https://nextjs.org/docs/basic-features/environment-variables





