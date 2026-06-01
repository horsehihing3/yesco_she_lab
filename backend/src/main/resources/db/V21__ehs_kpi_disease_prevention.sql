-- =====================================================
-- V21: EHS KPI 계획/목표 + 질병 예방 모듈
-- =====================================================

-- ===== 1. Code Groups =====

-- KPI_INDICATOR_TYPE (선행/후행)
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'KPI_INDICATOR_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('KPI_INDICATOR_TYPE', N'KPI 지표 유형', N'선행/후행 지표 유형', 1, 740, GETDATE(), GETDATE());
END;
DECLARE @kpiTypeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'KPI_INDICATOR_TYPE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @kpiTypeId AND code = 'LEADING')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@kpiTypeId, 'LEADING',  'LEADING',  N'선행지표', 'Leading Indicator',  N'先行指标', 1, 1, GETDATE(), GETDATE()),
    (@kpiTypeId, 'LAGGING',  'LAGGING',  N'후행지표', 'Lagging Indicator',  N'滞后指标', 1, 2, GETDATE(), GETDATE());
END;

-- KPI_PERIOD
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'KPI_PERIOD')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('KPI_PERIOD', N'KPI 주기', N'KPI 측정 주기', 1, 741, GETDATE(), GETDATE());
END;
DECLARE @kpiPeriodId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'KPI_PERIOD');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @kpiPeriodId AND code = 'MONTHLY')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@kpiPeriodId, 'MONTHLY',   'MONTHLY',   N'월간',   'Monthly',   N'月度', 1, 1, GETDATE(), GETDATE()),
    (@kpiPeriodId, 'QUARTERLY', 'QUARTERLY', N'분기',   'Quarterly', N'季度', 1, 2, GETDATE(), GETDATE()),
    (@kpiPeriodId, 'YEARLY',    'YEARLY',    N'연간',   'Yearly',    N'年度', 1, 3, GETDATE(), GETDATE());
END;

-- KPI_STATUS
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'KPI_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('KPI_STATUS', N'KPI 상태', N'KPI 달성 상태', 1, 742, GETDATE(), GETDATE());
END;
DECLARE @kpiStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'KPI_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @kpiStatusId AND code = 'ON_TRACK')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@kpiStatusId, 'ON_TRACK',  'ON_TRACK',  N'정상',     'On Track',  N'正常', 1, 1, GETDATE(), GETDATE()),
    (@kpiStatusId, 'AT_RISK',   'AT_RISK',   N'주의',     'At Risk',   N'注意', 1, 2, GETDATE(), GETDATE()),
    (@kpiStatusId, 'OFF_TRACK', 'OFF_TRACK', N'미달',     'Off Track', N'未达', 1, 3, GETDATE(), GETDATE()),
    (@kpiStatusId, 'ACHIEVED',  'ACHIEVED',  N'달성',     'Achieved',  N'达成', 1, 4, GETDATE(), GETDATE());
END;

-- DISEASE_HAZARD_TYPE
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'DISEASE_HAZARD_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('DISEASE_HAZARD_TYPE', N'유해인자 유형', N'질병 예방 유해인자 유형', 1, 750, GETDATE(), GETDATE());
END;
DECLARE @hazardTypeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'DISEASE_HAZARD_TYPE');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @hazardTypeId AND code = 'CHEMICAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@hazardTypeId, 'CHEMICAL',      'CHEMICAL',      N'화학적',       'Chemical',       N'化学性', 1, 1, GETDATE(), GETDATE()),
    (@hazardTypeId, 'PHYSICAL',      'PHYSICAL',      N'물리적',       'Physical',       N'物理性', 1, 2, GETDATE(), GETDATE()),
    (@hazardTypeId, 'BIOLOGICAL',    'BIOLOGICAL',    N'생물학적',     'Biological',     N'生物性', 1, 3, GETDATE(), GETDATE()),
    (@hazardTypeId, 'ERGONOMIC',     'ERGONOMIC',     N'인간공학적',   'Ergonomic',      N'人因工程', 1, 4, GETDATE(), GETDATE()),
    (@hazardTypeId, 'PSYCHOSOCIAL',  'PSYCHOSOCIAL',  N'심리사회적',   'Psychosocial',   N'心理社会', 1, 5, GETDATE(), GETDATE());
END;

