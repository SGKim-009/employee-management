# 환경 변수 문제 해결 가이드

## 문제: 환경 변수를 설정했는데도 "Missing required environment variables" 에러 발생

### 1단계: 파일 확인

#### 파일 위치 확인
`.env.local` 파일이 **프로젝트 루트**에 있어야 합니다.
- ✅ 올바른 위치: `C:\Users\인사총무팀\employee-management\.env.local`
- ❌ 잘못된 위치: `C:\Users\인사총무팀\employee-management\app\.env.local`

**확인 방법:**
- `.env.local` 파일이 `package.json`과 같은 폴더에 있는지 확인

#### 파일 이름 확인
Windows에서 파일을 만들 때 확장자가 자동으로 추가될 수 있습니다.

**확인 방법:**
1. 파일 탐색기에서 "파일 이름 확장자" 표시 활성화
2. 파일 이름이 정확히 `.env.local`인지 확인
   - ✅ `.env.local`
   - ❌ `.env.local.txt`
   - ❌ `env.local`

**해결 방법:**
1. 파일 탐색기에서 파일 선택
2. F2 키를 눌러 이름 변경
3. `.env.local`로 변경 (확장자 포함)
4. "확장자를 변경하면 파일을 사용할 수 없게 될 수 있습니다" 경고에서 "예" 클릭

### 2단계: 파일 내용 확인

`.env.local` 파일 내용이 다음과 같은 형식이어야 합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**주의사항:**
- ❌ 따옴표 사용하지 않기: `NEXT_PUBLIC_SUPABASE_URL="https://..."` (잘못됨)
- ✅ 따옴표 없이: `NEXT_PUBLIC_SUPABASE_URL=https://...` (올바름)
- ❌ 공백 주의: `NEXT_PUBLIC_SUPABASE_URL = https://...` (잘못됨, `=` 앞뒤 공백 없어야 함)
- ✅ 공백 없이: `NEXT_PUBLIC_SUPABASE_URL=https://...` (올바름)
- ❌ 주석과 같은 줄에 쓰지 않기
- ✅ 각 변수는 별도 줄에

**올바른 예시:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTIzNDU2NywiZXhwIjoxOTYwODEwNTY3fQ.example
```

### 3단계: 개발 서버 재시작

환경 변수를 변경한 후에는 **반드시** 개발 서버를 재시작해야 합니다.

1. 현재 실행 중인 서버 중지 (`Ctrl + C`)
2. `.next` 폴더 삭제 (캐시 삭제):
   ```powershell
   Remove-Item -Recurse -Force .next
   ```
3. 개발 서버 재시작:
   ```bash
   npm run dev
   ```

### 4단계: 브라우저 캐시 삭제

브라우저 캐시를 삭제하고 하드 리프레시:
- **Chrome/Edge**: `Ctrl + Shift + R` 또는 `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R`

### 5단계: 환경 변수 확인 스크립트

다음 스크립트를 실행하여 환경 변수가 제대로 로드되는지 확인:

**PowerShell:**
```powershell
# .env.local 파일 내용 확인
Get-Content .env.local

# Next.js가 환경 변수를 읽는지 확인
node -e "require('dotenv').config({ path: '.env.local' }); console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL); console.log('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '없음');"
```

### 6단계: 수동으로 환경 변수 확인

브라우저 개발자 도구(F12) → Console에서 다음을 실행:

```javascript
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '없음');
```

**참고:** Next.js에서 `NEXT_PUBLIC_` 접두사가 있는 환경 변수는 빌드 타임에 번들에 포함됩니다. 따라서 개발 서버를 재시작해야 변경사항이 적용됩니다.

## 일반적인 실수

1. **파일 이름 오류**
   - `.env.local.txt` (잘못됨)
   - `.env` (잘못됨)
   - `.env.local` (올바름)

2. **파일 위치 오류**
   - `app/.env.local` (잘못됨)
   - `.env.local` (프로젝트 루트에 있어야 함, 올바름)

3. **값 형식 오류**
   - 따옴표 사용: `NEXT_PUBLIC_SUPABASE_URL="https://..."`
   - 공백 포함: `NEXT_PUBLIC_SUPABASE_URL = https://...`
   - 주석과 같은 줄: `NEXT_PUBLIC_SUPABASE_URL=https://... # 주석`

4. **서버 재시작 안 함**
   - 환경 변수 변경 후 서버를 재시작하지 않음

## 여전히 문제가 있는 경우

1. `.env.local` 파일을 삭제하고 다시 생성
2. 파일 인코딩을 UTF-8로 설정
3. VS Code를 사용하는 경우, 파일을 저장할 때 인코딩 확인
4. 프로젝트를 완전히 재시작:
   ```powershell
   # 서버 중지
   # .next 폴더 삭제
   Remove-Item -Recurse -Force .next
   # node_modules 재설치 (선택사항)
   Remove-Item -Recurse -Force node_modules
   npm install
   # 개발 서버 시작
   npm run dev
   ```


