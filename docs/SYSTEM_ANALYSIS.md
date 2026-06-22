# SYSTEM_ANALYSIS.md
Smart EHS 시스템 구조 분석 (2026-05-28 파악 완료)

---

## 전체 아키텍처

```
[브라우저]
    ↓ HTTPS
[Frontend: React 18 + Vite + TypeScript]  포트 7700
    ↓ REST API (Axios)
[Backend: Spring Boot 3.2.2 / Java 17]   포트 7701, /api
    ↓ MyBatis XML Mapper
[DB: MS SQL Server]  211.171.152.242:51084 / yescoSHE_lab2  (VPN 전환 시 예스코 운영DB로 재갱신 예정)
```

---

## 인증 구조

```
POST /api/auth/login { username, password }
    ↓
AuthService → BCrypt 검증 → T_IDM_USER 조회
    ↓
JwtTokenProvider → Access Token(24h) + Refresh Token(7d)
    ↓
이후 모든 요청: Authorization: Bearer {token}
```

**단일화 완료:** 인증·업무 서비스 모두 T_IDM_USER 정본 사용 (ADR-001). tb_user 는 미사용 레거시 잔재.

---

## 사용자/권한 구조

### 현재 테이블 구조
| 테이블 | 용도 | 상태 |
|--------|------|------|
| T_IDM_USER (44컬럼) | 인증/사용자 정보 (HR 연동) | 실사용 |
| T_IDM_GROUP | 부서/조직 트리 | 실사용 |
| tb_user (12컬럼) | EHS 자체 사용자 | 레거시 잔재 (미참조) |

### 예스코 전환 방향 — 폐기됨 (ADR-001)
```
tb_user 전환 폐기 → T_IDM_USER 정본 단일화 유지 (ADR-001)
tb_dept 전환 폐기 → T_IDM_GROUP 유지
```

### ~~수정 필요 파일 / 삭제 가능 파일~~ — tb_user 전환 폐기로 무효 (ADR-001)
> 전환을 전제한 계획이라 폐기. *수정 필요*(CustomUserDetailsService·AuthService·UserController·UserInfoResponse)·*삭제 가능*(IdmMapper·IdmUser·IdmService) 모두 무효 — T_IDM_USER 정본·IDM 계층 존속.

---

## 권한 체계 (26개 역할)

| 그룹 | 역할 코드 |
|------|-----------|
| 시스템 | SYSTEM_ADMIN, EHS_ADMIN, TEAM_ADMIN, TEAM_MEMBER |
| 안전 | RISK_ASSESS_ADMIN, NEAR_MISS_ADMIN, AUDIT_ADMIN, PERMIT_ADMIN, PPE_ADMIN, TRAINING_ADMIN, EMERGENCY_ADMIN |
| 보건 | HEALTH_ADMIN, OCCUPATIONAL_ADMIN, WORK_ENV_ADMIN, ERGONOMICS_ADMIN |
| ~~화학~~ *(모듈 제거됨)* | ~~CHEM_MASTER_ADMIN, CHEM_MSDS_RAW_ADMIN, CHEM_MSDS_PROD_ADMIN, CHEM_REG_ADMIN, CHEM_LIFECYCLE_ADMIN~~ |
| ~~환경~~ *(모듈 제거됨, COMPLIANCE 제외)* | ~~ENV_MONITORING_ADMIN, WASTE_ADMIN, AIR_WATER_ADMIN, CARBON_ADMIN~~, COMPLIANCE_ADMIN |
| 기타 | QNA_ADMIN |

**⚠️ 백엔드 API 권한 제어 없음** — JWT 토큰만 있으면 모든 API 접근 가능

---

## 결재 시스템

### 테이블 구조
```
tb_approval_line   : 결재 라인 템플릿 (부서별 사전 설정)
tb_approval        : 실제 결재 문서 인스턴스
```

### 결재 흐름
```
① 관리자: 부서별 결재 라인 설정 (PUT /api/approval-lines/batch)
② 사용자: 결재 요청 생성 (POST /api/approvals)
③ 결재자: 대기 목록 조회 (GET /api/approvals/my-pending)
④ 결재자: 승인/반려 (PUT /api/approvals/{id})
⑤ 연동 모듈 자동 상태 변경 (PPE, PTW, 교육)
```

### 결재 타입
`PPE_REQUEST`, `PERMIT_TO_WORK`, `TRAINING`

### 상태 코드
`PENDING` → `APPROVED` / `REJECTED` → `COMPLETED`

---

## 외부 연동 시스템

| 시스템 | 연동 방식 | 용도 | 상태 |
|--------|-----------|------|------|
| IDM (HR) | DB 테이블 직접 공유 | 사용자/조직 정보 | 운영 중 |
| Microsoft Graph API | Azure AD OAuth | Teams 알림, Office 365 메일 | 환경변수 미설정 시 비활성 |
| Office 365 SMTP | STARTTLS (587) | 이메일 알림 | 환경변수 필요 |
| Google Gemini AI | 프론트 직접 호출 | AI 분석 기능 | 클라이언트 직접 연동 |

---

## 프론트엔드 company-tree API 의존 파일 (9개)
구조 변경 시 전체 수정 필요:
- `UserSelectModal.tsx`
- `DeptUserMultiSelectModal.tsx`
- `DepartmentSelectModal.tsx`
- `RoleManageTab.tsx`
- `AdminPage.tsx`
- `ApprovalLinePage.tsx`
- `ProcessActivityWorkPage.tsx`
- `SafetyWorkPage.tsx`
- `PpeRequestTab.tsx`

---

## Flyway 마이그레이션 현황
- Flyway 비활성(off · inert) — 자동 마이그레이션 없음 (과거 Flyway 관리분 V1~V191)
- 현재 스키마 변경 = 수동 `db/` 스크립트, 최신 V232
- T_IDM_USER Flyway 미관리 (수동 생성 추정)