-- DISEASE_RISK_LEVEL
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'DISEASE_RISK_LEVEL')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('DISEASE_RISK_LEVEL', N'질병 위험도', N'질병 예방 위험 수준', 1, 751, GETDATE(), GETDATE());
END;
DECLARE @diseaseRiskId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'DISEASE_RISK_LEVEL');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @diseaseRiskId AND code = 'LOW')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@diseaseRiskId, 'LOW',      'LOW',      N'저위험',   'Low',      N'低风险', 1, 1, GETDATE(), GETDATE()),
    (@diseaseRiskId, 'MEDIUM',   'MEDIUM',   N'중위험',   'Medium',   N'中风险', 1, 2, GETDATE(), GETDATE()),
    (@diseaseRiskId, 'HIGH',     'HIGH',     N'고위험',   'High',     N'高风险', 1, 3, GETDATE(), GETDATE()),
    (@diseaseRiskId, 'CRITICAL', 'CRITICAL', N'심각',     'Critical', N'严重',   1, 4, GETDATE(), GETDATE());
END;

-- DISEASE_PREVENTION_STATUS
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'DISEASE_PREV_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('DISEASE_PREV_STATUS', N'질병 예방 상태', N'질병 예방 관리 상태', 1, 752, GETDATE(), GETDATE());
END;
DECLARE @diseasePrevStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'DISEASE_PREV_STATUS');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @diseasePrevStatusId AND code = 'MONITORING')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@diseasePrevStatusId, 'MONITORING',  'MONITORING',  N'모니터링',   'Monitoring',  N'监测中',   1, 1, GETDATE(), GETDATE()),
    (@diseasePrevStatusId, 'ACTION',      'ACTION',      N'조치중',     'In Action',   N'处理中',   1, 2, GETDATE(), GETDATE()),
    (@diseasePrevStatusId, 'RESOLVED',    'RESOLVED',    N'해결',       'Resolved',    N'已解决',   1, 3, GETDATE(), GETDATE()),
    (@diseasePrevStatusId, 'CLOSED',      'CLOSED',      N'종결',       'Closed',      N'已关闭',   1, 4, GETDATE(), GETDATE());
END;

-- KPI_UNIT
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'KPI_UNIT')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('KPI_UNIT', N'KPI 단위', N'KPI 지표 측정 단위', 1, 743, GETDATE(), GETDATE());
END;
DECLARE @kpiUnitId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'KPI_UNIT');
IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @kpiUnitId AND code = 'PERCENT')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) VALUES
    (@kpiUnitId, 'PERCENT', '%',    N'%',      '%',        N'%',    1, 1, GETDATE(), GETDATE()),
    (@kpiUnitId, 'COUNT',   N'건',  N'건',     'Cases',    N'件',   1, 2, GETDATE(), GETDATE()),
    (@kpiUnitId, 'TIMES',   N'회',  N'회',     'Times',    N'次',   1, 3, GETDATE(), GETDATE()),
    (@kpiUnitId, 'DAYS',    N'일',  N'일',     'Days',     N'天',   1, 4, GETDATE(), GETDATE()),
    (@kpiUnitId, 'HOURS',   N'시간', N'시간',   'Hours',    N'小时', 1, 5, GETDATE(), GETDATE()),
    (@kpiUnitId, 'SCORE',   N'점',  N'점',     'Score',    N'分',   1, 6, GETDATE(), GETDATE()),
    (@kpiUnitId, 'RATE',    N'율',  N'율',     'Rate',     N'率',   1, 7, GETDATE(), GETDATE()),
    (@kpiUnitId, 'PPM',     'ppm', N'ppm',    'ppm',      N'ppm',  1, 8, GETDATE(), GETDATE());
END;

-- ===== 2. Tables =====

