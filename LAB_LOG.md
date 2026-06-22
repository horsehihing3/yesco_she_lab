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
- 2026-06-20 [재편·lab2] PageHeader 적용 배치2 — SHE경영 저난도+변형(Training·Approval·PpeEquipment·PlanKpiGoal). 변형 흡수 검증: 흐름도無→우측영역 미렌더(가드 actions||flowKey), 9탭 scrollable 무손상. nav 키 재사용(trainingMgmt/approval/ppeEquipment/planKpiGoal)·신규키0. PageHeader 무변경. 누적 적용 7페이지, 저난도 잔여 ~14. tsc 9→9 신규0.
- 2026-06-20 [재편·lab2] PageHeader 적용 배치3 — 위험성평가(안전관리 저난도 단건). title=nav.riskAssessment 고정·미사용 tabTitles 동반제거·조건부블록5 children 주입·PageHeader 무변경. 누적 8페이지. 안전관리 잔여 저난도 0(SafetyAccident·ProcessActivity·NearMiss는 viewMode 다중return 고난도로 분리). 협력업체 저난도 후보=PartnerMgmt 1건(배치4, 제목없음→신규추가 변형). 중난도=PartnerSafetyMgmt·PartnerPermit·ContractorRegistration(App.tsx PageWithTitle 래핑, 이관 동반 필요). tsc 9→9 신규0.
- 2026-06-20 [조사/보류·lab2] PartnerMgmt PageHeader 적용 시도 → 폐기. 사유: 자식 PartnerEvalTab이 mode 토글(list↔폼) 구조로 폼 뷰에서 자체 제목("협력업체 평가 상세/등록/수정") 렌더 → PageHeader 메뉴명 제목과 2줄 군더더기. "제목 없는 저난도"가 아니라 "모드토글 보유" → 고난도 트랙으로 재분류. 적용 되돌림(7b79c35 유지).
- 2026-06-20 [재편·lab2] PageHeader 중난도 이관 파일럿 — PartnerSafetyMgmt. 신메커니즘(App.tsx PageWithTitle 래퍼 제거 + PageHeader 적용) 검증 성공. PageHeader에 fill prop 추가(default false, 기존 8페이지 무영향=출력 동일). fill 판정=미전달(SiteSafetyPlanContent가 site-safety-mgmt에서 이미 fill없이 정상). App.tsx 최초 수정(래퍼 1줄, 나머지 12라우트·PageWithTitle 정의 무변경). 제목 단일표시. 누적 적용 9페이지. 중난도 잔여 순수이관 2(LegalResponse·WorkplaceDrawingsView), 설정6 제외 확정, 고난도 이송4(IncidentResponse·ContractorRegistration·PartnerOshCommittee·PartnerPermit). tsc 9→9 신규0.
- 2026-06-20 [재편·lab2] PageHeader 중난도 이관 — WorkplaceDrawingsView(사업장 도면 조회). 제목 일원화 완료, fill 미전달(루트 auto-Box로 PageWithTitle fill이 원래 inert). 누적 적용 10페이지, 중난도 순수이관 잔여 1(LegalResponse).
- 2026-06-20 [보류·lab2] WorkplaceDrawingsView 흐름도가 자식 공유컴포넌트(WorkplaceDrawingsPage, 설정 /system-manage/drawings와 공유) 내부에 위치 → 제목줄 우측 표준과 미세 불일치하나 화면상 근접·설정 영향 위험으로 현행 유지. 흐름도 키/위치 정리 별도 트랙 후보.
- 2026-06-20 [재편·lab2] PageHeader 중난도 이관 — LegalResponse(법규대응). 흐름도를 탭0 콘텐츠 내부→제목줄 우측 이관(KPI 위치 보존), 콘텐츠 잔재 0. tsc 9→8 개선(미사용 t 해소, ★새 베이스라인=8). 누적 적용 11페이지. ★중난도 순수이관 트랙 완료(PartnerSafetyMgmt·WorkplaceDrawingsView·LegalResponse 3건).
- 2026-06-20 [메모·lab2] tsc 베이스라인 9→8로 갱신. 이후 작업 회귀 기준은 "8→8 신규0".
- 2026-06-20 [재편·lab2] KPI목표 흐름도 이관(옵션A) — 자식 PlanOverviewTab toolbar의 흐름도를 PageHeader flowKey로 이관(tab0 보존). 연도셀렉터는 자식 로컬 state+fetch 의존으로 현행 유지(옵션B 보류). 흐름도 단일표시·tsc 8→8.
- 2026-06-20 [발견·lab2] 검수 결과: 흐름도를 콘텐츠 toolbar 내부에 두는 패턴이 미적용 페이지 전반에 존재. 미적용 저난도 후보(흐름도 콘텐츠 잔류) — 내부감사·비상훈련·작업허가·작업환경측정·안전보건위험정보·체크리스트. PageHeader 적용 시 KPI옵션A 패턴(콘텐츠 흐름도→제목줄 이관) 복제 가능. 단 흐름도가 부모/자식 어디 있는지 적용 전 위치 확인 필요.
- 2026-06-20 [발견-버그·lab2] 사고/아차사고(near-miss): 첫 탭이 대시보드가 아니라 아차사고 — 다른 페이지(첫탭=대시보드)와 탭순서 불일치. PageHeader와 별개 이슈, 고난도 트랙에서 같이 정리 후보.
- 2026-06-21 [수정·lab2] near-miss 탭 fallback 'NEAR_MISS'→'DASHBOARD' — 사이드바 진입 시 대시보드 첫 탭으로 정정. 딥링크(?incidentType=) 무손상(searchParams 우선). 위 [발견-버그] 해소. tsc 8→8.
- 2026-06-21 [재편·lab2] 보호구 흐름도 추가 — flowKey='ppe'(기존 spec) tab0. 흐름도=제목줄 우측 표준 충족. tsc 8→8.
- 2026-06-21 [보류·lab2] ppe 흐름 내용이 '지급' 한정이라 보호구 9탭 전체 대표 못함 → spec 정교화는 별도 도메인 콘텐츠 트랙 후보.
- 2026-06-21 [재편·lab2] PageHeader 고난도 list-only 파일럿 — NearMiss. (가)구조(단일root+형제&&블록) 템플릿 확정: viewMode==='list' 블록만 PageHeader, detail/form은 형제로 무손상. 흐름도 L2133→flowKey(DASHBOARD 전용) 이관·서브헤딩(L2128 중복) 제거. git diff로 renderDetailView/renderFormView 무변경 확인(회귀0). 누적 16페이지. 고난도 메커닉 (가)검증 완료, (나)early-return 구조는 별도 검증 필요. tsc 8→8.
- 2026-06-21 [발견·lab2] NearMiss detail 뷰(renderDetailView) 자체 이중제목 — L878 h6+상태칩 / L883 subtitle1, 같은 키(nearMissInfoByType) 2회 출력(원개발자 구조). 파일럿과 무관, detail 정리 트랙 후보(L883 섹션헤딩 제거 등).
- 2026-06-21 [재편·lab2] PageHeader 적용 미적용 저난도 배치 — 내부감사·비상훈련·작업환경측정·체크리스트. 흐름도 전부 부모직접(자식 무수정, KPI 패턴 아님), EhsPage 표준 치환. Checklist 이중제목 점검 통과(자식 SafetyChecklistWrapper 자체 제목 없음). PageHeader 무변경. ★저난도 트랙 진짜 완료, 누적 적용 15페이지. 남은 트랙: 고난도(viewMode 11 + near-miss 탭버그), 설정6 제외.
- 2026-06-21 [재편·lab2] 고난도 (나)early-return 파일럿 — SafetyAccidentInfoPage. 3-return 각각 PageHeader 독립주입(단일root 주입 불가 확정). flowKey는 list만, 로딩가드·detail은 title만. 결정a=로딩가드도 PageHeader wrap(제목 깜빡임 차단), 결정b=하드코딩 제목→t(nav키) 치환. 중복제목 2곳 중앙화. 회귀0(tsc 8→8). ★(나) 템플릿 확정본 — 나머지 6개 복제 기준.
- 2026-06-21 [발견·lab2] (나)구조 = list/로딩가드/공용 3-return 동형. ProcessActivity 복제 시 델타는 L502-504 중간 const(return 사이 statement, JSX 밖 → wrap 무관)·제목 이미 t() 뿐.
- 2026-06-21 [재편·lab2] (나)복제 2호 — ProcessActivityWorkPage. SafetyAccident 템플릿 그대로 3-return wrap. flowKey="processActivity"는 목록만, 로딩가드·상세는 제목만. 제목 이미 t()라 치환 없음. L498-500 중간 const 무손상. 7700 눈검수 OK(목록·상세·폼 3표면). 회귀0(tsc 8→8). (나) 잔여 5개.
- 2026-06-21 [발견·lab2] (나) 트랙 실측 정정 — 핸드오프가 "(나) early-return 다중"으로 묶은 5개를 App.tsx·return구조 실측한 결과 진짜 (나)순수 0개. (나)는 SafetyAccident·ProcessActivity 2건으로 소진.
  · 래퍼형 2 (ContractorRegistration·IncidentResponse): App.tsx PageWithTitle 래퍼 보유 → 제목 페이지 밖 렌더. 중난도 이관(래퍼제거+PageHeader) 트랙, PartnerSafetyMgmt 선례. ContractorReg는 위저드(Stepper), IncidentResponse는 분리뷰 곁들임.
  · 탭셸 3 (SiteSafetyManagement·PermitToWork·ContractorManagement): 페이지 셸이 Tabs, flowchart가 tab0. (나)보다 NearMiss (가) 탭셸 패턴에 근접하나 외부모드·mode동적 등 추가분기 보유.
  → 다음: "(나) 복제" 불가. 중난도 2 / 탭셸 3 별개 트랙으로 진행.
