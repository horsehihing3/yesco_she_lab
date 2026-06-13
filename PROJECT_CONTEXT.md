# PROJECT_CONTEXT.md
Smart EHS → 예스코 커스터마이징 — 세션 컨텍스트

> **Claude에게:** 새 세션 시작 시 이 파일을 첨부하고 "다음 작업 확인해줘"라고 하면 바로 이어받을 수 있습니다.
> 완료 항목이 10개 이상 쌓이면 `docs/ARCHIVE.md`로 이동하고 이 파일에서는 삭제하세요.

---

## ⚡ 다음 세션 작업 (우선순위 순)

### 🟢 진행 중 — 표준화 6순위: 컨트롤러 반환 표준화(raw→DTO) + 예외 표준화 (2026-06-13 세션 11)
- **표준 결정**: 컨트롤러 반환 = **Response DTO** 표준 채택(raw 엔티티 신규 금지·convert-on-touch·민감도메인 우선). CLAUDE.md 절대규칙에 명문화. raw↔DTO는 *모델↔계약* 문제로 PersonRef(*DB↔wire*)와 무관·공존(레퍼런스 EhsAnnualPlan). **빅뱅 전환 안 함**(전체 106개 raw 중 민감도메인 ~22개만 우선).
- **[x] #2 예외 표준화 (8파일, commit c20f557)**: `RuntimeException` → not-found 27건 `ResourceNotFoundException`(404)·검증/중복 14건 `BadRequestException`(400). 기존엔 GlobalExceptionHandler catch-all이 500+고정메시지로 메시지를 뭉개던 UX 버그 동시수정. 인프라/IO 15건은 RuntimeException 유지. 대상: AccidentReport/EhsManager/OSHCommittee/WorkplaceSite/RiskAssessment Service + OSHCommitteeController + ChecklistExcelService.
- **[x] raw→DTO 레퍼런스 2종 + 검증 완료**: `AccidentReportResponse`(PersonRef無)·`DpMsdResponse`(PersonRef有 템플릿) + 컨트롤러 전환. `coord/verify_wire.sh` 작성(전후 GET `.data` 동일성 diff). DpMsd 실데이터 6341B **wire byte-identical 검증 통과**. compileJava EXIT0, 서버 재기동 완료.
- **[x] Opus 담당 양산 완료** (9 DTO, wire byte-identical 전수검증): EmergencyContact·AccidentClaim(+Doc)·Rad(Health/Dose/Worker)·ContractorRegistration(66필드)·ContractorPlan(58필드·PersonRef 4개)·ContractorWorker. 컨트롤러 5개 전환, compileJava EXIT0, 재기동 후 9개 GET `.data` 전후 동일 확인(verify_wire.sh).
- **[ ] Sonnet 담당 양산**: Dp* 6 + Od* 6 (DiseasePreventionMgmtController·OccupationalDiseaseController, 프론트 작업 후) — 지시는 `coord/OPUS-TO-SONNET.md` 작업3.

### ✅ 완료 — 표준화: Swagger @Tag 일관성 (2026-06-13 세션 11, Opus)
- CLAUDE.md "Swagger 어노테이션 필수" 규칙 미준수 컨트롤러 16개 발견 → 15개에 클래스 `@Tag(name, description)` + import 추가. 순수 추가·wire/behavior 무영향, compileJava EXIT0.
- 대상: EvalSheet·FireSafety·FloorDrawing·HealthCheckupRecord·IncidentResponse·Partner·PermitLifecycle·ProcessActivity·Radiation·RiskAssessment·RiskAssessmentForm·SafetyAccident·SafetyHazard·SiteSafetyPlan·Translation. **120/121 커버**.
- 남은 1개 `DiseasePreventionMgmtController`는 Sonnet 작업3(DTO) 충돌회피로 제외 → 작업3 때 함께 추가하도록 지시.
- **[ ] 후순위(convert-on-touch)**: 비개인 Rad(Source/Zone/Measurement/Drill/Accident)·Partner(Eval/Visitor). 전체 raw 53컨트롤러 중 비민감은 손댈 때 전환.

