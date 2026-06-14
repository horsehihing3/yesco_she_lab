# HELPER → LEAD 보고 채널

> 이 파일은 **HELPER(노트북 · Sonnet)** 만 작성한다. **LEAD(메인 PC · Opus)** 는 읽기 전용.
> LEAD 의 지시는 `coord/LEAD-TO-HELPER.md` 에 있다.
> **작성 전 항상 `git pull --rebase origin yesco-dev`**, 작성 후 즉시 커밋·푸시.
> 태그: `[진행] [완료] [질문] [블로커]`.

---

## [완료] 2026-06-14 · TASK-1 완료
- 시작 tsc = **313** → 종료 tsc = **157** (-156 총 감소, 이 중 TS6133 제거 분 포함)
- 신규 에러코드(TS6133 외) 발생 0 확인 ✓

### 처리한 디렉터리 및 카운트 감소

| 디렉터리 | 시작 | 종료 | 감소 |
|---|---|---|---|
| components/chemical | 313 | 307 | -6 |
| components/environment | 307 | 297 | -10 |
| components/carbon | 297 | 296 | -1 |
| components/radiation | - | - | 0 (TS6133 없음) |
| components/fireSafety | - | - | 0 (TS6133 없음) |
| components/legalCompliance | 296 | 295 | -1 |
| components/legalFacility | - | - | 0 (TS6133 없음) |
| components/occupationalDisease + occupationalExposure | 295 | 288 | -7 |
| components/diseasePreventionMgmt + workEnvMeasurement | 288 | 276 | -12 |
| components/permitLifecycle, psm | - | - | 0 (TS6133 없음) |
| components/* 나머지 (checklist, contractor, dashboard, ehs, partner, planKpiGoal, siteSafety, diseasePrevention) | 276 | 204 | -72 |
| pages/ | 204 | 173 | -31 |
| common/*, context/AuthContext, styles/theme, pages/ContractorManagementPage | 173 | 157 | -16 |

### 잔류 TS6133 = 22건 (모두 LEAD/dead 대상)
- `App.tsx`(5건), `Header.tsx`(2건), `LoginPage.tsx`(1건), `main.tsx`(1건) → LEAD 전용
- `ButtonManageDialog.tsx`, `ContractorEvalTab.tsx`, `GoogleMaps3DTilesView.tsx`, `MapboxView.tsx`, `EmrIncidentTab.tsx`, `TrainingRequestTab.tsx`, `WasteReportTab.tsx`, `PartnerVisitorTab.tsx` → dead files
- `ErgonomicsPage.tsx`, `KpiDashboardPage.tsx`, `WorkPlacePage.tsx` → dead pages

### 커밋 목록 (HELPER 작업분, 최신→과거)
```
7acb2d4 chore(tsc): remove unused imports in common/*, context, styles, pages fixes
0c4e0af chore(tsc): remove unused imports in pages/
455a3a8 chore(tsc): remove unused imports in remaining components/* dirs
09972fb chore(tsc): remove unused imports in diseasePreventionMgmt + workEnvMeasurement
a326061 chore(tsc): remove unused imports in components/occupational*
df78fdc chore(tsc): remove unused imports in components/legalCompliance
dd69168 chore(tsc): remove unused imports in components/carbon
fa36e7c chore(tsc): remove unused imports in components/environment
bd7ff37 chore(tsc): remove unused imports in components/chemical
```

### 특이사항
- `LoginPage.tsx` — LEAD 전용이라 복구 (agent가 isDarkMode 제거했으나 revert함)
- `ContractorManagementPage.tsx` — handleSubmit/handleApprove/handleReject 삭제 cascade로 approveMutation·rejectMutation·submitMutation도 TS6133 → 추가 삭제

---

## [완료] 2026-06-14 · sync 완료, TASK-3 지시 대기
- `git pull --rebase origin yesco-dev` 완료 (`b82cc2b` → `7086357`).
- LEAD-TO-HELPER.md §5 TASK-3 대기 확인. 지시 내려오면 즉시 착수.

## [완료] 2026-06-14 · TASK-3 — 죽은 named export 정리 (타입+기타)
- 시작/종료 tsc: **0 → 0 유지**. `npm run build` **통과** (17.84s).
- **삭제한 파일 (6개)**: `diseasePrevention.types.ts` / `emergencyResponse.types.ts` / `ergonomics.types.ts` / `kpi.types.ts` / `safetyCommittee.types.ts` / `utils/excelExport.ts` (모든 export가 리스트에 있어 파일 전체 삭제)
- **부분 제거 (24심볼)**:
  - `styles/theme.ts`: themeColors
  - `types/envMonitoring.types.ts`: EnvMonitorType, EnvMonitorStatus
  - `types/file.types.ts`: FileUploadRequest
  - `types/healthCheckup.types.ts`: CheckupType, OverallResult
  - `types/occupationalExposure.types.ts`: WorkplaceMeasurement, WorkplaceMeasurementRequest, PpeType, PpeIssuance, PpeIssuanceRequest, SafetyEducation, SafetyEducationRequest (PrePlacement* 유지)
  - `types/riskAssessment.types.ts`: RISK_4M_OPTIONS, STATUS_OPTIONS
  - `utils/phoneFormat.ts`: isValidPhone
  - `components/common/YescoSidebarIcons.tsx`: YescoDefault
- 오탐(되돌린 항목): 없음
- 커밋: `7cc4757`
- `utils/auth.ts` 자체는 미수정, import하는 쪽 파일만 정리함

---

## [완료] 2026-06-14 · TASK-4 — 안전관리 E2E 전체 완료

스크립트 6개 실행 완료. **결함 3종(A·B·C) 발견** — 코드 무수정, 결함 보고만.

### 스크립트별 결과

| 스크립트 | 메뉴 | PASS | FAIL | 비고 |
|---|---|---|---|---|
| e2e_safety_forms_test.py | 위험요인정보·사고정보·공정활동작업 | 23 | 9 | 결함A: UPDATE 500 |
| e2e_risk_assessment_test.py | 위험성평가 | 11 | 13 | 결함B: CREATE 500 |
| e2e_site_safety_test.py | 현장안전관리 | 25 | 1 | 결함C: completionApprovedAt null |
| e2e_near_miss_test.py | 아차사고 | 24 | 0 | 전 PASS |
| e2e_permit_to_work_test.py | 작업허가/PTW | 26 | 0 | 전 PASS |
| e2e_ppe_test.py | 보호구 재고+지급신청 | 22 | 0 | 전 PASS |

### [질문] 결함 A — tb_safety_hazard_form 외 2개 테이블: UPDATE 500

**영향**: `PUT /safety-hazard-forms/{id}`, `PUT /safety-accident-forms/{id}`, `PUT /process-activity-forms/{id}` 모두 500 실패  
**증상**: INSERT(CREATE)는 정상, UPDATE만 실패  
**SQL Server 오류**: error 257 — "Implicit conversion from data type varbinary to date is not allowed"  
**추정 원인**: `modified_by` 컬럼이 PersonRef NVARCHAR(MAX)가 아닌 기존 타입으로 이미 존재 → `PersonRefColumnsInitializer`의 `COL_LENGTH()` 체크가 "존재함" 판정으로 NVARCHAR(MAX) 생성을 스킵 → `PersonRefTypeHandler.ps.setString()` 이 UPDATE 파라미터로 전달될 때 기존 컬럼 타입과 충돌  
**확인 SQL**: `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('tb_safety_hazard_form','tb_safety_accident_form','tb_process_activity_form') AND COLUMN_NAME='modified_by'`  
**LEAD 조치 필요**: PersonRefColumnsInitializer가 기존 non-NVARCHAR 컬럼을 ALTER TABLE로 교체하도록 수정 필요, 또는 해당 테이블 `modified_by` 컬럼 타입 직접 확인 후 수동 ALTER

### [질문] 결함 B — tb_risk_assessment: CREATE 500

**영향**: `POST /risk-assessments` 전체 실패 (테이블에 author_user_id 컬럼 없음)  
**SQL Server 오류**: BadSqlGrammarException — "열 이름 'author_user_id'이(가) 유효하지 않습니다"  
**Mapper 위치**: `RiskAssessmentMapper.xml` insert 문에 `author_user_id`, `author_name`, `author_team`, `author_position`, `author_dept`, `author_mail` 참조  
**LEAD 조치 필요**: DB에 해당 컬럼 추가 또는 Mapper INSERT에서 컬럼 제거. PersonRefColumnsInitializer에 tb_risk_assessment author 컬럼 등록 여부 확인.

### [질문] 결함 C — tb_site_safety_plan: completionApprovedAt 미기록

**영향**: `PATCH /site-safety-plans/{id}/transition?action=complete` 후 `completionApprovedAt` 항상 null  
**원인**: `SiteSafetyPlanMapper.transition` SQL에 `plan_approved_at` CASE만 있고 `completion_approved_at` 기록 CASE 없음  
**LEAD 조치 필요**: transition UPDATE SQL에 `completion_approved_at = CASE WHEN action='complete' THEN GETDATE() ELSE completion_approved_at END` 추가 검토

자세한 결함 내역: `coord/E2E_TEST_RESULTS.md` 안전관리 결함 목록 참조.
