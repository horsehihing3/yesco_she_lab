# 승인(결재) 로직 표준 + 예스코 연동 Seam

> 목적: 흩어진 승인 로직을 **단일 표준**으로 수렴시키고, 예스코 결재시스템 연동을 **한 지점(seam)** 으로 국한한다.
> 현장 사용법: 예스코 결재시스템 정체가 확인되면 이 문서의 **§5 Seam** 한 곳만 구현하면 된다. 그 전까지는 **§4 내부 표준**만 맞춘다.
> 근거: 2026-06-13 승인 로직 전수 감사 (세션 11). 실제 레퍼런스 구현은 `AuditPlanService.ensureCanApprovePlan` / `EhsAnnualPlanService` / `ContractorPlanService`.

---

## 1. 현황 맵 (감사 결과 — 승인 메커니즘 3종 공존)

| 메커니즘 | 도메인 | 승인 UI 위치 |
|---|---|---|
| **중앙 `tb_approval`** | PpeRequest · PermitToWork · Training · Chemical | 승인 메뉴(`ApprovalManagePage`) + 도메인 동기화 |
| **인라인 2단계** (planApprover/completionApprover) | AuditPlan · AuditExecution · EmrPlan · ContractorPlan · LegalCompliancePlan/Exec · EhsAnnualPlan · HealthCheckupPlan · SiteSafetyPlan · RiskAssessment | **자체 탭에서만** (승인 메뉴 미노출) |
| **단순 status 변경** (승인개념 약함) | WasteManage · EmergencyResponse · AccidentClaim 등 | 자체 탭 |

**핵심 불일치**: 같은 "승인"인데 어떤 건 중앙 메뉴에서, 어떤 건 자체 탭에서 처리된다. + 권한체크/ API/ 승인자 검증 방식이 도메인마다 다르다.

### 권한체크 현황
- ✅ **구현됨** (`ensureCanApprove` 류): AuditPlan · AuditExecution · EmrPlan · ContractorPlan · LegalCompliancePlan/Exec · EhsAnnualPlan
- 🔴 **누락** (지정 승인자 있는데 검증 안 함 — 누구나 승인 가능): **HealthCheckupPlan · SiteSafetyPlan · RiskAssessment**, PermitToWork · PpeRequest

### 불일치 항목
- **권한 게이팅(프론트) 5종**: `canApprovePlan` / `canEditDraft` / `isAdmin` / `getRoles` / `canSee`
- **승인 API 3종**: `transition(action)` / `approve·reject·submit` 개별 / `changeStatus`
- **승인자 검증**: userId 비교(권장) / name 문자열 비교(동명이인 위험) / 무검증
- **status 표기**: 대부분 대문자. (RiskAssessment 소문자 잔존 여부 = 세션8 대문자 마이그레이션과 충돌 → **재확인 필요**)
- **반려 UI**: `RejectReasonDialog` 9곳 공통, `ApprovalManagePage`·`SiteSafetyManagementPage`만 자체 구현

---

## 2. 표준 원칙 (모든 신규/전환 승인 도메인 공통)

1. **상태는 단일 상태머신을 따른다** (§3).
2. **승인 행위는 단일 API 규약을 따른다** — `transition(action)` (§4.1).
3. **승인 권한은 반드시 검증한다** — `ensureCanApprove` (§4.2). 검증 없는 승인 엔드포인트 금지.
4. **승인자는 PersonRef로 저장한다** — planApprover / completionApprover (CLAUDE.md 사람 필드 표준과 동일).
5. **상태 전이는 로깅한다** — 누가/언제/무엇을 (audit_log 류).
6. **예스코 연동은 §5 Seam 한 곳으로만** 한다. 도메인 서비스에 예스코 호출을 직접 박지 않는다.

---

## 3. 표준 상태머신 (canonical)

```
DRAFT ──submit──► PENDING_APPROVAL ──approve──► APPROVED ──completionSubmit──► COMPLETION_PENDING ──complete──► DONE
                         │                                                              │
                         └──reject──► REJECTED ◄───────────────reject─────────────────┘
```

