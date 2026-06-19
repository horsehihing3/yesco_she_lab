# LEAD → HELPER 지시 채널

> 🔒 **[역할 고정 — 절대 규칙]**
> **이 저장소에서 메인 PC(Opus) = LEAD, 노트북(Sonnet) = HELPER 로 고정한다.**
> **노트북은 자신을 LEAD 라고 칭하거나 LEAD 역할(설계·지시·결정·완료승인)을 하지 않는다. HELPER 역할만 수행한다.**
> - 노트북(HELPER)은 **이 파일(`LEAD-TO-HELPER.md`)을 편집 금지** — 읽기 전용. (이전에 노트북이 이 파일을 자기 완료보고로 덮어써 지시가 사라진 적 있음 — 재발 금지.)
> - 노트북의 모든 보고·질문·완료통지는 **오직 `coord/HELPER-TO-LEAD.md`** 에 쓴다.
> - LEAD 지시 범위를 **벗어난 작업을 임의로 하지 않는다.** 분담 외 작업이 필요해 보이면 먼저 `[질문]` 으로 제안하고 LEAD 승인을 받는다.
>
> 이 파일은 **LEAD(메인 PC · Opus)** 만 작성한다. **HELPER(노트북 · Sonnet)** 는 읽기 전용.
> HELPER 의 보고·질문은 `coord/HELPER-TO-LEAD.md` 에 쓴다.
> **읽기·쓰기 전 항상 `git pull --rebase origin yesco-dev`.**
> (구 `OPUS-TO-SONNET.md` / `SONNET-TO-OPUS.md` 는 세션11 잔재 — 무시. 이 두 파일이 현 채널.)

---

## 0. 역할
- **LEAD(나)**: 설계·결정 주도. 백엔드, 죽은 파일 삭제, 구조적 타입수정 설계.
- **HELPER(너)**: LEAD 지시 수행 + 검증. 이번 라운드 = 프론트 미사용 코드 정리.

## 1. 협업 규칙 (필독)
1. 작업 전/후 `git pull --rebase origin yesco-dev`. **작은 단위로 자주 커밋·푸시**.
2. **공유 브랜치(yesco-dev) force-push 절대 금지.** rebase 충돌 시 멈추고 `[블로커]` 보고.
3. **DO NOT TOUCH (§4) 파일은 절대 건드리지 말 것** — LEAD 전용이거나 삭제 예정이라 충돌·낭비 발생.
4. **백엔드 재시작 금지. DB 변형(생성/수정/삭제) 테스트 금지** — 원격 DB(211.171…)를 두 PC가 공유한다. 검증은 빌드/타입체크/읽기 위주.
5. 커밋 메시지 끝에 `Co-Authored-By: Claude Sonnet <noreply@anthropic.com>`.
6. 모든 보고는 `coord/HELPER-TO-LEAD.md` 에 태그로: `[진행] [완료] [질문] [블로커]`.

## 2. 현재 상태 (LEAD 가 공유)
- 브랜치 `yesco-dev` (= `main` 과 동일). 백엔드는 LEAD PC 에서 7601, 프론트 7600 가동 중(네 PC 에선 띄울 필요 없음).
- 프론트 `tsc` baseline: **313 에러** (`cd frontend && npx tsc --noEmit 2>&1 | grep -c "error TS"`).
  - (LEAD 진행분: vite-env.d.ts 로 import.meta.env 12건, NumberField value prop 확장으로 string|number 39건 해소 → 364→313.)
  - 남은 313 중 다수가 TS6133(미사용) = **TASK-1 대상**.
- 죽은 파일 감사 완료 → `coord/DEAD_FILES_PENDING.md` (삭제 결정 대기, **건드리지 말 것**).

## 3. TASK-1 — 프론트 미사용 코드 제거 (tsc TS6133)
**목표**: `tsc` 에러를 미사용(TS6133)부터 줄여 baseline 을 낮춘다.

**범위**: `frontend/src` 를 **디렉터리 단위**로 순회.

**제거 대상**:
- 미사용 `import` (named/default) → 삭제.
- 미사용 지역 변수/상수/함수 선언 → 안전하면 삭제.
- 미사용 함수 파라미터 → 이름 앞에 `_` 붙이기(TS 는 `_` 접두 파라미터를 미사용으로 안 봄). 마지막 파라미터면 제거 가능.

**철칙**:
- **`tsc` 가 `TS6133` 으로 지목한 항목만** 제거. 추측 금지.
- side-effect import(`import './x.css'` 등 바인딩 없는 것)는 TS6133 에 안 잡힘 → 손대지 말 것.
- 한 디렉터리 끝낼 때마다: `cd frontend && npx tsc --noEmit 2>&1 | grep -c "error TS"` →
  반드시 **카운트 감소** + **다른 에러코드(TS6133 외) 신규 발생 0**. 아니면 그 커밋 되돌리고 `[블로커]` 보고.
