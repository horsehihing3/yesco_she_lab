# E2E 커버리지 & 버그 로그

> 메뉴별 E2E(3중 검증)로 표준화(PersonRef/DTO/예외)를 검증한 결과·이력.
> 실행 스크립트: `coord/e2e_*.py` (도메인별, Python stdlib urllib·자기정리).
> 테스트 레코드는 `ZZ_E2E_*` / `TEST_<TAG>_*` 마커로 등록 후 **반드시 자기삭제**(soft-delete 포함). 종료 시 마커 0건 확인.

## 검증 방법 (3중)

```
① 정적 코드점검 (model/mapper/controller 패턴)
② API E2E         (등록·수정·상신·승인·반려·완료 전 사이클을 REST로 자기정리 구동)
③ 프론트 payload 대조 (화면이 보내는 요청 필드 = E2E·백엔드 일치)
```
- 공유 DB 충돌 방지: 데이터 접두어 마커 사용. 정리 = `DELETE … WHERE … LIKE 'ZZ_E2E_%'` / `'TEST\_<TAG>\_%' ESCAPE '\'`.

## 커버리지 현황 — 4도메인 27메뉴 3중검증 완료

상태: ✅ 통과 / ⚠️ 결함(결함이력은 LAB_LOG·PROJECT_CONTEXT 참조) / ⏭️ 대상아님(view·재사용)

### EHS경영 (9)
| 메뉴 | 라우트 | 주요 테이블(PersonRef역할) | 결재흐름 | 결과 | pass |
|---|---|---|---|---|---|
| 감사점검 | /audit-inspection | tb_audit_plan(ALL4)·tb_audit(작성/계획/완료,수정flat) | 계획상신→승인 / 실시수정→완료승인 | ✅ | 26+22 |
| 계획·KPI·목표 | /plan-kpi-goal | tb_ehs_annual_plan(ALL4) | 상신→계획승인→완료승인 | ✅ | 26 |
| 비상대응 | /emergency-response | tb_emergency_plan(ALL4)·tb_emergency_contact(작성) | 상신→승인→완료(+훈련자동생성) | ✅ | 15 |
| 법규준수 | /legal-compliance | tb_legal_compliance_plan(ALL4)·_exec(작성/계획/완료,수정flat)·tb_legal_law(작성) | 계획상신→승인(실시자동)→실시완료 | ✅ | 16 |
| EHS소통 | /ehs-managers | tb_ehs_manager(작성) | 無 | ✅ | CRUD |
| 교육관리 | /training-application | tb_training_*(비PersonRef) | status전이 | ✅ | CRUD |
| EHS예산 | /ehs-budget-expenses | tb_ehs_budget*(비PersonRef) | 無 | ✅ | CRUD |
| 사고대응 | /incident-response | tb_incident_response(비PersonRef) | 無 | ✅ | CRUD ※update reported_at null-guard 없음 |
| 도면뷰 | /workplace-drawings/view | tb_floor_drawing | 無(읽기전용) | ⏭️ | view-only |

### 안전관리 (8)
| 메뉴 | 라우트 | 주요 테이블(PersonRef역할) | 결재흐름 | 결과 | pass |
|---|---|---|---|---|---|
| 위험요인정보 | /safety-hazard-info | tb_safety_hazard_form(작성/수정) | 無 | ⚠️ 결함A | 23P/9F |
| 사고정보 | /safety-accident-info | tb_safety_accident_form(작성/수정) | 無 | ⚠️ 결함A | 동일 |
| 공정활동작업 | /process-activity-work | tb_process_activity_form(작성/수정) | 無 | ⚠️ 결함A | 동일 |
| 위험성평가 | /risk-assessment | tb_risk_assessment(계획/완료승인) | 상신→승인→완료 | ⚠️ 결함B | 11P/13F |
| 현장안전관리 | /site-safety-mgmt | tb_site_safety_plan(작성/계획/완료,수정flat) | 상신→승인→완료 | ⚠️ 결함C | 25P/1F |
| 아차사고 | /near-miss | tb_near_miss(비PersonRef) | 無 | ✅ | 24P/0F |
| 작업허가(PTW) | /safety-work | tb_permit_to_work(작성/계획/완료) | 상신→승인→완료상신→완료(최종 DONE) | ✅ | 26P/0F |
| 보호구 | /ppe-equipment·/ppe-request | tb_ppe_equipment·tb_ppe_request(비PersonRef) | 無 / 승인→지급 | ✅ | 22P/0F |

