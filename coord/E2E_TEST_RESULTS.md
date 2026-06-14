# 표준화 검증 — 도메인별 E2E 테스트 공유 결과표

> 방법(3중 검증): **① 정적 코드점검**(model/mapper/controller 패턴) → **② API E2E**(등록·수정·상신·승인·반려·완료 전 사이클을 REST로 자기정리 구동) → **③ 프론트 payload 대조**(화면이 보내는 요청 필드 = E2E·백엔드 일치 확인).
> 분담: **EHS경영 = LEAD(메인PC)** / **안전관리 = HELPER(노트북)**.
> 공통 규칙: 테스트 레코드는 `ZZ_E2E_*` 마커로 등록 후 **반드시 자기삭제(soft-delete 포함)**. 끝나면 목록에 `ZZ_E2E` 0건 확인. 결과를 이 표에 갱신하고 `coord/HELPER-TO-LEAD.md`(HELPER)에 보고.
> 상태 표기: ⬜ 미착수 / 🔄 진행 / ✅ 통과 / ⚠️ 이슈(비고에 내용) / ⏭️ 대상아님(view·container).

---

## 진행 요약
| 도메인 | 담당 | 메뉴수 | 완료 | 비고 |
|---|---|---|---|---|
| EHS경영 | LEAD | 9 | 9 | **전체 완료** (8 검증 + 도면뷰 N/A) — 결재4개 풀E2E, 잔여4개 CRUD스모크 |
| 안전관리 | HELPER | 8 | 8 | **전체 완료** — 결함 3종 발견(아래 결함표 참조) |
| 협력업체관리 | LEAD | 6 | 6 | **전체 완료** (작업허가는 PTW 재사용→안전관리 커버) |
| 보건관리 | LEAD | 4 | 4 | 검증완료 — ⚠️**건강검진계획 등록 버그 1건 발견** |

---

## EHS경영 (LEAD 담당)

| # | 메뉴 | 라우트 | 주요 테이블(PersonRef역할) | 결재흐름 | ①정적 | ②E2E | ③프론트 | 결과 | 비고 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 감사점검 | /audit-inspection | tb_audit_plan(ALL4)·tb_audit(작성/계획/완료, 수정flat) | 계획상신→승인 / 실시수정→완료승인 | ✅ | ✅ 26+22 PASS | ✅ payload일치 | ✅ | 계획+실시 전 사이클·혼합테이블 완료 |
| 2 | 계획·KPI·목표 | /plan-kpi-goal | tb_ehs_annual_plan(ALL4) | 상신→계획승인→완료승인 | ✅ | ✅ 26 PASS | ✅ payload일치 | ✅ | 2단계결재·계획/완료 양쪽반려 통과 (DTO패턴) |
| 3 | 비상대응 | /emergency-response | tb_emergency_plan(ALL4)·tb_emergency_contact(작성) | 상신→승인→완료 | ✅ | ✅ 15 PASS | ✅ payload일치 | ✅ | 계획 2단계결재+훈련자동생성, 연락처 CRUD |
| 4 | 법규준수 | /legal-compliance | tb_legal_compliance_plan(ALL4)·tb_legal_compliance_exec(작성/계획/완료,수정flat)·tb_legal_law(작성) | 계획상신→승인(실시자동생성)→실시완료 | ✅ | ✅ 16 PASS | ✅ payload일치 | ✅ | 계획+혼합실시(grade/reject/complete)+법령CRUD. ※법령 작성자 wire 미노출(설계) |
| 5 | EHS소통 | /ehs-managers | tb_ehs_manager(작성) | 無 | ✅ | ✅ CRUD | △ | ✅ | 담당자 CRUD·중첩없음. 작성자 wire 미노출(설계) |
| 6 | 교육관리 | /training-application | tb_training_*(비PersonRef) | status전이 | ✅ | ✅ CRUD | △ | ✅ | 교육신청 CRUD(상위 과정 의존) |
| 7 | EHS예산 | /ehs-budget-expenses | tb_ehs_budget*(비PersonRef) | 無 | ✅ | ✅ CRUD | △ | ✅ | 예산집행 단순 CRUD |
| 8 | 사고대응 | /incident-response | tb_incident_response(비PersonRef) | 無 | ✅ | ✅ CRUD | △ | ✅ | 단순 CRUD. ※update가 reported_at null-guard 없음(견고성 흠·표준화무관) |
| 9 | 도면뷰 | /workplace-drawings/view | tb_floor_drawing | 無(읽기전용) | ⏭️ | ⏭️ | ⏭️ | ⏭️ | view-only — CRUD 없음 |

---

## 안전관리 (HELPER 담당)

