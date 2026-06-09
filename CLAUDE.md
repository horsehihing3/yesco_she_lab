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
| Backend | Spring Boot 3.2.2 / Java 17 / MyBatis / `http://localhost:7501/api` |
| Frontend | React 18 + Vite + TypeScript + MUI / `http://localhost:7500` |
| DB | MS SQL Server `211.171.152.242:51084` / `SmartEHS_com4in` |
| 역할 | `SYSTEM_ADMIN` / `EHS_ADMIN` / `TEAM_MEMBER` 외 26개 역할 |
| Swagger | `http://localhost:7501/api/swagger-ui.html` |

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
React (7500) → REST API → Spring Boot (7501) → MyBatis → MSSQL

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

- **T_IDM_USER 직접 INSERT/DELETE 금지** — 현재 UserRole UPDATE만 허용, 예스코 전환 후 tb_user 사용
- **DB 스키마 변경 시 Flyway 마이그레이션 파일 추가** — `V192__` 부터 시작 (현재 V191까지 존재)
- **기존 API 응답 구조 무단 변경 금지** — 프론트 9개 파일이 `/api/users/company-tree` 응답 구조 의존
- **application.yml DB 비밀번호 환경변수 전환 필요** — 현재 하드코딩 상태 (납품 전 필수)
- **백엔드 수정 후 서버 재시작 필수**
- **작성자·수정자·계획승인자·완료승인자는 4개 필드 모두 DB에 저장** — 상세 패턴은 아래 **사람 필드 표준 패턴** 섹션 참조. 신규 테이블도 동일 패턴 적용.

## 사람 필드 표준 패턴

> 작성자·수정자·계획승인자·완료승인자 관련 작업 시 아래 순서를 그대로 따른다.

### 1. DB 컬럼 (Flyway migration 필수)
| 역할 | 컬럼 4개 세트 |
|------|--------------|
| 작성자 | `created_by_user_id BIGINT`, `created_by_name NVARCHAR(100)`, `created_by_team NVARCHAR(100)`, `created_by_position NVARCHAR(50)` |
| 수정자 | `modified_by_user_id`, `modified_by_name`, `modified_by_team`, `modified_by_position` (동일 타입) |
| 계획승인자 | `plan_approver_user_id`, `plan_approver_name`, `plan_approver_team`, `plan_approver_position` |
| 완료승인자 | `completion_approver_user_id`, `completion_approver_name`, `completion_approver_team`, `completion_approver_position` |

### 2. Java Model
```java
private Long createdByUserId;
private String createdByName;
private String createdByTeam;
private String createdByPosition;
// 수정자·승인자도 동일 4개 세트
```

### 3. MyBatis Mapper XML
- **resultMap**: `created_by_team → createdByTeam`, `created_by_position → createdByPosition` 매핑 추가
- **INSERT**: 컬럼/VALUES에 `created_by_team`, `created_by_position` 추가
- **UPDATE SET**: `modified_by_team = #{modifiedByTeam}`, `modified_by_position = #{modifiedByPosition}` 추가
- **SELECT**: `SELECT t.*` 만 사용 — `liveUserJoins` / `liveDisplayCols` 절대 금지

### 4. Controller / Service — IdmUser 매핑
```java
// IdmUser 메서드 → 필드 매핑
u.getUidNumber()  → createdByUserId   (Long)
u.getUserName()   → createdByName
u.getGroupName()  → createdByTeam     (T_IDM_GROUP.GroupName)
u.getTitleName()  → createdByPosition (T_IDM_HRCODE.Name where Separator='TITLE')
```
- **CREATE**: createdBy 4개 + modifiedBy 4개 모두 현재 로그인 사용자로 설정
- **UPDATE**: modifiedBy 4개만 현재 로그인 사용자로 갱신
- 승인자는 프론트에서 선택한 값을 그대로 저장 (컨트롤러에서 덮어쓰지 않음)

### 5. 프론트엔드 표시
```ts
// frontend/src/utils/personFormat.ts
fmtPerson(name, team, position)  // → "팀명 / 성명 직위"
```
- 모든 폼 상세/등록/수정 화면에서 작성자·수정자·승인자 표시 시 `fmtPerson` 사용

### 6. 작업 체크리스트 (신규 테이블 추가 시)
- [ ] Flyway `V{n}__` migration — ALTER TABLE ADD 4개 컬럼 (IF COL_LENGTH 조건부)
- [ ] Java Model — 4개 필드 추가
- [ ] Mapper XML — resultMap / INSERT / UPDATE 수정, SELECT에서 liveJoin 제거
- [ ] Controller 또는 Service — IdmUser에서 team/position 설정
- [ ] 프론트 폼 — fmtPerson 적용 확인

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
| `컴포인__예스코_SHE_시스템_구축_제안서.pdf` | 원본 기획서 — 전체 기능 요구사항 |
