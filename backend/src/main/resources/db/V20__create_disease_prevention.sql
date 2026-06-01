-- ===== 질병예방 유해인자 관리 테이블 =====

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_hazard_factor' AND xtype='U')
BEGIN
CREATE TABLE tb_hazard_factor (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    hazard_type NVARCHAR(20) NOT NULL,        -- CHEMICAL, PHYSICAL, BIOLOGICAL, ERGONOMIC, PSYCHOSOCIAL
    factor_name NVARCHAR(200) NOT NULL,        -- 유해인자명
    category NVARCHAR(100),                    -- 구분/유형 (유기화합물, 소음, 세균 등)
    process NVARCHAR(200),                     -- 노출공정/작업공정
    risk_level NVARCHAR(20),                   -- VERY_HIGH, HIGH, MEDIUM, LOW

    -- 측정/평가 관련
    measured_value NVARCHAR(100),              -- 측정값 (TWA 0.48ppm, 92.5dB 등)
    exposure_standard NVARCHAR(100),           -- 노출기준
    assessment_method NVARCHAR(100),           -- 평가방법 (RULA, KOSS 등) - 인간공학/심리사회적용
    assessment_score NVARCHAR(50),             -- 평가점수

    -- 화학적 전용
    cas_number NVARCHAR(50),                   -- CAS번호

    -- 생물학적 전용
    exposure_route NVARCHAR(100),              -- 노출경로 (호흡기, 접촉 등)
    vaccination_status NVARCHAR(50),           -- 예방접종 상태 (COMPLETED, PARTIAL, NOT_REQUIRED)

    -- 심리사회적 전용
    target_group NVARCHAR(200),               -- 주요 대상
    target_count INT,                          -- 대상 인원
    high_risk_count INT,                       -- 고위험군 수

    -- 예방조치
    prevention_status NVARCHAR(20),            -- COMPLETED, IN_PROGRESS, PLANNED, NOT_STARTED
    prevention_detail NVARCHAR(MAX),           -- 예방조치 상세
    prevention_rate INT DEFAULT 0,             -- 완료율(%)

    -- 공통
    last_check_date DATE,                      -- 최근 조치/점검일
    manager_name NVARCHAR(100),                -- 담당자
    manager_dept NVARCHAR(100),                -- 담당부서
    remarks NVARCHAR(MAX),                     -- 비고
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- ===== Code Group: HAZARD_TYPE (유해인자 유형) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'HAZARD_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('HAZARD_TYPE', N'유해인자 유형', N'질병예방 유해인자 유형 코드', 1, 2000, GETDATE(), GETDATE());
END;

DECLARE @hazardTypeGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'HAZARD_TYPE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @hazardTypeGroupId AND code = 'CHEMICAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@hazardTypeGroupId, 'CHEMICAL',     'CHEMICAL',     N'화학적',       'Chemical',     N'化学性', 1, 1, GETDATE(), GETDATE()),
    (@hazardTypeGroupId, 'PHYSICAL',     'PHYSICAL',     N'물리적',       'Physical',     N'物理性', 1, 2, GETDATE(), GETDATE()),
    (@hazardTypeGroupId, 'BIOLOGICAL',   'BIOLOGICAL',   N'생물학적',     'Biological',   N'生物性', 1, 3, GETDATE(), GETDATE()),
    (@hazardTypeGroupId, 'ERGONOMIC',    'ERGONOMIC',    N'인간공학적',   'Ergonomic',    N'人因工程', 1, 4, GETDATE(), GETDATE()),
    (@hazardTypeGroupId, 'PSYCHOSOCIAL', 'PSYCHOSOCIAL', N'심리사회적',   'Psychosocial', N'心理社会', 1, 5, GETDATE(), GETDATE());
END;

-- ===== Code Group: HAZARD_RISK_LEVEL (유해인자 위험도) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'HAZARD_RISK_LEVEL')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('HAZARD_RISK_LEVEL', N'유해인자 위험도', N'유해인자 위험도 등급 코드', 1, 2001, GETDATE(), GETDATE());
END;

DECLARE @hazardRiskGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'HAZARD_RISK_LEVEL');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @hazardRiskGroupId AND code = 'VERY_HIGH')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@hazardRiskGroupId, 'VERY_HIGH', 'VERY_HIGH', N'매우높음', 'Very High', N'非常高', 1, 1, GETDATE(), GETDATE()),
    (@hazardRiskGroupId, 'HIGH',      'HIGH',      N'높음',     'High',      N'高',     1, 2, GETDATE(), GETDATE()),
    (@hazardRiskGroupId, 'MEDIUM',    'MEDIUM',    N'보통',     'Medium',    N'中',     1, 3, GETDATE(), GETDATE()),
    (@hazardRiskGroupId, 'LOW',       'LOW',       N'낮음',     'Low',       N'低',     1, 4, GETDATE(), GETDATE());