- **status 코드는 대문자 SNAKE_CASE 고정**: `DRAFT / PENDING_APPROVAL / APPROVED / COMPLETION_PENDING / DONE / REJECTED`.
- 단일 승인 도메인은 `COMPLETION_PENDING / DONE` 단계를 생략하고 `APPROVED`를 종료로 쓴다.
- 단순 status-only 도메인(WasteManage 등)은 승인 도메인이 아님 — 이 표준 비대상.

---

## 4. 내부 표준 (예스코 무관 — 지금 맞출 것)

### 4.1 승인 API 규약
- 표준: `PATCH /{domain}/{id}/transition`  body: `{ action, rejectReason? }`
  - `action ∈ { submit, approve, reject, completionSubmit, complete }`
- 기존 `approve/reject/submit` 개별 엔드포인트(AuditPlan 등)는 **유지 허용**(동작 검증된 레거시), 단 신규는 `transition` 통일.
- 서비스 시그니처: `transition(Long id, String action, String rejectReason, String username)`.

### 4.2 권한 검증 규약 (`ensureCanApprove`)
레퍼런스: `AuditPlanService.ensureCanApprovePlan`.
```
username 이 null/"system" → 스킵(배치/내부)
IdmUser u = idmMapper.findByUid(username)
u 가 SYSTEM_ADMIN(또는 정책상 EHS_ADMIN) → 통과
단계별 승인자 일치 → 통과
  - PLAN 단계:       planApprover.userId == u.uidNumber  (이름은 폴백)
  - COMPLETION 단계: completionApprover.userId == u.uidNumber
그 외 → AccessDeniedException(403)
```
- **userId 우선 비교**(동명이인 방지), name은 레거시 폴백만.
- approve/reject/complete 모든 분기에서 호출. 검증 없는 분기 금지.

### 4.3 프론트 권한 게이팅
- 단일 유틸로 수렴: `canApprove(item, user, stage)` (= admin || stageApprover.userId == user.id), `canEditDraft(item, user)` (= admin || createdByUserId == user.id).
- 반려 UI는 `RejectReasonDialog` 공통 컴포넌트만 사용(ApprovalManagePage·SiteSafety 포함).

### 4.4 UI 노출 규칙 (중앙 메뉴 vs 자체 탭)
- **잠정 규칙**(예스코 확정 전): 도메인 *워크플로(2단계·체크리스트·부수효과)* 가 있는 건 **자체 탭**, 단순 단건 결재(PpeRequest·PermitToWork 류)는 **중앙 승인메뉴**.
- 최종 규칙은 §6 예스코 확인 후 확정.

---

## 5. 예스코 연동 Seam (한 지점)

> 핵심: 도메인 서비스는 **자기 status만 바꾸는 순수 로직**으로 두고, "승인 결정"을 외부(예스코)와 주고받는 책임은 **단일 추상화**에 모은다. 예스코 정체가 뭐든 이 한 곳만 구현한다.

### 5.1 Seam 인터페이스 (개념)
```
ApprovalGateway
  // 아웃바운드: EHS → 예스코 결재 상신
  requestApproval(entityType, entityId, payload) : externalApprovalId
  // 인바운드: 예스코 → EHS 결재 결과 반영 (webhook/polling/콜백)
  onDecision(entityType, entityId, decision{APPROVED|REJECTED}, approver, at) → 도메인 transition 호출
```
- 도메인↔외부 매핑은 `(entityType, entityId)` 키로. (현재 tb_approval 의 type 필드 + 도메인 id 활용)

### 5.2 연동 모드 — 예스코 답에 따라 §5.1의 구현만 갈아끼움
- **모드 A — 예스코가 결재 주체**: `submit` 시 `requestApproval()` 호출 → 예스코에서 결재 → `onDecision()` 수신 → 도메인 `approve/reject` transition. EHS 자체 승인 UI는 조회 전용으로.
- **모드 B — EHS 자체 결재 유지 + 예스코 통지만**: 현재 내부 transition 유지 + `requestApproval` 자리에 알림(Teams/메일)만. (MS Graph 이미 구현됨)
- **모드 C — SSO/그룹웨어 단순연계**: 결재는 EHS, 인증·결재선 메타만 예스코에서.

