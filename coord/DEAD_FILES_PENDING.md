# 죽은 파일 후보 (미참조)

> **[2026-06-14 처리]** 옵션1(명백한 폐기본만) 실행 — **27개 삭제**(오펀 컴포넌트 23 + 스텁페이지 4: ComingSoon·KpiDashboard·SystemManage·Ergonomics). `vite build` ✓, tsc 148→125.
> **보존**: 완성 기능 페이지(EnvironmentManage·WorkPlace·OshCommittee·PpeIssuance·EhsAlert/Message/Officer/Plan·EmergencyNotification·PrePlacementExam·SafetyEducation·ChemicalManage·ChemicalMsds·ChecklistResult/Template·EhsDocument) — Yesco 메뉴 재연결 가능성으로 남김. 아래는 이력.

---
# (이력) 삭제 결정 대기였던 목록

> 2026-06-14 정적 감사 결과. **어디서도 import 되지 않아 화면에 안 뜨는** 파일들.
> 문자열 컴포넌트 레지스트리·lazy 로딩 없음 확인 → 정적분석 결론적. 대조군(`PpeRequestTab`=사용중) 정확히 구분됨.
> **삭제는 사용자 확정 후 LEAD 가 일괄 실행.** HELPER 는 이 파일들 건드리지 말 것(미사용 정리 포함 — 어차피 삭제 예정).

## A. 오펀 컴포넌트 (23) — 0 참조
```
frontend/src/components/carbon/CarbonStatsTab.tsx
frontend/src/components/common/ButtonManageDialog.tsx
frontend/src/components/common/KeepAliveOutlet.tsx
frontend/src/components/contractor/ContractorEvalTab.tsx
frontend/src/components/dashboard/GoogleMaps3DTilesView.tsx
frontend/src/components/dashboard/GoogleMapView.tsx
frontend/src/components/dashboard/Mapbox3DView.tsx
frontend/src/components/dashboard/MapboxView.tsx
frontend/src/components/ehs/AuditChecklistTab.tsx
frontend/src/components/ehs/AuditFindingTab.tsx
frontend/src/components/ehs/AuditReportTab.tsx
frontend/src/components/ehs/EmrIncidentTab.tsx
frontend/src/components/ehs/TrainingApprovalTab.tsx
frontend/src/components/ehs/TrainingRequestTab.tsx
frontend/src/components/environment/ChemicalDashboardTab.tsx
frontend/src/components/environment/ChemicalSafetyTab.tsx
frontend/src/components/environment/ChemicalUsageTab.tsx
frontend/src/components/environment/WasteReportTab.tsx
frontend/src/components/legalCompliance/LegalImprovementTab.tsx
frontend/src/components/legalCompliance/LegalObligationTab.tsx
frontend/src/components/legalCompliance/LegalPermitTab.tsx
frontend/src/components/partner/PartnerVisitorTab.tsx
frontend/src/components/planKpiGoal/SafetyHealthGoalPlanPanel.tsx
```

## B. 죽은 페이지 (20)
**B-1. 미참조 페이지 (16)** — 라우트·import 모두 없음:
```
frontend/src/pages/EhsAlertPage.tsx
frontend/src/pages/EhsDocumentPage.tsx
frontend/src/pages/EhsMessagePage.tsx
frontend/src/pages/EhsOfficerPage.tsx
frontend/src/pages/EhsPlanPage.tsx
frontend/src/pages/EmergencyNotificationPage.tsx
frontend/src/pages/OshCommitteePage.tsx
frontend/src/pages/PpeIssuancePage.tsx
frontend/src/pages/PrePlacementExamPage.tsx
frontend/src/pages/SafetyEducationPage.tsx
frontend/src/pages/ChecklistResultPage.tsx
frontend/src/pages/ChecklistTemplatePage.tsx
frontend/src/pages/ChemicalManagePage.tsx
frontend/src/pages/ChemicalMsdsPage.tsx
frontend/src/pages/EnvironmentManagePage.tsx   # ⚠ 완성 기능 — Yesco 재연결 가능성, 삭제 전 확인
frontend/src/pages/WorkPlacePage.tsx            # ⚠ 완성 기능 — 삭제 전 확인
```
**B-2. import 만 되고 라우트 없음 (4)** — 삭제 시 `App.tsx` 의 해당 import 줄도 제거:
```
frontend/src/pages/SystemManagePage.tsx     # App.tsx import 제거 필요
frontend/src/pages/ErgonomicsPage.tsx        # 라우트는 <Navigate> 리다이렉트라 페이지 미렌더
frontend/src/pages/ComingSoonPage.tsx
frontend/src/pages/KpiDashboardPage.tsx
```

## 처리 방침 (사용자 확정 대기)
- 명백한 중복/대체본(지도뷰 4종·중복 탭·스텁 페이지)은 삭제 권장.
- `⚠` 표시 완성 기능 페이지는 Yesco 메뉴 확정 후 결정.