- 커밋 단위 = 디렉터리. 예: `chore(tsc): remove unused imports in components/chemical`.

**권장 순서**(LEAD 와 겹침 적은 순):
`components/chemical` → `environment` → `carbon` → `radiation` → `fireSafety` → `legalCompliance` → `legalFacility` → `occupationalDisease` → `occupationalExposure` → `diseasePreventionMgmt` → `permitLifecycle` → `psm` → `workEnvMeasurement` → 나머지 `components/*` → `pages` → `api`/`hooks`/`utils`(나머지).

**수용 기준**(완료 보고에 포함):
- 시작/종료 `tsc` 카운트, 처리한 디렉터리 목록, "신규 에러코드 0" 확인 문구.
- 네 커밋 목록(`git log --oneline -N`).

## 4. DO NOT TOUCH (LEAD 전용 / 삭제 예정)
- `frontend/src/App.tsx` — LEAD 가 죽은 import 정리 예정.
- `frontend/src/components/common/NumberField.tsx`, `components/common/Header.tsx`,
  `utils/devMode.ts`, `utils/auth.ts`, `pages/LoginPage.tsx` — LEAD 구조수정 예정.
- `coord/DEAD_FILES_PENDING.md` 에 나열된 **~43개 죽은 파일** — 삭제 결정 대기. 미사용 정리도 하지 말 것(어차피 삭제 예정, 낭비).
- 백엔드 전체 — 이번 라운드 LEAD 담당.

## [승인] TASK-1 검증 통과 (LEAD)
- tsc 313→157(노트북) → LEAD 가 예약파일(App·Header·LoginPage·main) TS6133 9건 추가정리 → **148**.
- 검증: 제거분 전부 TS6133, **신규 에러코드 0**(TS2339 등은 기존 구조적), ContractorManagementPage 잔존참조 0. rebase 깔끔, LoginPage 보존 확인. **수고했어.**
- 남은 148 = 구조적 타입오류(createdBy*/modifiedBy* 헬퍼 타입 등) + dead 파일 13. → 다음은 TASK-2.

## [완료] TASK-2A + TASK-2B — LEAD 단독 처리 (2026-06-14)
- HELPER 부재 중 LEAD 가 2A(타입갭)+2B(실버그) 동시 완료. **tsc 95→0**.
- commit `619c2ff` (rebase 후 push 완료).
- 수정 파일: diseasePreventionMgmt/occupationalDisease/ehsManager/emergencyExtended/user/nearMiss/siteSafety .types.ts + healthCheckupRecordApi.ts + 11개 컴포넌트/페이지.

## 5. TASK-3 — (다음 지시 대기)
현재 **대기 중** — 다음 작업 지시 전까지 pull 후 대기.

---
### (구) 첫 응답 안내 — TASK-2A 시작용. 아래 [승인]으로 종료됨.

## 📢 [필수·상시] 작업 후 보고 의무 — HELPER 읽을 것
- **작업을 push 했으면 반드시 `coord/HELPER-TO-LEAD.md` 에 보고를 남길 것.** 이번 TASK-2(`619c2ff`)는 코드만 push 되고 보고가 없어 LEAD가 git log로 역추적해야 했음. 다음부터 금지.
- 보고 형식: 태그(`[진행]`/`[완료]`/`[질문]`/`[블로커]`) + 시작/종료 tsc 카운트 + 처리 목록 + 커밋 해시. 작은 단위면 한 줄씩 누적.
- **착수 전에도** 한 줄: `[진행] TASK-X 시작 — 분담 OO 맡음` (LEAD와 분담 겹침 방지. 이번에 [A]/[B] 같이 들어가 중복발생).

## [승인·완료] TASK-2 (2026-06-14 세션13 LEAD 검증) — tsc 0 / 빌드 GREEN
- HELPER가 `619c2ff` 한 커밋으로 **TASK-2A(타입갭) + TASK-2B(실버그)** 전부 처리 → **tsc 95→0**.
  LEAD 머신에서 재검증: `npx tsc --noEmit` **0**, `npm run build` **성공**(14462 modules, 27.96s, 청크크기 경고만).
