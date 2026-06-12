# E2E 커버리지 & 버그 로그

> 메뉴를 하나씩 E2E로 확장하며 버그를 발견·수정하는 과정을 기록한다.
> 실행 방법·계정 매핑은 `e2e/README.md` 참조.

## 진행 방식 (요약)

```
[개발 노트북] 조사 → 시나리오 작성 → 실행/디버그 → (버그면) 수정 → 커밋·푸시
[테스트 노트북] pull → 새 시나리오 검증 → 전체 회귀 → 보고
```
- 공유 DB 충돌 방지: 데이터 접두어 `TEST_<TAG>_…` (개발=DEV, 테스트=QA, `E2E_TAG` 환경변수)
- 정리: `DELETE … WHERE plan_name LIKE 'TEST\_<TAG>\_%' ESCAPE '\'`

## 커버리지 현황

상태: ☐ 미작성 · 🛠 작성/수정중 · ✅ 통과

| 우선 | 메뉴 | 모듈 | 시나리오 | 상태 |
|------|------|------|----------|------|
| - | KPI목표 연간계획 | EhsAnnualPlan | annual-plan-approval | ✅ |
| - | KPI목표 연간계획 | EhsAnnualPlan | annual-plan-reject | ✅ |
| 1 | 비상훈련 | Emergency | emergency-plan (계획 결재+반려) | ✅ |
| 1 | 비상훈련 | Emergency | 완료/훈련(드릴) 흐름 | ☐ (EmrDrillTab, 후속) |
| 2 | 작업허가 | PermitToWork | (예정) | ☐ |
| 3 | 내부감사 | Audit | (예정) | ☐ |
| 4 | 위험성평가 | RiskAssessment | (예정) | ☐ |
| 5 | 협력업체 | Contractor | (예정) | ☐ |
| 6 | 보건검진 | HealthCheckup | (예정) | ☐ |
| 7 | 현장안전 | SiteSafety | (예정) | ☐ |

## 버그 로그

| 발견일 | 메뉴 | 증상 | 원인 | 수정 |
|--------|------|------|------|------|
| 2026-06-12 | KPI목표 | 완료 반려 시 반려 사유가 화면에 안 뜸 | transition SQL이 `status='DRAFT'`일 때만 reject_reason 저장 → 완료반려(APPROVED)에서 유실 | EhsAnnualPlanMapper: `reject_reason = #{rejectReason}` (커밋 baec375) |
| 2026-06-12 | 결재 5개 모듈 | 반려→재상신·승인 후에도 옛 반려 사유 잔존 | `ELSE reject_reason`로 전이 시 미제거 | Ehs/Emergency/HealthCheckup/SiteSafety/Contractor mapper 통일 (커밋 853703e) |