### ✅ 완료 — 작성자/승인자 표시 팀·성명·직위 풀포맷 통일 (2026-06-13 세션 10)
- **배경**: 일부 화면이 작성자/승인자를 성명만(또는 잘못된 필드 modifiedBy)으로 표시 — created_by는 JSON 변환됐으나 화면이 createdBy를 안 읽거나 DTO가 team/position을 누락
- **프론트 수정**: SiteSafetyManagementPage(관리/실행)·PartnerSafetyExecuteTab·ContractorManagementPage·SafetyAccidentInfoPage·SafetyHazardInfoPage·HealthCheckupPlanTab → `formatUserName(팀,성명,직위)` 통일. 타입 5종에 createdBy/modifiedBy Team·Position 필드 추가
- **백엔드 수정**: SafetyAccidentFormResponse·SafetyHazardFormResponse·HealthCheckupPlanResponse DTO가 name/userId만 내보내 team/position 누락 → 필드+매핑 추가 (재시작·wire 검증 완료)
- **전수 감사**: WEM·Audit·Emr·AnnualPlan 등은 이미 풀포맷 정상. PsmMoc(승인자 자유텍스트=데이터없음)·RiskAssessment(authorTeam null)는 표시버그 아님(데이터 부재). 목록 컬럼 이름만은 관례 유지
- **참고**: 기존 구데이터는 team/position 비어 일부만 표시, 신규 등록/수정건은 풀표시 ([[personref-refactor-progress]])

### ✅ 완료 — 표준화 5순위: 폼 필드 순서 통일 (2026-06-13 세션 10, 진단 완료 + 실위반 수정)
- **기준 문서**: `docs/FORM_LAYOUT_CONVENTION.md` (레퍼런스: `AuditPlanTab.tsx`)
- **진단 결과 — 대량 재배치 불필요로 판명**: 세션 9 분석의 "53개 × 3곳 손코딩" 전제는 현실과 달랐음. FormTable 추상화(`FormTable/FormRow/FormLabel/FormCell`) 덕에 폼들이 **단일 블록 + 이미 합리적 순서**로 정리돼 있었음.
- **전수 분류 (53개)**:
  - 순수 도메인 CRUD (목적·승인자·작성자 행 자체가 없음) **~31개**: Rad* 7, Fire* 5, Facility 3, Permit 6, Psm 4, Osh/PartnerEval/WorkplaceSite/Incident 등 → 규칙 핵심행 N/A, 이미 부합
  - createdBy만 보유 (작성자 행 미렌더, payload 전용) **~14개**: Dp* 7, Od* 5, LegalLaw, ContractorReg → 부합
  - plan형 (승인자/체크리스트 보유) **~8개**: 대부분 부합
- **실제 규칙 위반 = 1건만**: `PartnerSafetyExecuteTab` 상세패널 — 작성일/작성자가 도메인필드 위 → 도메인→작성일/작성자→계획승인자 순으로 재배치 완료. tsc 신규에러 0.
- **결론**: 대량 reorder는 순수 churn + JSX 파손 위험뿐이라 미실시. 향후 신규 폼만 컨벤션 준수하면 됨.

### ✅ 완료 — PersonRef 3순위: 구 flat 컬럼 297개 DROP + 잠재버그 복구 (2026-06-13 세션 10)
- [x] **DROP 전 안전검증(sqlcmd 직접)**: 전환 81쌍 = flat 서브컬럼 297개. 매퍼 6개 flat참조는 전부 레거시유지 컬럼(drop-set과 분리), config 외 Java 참조 0 → DROP해도 매퍼/코드 무영향 확인
- [x] **숨은 버그 발견·복구(27행)**: 불규칙 스키마 승인자 5쌍에서 JSON NULL인데 flat에 값 있던 27행(리팩터 때 부분스키마 backfill 누락으로 승인자 화면누락) → `backfill_gaps.sql` 충실복구. API로 복구확인(site_safety 14·psm_moc 4·legal_plan 8·legal_exec 1)
- [x] **백업**: 영향 40테이블 → `bak20260613_*` (행수 일치). 안정화 후 정리 가능
- [x] **초기화기 17개 정리**: flat 재생성하던 16개 @Component 비활성 + PsmTablesInitializer는 team/position 호출만 비활성(테이블생성 유지)
- [x] **DROP 297컬럼 + 재시작 검증**: compileJava EXIT0, 기동 ERROR0·flat재생성0, 영향 13개 list GET 전부 200, 재시작 후 flat 잔존 0
- [x] 레거시 유지(DROP 안 함): audit/site_safety/contractor_reg.modified_by, health_checkup_plan.created_by, legal_exec.modified_by, health_checkup_record 전체
- [x] **PersonRef 리팩터 1~3순위 전부 완료**

### ✅ 완료 — 표준화 4순위: API 모듈화 + 죽은코드 제거 (2026-06-13 세션 9)
- [x] Phase 1: SafetyWork/OshCommittee 인라인 API → `safetyWorkApi.ts`/`oshCommitteeApi.ts` 추출
- [x] Phase 2: `fileApi.ts` 신규(upload/listByEntity/remove/downloadBlob/fileUrl) — OshCommitteeTab axiosInstance 직접참조 제거 (commit 49dd4ee)
- [x] 미사용 `SafetyWorkPage` 체인 삭제 — 라우팅 미연결 죽은코드, 실 작업허가는 PermitToWorkPage. safetyWorkApi/safetyWork.types/userApi 동반 삭제 (commit 38d848a)
- [x] 영향도 확인: PermitToWorkPage(별도 permitToWorkApi)·대시보드 `/safety-works` 카운트·백엔드 무영향