- 2026-06-21 [발견·lab2] IncidentResponse(사고대응관리) PageHeader 작업 제외 — 현재 사이드바 숨김 상태이며 제거 대상으로 확인됨(사용자 확인, 2026-06-21). 중난도 이관+(나)3-return 하이브리드로 조사까지 완료했으나 적용 보류. 제거 트랙에서 통째 처리 예정. ★App.tsx 래퍼(L137)·페이지 미변경 — 적용 안 함.
  · PageHeader 잔여 대상 재확정: 중난도 래퍼형 1 (ContractorRegistration, 위저드) + 탭셸 3 (SiteSafetyManagement·PermitToWork·ContractorManagement). IncidentResponse 제외로 잔여 4.
- 2026-06-21 [재편·lab2] 탭셸형(다) 패턴 확정 — SiteSafetyManagement 파일럿 적용. 성립조건=페이지가 탭셸(자식이 viewMode 소유, 셸은 activeTab만). 적용법=셸 return을 PageHeader로 래핑(title=nav키 고정)·기존 Tabs를 tabs prop으로 이관·flowKey=activeTab0 조건부(기존 tab0 우측 FlowChartButton Box 제거). ★자식(SiteSafetyPlanContent) viewMode·mode분기 무수정 — 셸만 손댐. 자식 처리 규칙: list 제목 없으면 무손상 / 있으면 이중제목 조정 필요 / 자식 공유 시 회귀 검증. SiteSafety=list 제목 부재 → 이중제목 충돌 0(무손상 케이스). detail/form 자식 제목은 (가)와 동일 레코드 제목으로 허용. FlowChartButton import→PageHeader import 교체(미사용화 방지). 회귀0(tsc 8→8, 이 파일 신규0). 탭셸 잔여 2(PermitToWork·ContractorManagement, 둘 다 자식 list 제목 보유+TS2339 2건 보유, Permit은 자식 PartnerPermitPage 공유 주의).
- 2026-06-21 [parked-제목·lab2] SiteSafety 자식 제목 정리 2건 — PageHeader 탭셸(다) 작업과 별개, 자식 SiteSafetyPlanContent 내부 이슈. ① 상세(detail) 서브제목이 탭 불문 "현장 안전 계획 상세"로 동일 출력 → 레코드 제목(예: 항목명)이 아니라 화면 종류 라벨이라 정보량 0, 레코드명 교체 검토 대상. ② 목록(list) 서브제목이 레포트 탭만 존재("레포트"), 나머지 탭은 없음 → 탭 간 불일치. ★둘 다 회귀 아님(셸 무관, 자식 내부), (다) 패턴 검증 영향 없음. SiteSafety 탭셸 PageHeader 파일럿(b8fdce1) 화면 검수 중 발견.
- 2026-06-21 [재편·lab2] 탭셸형(다) 복제 2호 — ContractorManagementPage. SiteSafety 동형 셸 변경(import FlowChartButton→PageHeader, <Box>→<PageHeader> title=nav.partnerRiskAssessment·flowKey=activeTab0?'contractor'·Tabs를 tabs prop 이관 mb:2 제거·tab0 흐름도 Box 제거) + 자식 ContractorPlanContent의 list 제목(L415 tabTitle Typography) 1줄 제거(셸 제목+활성탭과 3중 중복 해소). ★tabTitle 변수정의(L407-409)·detail(L538)·form(L776) 출력은 유지 → TS6133 신규0. ★자식 file-private(외부참조0)이라 회귀 표면 자기파일뿐. 회귀0(tsc 8→8, Contractor 에러는 기존 TS2339 2건만 유지·L846/L1081로 -2줄 시프트, 신규0). 탭셸 잔여 1(PermitToWork — 자식 PartnerPermitPage 공유 주의).
- 2026-06-21 [parked-제목·lab2] Contractor detail/form tabTitle 탭 중복 — 자식 ContractorPlanContent detail(L538)·form(L776)이 tabTitle('계획'/'평가서조회…'/'전체조회…') 출력, 활성 탭 라벨과 동일값 중복(레코드명 아님). SiteSafety parked와 동일 성격(셸 무관·자식 내부). list는 (다) 복제 시 제거했으나 detail/form은 SiteSafety 형태(자식제목 보존)에 맞춰 유지 — 후속 일괄 정리 후보.
- 2026-06-21 [메모·lab2] (다) 적용분: SiteSafetyManagement(list 제목 부재·무손상, b8fdce1) + ContractorManagement(list 제목 제거 케이스). 탭셸 잔여=PermitToWork 1.
- 2026-06-21 [발견-버그·lab2] Contractor approval-mode 상세 진입 NPE — ContractorPlanService.tryAcquireEditLock L234: user.getUidNumber().equals(lockUserId)가 로그인 사용자 IdmUser.getUidNumber() null일 때 NPE → 500 → 프론트 L257 catch "편집 잠금 확인에 실패했습니다". approval 탭만 edit-lock 호출(handleRowClick L249)이라 이 탭만 차단, plan/admin은 무관. PageHeader (다) 작업과 무관(diff 헌크 L40/415/1273-1297 ↔ 잠금경로 L130/248/백엔드 무교집합), API 직접호출로 프론트 배제 재현 완료 = 회귀 아님. ★SiteSafetyPlanService도 동일 tryAcquireEditLock 패턴 → 같은 NPE 잠재, 함께 점검 대상. 수정 방향(예시): Objects.equals(user.getUidNumber(), lockUserId) 또는 getUidNumber null 가드. 근본 원인 후속: 일부 계정의 IdmUser.getUidNumber()(T_IDM_USER.UidNumber)가 null인 이유 별도 규명 필요(권한/계정 데이터 이슈). ※백엔드 수정은 별도 트랙 — 이번 커밋엔 미포함(기록만).
- 2026-06-21 [원인규명·lab2] edit-lock NPE 근본원인 = T_IDM_USER.UIDNumber 데이터 결함(매핑 버그 아님). UIDNumber는 nullable·non-identity·PK아님 대리키인데 레거시 시드 257/6948행(활성 253)에서 NULL → findByUid(UID)로 재조회한 IdmUser.getUidNumber()가 null. NULL 257행 특징: 전부 SyncSource=null(SAP 아님, 원본 com4in IDM 시드 유입), 역할 TEAM_MEMBER 254+SYSTEM_ADMIN 2+EHS_ADMIN 1, 전부 Password 보유=로그인 가능. 채워지는 경로는 정상(SAP HR sync=NEXT VALUE FOR seq_idm_user_uid·dev계정=MAX+1), 레거시 시드만 발번 누락. 로그인 경로 확정: JWT subject=user.getUid()(CustomUserDetailsService L32), 서비스가 idmMapper.findByUid로 DB 재조회. 영향: 하드크래시(NPE→500)는 .equals를 null쪽에 거는 2곳(ContractorPlanService L234·SiteSafetyPlanService L202)뿐 — 나머지 getUidNumber 사용처는 storedId.equals(getUidNumber()) 형태라 null-safe. ★광역 2차피해(silent): 이 257계정이 작성/수정 시 created_by/modified_by(PersonRef) userId=null 저장 → 작성자 식별·승인자 매칭·동시편집 락이 조용히 degrade. 판정: 표층 가드(Objects.equals)만으로 불충분=null-uid 락이 null키로 저장되는 근본문제 잔존 → 근본 백필 필수, 배포 게이트=백필 완료. ★수치는 lab2 클론(yescoSHE_lab2) 실측 기준 → 예스코 운영본 재측정 필요. 백필 설계(충돌회피 발번)+운영본 재측정은 별도 트랙 선행.
- 2026-06-21 [재편·lab2] 탭셸형(다) 복제 3호 — PermitToWorkPage. ★공유 자식(PermitApplicationContent를 PartnerPermitPage가 mode="external"로 재사용) 케이스. 셸(default export) SiteSafety 동형 변경(import FlowChartButton→PageHeader·<Box>→<PageHeader> title=nav.permitToWork·flowKey=activeTab0?'ptw'·Tabs를 tabs prop 이관 mb:2 제거·tab0 흐름도 Box 제거) + 자식 제목 3블록 제거(list L410·detail L545·form L709, 전부 {!isExternalMode &&} 정적 "작업 허가 신청"=무정보 라벨). ★Contractor와 차이: 자식 detail/form 제목까지 제거 — Contractor는 탭별 정보(계획/평가서조회/전체조회)라 보존(parked)했으나 Permit은 list/detail/form 3곳 동일 무정보 라벨이라 보존 명분 없음. ★external 회귀 불가 판정: 제거한 3블록은 모두 isExternalMode 게이트라 external 모드에선 dead code → diff가 이 3개 삭제+셸뿐이면 external 렌더 불변(정적 종결). 가드: tsc 8→8(PermitToWork 기존 TS2339 2건만 L797/1001→L779/983 시프트 잔존, 신규0), 변경파일 PermitToWorkPage.tsx 1개뿐(PartnerPermitPage.tsx 불변 확인). MENU(canSee 권한키)·external 블록(L836/1025)·mode/viewMode/canSee 무수정. PageHeader props 시그니처 동일(새 prop 0). ※working tree만, external 화면 검수 후 커밋 결정.
- 2026-06-21 [패턴노트·lab2] (다) 탭셸형 — 공유 자식이라도 충돌 블록이 external(또는 다른 모드) 게이트 안에 있으면 그 블록 제거는 해당 모드에서 dead code라 회귀 불가·안전. PermitToWork(자식 PartnerPermitPage 공유)에서 검증. 판별법=git diff로 제거분이 게이트 내부 블록뿐임을 정적 확인 → 런타임 검수는 확인사살용. 탭셸 잔여 0(SiteSafety·Contractor·PermitToWork 완료, 트랙 종료). ✅ 커밋 2decc46 + push 완료(화면 검수 OK: 백엔드 7701 기동 후 my·external 양쪽 데이터 조회·저장 정상, external 상세 서브타이틀 부재 회귀 0).
- 2026-06-21 [parked-제목·lab2] 일관성갭-1: PermitToWork '작업 완료 후 점검' 탭(PostWorkInspectionContent) 서브타이틀 잔존 — 이번 (다) 작업은 PermitApplicationContent(작업 허가 신청 탭)만 정리, PostWorkInspectionContent는 별개 자식이라 범위 밖. SiteSafety/Contractor 레포트 탭 등 제목 잔존과 동일 성격(셸 무관·자식 내부). 후속 일괄 정리 후보.
- 2026-06-21 [parked-일관성·lab2] 일관성갭-2: cross-page 흐름도 배치 불일치 — my(PermitToWorkPage=PageHeader, 제목行에 흐름도 인라인) vs external(/partner-permit=App.tsx PageWithTitle 제목 + PartnerPermitPage 자체 flex-end 별行 흐름도). (다)로 my쪽만 흐름도가 제목行으로 올라가며 드러난 갭(external 렌더 불변=회귀 아님). 해소법=PartnerPermitPage를 PageHeader(title=nav.partnerPermit·flowKey=partnerPermit·탭없음)로 통일 — 단 PartnerPermitPage.tsx 신규 변경이라 별도 트랙. + 사용자 아이디어: 탭 1개 페이지도 탭 표시로 표준화할지 검토(단일탭도 Tabs 노출 → 전체 페이지 헤더 일관성).
  ★결정(다음 세션 작업): "탭 없는 단일 페이지도 PageHeader + 탭(1개라도) 구조로 통일 + 탭 라벨과 중복되는 서브타이틀 제거"로 진행 확정. 근거 3: ①일관성 — 모든 페이지가 "제목+탭(+흐름도)" 동일 골격, 규칙 단순화("탭 1개면 제목만" 예외 제거)·나중 탭 추가 시 구조변경 불필요. ②서브타이틀 대체 — 탭 1개여도 탭 라벨이 화면 식별 역할 → 탭 라벨과 중복되는 무정보 서브타이틀 불필요(KPI목표 "연간 계획" 등). ③★영역 구분선(최실질 근거) — MUI Tabs의 bottom border가 제목영역↔본문영역을 자연 구분. 탭 없는 페이지(PartnerPermitPage 등)는 이 선이 없어 제목이 본문과 경계 없이 붕 뜸(화면 검수 확인). 탭 bottom border=장식 아닌 영역 구분자. → 단점(탭 1개만 있으면 어색)보다 구분선의 구조적 명료함이 큼, 화면으로 입증.
  진입 순서: 1단계=전수 조사 먼저(어느 페이지가 (a)탭없는 단일 페이지 (b)탭 라벨 중복 서브타이틀 잔존인지 목록화. 확인된 후보: PartnerPermitPage[협력업체 작업허가, 탭없음+흐름도 별행]·KPI목표[SHE경영, 서브타이틀 잔존]·PermitToWork 작업완료후점검 탭[일관성갭-1 연계]). 2단계=공통 패턴 확정 후 페이지별 적용(SiteSafety/Contractor/PermitToWork에서 검증된 (다) 탭셸 패턴 재사용). 3단계=★cross-page 흐름도 배치도 이때 함께 해소(my=제목行 인라인 기준 통일).
  연계: 일관성갭-1(작업완료후점검 서브타이틀 잔존)도 같은 "중복 서브타이틀 제거" 성격이라 이 트랙에서 함께 처리. ★적용 범위가 안전관리 3개를 넘어 SHE경영(KPI목표) 등으로 확장 = 시스템 전역 PageHeader 표준화 트랙으로 격상.
