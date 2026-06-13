# Yesco 전환 전 정비 체크리스트 (Pre-Yesco Readiness)

> 목적: Yesco 합류(조직도·사용자·팀·직책·메뉴 대거 변경) 전에 **변경에 강한 구조**로 정비하고, 불필요한 것을 줄이고, 개발/테스트 환경을 다진다.
> 원칙: **(A) 지금 — Yesco 결정과 무관하게 가치 있는 것** / **(B) 씨앗만 — Yesco가 정해야 실행 가능한 것**. 미정 사항 전제 삭제·구현은 재작업 위험.

---

## 0. 현재 협업 체제 (2-PC 병렬)
- **LEAD**(메인 PC · Opus): 설계·결정, 백엔드, 죽은 파일 삭제, 구조적 수정.
- **HELPER**(노트북 · Sonnet): 지시 수행 + 검증. git(`coord/*.md`)로만 소통.
- 채널: `coord/LEAD-TO-HELPER.md`(지시) · `coord/HELPER-TO-LEAD.md`(보고). 규칙: pull --rebase, 공유브랜치 force-push 금지, DB 변형/백엔드 재시작은 LEAD만.

---

## 1순위 — 변경에 강한 구조 (seam 격리)
Yesco 변경이 닿는 지점을 좁힌다.

- [ ] **`myRoles` 역할매핑 중복 제거** ⚠ 최우선 seam
  - `const myRoles = ['guest', ...(user.role === 'SYSTEM_ADMIN' ? ['superAdmin'] : [user.role])]` 패턴이 **~25개 컴포넌트에 복붙**돼 있음. Yesco가 역할모델 바꾸면 전 지점 수정.
  - → `utils/auth.ts` 에 `buildButtonRoles(user, item?)` 단일 유틸로 수렴. (HELPER TS6133 작업과 같은 파일이라 **TASK-1 완료 후** 진행)
- [ ] **흩어진 역할별 admin 체크 통일**: `EmrResourceTab`(`|| TEAM_ADMIN`), `QnaTab`(`|| QNA_ADMIN`) 등 → 역할 판단을 데이터/유틸로.
- [ ] **메뉴 add/remove 데이터주도 검증**: `tb_menu_rule`/`MenuManageTab`/`Sidebar` 가 100% 데이터주도인지 확인. 코드에 박힌 메뉴만 레지스트리화.
- [x] **PersonRef 패턴**: 작성자/수정자/승인자 = 이름·팀·직책 스냅샷 JSON → 조직 바뀌어도 과거 데이터 보존(설계 양호). 남은 테이블 convert-on-touch 로 확장 중.

## 2순위 — 환경/설정 외부화 (Yesco 환경전환 직결)
- [x] **DB 접속 외부화**: `MSSQL_URL/USERNAME/PASSWORD` (현재값 기본). `application.yml`.
- [x] **CORS 오리진 외부화**: `app.cors.allowed-origins` / `APP_CORS_ALLOWED_ORIGINS`. SecurityConfig 하드코딩 제거.
- [x] **JWT 시크릿**: `${JWT_SECRET:...}` 외부화 + 기본(취약)값 사용 시 **기동 경고** 추가.
- [ ] **로컬 개발 프로필 + 시드데이터**: 현재 원격 공유 DB(211.171…) 의존 → Yesco 가면 끊김. 로컬 DB(Docker MSSQL) + 초기화 시드로 "원격 없이 개발/테스트" 가능하게. (B/씨앗)

## 3순위 — 표준화 마무리
- [~] **프론트 `tsc` baseline 축소**(진짜 안전망화): **364 → 313** 진행 중.
  - [x] `import.meta.env` 타입(vite-env.d.ts) −12
  - [x] `NumberField` value prop string 허용 −39
  - [ ] 미사용(TS6133) 제거 — **HELPER TASK-1 진행 중**
  - [ ] 구조적 잔여(`createdByUserId` 헬퍼 타입 등) — HELPER TASK-2 예정
- [ ] **승인(결재) ApprovalGateway seam**: Yesco 결재시스템 연동의 핵심 지점. 내부 transition 은 두고 외부연동만 단일 추상화. 상세 `docs/APPROVAL_STANDARD.md §5/§6`.
- [ ] Response DTO / 예외 표준 convert-on-touch 지속.

## 4순위 — 불필요한 것 정리 (신중)
- [~] **죽은 파일 ~43개** 감사 완료 → `coord/DEAD_FILES_PENDING.md`. **삭제 범위 사용자 결정 대기**.
  - ⚠ 메뉴/기능 삭제는 Yesco 미정 → "확실히 죽은 중복본"만, 완성 기능 페이지는 보존(재연결 가능성).
- [ ] **DEV 도구 플래그 통합**: 계정전환(impersonation)·테스트데이터 버튼의 "납품 전 삭제" 주석 흩어짐 → 단일 env 플래그 on/off 로 통합(삭제 말고 보존).

## 5순위 — 보안 (납품 전 필수)
- [ ] **백엔드 API 권한제어 전무**(JWT만 있으면 아무 API) → 역할 기반 가드 착수. (큰 작업 — 설계 후)
- [x] 슈퍼관리자 계정전환 endpoint = SYSTEM_ADMIN 서버검증 완료.
- [ ] `isAdmin` 하드코딩 화면(RiskAssessmentTab·OfficeWorkTab·OshCommitteeTab·SafetyWorkPage) 정리 — CLAUDE.md 기재.
- [x] JWT 기본시크릿 기동경고.

---

## 진행 로그
- 2026-06-14: 2-PC 협업 가동. env 외부화(DB·CORS·JWT경고). tsc 364→313. 죽은파일 감사(~43). 협력업체 작업허가 isExternal 버그 fix.

## 열린 결정 (사용자)
1. **죽은 파일 삭제 범위**: 명백한 중복본만 / 전부 / 보류.
2. **로컬 개발 DB 전략**: Docker MSSQL 시드 구축할지.