### ✅ 완료 — 표준화 3순위: RiskAssessment status 대문자 통일 (2026-06-12 세션 8)
- [x] 프론트 RiskAssessmentTab status Set 대문자화 + 필터 `.toLowerCase()` 제거 (`s = a.status || ''`)
- [x] 백엔드 `RiskAssessmentStatusUppercaseInitializer`(@Order 200) — 기존 DB 행 소문자→대문자 (Flyway 비활성이라 CommandLineRunner 사용, 21건 전환)
- [x] RiskAssessmentMapper.xml status 비교값 대문자화

### ✅ 완료 — writer 역할 전면 적용 (2026-06-11 세션 7, commit c854497)
- [x] EmrContactTab, ContractorRegistrationPage getRoles 추가 (마지막 2개 파일)
- [x] ContractorRegistration 프론트 타입에 createdByUserId 추가
- [x] V219: 17개 테이블 created_by_user_id/name/team/position 컬럼 추가 (DB 적용 완료)
- [x] 7개 컨트롤러/서비스 create 시 createdBy 4필드 자동 세팅
  - DiseasePreventionMgmtController (Dp 7종), OccupationalDiseaseController (Od 5종)
  - EmergencyContactController, ContractorRegistrationController
  - HealthCheckupRecordController, LegalLawService+Controller, EhsManagerService+Controller

### ✅ 완료 — canSee generalAdminRoles 전면 수정 (2026-06-11 세션 6)
- [x] `useButtonRules.ts` — `generalAdminRoles` 체크 누락 수정 (TEAM_ADMIN 등 concrete role이 canSee에서 항상 false 반환되던 버그)
- [x] `buttonManageData.ts` — WEM 4탭 status code 수정 (`PLANNED/IN_PROGRESS/...` → `DETAIL`) + generalAdminRoles 추가
- [x] 위험성 평가 `DETAIL` status entry 추가 (generalAdminRoles: RISK_ASSESS_ADMIN)
- [x] EHS 협의체 status code `DETAIL` → `입장중` 수정 (PartnerVisitorTab 실제 canSee 호출값과 일치)
- [x] 건강검진 관리 3탭(건강검진 계획/검진 관리/사후관리) buttonManageData 신규 추가

### ✅ 완료 — isAdmin T2 전환 전면 스윕 (2026-06-11 세션 6, commit 949e141)
- [x] `utils/auth.ts` — `isSystemAdmin()` / `isEhsManager()` 헬퍼 정의 (main 3bdb82c에서 도입)
- [x] 37개 화면 `isEhsManager()` 헬퍼 전환 완료 — Dp* 7 · ehs 12 · Wem 4 · Od 6 · 기타 + Pages
- [x] 도메인 역할 보존 — AuditPlan/Execution(+AUDIT_ADMIN), TrainingStatus(+TRAINING_ADMIN), EmrResource(+TEAM_ADMIN)
- [x] ApprovalManagePage SYSTEM_ADMIN 단독 유지 (3단계 보류 확정)

### 🟢 진행 중 — main 변경내역 확인 (2026-06-05 세션 4에서 시작)
- [x] **#1 협력업체 안전 실행** — 추가 완료, 버그 2건 수정 완료 (아래 세부 참조)
- [ ] **#2 OSH 위원회 서명** — 미확인. 경로: EHS경영 → 산업안전보건위원회, 참석자 인라인 서명 기능
- [ ] **#3 UX 통일** — 미확인. 검색바 Enter 트리거, 날짜 기본값, 체크리스트 연결 필수값 (전 페이지)
- [ ] **#4 위험성 평가 요약 패널** — 미확인. 경로: 위험성 평가 관리 탭, 평균위험도 개선전/후 카드
- [ ] **#5 평가표 multi-instance** — 미확인. 체크리스트 정렬, 도면 트리, 사고 분류 4종
- [ ] **#6 EHS 메시지·Q&A 댓글** — 미확인. 대댓글 지원, 위험성평가 복사
- [ ] **#7 EHS 실예산 카드** — 미확인. 경로: EHS 예산 → 실예산 사용입력, 분류별 예산/사용/잔여 비교
- [ ] **#8 법규대응 DB 분리** — 미확인. tb_legal_compliance_* 별도 테이블 (ceaf263)