END;

-- ===== Code Group: PREVENTION_STATUS (예방조치 상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'PREVENTION_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('PREVENTION_STATUS', N'예방조치 상태', N'예방조치 진행 상태 코드', 1, 2002, GETDATE(), GETDATE());
END;

DECLARE @preventionStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'PREVENTION_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @preventionStatusGroupId AND code = 'COMPLETED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@preventionStatusGroupId, 'COMPLETED',   'COMPLETED',   N'완료',     'Completed',   N'已完成', 1, 1, GETDATE(), GETDATE()),
    (@preventionStatusGroupId, 'IN_PROGRESS', 'IN_PROGRESS', N'진행중',   'In Progress', N'进行中', 1, 2, GETDATE(), GETDATE()),
    (@preventionStatusGroupId, 'PLANNED',     'PLANNED',     N'계획',     'Planned',     N'已计划', 1, 3, GETDATE(), GETDATE()),
    (@preventionStatusGroupId, 'NOT_STARTED', 'NOT_STARTED', N'미착수',   'Not Started', N'未开始', 1, 4, GETDATE(), GETDATE());
END;

-- ===== Dummy Data: CHEMICAL (화학적 유해인자) =====
INSERT INTO tb_hazard_factor (hazard_type, factor_name, category, process, risk_level, measured_value, exposure_standard, cas_number, prevention_status, prevention_detail, prevention_rate, last_check_date, manager_name, manager_dept, remarks)
VALUES
(N'CHEMICAL', N'벤젠', N'유기화합물', N'도장공정', N'VERY_HIGH', N'TWA 0.48ppm', N'1ppm', N'71-43-2', N'IN_PROGRESS', N'국소배기장치 설치, 보호구 착용 의무화, 작업환경측정 분기 실시', 65, '2026-03-15', N'김안전', N'안전환경팀', N'특별관리물질, 발암성 1A'),
(N'CHEMICAL', N'톨루엔', N'유기화합물', N'도장공정', N'HIGH', N'TWA 18.5ppm', N'50ppm', N'108-88-3', N'IN_PROGRESS', N'환기시설 보강, 유기용제용 방독마스크 지급', 50, '2026-03-15', N'김안전', N'안전환경팀', N'생식독성물질'),
(N'CHEMICAL', N'납 및 그 무기화합물', N'금속류', N'용접공정', N'HIGH', N'TWA 0.03mg/m³', N'0.05mg/m³', N'7439-92-1', N'PLANNED', N'국소배기장치 점검, 혈중납 정기검사', 30, '2026-02-20', N'이보건', N'보건관리팀', N'특수건강진단 대상'),
(N'CHEMICAL', N'크롬 및 그 화합물', N'금속류', N'도금공정', N'MEDIUM', N'TWA 0.008mg/m³', N'0.05mg/m³', N'7440-47-3', N'COMPLETED', N'밀폐설비 구축, 보호구 착용, 작업환경측정 완료', 100, '2026-03-10', N'이보건', N'보건관리팀', NULL),
(N'CHEMICAL', N'황산', N'산류', N'세척공정', N'LOW', N'TWA 0.05mg/m³', N'1mg/m³', N'7664-93-9', N'COMPLETED', N'내산성 보호구 비치, 세안설비 설치', 100, '2026-01-15', N'박환경', N'안전환경팀', NULL),
(N'CHEMICAL', N'메틸에틸케톤(MEK)', N'유기화합물', N'도장공정', N'MEDIUM', N'TWA 52ppm', N'200ppm', N'78-93-3', N'IN_PROGRESS', N'환기시설 가동, 유기용제용 보호구 지급', 70, '2026-03-15', N'김안전', N'안전환경팀', NULL),
(N'CHEMICAL', N'수산화나트륨', N'알칼리류', N'세척공정', N'LOW', N'TWA 0.5mg/m³', N'2mg/m³', N'1310-73-2', N'COMPLETED', N'내알칼리성 보호구 비치, 안전교육 실시', 100, '2026-02-10', N'박환경', N'안전환경팀', NULL);

