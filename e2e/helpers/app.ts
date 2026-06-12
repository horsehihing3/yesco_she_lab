import { Browser, BrowserContext, Page, expect } from '@playwright/test'
import { ACCOUNTS, PASSWORD, RoleKey } from '../fixtures/accounts'
import * as fs from 'fs'
import * as path from 'path'

const SHOT_DIR = path.join('test-results', 'shots')
let shotSeq = 0

/**
 * 노트북별 테스트 데이터 접두어. 공유 DB 충돌 방지용.
 *  - 개발 노트북: (기본) DEV  → 'TEST_DEV_...'
 *  - 테스트 노트북: set E2E_TAG=QA → 'TEST_QA_...'
 * 정리 시: DELETE ... WHERE plan_name LIKE 'TEST\_<TAG>\_%' ESCAPE '\'
 */
export const E2E_TAG = process.env.E2E_TAG || 'DEV'

/** 고유 테스트 식별명 생성: TEST_<TAG>_<label>_<timestamp> */
export function testName(label: string): string {
  return `TEST_${E2E_TAG}_${label}_${Date.now()}`
}

/** 단계별 스크린샷 저장 (리포트 첨부용) */
export async function shot(page: Page, name: string) {
  fs.mkdirSync(SHOT_DIR, { recursive: true })
  const file = path.join(SHOT_DIR, `${String(++shotSeq).padStart(2, '0')}-${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
}

/**
 * 지정 배역 계정으로 로그인한 새 브라우저 컨텍스트를 만든다.
 * 역할 전환 = 계정 전환이므로 컨텍스트를 분리해 세션(localStorage 토큰)을 격리한다.
 */
export async function loginAs(browser: Browser, role: RoleKey): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('/')

  await page.getByLabel('Username').fill(ACCOUNTS[role].username)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()

  // 토큰 발급 = 로그인 성공. 라우팅 구조와 무관하게 검증.
  await page.waitForFunction(() => !!localStorage.getItem('accessToken'), undefined, { timeout: 15_000 })
  return { context, page }
}

/** 연간계획 탭(/plan-kpi-goal?tab=1) 또는 KPI현황 탭(?tab=2)으로 이동 */
export async function gotoTab(page: Page, tab: 'annualPlan' | 'kpiStatus') {
  const idx = tab === 'annualPlan' ? 1 : 2
  await gotoList(page, `/plan-kpi-goal?tab=${idx}`)
}

/** 임의 목록 화면으로 이동 후 리스트 공통 요소(Select)가 뜰 때까지 대기 */
export async function gotoList(page: Page, path: string) {
  await page.goto(path)
  await expect(page.locator('.MuiSelect-select').first()).toBeVisible({ timeout: 15_000 })
}

/**
 * 라벨 옆 MUI Select 에서 옵션 선택.
 * 대부분 폼은 index 0 이 placeholder('선택하세요'/'미연결')라 기본 index=1(첫 실제 옵션).
 */
export async function selectByLabel(page: Page, label: string, optionIndex = 1) {
  // 폼 라벨은 <p>(Typography) — 사이드바 메뉴 등 동일 텍스트와 충돌 방지 위해 p 로 한정
  const trigger = page.locator('p', { hasText: label }).first()
    .locator('xpath=following-sibling::div[1]//*[contains(@class,"MuiSelect-select")]')
    .first()
  await trigger.click()
  await page.getByRole('option').nth(optionIndex).click()
}

/**
 * 사용자 확인/완료 다이얼로그(CustomDialog)에서 메시지를 가진 다이얼로그의 '확인'을 누른다.
 * showConfirm / showSuccess 모두 동일 컴포넌트를 쓰므로 메시지로 구분한다.
 */
export async function acceptDialog(page: Page, messageSubstr: string) {
  const dlg = page.getByRole('dialog').filter({ hasText: messageSubstr })
  await dlg.getByRole('button', { name: '확인', exact: true }).click()
}

/**
 * 계획/완료 승인자를 조직도 모달에서 이름 검색으로 지정한다.
 * 폼 내 PersonSearch 버튼 순서: [0]=계획승인자, [1]=완료승인자.
 */
export async function pickApprover(
  page: Page,
  which: 'plan' | 'completion',
  name: string,
  indices: { plan: number; completion: number } = { plan: 0, completion: 1 },
) {
  const idx = which === 'plan' ? indices.plan : indices.completion
  // 보이는(PC) 폼의 PersonSearch 버튼만 대상 (모바일 폼 중복 버튼은 display:none)
  await page.locator('button:has([data-testid="PersonSearchIcon"]):visible').nth(idx).click()

  const dlg = page.getByRole('dialog')
  await dlg.getByPlaceholder('이름으로 검색 (조직 전체)').fill(name)
  // 우측 사원 목록(ListItemButton, role=button)에서 이름이 포함된 항목 클릭
  await dlg.getByRole('button', { name: new RegExp(name) }).first().click()
  await dlg.getByRole('button', { name: '확인', exact: true }).click()
}

/** 한 행 라벨(예: '계획명') 옆 값 셀의 input/textarea 에 값을 채운다 */
export async function fillRowField(page: Page, label: string, value: string) {
  const labelBox = page.getByText(label, { exact: false }).first()
  const input = labelBox
    .locator('xpath=following-sibling::div[1]//input | following-sibling::div[1]//textarea')
    .first()
  await input.fill(value)
}

/** 리스트에서 계획명으로 행을 찾아 상세로 진입 */
export async function openRowByName(page: Page, planName: string) {
  await page.getByRole('row', { name: new RegExp(planName) }).first().click()
}

export interface ButtonRule { menuPath: string; statusCode: string; buttonName: string; roleKey: string; visible: boolean }

/** 버튼관리 규칙을 API(/button-rules)에서 직접 조회 — 화면 데이터 없이 권한 설정 검증용 */
export async function fetchButtonRules(page: Page): Promise<ButtonRule[]> {
  const token = await page.evaluate(() => localStorage.getItem('accessToken'))
  const apiBase = process.env.E2E_API_URL || 'http://localhost:7501'
  const res = await page.request.get(`${apiBase}/api/button-rules`, { headers: { Authorization: `Bearer ${token}` } })
  const body = await res.json()
  return (body.data ?? []) as ButtonRule[]
}

/** (menuPath, status, button, role) → visible 조회 헬퍼 팩토리 */
export function buttonRuleLookup(rules: ButtonRule[], menuPath: string) {
  return (status: string, button: string, role: string): boolean =>
    rules.find(r => r.menuPath === menuPath && r.statusCode === status && r.buttonName === button && r.roleKey === role)?.visible ?? false
}

/** '반려' 버튼 → 사유 입력 다이얼로그(RejectReasonDialog) → '반려 처리' */
export async function rejectWithReason(page: Page, reason: string) {
  await page.getByRole('button', { name: '반려', exact: true }).click()
  const dlg = page.getByRole('dialog')
  await dlg.locator('textarea').first().fill(reason)
  await dlg.getByRole('button', { name: '반려 처리', exact: true }).click()
  await acceptDialog(page, '저장되었습니다')
}