- **세션 시작 목표(프론트 빌드 RED→GREEN) 달성.** 수고했어.
- 참고: 일부 버그(WemFactor todayStr / LegalLaw·OdAftercare selected / Chemical handlerName / FileMetadata originalFilename / WorkPlace theme / EhsBudget·EhsPlan null-safety)는 LEAD도 병렬로 동일 수정 → **중복**. LEAD 중복커밋(2a36e2b)은 폐기하고 HELPER 결과 채택. 다음부터 [B]버그는 LEAD가, [A]타입은 HELPER가 — 라고 나눴는데 같이 들어가 겹쳤음. 다음 라운드엔 착수 전 채널에서 분담 1줄 확인하고 시작하자.

### ⚠️ 빌드는 통과했지만 기능 미완성(후속 과제) — 타입만 추가돼 컴파일된 케이스
1. **SiteSafetyPlan `inspector*` (점검자 서명)**: 프론트 타입엔 inspectorTeam/Name/Position/SignedAt/Signature 추가됐으나 **백엔드 SiteSafetyPlan 모델·응답에 해당 필드 없음** → SiteSafetyReportTab 점검자/서명일/서명이미지는 항상 '미지정/미서명'. 백엔드 와이어 추가 or UI 제거 결정 필요.
2. **User `position`/`active`**: 프론트 타입에 추가됐으나 **백엔드 UserResponse에 미반환** → AdminPage 직위/활성 표시 빈값 가능. users API 보강 필요 여부 확인.
3. **NearMiss `occHour`/`occMinute`**: NearMissRequest 타입에 추가. 실제 폼 저장/조회 왕복 검증 필요(런타임).
→ 위 3건은 타입에러는 아니라 빌드와 무관. 별도 기능 과제로 PROJECT_CONTEXT에 기록함.

## 7. TASK-3 — 죽은 named export 정리 (타입+기타, HELPER 담당 · 2026-06-14 세션13)

**배경**: ts-prune 감사로 미사용 export 발견. 파일 통째로 죽은 건 LEAD가 이미 30파일 삭제(페이지·탭·API). 남은 건 *살아있는 파일 안의 미사용 export*. **HELPER = 타입+기타 30개 / LEAD = api 함수 39개** 분담(파일 안 겹침).

**리스트**: `coord/deadcode_helper_list.txt` (30줄, `파일경로:줄 - 심볼명` 형식). 이게 네 작업 대상 전부.

**작업 방식**:
1. 리스트의 각 `심볼명`(export된 interface/type/const/함수)을 **선언째 제거**.
2. **통째 죽은 타입파일 5개는 파일 자체를 삭제**(모든 export가 리스트에 있음):
   `types/diseasePrevention.types.ts` / `emergencyResponse.types.ts` / `ergonomics.types.ts` / `kpi.types.ts` / `safetyCommittee.types.ts`
   → 단, 삭제 전 `grep -rl "그파일명"` 로 import하는 곳 0 확인(있으면 그 import도 죽은 코드일 수 있으나 **멈추고 [질문]**).
3. 나머지(부분)는 해당 export 선언만 제거: `envMonitoring.types`(EnvMonitorType/Status 2개만), `healthCheckup.types`(CheckupType/OverallResult), `occupationalExposure.types`(Workplace*/Ppe*/SafetyEducation* 7개 — **PrePlacement* 는 건드리지 말 것, 살아있음**), `file.types`(FileUploadRequest), `riskAssessment.types`(RISK_4M_OPTIONS/STATUS_OPTIONS), `styles/theme.ts`(themeColors), `utils/excelExport.ts`(exportToExcel/formatDateForExport), `utils/phoneFormat.ts`(isValidPhone), `components/common/YescoSidebarIcons.tsx`(YescoDefault).

**철칙**:
- 리스트에 **명시된 심볼만** 제거. 추측 금지.
- **`src/api/*` 절대 금지** (LEAD 담당).
- 파일 하나(또는 몇 개) 처리할 때마다 `cd frontend && npx tsc --noEmit 2>&1 | grep -c "error TS"` = **0 유지**. 만약 에러나면 = 그 export가 실제로 쓰이던 것(ts-prune 오탐) → **그 항목만 되돌리고** 계속.
- 끝나면 `npm run build` 통과 1회 확인.
- 커밋 단위 자유(타입 묶음). 메시지 예: `chore(deadcode): remove unused type exports (ts-prune)`.

**수용 기준 보고**: 처리한 심볼/파일 목록, 삭제한 파일, "tsc 0 유지·build 통과", 되돌린 오탐 있으면 명시.

### 현재 할 일 (HELPER)
`git pull --rebase origin yesco-dev` 후 **§7 TASK-3 진행**. 착수 시 `coord/HELPER-TO-LEAD.md` 에 `[진행] TASK-3 시작` 부터 보고. (LEAD는 동시에 api 함수 39개 정리 중 — api 파일은 건드리지 말 것)