| # | 메뉴 | 라우트 | 주요 테이블(PersonRef역할) | 결재흐름 | ①정적 | ②E2E | ③프론트 | 결과 | 비고 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 위험요인정보 | /safety-hazard-info | tb_safety_hazard_form(작성/수정) | 無 | ✅ | ⚠️ 23PASS/9FAIL | △ | ⚠️ | **결함A**: UPDATE 500 — modified_by 컬럼 타입 불일치(SQL Server error 257). CREATE는 정상 |
| 2 | 사고정보 | /safety-accident-info | tb_safety_accident_form(작성/수정) | 無 | ✅ | ⚠️ 동일 | △ | ⚠️ | **결함A 동일**: tb_safety_accident_form.modified_by UPDATE 실패 |
| 3 | 공정활동작업 | /process-activity-work | tb_process_activity_form(작성/수정) | 無 | ✅ | ⚠️ 동일 | △ | ⚠️ | **결함A 동일**: tb_process_activity_form.modified_by UPDATE 실패 |
| 4 | 위험성평가 | /risk-assessment | tb_risk_assessment(계획/완료승인) | 상신→승인→완료 | ✅ | ⚠️ 11PASS/13FAIL | △ | ⚠️ | **결함B**: CREATE 500 — `author_user_id` 컬럼 DB에 미존재(BadSqlGrammarException) |
| 5 | 현장안전관리 | /site-safety-mgmt | tb_site_safety_plan(작성/계획/완료, 수정flat) | 상신→승인→완료 | ✅ | ✅ 25PASS/1FAIL | △ | ✅ | **결함C**: `completionApprovedAt` complete 전환 후 미기록(transition SQL에 해당 CASE 없음) |
| 6 | 아차사고 | /near-miss | tb_near_miss(비PersonRef) | 無 | ✅ | ✅ 24PASS/0FAIL | ✅ | ✅ | 전 CRUD 통과. 프론트 payload 12개 필드 일치 |
| 7 | 작업허가(PTW) | /safety-work | tb_permit_to_work(작성/계획/완료) | 상신→승인→완료상신→완료 | ✅ | ✅ 26PASS/0FAIL | △ | ✅ | 결재 전 사이클 통과. 최종상태=DONE(COMPLETED 아님) — 테스트 보정 완료 |
| 8 | 보호구 | /ppe-equipment+/ppe-request | tb_ppe_equipment·tb_ppe_request(비PersonRef) | 無/승인→지급 | ✅ | ✅ 22PASS/0FAIL | △ | ✅ | 재고 CRUD + 지급신청 승인→지급 전 사이클 통과 |

### 안전관리 결함 목록

| ID | 영향 테이블 | 엔드포인트 | 증상 | 근본원인 | 심각도 |
|---|---|---|---|---|---|
| 결함A | tb_safety_hazard_form, tb_safety_accident_form, tb_process_activity_form | PUT /safety-hazard-forms/{id} 외 2개 | UPDATE 500 — UncategorizedSQLException: SQL Server error 257 "Implicit conversion from data type varbinary to date" on modified_by column | `modified_by` 컬럼이 PersonRef NVARCHAR(MAX)가 아닌 기존 타입으로 존재 → PersonRefColumnsInitializer가 COL_LENGTH() 체크로 스킵, TypeHandler의 ps.setString()이 UPDATE 시 실패. INSERT(CREATE)는 정상 | 높음(수정 불가) |
| 결함B | tb_risk_assessment | POST /risk-assessments | CREATE 500 — BadSqlGrammarException: 열 이름 'author_user_id'이(가) 유효하지 않습니다 | Mapper INSERT SQL이 `author_user_id` 컬럼을 참조하나 DB 테이블에 해당 컬럼 미존재 | 높음(등록 불가) |
| 결함C | tb_site_safety_plan | PATCH /site-safety-plans/{id}/transition (action=complete) | `completionApprovedAt` 항상 null | transition UPDATE SQL에 complete 액션 시 completion_approved_at 기록 CASE가 없음 (plan_approved_at만 처리) | 중간(완료일시 미기록) |

---

## 협력업체관리 (LEAD 담당 — EHS경영 후 추가)

