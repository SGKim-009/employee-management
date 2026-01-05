# .env.local 파일 생성 가이드

## ⚠️ 중요: 이 파일은 수동으로 생성해야 합니다

`.env.local` 파일은 보안상 자동으로 생성할 수 없습니다. 아래 방법 중 하나를 사용하여 수동으로 생성하세요.

## 방법 1: VS Code에서 생성 (권장)

1. **VS Code에서 프로젝트 열기**
2. **새 파일 생성**: `Ctrl + N`
3. **다음 내용 입력** (실제 Supabase 값으로 변경):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. **파일 저장**: `Ctrl + S`
5. **파일 이름 입력**: `.env.local` (확장자 없이, 점으로 시작)
6. **저장 위치**: 프로젝트 루트 (`package.json`과 같은 폴더)

## 방법 2: 파일 탐색기에서 생성

1. **프로젝트 폴더 열기** (`C:\Users\인사총무팀\employee-management`)
2. **새 텍스트 문서 생성**
3. **파일 이름 변경**: `.env.local`로 변경
   - F2 키를 눌러 이름 변경
   - `.env.local`로 입력 (확장자 포함)
   - "확장자를 변경하면 파일을 사용할 수 없게 될 수 있습니다" 경고에서 **"예"** 클릭
4. **메모장으로 열기**
5. **다음 내용 입력** (실제 Supabase 값으로 변경):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
6. **저장** (`Ctrl + S`)

## 방법 3: PowerShell에서 생성

PowerShell을 **관리자 권한으로 실행**한 후:

```powershell
# 프로젝트 폴더로 이동
cd "C:\Users\인사총무팀\employee-management"

# 파일 내용 작성 (실제 Supabase 값으로 변경)
$content = @"
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
"@

# 파일 생성
[System.IO.File]::WriteAllText("$PWD\.env.local", $content, [System.Text.Encoding]::UTF8)

# 파일 확인
Get-Content .env.local
```

## 파일 내용 형식

### ✅ 올바른 형식:
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ❌ 잘못된 형식:
```
# 따옴표 사용 (잘못됨)
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# 공백 사용 (잘못됨)
NEXT_PUBLIC_SUPABASE_URL = https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY = ...

# 주석과 같은 줄 (잘못됨)
NEXT_PUBLIC_SUPABASE_URL=https://... # 주석
```

## Supabase 값 가져오기

1. **Supabase 대시보드** 열기: https://supabase.com/dashboard
2. **프로젝트 선택**
3. **Settings** → **API** 메뉴로 이동
4. **Project URL** 복사 → `NEXT_PUBLIC_SUPABASE_URL`에 붙여넣기
5. **Project API keys** → **anon public** 키 복사 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 붙여넣기

## 파일 생성 확인

파일이 제대로 생성되었는지 확인:

```powershell
# 파일 존재 확인
Test-Path .env.local

# 파일 내용 확인
Get-Content .env.local

# 파일 위치 확인 (package.json과 같은 폴더에 있어야 함)
Get-ChildItem -Filter ".env.local" | Select-Object FullName
```

## 다음 단계

파일 생성 후:

1. **개발 서버 중지** (`Ctrl + C`)
2. **.next 폴더 삭제**:
   ```powershell
   Remove-Item -Recurse -Force .next
   ```
3. **개발 서버 재시작**:
   ```bash
   npm run dev
   ```
4. **브라우저에서 확인**: 환경 변수 에러가 사라졌는지 확인

## 문제 해결

### 파일이 보이지 않는 경우
- Windows 탐색기에서 "숨김 파일 표시" 활성화
- VS Code에서 파일 탐색기에서 `.env.local` 파일 확인

### 여전히 에러가 발생하는 경우
1. 파일 이름이 정확히 `.env.local`인지 확인 (`.env.local.txt` 아님)
2. 파일이 프로젝트 루트에 있는지 확인 (`package.json`과 같은 위치)
3. 환경 변수 값에 따옴표나 공백이 없는지 확인
4. 개발 서버를 재시작했는지 확인
5. `.next` 폴더를 삭제했는지 확인