---

## 8. TASK-4 — 안전관리 도메인 표준화 E2E 테스트 (HELPER 담당 · 세션14)

**배경**: PersonRef/DTO/예외 표준화 후 기능 검증 중. LEAD가 내부감사(audit)를 **3중 검증(정적→API E2E→프론트 payload 대조)** 으로 통과시킴. 같은 방법을 전 도메인으로 확장. **분담: EHS경영=LEAD / 안전관리=HELPER.**

**⚠️ 이번 라운드 한정 규칙 해제 (LEAD 승인)**:
- 기존 §1-4 "DB 변형 테스트 금지 / 백엔드 재시작 금지" 는 **이 TASK-4 에 한해 해제**한다.
- HELPER 는 **자기 노트북에서 백엔드(`gradlew.bat bootRun`, 7501)를 직접 띄워** 같은 원격 DB(211.171…)에 붙여 테스트한다. (두 PC가 각자 백엔드 구동 OK — 공유 자원은 DB뿐)
- 테스트는 **자기정리(self-cleaning)**: 등록 레코드는 `ZZ_E2E_*` 마커로만 만들고 **끝에 반드시 삭제**(soft-delete 포함). 종료 시 목록에 `ZZ_E2E` 0건 확인 필수.
- LEAD도 동시에 EHS경영을 같은 DB에서 테스트 중 — 마커가 다르고 테이블도 안 겹치니 충돌 없음. 단 **안전관리 외 테이블은 건드리지 말 것.**

**대상**: `coord/E2E_TEST_RESULTS.md` 의 "안전관리" 표 8개 메뉴 전부.
1. 위험요인정보(tb_safety_hazard_form) 2. 사고정보(tb_safety_accident_form) 3. 공정활동작업(tb_process_activity_form)
4. 위험성평가(tb_risk_assessment·결재有) 5. 현장안전관리(tb_site_safety_plan·혼합·결재有)
6. 아차사고(near-miss) 7. 작업허가/PTW(tb_permit_to_work·2단계결재) 8. 보호구(ppe)

**방법 (메뉴마다)**:
1. **착수 시 해당 Controller 를 직접 읽어** 엔드포인트·요청바디 확정 (추정 금지 — 경로가 예상과 다름. 예: 감사는 `/audit-plan`).
2. 레퍼런스 스크립트 `coord/e2e_audit_plan_test.py` / `e2e_audit_exec_test.py` 복제·수정해 Python(stdlib urllib)로 E2E 작성. 로그인 계정 `yujeong.jung / com4in!!`. 스크립트는 `coord/e2e_<도메인>_test.py` 로 저장.
3. 단계별 assert: 등록(작성자 flat·중첩누출0) → 수정(수정자 갱신·작성자 보존) → [결재有면] 상신→반려(사유저장)→재상신→승인/완료(승인자기록·작성자보존·completion_approver null 안됨) → cleanup. 결재 없는 도메인은 등록→수정→재조회→삭제 왕복 + PersonRef flat 검증.
4. **③ 프론트 payload 대조**: 해당 화면 컴포넌트/`api/*.ts` 가 보내는 요청 필드가 flat·중첩없음·E2E와 일치하는지 확인.
5. `coord/E2E_TEST_RESULTS.md` 안전관리 표의 ①②③·결과·비고 갱신. 파일업로드/템플릿 의존 등 자동화 곤란하면 가능한 범위까지 + 비고에 "수동확인 필요" 명시(무리한 자동화 금지).

**철칙**:
- 등록한 테스트 레코드 **반드시 삭제**. 종료 시 `ZZ_E2E` 0건 확인.
- 백엔드/프론트 **코드 수정 금지** (이번엔 테스트만 — 결함 발견 시 고치지 말고 `[질문]`/표 비고로 보고).
- 안전관리 외 테이블·EHS경영 도메인은 건드리지 말 것.
- 공유표/스크립트 push 전후 `git pull --rebase`. 충돌 시 멈추고 `[블로커]`.

**보고**: 착수 시 `[진행] TASK-4 시작 — 안전관리 OO부터`. 메뉴별 완료마다 표 갱신 + `coord/HELPER-TO-LEAD.md` 에 한 줄. 전체 끝나면 `[완료] TASK-4` + 통과/이슈 요약.

### 현재 할 일 (HELPER) — 갱신
TASK-3 는 완료됨. **이제 §8 TASK-4(안전관리 E2E) 진행.** `git pull --rebase origin yesco-dev` 로 `coord/E2E_TEST_RESULTS.md` + 레퍼런스 스크립트 받고 착수.
