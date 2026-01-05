# 이미지 최적화 가이드

이 문서는 프로젝트의 이미지 최적화 방법을 안내합니다.

## 📋 목차

1. [이미지 최적화 개요](#이미지-최적화-개요)
2. [Next.js Image 컴포넌트 사용](#nextjs-image-컴포넌트-사용)
3. [이미지 압축 방법](#이미지-압축-방법)
4. [이미지 최적화 확인](#이미지-최적화-확인)

---

## 이미지 최적화 개요

### 현재 구현 상태

- ✅ `next/image` 컴포넌트 사용
- ✅ Lazy loading 적용
- ✅ Supabase 이미지 도메인 설정
- ⚠️ 이미지 크기 최적화 (압축) - 수동 작업 필요

---

## Next.js Image 컴포넌트 사용

### 현재 사용 중인 컴포넌트

1. **EmployeeCard** - 프로필 이미지
2. **EmployeeForm** - 프로필 이미지 업로드/미리보기
3. **EmployeeDetails** - 프로필 이미지
4. **EmployeePrintCard** - 프로필 이미지

### Next.js Image의 자동 최적화 기능

- ✅ 자동 이미지 최적화 (WebP 변환)
- ✅ 반응형 이미지 (srcset)
- ✅ Lazy loading
- ✅ 이미지 크기 최적화

---

## 이미지 압축 방법

### 1. 온라인 도구 사용

**추천 도구:**
- [TinyPNG](https://tinypng.com/) - PNG/JPG 압축
- [Squoosh](https://squoosh.app/) - 다양한 형식 지원
- [ImageOptim](https://imageoptim.com/) - Mac 전용

**절차:**
1. 원본 이미지 선택
2. 압축 도구에 업로드
3. 압축된 이미지 다운로드
4. Supabase Storage에 업로드

### 2. 명령줄 도구 사용

#### ImageMagick 사용

```bash
# JPEG 압축
magick input.jpg -quality 85 output.jpg

# PNG 압축
magick input.png -quality 85 output.png
```

#### Sharp 사용 (Node.js)

```bash
npm install sharp
```

```javascript
const sharp = require('sharp');

sharp('input.jpg')
  .jpeg({ quality: 85 })
  .toFile('output.jpg');
```

### 3. 이미지 크기 권장 사항

- **프로필 이미지**: 200x200px ~ 400x400px
- **파일 크기**: 50KB ~ 100KB 이하 권장
- **형식**: JPEG (사진), PNG (투명도 필요 시), WebP (최신 브라우저)

---

## 이미지 최적화 확인

### 1. 이미지 로딩 속도 측정

**절차:**
1. 브라우저 개발자 도구의 Network 탭 열기
2. 페이지 로드
3. 이미지 로딩 시간 확인

**예상 결과:**
- ✅ 각 이미지 로딩 시간이 100ms 이하
- ✅ 총 이미지 로딩 시간이 합리적
- ✅ 이미지가 점진적으로 로드됨 (lazy loading)

### 2. 이미지 파일 크기 확인

**절차:**
1. Supabase Storage에서 이미지 파일 크기 확인
2. 권장 크기와 비교

**예상 결과:**
- ✅ 프로필 이미지가 100KB 이하
- ✅ 불필요하게 큰 이미지 없음

### 3. 이미지 형식 확인

**절차:**
1. 브라우저 개발자 도구에서 이미지 요청 확인
2. Content-Type 헤더 확인

**예상 결과:**
- ✅ Next.js가 자동으로 WebP 변환 (지원 브라우저)
- ✅ Fallback으로 원본 형식 제공

---

## 이미지 최적화 체크리스트

### 업로드 전 확인
- [ ] 이미지 크기가 적절한가? (200x200 ~ 400x400px)
- [ ] 이미지 파일 크기가 100KB 이하인가?
- [ ] 이미지 형식이 적절한가? (JPEG/PNG/WebP)

### 구현 확인
- [ ] `next/image` 컴포넌트를 사용하는가?
- [ ] Lazy loading이 적용되어 있는가?
- [ ] `next.config.ts`에 이미지 도메인이 설정되어 있는가?

### 성능 확인
- [ ] 이미지 로딩 시간이 합리적인가?
- [ ] 페이지 로드 성능이 만족스러운가?
- [ ] 이미지가 점진적으로 로드되는가?

---

## 📝 참고사항

### Next.js Image의 자동 최적화

Next.js는 이미지를 자동으로 최적화합니다:
- **WebP 변환**: 지원 브라우저에 자동 변환
- **반응형 이미지**: 다양한 화면 크기에 맞는 이미지 제공
- **Lazy loading**: 뷰포트에 들어올 때만 로드

### 수동 최적화가 필요한 경우

- 원본 이미지가 매우 큰 경우 (예: 2MB 이상)
- 특정 품질이 필요한 경우
- 파일 크기를 더 줄이고 싶은 경우

---

**마지막 업데이트:** 2024년


