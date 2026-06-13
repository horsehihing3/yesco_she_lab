# LEAD → HELPER 지시 채널

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
- 브랜치 `yesco-dev` (= `main` 과 동일). 백엔드는 LEAD PC 에서 7501, 프론트 7500 가동 중(네 PC 에선 띄울 필요 없음).
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

## 5. TASK-2A — 타입 갭 메우기 (HELPER 담당 · 2026-06-14 세션13 LEAD 지시)

**배경**: 각 탭의 로컬 `getRoles = (item: { createdByUserId?: number | null }) => ...` 에
`getRoles(selected ?? {})` 로 넘기는 도메인 타입에 `createdByUserId` 가 없어서 TS2559/TS2345 발생.
타입에 필드만 추가하면 해소된다. **컴포넌트(.tsx) 는 절대 건드리지 말 것** — 타입 파일만 수정.

**현재 tsc = 95** (`cd frontend && npx tsc --noEmit 2>&1 | grep -c "error TS"`).

**컨벤션 레퍼런스**: `emergencyExtended.types.ts` 의 `EmergencyPlan` — 이미 `createdByUserId?: number | null` 등 올바른 형태로 들어가 있음. 똑같이 맞춰라.

### 추가할 필드 (이 표 외엔 건드리지 말 것)

| 파일 | 인터페이스 | 추가 필드 | 해소 |
|---|---|---|---|
| `types/diseasePreventionMgmt.types.ts` | DpHearing, DpInfect, DpMsd, DpRespi, DpStress, DpThermal | `createdByUserId?: number \| null` | 18 |
| `types/occupationalDisease.types.ts` | OdExposure, OdOrg, OdWorker, OdAftercare, OdFitness | `createdByUserId?: number \| null` | 15 |
| `types/healthCheckup.types.ts` | HealthCheckupRecord | `createdByUserId?: number \| null` | 1 |
| `types/ehsManager.types.ts` | EhsManager | `createdByUserId?: number \| null` | 2 |
| `types/emergencyExtended.types.ts` | EmergencyContact | `createdByUserId?: number \| null` | 3 |
| `types/emergencyExtended.types.ts` | EmergencyPlan | `modifiedByTeam?: string \| null` + `modifiedByPosition?: string \| null` | 4 |

**합계 ~43건 해소** (95 → ~52 목표). ※ OdAftercare/OdFitness 6건은 LEAD가 `selected`→`selectedAft/Fit` 크래시버그 수정하며 드러난 타입갭(같은 패턴).

**철칙**:
1. 위 표의 **필드만** 추가. 인터페이스에 해당 필드가 **이미 있으면 건너뛰기**(중복 추가 금지). 추가 전 인터페이스 본문을 읽어 확인.
2. `.tsx` / `.ts`(컴포넌트·로직) 파일은 **절대 수정 금지**. `types/*.types.ts` 6개만.
3. 파일 하나 끝낼 때마다 `npx tsc --noEmit 2>&1 | grep -c "error TS"` → **카운트 감소** + **신규 에러코드 0**. 아니면 되돌리고 `[블로커]`.
4. 커밋 단위 = 타입 파일 1개. 예: `fix(types): add createdByUserId to Dp* interfaces (getRoles 갭)`.

**수용 기준**(완료 보고): 시작/종료 tsc 카운트, 수정 파일·인터페이스 목록, "신규 에러코드 0" 문구, 커밋 목록.

## 6. DO NOT TOUCH — TASK-2 라운드 (LEAD 가 버그조사·판단으로 처리 중)
아래는 타입 갭처럼 보여도 **오타 버그/반쪽 기능/판단필요** 라 LEAD 가 직접 처리한다. 손대지 말 것:
- `types/chemical.types.ts` (Chemical) — `.handler` 는 실필드 `handlerName` 오타 버그(LEAD가 .tsx 수정).
- `types/file.types.ts` (FileMetadata) — `.fileName` 은 실필드 `originalFilename` 오타 버그.
- `types/user.types.ts` (User) — `position`/`active` 는 판단 필요.
- `types/siteSafety.types.ts` (SiteSafetyPlan/Request) — `inspector*` 는 백엔드 미구현 서명기능, `modifiedBy` 판단필요.
- 모든 `.tsx` 파일, `pages/*`, `App.tsx` 등 — LEAD 가 TS2304/TS2345/TS2339 버그건 처리 중.

---
### 첫 응답으로 해 줄 것
`git pull --rebase origin yesco-dev` 후 `coord/HELPER-TO-LEAD.md` 에
`[진행] TASK-2A 시작 — diseasePreventionMgmt.types.ts 부터` 로 시작하고, 타입 파일 하나 끝낼 때마다 카운트와 함께 한 줄씩 추가해 줘.
