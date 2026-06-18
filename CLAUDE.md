# CLAUDE.md

> **이 파일은 불변 규칙만 담습니다. 100줄 이내를 목표로 유지합니다.**
> 세션 진행 상황 → `PROJECT_CONTEXT.md` / 시스템 분석 내용 → `docs/SYSTEM_ANALYSIS.md`

---

## 프로젝트 개요

컴포인(Com4in)이 개발한 Smart EHS 시스템을 예스코(Yesco)에 커스터마이징하여 납품하는 프로젝트.
원개발자 코드를 인수받아 예스코 환경에 맞게 사용자 관리·권한·결재 시스템을 재구성합니다.

| 항목 | 내용 |
|------|------|
| 저장소 | `https://github.com/jiwon2ahn/smart_ehs_com4in` |
| 로컬 경로 | `C:\claude\smart_ehs_main` |
| Backend | Spring Boot 3.2.2 / Java 17 / MyBatis / `http://localhost:7601/api` |
| Frontend | React 18 + Vite + TypeScript + MUI / `http://localhost:7600` |
| DB | MS SQL Server `211.171.152.242:51084` / `SmartEHS_com4in` |
| 역할 | `SYSTEM_ADMIN` / `EHS_ADMIN` / `TEAM_MEMBER` 외 26개 역할 |
| Swagger | `http://localhost:7601/api/swagger-ui.html` |

---

## 실행 방법

```bash
# Backend (Windows)
cd C:\claude\smart_ehs_main\backend
./gradlew.bat bootRun

# Frontend
cd C:\claude\smart_ehs_main\frontend
npm install   # 최초 1회
npm run dev
```

---

## 아키텍처

```
React (7600) → REST API → Spring Boot (7601) → MyBatis → MSSQL

backend/src/main/java/com/smartehs/
├── controller/   # REST API (100개+)
├── service/      # 비즈니스 로직
├── mapper/       # MyBatis 인터페이스
├── model/        # 엔티티
├── dto/          # request / response
├── config/       # DB 초기화·설정
├── security/     # JWT 필터
└── util/

frontend/src/
├── pages/        # 75개 페이지
├── components/   # 25개 도메인 컴포넌트
├── api/          # Axios 호출
└── store/        # Zustand 상태관리
```

---

## 절대 규칙

- **T_IDM_USER 직접 INSERT/DELETE — 환경별 분기** ([[ADR-001]] 으로 갱신, 2026-06-16)
  - **컴포인 환경(IDM 소유)**: 직접 INSERT/DELETE 금지, UserRole UPDATE만 허용.
  - **예스코 환경(IDM 부재 → SHE 소유)**: SAP HR 동기화가 `T_IDM_USER`에 **직접 upsert 허용**(단 `SyncSource='SAP'` 행만, 'SHE' 자체등록 행은 보호). 사용자=`T_IDM_USER`/부서=`T_IDM_GROUP`/코드=`T_IDM_HRCODE` **그대로 유지**.
  - ~~예스코 전환 후 tb_user 사용~~ → **폐기됨** (tb_user/tb_dept 전환 안 함. 사유·근거: `docs/adr/ADR-001-user-table-and-hr-sync.md`)
- **DB 스키마 변경 시 Flyway 마이그레이션 파일 추가** — 현재 V220까지 존재, 다음 신규는 `V221__`
- **기존 API 응답 구조 무단 변경 금지** — 프론트 9개 파일이 `/api/users/company-tree` 응답 구조 의존
- **컨트롤러는 Response DTO 반환을 표준으로 한다** — raw 엔티티(model) 반환은 **신규 금지**. 기존 raw 반환은 *손댈 때 같이 전환*(convert-on-touch), 민감도메인(건강검진·사고·산재·직업병·방사선건강·협력업체 개인정보)부터 우선 전환. DTO는 wire 필드를 raw와 **동일하게** 유지(프론트 무변경). PersonRef 브릿지 접근자가 DTO 필드 소스. 레퍼런스: `EhsAnnualPlan*`. ※ raw↔DTO는 *모델↔계약* 분리 문제로 PersonRef(*DB↔wire*)와 무관·공존.
- **예외는 표준 예외로 던진다** — not-found→`ResourceNotFoundException`(404), 검증/중복 실패→`BadRequestException`(400). `throw new RuntimeException`은 인프라/IO 실패(cause 래핑)에만 허용. 일반 RuntimeException은 `GlobalExceptionHandler` catch-all이 500+고정메시지로 뭉개 사용자에게 메시지가 안 닿음.
- **application.yml DB 비밀번호 환경변수 전환 필요** — 현재 하드코딩 상태 (납품 전 필수)
- **백엔드 수정 후 서버 재시작 필수**
- **작성자·수정자·계획승인자·완료승인자는 역할당 JSON 1컬럼(PersonRef)으로 저장** — 상세는 아래 **사람 필드 표준 패턴** 섹션 참조. 신규 테이블도 동일 패턴 적용.