### ✅ 완료 — 보건 관리 버튼 권한 전면 적용 (2026-06-06 세션 5, commit 2d0dc60)
- [x] buttonManageData 보건 관리 메뉴 구조 정비 — 실제 탭 구조와 일치 (내 검진 이력 1개, 작업환경 측정 4탭, 직업병 관리 6탭, 질병예방 관리 7탭)
- [x] 보건 관리 전 탭 canSee 적용 — WemFactorTab/PlanTab/ResultTab/ImprovementTab, OdmAccidentClaimTab, Dp*Tab 7개, MyHealthCheckupPage
- [x] 내 검진 이력 EHS_ADMIN 버튼 미표시 수정 — DETAIL ALL_ON + isAdmin EHS_ADMIN 포함
- [x] GA 버튼 권한 실제 동작 버그 수정 — myRoles에 user.role 추가 (20개 컴포넌트 일괄)
  - 원인: TEAM_ADMIN 등 실제 role로 GA 권한 부여해도 myRoles에 없어 canSee 미체크
  - 해결: myRoles = ['guest', ...(isAdmin?['superAdmin']:[]), ...(user?.role?[user.role]:[])]
- [x] 산재신청 제출 버튼 canSee 적용 + statusCode 'DETAIL'→'DRAFT' 수정

### 🔴 1단계 — 예스코 투입 전 준비 (~ 6/9)
- [ ] **예스코 미팅 준비** — 아래 "예스코 확인 필요 사항" 체크리스트 기반 질문 목록 정리
- [ ] **tb_user 전환 범위 최종 확인** — T_IDM_USER 참조 7개 파일 전환 시 영향도 재검토
- [ ] **백엔드 보안 이슈 파악** — API 권한 제어 추가 방안 설계 (`@PreAuthorize` 적용 범위)
- [ ] **isAdmin 하드코딩 4개 화면 수정 계획** — RiskAssessmentTab 등
- [ ] **isAdmin 패턴 통일 (43개 파일 분류 확정)** — 3-티어 기준으로 분류 완료. 아래 표 참조

  **분류 기준 (공용 헬퍼 도입)**
  - **T1 `isSystemAdmin()`** = `SYSTEM_ADMIN` 단독 — 사용자/역할/시스템 설정 화면
  - **T2 `isEhsManager()`** = `SYSTEM_ADMIN | EHS_ADMIN` — EHS 업무 운영 화면 (기본값)
  - **T3 `isTeamManager()`** — 팀 단위 승인/조회. **현재 0개** (소유권 분기는 `isOwner`가 별도 처리) → 예스코 확정 전까지 헬퍼 미생성

  **전체 집계: T1 = 1 / T2 = 41 / 보류 = 1**

  | 티어 | 개수 | 대상 |
  |------|------|------|
  | T1 (SYSTEM_ADMIN 단독 유지) | 1 | SystemManagePage |
  | T2 (SYSTEM_ADMIN \| EHS_ADMIN 전환) | 41 | 위험평가·보건·측정·감사·교육 등 운영 화면 전반 |
  | 보류 (3단계까지 현행 유지) | 1 | ApprovalManagePage |

  **5개 경계 화면 확정 결과 (코드 확인 완료)**

  | 파일 | 확정 | 근거 |
  |------|------|------|
  | EhsManagerTab | T2 | `role*` 필드는 직책·소속 라벨(명부), 권한 부여 아님 |
  | PpeRequestTab | T2 | isAdmin은 지급/반납 운영용. 신청 소유권은 `isOwner`가 별도 처리 |
  | OdmAccidentClaimTab | T2 | 이미 다중역할 패턴 → 헬퍼 치환만 |
  | MyHealthCheckupPage | T2 | "My"지만 isAdmin은 관리자 뷰 분기 → 헬퍼 치환만 |
  | **ApprovalManagePage** | **🔵 3단계 보류** | 결재 승인/반려 처리. EHS_ADMIN 확대 시 tb_approval 승인 권한 확대 → 예스코 결재 연동(3단계)과 맞물림. **그때까지 SYSTEM_ADMIN 단독 유지** |

  **이번 주 조치 (현장 투입 전)**
  - [ ] 공용 헬퍼 `isSystemAdmin()` / `isEhsManager()` 정의 (`utils/auth.ts`)
  - [ ] **선행 확인**: 예스코 현장 사용자 실제 역할 매핑 (EHS_ADMIN 부여 여부) — 미부여 시 작업 무의미
  - [ ] Day-1 핵심 화면 우선 T2 전환 — 하드코딩 4개(RiskAssessmentTab, RiskAssessmentOfficeWorkTab, SafetyWorkPage, OshCommitteeTab) + EhsManagerTab/PpeRequestTab
  - [ ] 이미 T2 패턴인 화면(OdmAccidentClaimTab, MyHealthCheckupPage 등)은 헬퍼 치환만
  - [ ] ApprovalManagePage는 **건드리지 않음** (3단계 보류)
  - [ ] 나머지 화면 전면 스윕은 🟡 2단계로 이월

