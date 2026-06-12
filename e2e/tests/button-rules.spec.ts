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

  // ── 비상 계획 ── 일반관리자=EHS_ADMIN ─────────────────────────────────
  await test.step('비상 계획', async () => {
    const v = buttonRuleLookup(rules, 'EHS 경영 › 비상 훈련 › 비상 계획')
    // New = 일반관리자+슈퍼 (writer/guest 불가)
    expect(v('LIST', '신규 등록', 'EHS_ADMIN'), 'New/일반관리자').toBe(true)
    expect(v('LIST', '신규 등록', 'superAdmin'), 'New/superAdmin').toBe(true)
    expect(v('LIST', '신규 등록', 'writer'), 'New/writer').toBe(false)
    expect(v('LIST', '신규 등록', 'guest'), 'New/guest').toBe(false)
    // 상신·수정·삭제 = 작성자+슈퍼
    for (const btn of ['계획 결재 상신', '수정', '삭제']) {
      expect(v('DRAFT', btn, 'writer'), `${btn}/writer`).toBe(true)
      expect(v('DRAFT', btn, 'superAdmin'), `${btn}/superAdmin`).toBe(true)
      expect(v('DRAFT', btn, 'guest'), `${btn}/guest`).toBe(false)
      expect(v('DRAFT', btn, 'EHS_ADMIN'), `${btn}/일반관리자`).toBe(false)
    }
    // 반려·계획승인 = 계획승인자+슈퍼
    for (const btn of ['반려', '계획 승인']) {
      expect(v('PENDING_APPROVAL', btn, 'planApprover'), `${btn}/planApprover`).toBe(true)
      expect(v('PENDING_APPROVAL', btn, 'superAdmin'), `${btn}/superAdmin`).toBe(true)
      expect(v('PENDING_APPROVAL', btn, 'guest'), `${btn}/guest`).toBe(false)
      expect(v('PENDING_APPROVAL', btn, 'writer'), `${btn}/writer`).toBe(false)
    }
  })

  // ── 작업 허가 › 허가 신청 ── 일반관리자=EHS_ADMIN ──────────────────────────
  await test.step('작업허가 허가신청', async () => {
    const v = buttonRuleLookup(rules, '안전 관리 › 작업 허가 › 허가 신청')
    // New = 일반관리자+슈퍼 (writer/TEAM_ADMIN/guest 불가)
    expect(v('LIST', '신규 등록', 'EHS_ADMIN')).toBe(true)
    expect(v('LIST', '신규 등록', 'superAdmin')).toBe(true)
    expect(v('LIST', '신규 등록', 'writer')).toBe(false)
    expect(v('LIST', '신규 등록', 'TEAM_ADMIN')).toBe(false)
    expect(v('LIST', '신규 등록', 'guest')).toBe(false)
    // 계획상신/수정/삭제 = 작성자
    expect(v('DRAFT/REJECTED', '계획 결재 상신', 'writer')).toBe(true)
    expect(v('DRAFT/REJECTED', '계획 결재 상신', 'guest')).toBe(false)
    // 계획반려/승인 = 계획승인자
    expect(v('PENDING_APPROVAL/REQUESTED', '계획 결재 승인', 'planApprover')).toBe(true)
    expect(v('PENDING_APPROVAL/REQUESTED', '계획 결재 승인', 'guest')).toBe(false)
    expect(v('PENDING_APPROVAL/REQUESTED', '계획 결재 승인', 'writer')).toBe(false)
    // 점검 저장/완료상신 = 점검자(auditor)
    expect(v('APPROVED', '저장 (체크리스트)', 'auditor')).toBe(true)
    expect(v('APPROVED', '저장 (체크리스트)', 'writer')).toBe(false)
    expect(v('APPROVED', '완료 결재 상신', 'auditor')).toBe(true)
    // 완료반려/승인 = 완료승인자
    expect(v('COMPLETION_PENDING', '완료 결재 승인', 'completionApprover')).toBe(true)
    expect(v('COMPLETION_PENDING', '완료 결재 승인', 'guest')).toBe(false)
  })

  // ── 내부 감사 (감사 계획 / 감사 실시) ── 일반관리자=EHS_ADMIN ────────────────
  await test.step('내부감사', async () => {
    const plan = buttonRuleLookup(rules, 'EHS 경영 › 내부 감사 › 감사 계획')
    // New = 일반관리자+슈퍼
    expect(plan('LIST', '신규 등록', 'EHS_ADMIN')).toBe(true)
    expect(plan('LIST', '신규 등록', 'superAdmin')).toBe(true)
    expect(plan('LIST', '신규 등록', 'writer')).toBe(false)
    expect(plan('LIST', '신규 등록', 'TEAM_ADMIN')).toBe(false)
    expect(plan('LIST', '신규 등록', 'guest')).toBe(false)
    // 저장·상신 = 작성자, 반려·계획승인 = 계획승인자
    expect(plan('PLAN', '계획 결재 상신', 'writer')).toBe(true)
    expect(plan('PENDING_APPROVAL', '계획 승인', 'planApprover')).toBe(true)
    expect(plan('PENDING_APPROVAL', '계획 승인', 'guest')).toBe(false)
    // 감사 실시: 진행중 저장 = 감사원(auditor), 완료승인 = 완료승인자
    const exec = buttonRuleLookup(rules, 'EHS 경영 › 내부 감사 › 감사 실시')
    expect(exec('IN_PROGRESS', '저장 (감사 정보)', 'auditor')).toBe(true)
    expect(exec('IN_PROGRESS', '저장 (감사 정보)', 'guest')).toBe(false)
    expect(exec('PENDING_CLOSE', '완료 승인', 'completionApprover')).toBe(true)
  })

  // ── KPI목표 (연간계획 / KPI 현황) ── 일반관리자=EHS_ADMIN ──────────────────
  await test.step('KPI목표', async () => {
    const plan = buttonRuleLookup(rules, 'EHS 경영 › KPI목표 › 연간계획')
    expect(plan('LIST', '신규 등록', 'EHS_ADMIN')).toBe(true)
    expect(plan('LIST', '신규 등록', 'superAdmin')).toBe(true)
    expect(plan('LIST', '신규 등록', 'writer')).toBe(false)
    expect(plan('LIST', '신규 등록', 'TEAM_ADMIN')).toBe(false)
    expect(plan('LIST', '신규 등록', 'guest')).toBe(false)
    expect(plan('DRAFT', '계획 결재 상신', 'writer')).toBe(true)
    expect(plan('PENDING_APPROVAL', '계획 승인', 'planApprover')).toBe(true)
    expect(plan('PENDING_APPROVAL', '계획 승인', 'guest')).toBe(false)
    const stat = buttonRuleLookup(rules, 'EHS 경영 › KPI목표 › KPI 현황')
    // KPI 값 저장·완료상신 = 작성자
    expect(stat('APPROVED', '저장 (KPI 값)', 'writer')).toBe(true)
    expect(stat('APPROVED', '저장 (KPI 값)', 'guest')).toBe(false)
    expect(stat('COMPLETION_PENDING', '완료 승인', 'completionApprover')).toBe(true)
    expect(stat('COMPLETION_PENDING', '완료 승인', 'guest')).toBe(false)
  })

  // ── 비상 훈련(드릴) ── 저장/완료상신=작성자, 반려/완료승인=완료승인자 ─────────
  await test.step('비상 훈련(드릴)', async () => {
    const v = buttonRuleLookup(rules, 'EHS 경영 › 비상 훈련 › 비상 훈련')
    expect(v('SCHEDULED', '저장', 'writer')).toBe(true)
    expect(v('SCHEDULED', '저장', 'guest')).toBe(false)
    expect(v('SCHEDULED', '완료 결재 상신', 'writer')).toBe(true)
    expect(v('SCHEDULED', '완료 결재 상신', 'guest')).toBe(false)
    expect(v('SCHEDULED', '완료 승인', 'completionApprover')).toBe(true)
    expect(v('SCHEDULED', '완료 승인', 'guest')).toBe(false)
  })

  // ── 위험성 평가 ── 일반관리자 = RISK_ASSESS_ADMIN (없으면 EHS_ADMIN) ─────────
  await test.step('위험성 평가', async () => {
    const v = buttonRuleLookup(rules, '안전 관리 › 위험성 평가')
    // New = superAdmin + admin (writer/guest 불가)
    expect(v('LIST', 'New', 'superAdmin'), 'New/superAdmin').toBe(true)
    expect(v('LIST', 'New', 'writer'),     'New/writer').toBe(false)
    expect(v('LIST', 'New', 'guest'),      'New/guest').toBe(false)
    // WRITER_ADMIN: draft 계획 결재 상신
    expect(v('draft', '계획 결재 상신', 'writer'),     '상신/writer').toBe(true)
    expect(v('draft', '계획 결재 상신', 'superAdmin'), '상신/superAdmin').toBe(true)
    expect(v('draft', '계획 결재 상신', 'guest'),      '상신/guest').toBe(false)
    expect(v('draft', '계획 결재 상신', 'planApprover'), '상신/planApprover').toBe(false)
    // ADMIN_PLAN: submitted 반려/계획결재승인
    expect(v('submitted', '반려',           'planApprover'), '반려/planApprover').toBe(true)
    expect(v('submitted', '계획 결재 승인', 'planApprover'), '계획승인/planApprover').toBe(true)
    expect(v('submitted', '반려',           'writer'),       '반려/writer').toBe(false)
    // ADMIN_COMP: completion_submitted 완료결재승인
    expect(v('completion_submitted', '완료 결재 승인', 'completionApprover'), '완료승인/completionApprover').toBe(true)
    expect(v('completion_submitted', '완료 결재 승인', 'writer'),             '완료승인/writer').toBe(false)
    // WRITER_ADMIN: DETAIL 수정/삭제
    expect(v('DETAIL', '수정', 'writer'), 'DETAIL수정/writer').toBe(true)
    expect(v('DETAIL', '삭제', 'writer'), 'DETAIL삭제/writer').toBe(true)
  })

  // ── 보호구 지급 신청 ── 일반관리자 = PPE_ADMIN (없으면 EHS_ADMIN) ──────────
  await test.step('보호구 지급 신청', async () => {
    const v = buttonRuleLookup(rules, '안전 관리 › 보호구 장비 › 지급 신청')
    // WRITER_ONLY: 수정/취소 → writer=true, superAdmin=false!
    expect(v('REQUESTED', '수정',     'writer'),     '수정/writer').toBe(true)
    expect(v('REQUESTED', '수정',     'superAdmin'), '수정/superAdmin').toBe(false)
    expect(v('REQUESTED', '취소',     'writer'),     '취소/writer').toBe(true)
    // WRITER_ADMIN: 삭제 → writer=true, superAdmin=true
    expect(v('REQUESTED', '삭제',     'writer'),     '삭제/writer').toBe(true)
    expect(v('REQUESTED', '삭제',     'superAdmin'), '삭제/superAdmin').toBe(true)
    // ADMIN_ONLY: 승인/반려 → superAdmin=true, writer=false
    expect(v('REQUESTED', '승인',     'superAdmin'), '승인/superAdmin').toBe(true)
    expect(v('REQUESTED', '승인',     'writer'),     '승인/writer').toBe(false)
    expect(v('REQUESTED', '반려',     'superAdmin'), '반려/superAdmin').toBe(true)
  })

  // ── 건강검진 계획 ── 일반관리자 = HEALTH_ADMIN (없으면 EHS_ADMIN) ──────────
  await test.step('건강검진 계획', async () => {
    const v = buttonRuleLookup(rules, '보건 관리 › 건강 검진 관리 › 건강검진 계획')
    // New = ADMIN_ONLY
    expect(v('LIST', '신규 등록', 'superAdmin'), 'New/superAdmin').toBe(true)
    expect(v('LIST', '신규 등록', 'writer'),     'New/writer').toBe(false)
    // WRITER_ADMIN: PLANNED 결재 상신
    expect(v('PLANNED', '계획 결재 상신', 'writer'),     '상신/writer').toBe(true)
    expect(v('PLANNED', '계획 결재 상신', 'superAdmin'), '상신/superAdmin').toBe(true)
    expect(v('PLANNED', '계획 결재 상신', 'guest'),      '상신/guest').toBe(false)
    // ADMIN_PLAN: PENDING_APPROVAL 반려/승인
    expect(v('PENDING_APPROVAL', '반려',           'planApprover'), '반려/planApprover').toBe(true)
    expect(v('PENDING_APPROVAL', '계획 결재 승인', 'planApprover'), '승인/planApprover').toBe(true)
    expect(v('PENDING_APPROVAL', '계획 결재 승인', 'writer'),       '승인/writer').toBe(false)
  })

  // ── 작업환경측정 (측정 계획 탭 대표) ─── 일반관리자 = WORK_ENV_ADMIN ─────────
  await test.step('작업환경측정 측정 계획', async () => {
    const v = buttonRuleLookup(rules, '보건 관리 › 작업환경 측정 › 측정 계획')
    expect(v('LIST',   '신규 등록', 'superAdmin'), 'New/superAdmin').toBe(true)
    expect(v('LIST',   '신규 등록', 'writer'),     'New/writer').toBe(false)
    expect(v('DETAIL', '수정',      'writer'),     '수정/writer').toBe(true)
    expect(v('DETAIL', '수정',      'superAdmin'), '수정/superAdmin').toBe(true)
    expect(v('DETAIL', '수정',      'guest'),      '수정/guest').toBe(false)
    expect(v('DETAIL', '저장',      'writer'),     '저장/writer').toBe(true)
  })

  // ── 질병예방관리 (근골격계 탭 대표) ─── 일반관리자 = HEALTH_ADMIN ──────────
  await test.step('질병예방관리 근골격계', async () => {
    const v = buttonRuleLookup(rules, '보건 관리 › 질병예방 관리 › 근골격계')
    expect(v('LIST',   '신규 등록', 'superAdmin'), 'New/superAdmin').toBe(true)
    expect(v('LIST',   '신규 등록', 'writer'),     'New/writer').toBe(false)
    expect(v('DETAIL', '수정',      'writer'),     '수정/writer').toBe(true)
    expect(v('DETAIL', '수정',      'guest'),      '수정/guest').toBe(false)
  })

  // ── 협력업체 안전 관리 (관리 탭) ─── 일반관리자 = EHS_ADMIN ─────────────────
  await test.step('협력업체 안전관리 관리탭', async () => {
    const v = buttonRuleLookup(rules, '협력 업체 관리 › 협력 업체 안전 관리 › 관리')
    expect(v('LIST',               '신규 등록',       'superAdmin'),         'New/superAdmin').toBe(true)
    expect(v('LIST',               '신규 등록',       'writer'),             'New/writer').toBe(false)
    expect(v('DRAFT',              '계획 결재 상신',  'writer'),             '상신/writer').toBe(true)
    expect(v('DRAFT',              '수정',            'writer'),             '수정/writer').toBe(true)
    expect(v('PENDING_APPROVAL',   '계획 결재 승인',  'planApprover'),       '계획승인/planApprover').toBe(true)
    expect(v('PENDING_APPROVAL',   '계획 결재 승인',  'writer'),             '계획승인/writer').toBe(false)
    expect(v('COMPLETION_PENDING', '완료 결재 승인',  'completionApprover'), '완료승인/completionApprover').toBe(true)
    expect(v('COMPLETION_PENDING', '완료 결재 승인',  'writer'),             '완료승인/writer').toBe(false)
  })

  // ── 법규 대응 계획 ─── 일반관리자 = COMPLIANCE_ADMIN (없으면 EHS_ADMIN) ──────
  await test.step('법규 대응 계획', async () => {
    const v = buttonRuleLookup(rules, 'EHS 경영 › 법규 대응 › 법규 대응 계획')
    expect(v('LIST',             '신규 등록',    'superAdmin'),   'New/superAdmin').toBe(true)
    expect(v('LIST',             '신규 등록',    'writer'),       'New/writer').toBe(false)
    expect(v('PLAN',             '계획 결재 상신', 'writer'),     '상신/writer').toBe(true)
    expect(v('PLAN',             '수정',         'writer'),       '수정/writer').toBe(true)
    expect(v('PLAN',             '수정',         'guest'),        '수정/guest').toBe(false)
    expect(v('PENDING_APPROVAL', '계획 승인',    'planApprover'), '승인/planApprover').toBe(true)
    expect(v('PENDING_APPROVAL', '계획 승인',    'writer'),       '승인/writer').toBe(false)
  })

  // ── 법규 대응 실시 ─── AUDITOR_ADMIN / ADMIN_COMP ────────────────────────────
  await test.step('법규 대응 실시', async () => {
    const v = buttonRuleLookup(rules, 'EHS 경영 › 법규 대응 › 법규 대응 실시')
    // AUDITOR_ADMIN: auditor=true, superAdmin=true, writer=false
    expect(v('PREPARING',     '저장 (감사 정보)',   'auditor'),            '저장/auditor').toBe(true)
    expect(v('PREPARING',     '저장 (감사 정보)',   'superAdmin'),         '저장/superAdmin').toBe(true)
    expect(v('PREPARING',     '저장 (감사 정보)',   'writer'),             '저장/writer').toBe(false)
    expect(v('IN_PROGRESS',   '완료 결재 상신',     'auditor'),            '완료상신/auditor').toBe(true)
    expect(v('IN_PROGRESS',   '완료 결재 상신',     'writer'),             '완료상신/writer').toBe(false)
    // ADMIN_COMP: PENDING_CLOSE 반려/완료승인
    expect(v('PENDING_CLOSE', '반려',               'completionApprover'), '반려/completionApprover').toBe(true)
    expect(v('PENDING_CLOSE', '완료 승인',          'completionApprover'), '완료승인/completionApprover').toBe(true)
    expect(v('PENDING_CLOSE', '완료 승인',          'writer'),             '완료승인/writer').toBe(false)
  })

  // ── 환경 폐기물 ─── 일반관리자 = WASTE_ADMIN (없으면 EHS_ADMIN) ───────────────
  await test.step('환경 폐기물', async () => {
    const v = buttonRuleLookup(rules, '환경 관리 › 폐기물')
    expect(v('LIST',              '신규 등록', 'superAdmin'), 'New/superAdmin').toBe(true)
    expect(v('LIST',              '신규 등록', 'writer'),     'New/writer').toBe(false)
    expect(v('STORING',           '수정',      'writer'),     '수정/writer').toBe(true)
    expect(v('STORING',           '수정',      'superAdmin'), '수정/superAdmin').toBe(true)
    expect(v('STORING',           '수정',      'guest'),      '수정/guest').toBe(false)
  })

  // ── 화학물질 위해성 보고 ─── 일반관리자 = CHEM_ADMIN (없으면 EHS_ADMIN) ────────
  await test.step('화학물질 위해성 보고', async () => {
    const v = buttonRuleLookup(rules, '화학물질 관리 › 위해성 보고')
    expect(v('LIST',       '신규 등록', 'superAdmin'), 'New/superAdmin').toBe(true)
    expect(v('LIST',       '신규 등록', 'writer'),     'New/writer').toBe(false)
    expect(v('COLLECTING', '수정',      'writer'),     '수정/writer').toBe(true)
    expect(v('COLLECTING', '수정',      'guest'),      '수정/guest').toBe(false)
  })

  await context.close()
})
