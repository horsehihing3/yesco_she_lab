import { test, expect, BrowserContext } from '@playwright/test'
import { ACCOUNTS } from '../fixtures/accounts'
import {
  loginAs, gotoTab, acceptDialog, pickApprover, fillRowField, openRowByName, shot,
} from '../helpers/app'

/**
 * 연간계획 결재 전체 라이프사이클 E2E
 *
 *   작성자        : 등록 → 수정 → 계획 결재 상신          (DRAFT → PENDING_APPROVAL)
 *   계획승인자    : 계획 승인                              (PENDING_APPROVAL → APPROVED, KPI현황 '작성중')
 *   작성자        : KPI값 저장 → 완료 결재 상신            (APPROVED → COMPLETION_PENDING)
 *   완료승인자    : 완료 승인                              (COMPLETION_PENDING → DONE)
 *
 * DB 상태머신을 순서대로 검증하므로 단일 테스트 / 직렬 실행.
 */
test('연간계획 결재 라이프사이클 (등록→계획승인→완료승인)', async ({ browser }) => {
  const planName = `TEST_${Date.now()}`
  const contexts: BrowserContext[] = []

  // ───────────────────────────── 1. 작성자: 등록 ─────────────────────────────
  await test.step('작성자 등록 (DRAFT)', async () => {
    const { context, page } = await loginAs(browser, 'writer')
    contexts.push(context)
    await gotoTab(page, 'annualPlan')

    await page.getByRole('button', { name: 'New', exact: true }).click()
    await fillRowField(page, '계획명', planName)
    await fillRowField(page, '설명', `E2E 자동 테스트 계획 ${planName}`)
    // 승인자 지정 (조직도) — 자동 채워진 팀장 값을 우리 테스트 계정으로 덮어쓴다
    await pickApprover(page, 'plan', ACCOUNTS.planApprover.name)
    await pickApprover(page, 'completion', ACCOUNTS.completionApprover.name)
    await shot(page, 'writer-create-form')

    await page.getByRole('button', { name: '등록', exact: true }).click()
    await acceptDialog(page, '저장 하시겠습니까')
    await acceptDialog(page, '저장되었습니다')

    // 목록 복귀 + 등록 확인
    await expect(page.getByRole('row', { name: new RegExp(planName) })).toBeVisible()
    await shot(page, 'writer-list-after-create')
  })

  // ───────────────────────── 2. 작성자: 계획 결재 상신 ─────────────────────────
  await test.step('작성자 계획 결재 상신 (PENDING_APPROVAL)', async () => {
    const page = contexts[0].pages()[0]
    await openRowByName(page, planName)
    await expect(page.getByText('작성자', { exact: false }).first()).toBeVisible()
    await page.getByRole('button', { name: '계획 결재 상신', exact: true }).click()
    await acceptDialog(page, '저장되었습니다')
    await shot(page, 'writer-submitted')
  })

  // ───────────────────────── 3. 계획승인자: 계획 승인 ─────────────────────────
  await test.step('계획승인자 계획 승인 (APPROVED)', async () => {
    const { context, page } = await loginAs(browser, 'planApprover')
    contexts.push(context)
    await gotoTab(page, 'annualPlan')
    await openRowByName(page, planName)
    await page.getByRole('button', { name: '계획 승인', exact: true }).click()
    await acceptDialog(page, '하시겠습니까')   // '승인 하시겠습니까?'
    await acceptDialog(page, '저장되었습니다')
    await shot(page, 'planapprover-approved')
  })

  // ──────────────── 4. 작성자: KPI현황 '작성중' 확인 → 저장 → 완료 상신 ────────────────
  await test.step('작성자 KPI값 저장 + 완료 결재 상신 (COMPLETION_PENDING)', async () => {
    const page = contexts[0].pages()[0]
    await gotoTab(page, 'kpiStatus')
    // 승인된 계획이 KPI현황에 '작성중'으로 노출
    const row = page.getByRole('row', { name: new RegExp(planName) })
    await expect(row).toBeVisible()
    await expect(row.getByText('작성중')).toBeVisible()
    await shot(page, 'writer-kpi-draft')

    await openRowByName(page, planName)
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await acceptDialog(page, '저장 하시겠습니까')
    await acceptDialog(page, '저장되었습니다')

    await page.getByRole('button', { name: '완료 결재 상신', exact: true }).click()
    await acceptDialog(page, '상신하시겠습니까')   // '완료 결재를 상신하시겠습니까?'
    await acceptDialog(page, '저장되었습니다')
    await shot(page, 'writer-completion-submitted')
  })

  // ───────────────────────── 5. 완료승인자: 완료 승인 ─────────────────────────
  await test.step('완료승인자 완료 승인 (DONE)', async () => {
    const { context, page } = await loginAs(browser, 'completionApprover')
    contexts.push(context)
    await gotoTab(page, 'kpiStatus')
    await openRowByName(page, planName)
    await page.getByRole('button', { name: '완료 승인', exact: true }).click()
    await acceptDialog(page, '변경하시겠습니까')   // '작업 완료로 변경하시겠습니까?'
    await acceptDialog(page, '저장되었습니다')

    // 최종 상태 '완료' 확인
    await expect(page.getByText('완료', { exact: true }).first()).toBeVisible()
    await shot(page, 'completionapprover-done')
  })

  for (const c of contexts) await c.close()
})
