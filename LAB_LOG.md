# LAB_LOG

lab 환경 실험/정리 기록.

- 2026-06-20 [제거] LegalCompliancePage.tsx → 참조 0건 확인, 빌드 영향 없음. 사장 코드 확정.
- 2026-06-20 [제거] Coming Soon 메뉴 /contractor-safety, /outsourcing-mgmt → 미구현 placeholder, 라우트(App.tsx)·i18n(ko/en/zh) 제거, 빌드 영향 없음. (사이드바 미등록·menu_rule 0행·button_rule 0건이라 메뉴/권한키 흔적 없음, 깨진 링크 없음)
- 2026-06-20 [제거·풀스택] air-emission(대기배출) → 프론트+백엔드+DB(tb_air_emission*) 제거. 근거: 환경 저우선순위+메뉴미연결+EnvMonitoring 중복. 되살리려면 git revert(코드)+테이블 재생성. 본 레포 반영은 예스코 환경범위 확정 후. (가드: EnvMonitoring·수질 무손상 확인. 공유 화면 SafetyRulesTab이 쓰던 safetyRules.airEmissionManagement i18n 키는 오삭제 후 복구. tsc 9→9 신규0, compileJava OK, 원본 SmartEHS_com4in 미변경)
- 2026-06-20 [제거] 고아 라우트 /workplace-drawings(편집, 메뉴미연결) → 제거. system-manage/drawings(편집)·view(조회)는 역할 분리로 보존. 컴포넌트 공유라 파일은 유지. (tsc 9→9 신규0, import·두 라우트 정상)