### 🟠 신규 기능 요청 (예스코)
- [ ] **산업안전보건위원회 싸인 기능** — 커뮤니케이션 > 산업안전보건위원회 참석자 서명 기능 추가. 링크 전송 → 서명자 로그인 페이지 표시 → 로그인 시 해당 페이지 바로 이동
- [ ] **EHS 메시지 첨부 기능** — EHS 메시지 등록/상세 화면에 파일 첨부 기능 추가
- [ ] **직책 자동 세팅** — 로그인한 사람의 직책이 등록 화면에 자동 세팅되도록 수정
- [ ] **EHS 알림 직책 표시** — EHS 알림 등록·상세 화면에 작성자 직책 필드 추가
- [ ] **Q&A 직책·부서 추가** — Q&A 등록·상세 화면에 작성자 직책·부서 필드 추가

### 🟡 2단계 — 예스코 투입 후 (6/10~)
- [ ] **tb_user 전환** — 인증 코드 T_IDM_USER → tb_user 교체 (수정 파일 4개)
- [ ] **tb_user 컬럼 보강** — dept_code, title_code, duty_code, mobile, emp_no 등 추가 (V192__)
- [ ] **사용자 CRUD API 개발** — POST/PUT/DELETE /api/users (현재 역할변경만 존재)
- [ ] **부서 관리 API/화면 개발** — tb_dept 신규 테이블 + CRUD (T_IDM_GROUP 대체)
- [ ] **사용자 관리 화면 개발** — 시스템 관리 탭에 사용자 등록/수정/삭제/비밀번호초기화 추가
- [ ] **백엔드 API 권한 제어 추가** — SecurityConfig + @PreAuthorize 적용
- [x] **isAdmin 나머지 화면 전면 스윕** — 37개 화면 완료 (2026-06-11, commit 949e141)
- [ ] **예스코 초기 데이터 입력** — 조직도·사용자 데이터 세팅

### 🔵 3단계 — 예스코 요구사항 확인 후
- [ ] **결재 시스템 연동** — 예스코 그룹웨어 연동 or EHS 자체 결재 유지 결정 후 진행
- [ ] **SSO 연동** — 예스코 Azure AD 사용 시 (UI는 이미 존재, 백엔드 미구현)
- [ ] **application.yml 환경변수 전환** — DB 비밀번호·JWT Secret 하드코딩 제거
- [ ] **다사업장 구조 검토** — 예스코 사업장 수에 따라 CompanyCode 단일 구조 변경 필요 여부

---

## 📋 예스코 미팅 확인 필요 사항

### 🔴 필수 (없으면 개발 시작 불가)
```
□ 그룹웨어/결재 시스템명과 버전
  → 더존 iWork / 카카오워크 / 자체개발 등
  → API 연동 지원 여부 + 담당자 연락처

□ HR/인사 시스템명
  → 사용자 계정을 어디서 관리하는지
  → EHS와 자동 동기화 원하는지 (IDM 유무)

□ EHS 결재를 그룹웨어와 연동할지 여부
  → YES: 연동 개발 필요 (일정 +2~4주)
  → NO: EHS 자체 결재 그대로 사용

□ 사업장 수와 사업장 코드 체계
  → 현재 단일 CompanyCode 구조
  → 다사업장이면 구조 변경 필요

□ 예스코 조직도 (부서 코드 체계)
```

### 🟡 설계에 필요
```
□ 사용자 역할 몇 가지로 구분할지
  → 현재: SYSTEM_ADMIN, EHS_ADMIN, TEAM_MEMBER 외 26개
  → 예스코 맞춤 역할 정의 필요

□ 역할별 메뉴 접근 권한 요구사항
  → 어떤 직급이 어떤 메뉴를 볼 수 있는지

□ 결재선 구조
  → 몇 단계 결재인지, 부서별 다른지

□ Azure AD / Office 365 / Teams 사용 여부
  → YES: SSO 연동 가능 (UI 이미 존재)
  → Teams 알림 연동 가능 (MS Graph API 이미 구현됨)

□ 사용자 계정 관리 주체
  → IT팀 관리 vs 안전팀 관리자 직접 등록
```

