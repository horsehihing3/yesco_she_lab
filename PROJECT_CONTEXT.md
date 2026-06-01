# PROJECT_CONTEXT.md
Smart EHS → 예스코 커스터마이징 — 세션 컨텍스트

> **Claude에게:** 새 세션 시작 시 이 파일을 첨부하고 "다음 작업 확인해줘"라고 하면 바로 이어받을 수 있습니다.
> 완료 항목이 10개 이상 쌓이면 `docs/ARCHIVE.md`로 이동하고 이 파일에서는 삭제하세요.

---

## ⚡ 다음 세션 작업 (우선순위 순)

### 🔴 1단계 — 예스코 투입 전 준비 (~ 6/9)
- [ ] **예스코 미팅 준비** — 아래 "예스코 확인 필요 사항" 체크리스트 기반 질문 목록 정리
- [ ] **tb_user 전환 범위 최종 확인** — T_IDM_USER 참조 7개 파일 전환 시 영향도 재검토
- [ ] **백엔드 보안 이슈 파악** — API 권한 제어 추가 방안 설계 (`@PreAuthorize` 적용 범위)
- [ ] **isAdmin 하드코딩 4개 화면 수정 계획** — RiskAssessmentTab 등

### 🟡 2단계 — 예스코 투입 후 (6/10~)
- [ ] **tb_user 전환** — 인증 코드 T_IDM_USER → tb_user 교체 (수정 파일 4개)
- [ ] **tb_user 컬럼 보강** — dept_code, title_code, duty_code, mobile, emp_no 등 추가 (V192__)
- [ ] **사용자 CRUD API 개발** — POST/PUT/DELETE /api/users (현재 역할변경만 존재)
- [ ] **부서 관리 API/화면 개발** — tb_dept 신규 테이블 + CRUD (T_IDM_GROUP 대체)
- [ ] **사용자 관리 화면 개발** — 시스템 관리 탭에 사용자 등록/수정/삭제/비밀번호초기화 추가
- [ ] **백엔드 API 권한 제어 추가** — SecurityConfig + @PreAuthorize 적용
- [ ] **isAdmin 하드코딩 수정** — 4개 화면 실제 권한 체크로 교체
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
| 🟡 중간 | isAdmin 하드코딩 (4개 화면) | RiskAssessmentTab 등 | 실제 role 체크 코드로 교체 |
| 🟡 중간 | 인증(T_IDM_USER) ↔ 업무(tb_user) 테이블 불일치 | AuthService vs 각 Service | tb_user 단일화 전환 |
| 🟡 중간 | 도면 이미지 로컬 미존재 | FileStorageService | 운영서버 uploads 폴더 동기화 필요 |
| 🔵 낮음 | preferred_language 컬럼 미사용 | tb_user | User.java 모델에 추가 또는 제거 |
| 🔵 낮음 | SSO UI만 존재, 백엔드 미구현 | AuthManageTab.tsx | 예스코 요구 시 구현 |
| 🟡 중간 | 계획 결재상신·수정·삭제 버튼 — 작성자 무관 DRAFT 상태면 누구나 노출 | AnnualPlanTab, AuditPlanTab, EmrPlanTab 등 전체 계획 탭 공통 | `isAdmin \|\| writerUserId === authUser.id` 조건 추가 필요 (예스코 요구사항 확인 후 일괄 수정) |
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