-- ===== Dummy Data: PHYSICAL (물리적 유해인자) =====
INSERT INTO tb_hazard_factor (hazard_type, factor_name, category, process, risk_level, measured_value, exposure_standard, prevention_status, prevention_detail, prevention_rate, last_check_date, manager_name, manager_dept, remarks)
VALUES
(N'PHYSICAL', N'소음', N'소음', N'도장공정', N'VERY_HIGH', N'92.5dB(A)', N'90dB(A)', N'IN_PROGRESS', N'방음보호구 착용 의무화, 소음저감장치 설치 예정, 청력보존프로그램 운영', 60, '2026-03-20', N'김안전', N'안전환경팀', N'청력보존프로그램 대상'),
(N'PHYSICAL', N'소음', N'소음', N'조립라인A', N'MEDIUM', N'82.3dB(A)', N'90dB(A)', N'COMPLETED', N'방음보호구 비치, 정기 소음측정 실시', 100, '2026-03-20', N'김안전', N'안전환경팀', NULL),
(N'PHYSICAL', N'진동', N'진동', N'연마공정', N'HIGH', N'4.2m/s²', N'5m/s²', N'IN_PROGRESS', N'방진장갑 지급, 진동공구 교체 검토, 작업시간 제한', 55, '2026-03-10', N'이보건', N'보건관리팀', N'국소진동 노출'),
(N'PHYSICAL', N'고열', N'이상기온', N'열처리공정', N'HIGH', N'WBGT 30.2℃', N'WBGT 30℃', N'IN_PROGRESS', N'냉방장치 보강, 온열질환 예방교육, 휴식시간 확보', 45, '2026-03-25', N'박환경', N'안전환경팀', N'여름철 특별관리'),
(N'PHYSICAL', N'방사선', N'방사선', N'비파괴검사', N'MEDIUM', N'연간 8.5mSv', N'연간 50mSv', N'COMPLETED', N'방사선 차폐설비, 개인선량계 착용, 정기검진', 100, '2026-02-28', N'이보건', N'보건관리팀', N'방사선작업종사자 등록');

-- ===== Dummy Data: BIOLOGICAL (생물학적 유해인자) =====
INSERT INTO tb_hazard_factor (hazard_type, factor_name, category, process, risk_level, exposure_route, vaccination_status, prevention_status, prevention_detail, prevention_rate, last_check_date, manager_name, manager_dept, remarks)
VALUES
(N'BIOLOGICAL', N'B형간염 바이러스', N'바이러스', N'의료폐기물 처리', N'HIGH', N'혈액매개', N'COMPLETED', N'IN_PROGRESS', N'예방접종 완료, 감염예방 교육, 개인보호구 착용', 80, '2026-03-01', N'이보건', N'보건관리팀', N'혈액매개 감염병'),
(N'BIOLOGICAL', N'인플루엔자 바이러스', N'바이러스', N'사무실/현장 공통', N'MEDIUM', N'호흡기(비말)', N'PARTIAL', N'IN_PROGRESS', N'계절독감 예방접종 권장, 마스크 비치, 환기관리', 60, '2026-03-15', N'이보건', N'보건관리팀', N'유행시기 관리 강화'),
(N'BIOLOGICAL', N'파상풍균', N'세균', N'용접/절단공정', N'MEDIUM', N'접촉(상처)', N'COMPLETED', N'COMPLETED', N'예방접종 실시, 상처관리 교육, 응급처치키트 비치', 100, '2026-02-15', N'박환경', N'안전환경팀', N'외상 위험 작업자 대상'),
(N'BIOLOGICAL', N'곰팡이(진균)', N'진균', N'지하작업장', N'MEDIUM', N'호흡기(공기매개)', N'NOT_REQUIRED', N'IN_PROGRESS', N'환기시설 점검, 습도관리, 방진마스크 지급', 50, '2026-03-10', N'박환경', N'안전환경팀', N'습도 높은 작업장 관리'),
(N'BIOLOGICAL', N'레지오넬라균', N'세균', N'냉각탑 관리', N'LOW', N'호흡기(에어로졸)', N'NOT_REQUIRED', N'COMPLETED', N'냉각탑 정기 청소·소독, 수질검사 실시', 100, '2026-01-20', N'박환경', N'안전환경팀', N'냉각탑 분기별 점검');