-- tb_ehs_kpi_plan
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_ehs_kpi_plan')
BEGIN
    CREATE TABLE tb_ehs_kpi_plan (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        plan_year           INT NOT NULL,
        indicator_type      NVARCHAR(30) NOT NULL,
        indicator_name      NVARCHAR(200) NOT NULL,
        description         NVARCHAR(500),
        department          NVARCHAR(100),
        responsible_person  NVARCHAR(50),
        measurement_period  NVARCHAR(30) DEFAULT 'MONTHLY',
        unit                NVARCHAR(30),
        target_value        DECIMAL(12,2),
        current_value       DECIMAL(12,2),
        achievement_rate    DECIMAL(5,2),
        status              NVARCHAR(30) DEFAULT 'ON_TRACK',
        start_date          DATE,
        end_date            DATE,
        notes               NVARCHAR(1000),
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- tb_disease_prevention
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_disease_prevention')
BEGIN
    CREATE TABLE tb_disease_prevention (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        case_id             NVARCHAR(30) NOT NULL,
        hazard_type         NVARCHAR(30) NOT NULL,
        hazard_name         NVARCHAR(200) NOT NULL,
        description         NVARCHAR(1000),
        affected_area       NVARCHAR(200),
        affected_workers    INT,
        risk_level          NVARCHAR(30) DEFAULT 'LOW',
        exposure_level      NVARCHAR(100),
        prevention_measure  NVARCHAR(1000),
        responsible_person  NVARCHAR(50),
        responsible_dept    NVARCHAR(100),
        assessment_date     DATE,
        next_assessment     DATE,
        status              NVARCHAR(30) DEFAULT 'MONITORING',
        notes               NVARCHAR(1000),
        deleted             BIT NOT NULL DEFAULT 0,
        created_at          DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at         DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- ===== 3. Dummy Data =====

DELETE FROM tb_ehs_kpi_plan;
DELETE FROM tb_disease_prevention;

-- KPI Plans
INSERT INTO tb_ehs_kpi_plan (plan_year, indicator_type, indicator_name, description, department, responsible_person, measurement_period, unit, target_value, current_value, achievement_rate, status, start_date, end_date) VALUES
(2026, 'LEADING', N'안전교육 이수율',           N'전 직원 안전교육 이수 비율',             N'안전환경팀', N'김안전', 'MONTHLY',   'PERCENT', 95.00,  88.50, 93.16, 'ON_TRACK',  '2026-01-01', '2026-12-31'),
(2026, 'LEADING', N'위험성평가 완료율',         N'연간 위험성평가 계획 대비 완료율',       N'안전환경팀', N'이평가', 'QUARTERLY', 'PERCENT',100.00,  75.00, 75.00, 'AT_RISK',   '2026-01-01', '2026-12-31'),
(2026, 'LEADING', N'안전점검 실시율',           N'월간 안전점검 계획 대비 실시율',         N'안전환경팀', N'박점검', 'MONTHLY',   'PERCENT',100.00,  92.00, 92.00, 'ON_TRACK',  '2026-01-01', '2026-12-31'),
(2026, 'LEADING', N'아차사고 보고 건수',         N'아차사고 자율 보고 활성화 목표',         N'전사',       N'김안전', 'MONTHLY',   'COUNT',  50.00,  38.00, 76.00, 'AT_RISK',   '2026-01-01', '2026-12-31'),
(2026, 'LEADING', N'비상훈련 실시 횟수',         N'연간 비상대응 훈련 실시 목표',           N'안전환경팀', N'최훈련', 'QUARTERLY', 'TIMES',  12.00,   8.00, 66.67, 'OFF_TRACK', '2026-01-01', '2026-12-31'),
(2026, 'LAGGING', N'재해율',                     N'연간 산업재해 발생률',                   N'안전환경팀', N'김안전', 'YEARLY',    'PERCENT', 0.50,   0.30, 100.00,'ACHIEVED',  '2026-01-01', '2026-12-31'),
(2026, 'LAGGING', N'도수율(FR)',                  N'백만 근로시간당 재해 건수',              N'안전환경팀', N'김안전', 'YEARLY',    'COUNT',   2.00,   1.20, 100.00,'ACHIEVED',  '2026-01-01', '2026-12-31'),
(2026, 'LAGGING', N'강도율(SR)',                  N'천 근로시간당 근로 손실일수',            N'안전환경팀', N'김안전', 'YEARLY',    'DAYS',    0.50,   0.25, 100.00,'ACHIEVED',  '2026-01-01', '2026-12-31'),
(2026, 'LAGGING', N'환경법규 위반 건수',          N'연간 환경법규 위반 Zero 목표',           N'환경팀',     N'박환경', 'YEARLY',    'COUNT',   0.00,   0.00, 100.00,'ACHIEVED',  '2026-01-01', '2026-12-31'),
(2026, 'LAGGING', N'직업병 발생 건수',            N'연간 직업병 발생 건수 목표',             N'보건팀',     N'이보건', 'YEARLY',    'COUNT',   0.00,   1.00,  0.00, 'OFF_TRACK', '2026-01-01', '2026-12-31');

-- Disease Prevention
INSERT INTO tb_disease_prevention (case_id, hazard_type, hazard_name, description, affected_area, affected_workers, risk_level, exposure_level, prevention_measure, responsible_person, responsible_dept, assessment_date, next_assessment, status) VALUES
('DP-2026-001', 'CHEMICAL',     N'유기용제 노출',              N'도장작업 시 유기용제(톨루엔, 자일렌) 흡입 노출',                N'도장동',       12, 'HIGH',     N'TWA 50ppm',     N'국소배기장치 설치, 방독마스크 착용, 작업시간 제한',               N'김보건', N'보건팀', '2026-03-15', '2026-06-15', 'ACTION'),
('DP-2026-002', 'PHYSICAL',     N'소음성 난청 위험',            N'프레스 작업장 소음 90dB 이상 노출',                              N'프레스동',     8,  'HIGH',     N'92dB(A)',       N'방음 보호구 착용, 소음 차폐벽 설치, 작업 로테이션',              N'이안전', N'안전팀', '2026-02-20', '2026-05-20', 'MONITORING'),
('DP-2026-003', 'BIOLOGICAL',   N'감염병 예방관리',             N'폐수처리장 작업자 생물학적 유해인자 노출',                       N'환경동',       5,  'MEDIUM',   N'작업환경측정 B', N'예방접종, 개인보호구 착용, 작업 후 세척 의무화',                  N'박보건', N'보건팀', '2026-01-10', '2026-07-10', 'MONITORING'),
('DP-2026-004', 'ERGONOMIC',    N'근골격계 질환 예방',          N'반복작업(조립라인) 근골격계 부담 작업',                          N'조립동',       25, 'HIGH',     N'RULA 7점',      N'작업대 높이 조절, 스트레칭 프로그램, 작업 순환제',                N'최예방', N'보건팀', '2026-03-01', '2026-06-01', 'ACTION'),
('DP-2026-005', 'PSYCHOSOCIAL', N'직무 스트레스 관리',          N'교대근무 및 야간작업자 심리사회적 건강 관리',                    N'생산동 전체',  45, 'MEDIUM',   N'직무스트레스 상', N'EAP 프로그램, 심리상담 서비스, 근무시간 조정',                   N'김상담', N'인사팀', '2026-02-15', '2026-08-15', 'MONITORING'),
('DP-2026-006', 'CHEMICAL',     N'분진 노출 관리',              N'용접작업 시 금속 흄(용접 분진) 노출',                            N'용접동',       15, 'HIGH',     N'TWA 5mg/m3',    N'국소배기장치 강화, 방진마스크 착용, 건강검진 강화',              N'이보건', N'보건팀', '2026-03-20', '2026-06-20', 'ACTION'),
('DP-2026-007', 'PHYSICAL',     N'진동장해 예방',               N'그라인더 작업 시 국소진동 노출',                                 N'연마동',       6,  'MEDIUM',   N'4.2m/s2',       N'방진장갑 착용, 작업시간 제한(2시간/일), 진동 저감 공구 교체',    N'박안전', N'안전팀', '2026-01-25', '2026-07-25', 'RESOLVED'),
('DP-2026-008', 'ERGONOMIC',    N'중량물 취급 관리',            N'자재창고 수동 운반작업(25kg 이상)',                              N'물류동',       10, 'MEDIUM',   N'최대 30kg',     N'보조 기구 도입, 2인 1조 작업, 인력운반 기준 교육',               N'최물류', N'물류팀', '2026-02-28', '2026-05-28', 'MONITORING'),
('DP-2026-009', 'PSYCHOSOCIAL', N'감정노동 관리',               N'고객응대 직원 감정노동 스트레스',                                N'고객센터',     20, 'MEDIUM',   N'감정노동 중',   N'휴게시간 보장, 감정노동 보호 교육, 심리상담 제공',               N'김인사', N'인사팀', '2026-03-10', '2026-09-10', 'MONITORING'),
('DP-2026-010', 'BIOLOGICAL',   N'레지오넬라 예방',             N'냉각탑 관리 작업자 레지오넬라균 노출 위험',                      N'유틸리티동',   3,  'LOW',      N'검출 미만',     N'냉각탑 정기 소독, 수질검사 월 1회, 보호구 착용',                 N'박시설', N'시설팀', '2026-01-15', '2026-07-15', 'RESOLVED');