- 2026-06-21 [전수조사·lab2] ★PageHeader 전역 표준화 ①1단계 완료 — live 페이지 42개 전수 분류(App.tsx 라우팅+PageHeader/Tabs/flowKey grep 교차). 결과:
  · **[그룹1] 완료(PageHeader+탭, 구분선 충족) 18** : EhsPage·HealthCheckup·DiseasePrevention·Training·Approval·RiskAssessment·PartnerSafetyMgmt·LegalResponse·PlanKpiGoal·AuditInspection·EmergencyResponse·WorkEnvMeasurement·Checklist·PpeEquipment·NearMiss·SiteSafetyManagement·ContractorManagement·PermitToWork (전부 tabs prop 보유)
  · **[그룹2] (a) PageHeader적용·탭없음 → 단일탭화 대상 3** : WorkplaceDrawingsView(도면조회 단건)·SafetyAccidentInfo((나)list)·ProcessActivityWork((나)list). 제목 구분선 부재 — 단일탭 부여 대상.
  · **[그룹3] 미적용·탭보유 → PageHeader 이관(구분선 이미 있음) 2** : OccupationalDisease(직업병/보건, 인라인FlowChart L53)·Admin(관리자, L242) ※Admin은 설정성격 여부 스코프 확인 필요.
  · **[그룹4] (a) 미적용·탭없음 → 단일탭화 핵심 대상 5** : EhsBudgetPage(→EhsBudgetTab)·OccupationalExposurePage(→PrePlacementExamTab)·SafetyHazardInfoPage·**PartnerPermitPage(★①3단계: PageWithTitle+흐름도 별행)**·PartnerOshCommitteePage(PageWithTitle→OshCommitteeTab). 전부 얇은 래퍼(Box+인라인FlowChart+단일 Tab컴포넌트) 확인.
  · **[그룹5] 별트랙 보유 2** : ContractorRegistration(③ 위저드 Stepper, PageWithTitle)·PartnerMgmt(모드토글 PartnerEvalTab, 고난도 보류 — 폼 자체제목 충돌 배치4 트랩).
  · **[제외] 설정/특수/제거** : 설정(CodeManage·ButtonManage·WorkplaceDrawings(편집)·ApprovalLine·ApprovalManage + system-manage role/auth/menu)·특수(Login·NotFound·OshSign·PartnerSafetyExecute·GeneralDashboard)·IncidentResponse(제거대상)·MyHealthCheckup(★독립페이지 아님=HealthCheckupPage '내 검진 현황' 탭 컴포넌트, L31).
  · **(b) 탭 라벨 중복 무정보 서브타이틀 — 자식 컴포넌트 레벨**(페이지 레벨 스캔 클린, 설정 subtitle은 패널라벨=비대상): 확정 후보 = PlanKpiGoal '연간 계획'(PlanOverviewTab)·PermitToWork PostWorkInspectionContent(일관성갭-1)·SiteSafety 자식 detail/form·Contractor 자식 detail/form. → 2단계 페이지별 적용 시 자식 동반 제거.
  · **2단계 작업량 = 10페이지** (그룹2:3 + 그룹3:2 + 그룹4:5). 우선순위: 그룹4 얇은래퍼(저위험)→그룹2(자식제목 점검)→그룹3(이관). PartnerPermit는 ①3단계 흐름도 통일과 함께.
- 2026-06-21 [전수조사 보정·lab2] ★1단계 grep이 page 레벨 `<Tabs>`만 잡아 자식 탭을 놓침 → 자식 레벨 재조사. 자식 `<Tabs>` 보유 컴포넌트는 단 3개(RiskAssessmentOfficeWorkTab·EmergencyNotificationTab·EhsBudgetTab). 영향:
  · **EhsBudget 재분류**: 자식 EhsBudgetTab이 이미 멀티탭(대시보드/예산수립/실예산 사용입력/레포트) + L46-48 활성탭라벨 중복 h6 서브타이틀 보유 → (a)단일탭 대상 아님 = **(b)+제목추가 케이스**(PageHeader 제목 부여 + 자식 중복 서브타이틀 제거, 자식 탭은 유지). 그룹4에서 분리.
  · **진짜 단일탭(자식도 탭 없음) = 7**: OccupationalExposure·PartnerOshCommittee·SafetyHazardInfo·PartnerPermit(③3단계) + 그룹2 3개(WorkplaceDrawingsView·SafetyAccidentInfo·ProcessActivityWork).
  · RiskAssessmentOfficeWork·EmergencyNotification 자식탭은 이미 적용된 부모(RiskAssessment·Emergency) 내부 콘텐츠라 무관.
