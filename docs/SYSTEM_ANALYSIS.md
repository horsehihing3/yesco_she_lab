# SYSTEM_ANALYSIS.md
Smart EHS 시스템 구조 분석 (2026-05-28 파악 완료)

---

## 전체 아키텍처

```
[브라우저]
    ↓ HTTPS
[Frontend: React 18 + Vite + TypeScript]  포트 7500
    ↓ REST API (Axios)
[Backend: Spring Boot 3.2.2 / Java 17]   포트 7501, /api
    ↓ MyBatis XML Mapper
[DB: MS SQL Server]  211.171.152.242:51084 / SmartEHS_com4in
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

**현재 문제:** 인증은 T_IDM_USER, 업무 서비스는 tb_user 조회 → 불일치 시 null 반환 가능

---

## 사용자/권한 구조

### 현재 테이블 구조
| 테이블 | 용도 | 상태 |
|--------|------|------|
| T_IDM_USER (44컬럼) | 인증/사용자 정보 (HR 연동) | 실사용 |
| T_IDM_GROUP | 부서/조직 트리 | 실사용 |
| tb_user (12컬럼) | EHS 자체 사용자 | 레거시 (업무서비스에서 사용) |

### 예스코 전환 방향
```
T_IDM_USER → tb_user로 완전 대체
T_IDM_GROUP → tb_dept 신규 테이블로 대체
```

### 수정 필요 파일 (4개)
- `CustomUserDetailsService.java` — 로그인 처리
- `AuthService.java` — 로그인/토큰갱신
- `UserController.java` — 사용자 API
- `UserInfoResponse.java` — fromIdmUser() 제거

### 삭제 가능 파일 (4개)
- `IdmMapper.java` / `IdmMapper.xml`
- `IdmUser.java` / `IdmService.java`

---

## 권한 체계 (26개 역할)

| 그룹 | 역할 코드 |
|------|-----------|
| 시스템 | SYSTEM_ADMIN, EHS_ADMIN, TEAM_ADMIN, TEAM_MEMBER |
| 안전 | RISK_ASSESS_ADMIN, NEAR_MISS_ADMIN, AUDIT_ADMIN, PERMIT_ADMIN, PPE_ADMIN, TRAINING_ADMIN, EMERGENCY_ADMIN |
| 보건 | HEALTH_ADMIN, OCCUPATIONAL_ADMIN, WORK_ENV_ADMIN, ERGONOMICS_ADMIN |
| 화학 | CHEM_MASTER_ADMIN, CHEM_MSDS_RAW_ADMIN, CHEM_MSDS_PROD_ADMIN, CHEM_REG_ADMIN, CHEM_LIFECYCLE_ADMIN |
| 환경 | ENV_MONITORING_ADMIN, WASTE_ADMIN, AIR_WATER_ADMIN, CARBON_ADMIN, COMPLIANCE_ADMIN |
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
⑤ 연동 모듈 자동 상태 변경 (PPE, PTW, 교육, 화학물질)
```

### 결재 타입
`PPE_REQUEST`, `PERMIT_TO_WORK`, `TRAINING`, `CHEMICAL`

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
- 현재: V1__ ~ V191__ (191개)
- 예스코 전환 시 V192__부터 시작
- tb_user, T_IDM_USER 모두 Flyway 미관리 (수동 생성 추정)
