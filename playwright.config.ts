import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 설정 파일
 * E2E 테스트를 위한 설정
 */
export default defineConfig({
  testDir: './e2e',
  /* 테스트 실행 시 최대 병렬 실행 수 */
  fullyParallel: true,
  /* CI에서 실패한 테스트만 재실행 */
  forbidOnly: !!process.env.CI,
  /* CI에서 실패 시 재시도 */
  retries: process.env.CI ? 2 : 0,
  /* 병렬 실행 워커 수 */
  workers: process.env.CI ? 1 : undefined,
  /* 리포트 설정 */
  reporter: 'html',
  /* 공유 설정 */
  use: {
    /* 기본 URL */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    /* 스크린샷 설정 */
    screenshot: 'only-on-failure',
    /* 비디오 설정 */
    video: 'retain-on-failure',
    /* 트레이스 설정 */
    trace: 'on-first-retry',
  },

  /* 프로젝트별 설정 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* 모바일 테스트 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 개발 서버 설정 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});