- 2026-06-21 [결정·lab2] 단일탭 라벨 소스 = **화면 고유 식별명**(구체 도메인명, nav키 재사용). 제목=메뉴명 고정. 화면 식별명이 메뉴명과 1:1이면 메뉴명 재사용(중복 허용 — 탭의 역할은 구분선). 예: occExposure 제목=nav.occupationalHealth("직업병 관리") / 탭=nav.prePlacementExam("배치전 건강진단").
- 2026-06-21 [재편·lab2] ★단일탭 Pattern A 파일럿 확정 — OccupationalExposurePage. 얇은래퍼(Box+인라인FlowChart) → PageHeader(title=nav.occupationalHealth·flowKey="occExposure"·tabs=단일`<Tabs value={0}><Tab label={nav.prePlacementExam}/>`) + 자식 PrePlacementExamTab 그대로 children. 자식 내부제목 부재(중복 서브타이틀 없음) 확인. ★Pattern A 템플릿=value 고정0·onChange 불요·flowKey 무조건(탭0뿐). tsc 8→8 신규0. ※잠재 라벨충돌 메모: nav.occupationalHealth("직업병 관리")=nav.occupationalDiseaseMgmt와 동일 문자열 → occupational-exposure 페이지 제목이 occupational-disease와 겹침(기존 코드 답습, 본 트랙 범위 밖·후속 라벨정리 후보).

- 2026-06-21 [게이트·lab2] 라벨 게이트 통과 — chk1(1:1 제목==탭) 단일탭 6개 전부 발생 → 사용자 결정 "구체 라벨 채택"으로 해소. chk2(직업병 관리 동일문자열) → occupational-exposure가 orphan(메뉴 미등록)이라 live 중복 없음으로 해소. chk3 신규키 6개(nav.*Tab) ko/en/zh 추가 완료(partnerOshCommitteeTab 협의체 현황·safetyHazardInfoTab 위험정보 현황·workplaceDrawingsViewTab 도면 조회·safetyAccidentInfoTab 재해발생 현황·processActivityWorkTab 작업내용 현황·partnerPermitTab 작업 허가 신청). ※ko.json은 Grep 툴이 누락 발생(인코딩 추정, UTF-8 BOM無 확인) → PowerShell Select-String + Read로 검증, top-level nav(4-space)와 중복 nav(occupationalExposure.tabs 6-space)·chem.nav 구분해 정확 편집.
- 2026-06-21 [발견·lab2] occupational-exposure = **orphan 라우트** — 사이드바 미등록·전 코드 링크 0(App.tsx L118 라우트로만 존재, URL 직접입력만 도달). PrePlacementExamTab도 이 페이지 전용(HealthCheckup 탭 아님). 파일럿 적용은 패턴검증용으로 유효하나 페이지 자체는 표준화 대상 아님 = 솎기/제거 후보(별트랙). MyHealthCheckup과 유사 성격.
- 2026-06-21 [재편·lab2] ★PageHeader 전역 표준화 ②2단계 일괄 적용 완료 — 9페이지(파일럿 포함), tsc 8→8 신규0(전 페이지 동일 baseline 8 유지). 적용:
  · **Pattern A 단일탭 7**: OccupationalExposure(파일럿·orphan) / PartnerOshCommittee(+App.tsx PageWithTitle 래퍼제거) / PartnerPermit(+래퍼제거·①3단계 흐름도 통일) / WorkplaceDrawingsView(기존 PageHeader에 단일탭 추가) / SafetyHazardInfo(미적용→full (나) 3-return 적용+단일탭, useTranslation 신규주입·하드코딩 제목 2곳 제거·인라인FlowChart 제거) / SafetyAccidentInfo·ProcessActivityWork(기존 (나)에 list return만 단일탭 추가).
  · **Pattern B 1**: EhsBudget — PageHeader 제목 부여(flowKey 무조건), 자식 EhsBudgetTab 탭 유지·중복 h6 서브타이틀(활성탭라벨) 제거(+미사용 Typography import 정리).
  · **Pattern C 1**: OccupationalDisease — page탭 PageHeader 이관(title=nav.occupationalDiseaseMgmt·flowKey=tab0), 중복 서브타이틀(L52=활성탭라벨) 제거, 미사용 Box/Typography/FlowChartButton import 정리.
  · ★①3단계 흐름도 통일 동반 완료: my(PermitToWork)·external(PartnerPermit) 둘 다 흐름도가 제목行(PageHeader)으로 통일 → 일관성갭-2 해소(external PartnerPermit는 App.tsx PageWithTitle 별行 제목 → PageHeader 단일제목行으로 전환).
  · 표준 단일탭 관용구 = `<Tabs value={0} sx={{...}}><Tab label={t(...)}/></Tabs>` (onChange 없음·value 고정0).
  · ※화면검수 대기(7700): 래퍼제거 2건(PartnerOshCommittee·PartnerPermit) fill 미전달(풀하이트 비의존, PartnerSafetyMgmt 선례) / external PermitApplicationContent 무제목 회귀 0(제거된 제목 3블록 모두 isExternalMode 게이트라 external은 원래 dead) / EhsBudget 자식탭 위 제목 배치.
- 2026-06-21 [비대상·lab2] PageHeader 표준화 제외 확정: 설정 6(CodeManage·RoleManage·AuthManage·FloorDrawings(WorkplaceDrawings 편집)·ButtonManage·MenuManage) + ApprovalLine·ApprovalManage + /admin(AdminPage, 설정·시스템 성격) + 특수(Login·NotFound·OshSign·PartnerSafetyExecute·GeneralDashboard) + IncidentResponse(제거대상). 사용자 결정: Admin 제외(설정성격).
- 2026-06-21 [라벨충돌 후속후보·lab2] nav.occupationalHealth("직업병 관리") == nav.occupationalDiseaseMgmt("직업병 관리") 동일 문자열. 현재 live 충돌 없음(occupationalHealth는 orphan occupational-exposure 페이지만 사용). occupational-exposure 제거/정리 시 함께 해소. 별트랙 라벨정리 후보.

- 2026-06-21 [수정-버그·lab2] SHE 예산>예산수립 "저장 안됨" — 원인=프론트 EhsBudgetPlanTab의 create/update/deleteMutation에 **onError 핸들러 부재**(조용한 실패). 백엔드는 정상: 깨끗한 INSERT는 200, 중복(같은 연도+분류)은 409 + 명확 메시지("해당 연도에 이미 등록된 분류입니다. 분류별 1건만 등록할 수 있습니다.") 반환 확인(API 재현). 2026년은 8개 분류가 이미 전부 등록돼 추가 시도가 전부 409인데 메시지가 안 떠 "저장 안됨"으로 보였음. 수정=3개 mutation에 `onError: showError(e?.response?.data?.message || t('common.error'))` 추가 + useAlert에 showError 디스트럭처. ★형제 EhsBudgetExpenseTab은 이미 onError 보유(무수정). 프론트 전용·tsc 8→8 신규0. ※API 디버깅 중 Windows bash가 한글 페이로드를 깨 JsonParseException(0xd7) 500 유발 = 테스트 아티팩트(앱 무관, ASCII 페이로드로 재확인). ※중복차단은 IllegalStateException→GlobalExceptionHandler가 409로 정상 매핑(표준예외 권고와 별개로 동작은 정상).

- 2026-06-21 [수정-일관성·lab2] (나) 3-return 단일탭 누락 수정 — 검수서 SafetyHazardInfo 상세/등록 진입 시 단일탭 사라짐 발견. 원인=list return만 PageHeader(title+flowKey+단일탭)이고 detail-loading·detail/form return은 title만. 동일 패턴 적용한 SafetyAccidentInfo·ProcessActivityWork도 같은 누락 확인. 수정=3파일×2 return(로딩가드·상세/폼)을 list와 동일한 full PageHeader(title+flowKey+단일탭 value=0)로 통일 → 탭·흐름도 list/상세/등록 내내 유지. 근거=레퍼런스 PlanKpiGoal은 탭셸이라 activeTab=0이 자식 detail 진입에도 유지돼 탭+흐름도가 detail 내내 표시됨 → (나)도 동형 통일이 일관. tsc 8→8 신규0, title-only PageHeader 잔존 0 확인. ※WorkplaceDrawingsView 흐름도 위치는 별건(미접촉).