### 🔵 운영 관련
```
□ 서버 환경 (온프레미스 / 클라우드)
□ 네트워크 환경 (내부망 / 외부 접근 여부)
□ 동시접속 예상 사용자 수
□ 모바일 사용 여부
□ 보안 요구사항 (감사 로그, API 접근 제어 등)
```

---

## 📊 시스템 파악 현황 (2026-05-28)

| 영역 | 파악 완료 | 비고 |
|------|-----------|------|
| 전체 아키텍처 | ✅ | React+Spring Boot+MSSQL 3티어 |
| 기술 스택 | ✅ | 프론트/백엔드 상세 파악 완료 |
| 모듈 목록 | ✅ | 30개 업무 모듈 |
| 인증/JWT 구조 | ✅ | T_IDM_USER 기반, 24h/7d 토큰 |
| 사용자/권한 구조 | ✅ | IDM 연동 구조, 26개 역할 |
| 결재 시스템 | ✅ | tb_approval + tb_approval_line |
| 외부 연동 | ✅ | MS Graph API, Gmail SMTP, Gemini AI |
| DB 테이블 구조 | ✅ | tb_user vs T_IDM_USER 비교 완료 |
| 전환 작업 범위 | ✅ | 수정 4개 + 삭제 4개 파일 확정 |
| 백엔드 보안 이슈 | ✅ | API 권한 제어 없음 확인 |
| 로컬 개발환경 | ✅ | 회사 DB 연결 후 정상 구동 |

---

## ⚠️ 발견된 이슈 (납품 전 반드시 해결)

| 우선순위 | 이슈 | 위치 | 해결 방법 |
|----------|------|------|-----------|
| 🔴 높음 | 백엔드 API 권한 제어 없음 | SecurityConfig.java | @PreAuthorize 또는 SecurityConfig에 역할별 경로 제한 추가 |
| 🔴 높음 | DB 비밀번호 하드코딩 | application.yml | 환경변수 ${DB_PASSWORD}로 전환 |
| 🔴 높음 | JWT_SECRET 기본값 고정 | application.yml | 운영 환경변수 필수 설정 |
| 🟡 중간 | isAdmin 패턴 불일치 (43개 파일) | 화면 전반 | **분류 확정 완료** (🔴 1단계 참조 — T1=1/T2=41/보류=1). 1단계: Day-1 핵심 화면 + 헬퍼 도입 / 2단계: 나머지 전면 스윕 / ApprovalManagePage는 3단계 보류 |
| 🟡 중간 | 인증(T_IDM_USER) ↔ 업무(tb_user) 테이블 불일치 | AuthService vs 각 Service | tb_user 단일화 전환 |
| 🟡 중간 | 도면 이미지 로컬 미존재 | FileStorageService | 운영서버 uploads 폴더 동기화 필요 |
| 🔵 낮음 | preferred_language 컬럼 미사용 | tb_user | User.java 모델에 추가 또는 제거 |
| 🔵 낮음 | SSO UI만 존재, 백엔드 미구현 | AuthManageTab.tsx | 예스코 요구 시 구현 |
| ✅ 완료 | 계획 결재상신·수정·삭제 버튼 — 작성자/Admin만 노출로 수정 | AnnualPlanTab, AuditPlanTab, EmrPlanTab — canEditDraft() 헬퍼 추가 |
| ✅ 완료 | tb_user/T_IDM_USER 이중 구조로 인한 ID 불일치 버그 (승인 권한 체크 항상 실패) | T_IDM_USER 단일화 완료 — planApproverUserId == UidNumber 정상 비교 |
| ✅ 완료 | 연간계획 반려 버튼 클릭 시 무반응 | RejectReasonDialog를 Detail 뷰 return 블록에 추가 |
| 🟡 중간 | 긴급 발송(이메일·문자) 기능 미구현 — 버튼 클릭 시 2초 대기 후 성공 메시지만 표시 | EmergencyNotificationTab.tsx | 백엔드 발송 API + SMTP 연동 신규 개발 필요, SMS는 게이트웨이 계정 별도 필요 |
| 🟡 중간 | 계획승인·완료승인 버튼 권한 체크 누락 (2개 탭) — PENDING 상태면 누구나 승인 가능 | HealthCheckupPlanTab.tsx (프론트), SiteSafetyPlanService.java (백엔드) — 둘 다 승인자 확인 없음 | 지정 승인자 or Admin 체크 추가 필요 (다른 탭과 동일 패턴 적용) |
| 🔵 낮음 | 감사 실시에서 체크리스트 직접 연결 불가 — 계획 단계에서 미연결 시 실시에서 추가 방법 없음 | AuditExecutionTab.tsx — checklistTemplateId를 연결된 감사계획에서만 가져옴, 실시 수정화면에 선택 UI 없음 | 감사 실시 수정 화면에 체크리스트 선택 드롭다운 추가 필요 |
| 🟡 중간 | 감사 실시 상세 화면 UX 2건 — ① 수정 버튼 없어 감사원·감사일·등급 편집 불가 (handleOpenEdit 함수는 있으나 버튼 미연결) ② 체크리스트 없을 때 저장 버튼이 재조회만 하고 "저장됐습니다" 표시 (오해 유발, 체크리스트 있을 때는 정상) | AuditExecutionTab.tsx 상세 뷰 버튼 영역 | ① 상세 뷰에 수정 버튼 추가 ② 체크리스트 없을 때 저장 버튼 숨김 처리 |

