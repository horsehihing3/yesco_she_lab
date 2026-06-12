import { test, expect, BrowserContext } from '@playwright/test'
import { ACCOUNTS } from '../fixtures/accounts'
import {
  loginAs, gotoList, acceptDialog, pickApprover, fillRowField, selectByLabel,
  openRowByName, rejectWithReason, shot, testName,
} from '../helpers/app'

/**
 * 비상 계획(Emergency) 계획 결재 라이프사이클 + 반려 회복 E2E
 *  /emergency-response?tab=1 (비상 계획 탭, EmrPlanTab)
 *
 *  1 작성자        등록(계획명/유형/승인자2/체크리스트)        → DRAFT
 *  2 작성자        계획 결재 상신                              → PENDING_APPROVAL
 *  3 계획승인자    반려(사유)                                  → DRAFT (반려 사유 배너)
 *  4 작성자        반려 사유 확인 + 재상신                     → PENDING_APPROVAL
 *  5 계획승인자    계획 승인                                   → APPROVED (계획 탭 목록에서 사라짐)
 *
 * 승인자 picker 버튼 순서: [0]담당자 [1]담당부서 [2]계획승인 [3]완료승인
 */
const APPROVER_IDX = { plan: 2, completion: 3 }
const EMR_PLANS = '/emergency-response?tab=1'

test('비상계획 결재 라이프사이클 (등록→상신→반려→재상신→계획승인)', async ({ browser }) => {
  const planName = testName('EMR')
  const rejectReason = '대응 절차가 미흡합니다. 보완 후 재상신 바랍니다.'
  const contexts: BrowserContext[] = []

  // 1. 등록 — 비상계획 New = 일반관리자(EMERGENCY_ADMIN)+슈퍼. EMERGENCY_ADMIN 계정이 없어 슈퍼로 등록.
  await test.step('등록 (DRAFT)', async () => {
    const { context, page } = await loginAs(browser, 'superAdmin')
    contexts.push(context)
    await gotoList(page, EMR_PLANS)
    await page.getByRole('button', { name: 'New', exact: true }).click()

    await fillRowField(page, '계획명', planName)
    await selectByLabel(page, '시나리오 유형', 1)               // 유형 첫 옵션
    await pickApprover(page, 'plan', ACCOUNTS.planApprover.name, APPROVER_IDX)
    await pickApprover(page, 'completion', ACCOUNTS.completionApprover.name, APPROVER_IDX)
    await selectByLabel(page, '체크리스트', 1)                  // 첫 EMERGENCY 체크리스트
    await shot(page, 'emr-create-form')

    await page.getByRole('button', { name: '저장', exact: true }).click()
    await acceptDialog(page, '저장 하시겠습니까')
    await acceptDialog(page, '저장되었습니다')

    await expect(page.getByRole('row', { name: new RegExp(planName) })).toBeVisible()
  })

  // 2. 작성자 계획 결재 상신
  await test.step('작성자 계획 결재 상신 (PENDING_APPROVAL)', async () => {
    const page = contexts[0].pages()[0]
    await openRowByName(page, planName)
    await page.getByRole('button', { name: '계획 결재 상신', exact: true }).click()
    await acceptDialog(page, '상신 하시겠습니까')
    await acceptDialog(page, '저장되었습니다')
  })

  // 3. 계획승인자 반려
  await test.step('계획승인자 반려 (→ DRAFT)', async () => {
    const { context, page } = await loginAs(browser, 'planApprover')
    contexts.push(context)
    await gotoList(page, EMR_PLANS)
    await openRowByName(page, planName)
    await rejectWithReason(page, rejectReason)
    await shot(page, 'emr-rejected')
  })

  // 4. 작성자: 반려 사유 확인 + 재상신
  await test.step('작성자 반려 사유 확인 + 재상신 (PENDING_APPROVAL)', async () => {
    const page = contexts[0].pages()[0]
    await gotoList(page, EMR_PLANS)
    await openRowByName(page, planName)
    await expect(page.getByText(rejectReason)).toBeVisible()   // 반려 사유 배너
    await shot(page, 'emr-writer-sees-reject')
    await page.getByRole('button', { name: '계획 결재 상신', exact: true }).click()
    await acceptDialog(page, '상신 하시겠습니까')
    await acceptDialog(page, '저장되었습니다')
  })

  // 5. 계획승인자 계획 승인
  await test.step('계획승인자 계획 승인 (APPROVED)', async () => {
    const page = contexts[1].pages()[0]
    await gotoList(page, EMR_PLANS)
    await openRowByName(page, planName)
    await page.getByRole('button', { name: '계획 승인', exact: true }).click()
    await acceptDialog(page, '승인 하시겠습니까')
    await acceptDialog(page, '저장되었습니다')
    await shot(page, 'emr-approved')

    // 승인되면 계획 탭 목록에서 제외됨 (훈련 탭으로 이동)
    await page.getByRole('button', { name: '목록', exact: true }).click()
    await expect(page.getByRole('row', { name: new RegExp(planName) })).toHaveCount(0)
  })

  for (const c of contexts) await c.close()
})
