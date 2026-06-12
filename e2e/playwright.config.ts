import { defineConfig, devices } from '@playwright/test'

/**
 * Smart EHS E2E 설정
 * - 테스트 노트북에서 자체 실행 중인 프론트(7500)/백엔드(7501)를 대상으로 한다.
 * - DB 상태머신(결재 전이)을 검증하므로 반드시 직렬(worker 1)로 실행한다.
 * - 대상 URL 변경: E2E_BASE_URL 환경변수로 덮어쓸 수 있다.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:7500',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'on',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