---

## ✅ 완료된 작업

### 세션 1 (2026-05-28) — 시스템 파악
- [x] 전체 디렉토리 구조 및 기술 스택 분석
- [x] 로컬 개발환경 구축 (회사 DB 연결, 프론트/백엔드 구동)
- [x] 인증/JWT/사용자/권한 구조 파악
- [x] 결재 시스템 전체 흐름 파악
- [x] 외부 연동 시스템 파악 (IDM, MS Graph, SMTP, Gemini)
- [x] tb_user vs T_IDM_USER 테이블 비교 분석
- [x] T_IDM_USER 참조 파일 전체 목록 추출 (전환 범위 확정)
- [x] 백엔드 보안 이슈 및 하드코딩 문제 식별
- [x] 예스코 적용 작업 범위 및 일정 추정

### 세션 2 (2026-06-01) — 예스코 커스터마이징 초기 작업
- [x] 계획 결재상신·수정·삭제 버튼 — 작성자/Admin만 노출 (canEditDraft 헬퍼)
- [x] 완료승인자 "계획과 동일" 체크박스 — 6개 탭 적용
- [x] 백엔드 작성자 자동 매핑 수정 (IdmMapper로 UidNumber 세팅)

### 세션 5 (2026-06-06) — 보건 관리 버튼 권한 전면 적용
- [x] buttonManageData 보건 관리 섹션 메뉴 구조 정비 (내 검진 이력 / 작업환경 측정 4탭 / 직업병 관리 6탭 / 질병예방 관리 7탭)
- [x] MyHealthCheckupPage canSee 적용 + EHS_ADMIN isAdmin 포함
- [x] WemFactorTab/PlanTab/ResultTab/ImprovementTab canSee 신규 적용 (imports, MENU 상수, hooks, 버튼 래핑)
- [x] OdmAccidentClaimTab canSee 신규 적용 + statusCode DETAIL→DRAFT 수정 + 제출 버튼 래핑
- [x] OdPlanTab/StatusTab/ManageTab/ExposureTab/AftercareTab myRoles user.role 추가
- [x] Dp*Tab 7개 myRoles user.role 추가
- [x] GA 권한 버그 근본 원인 수정 — myRoles에 user?.role 포함 (20개 컴포넌트)
- [x] 산재신청 buttonManageData 제출 ALL_ON→WRITER_ADMIN, 저장 항목 추가

### 세션 4 (2026-06-05) — origin/main 싱크 · 버그 수정

#### origin/main → yesco-dev 싱크 (백업 태그: `yesco-backup-20260605`)
- [x] **협력업체 안전 실행 기능 추가** (origin/main 5/28 커밋 `9b4a65f` — ed01b08 수동 머지에서 누락됐던 것)
  - 백엔드: PartnerSafetyExecution Controller/Mapper/Model/Service/XML 추가
  - 프론트: PartnerSafetyHistoryTab.tsx, partnerSafetyExecutionApi.ts 추가
  - PartnerSafetyMgmtPage 조회 탭 → PartnerSafetyHistoryTab 연결
- [x] **Flyway 버전 충돌 해결**
  - yesco V186(create_button_rule) → **V195** 로 rename
  - yesco V187(create_menu_rule) → **V196** 로 rename
  - origin/main V186(partner_safety_execution), V187(site_safety_drop_completion_approver), V188 추가
- [x] **현재 마이그레이션 순서**: V185 → V186(partner_safety) → V187(drop_completion_approver) → V188 → V189~V194(기존) → **V195(button_rule)** → **V196(menu_rule)**

#### 버그 수정
- [x] **SiteSafetyPlanMapper.xml 500 에러** — V187이 `completion_approver_*` 컬럼 DROP했는데 Mapper INSERT/UPDATE/resultMap에 잔존 → 컬럼 제거
- [x] **approvalApi.ts 빌드 오류** — `fetchTeamLeader` 중복 export (796febd + 7b286ae 양쪽에서 추가) → 중복 제거

