# LAB_LOG

lab 환경 실험/정리 기록.

- 2026-06-20 [제거] LegalCompliancePage.tsx → 참조 0건 확인, 빌드 영향 없음. 사장 코드 확정.
- 2026-06-20 [제거] Coming Soon 메뉴 /contractor-safety, /outsourcing-mgmt → 미구현 placeholder, 라우트(App.tsx)·i18n(ko/en/zh) 제거, 빌드 영향 없음. (사이드바 미등록·menu_rule 0행·button_rule 0건이라 메뉴/권한키 흔적 없음, 깨진 링크 없음)
- 2026-06-20 [제거·풀스택] air-emission(대기배출) → 프론트+백엔드+DB(tb_air_emission*) 제거. 근거: 환경 저우선순위+메뉴미연결+EnvMonitoring 중복. 되살리려면 git revert(코드)+테이블 재생성. 본 레포 반영은 예스코 환경범위 확정 후. (가드: EnvMonitoring·수질 무손상 확인. 공유 화면 SafetyRulesTab이 쓰던 safetyRules.airEmissionManagement i18n 키는 오삭제 후 복구. tsc 9→9 신규0, compileJava OK, 원본 SmartEHS_com4in 미변경)
- 2026-06-20 [제거] 고아 라우트 /workplace-drawings(편집, 메뉴미연결) → 제거. system-manage/drawings(편집)·view(조회)는 역할 분리로 보존. 컴포넌트 공유라 파일은 유지. (tsc 9→9 신규0, import·두 라우트 정상)
- 2026-06-20 [제거] 고아 OshCommitteePage.tsx + 미사용 nav.oshCommittee 키 → 참조 0건 확정. (ehs.oshCommittee 키는 OshCommitteeTab가 사용 중이라 보존 — 동명 혼동 주의. tsc 9→9 신규0, JSON 유효)
- 2026-06-20 [보류] /partner-osh-committee ↔ EHS협의체 탭: 같은 컴포넌트(OshCommitteeTab)·테이블(tb_osh_committee_list, 구분컬럼 없음)로 동일 데이터 이중 노출. 산안법상 산업안전보건위원회(내부) vs 안전보건협의체(도급)는 별개 제도. 예스코가 둘을 구분 관리하는지 확인 후 통합 or committee_type 신설 결정. 현 상태(라벨만 분리)는 오류.
- 2026-06-20 [보존] 위험성평가 내부(/risk-assessment) vs 협력사(/contractor): 조사 결과 컴포넌트·테이블·백엔드 전 계층 별개 도메인. 내부=KOSHA식 점수평가(tb_risk_assessment), 협력사=작업안전계획/체크리스트(tb_contractor_plan). V83 마이그레이션이 외주 분리를 명시 → 의도된 설계. 통합 불가·불필요, 현행 유지.
- 2026-06-20 [메모] 협력사 메뉴 라벨 '협력사 위험성평가'이나 실제는 가능성×중대성 평가 아닌 작업안전계획/체크리스트. 네이밍 혼동 소지 — 메뉴 재편/예스코 협의 시 라벨 검토 후보(기능결함 아님).
- 2026-06-20 [조사] 사고/재해/아차 전수 — '3개'인 줄 알았으나 실제 5개 모듈. ①사고대응(tb_incident_response,16) ②아차사고+③사고(tb_near_miss_list 한 테이블, incident_type로 구분, 17/5) ④재해발생레포트(tb_accident_report,0행) ⑤보건안전재해발생정보(tb_safety_accident_form/_item,1폼/17행). 컨트롤러·서비스 전부 전용, 공유 0.
- 2026-06-20 [통합후보] ④재해발생레포트(AccidentReportTab/tb_accident_report) ↔ ⑤보건안전재해발생정보: 같은 재해 통계 조사서 중복 구현. ④는 0행·헤더없는 flat표·NearMiss '레포트'탭에만 노출 → ⑤(실데이터+헤더+엑셀업로드)의 미완성/이전버전 추정. 처리: ④ 제거 후 레포트 탭을 (A)탭 제거 or (B)⑤·near_miss 실데이터 기반으로 교체. 처리 전 0행·탭 의존성 정밀조사 필요.
- 2026-06-20 [발견-구조] 사고/재해 6개 테이블 전체 FK 0개(DB실측). 개별사건(near_miss)→집계(accident/safety)로 자동반영 없이 수기 재입력. 도메인 간 연결·전환 코드 전무 = '끊긴 분산' 확정. 진단의 '척추 없음/공통 CAPA 부재'의 실증.
- 2026-06-20 [발견-CAPA] 원인분석·재발방지 추적이 화면마다 불균형: 아차사고/사고=구조화 추적 있음(tb_near_miss_action_list 재발방지대책·담당자·완료일,17). 사고대응=단일 텍스트(actionTaken)만. 집계2종=없음. → 비상상황(화재·폭발) 다루는 '사고대응'에 구조화 원인분석/재발방지 부재. 중대재해처벌법 대응상 핵심 공백 — 예스코 개선안 1순위 소재.
- 2026-06-20 [보존] 아차사고 vs 사고: 이미 같은 테이블·페이지 탭으로 통합됨(incident_type 구분). 중복 아님, 현행 유지.
- 2026-06-20 [메모] 사고대응 vs 아차사고: 별개 종류(비상대응 vs 개별재해)나 NearMiss 폼에 비상대응 필드(emergencyType/responseStatus/severity) 내장돼 개념 경계 흐릿. 예스코와 '비상대응↔인명사고' 역할분담 정의 권장(통합 아님, 경계 정리).
- 2026-06-20 [제거·풀스택] ④재해발생레포트(AccidentReportTab+tb_accident_report+SchemaInitializer) → (A)탭 제거. 0행·⑤가 전필드 커버로 손실0. NearMissPage 'REPORT'탭 제거, 나머지3탭·⑤ 보존. 재기동 후 테이블 미부활 확인. (동반제거: V86__accident_report.sql 마이그레이션, 사장 i18n accidentReport 네임스페이스+nearMiss.incidentTypes.report 키 en/zh/ko. 가드 DISASTER_TYPE 코드그룹·tb_near_miss_*·tb_safety_accident_* 무손상. tsc 9→9 신규0, compileJava exit0, near_miss 22행·⑤ 1폼 보존 확인.)
- 2026-06-20 [개선후보] NearMiss '레포트' 탭 자리: 향후 near_miss 실데이터 기반 집계로 교체 가능((B)안). ④제거와 분리한 별도 개선 과제 — '개별→집계 자동반영 부재' 해소와 연계.
- 2026-06-20 [제거·풀스택] contractor-eval(협력사 위험성평가 점수표) → V91로 단순 체크리스트(tb_checklist_template)에 대체된 옛 구현. UI소비처0·시드더미(원본동일196행)·위험성평가 참조0. 공유파일(contractorApi/types)에서 eval만 외과 제거, contractorPlanApi 보존. 재기동 미부활 확인. (삭제: 백엔드 Controller·Mapper.java+xml·Model2 + DROP tb_contractor_eval_item/template(196/8행, 내부FK item→tpl 1개라 item 먼저 DROP). 수정: contractorApi.ts(eval export만)·contractor.types.ts(Eval타입2만)·i18n en/zh contractorEval 네임스페이스. db/ 마이그레이션·SchemaInitializer 없음. 가드 tb_checklist_template(95)·contractor_plan(10)·partner_eval(17)·contractor_registration(22) 무손상. tsc 9→9 신규0, compileJava exit0.)
- 2026-06-20 [메모] 예스코가 '점수형(가능성×중대성) 협력사 위험성평가'를 원하면 contractor-eval이 그 휴면 구현체였음. 단 점수 매트릭스는 내부 위험성평가(KOSHA식, tb_risk_assessment)에 이미 존재. 협의 시 참고.
- 2026-06-20 [제거·풀스택] tb_emergency_response 사장 백엔드(Controller/Service/Mapper/Model/DTO 7파일+테이블8행) → #8 사고대응(tb_incident_response)으로 대체된 옛 비상 사후기록. 호출처0·시드더미·프론트무변경. V5 마이그레이션·EMERGENCY_TYPE/STATUS 코드그룹(공유테이블)은 미사용이나 보존. #5(plan/drill/resource)·#8 무손상. (DROP yescoSHE_lab만 FK0, 재기동 미부활 확인. compileJava exit0, tsc 9→9. 가드 emergency_plan17/drill17/resource6/contact16·incident_response16·코드그룹2 무손상.)
- 2026-06-20 [발견-CAPA 보강] 사장된 emergency_response엔 lessons_learned(교훈) 컬럼 존재. 활성 #8 사고대응엔 CAPA 추적 없음 → 단순화하며 재발방지 기능이 누락된 정황. 개선 시 lessons_learned가 복원 설계 힌트.
- 2026-06-20 [재적용·lab2] LegalCompliancePage 제거 — yescoSHE 정본에서도 참조0 재확인, FlowChart 무관.
- 2026-06-20 [재적용·lab2] Coming Soon(/contractor-safety,/outsourcing-mgmt) 제거 — 정본 재확인, FlowChart 무관.