어느 모드든 **도메인 서비스 코드는 불변**, `ApprovalGateway` 구현체만 바뀐다.

### 5.3 결재선(multi-line)
- 예스코가 다단계 결재선(N단계)을 강제하면, 현재 2단계(plan/completion) 모델 위에 `ApprovalLine`(이미 모델 존재, 미사용)을 §5.1 인바운드 쪽에서 단계 매핑. 내부 status 머신은 그대로 두고 "현재 결재 단계"만 메타로 관리.

---

## 6. 예스코 미팅 확인 질문 (Seam 구현을 가르는 것)
1. 결재를 **예스코 그룹웨어가 주관**하나(모드 A), EHS 자체 유지하고 통지만인가(모드 B)?
2. 그룹웨어 제품/버전 + **연동 API(상신/조회/콜백) 제공 여부**.
3. 결재선 단계 수·부서별 차이 (2단계 고정 vs N단계 동적).
4. 결재 결과 전달 방식: webhook push vs EHS polling.
5. 승인자 식별 키: 사번/이메일/그룹웨어 사용자ID 중 무엇 (→ §4.2 userId 매핑 기준).

---

## 7. 이행 우선순위

### 지금 (예스코 무관, 저위험)
- [x] 본 표준 문서화
- [x] **권한체크 누락 보강(인라인 2단계 3종)**: HealthCheckupPlan · SiteSafetyPlan · RiskAssessment `transition()` 에 `ensureCanApprove` 이식(approve=계획승인자/complete=완료승인자/reject=양쪽, Admin bypass, username null·system 스킵). 런타임 검증: TEAM_MEMBER 비승인자 approve → **403** "지정된 승인자만…"(데이터 변형 없음). compileJava EXIT0.
  - ⚠️ **데모 주의**: 승인자 미지정 레코드는 이제 Admin만 승인 가능(특히 risk_assessment 다수가 planApprover=null). 예스코 데모 전 승인자 세팅 or Admin 계정 사용.
- [x] **PUT 전체수정 status 우회 차단 완료(HealthCheckupPlan · SiteSafetyPlan)**: 두 도메인 `update()` 가 요청 body의 `status` 를 무검증으로 덮어쓰던 경로를 제거 → status 는 게이팅된 `transition()` 으로만 변경, PUT 은 기존 상태 보존. 안전한 형제 `RiskAssessment.update()`(status 미변경)와 동일 패턴으로 통일. compileJava EXIT0.
- [ ] **잔존 — 추가 게이팅 필요**:
  - PermitToWork · PpeRequest (중앙 tb_approval 메커니즘 — approve/reject·updateStatus 무검증). 중앙 `ApprovalController.update()` 자체도 무검증.
  - RiskAssessment `updateStatus(PATCH /{id}/status)` 미게이팅(프론트 승인엔 미사용이나 status 직접변경 가능).
- [x] **🐛 RiskAssessment status 소문자 버그 수정 완료**: `transition()`(5개 status)·create 기본값(`DRAFT`)·`updateStatus`/transition 내 비교(`COMPLETED`/`REJECTED`)를 **대문자로 통일**(매퍼는 이미 대문자 계약). 런타임 검증: DRAFT 레코드 submit→`SUBMITTED` 확인 후 복원. 이제 프론트·DB·매퍼·서비스 전부 대문자 일치.

### 예스코 모델 확인 후
- [ ] §4.4 UI 노출 규칙 확정 + 중앙/자체 정리
- [ ] 승인 API `transition` 통일(레거시 개별 엔드포인트 수렴)
- [ ] 프론트 권한 게이팅 유틸 단일화 + RejectReasonDialog 공통화 2곳
- [ ] §5 `ApprovalGateway` 구현(모드 A/B/C 중 택1) + 결재선 매핑

> 구현 단계 분업(예스코 확인 후): **backend** = ApprovalGateway·ensureCanApprove·transition 통일 / **frontend** = 권한 유틸·RejectDialog·노출 정리. (도메인/레이어 분할로 병렬 가능)