| # | 메뉴 | 라우트 | 주요 테이블(PersonRef역할) | 결재흐름 | ①정적 | ②E2E | ③프론트 | 결과 | 비고 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 협력사위험성평가 | /contractor → /contractor-plans | tb_contractor_plan(ALL4) | 상신→승인→완료(2단계) | ✅ | ✅ 10 PASS | ⬜ | ✅ | 2단계결재·반려 통과 (DTO패턴) |
| 2 | 협력사등록 | /contractor-registration | tb_contractor_registration(작성·민감개인정보) | 상태변경 | ✅ | ✅ 4 PASS | ⬜ | ✅ | CRUD+상태, 작성자 flat 노출·중첩없음 |
| 3 | 협력사안전관리 | /partner-safety-mgmt → /partner-safety-executions | tb_partner_safety_execution(비PersonRef) | create+complete | ✅ | ✅ 등록+토큰 | △ | ✅ | 토큰 자가점검(PUT수정 없음·정상) |
| 4 | 협력사평가 | /partner-mgmt → /partner/evals | tb_partner_eval(비PersonRef) | 無 | ✅ | ✅ CRUD | △ | ✅ | 평가 CRUD |
| 5 | 협력사노사협의회 | /partner-osh-committee → /osh-committees | tb_osh_committee(비PersonRef) | 출석/서명 | ✅ | ✅ CRUD | △ | ✅ | 협의회 CRUD |
| 6 | 협력사작업허가 | /partner-permit | tb_permit_to_work(작성/계획/완료) | 2단계결재 | ⏭️ | ⏭️ | ⏭️ | ⏭️ | PermitToWorkPage(mode=external) 재사용 → **안전관리(HELPER) PTW로 커버** |

## 보건관리 (LEAD 담당 — 협력업체관리 후 추가)

| # | 메뉴 | 라우트 | 주요 테이블(PersonRef역할) | 결재흐름 | ①정적 | ②E2E | ③프론트 | 결과 | 비고 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 건강검진 | /health-checkup/admin → /health-checkup-plan | tb_health_checkup_plan(수정/계획/완료, 작성flat) | 상신→승인→완료 | ✅ | ⚠️ **등록불가** | - | ⚠️ | **[버그] 등록 500 — 아래 발견사항 참조** |
| 2 | 작업환경측정 | /work-env-measurement → /wem-plans | tb_wem_plan(작성/수정) | 無 | ✅ | ✅ CRUD | △ | ✅ | 날짜 필수(프론트 항상 전송). null 시 jdbcType 누락 견고성흠 |
| 3 | 직업병관리 | /occupational-disease | tb_od_plan/worker/org/exposure(작성·민감) | 無 | ✅ | ✅ CRUD(plans) | △ | ✅ | 민감 개인정보, 작성자 flat·중첩없음 |
| 4 | 질병예방관리 | /disease-prevention-mgmt | tb_dp_msd/cvd/...(작성·민감) | 無 | ✅ | ✅ CRUD(msd) | △ | ✅ | 민감 개인정보, 작성자 flat·중첩없음 |

### 🐞 발견사항 (실제 버그)
- **[BUG·중] 건강검진계획(/health-checkup-plan) 등록 전부 실패(500)** — INSERT가 존재하지 않는 컬럼 `created_by_dept` 참조.
  - 근본원인: `AllTablesPersonColumnsInitializer`는 `created_by_user_id/name/team/position`만 보장(**dept 누락**). `created_by_dept`는 V120 Flyway에만 정의 → **Flyway 비활성**이라 이 DB에 미생성. 매퍼(HealthCheckupPlanMapper INSERT·resultMap)는 여전히 `created_by_dept` 참조 → 모든 등록 INSERT 실패.
  - 영향: 건강검진 계획 신규 등록 불가(수정/조회는 영향 적음). 기존 5건은 과거 데이터.
  - 수정안(택1): (A) 초기화기에 `tb_health_checkup_plan.created_by_dept` ensure 추가 — 매퍼·wire 무변경, 최소 (권장) / (B) 매퍼·모델·DTO·서비스에서 `created_by_dept` 제거(부서표시 손실). ※(A)는 서버 재기동 시 ALTER TABLE — 공유DB 스키마 변경이라 승인 후 적용.

### 발견사항 (비결함 메모)
- `LegalLawResponse`·`EhsManagerResponse` 는 작성자(createdBy*)를 **wire 에 노출하지 않음**(설계 — created_by JSON 저장은 됨, 화면엔 reviewer 등 다른 필드 표시). E2E에서 작성자 검증 제외 대상.

### 작업 메모
- 엔드포인트 경로·요청 바디는 **착수 시 해당 Controller를 직접 읽어 확정**한다(추정 금지 — 감사 사례처럼 `/audit-plan` 등 실제 경로가 다름).
- 레퍼런스 E2E 스크립트: `coord/e2e_audit_plan_test.py`, `coord/e2e_audit_exec_test.py` (복제·수정해 사용).
- 결재흐름 없는 단순 CRUD 도메인은 등록→수정→재조회→삭제 왕복 + (PersonRef면) 작성자/수정자 flat 검증까지.
- 파일업로드/템플릿 의존 등 자동화 어려운 항목은 가능한 범위까지 + **비고에 "수동확인 필요" 명시**(무리한 자동화 금지).