## 사람 필드 표준 패턴 (PersonRef · JSON 1컬럼)

> 역할당 4개 flat 컬럼 → **JSON 1컬럼(PersonRef 값객체)** 으로 통합 저장.
> **DB만 JSON, wire(프론트 송수신)는 flat 유지** → 프론트·Service·Controller 코드 무변경.
> 기반: `PersonRef.java` / `PersonRefTypeHandler.java` / `PersonRefColumnsInitializer.java`.
> **레퍼런스 구현: `EhsAnnualPlan*` (Response DTO형 — 컨트롤러 반환 표준).** `AuditPlan.java` + `AuditPlanMapper.xml` 은 PersonRef 매핑(raw 모델) 레퍼런스로만 참조 — 반환형은 DTO가 표준(위 절대 규칙 참조).

### 1. DB 컬럼 — `PersonRefColumnsInitializer.TABLES` 에 등록
- **Flyway 비활성** → migration 작성 금지. 초기화기 `TABLES` 배열에 `{테이블, 역할[]}` 추가만 하면
  앱 기동 시 JSON 컬럼(`created_by` 등 NVARCHAR(MAX)) 조건부 추가 + 기존 flat 16컬럼에서 1회 backfill.
- 역할 컬럼명 = `created_by` / `modified_by` / `plan_approver` / `completion_approver`.

### 2. Java Model — PersonRef + flat 브릿지 접근자
```java
@JsonIgnore private PersonRef createdBy;   // 수정자·계획/완료승인자도 동일
private static PersonRef ensure(PersonRef p){ return p != null ? p : new PersonRef(); }
@JsonProperty("createdByUserId")   public Long   getCreatedByUserId(){ return PersonRef.userId(createdBy); }
@JsonProperty("createdByName")     public String getCreatedByName(){ return PersonRef.name(createdBy); }
@JsonProperty("createdByTeam")     public String getCreatedByTeam(){ return PersonRef.team(createdBy); }
@JsonProperty("createdByPosition") public String getCreatedByPosition(){ return PersonRef.position(createdBy); }
public void setCreatedByUserId(Long v){ (createdBy = ensure(createdBy)).setUserId(v); }
public void setCreatedByName(String v){ (createdBy = ensure(createdBy)).setName(v); }
public void setCreatedByTeam(String v){ (createdBy = ensure(createdBy)).setTeam(v); }
public void setCreatedByPosition(String v){ (createdBy = ensure(createdBy)).setPosition(v); }
```
- `@JsonIgnore` 로 PersonRef 중첩 직렬화 차단, 브릿지 접근자가 flat 으로 송수신.
- 승인 타임스탬프(`planApprovedAt/By`, `completionApprovedAt/By`)는 기존 컬럼 그대로 유지.

### 3. MyBatis Mapper XML — typeHandler
```xml
<result property="createdBy" column="created_by"
        typeHandler="com.smartehs.config.typehandler.PersonRefTypeHandler"/>
<!-- INSERT/UPDATE: #{createdBy,typeHandler=com.smartehs.config.typehandler.PersonRefTypeHandler} -->
```
- resultMap·INSERT·UPDATE 모두 역할 JSON 컬럼 1개로 교체. **SELECT 는 `SELECT t.*` 만**.