- 2026-06-21 [성능·lab2] SafetyHazardInfo 수정화면 edit 진입 ~4초 최적화 — 주범=API 아님(getById 0.077s, edit 클릭 시 호출 0), edit 전환 시 45행×행당 ~21 MUI 입력(체크박스 540+TextField 315 등) ≈945개 동시 마운트. 조치 3종(프론트 전용):
  ① 행 컴포넌트 분리 — items.map 인라인 JSX → 모듈레벨 `HazardItemRow`(React.memo). updateItem의 `.map(i===idx?…:it)`가 미변경 행 참조 보존 → memo로 해당 행만 리렌더. updateItem/addItem/removeItem/addItemInGroup useCallback 안정화. 행 고유 `_rk` 키 부여(index key 지양, assignKeys/addItem/addItemInGroup에서 발번, stripKeys에서 _pk·_rk 제거).
  ② 체크박스 네이티브 교체 — MUI Checkbox 540개 → `<input type=checkbox>`(NativeCheck, on/off 동치·최소 CSS). 마운트 최대 단일 절감. (Checkbox import 제거)
  ③ procSpan useMemo화 — 매 렌더 O(n²) → 그룹 시그니처(_pk+processActivity)변경 시 1회. 체크박스 토글 등 비그룹 편집 시 spanInfo 캐시 재사용 → span 참조 안정 → 미변경 행 memo 유지.
  검증: tsc 8→8 신규0, `npx vite build` 운영번들 성공(29s). 기능 동치(체크 on/off 저장값·행추가/삭제·바인딩 동일, 상세모드 값기반 rowSpan 폴백 유지). ※`npm run build`는 기존 baseline 8 tsc에러가 게이트라 미통과(본 변경 무관, 별도 정리과제) → 운영 preview 타이밍 실측은 baseline 8 해소 후 또는 dev 7700(StrictMode 오버헤드 감안). 가상화(react-window)는 미적용(1~3로 부족 시에만).

- 2026-06-21 [재편·lab2] WorkplaceDrawingsView(사업장 도면 조회) 흐름도 위치 표준화 — parked 항목 해소. 흐름도가 설정(/system-manage/drawings)과 공유하는 자식 WorkplaceDrawingsPage 본문 상단에 인라인으로 떠 있던 것을 `readOnly` 분기로 처리: 자식의 인라인 FlowChartButton Box를 `{!readOnly && (...)}` 게이트 → 조회뷰(readOnly=true)는 숨기고 부모 PageHeader에 flowKey="workplaceDrawings" 연결해 제목行 인라인 표시(KPI·①3단계 기준). 설정 도면관리(readOnly=false)는 본문 인라인 유지=회귀0. tsc 8→8 신규0. (FlowChartButton import 유지=게이트만)
- 2026-06-21 [성능-미완결·lab2] ★SafetyHazardInfo edit 4초 — 행 React.memo 분리 + 체크박스 네이티브 교체(540개) + procSpan useMemo 적용했으나 **운영 preview 실측상 체감 개선 미미**. → 주범 재의심 필요(행수(45)·체크박스 개수보다 다른 병목 가능성: 상단 폼/모달/공유 컨텍스트·전체 리렌더·MUI TextField 315개 mount 등 미규명). 가상화(react-window)는 **보류 카드=다음 후보**로 남김(1~3 적용 후에도 부족 확인됨). ※`npm run build`는 기존 baseline 8 tsc 에러가 게이트 막음(이번 변경 무관, 별건 정리과제) — `npx vite build`(esbuild)는 정상. 적용분(memo·네이티브·useMemo)은 기능 동치·회귀0이라 유지(롤백 안 함), 추가 진단은 별도 트랙.

- 2026-06-21 [재편·lab2] ③ ContractorRegistration PageHeader 이관 — ★PageHeader 표준화 트랙 마지막 잔여 해소(잔여 0). 구조=(나)형 2-return(list L356 인라인FlowChart·제목없음 + 위저드 L511 Stepper·제목없음), 도메인탭0·중복서브타이틀 없음. 적용: App.tsx PageWithTitle 래퍼 제거 + 두 return 모두 PageHeader(title=nav.partnerRegistration "협력 업체 등록"·flowKey="contractorReg"·단일탭 value=0) 통일 + list 인라인 FlowChartButton 제거(import도 PageHeader로 교체). 신규키 nav.partnerRegistrationTab("등록 현황"/Registration Status/登记现况) 3locale. 사이드바=협력 업체 관리>협력 업체 등록. 선례 PartnerSafetyMgmt/LegalResponse는 단일return 1-wrap이었고 이건 2-return이라 SafetyAccident식 (나) 적용. tsc 8→8 신규0. ※위저드 fill 미전달(선례 동일). 화면검수 대기(list·위저드 detail/create/edit 진입).
  · ★PageHeader 전역 표준화 누계: 그룹1(기적용)18 + 2단계 적용(A단일탭7·B EhsBudget·C OccDisease) + (나)3p 일관성 + ContractorRegistration = 트랙 종료. 제외 확정: 설정6+/admin+특수5+IncidentResponse(제거대상)+PartnerMgmt(모드토글 보류)+orphan(OccupationalExposure).

- 2026-06-21 [정리·lab2] ★baseline 8 tsc 에러 완전 해소 — `npm run build` 게이트 정상화(tsc 통과→vite build ✓ 25s). ★새 회귀 기준=**0→0 신규0**(기존 "8→8"·"9→8" 무효). 처리:
  · unused import 4 제거: PpeDashboardTab(t+useTranslation, t() 호출0)·PpeItemTab/PpeStockTab(CircularProgress)·LegalResponse(EditIcon). 전부 import 라인에만 등장=진짜 미사용 확인 후 제거.
  · TS2339 PpeEquipment.category 4(ContractorManagement 846/1081·PermitToWork 779/983) → 근본 해소(A안). 두 페이지가 로컬 stub `type PpeEquipment={id;name}` 중복선언(category 누락)인데 코드는 ppe.category 참조(드롭다운 secondary). 접근 필드=id/name/category 3개뿐이고 정식 PpeItem(ppe.types.ts)이 셋 다 포함·형호환·setter는 setPpeList([])뿐(빈배열 할당 안전)이라 → 로컬 stub 제거하고 `import { PpeItem }`로 통일, useState<PpeItem[]>. 코드 참조는 정상이었음(stub만 불완전).
  · ※부수발견(별건): ppeList는 두 파일 모두 항상 빈배열("PPE 재구성 중 — 신규 API 연결 전 임시") → 보호구 선택 드롭다운 비활성 상태. 신규 PPE API 연결이 미완 과제(타입 통일로 재연결 시 forward-compatible).
- 2026-06-21 [parked·lab2] ★신규 PPE API 연결 미완 → 협력업체 등록(ContractorManagement)·작업허가(PermitToWork) 등록 폼의 '필요 보호구' 드롭다운이 빈 목록(비활성). ppeList가 항상 []이라 선택 불가. ★예스코 런칭 전 해소 필요. 타입은 PpeItem으로 통일돼 API 재연결 시 추가수정 0(forward-compatible) — fetch만 붙이면 됨.

- 2026-06-21 [성능-종결·lab2] ★SafetyHazardInfo edit 진입 4~6초 → **1초 미만 해소**(운영 preview 실측, 기능 회귀 0: 입력·수량·저장·재진입 정상). 2단계(청크 렌더) 불필요로 종결.
  · 주범 확정 = **insertBefore 자체시간 3.8s(운영 프로파일, 전체 51%)** = 행당 MUI TextField 5 DOM노드×7×45행의 DOM 삽입 과다. emotion serializeStyles 0.4ms·MUI processStyleArg 0.1ms·스타일계산 141ms·레이아웃 25ms·페인트 190ms 전부 작음 → 스타일/JS/가상화 아님, **순수 DOM 노드 수**가 병목.
  · 1차 시도(fd1f82b: 행 React.memo + 체크박스 네이티브 + procSpan useMemo) **효과 미미** — JS/스타일/리렌더를 줄인 것이라 DOM-삽입 병목과 빗나감. 교훈: 프로파일 없이 "memo가 답"이라 단정한 게 오진. 운영 프로파일로 insertBefore 지목 후 정조준.
  · 2차 해소 = edit 격자 8개 MUI TextField → 네이티브 `GridInput`(`<input>`+최소 인라인 CSS). 격자 본문 DOM 노드 ~55%↓(행당 ~47→~19). 기능 동치(value/onChange/Number변환/저장 페이로드 동일, 상세 readonly 평문 무변경). 상단 폼 TextField(행당 아님)는 유지.
  · 가상화(A/B) 기각: A=rowSpan 그룹병합 ↔ 행 언마운트 근본 충돌(react-window/virtuoso 둘 다 cross-row rowSpan 미지원) + 바운드 뷰포트 부재. B=rowSpan 제거(병합 비주얼 상실·스크롤 UX 변경·2행 헤더 재구현, 회귀 중) 가능하나 45행 규모라 절감 ~2.5s뿐=실익 부족. → C(경량화)가 직격.
  · ※preview 검증 환경 메모: `vite preview`는 server.proxy 적용되나 백엔드 CORS 허용 origin에 4173 없음(5173 있음) → preview는 **5173 포트**로 띄워야 로그인 통과(재빌드·백엔드 변경 불요).

