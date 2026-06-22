# ADR-001: 사용자 테이블 단일화 — T_IDM_USER 유지, tb_user 전환 폐기

## Status
Accepted (2026-06-22)

## Context
시스템 초기 설계 단계에서 사용자/부서 정보를 SHE 자체 테이블(tb_user, tb_dept)로
전환하는 방안이 검토되었다. 그러나 인증·사용자관리·부서트리·SAP HR 동기화가 모두
실제로는 IDM 테이블(T_IDM_USER, T_IDM_GROUP)을 사용하고 있었고, tb_user/tb_dept는
실사용되지 않는 상태였다.

성격이 동일한 사용자 테이블을 두 벌(IDM 계열 + tb_user 계열) 유지할 실익이 없으며,
오히려 두 테이블 간 동기화 부담과 "어느 것이 정본인가"의 혼란만 발생한다.

## Decision
사용자/부서의 정본 테이블은 **T_IDM_USER / T_IDM_GROUP** 로 단일화한다.
tb_user / tb_dept 로의 전환 계획은 **폐기**한다.

- 인증(로그인/토큰갱신/현재사용자/대리접속)은 IdmMapper.findByUid → T_IDM_USER 를 사용한다.
- 사용자관리 API 및 부서 트리는 IDM 계열 테이블을 사용한다.
- SAP HR 동기화는 T_IDM_USER 에 직접 upsert 한다 (IDM 부재 시 SHE가 소유자).
- IdmMapper / IdmUser / IdmService 는 라이브 인증 핵심 코드로 유지한다.

## Consequences
**긍정적**
- 사용자 정본이 하나로 명확. 테이블 간 동기화 부담 제거.
- 인증 경로가 단일 테이블로 일원화되어 추적·디버깅 단순화.

**유의**
- tb_user / tb_dept 는 잔재이며 사용하지 않는다. (단 tb_user_access_list 는
  별개의 활성 테이블로, 레거시 사용자 테이블이 아니다 — 혼동 금지.)
- IdmMapper/IdmUser/IdmService 를 "삭제 가능 잔재"로 기술한 과거 문서
  (SYSTEM_ANALYSIS.md 등)는 본 결정과 정반대이므로 현행화 시 정정한다.

## References
- HrSyncMapper.java 주석: "SHE가 소유자이므로 직접 쓰기 허용. tb_user/tb_dept 전환은 폐기됨"
- 코드 사실확인: CustomUserDetailsService / AuthService / UserMapper.xml 전부 T_IDM_USER 사용 (2026-06-22)