### 4. Controller / Service — **무변경**
- 컨트롤러의 `setCreatedByUserId/Name/Team/Position`, 서비스의 `getPlanApproverName()` 등
  flat 호출이 브릿지 접근자로 그대로 동작. IdmUser 매핑·CREATE/UPDATE 규칙 동일:
  `getUidNumber()→UserId`, `getUserName()→Name`, `getGroupName()→Team`, `getTitleName()→Position`.
- CREATE=createdBy+modifiedBy 둘 다 로그인 사용자, UPDATE=modifiedBy만 갱신, 승인자는 프론트 값 보존.

### 5. 프론트엔드 — **무변경** (wire flat 유지)
- 기존 `formatUserName(team, name, position)` 표시 로직 그대로. `createdByName` 등 flat 필드 송수신 동일.
- 기준 샘플: `AuditPlanTab.tsx`.

### 6. 작업 체크리스트 (테이블 1개 전환 시 — 2파일만)
- [ ] `PersonRefColumnsInitializer.TABLES` 에 테이블·역할 등록 (이미 41개 등록됨 — 확인만)
- [ ] Model — flat 16필드 제거 → `@JsonIgnore PersonRef` + 브릿지 접근자
- [ ] Mapper XML — resultMap / INSERT / UPDATE 를 JSON 컬럼 + typeHandler 로 교체
- [ ] (Service/Controller/프론트 무변경) 빌드 후 GET/POST 로 flat 왕복·중첩 부재 확인

---

## 보안 규칙 (납품 전 반드시 해결)

- **백엔드 API 권한 제어 없음** — JWT 토큰만 있으면 역할 무관 모든 API 접근 가능 (프론트 UI만 제한)
- **isAdmin 하드코딩 4개 화면** — RiskAssessmentTab, RiskAssessmentOfficeWorkTab, OshCommitteeTab, SafetyWorkPage
- **JWT_SECRET 환경변수 미설정 시 고정값 사용** — 운영 환경에서 반드시 환경변수로 변경

---

## 코딩 컨벤션

- 백엔드: `com.smartehs.{layer}.{Domain}` 패키지 구조 유지
- 프론트: 컴포넌트 PascalCase, 페이지 `pages/{domain}/` 하위
- 신규 API 추가 시 Swagger 어노테이션 필수
- **폼(등록·수정·상세) 행 배치는 `docs/FORM_LAYOUT_CONVENTION.md` 흐름을 따른다** — 제목/유형 → 부서/상태 → 도메인 → 시작/종료일 → 목적 → 비고 → 작성자/생성일 → 수정자/수정일 → 승인자 → 체크리스트. 샘플: AuditPlanTab.tsx

---

## 세션 루틴

**시작:**
1. `PROJECT_CONTEXT.md` 첨부 후 "다음 작업 확인해줘"
2. Claude Code에서 `git status` 로 현재 상태 확인

**종료:**
1. `PROJECT_CONTEXT.md` 업데이트 — 완료 `[x]`, 신규 이슈 추가
2. 완료 항목 10개 이상 누적 시 → `docs/ARCHIVE.md` 로 이동 후 삭제
3. `git add . && git commit -m "{feat|fix|refactor|docs}: {요약}" && git push`
4. `/clear`

---

## 참조 문서

| 파일 | 내용 |
|------|------|
| `PROJECT_CONTEXT.md` | 현재 TODO · 완료 이력 · 진척도 · 이슈 |
| `docs/SYSTEM_ANALYSIS.md` | 시스템 구조 분석 (인증·결재·사용자·권한) |
| `docs/FORM_LAYOUT_CONVENTION.md` | 폼 테이블 행 배치 규칙 (등록·수정·상세 공통 흐름) |
| `docs/APPROVAL_STANDARD.md` | 승인(결재) 로직 표준 + 예스코 연동 seam (현황맵·상태머신·권한규칙·연동지점) |
| `컴포인__예스코_SHE_시스템_구축_제안서.pdf` | 원본 기획서 — 전체 기능 요구사항 |