- 2026-06-21 [성능-전수종결·lab2] ★입력 격자(행 반복×MUI 입력 다량→insertBefore) 동일 패턴 후보 5건 전수 검수 → **대부분 비병목, 전수 적용 불필요로 결론**. 코드 수정 없음(기록만).
  · 후보(코드상 추정 위험도): RiskAssessmentTab(관리/관리자 격자, Select4+TextField1/행·rowSpan, HIGH) · SafetyChecklistTab(체크리스트 편집, TextField4+DatePicker1/행, HIGH) · RiskAssessmentFormTab(위험성평가폼, TextField3+Select2/행·rowSpan, HIGH중상) · EvalSheetTab(평가표, TextField3+NumberField1/행, MID-HIGH) · ProcessActivityWorkPage(작업내용, TextField2/행·rowSpan3단, MID).
  · **운영 데이터 실검수 결과**: 위험성평가·안전점검체크리스트·위험성평가폼·공정활동작업내용 4건 = 편집 진입 지연 거의 없음(실데이터 행 수·입력 밀도가 체감 임계 미만 → 코드상 HIGH 추정이 실제론 비병목). 수정 불필요.
  · 평가표(EvalSheetTab)만 상세 진입 1.5~2초. 단 단일 거대 병목 없음(insertBefore 류 아님 — 데이터매핑+rowSpan계산+스타일144ms+페인트 분산). 고쳐도 실익 적어 보류. ★행 대폭 증가 시 재검토.
  · 결론: SafetyHazard(945입력·insertBefore 3.8s)는 유독 큰 특수케이스였고 2차(TextField 네이티브화)로 이미 해소. 동일 패턴 전수 적용 불필요.
  · 공통 GridInput 승격(components/common화)도 현재 재사용처 없어 보류 — 위 후보 중 실제 수정 필요해지면 그때 승격.

- 2026-06-21 [재연결·lab2] ★PPE '필요 보호구' 드롭다운 빈 목록 해소 — parked 항목 종결. 백엔드·프론트 모두 이미 완비(미구현 아님): `GET /ppe-items`(PpeItemController)·`ppeItemApi.getAll`·PpeItemResponse(id·name·category) 존재, 실데이터 8건 시드. 두 파일(ContractorManagement·PermitToWork) `setPpeList([])` → `ppeItemApi.getAll(0,100).then(res=>setPpeList(res.content||[])).catch(()=>{})` 교체 + `import { ppeItemApi }`. category 라벨화: PPE_CATEGORY 코드맵 등록 확인(8건 HEAD/EYE/RESPIRATORY/HEARING/HAND/FOOT/FALL/BODY→한글, /code-manage/details/by-group/PPE_CATEGORY) → 드롭다운 secondary `getPpeCategoryLabel(ppe.category)` 적용(useCodeMap('PPE_CATEGORY'), 양 파일 기존 useCodeMap 패턴 재사용). 회귀 0: 저장구조 requiredPpe(이름 CSV)·detail 표시(selectedItem.requiredPpe 직접) 무변경, 선택지만 채움. id 저장 안 함. tsc 0→0 신규0. ※코드맵 API 경로 메모: 코드그룹 상세=`/code-manage/details/by-group/{groupCode}`(useCodeMap→fetchCodesByGroupCode).

- 2026-06-21 [종결+검수·lab2] PPE 드롭다운 빈목록 parked **종결** — 재연결 검수 통과(작업허가·협력업체 위험성평가 양쪽 8건 + PPE_CATEGORY 한글분류 표시). 라벨 통일: ContractorManagement "보호구" 3곳(상세/PC폼/모바일폼) → `t('ptw.requiredPpe')`("필요 보호구")로 작업허가와 일치(전역 네임스페이스 접근 확인). tsc 0→0.
  · ★검수 중 혼동 규명: PPE 드롭다운은 **ContractorManagementPage(협력 업체 위험성 평가, /contractor)** 작업계획 신규/수정 폼에 있음. 사용자가 본 **ContractorRegistrationPage(협력 업체 등록, /contractor-registration, 5단계 위저드)에는 PPE 필드 부재**(별개 페이지). dead 아님.
- 2026-06-21 [예스코확인대기·lab2] ★협력업체 등록 위저드(ContractorRegistration)에 '필요 보호구' 필드 부재 — 의도된 설계(업체등록 ≠ 작업계획)인지 누락인지 도메인 확인 필요. 업체 마스터 등록과 작업계획(위험성평가)은 별개라 부재가 자연스러울 수 있으나 예스코 확정 요망.

- 2026-06-22 [제거·lab2] ★IncidentResponse(사고대응관리) 화면 제거 — 프론트 전용. 중복 검증 완료: NearMiss(사고/아차)가 emergencyType/responseStatus/severity/isDrill(INCIDENT_RESP_* 동일 코드그룹) + 구조화 CAPA(actions/재발방지)까지 보유한 상위집합, IncidentResponse 고유기능 0(CAPA도 없이 actionTaken 단일텍스트). 대표의 "기능 중복" 판단 정확. ※[발견-CAPA]의 진의=IncidentResponse에 CAPA '부재'(공백)였지 핵심 아님. 삭제: 전용3(IncidentResponsePage·incidentResponseApi·incidentResponse.types) + 참조정리(App import/route·Sidebar·MenuManageTab·flowSpecs incident·i18n nav.incidentResponse 3키). ★백엔드/tb_incident_response(12행=테스트)·DB menu_rule = 존치(orphan), incidentResponsePage i18n 콘텐츠ns(en/zh) 고아 보류 — orphan 백엔드/i18n 정리는 별도 트랙. 백엔드 의존성 전수확인: tb_incident_response 참조=자기매퍼+V168뿐, 자바심볼 전용4파일 외 0, 사고/재해 집계·FK 0(완전 전용). tsc 0→0, npm run build 통과.

- 2026-06-22 [재편·lab2] NearMiss(사고/아차) (나)형 일관성 — 상세/등록에서 탭 사라지던 문제 해소. ①PageHeader를 메인 return 최상위로 호이스팅(viewMode list/detail/create/edit 전부 공통 래핑, 'list' 게이트 제거) → 3탭(대시보드/아차사고/사고) 상세·등록 내내 유지, 진입탭 활성 유지. 탭 onChange에 setViewMode('list') 추가(상세/등록 중 다른탭 클릭→그 탭 목록 복귀). flowKey=DASHBOARD&&list 한정. 모달은 PageHeader 밖 형제로. ②탭중복 무정보 상단제목 제거: 상세 h6(nearMissInfoByType=탭명, 상태 Chip 보존)·등록 h6(registerInfoByType) 삭제. ③첫 섹션헤더 재라벨: "아차사고"/"사고"(탭명) → 신규 nav키 nearMiss.sectionOccInfo("발생 정보"/Occurrence Info/发生信息, 타입무관 고정) → 5섹션(발생정보/사고대응분류/위험성파악/재발방지대책/이미지) 균일. renderDetail/renderForm 본문·데이터표 무수정. nearMissInfoByType·registerInfoByType i18n키는 무해 고아 잔존. tsc 0→0.

=== 세션 마무리 (2026-06-21 저녁 기준, HEAD=57f148b) ===

■ 이번 세션 완료 (전부 커밋·push, IN SYNC)
- (나)early-return 파일럿 SafetyAccidentInfoPage (c70ecb7) — 3-return 독립 PageHeader 주입, 템플릿 확정본
- (나) 복제 ProcessActivityWorkPage (2f14932) — 7700 눈검수 OK
- (나) 트랙 실측 정정 (a3d0284) — 핸드오프가 "(나) 5개"로 묶은 것 중 진짜 (나) 0개. 래퍼형2·탭셸3로 재분류
- IncidentResponse 제외 (57f148b) — 숨김·제거대상, 적용 보류(조사만, 트리 미변경)

■ PageHeader 잔여 4개 (다음 세션)
- 중난도 래퍼형 1: ContractorRegistration — App.tsx 래퍼제거 + 위저드(Stepper 5단계). 선례 PartnerSafetyMgmt/LegalResponse(단일root 1-wrap, fill 미전달)
- 탭셸 3: SiteSafetyManagement·PermitToWork·ContractorManagement — 페이지셸 Tabs, flowchart=tab0. NearMiss (가) 패턴 근접하나 외부모드·mode동적 추가분기. 새 파일럿 필요
- ★PermitToWork·ContractorManagement는 tsc 베이스라인 에러 보유(각 2건) → 작업 전 기존에러 확인 후 진입

■ 메커닉 메모
- (나) = bare route + 3-return(list/로딩가드/공용), 각 return마다 PageHeader. flowKey는 list만
- 중난도 이관 = App.tsx PageWithTitle 제거 + PageHeader, fill 미전달(풀하이트 비의존)
- detail 이중제목(페이지제목+레코드제목)은 기지 패턴, 화면검수로 판정

■ parked 도메인 큐
- ★협의체 이중노출 — 예스코에 산안위 §24 vs 도급 협의체 §75 구분 여부 확인. 답 오면 OshCommitteeTab 공유구조 방향 결정

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

=== 세션 핸드오프 (2026-06-21 갱신, HEAD=c8c7c09) ===
※ 새 세션은 이 블록만 읽으면 됨. 위 시간순 로그는 작업 점검표(보존).

