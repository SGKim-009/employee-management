# 롤백 가이드

인사관리 시스템의 배포 롤백 전략 및 실행 방법 가이드입니다.

---

## 📋 목차

1. [롤백 개요](#롤백-개요)
2. [롤백 방법](#롤백-방법)
3. [GitHub Actions 롤백](#github-actions-롤백)
4. [Vercel 대시보드 롤백](#vercel-대시보드-롤백)
5. [Git을 통한 롤백](#git을-통한-롤백)
6. [롤백 전략](#롤백-전략)
7. [문제 해결](#문제-해결)

---

## 롤백 개요

롤백은 이전 안정적인 버전으로 되돌리는 과정입니다. 다음 상황에서 롤백을 고려해야 합니다:

- 배포 후 심각한 오류 발생
- 성능 저하
- 데이터 무결성 문제
- 보안 취약점 발견

---

## 롤백 방법

### 1. Vercel 대시보드 (가장 빠름) ⚡

**장점**: 즉시 실행, UI로 간편하게

**단계**:
1. Vercel 대시보드 > 프로젝트 > **Deployments** 탭
2. 롤백할 배포 항목 찾기 (이전 안정 버전)
3. **⋯** (점 3개) 메뉴 클릭
4. **Promote to Production** 선택
5. 확인 대화상자에서 **Promote** 클릭

**소요 시간**: 약 1-2분

---

### 2. GitHub Actions (자동화) 🤖

**장점**: 자동화, 기록 보관, 팀 협업

**단계**:
1. GitHub 저장소 > **Actions** 탭
2. **Rollback** 워크플로우 선택
3. **Run workflow** 클릭
4. 입력 필드 작성:
   - **Deployment URL**: 롤백할 Vercel 배포 URL
   - **Environment**: `production` 또는 `preview`
5. **Run workflow** 클릭

**Deployment URL 찾기**:
- Vercel 대시보드 > **Deployments** > 배포 항목 클릭
- URL은 `https://your-project-xxx.vercel.app` 형식

**소요 시간**: 약 2-3분

---

### 3. Vercel CLI (터미널) 💻

**장점**: 스크립트 자동화 가능, 빠른 실행

**단계**:
```bash
# Vercel CLI 설치 (처음 한 번만)
npm install -g vercel

# 로그인
vercel login

# 배포 목록 확인
vercel ls

# 특정 배포로 롤백
vercel rollback <deployment-url>

# 프로덕션으로 프로모트
vercel promote <deployment-url> --prod
```

**소요 시간**: 약 1-2분

---

### 4. Git을 통한 롤백 (코드 레벨) 🔄

**장점**: 코드 변경 이력 관리, 완전한 롤백

**단계**:
```bash
# 이전 커밋으로 되돌리기
git revert HEAD
git push origin main

# 특정 커밋으로 되돌리기
git revert <commit-hash>
git push origin main

# 또는 특정 커밋으로 리셋 (주의: 히스토리 변경)
git reset --hard <commit-hash>
git push origin main --force
```

**주의**: `git reset --hard`는 히스토리를 변경하므로 팀 협업 시 주의해야 합니다.

**소요 시간**: 약 3-5분 (자동 배포 포함)

---

## GitHub Actions 롤백

### 워크플로우 설정

`.github/workflows/rollback.yml` 파일이 자동 롤백을 지원합니다.

### 사용 방법

1. **GitHub 저장소 접속**
2. **Actions** 탭 클릭
3. 왼쪽 사이드바에서 **Rollback** 워크플로우 선택
4. **Run workflow** 버튼 클릭
5. 입력 필드 작성:
   - **Deployment URL**: Vercel 배포 URL
   - **Environment**: `production` 또는 `preview`
6. **Run workflow** 클릭

### Deployment URL 찾기

1. Vercel 대시보드 > 프로젝트 > **Deployments**
2. 롤백할 배포 항목 클릭
3. URL 복사 (예: `https://your-project-abc123.vercel.app`)

---

## Vercel 대시보드 롤백

### 프로덕션 롤백

1. **Vercel 대시보드** 접속
2. 프로젝트 선택
3. **Deployments** 탭 클릭
4. 롤백할 배포 항목 찾기
5. **⋯** 메뉴 클릭
6. **Promote to Production** 선택
7. 확인 대화상자에서 **Promote** 클릭

### 프리뷰 롤백

1. **Deployments** 탭에서 프리뷰 배포 선택
2. **⋯** 메뉴 클릭
3. **Redeploy** 또는 **Promote** 선택

---

## Git을 통한 롤백

### Revert (권장)

이전 커밋을 되돌리는 새로운 커밋을 생성합니다.

```bash
# 최신 커밋 되돌리기
git revert HEAD
git commit -m "Revert: 문제가 있는 배포 롤백"
git push origin main
```

### Reset (주의)

히스토리를 변경하므로 팀 협업 시 주의가 필요합니다.

```bash
# 특정 커밋으로 리셋
git reset --hard <commit-hash>
git push origin main --force
```

**주의사항**:
- `--force` 푸시는 팀원의 로컬 저장소와 충돌할 수 있습니다
- 공유 브랜치에서는 `revert` 사용을 권장합니다

---

## 롤백 전략

### 1. 단계별 롤백

1. **문제 확인**: 배포 후 오류 로그 확인
2. **영향 범위 평가**: 사용자 영향도 파악
3. **롤백 결정**: 즉시 롤백 또는 점진적 수정
4. **롤백 실행**: 가장 빠른 방법 선택
5. **검증**: 롤백 후 정상 작동 확인

### 2. 롤백 우선순위

1. **즉시 롤백 필요**:
   - 데이터 손실 위험
   - 보안 취약점
   - 전체 서비스 중단

2. **빠른 롤백 권장**:
   - 주요 기능 오류
   - 성능 저하
   - 사용자 불만 증가

3. **점진적 수정 고려**:
   - 사소한 UI 문제
   - 경고 메시지
   - 비중요 기능 오류

### 3. 롤백 체크리스트

롤백 전:
- [ ] 문제의 심각도 평가
- [ ] 롤백할 배포 버전 확인
- [ ] 롤백 방법 선택
- [ ] 팀원에게 알림 (필요시)

롤백 후:
- [ ] 서비스 정상 작동 확인
- [ ] 주요 기능 테스트
- [ ] 사용자 영향 확인
- [ ] 롤백 원인 분석
- [ ] 재배포 계획 수립

---

## 문제 해결

### 롤백이 작동하지 않는 경우

**원인**: 배포 URL 오류, 권한 문제

**해결**:
1. Vercel 대시보드에서 배포 URL 확인
2. Vercel 토큰이 유효한지 확인
3. GitHub Secrets 설정 확인

### 롤백 후에도 문제가 있는 경우

**원인**: 데이터베이스 스키마 변경, 환경 변수 문제

**해결**:
1. 데이터베이스 마이그레이션 확인
2. 환경 변수 변경 사항 확인
3. Supabase 설정 확인

### 롤백 후 기능이 사라진 경우

**원인**: 이전 버전에 해당 기능이 없음

**해결**:
1. 기능이 추가된 커밋 확인
2. 필요한 경우 선택적 롤백 고려
3. 핫픽스 배포 검토

---

## 롤백 모범 사례

### 1. 배포 전 준비

- **스테이징 환경 테스트**: 프로덕션 배포 전 스테이징에서 충분히 테스트
- **롤백 계획 수립**: 배포 전 롤백 방법 미리 준비
- **모니터링 설정**: 배포 후 즉시 문제를 감지할 수 있도록 설정

### 2. 배포 후 모니터링

- **에러 로그 확인**: 배포 직후 에러 로그 모니터링
- **성능 메트릭 확인**: 응답 시간, 에러율 확인
- **사용자 피드백**: 사용자 불만 신속히 파악

### 3. 롤백 실행

- **빠른 결정**: 심각한 문제는 즉시 롤백
- **명확한 커뮤니케이션**: 팀원에게 롤백 사실 알림
- **원인 분석**: 롤백 후 문제 원인 분석

### 4. 롤백 후 조치

- **문제 해결**: 롤백 원인 수정
- **재배포 계획**: 수정 사항 반영 후 재배포
- **문서화**: 롤백 사유 및 조치 내용 문서화

---

## 자동 롤백 설정 (선택)

### Health Check 기반 자동 롤백

배포 후 자동으로 헬스 체크를 수행하고 실패 시 자동 롤백:

```yaml
# .github/workflows/deploy.yml에 추가
- name: Health check
  run: |
    sleep 30
    response=$(curl -s -o /dev/null -w "%{http_code}" https://your-app.vercel.app)
    if [ "$response" != "200" ]; then
      echo "Health check failed, triggering rollback"
      # 롤백 로직 실행
    fi
```

---

## 참고 자료

- [Vercel 롤백 문서](https://vercel.com/docs/deployments/rollback)
- [Git Revert 가이드](https://git-scm.com/docs/git-revert)
- [GitHub Actions 문서](https://docs.github.com/en/actions)

---

**최종 업데이트**: 2024년



