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
- 2026-06-20 [재적용·lab2] 고아 도면 라우트 /workplace-drawings 제거 — 정본 재확인, view·편집 진입점 보존, FlowChart 무관(페이지 유지·라우트만 제거).
- 2026-06-20 [재적용·lab2] 고아 OshCommitteePage + 미사용 nav.oshCommittee 제거 — 정본 재확인, ehs.oshCommittee(실사용) 보존, FlowChart 무관. /partner-osh-committee 통합은 보류 유지.
- 2026-06-20 [재적용·lab2] ④재해레포트 풀스택 제거(+SchemaInitializer+V86+사장i18n) — 정본 재확인, NearMiss 레포트탭만 제거 나머지3탭·⑤ 보존, 재기동 미부활 확인, FlowChart 무관(NearMiss 생존).
- 2026-06-20 [재적용·lab2] tb_emergency_response 사장 백엔드 풀스택 제거(7파일+DROP) — 정본 재확인(#8 tb_incident_response로 대체된 옛 비상 사후기록, 호출처 0·FK없음·시드더미 8행 정본일치). V5 마이그레이션·EMERGENCY_TYPE/STATUS 코드그룹(공유테이블) 보존, #5 plan/drill/resource/contact·#8 무손상·EmergencyResponsePage 정상, 재기동 미부활 확인, FlowChart 무관(백엔드 참조 6자기파일뿐).
- 2026-06-20 [재적용·lab2] contractor-eval(협력사 위험성평가 점수표) 풀스택 제거 — 정본 재확인(V91 체크리스트로 대체된 옛 점수형 협력사 RA, UI 소비처 0·시드더미 template8/item196 정본일치·내부FK item→template만). 공유파일(contractorApi.ts·contractor.types.ts)에서 eval만 외과제거(contractorEvalApi·ContractorEval타입 삭제, contractorPlanApi·ContractorPlan/Worker 보존), en/zh.json contractorEval 네임스페이스 제거. 위험성평가 화면(ContractorManagementPage) 무손상·정상컴파일, db/ 마이그레이션(V67~V122·V91 포함) 보존, 재기동 미부활 확인, FlowChart 무관(UI없는 사장·flow테이블 무참조).
- 2026-06-20 [메모] 예스코가 점수형 협력사 위험성평가를 원하면 contractor-eval이 휴면 구현체(점수매트릭스 frequency·severity·risk 보유). 점수매트릭스 자체는 내부 RA(위험성평가)에 이미 존재.
- 2026-06-20 [재적용·lab2] air-emission 풀스택 제거(프론트5+백엔드14+DB 2테이블) — 정본 재확인(백엔드14 self-contained 외부참조0, 시드더미 air30/std8 정본일치·FK0). 정본 FlowChart 엮임=flowSpecs line88 정적항목 1줄(단방향·cosmetic) 동반 제거, FlowChartButton/WorkflowFlowChart 무손상(flowSpecs 나머지 50개 spec 정상). 공유파일(App.tsx·environmentApi·environment.types) air만 외과제거 Water/EnvMonitoring 보존, i18n airEmission네임스페이스+nav.envAirEmission+environment.searchAirEmission 제거. ★safetyRules.airEmissionManagement(별 네임스페이스·SafetyRulesTab) 보존, EnvMonitoring·Water 분리 무손상, 재기동 미부활(SchemaInitializer 없음), db/ 마이그레이션 보존. 옛 lab d40e9a6 + 정본 FlowChart 1줄.
- 2026-06-20 [제거·lab2] 환경 완전독립 5기능(envMonitoring/carbon/radiation/fireSafety/permit-lifecycle) 풀스택 제거 — 시드더미·외부참조0·FK0·SchemaInitializer無. 프론트 40파일(5페이지+25탭+5api+5타입)+백엔드 117파일(88java+29xml)+DB 29테이블 DROP(lab2만). 공유 외과수정: App.tsx(import5+route5)·Sidebar(nav5+미사용아이콘4)·flowSpecs(5키)·MenuManageTab·YescoSidebarIcons(map3)·buttonManageData(radiation+permit-lc 5엔트리)·i18n nav키5(ko/en/zh). ★permit-to-work(안전: tb_permit_to_work/worker·ptw/permit i18n)·ChemicalInventoryTab(화학)·legal-facility·LegalPermit 보존 확인. 재기동 정상기동(삭제코드 무참조)·29테이블 미부활, 프론트/백엔드 HTTP200. 정본 보존 복구가능.
- 2026-06-20 [메모] 위 제거에서 i18n 콘텐츠 네임스페이스(carbon/envMon/fs/rm/permit-lc)는 무해 고아키로 잔존 — ★'permit'='작업허가(permit-to-work/안전)'·'ptw'와 인접해 블록제거 위험, 무해(컴파일/런타임 무영향)해 보류. 추후 정리 가능. nav 라벨키5만 제거함.
- 2026-06-20 [제거·lab2] 환경 외과 3기능(waste/water/legal-facility) 풀스택 제거 — ★환경 그룹 제거 완료(완전독립5+외과3=8기능 전부). 시드더미·외부참조0·SchemaInitializer無. 프론트 21파일(3페이지+10탭+4탭+legalFacility api/types)+백엔드 66파일+DB 11테이블 DROP(lab2만, FK 1개 sampling_point→workplace 순). ★공유 environmentApi.ts/environment.types.ts는 waste/water만 남아 통째 삭제(ChemicalInventoryTab은 chemicalApi 사용 → 무영향 확인). nav.envManage 그룹 전체 제거(Sidebar/MenuManageTab/YescoSidebarIcons map/NatureIcon·DeleteIcon·WaterDropIcon import). flowSpecs 3키(waste/waterQuality/legalFacility). i18n nav키4(envManage/envWaste/envAirWater/legalFacility) 개별제거 — ★envWaste가 safetyManage/permitToWork와 인접해 블록제거 금지·개별키로 안전제거(water 네임스페이스도 approval/ppe 사이 standalone 확인). ★LegalPermit/tb_legal_permit·permit-to-work·ChemicalInventoryTab·화학·안전·보건 보존 확인. 재기동 정상·11테이블 미부활, HTTP200. 정본 보존 복구가능.
- 2026-06-20 [메모] 환경 i18n 콘텐츠 네임스페이스(waste/water/lf + 이전 carbon/envMon/fs/rm/environment)는 무해 고아키로 잔존 — nav 라벨키만 제거(이전 5기능 커밋과 동일 방침, permit/ptw 인접 위험 회피). 추후 일괄 정리 가능.
- 2026-06-20 [제거·lab2] PSM(공정안전) 풀스택 제거(34파일: 백엔드22+프론트12, +7테이블) — 예스코 미사용 확정. 완전독립·FK0·외부참조0(Approval 등 무관)·시드더미. 프론트 /psm 라우트+PsmManagementPage 9탭+psmApi/types, 백엔드 controller/service/6mapper/7model+PsmTablesInitializer. ★공유 외과: PersonRefColumnsInitializer/AllTablesPersonColumnsInitializer에서 tb_psm_*(moc/data/hazop/incident/ptw/wo) 테이블명만 제거(tb_emergency_plan·process_activity_form·safety_accident/hazard 등 보존), flowSpecs psm키, i18n nav.processSafetyMgmt(ko/en/zh). ★ButtonRuleAdminRolesInitializer 'PSM'변수=협력업체 문자열(별도메인) 미접촉, V216 DDL inert(flyway disabled) 미접촉. ★안전도메인 무손상: tb_permit_to_work≠tb_psm_ptw·tb_risk_assessment·tb_safety_accident_form·tb_process_activity_form 전부 present. 재기동 7테이블 0/7 미부활, HTTP200. 정본 보존 복구가능.
- 2026-06-20 [메모] PSM i18n 콘텐츠 네임스페이스('psm')는 무해 고아키로 잔존 — nav키만 제거(환경 커밋들과 동일 방침). 추후 일괄 정리 가능.
- 2026-06-20 [제거·lab2] MSDS/화학물질 풀스택 제거(141파일: 백엔드97+프론트28+공유외과, +DB16테이블) — 예스코 미사용 확정. ★ApprovalService 화학 4-spot 외과(import ChemicalMapper·필드·CHEMICAL분기·syncChemicalStatus 제거) → PERMIT_TO_WORK·TRAINING 분기·approvalMapper CRUD·syncPermit/Training 무손상, compileJava 통과·재기동 후 /api/approvals 서빙(결재 정상). ChemicalInventoryTab(환경폴더 화학소속)+ChemicalListTab(re-export) 동반삭제 → components/environment 폴더 소멸. DB 인바운드FK0·시드더미, 16테이블 DROP 재기동 미부활. ★보존확인: WEM tb_wem_factor.msds_linked(자체 boolean)·SafetyHazard chemicalName(자유텍스트)·작업허가·위험성평가·보건·교육 무손상. nav 7키 제거, 콘텐츠 chem 네임스페이스 고아보류. 정본 보존 복구가능.
- 2026-06-20 [완료] ★숨김 3그룹(환경관리·공정안전PSM·MSDS화학물질) 풀스택 제거 완료 — lab2. 전부 예스코 미사용·정본 jiwon2ahn 보존 복구가능.
- 2026-06-20 [정리·lab2] 버튼 관리 유령 잔재 철저 정리(나 방식) — 제거된 3그룹의 3레이어 동반 제거: ① buttonManageData.ts 화학 위해성보고 엔트리1(트리원천) ② ButtonRuleAdminRolesInitializer.java 7시드(initWasteAdmin/initAirWaterAdmin/initChemAdmin 메서드+run()호출 + initAbstractRoleRows 일괄섹션 폐기물/방사선/인허가4/화학 블록) ③ tb_button_rule(lab2) 245행 DELETE(폐기물49·방사선35·인허가식별35·대장35·변경21·법정49·화학21). ★Initializer 먼저 고쳐 재시드 차단(SchemaInitializer 패턴) → 재기동 후 2144행 유지·245행 미재시드 확인. ★보존: 협력업체 PSM변수(별도메인)·안전/보건/협력업체/승인 역할시드·나머지2144행(riskAssess336·permitToWork182·partner392·health125)·superAdmin 로직 무손상. 권한결합0·dead 데이터. (buttonManageData GENERAL_ADMIN_ROLE_OPTIONS 죽은역할옵션은 보류)
- 2026-06-20 [제거·lab2] 지도형 대시보드 풀스택 제거(8파일)+착지점 재배선 — 예스코 미사용(실험적, 정본 복구가능). 삭제: pages/Dashboard.tsx + components/dashboard 6개(VWorldMap/FactoryListOverlay/EHSStatusPanel/CCTVAnalysisPanel/MenuBar/FloorPlanOverlay) + types/map.types.ts. ★착지점: App.tsx 인덱스라우트 → <Navigate to='/dashboard/general' replace/>(루프방지: /→/dashboard/general 다른경로). Login/Layout로고/NotFound navigate('/')는 인덱스 경유 자동 종합착지(무변경). Sidebar 로고 firstVisiblePath는 mapDashboard 메뉴 제거 후 자동 /dashboard/general. 메뉴/i18n 외과: Sidebar nav.mapDashboard 자식·MenuManageTab·i18n3 제거(PublicIcon 보존-workplaceDrawingsView 공유). ★보존: WeatherWidget(종합 공유)·dashboardApi(AdminPage+종합 공유)·dashboard.types·백엔드 Dashboard 전체·DB무관. tsc 신규0.
- 2026-06-20 [정리·lab2] 죽은 역할옵션 9개(CHEM5+ENV4) 3파일 동기 제거 + GROUP_COLORS chemical 색상키 + 고아 YescoPsm 아이콘. 조사: T_IDM_USER.UserRole·tb_button_rule.role_key 양쪽 0건 부여 확인(DB 실측). 3파일=buttonManageData.ts(GENERAL_ADMIN_ROLE_OPTIONS)·RoleManageTab.tsx(+// 화학물질관리 주석 동반, env그룹은 COMPLIANCE 잔존이라 // 환경관리 주석 보존)·MenuManageTab.tsx. ★보존: COMPLIANCE_ADMIN(백엔드 initComplianceAdmin이 활성 legal-response 버튼권한 시드, resolveRole 결합)·ERGONOMICS_ADMIN(활성 보건도메인 미배선 슬롯) — 둘 다 활성 도메인이라 제외. i18n role.* 라벨키는 격리 유지(무해 고아). tsc 9→9 신규0.
- 2026-06-20 [보류·lab2] YescoSidebarIcons 나머지 고아 아이콘 6개(YescoEnv/Radiation/Fire/Facility/Permit/Chem) — PSM과 동일 성격(ICON_MAP 미등록·import0, 제거된 환경/화학용). 다음 묶음으로 일괄 정리 후보.
- 2026-06-20 [발견-구조] 7700 UI 상단 골격 비일관 — 제목·탭·액션버튼 위치가 화면별로 상이. PageHeader 표준화 필요. 별도 트랙으로 진행 예정.
- 2026-06-20 [재편·lab2] PageHeader 공통 컴포넌트 신설(common/PageHeader.tsx) + EhsPage 파일럿 적용. 표준 확정: 제목-위(제목→탭) / 제목=메뉴명 고정(nav 키 재사용, 탭 전환에도 불변) / 흐름도 우상단(탭0 조건은 호출부 flowKey 조건부 전달) / 우측정렬 space-between 단일화. props=title(필수)·flowKey?·actions?·tabs?·children. FlowChartButton(기존 공통) 흡수, 신규 디자인토큰 0. EhsPage title=t('nav.ehsCommunication')(사이드바와 동일 소스). 시나리오B(공통셸 신설), 잔여 대상 ~33페이지(저20/중10/고4, 중난도는 App.tsx PageWithTitle 13라우트 이관 동반). 다음: 저난도 그룹부터 도메인 단위 복제. tsc 9→9 신규0.
- 2026-06-20 [재편·lab2] PageHeader 적용 배치1 — 보건관리(HealthCheckup·DiseasePrevention). nav 키 재사용(nav.healthScreening·nav.diseasePreventionMgmt)·flowKey 탭0 보존·PageHeader 무변경(표준 재사용 검증). Tabs mb 중복 마진은 PageHeader 래퍼가 흡수. 저난도 잔여 ~18. tsc 9→9 신규0.

=== 세션 마무리 (2026-06-20 18:42 기준) ===

■ lab2 환경
- 위치: C:\claude\yesco_she_lab2, 브랜치 lab2
- remote: upstream=jiwon2ahn(fetch, push 차단) / origin=horsehihing3/yesco_she_lab(push)
- DB: yescoSHE_lab2 (정본 yescoSHE 복제, 211.171.152.242:51084)
- 포트: 프론트 7700 / 백엔드 7701
- 정본 대비: yescoSHE 정본 기반 + 청소/제거 적용본. 정본 jiwon2ahn에 원본 보존(복구 가능)

■ 이번 세션 완료 작업 (전부 커밋·push, origin/lab2 IN SYNC, HEAD=396333d)
1. lab을 yescoSHE 정본 기반으로 재구축 (이전 lab은 main/com4in 라인이라 폐기)
2. 청소 재적용 8건: LegalCompliance, ComingSoon, 도면 고아라우트, 협의체, ④재해레포트, emergency_response, contractor-eval, air-emission
3. 숨김 3그룹 풀스택 제거: 환경관리(8기능), PSM(공정안전), MSDS/화학물질 — 예스코 미사용, ~44k줄
4. 버튼 관리 유령 잔재 정리 (buttonManageData + Initializer + tb_button_rule 245행, 재시드 차단)
5. 지도형 대시보드 제거 + 착지점 재배선 (인덱스→/dashboard/general)

■ 보류/다음 단계 (TODO)
- i18n 콘텐츠 고아키 정리: 환경/PSM/화학 제거 시 nav키만 지우고 콘텐츠 네임스페이스는 고아로 잔존(무해). 안전키 인접 위험으로 보류 → 추후 일괄 정리 가능
- buttonManageData GENERAL_ADMIN_ROLE_OPTIONS의 죽은 역할옵션(CHEM_*/ENV_* 등) 보류
- (미착수) 재편: 사이드바 메뉴 그룹 정리 + 7700 vs 7600 비교 — 사용자가 원래 가려던 목표
- (미착수) 더 솎기: SHE경영 등 보이는 메뉴 중 예스코 미사용 추가 정리 검토
- (장기) lab 결론을 정본 yescoSHE에 선별 재적용 + 정본에서 필요기능 복구 + 전체 기능테스트 + 예스코/대표 보고(특히 [발견-CAPA])

■ 다음 세션 시작점
- 7700 둘러보며 "더 정리 vs 재편/비교 vs 보고자료" 중 방향 결정
- LAB_LOG의 [재적용]/[제거]/[정리] 태그가 전체 작업 점검표