■ 환경 (변경 없음, 매 세션 고정)
- 위치: C:\claude\yesco_she_lab2 / 브랜치 lab2 / 작업트리 clean
- remote: upstream=jiwon2ahn(정본, push 차단) / origin=horsehihing3/yesco_she_lab(push)
- DB: yescoSHE_lab2 (정본 yescoSHE 복제, 211.171.152.242:51084)
- 포트: 프론트 7700 / 백엔드 7701
- 정본 대비: yescoSHE 정본 기반 + 청소/제거 적용본. 정본 jiwon2ahn에 원본 보존(복구 가능)
- tsc 회귀 기준: "8→8 신규0" (베이스라인 8)

■ 현재 상태 = 두 트랙 진행 중
[A] 솎기/청소 트랙 — 1차 완료
  · 청소 재적용 8건 + 숨김 3그룹 풀스택 제거(환경관리8·PSM·MSDS화학, ~44k줄) + 버튼 유령잔재 + 지도 대시보드 제거
  · 전부 정본 보존·복구가능. 상세는 위 [재적용]/[제거]/[정리] 태그
[B] PageHeader 표준화 트랙 — 진행 중 (16페이지 적용)
  · 표준 4규칙: 제목-위(제목→탭) / 제목=메뉴명 고정(nav키 재사용) / 흐름도 우상단(탭0 조건 호출부) / space-between
  · 공통: common/PageHeader.tsx (props=title·flowKey?·actions?·tabs?·fill?·children). 컴포넌트는 fill prop 추가 외 무변경(안정)
  · 저난도(12): EhsPage·Health·DiseasePrevention·Training·Approval·Ppe·PlanKpi·RiskAssessment·Audit·Emergency·WorkEnv·Checklist
  · 중난도 순수이관 3 (App.tsx PageWithTitle 래퍼 제거): PartnerSafetyMgmt·WorkplaceDrawingsView·LegalResponse
  · 흐름도 위치정정: KPI(자식 toolbar→제목줄)·보호구(flowKey 추가)
  · 고난도 파일럿 1: NearMiss ((가)구조 = 단일root+형제블록 템플릿 확정)
  · 버그 수정: near-miss 첫 탭 fallback 'NEAR_MISS'→'DASHBOARD'

■ 남은 작업 (우선순위순)
1. PageHeader 고난도 잔여 10개 — 메커닉 3갈래:
   · (가) 단일root+형제블록 → NearMiss 템플릿 복제 (페이지별 구조 재확인)
   · (나) early-return 다중 → SafetyAccident·ProcessActivity·ContractorRegistration·IncidentResponse·SiteSafetyMgmt·PermitToWork·ContractorManagement
        메커닉=if(viewMode==='list')return<PageHeader>, 별도 파일럿 검증 필요(미착수)
   · 모드토글 자식 → PartnerOshCommittee·PartnerPermit·PartnerMgmt (폼 자체제목 충돌 재확인, 배치4 트랩 주의)
   · 설정 6개는 표준화 제외 확정(슈퍼관리자)
2. (미착수) 재편: 사이드바 메뉴 그룹 정리 + 7700 vs 7600(원본 com4in) 비교 — 사용자 원래 목표
3. (미착수) 더 솎기: SHE경영 등 보이는 메뉴 중 예스코 미사용 추가 정리
4. 보류 콘텐츠 트랙(저우선): NearMiss detail 이중제목·i18n 고아 네임스페이스·ppe 흐름 spec·WorkplaceDrawingsView 흐름도 위치·YescoSidebarIcons 고아아이콘6
5. ★협의체 이중노출(OshCommitteeTab 공유) — 예스코 도메인 확인 대기(산안위 §24 vs 협의체 §75 구분 여부)
6. (장기) lab 결론을 정본 yescoSHE에 선별 재적용 + 필요기능 복구 + 전체 기능테스트 + 보고(특히 [발견-CAPA])

■ 다음 세션 시작점 (택1)
- (가장 자연스러움) PageHeader 고난도 (나)구조 파일럿: SafetyAccident or ProcessActivity 하나로 early-return 메커닉 확정 → 나머지 (나) 페이지 복제
- 또는 보류 콘텐츠 트랙 청소 / 또는 사용자와 "더 정리 vs 재편·비교 vs 보고자료" 방향 합의

■ 핵심 발견 (보고자료 소재 — 잊지 말 것)
- [발견-CAPA] 사고대응(비상상황·화재·폭발)에 구조화 원인분석/재발방지 부재 → 중대재해처벌법 대응 핵심 공백, 예스코 개선안 1순위
- [발견-구조] 사고/재해 6개 테이블 FK 0개 = 개별사건→집계 자동반영 없는 '끊긴 분산'

=== 세션 마무리 (2026-06-22, HEAD=ab64e23) ===
※ 새 세션은 이 블록만 읽으면 됨. 위 시간순 로그는 작업 점검표(보존). 그 아래 옛 세션마무리 블록들은 stale.

■ 환경 (고정)
- 위치 C:\claude\yesco_she_lab2 / 브랜치 lab2 / 작업트리 clean / local=origin/lab2=ab64e23
- remote: upstream=jiwon2ahn(정본·push차단) / origin=horsehihing3(push)
- DB yescoSHE_lab2(211.171.152.242:51084) / 프론트 7700 · 백엔드 7701
- ★tsc 회귀 기준 = **0→0 신규0** (기존 "8→8"·"9→8" 무효, baseline 정리 완료)

■ 이번 세션 완료 — 9커밋, 전부 origin/lab2 동기화·clean (d129d63 이전 별개)
1. ★PageHeader 전역 표준화 트랙 — 잔여 0 종료. ②2단계 9p(A 단일탭7/B EhsBudget/C OccupationalDisease) + (나) 단일탭 일관성 3p(SafetyHazard·SafetyAccident·ProcessActivity) + ③ ContractorRegistration + 흐름도 위치(WorkplaceDrawingsView). 비대상 확정: 설정6 + /admin + 특수5 + IncidentResponse(제거됨) + OccupationalExposure(orphan).
2. baseline tsc 게이트 해소 — 8건(unused 4 + PpeEquipment stub→PpeItem 통일). npm run build 정상 통과. ★회귀 기준 0→0으로 갱신.
3. SafetyHazard edit 성능 — 4~6초 프리즈→1초 미만. 주범=insertBefore 3.8s(DOM 노드 과다), TextField→네이티브 GridInput 해결. 가상화 기각(rowSpan 충돌+45행 실익부족). 동일패턴 후보 5건 전수검수→타 화면 비병목, 전수수정 불필요 결론.
4. PPE '필요 보호구' 드롭다운 재연결 — ppeItemApi.getAll(0,100)+PPE_CATEGORY 라벨화, 라벨 "보호구"→"필요 보호구" 통일. 빈목록 parked 종결.
5. IncidentResponse 화면 제거(9f89c47) — 프론트 전용(NearMiss 상위집합·기능중복 확정). 백엔드/tb_incident_response(12행 테스트)·DB menu_rule = orphan 존치.
6. NearMiss (나)형 일관성(ab64e23) — 상세/등록 탭 유지(PageHeader 호이스팅)+탭중복 제목제거+첫섹션 "발생 정보" 재라벨, 상태 Chip 보존.

■ 다음 세션 후속 트랙 (우선순위순)
A. orphan 백엔드 정리: IncidentResponse Controller/Service/Mapper/Model + tb_incident_response. ★선행: 비상대응 NearMiss 통합이 예스코와 확정돼야 함(확정 전 테이블 DROP 금지). DB 스키마 영역 별도 트랙.
B. 예스코/대표 확인 대기(코드 아님, 협의 질문):
   - 협의체 이중노출 산안위 §24(내부) vs 도급 협의체 §75 구분 여부
   - 협력업체 등록 위저드에 '필요 보호구' 필드 부재가 의도인지 누락인지
   - IncidentResponse 12건 비상데이터 처리(현 테스트데이터라 보류 가능)
C. ④ edit-lock NPE 근본 백필(T_IDM_USER.UIDNumber NULL 257행). ★선행: 예스코 운영본 재측정(현 수치는 lab2 클론 실측). 배포 게이트.
D. 저우선: PartnerMgmt 모드토글 · i18n 고아 ns 일괄정리(incidentResponsePage en/zh·registerInfoByType·nearMissInfoByType·환경/PSM/화학) · parked 자식 서브타이틀 · EvalSheet 평가표 상세 1.5~2초(행 대폭증가 시 재검토).

■ 다음 시작 권장
- D의 가벼운 것(i18n 고아정리/PartnerMgmt) 워밍업, 또는 B 예스코 협의 먼저. A·C는 선행조건(예스코 확정/운영본 측정) 충족 후.

=== 코드정리 스캔 (2026-06-22, HEAD=45f803b) ===
※ 인프라 설치 전 '제거 후보 전수 스캔'. READ-ONLY, 프론트 endpoint grep + 백엔드 내부 호출처 grep 교차검증 완료. 제거·수정 미실행.

