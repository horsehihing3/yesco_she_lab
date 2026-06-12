import { test, expect } from '@playwright/test'
import { loginAs, fetchButtonRules, buttonRuleLookup } from '../helpers/app'

/**
 * 버튼관리(tb_button_rule) 설정 검증 — 화면 데이터 의존 없이 API로 규칙을 읽어
 * "의도한 권한 모델"대로 설정됐는지 단언한다. 메뉴를 교정할 때마다 블록을 추가한다.
 *
 * 모델 요약: 일반사용자(guest)=액션OFF / 작성자(writer)=본인 수정·삭제·취소·상신 /
 *           일반관리자(도메인 역할)=New·관리액션 / 계획·완료승인자=해당 단계만 / 슈퍼=전체
 */
test('버튼관리 규칙 검증 (교정된 메뉴)', async ({ browser }) => {
  const { context, page } = await loginAs(browser, 'writer')
  const rules = await fetchButtonRules(page)

  // ── 교육현황 (관리자) ── 일반관리자=TRAINING_ADMIN ──────────────────────────
  await test.step('교육현황 (관리자)', async () => {
    const v = buttonRuleLookup(rules, 'EHS 경영 › 교육·훈련 › 교육현황 (관리자)')
    for (const [status, btn] of [['PENDING', '반려'], ['PENDING', '승인'], ['APPROVED', '수료']] as const) {
      // 관리액션: 일반사용자·작성자·계획·완료승인자 불가, 일반관리자·슈퍼 가능
      expect(v(status, btn, 'guest'), `${btn}/guest`).toBe(false)
      expect(v(status, btn, 'writer'), `${btn}/writer`).toBe(false)
      expect(v(status, btn, 'planApprover'), `${btn}/planApprover`).toBe(false)
      expect(v(status, btn, 'completionApprover'), `${btn}/completionApprover`).toBe(false)
      expect(v(status, btn, 'TRAINING_ADMIN'), `${btn}/일반관리자`).toBe(true)
      expect(v(status, btn, 'superAdmin'), `${btn}/superAdmin`).toBe(true)
    }
    for (const status of ['PENDING', 'APPROVED'] as const) {
      // 신청취소: 작성자(신청자 본인)·슈퍼만
      expect(v(status, '신청 취소', 'writer'), '신청취소/writer').toBe(true)
      expect(v(status, '신청 취소', 'superAdmin'), '신청취소/superAdmin').toBe(true)
      expect(v(status, '신청 취소', 'guest'), '신청취소/guest').toBe(false)
      expect(v(status, '신청 취소', 'TRAINING_ADMIN'), '신청취소/일반관리자').toBe(false)
    }
  })

  // ── 비상 계획 ── 일반관리자=EMERGENCY_ADMIN ─────────────────────────────────
  await test.step('비상 계획', async () => {
    const v = buttonRuleLookup(rules, 'EHS 경영 › 비상 훈련 › 비상 계획')
    // New = 일반관리자+슈퍼 (writer/guest 불가)
    expect(v('LIST', '신규 등록', 'EMERGENCY_ADMIN'), 'New/일반관리자').toBe(true)
    expect(v('LIST', '신규 등록', 'superAdmin'), 'New/superAdmin').toBe(true)
    expect(v('LIST', '신규 등록', 'writer'), 'New/writer').toBe(false)
    expect(v('LIST', '신규 등록', 'guest'), 'New/guest').toBe(false)
    // 상신·수정·삭제 = 작성자+슈퍼
    for (const btn of ['계획 결재 상신', '수정', '삭제']) {
      expect(v('DRAFT', btn, 'writer'), `${btn}/writer`).toBe(true)
      expect(v('DRAFT', btn, 'superAdmin'), `${btn}/superAdmin`).toBe(true)
      expect(v('DRAFT', btn, 'guest'), `${btn}/guest`).toBe(false)
      expect(v('DRAFT', btn, 'EMERGENCY_ADMIN'), `${btn}/일반관리자`).toBe(false)
    }
    // 반려·계획승인 = 계획승인자+슈퍼
    for (const btn of ['반려', '계획 승인']) {
      expect(v('PENDING_APPROVAL', btn, 'planApprover'), `${btn}/planApprover`).toBe(true)
      expect(v('PENDING_APPROVAL', btn, 'superAdmin'), `${btn}/superAdmin`).toBe(true)
      expect(v('PENDING_APPROVAL', btn, 'guest'), `${btn}/guest`).toBe(false)
      expect(v('PENDING_APPROVAL', btn, 'writer'), `${btn}/writer`).toBe(false)
    }
  })

  await context.close()
})
