import { Browser, BrowserContext, Page, expect } from '@playwright/test'
import { ACCOUNTS, PASSWORD, RoleKey } from '../fixtures/accounts'
import * as fs from 'fs'
import * as path from 'path'

const SHOT_DIR = path.join('test-results', 'shots')
let shotSeq = 0

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
  await page.goto(`/plan-kpi-goal?tab=${idx}`)
  // 리스트 모드 공통 요소(연도 Select)가 뜰 때까지 대기
  await expect(page.locator('.MuiSelect-select').first()).toBeVisible({ timeout: 15_000 })
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
export async function pickApprover(page: Page, which: 'plan' | 'completion', name: string) {
  const idx = which === 'plan' ? 0 : 1
  await page.locator('button:has([data-testid="PersonSearchIcon"])').nth(idx).click()

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

/** '반려' 버튼 → 사유 입력 다이얼로그(RejectReasonDialog) → '반려 처리' */
export async function rejectWithReason(page: Page, reason: string) {
  await page.getByRole('button', { name: '반려', exact: true }).click()
  const dlg = page.getByRole('dialog')
  await dlg.locator('textarea').first().fill(reason)
  await dlg.getByRole('button', { name: '반려 처리', exact: true }).click()
  await acceptDialog(page, '저장되었습니다')
}