■ 프로젝트 맥락 (다음 세션용 고정 메모)
- 예스코 납품용 Smart EHS. 인프라(예스코 AP·DB) 설치 전 코드 정리 단계.
- 개발 히스토리: 컴포인 대표가 그때그때 아이디어 주면 안지원 매니저가 5개월 산발 개발 → 체계 없이 기능 누적 → orphan·중복·미배선 기능 다수.
- 숭이: 6월 초 투입, 권한관리·메뉴관리 담당.
- 레포: 정본 yescoSHE(안매니저와 git 공유) → 별도 레포 lab2 → 숭이 단독 수정. 복구처 = upstream(jiwon2ahn/smart_ehs_com4in) 또는 git history.

■ 의사결정 원칙
- 중복 제거 결정권 = 우리 셋(숭이·Claude.ai·Claude Code). 예스코 협의 대상 아님.
- 판단 기준 = 코드상 중복/orphan (업무요구 아님).
- 전략: 먼저 제거 → 필요 시 재개발 or 컴포인 원본에서 이식 (원본 보존 → 공격적 제거 OK).
- 예스코 담당자는 비개발자: 화면 단위 "쓴다/안쓴다/추가"만 결정. 그것도 김이사님 업무별 질문지→담당자 질의응답 취합 후 가능. → "업무결정 필요" 항목은 답 나올 때까지 동결.

■ 스캔 결과 (READ-ONLY, 교차검증 완료)
🟢 즉시 제거 가능 (업무결정 불필요)
- 프론트: OccupationalExposurePage (메뉴 0참조 orphan 라우트)
- parked 서브타이틀 3건: SiteSafety / Contractor tabTitle / Permit (cosmetic)
- i18n 도메인 잔재 ns: carbon, chem, comp, compAction, compEval, envMon, waste, water, psm, rm, fs, lf + 소형 무해(kpi/lc/pm/messageCategories/status/spreadsheet)
  ※ permit/ptw 등 인접 라이브 키 블록제거 금지, ns 단위로만
🟡 즉시 제거 가능하나 DB DROP 동반 (스키마 게이트 — 인프라 설치 후 별도 처리)
- 백엔드 orphan 5묶음: ChecklistTemplate, ChecklistResult, EhsKpiPlan, HazardFactor, WorkplaceMeasurement (~40 java + 9 xml + tb_* DROP)
- 라이브와 별개 엔드포인트 확인됨 (/checklist-templates ≠ 라이브 /checklist 등)
🔴 보류 (예스코 확인 전 동결)
- IncidentResponse 백엔드 4파일 + tb_incident_response 12행(시드 더미). NearMiss 상위집합, 화면 이미 제거. casualty_info를 NearMiss로 옮길지 보류.
- ODM 4묶음(OdmConfirmed/Exposure/Followup/Suspect) + i18n odm(58키)·cm(53키). i18n 완비 = "빌드됐으나 미배선" 미완성 기능 가능성. DROP 금지.
- PartnerEvalTab 모드토글 표준화 방식 (제거 아님, PageHeader 표준화 방법 결정).
- §24 산안위 / §75 도급협의체 데이터 미분리 (OshCommitteeTab 의도적 공유).

■ 검증으로 정정된 과잉판정 (다음 세션 주의)
- ❌ LegalCompliance "완전중복 orphan" → 오류. legalComplianceApi.ts 라이브 호출 중(V192 의도분리).
- ❌ Checklist/WEM/KPI/SafetyHazard "orphan" → 오류. 다른 컨트롤러 쓰는 라이브 페이지.
- ❌ ApprovalLine/ApprovalManage/MyHealthCheckup "dead" → 정상 탭(부모가 import).
- 교훈: orphan 판정은 프론트 endpoint grep + 백엔드 내부 호출처 grep 교차검증 필수.

■ 기술 기준선
- tsc 회귀 기준: 0→0 신규0 (기존 "8→8" baseline 무효).
- 제거 작업은 항목별 커밋 분리(orphan 백엔드 / i18n / 죽은 프론트) → 부분 롤백 용이.

=== 코드정리 실행 결과 (2026-06-22, HEAD=486f241) ===

■ 🟢 즉시제거 트랙 — 전부 완료
- [완료] i18n 고아 ns 17개 제거 — b123c5f (-2448 lines, ko/en/zh)
  · SKIP: lc (lc.tabs.* = 라이브 menuKey via t(), MenuManageTab/buttonManageData에서 정의)
- [완료] parked 무정보 서브타이틀 4건 — 73844bf (-24 lines)
  · SiteSafety / Contractor(tabTitle, noUnusedLocals로 const도 제거) / Permit postWorkInspection
  · + PermitReportTab.tsx:259 "레포트"(탭라벨 중복) — 화면확인 중 발견해 동반 제거
  · 유지: PermitReportTab h5 "작업 허가 레포트"(레포트 고유 헤더, 인쇄 포함)
- [완료] OccupationalExposure orphan 페이지 일괄 제거 — 486f241 (-2048 lines)
  · 삭제: OccupationalExposurePage + PrePlacementExamTab + types + App 라우트/import
  · 전용 i18n 동반 제거: occupationalExposure ns + nav.prePlacementExam (ko/en/zh)
  · 4단계 확인(라우트/메뉴/프로그래매틱 navigate/공유) 전부 0건 후 제거

■ 보류로 넘어간 항목 (다음 판단 대상)
- nav.occupationalHealth — 코드 참조 0(이제 고아)이나 제거 보류.
  사유: nav.occupationalDiseaseMgmt와 동일 라벨("직업병 관리") 충돌 후보.
  → 🔴 ODM 트랙에서 두 키 함께 판단할 것. (단독 제거 금지)
- /pre-placement-exam 백엔드 컨트롤러 — 프론트 제거로 orphan 추가됨.
  → 🟡 DB게이트 백엔드 orphan 트랙에 합류(인프라 설치 후 처리).

■ 다음 단계 (남은 트랙)
- 🟡 DB DROP 동반 백엔드 orphan 5묶음(ChecklistTemplate/ChecklistResult/EhsKpiPlan/
  HazardFactor/WorkplaceMeasurement) + pre-placement-exam → 인프라 설치 후 별도 처리
- 🔴 보류(예스코 확인 전 동결): IncidentResponse, ODM 4묶음+odm/cm i18n,
  PartnerEvalTab 표준화, §24/§75 분리, nav.occupationalHealth 라벨충돌

■ 세션 메모
- 작업 방식: Claude Code 명령은 한 번에 하나씩, 응답 받고 다음 명령. 제거는 항목별 커밋 분리.
- 화면 확인이 orphan 판정 보강에 유효했음(PermitReportTab:259는 화면 확인 중 발견).
- 토큰 만료 조회 문제 별도 수정·커밋(008e211 fix(auth) 401/403) — 숭이 직접 처리, 제거 트랙과 무관.
- 미push 로컬 커밋 다수 존재. push 여부 미결정.

=== 백엔드 orphan 코드 제거 (2026-06-22, HEAD=592cfdd) ===

■ 🟡 백엔드 orphan 코드 제거 — 완료 (테이블 DROP은 미실행)
- [완료] clean 3묶음 — 2097f1b (-1720 lines, 26 files)
  · EhsKpiPlan / HazardFactor / WorkplaceMeasurement(+Detail)
  · controller/service/mapper(+xml)/model/dto 전체. 프론트0·라이브0·외부FK0.
- [완료] Checklist 2묶음 + 공유 ExcelService — 592cfdd (-1619 lines, 21 files)
  · ChecklistTemplate(Master/Item) + ChecklistResult(Master/Item) + ChecklistExcelService
  · 🔴 보존(이름 유사 라이브): ChecklistTemplate(단수 model) /
    ChecklistTemplateResponse / ChecklistTemplateBatchSaveRequest — ChecklistController가 사용
  · 화이트리스트 삭제로 라이브 클래스 분리, compileJava 통과

■ 런타임 검증 — 통과
- 백엔드 재기동: Started 정상(6s), 삭제 클래스 관련 에러 0건.
- 라이브 /checklist/templates → 200, orphan 5경로(/checklist-templates·/checklist-results·
  /ehs-kpi-plan·/hazard-factors·/workplace-measurement) → 404(의도된 결과).
- 프론트 라이브 화면(체크리스트 등) 정상 동작 확인.
- ※ 검증 중 로그인 500 발생 → 원인은 백엔드 미기동(서버 종료 상태)일 뿐, 삭제와 무관 확정.

■ 다음 단계 — 테이블 DROP (인프라 설치 후, 미착수)
- DROP 대상 테이블(코드는 제거됐으나 테이블 존치):
  tb_ehs_kpi_plan, tb_hazard_factor, tb_workplace_measurement(_detail),
  tb_checklist_template_master/_item, tb_checklist_result_master/_item
- ⚠️ 선행확인 필수: SchemaInitializer류 자동 테이블 재생성 여부.
  초기화기가 재기동 시 테이블을 부활시키면 DROP SQL만으론 부족 → 초기화기도 함께 비활성화 필요.
- Checklist 테이블 DROP은 item → master 순(또는 ON DELETE CASCADE 의존, V17).
- 운영본 실데이터 없음 확인 후 DROP(되돌릴 수 없음).

■ 참고 — 기존부터 있던 startup WARN (이번 작업 무관, 추후 점검 후보)
- PersonRefColumnsInitializer WARN 2건:
  tb_legal_compliance_plan.modified_by, tb_od_plan.created_by 컬럼명 mismatch.
