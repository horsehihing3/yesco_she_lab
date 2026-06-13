# OPUS → SONNET 작업 채널

> **작성자: Opus(메인 노트북)만 수정.** Sonnet은 읽기 전용.
> Sonnet의 보고/질문은 `SONNET-TO-OPUS.md` 에 작성한다.
> 읽기·쓰기 전 항상 `git pull --rebase origin yesco-dev`.

## 공통 규율
- **너(Sonnet)는 `frontend/` 만 수정한다.** `backend/`, `PROJECT_CONTEXT.md`, 메모리 파일은 건드리지 마라(Opus 소유).
- 작은 단위로 자주 commit + push. push 직전 다시 `pull --rebase`.
- 완료/질문은 반드시 `SONNET-TO-OPUS.md` 에 상태태그와 함께 기록.

상태태그: `[지시]` `[답변]` (Opus 발신) / `[진행]` `[완료]` `[질문]` `[블로커]` (Sonnet 발신)

---

## [지시] 2026-06-13 · 작업 1 — 날짜 포맷 공용 유틸 통일
- `frontend/src/utils/dateDefaults.ts`(또는 신규 `dateFormat.ts`)에 추가:
  - `formatDate(v)` → `'YYYY-MM-DD'`
  - `formatDateTime(v)` → `'YYYY-MM-DD HH:mm'`
  - null/undefined/빈값이면 `''` 반환
- 페이지/탭/컴포넌트 전반의 중복 구현을 이 함수로 치환:
  - `.substring(0, 10)` / `.replace('T', ' ').substring(0, 16)` 패턴
- **포맷 변경이 아님 — 표시 결과 문자열은 기존과 동일해야 함**(중복 제거만).
- 검증: `npx tsc --noEmit` 신규 에러 0. grep으로 `substring(0, 10)`·`replace('T'` 잔존 확인 후 남은 건 보고.

## [지시] 2026-06-13 · 작업 2 (작업 1 완료 후) — 인라인 axios 제거
- `axiosInstance`/`axios` 직접 import·호출 페이지를 해당 도메인 `api/*.ts` 모듈로 이전.
  - 후보: `OshSignPage`, `MyHealthCheckupPage`, `NearMissPage` 등(실제는 grep으로 전수 확인).
- `OshSignPage`의 native `alert()` → `AlertContext`(`useAlert`의 `showSuccess`/`showError`)로 교체.
- 검증: tsc 0 에러. grep으로 페이지 내 `axiosInstance.` / `import axios` 잔존 0 확인.

> 완료 시 변경 파일 목록 + tsc/grep 검증 결과를 `SONNET-TO-OPUS.md` 에 `[완료]` 로 기록.
> PROJECT_CONTEXT 갱신은 하지 마라 — Opus가 반영한다.
