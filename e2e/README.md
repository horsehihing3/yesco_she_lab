# Smart EHS 기능 시나리오 자동화 (E2E)

테스트용 노트북에서 **실제 화면을 사람처럼 클릭**하며 결재 라이프사이클을 자동 검증한다.
역할 전환(작성자 → 계획승인자 → 완료승인자)은 계정별 브라우저 컨텍스트로 처리한다.

## 무엇을 테스트하나

배역↔계정: 작성자=`yeseo.moon`(TEAM_ADMIN, 등록권한), 계획승인자=`jiwan.nam`(EHS_ADMIN),
완료승인자=`horsehihing3`(TEAM_MEMBER, 레코드 승인자 매칭). 상세는 `fixtures/accounts.ts`.

### 1) `tests/annual-plan-approval.spec.ts` — 정상 결재 라이프사이클

| 단계 | 배역 | 동작 | 상태 전이 |
|------|------|------|-----------|
| 1 | 작성자 | 등록 + 승인자 지정 | → DRAFT |
| 2 | 작성자 | 계획 결재 상신 | DRAFT → PENDING_APPROVAL |
| 3 | 계획승인자 | 계획 승인 | PENDING_APPROVAL → APPROVED |
| 4 | 작성자 | KPI현황 '작성중' 확인 → 저장 → 완료 결재 상신 | APPROVED → COMPLETION_PENDING |
| 5 | 완료승인자 | 완료 승인 | COMPLETION_PENDING → DONE |

### 2) `tests/annual-plan-reject.spec.ts` — 반려 회복 흐름 (계획·완료 2단계)

계획 결재 반려(→DRAFT) → 재상신 → 승인 → 완료 결재 반려(→APPROVED) → 재상신 → 완료 승인(DONE).
반려 사유 배너가 각 단계에서 올바른 사유로 표시되는지까지 검증한다.

각 단계마다 `test-results/shots/`에 스크린샷이 저장된다.

## 사전 조건

- 같은 노트북에서 **백엔드(7501)·프론트엔드(7500)가 실행 중**이어야 한다.
  ```
  cd backend && gradlew.bat bootRun
  cd frontend && npm run dev
  ```
- 다른 PC의 서버를 대상으로 하려면: `set E2E_BASE_URL=http://192.168.x.x:7500`

## 설치 (최초 1회)

```bash
cd e2e
npm install
npm run install:browser   # Chromium 다운로드
```

## 실행

```bash
cd e2e
npm test                 # 헤드리스 실행
npm run test:headed      # 브라우저 창을 보며 실행
npm run report           # 마지막 결과 HTML 리포트 열기
```

## Claude Code 로 실행/보고

테스트 노트북의 Claude Code 에 다음처럼 요청하면 된다:

> "연간계획 결재 워크플로우 E2E 돌리고 결과 보고해줘"

Claude 가 `npm test` 실행 → `test-results/results.json` 과 스크린샷을 읽고
**어느 단계에서 통과/실패했는지** 한글로 요약 보고한다.

## 테스트 데이터 정리

매 실행이 공유 DB(`SmartEHS_com4in`)의 `tb_ehs_annual_plan` 에 `TEST_<타임스탬프>` 계획을 1건
생성하며, DONE 상태가 되면 화면에서 삭제할 수 없다. 누적되면 아래 SQL 로 정리한다:

```sql
-- 목표(자식) 먼저 삭제 후 계획 삭제
-- 주의: '_' 는 SQL Server LIKE 와일드카드이므로 ESCAPE 로 리터럴 처리한다.
DELETE g FROM tb_ehs_annual_plan_goal g
  JOIN tb_ehs_annual_plan p ON p.id = g.plan_id
 WHERE p.plan_name LIKE 'TEST\_%' ESCAPE '\';
DELETE FROM tb_ehs_annual_plan WHERE plan_name LIKE 'TEST\_%' ESCAPE '\';
```
> 부모 `tb_ehs_annual_plan`, 자식 `tb_ehs_annual_plan_goal(plan_id)`.

## 새 시나리오 추가

`tests/` 에 `*.spec.ts` 추가. 로그인/다이얼로그/조직도 선택 등 공통 동작은
`helpers/app.ts` 의 헬퍼(`loginAs`, `acceptDialog`, `pickApprover`, ...)를 재사용한다.
배역↔계정 매핑은 `fixtures/accounts.ts` 에서 관리한다.
