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
  `utils/devMode.ts`, `utils/auth.ts` — LEAD 구조수정 예정.
- `coord/DEAD_FILES_PENDING.md` 에 나열된 **~43개 죽은 파일** — 삭제 결정 대기. 미사용 정리도 하지 말 것(어차피 삭제 예정, 낭비).
- 백엔드 전체 — 이번 라운드 LEAD 담당.

## 5. TASK-2 (대기 — LEAD 가 설계 후 전달)
- 구조적 타입오류 일괄 수정: `NumberField` 의 `value` prop `string|number` 허용(공용 1파일),
  `createdByUserId` 헬퍼 타입(각 탭 `getRoles`/`canEditDraft` 파라미터) 완화. → 설계서 내려오면 적용/검증.

---
### 첫 응답으로 해 줄 것
`coord/HELPER-TO-LEAD.md` 에 `[진행] TASK-1 시작 — components/chemical 부터` 로 시작하고,
각 디렉터리 완료마다 한 줄씩 카운트와 함께 추가해 줘.
