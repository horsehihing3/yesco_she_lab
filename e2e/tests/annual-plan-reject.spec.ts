import { test, expect, BrowserContext } from '@playwright/test'
import { ACCOUNTS } from '../fixtures/accounts'
import {
  loginAs, gotoTab, acceptDialog, pickApprover, fillRowField, openRowByName,
  rejectWithReason, shot, testName,
} from '../helpers/app'

/**
 * 반려(반려→재상신→승인) 회복 흐름 E2E — 계획/완료 두 단계 모두 검증.
 *
 *   1 작성자        등록                                   → DRAFT
 *   2 작성자        계획 결재 상신                          → PENDING_APPROVAL
 *   3 계획승인자    계획 결재 반려(사유)                     → DRAFT (반려 사유 배너)
 *   4 작성자        재상신                                  → PENDING_APPROVAL
 *   5 계획승인자    계획 승인                                → APPROVED
 *   6 작성자        KPI 저장 → 완료 결재 상신                → COMPLETION_PENDING
 *   7 완료승인자    완료 결재 반려(사유)                     → APPROVED (작성중, 반려 사유 배너)
 *   8 작성자        완료 결재 재상신                         → COMPLETION_PENDING
 *   9 완료승인자    완료 승인                                → DONE
 */
test('반려 회복 흐름 (계획반려→재상신→승인→완료반려→재상신→완료)', async ({ browser }) => {
  const planName = testName('REJ')
  const planRejectReason = '일정이 부적절합니다. 다음 분기로 조정 후 재상신 바랍니다.'
  const compRejectReason = '실적 수치 근거가 미흡합니다. 보완 후 재상신 바랍니다.'
  const contexts: BrowserContext[] = []

  // 1. 작성자 등록
  await test.step('작성자 등록 (DRAFT)', async () => {
    // 연간계획 New=일반관리자(EHS_ADMIN)+슈퍼. 등록자=슈퍼(EHS_ADMIN=계획승인자와 충돌 회피)
    const { context, page } = await loginAs(browser, 'superAdmin')
    contexts.push(context)
    await gotoTab(page, 'annualPlan')
    await page.getByRole('button', { name: 'New', exact: true }).click()
    await fillRowField(page, '계획명', planName)
    await fillRowField(page, '설명', `반려 흐름 테스트 ${planName}`)
    await pickApprover(page, 'plan', ACCOUNTS.planApprover.name)
    await pickApprover(page, 'completion', ACCOUNTS.completionApprover.name)
    await page.getByRole('button', { name: '등록', exact: true }).click()
    await acceptDialog(page, '저장 하시겠습니까')
    await acceptDialog(page, '저장되었습니다')
    await expect(page.getByRole('row', { name: new RegExp(planName) })).toBeVisible()
  })

  // 2. 작성자 계획 결재 상신
  await test.step('작성자 계획 결재 상신 (PENDING_APPROVAL)', async () => {
    const page = contexts[0].pages()[0]
    await openRowByName(page, planName)
    await page.getByRole('button', { name: '계획 결재 상신', exact: true }).click()
    await acceptDialog(page, '저장되었습니다')
  })

  // 3. 계획승인자 반려
  await test.step('계획승인자 계획 결재 반려 (→ DRAFT)', async () => {
    const { context, page } = await loginAs(browser, 'planApprover')
    contexts.push(context)
    await gotoTab(page, 'annualPlan')
    await openRowByName(page, planName)
    await rejectWithReason(page, planRejectReason)
    await shot(page, 'plan-rejected')
  })

  // 4. 작성자: 반려 사유 확인 → 재상신
  await test.step('작성자 반려 사유 확인 + 재상신 (PENDING_APPROVAL)', async () => {
    const page = contexts[0].pages()[0]
    await gotoTab(page, 'annualPlan')
    await openRowByName(page, planName)
    await expect(page.getByText(planRejectReason)).toBeVisible()   // 반려 사유 배너
    await shot(page, 'writer-sees-plan-reject')
    await page.getByRole('button', { name: '계획 결재 상신', exact: true }).click()
    await acceptDialog(page, '저장되었습니다')
  })

  // 5. 계획승인자 승인
  await test.step('계획승인자 계획 승인 (APPROVED)', async () => {
    const page = contexts[1].pages()[0]
    await gotoTab(page, 'annualPlan')
    await openRowByName(page, planName)
    await page.getByRole('button', { name: '계획 승인', exact: true }).click()
    await acceptDialog(page, '하시겠습니까')
    await acceptDialog(page, '저장되었습니다')
  })

  // 6. 작성자: KPI 저장 + 완료 결재 상신
  await test.step('작성자 KPI 저장 + 완료 결재 상신 (COMPLETION_PENDING)', async () => {
    const page = contexts[0].pages()[0]
    await gotoTab(page, 'kpiStatus')
    await openRowByName(page, planName)
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await acceptDialog(page, '저장 하시겠습니까')
    await acceptDialog(page, '저장되었습니다')
    await page.getByRole('button', { name: '완료 결재 상신', exact: true }).click()
    await acceptDialog(page, '상신하시겠습니까')
    await acceptDialog(page, '저장되었습니다')
  })

  // 7. 완료승인자 완료 반려
  await test.step('완료승인자 완료 결재 반려 (→ APPROVED/작성중)', async () => {
    const { context, page } = await loginAs(browser, 'completionApprover')
    contexts.push(context)
    await gotoTab(page, 'kpiStatus')
    await openRowByName(page, planName)
    await rejectWithReason(page, compRejectReason)
    await shot(page, 'completion-rejected')
  })

  // 8. 작성자: 완료 반려 사유 확인 → 완료 재상신
  await test.step('작성자 완료 반려 사유 확인 + 완료 재상신 (COMPLETION_PENDING)', async () => {
    const page = contexts[0].pages()[0]
    await gotoTab(page, 'kpiStatus')
    await openRowByName(page, planName)
    await expect(page.getByText(compRejectReason)).toBeVisible()   // 완료 반려 사유 배너
    await shot(page, 'writer-sees-completion-reject')
    await page.getByRole('button', { name: '완료 결재 상신', exact: true }).click()
    await acceptDialog(page, '상신하시겠습니까')
    await acceptDialog(page, '저장되었습니다')
  })

  // 9. 완료승인자 완료 승인
  await test.step('완료승인자 완료 승인 (DONE)', async () => {
    const page = contexts[2].pages()[0]
    await gotoTab(page, 'kpiStatus')
    await openRowByName(page, planName)
    await page.getByRole('button', { name: '완료 승인', exact: true }).click()
    await acceptDialog(page, '변경하시겠습니까')
    await acceptDialog(page, '저장되었습니다')
    await expect(page.getByText('완료', { exact: true }).first()).toBeVisible()
    await shot(page, 'reject-flow-done')
  })

  for (const c of contexts) await c.close()
})
