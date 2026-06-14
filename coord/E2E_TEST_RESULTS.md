# 표준화 검증 — 도메인별 E2E 테스트 공유 결과표

> 방법(3중 검증): **① 정적 코드점검**(model/mapper/controller 패턴) → **② API E2E**(등록·수정·상신·승인·반려·완료 전 사이클을 REST로 자기정리 구동) → **③ 프론트 payload 대조**(화면이 보내는 요청 필드 = E2E·백엔드 일치 확인).
> 분담: **EHS경영 = LEAD(메인PC)** / **안전관리 = HELPER(노트북)**.
> 공통 규칙: 테스트 레코드는 `ZZ_E2E_*` 마커로 등록 후 **반드시 자기삭제(soft-delete 포함)**. 끝나면 목록에 `ZZ_E2E` 0건 확인. 결과를 이 표에 갱신하고 `coord/HELPER-TO-LEAD.md`(HELPER)에 보고.
> 상태 표기: ⬜ 미착수 / 🔄 진행 / ✅ 통과 / ⚠️ 이슈(비고에 내용) / ⏭️ 대상아님(view·container).

---

## 진행 요약
| 도메인 | 담당 | 메뉴수 | 완료 | 비고 |
|---|---|---|---|---|
| EHS경영 | LEAD | 9 | 1 | 감사점검 완료 |
| 안전관리 | HELPER | 8 | 0 | 착수 대기 |

---

## EHS경영 (LEAD 담당)

| # | 메뉴 | 라우트 | 주요 테이블(PersonRef역할) | 결재흐름 | ①정적 | ②E2E | ③프론트 | 결과 | 비고 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 감사점검 | /audit-inspection | tb_audit_plan(ALL4)·tb_audit(작성/계획/완료, 수정flat) | 계획상신→승인 / 실시수정→완료승인 | ✅ | ✅ 26+22 PASS | ✅ payload일치 | ✅ | 계획+실시 전 사이클·혼합테이블 완료 |
| 2 | 계획·KPI·목표 | /plan-kpi-goal | tb_ehs_annual_plan(ALL4) | 상신→계획승인→완료승인 | ⬜ | ⬜ | ⬜ | ⬜ | 레퍼런스 DTO패턴 |
| 3 | 비상대응 | /emergency-response | tb_emergency_plan(ALL4)·tb_emergency_contact(작성) | 상신→승인→완료 | ⬜ | ⬜ | ⬜ | ⬜ | 다중탭 |
| 4 | 법규준수 | /legal-compliance | tb_legal_compliance_plan(ALL4)·tb_legal_compliance_exec(작성/계획/완료,수정flat)·tb_legal_law(작성) | 상신→승인 | ⬜ | ⬜ | ⬜ | ⬜ | 혼합테이블 포함 |
| 5 | EHS소통 | /ehs/communication | tb_ehs_manager(작성) 등 | 혼합/대부분無 | ⬜ | ⬜ | ⬜ | ⬜ | 컨테이너(여러 탭) |
| 6 | 교육관리 | /training | (착수 시 확정) | 일부有 | ⬜ | ⬜ | ⬜ | ⬜ | 템플릿 의존 |
| 7 | EHS예산 | /ehs-budget | tb_ehs_budget(비PersonRef) | 無 | ⬜ | ⬜ | ⬜ | ⬜ | 단순 CRUD |
| 8 | 사고대응 | /incident-response | (착수 시 확정) | 無 | ⬜ | ⬜ | ⬜ | ⬜ | 단순 CRUD |
| 9 | 도면뷰 | /workplace-drawings/view | tb_floor_drawing | 無(읽기전용) | ⏭️ | ⏭️ | ⏭️ | ⏭️ | view-only — CRUD 없음 |

---

## 안전관리 (HELPER 담당)

| # | 메뉴 | 라우트 | 주요 테이블(PersonRef역할) | 결재흐름 | ①정적 | ②E2E | ③프론트 | 결과 | 비고 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 위험요인정보 | /safety-hazard-info | tb_safety_hazard_form(작성/수정) | 無 | ⬜ | ⬜ | ⬜ | ⬜ | 다중항목 폼 |
| 2 | 사고정보 | /safety-accident-info | tb_safety_accident_form(작성/수정) | 無 | ⬜ | ⬜ | ⬜ | ⬜ | 다중항목 폼 |
| 3 | 공정활동작업 | /process-activity-work | tb_process_activity_form(작성/수정) | 無 | ⬜ | ⬜ | ⬜ | ⬜ | 계층(공정→항목) |
| 4 | 위험성평가 | /risk-assessment | tb_risk_assessment(계획/완료승인) | 상신→승인→완료 | ⬜ | ⬜ | ⬜ | ⬜ | 결재 有 |
| 5 | 현장안전관리 | /site-safety-mgmt | tb_site_safety_plan(작성/계획/완료, 수정flat) | 상신→승인→완료 | ⬜ | ⬜ | ⬜ | ⬜ | 혼합테이블·파일 |
| 6 | 아차사고 | /near-miss | tb_near_miss(비PersonRef로 추정) | 無 | ⬜ | ⬜ | ⬜ | ⬜ | 파일·도면마커 |
| 7 | 작업허가(PTW) | /safety-work | tb_permit_to_work(작성/계획/완료) | 상신→승인→완료상신→완료 | ⬜ | ⬜ | ⬜ | ⬜ | 2단계 결재·파일 |
| 8 | 보호구 | /ppe-equipment | tb_ppe_equipment(비PersonRef로 추정) | 無 | ⬜ | ⬜ | ⬜ | ⬜ | 재고+요청 2탭 |

---

### 작업 메모
- 엔드포인트 경로·요청 바디는 **착수 시 해당 Controller를 직접 읽어 확정**한다(추정 금지 — 감사 사례처럼 `/audit-plan` 등 실제 경로가 다름).
- 레퍼런스 E2E 스크립트: `coord/e2e_audit_plan_test.py`, `coord/e2e_audit_exec_test.py` (복제·수정해 사용).
- 결재흐름 없는 단순 CRUD 도메인은 등록→수정→재조회→삭제 왕복 + (PersonRef면) 작성자/수정자 flat 검증까지.
- 파일업로드/템플릿 의존 등 자동화 어려운 항목은 가능한 범위까지 + **비고에 "수동확인 필요" 명시**(무리한 자동화 금지).