-- ===== Dummy Data: ERGONOMIC (인간공학적 유해인자) =====
INSERT INTO tb_hazard_factor (hazard_type, factor_name, category, process, risk_level, assessment_method, assessment_score, prevention_status, prevention_detail, prevention_rate, last_check_date, manager_name, manager_dept, remarks)
VALUES
(N'ERGONOMIC', N'반복집기동작', N'반복동작', N'조립라인A', N'VERY_HIGH', N'RULA', N'6점 (조치수준 3)', N'IN_PROGRESS', N'작업대 높이 조절, 자동화설비 도입 검토, 작업순환제 실시', 40, '2026-03-20', N'이보건', N'보건관리팀', N'근골격계 유해요인조사 대상'),
(N'ERGONOMIC', N'중량물 취급', N'중량물', N'물류창고', N'HIGH', N'NIOSH', N'LI 1.8', N'IN_PROGRESS', N'리프트 보조장비 도입, 중량물 취급 교육, 2인 1조 작업', 55, '2026-03-15', N'이보건', N'보건관리팀', N'25kg 이상 중량물'),
(N'ERGONOMIC', N'VDT 작업', N'정적자세', N'사무직', N'MEDIUM', N'RULA', N'3점 (조치수준 1)', N'COMPLETED', N'모니터 높이 조절, 인체공학 의자 지급, 스트레칭 프로그램', 100, '2026-02-28', N'박환경', N'안전환경팀', N'사무직 전원 대상'),
(N'ERGONOMIC', N'부적절한 작업자세', N'부자연스러운자세', N'용접공정', N'HIGH', N'OWAS', N'Action Category 3', N'IN_PROGRESS', N'용접지그 개선, 작업자세 교육, 보조도구 지급', 35, '2026-03-10', N'이보건', N'보건관리팀', N'장시간 고정자세 작업'),
(N'ERGONOMIC', N'접촉스트레스', N'접촉스트레스', N'조립라인B', N'MEDIUM', N'RULA', N'4점 (조치수준 2)', N'PLANNED', N'작업공구 손잡이 개선, 패딩 처리, 작업순환', 20, '2026-03-05', N'이보건', N'보건관리팀', N'손·손목 부위 접촉');

-- ===== Dummy Data: PSYCHOSOCIAL (심리사회적 유해인자) =====
INSERT INTO tb_hazard_factor (hazard_type, factor_name, category, process, risk_level, assessment_method, assessment_score, target_group, target_count, high_risk_count, prevention_status, prevention_detail, prevention_rate, last_check_date, manager_name, manager_dept, remarks)
VALUES
(N'PSYCHOSOCIAL', N'직무 스트레스', N'직무스트레스', N'생산직 전체', N'HIGH', N'KOSS', N'상위 25%', N'생산직 근로자', 320, 45, N'IN_PROGRESS', N'스트레스 관리 프로그램 운영, EAP 상담, 근무환경 개선', 50, '2026-03-25', N'이보건', N'보건관리팀', N'연 1회 정기 평가'),
(N'PSYCHOSOCIAL', N'감정노동', N'감정노동', N'고객대응업무', N'HIGH', N'감정노동평가', N'고위험', N'고객상담 직원', 45, 12, N'IN_PROGRESS', N'감정노동 보호조치, 힐링프로그램, 고충처리 창구 운영', 55, '2026-03-20', N'이보건', N'보건관리팀', N'산안법 제41조 대상'),
(N'PSYCHOSOCIAL', N'직장 내 괴롭힘', N'직장내괴롭힘', N'전 부서', N'MEDIUM', N'설문조사', N'주의 수준', N'전체 임직원', 850, 8, N'IN_PROGRESS', N'예방교육 실시, 신고센터 운영, 사내규정 정비', 70, '2026-03-15', N'박환경', N'인사팀', N'근로기준법 제76조의2'),
(N'PSYCHOSOCIAL', N'과로(장시간근로)', N'과로', N'교대근무조', N'HIGH', N'근로시간분석', N'월 평균 52시간 초과', N'교대근무 근로자', 180, 28, N'IN_PROGRESS', N'근무시간 관리체계 구축, 교대제 개편 검토, 건강검진 강화', 40, '2026-03-20', N'박환경', N'인사팀', N'주 52시간 초과 모니터링'),
(N'PSYCHOSOCIAL', N'번아웃(소진)', N'소진', N'관리직', N'MEDIUM', N'MBI', N'중간 수준', N'관리직 직원', 120, 15, N'PLANNED', N'리더십 교육, 업무량 재조정, 휴가 사용 촉진', 25, '2026-02-28', N'이보건', N'보건관리팀', N'관리직 대상 시범 실시');
