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
- `utils/auth.ts` 자체는 미수정, import하는 쪽 파일만 정리함