#### main 변경내역 확인 현황
| # | 커밋 | 내용 | 상태 |
|---|------|------|------|
| 1 | `9b4a65f` 5/28 | 협력업체 안전 실행 — 관리/실행/조회 탭 | ✅ 확인+버그수정 완료 |
| 2 | `4503468` 6/4 | OSH 위원회 참석자 서명 (SignaturePad 인라인) | ⬜ 미확인 |
| 3 | `4503468` 6/4 | UX 통일 — 검색바 Enter, 날짜 기본값, 체크리스트 필수값 | ⬜ 미확인 |
| 4 | `373a654` 6/2 | 위험성 평가 — 평균위험도 요약 패널 | ⬜ 미확인 |
| 5 | `d939884` 6/2 | 평가표 multi-instance · 도면 트리 · 사고 분류 4종 | ⬜ 미확인 |
| 6 | `7a3ed62` 6/2 | EHS 메시지·Q&A 댓글 + 위험성평가 복사 | ⬜ 미확인 |
| 7 | `b857077` 6/2 | EHS 실예산 — 분류별 예산/사용/잔여 비교 카드 | ⬜ 미확인 |
| 8 | `ceaf263` 6/2 | 법규대응 DB 분리 — tb_legal_compliance_* | ⬜ 미확인 |

### 세션 3 (2026-06-02) — tb_user 전환 · DEV 도구 · 버그 수정
- [x] **연간계획 반려 버튼 버그 수정** — RejectReasonDialog를 Detail 뷰에 추가
- [x] **버튼관리 페이지** — 드래그 플로팅 패널 → `/dev/button-manage` 독립 URL로 분리
- [x] **버튼관리 데이터** — 전체 상태 추가, 인터랙티브 체크박스, 26개 메뉴 커버
- [x] **tb_user → T_IDM_USER 전환** (핵심 리팩토링)
  - IdmUser에 groupName 필드 추가 (T_IDM_GROUP JOIN)
  - IdmMapper에 findByUidNumber, findByEmail 추가
  - 승인 권한 체크 서비스 7개 전환 (getId→getUidNumber, ID 불일치 버그 수정)
  - UserService, UserController IdmMapper 기반으로 교체
  - TrainingApplication/HealthCheckupPlan/TrainingCourse 컨트롤러·서비스 전환
  - DataInitializer 삭제
  - tb_user는 코드 참조 제거 완료 (드랍 가능 상태)
- [x] **헤더 DEV 계정 전환** — 아바타 드롭다운에서 즉시 계정 전환, 현재 페이지 유지
- [x] **글로벌경영관리팀 사용자 이동** — 정경석·홍길동 DeptCode 변경, 트리 최상단 고정
- [x] **DEV 계정 비밀번호 설정** — yeseo.moon·jungho.yoo·yujeong.jung → com4in!!
- [x] **부서 트리 팀장 정보 확인** — T_IDM_GROUP.ManagerEmployeeID 활용 가능 확인

---

## 🐛 알려진 에러 & 해결책

| 에러 | 원인 | 해결 |
|------|------|------|
| vite allowedHosts 차단 | vite.config.ts에 `allowedHosts: ['ehs.com4in.com']`만 설정 | localhost 추가: `allowedHosts: ['ehs.com4in.com', 'localhost']` |
| 도면 이미지 404 | 운영서버 uploads 폴더 파일이 로컬에 없음 | 개발 시 무시 가능, 운영 시 파일 동기화 필요 |

---

## 예상 작업 일정

| 기간 | 작업 | 비고 |
|------|------|------|
| ~6/9 | 시스템 파악 + 예스코 미팅 준비 | ✅ 파악 완료 |
| 6/10 1주차 | tb_user 전환 + 사용자 CRUD | 예스코 데이터 필요 |
| 6/10 2주차 | 부서 관리 + 관리자 화면 | |
| 6/10 3주차 | 백엔드 보안 + 초기 데이터 | |
| 4주차~ | 결재 연동 | 예스코 요구사항 확인 후 |

**사용자/권한 작업: 약 2~3주**
**결재 연동 포함 시: 약 5~6주**

---

## 환경 & 스택 요약

| 항목 | 내용 |
|------|------|
| OS / IDE | Windows · VS Code + Claude Code |
| 프로젝트 경로 | `C:\claude\smart_ehs_com4in-main` |
| Backend 포트 | 7501 (context-path: /api) |
| Frontend 포트 | 7500 |
| DB Host | 211.171.152.242:51084 |
| DB Name | SmartEHS_com4in / User: com4in |
| Flyway 다음 버전 | V192__ |
| 파일 업로드 경로 | `./uploads/` (백엔드 실행 경로 기준) |