### 협력업체관리 (6)
| 메뉴 | 라우트 | 주요 테이블(PersonRef역할) | 결재흐름 | 결과 | pass |
|---|---|---|---|---|---|
| 협력사위험성평가 | /contractor → /contractor-plans | tb_contractor_plan(ALL4) | 상신→승인→완료(2단계) | ✅ | 10 |
| 협력사등록 | /contractor-registration | tb_contractor_registration(작성·민감개인정보) | 상태변경 | ✅ | 4 |
| 협력사안전관리 | /partner-safety-mgmt → /partner-safety-executions | tb_partner_safety_execution(비PersonRef) | create+complete | ✅ | 등록+토큰 |
| 협력사평가 | /partner-mgmt → /partner/evals | tb_partner_eval(비PersonRef) | 無 | ✅ | CRUD |
| 협력사노사협의회 | /partner-osh-committee → /osh-committees | tb_osh_committee(비PersonRef) | 출석/서명 | ✅ | CRUD |
| 협력사작업허가 | /partner-permit | tb_permit_to_work(작성/계획/완료) | 2단계결재 | ⏭️ | PTW재사용→안전관리 커버 |

### 보건관리 (4)
| 메뉴 | 라우트 | 주요 테이블(PersonRef역할) | 결재흐름 | 결과 | pass |
|---|---|---|---|---|---|
| 건강검진 | /health-checkup/admin → /health-checkup-plan | tb_health_checkup_plan(수정/계획/완료,작성flat) | 상신→승인→완료 | ⚠️ 등록불가 | created_by_dept 버그 |
| 작업환경측정 | /work-env-measurement → /wem-plans | tb_wem_plan(작성/수정) | 無 | ✅ | CRUD ※날짜 null jdbcType 흠 |
| 직업병관리 | /occupational-disease | tb_od_plan/worker/org/exposure(작성·민감) | 無 | ✅ | CRUD(plans) |
| 질병예방관리 | /disease-prevention-mgmt | tb_dp_msd/cvd/…(작성·민감) | 無 | ✅ | CRUD(msd) |

## 설계메모 (비결함 — E2E에서 확인된 의도/견고성흠)
- **작성자 wire 미노출 = 설계의도**: `LegalLawResponse`·`EhsManagerResponse` 는 `createdBy*` 를 wire 에 노출하지 않음(created_by JSON 저장은 됨, 화면엔 reviewer 등 다른 필드 표시). E2E 작성자 검증 제외 대상.
- **incident_response update reported_at null-guard 없음**: 사고대응 update 가 reported_at null-guard 미보유 — 견고성 흠(표준화 무관).
- **WEM(작업환경측정) 날짜 null jdbcType 누락**: 날짜 null 시 jdbcType 미지정 견고성 흠 — 프론트가 항상 전송이라 현재 미발현.

## 결함 이력
> 안전관리 결함 **A**(modified_by 타입 UPDATE 500)·**C**(completionApprovedAt 미기록)·위험성평가 **B**(author_user_id CREATE 500)·보건 건강검진(created_by_dept 등록 500)은 별도 트랙으로 이관·기록됨 → **LAB_LOG.md / PROJECT_CONTEXT.md 참조**. (A·C=LIVE 이관, B·건강검진=커밋 f80438c 해소.) 여기 중복 기재하지 않음.

## (이력) 초기 E2E 버그 로그
| 발견일 | 메뉴 | 증상 | 원인 | 수정 |
|--------|------|------|------|------|
| 2026-06-12 | KPI목표 | 완료 반려 시 반려 사유가 화면에 안 뜸 | transition SQL이 `status='DRAFT'`일 때만 reject_reason 저장 → 완료반려(APPROVED)에서 유실 | EhsAnnualPlanMapper: `reject_reason = #{rejectReason}` (커밋 baec375) |
| 2026-06-12 | 결재 5개 모듈 | 반려→재상신·승인 후에도 옛 반려 사유 잔존 | `ELSE reject_reason`로 전이 시 미제거 | Ehs/Emergency/HealthCheckup/SiteSafety/Contractor mapper 통일 (커밋 853703e) |
