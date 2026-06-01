-- =====================================================
-- V29: Work Environment Measurement (작업환경 측정)
-- Tables: tb_wem_plan, tb_wem_factor, tb_wem_result, tb_wem_improvement
-- =====================================================

-- ===== Table 1: tb_wem_plan (측정계획) =====
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_wem_plan' AND xtype='U')
BEGIN
CREATE TABLE tb_wem_plan (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_year INT NOT NULL DEFAULT 2026,
    process_name NVARCHAR(200) NOT NULL,
    department NVARCHAR(100),
    hazard_type NVARCHAR(50),
    measurement_cycle NVARCHAR(20),
    last_measurement_date DATE,
    next_measurement_date DATE,
    status NVARCHAR(20) DEFAULT 'PLANNED',
    measurement_agency NVARCHAR(200),
    agency_code NVARCHAR(50),
    contract_period NVARCHAR(100),
    remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- ===== Table 2: tb_wem_factor (유해인자) =====
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_wem_factor' AND xtype='U')
BEGIN
CREATE TABLE tb_wem_factor (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    factor_name NVARCHAR(200) NOT NULL,
    factor_name_en NVARCHAR(200),
    cas_number NVARCHAR(50),
    factor_type NVARCHAR(50),
    twa NVARCHAR(50),
    stel NVARCHAR(50),
    ceiling_value NVARCHAR(50),
    unit NVARCHAR(20),
    msds_linked BIT DEFAULT 0,
    is_permitted BIT DEFAULT 0,
    used_process NVARCHAR(200),
    remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- ===== Table 3: tb_wem_result (측정결과) =====
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_wem_result' AND xtype='U')
BEGIN
CREATE TABLE tb_wem_result (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    process_name NVARCHAR(200) NOT NULL,
    factor_name NVARCHAR(200) NOT NULL,
    sample_type NVARCHAR(20),
    measured_value NVARCHAR(50),
    twa_value NVARCHAR(50),
    stel_value NVARCHAR(50),
    exposure_standard NVARCHAR(50),
    exceed_rate INT,
    judgment NVARCHAR(20),
    has_report BIT DEFAULT 0,
    measurement_date DATE,
    measurement_agency NVARCHAR(200),
    remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- ===== Table 4: tb_wem_improvement (초과·개선) =====
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_wem_improvement' AND xtype='U')
BEGIN
CREATE TABLE tb_wem_improvement (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    process_name NVARCHAR(200) NOT NULL,
    factor_name NVARCHAR(200) NOT NULL,
    measured_value NVARCHAR(50),
    exposure_standard NVARCHAR(50),
    exceed_rate INT,
    exceed_level NVARCHAR(20),
    department NVARCHAR(100),
    measurement_date DATE,
    measurement_agency NVARCHAR(200),
    deadline DATE,
    remaining_days INT,
    improvement_plan NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'PLANNED',
    completion_date DATE,
    remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- ===== Code Group: WEM_HAZARD_TYPE (유해인자 유형) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'WEM_HAZARD_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('WEM_HAZARD_TYPE', N'유해인자 유형', N'작업환경 측정 유해인자 유형 코드', 1, 2900, GETDATE(), GETDATE());
END;

DECLARE @wemHazardTypeGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'WEM_HAZARD_TYPE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @wemHazardTypeGroupId AND code = 'ORGANIC')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@wemHazardTypeGroupId, 'ORGANIC',  'ORGANIC',  N'유기화합물', 'Organic Compounds', N'有机化合物', 1, 1, GETDATE(), GETDATE()),
    (@wemHazardTypeGroupId, 'METAL',    'METAL',    N'금속류',     'Metals',            N'金属类',     1, 2, GETDATE(), GETDATE()),
    (@wemHazardTypeGroupId, 'ACID',     'ACID',     N'산·알칼리',  'Acid/Alkali',       N'酸碱类',     1, 3, GETDATE(), GETDATE()),
    (@wemHazardTypeGroupId, 'PHYSICAL', 'PHYSICAL', N'물리적',     'Physical',          N'物理因素',   1, 4, GETDATE(), GETDATE()),
    (@wemHazardTypeGroupId, 'DUST',     'DUST',     N'분진',       'Dust',              N'粉尘',       1, 5, GETDATE(), GETDATE());
END;

-- ===== Code Group: WEM_CYCLE (측정주기) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'WEM_CYCLE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('WEM_CYCLE', N'측정주기', N'작업환경 측정 주기 코드', 1, 2901, GETDATE(), GETDATE());
END;

DECLARE @wemCycleGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'WEM_CYCLE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @wemCycleGroupId AND code = '6_MONTH')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@wemCycleGroupId, '6_MONTH', '6_MONTH', N'6개월',      '6 Months',          N'6个月',      1, 1, GETDATE(), GETDATE()),
    (@wemCycleGroupId, '1_YEAR',  '1_YEAR',  N'1년',        '1 Year',            N'1年',        1, 2, GETDATE(), GETDATE()),
    (@wemCycleGroupId, '30_DAY',  '30_DAY',  N'30일 이내',  'Within 30 Days',    N'30天内',     1, 3, GETDATE(), GETDATE());
END;

-- ===== Code Group: WEM_SAMPLE_TYPE (시료채취 유형) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'WEM_SAMPLE_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('WEM_SAMPLE_TYPE', N'시료채취 유형', N'작업환경 측정 시료채취 유형 코드', 1, 2902, GETDATE(), GETDATE());
END;

DECLARE @wemSampleTypeGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'WEM_SAMPLE_TYPE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @wemSampleTypeGroupId AND code = 'PERSONAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@wemSampleTypeGroupId, 'PERSONAL', 'PERSONAL', N'개인시료', 'Personal Sample', N'个人样本', 1, 1, GETDATE(), GETDATE()),
    (@wemSampleTypeGroupId, 'AREA',     'AREA',     N'지역시료', 'Area Sample',     N'区域样本', 1, 2, GETDATE(), GETDATE());
END;

-- ===== Code Group: WEM_JUDGMENT (판정) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'WEM_JUDGMENT')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('WEM_JUDGMENT', N'판정', N'작업환경 측정 판정 코드', 1, 2903, GETDATE(), GETDATE());
END;

DECLARE @wemJudgmentGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'WEM_JUDGMENT');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @wemJudgmentGroupId AND code = 'NORMAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@wemJudgmentGroupId, 'NORMAL',     'NORMAL',     N'기준이내',       'Normal',             N'达标',     1, 1, GETDATE(), GETDATE()),
    (@wemJudgmentGroupId, 'EXCEED_1X',  'EXCEED_1X',  N'1배초과',        'Exceed 1x',          N'超标1倍',  1, 2, GETDATE(), GETDATE()),
    (@wemJudgmentGroupId, 'EXCEED_2X',  'EXCEED_2X',  N'2배이상초과',    'Exceed 2x or more',  N'超标2倍',  1, 3, GETDATE(), GETDATE());
END;

-- ===== Code Group: WEM_IMPROVE_STATUS (개선 상태) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'WEM_IMPROVE_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('WEM_IMPROVE_STATUS', N'개선 상태', N'작업환경 측정 개선 상태 코드', 1, 2904, GETDATE(), GETDATE());
END;

DECLARE @wemImproveStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'WEM_IMPROVE_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @wemImproveStatusGroupId AND code = 'COMPLETED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@wemImproveStatusGroupId, 'COMPLETED',   'COMPLETED',   N'완료',     'Completed',   N'已完成',   1, 1, GETDATE(), GETDATE()),
    (@wemImproveStatusGroupId, 'IN_PROGRESS', 'IN_PROGRESS', N'진행중',   'In Progress', N'进行中',   1, 2, GETDATE(), GETDATE()),
    (@wemImproveStatusGroupId, 'PLANNED',     'PLANNED',     N'계획수립', 'Planned',     N'已计划',   1, 3, GETDATE(), GETDATE());
END;

-- ===== Dummy Data: tb_wem_plan (측정계획 6건) =====
INSERT INTO tb_wem_plan (plan_year, process_name, department, hazard_type, measurement_cycle, last_measurement_date, next_measurement_date, status, measurement_agency, agency_code, contract_period, remarks)
VALUES
(2026, N'도장공정',    N'제조1팀',  'ORGANIC',  '6_MONTH', '2026-01-15', '2026-07-15', 'OVERDUE',     N'한국산업안전측정원', 'AG-001', N'2026.01~2026.12', NULL),
(2026, N'용접공정',    N'제조2팀',  'METAL',    '6_MONTH', '2026-02-10', '2026-08-10', 'OVERDUE',     N'한국산업안전측정원', 'AG-001', N'2026.01~2026.12', NULL),
(2026, N'연마공정',    N'제조1팀',  'DUST',     '1_YEAR',  '2025-09-20', '2026-09-20', 'COMPLETED',   N'환경안전연구소',     'AG-002', N'2026.01~2026.12', NULL),
(2026, N'조립라인A',   N'조립팀',   'PHYSICAL', '1_YEAR',  '2025-11-05', '2026-11-05', 'COMPLETED',   N'환경안전연구소',     'AG-002', N'2026.01~2026.12', NULL),
(2026, N'열처리공정',  N'열처리팀', 'PHYSICAL', '1_YEAR',  '2025-12-01', '2026-12-01', 'COMPLETED',   N'한국산업안전측정원', 'AG-001', N'2026.01~2026.12', NULL),
(2026, N'PCB세척실',   N'전자팀',   'ORGANIC',  '30_DAY',  NULL,         NULL,         'UNMEASURED',  N'한국산업안전측정원', 'AG-001', N'2026.01~2026.12', NULL);

-- ===== Dummy Data: tb_wem_factor (유해인자 12건) =====
INSERT INTO tb_wem_factor (factor_name, factor_name_en, cas_number, factor_type, twa, stel, ceiling_value, unit, msds_linked, is_permitted, used_process, remarks)
VALUES
(N'톨루엔',       'Toluene',              '108-88-3',   'ORGANIC',  '50',    NULL,  NULL,  'ppm',    1, 0, N'도장공정',   NULL),
(N'자일렌',       'Xylene',               '1330-20-7',  'ORGANIC',  '100',   NULL,  NULL,  'ppm',    1, 0, N'도장공정',   NULL),
(N'MEK',          'Methyl Ethyl Ketone',  '78-93-3',    'ORGANIC',  '200',   NULL,  NULL,  'ppm',    1, 0, N'도장공정',   NULL),
(N'DMF',          'Dimethylformamide',    '68-12-2',    'ORGANIC',  '10',    NULL,  NULL,  'ppm',    1, 1, N'도장공정',   N'허가대상물질'),
(N'아세톤',       'Acetone',              '67-64-1',    'ORGANIC',  '500',   NULL,  NULL,  'ppm',    1, 0, N'PCB세척실',  NULL),
(N'망간',         'Manganese',            '7439-96-5',  'METAL',    '0.2',   NULL,  NULL,  'mg/m3',  1, 0, N'용접공정',   NULL),
(N'철산화물',     'Iron Oxide',           '1309-37-1',  'METAL',    '5.0',   NULL,  NULL,  'mg/m3',  1, 0, N'용접공정',   NULL),
(N'염산',         'Hydrochloric Acid',    '7647-01-0',  'ACID',     '1',     '2',   NULL,  'ppm',    1, 0, NULL,          NULL),
(N'소음',         'Noise',                NULL,         'PHYSICAL', '90',    NULL,  NULL,  'dB(A)',  0, 0, N'조립라인A',  NULL),
(N'고열WBGT',     'Heat Stress WBGT',     NULL,         'PHYSICAL', '28',    NULL,  NULL,  N'°C',    0, 0, N'열처리공정', NULL),
(N'진동',         'Vibration',            NULL,         'PHYSICAL', '2.5',   NULL,  NULL,  'm/s2',   0, 0, NULL,          NULL),
(N'광물성분진',   'Mineral Dust',         NULL,         'DUST',     '1.0',   NULL,  NULL,  'mg/m3',  0, 0, N'연마공정',   NULL);

-- ===== Dummy Data: tb_wem_result (측정결과 6건) =====
INSERT INTO tb_wem_result (process_name, factor_name, sample_type, measured_value, twa_value, stel_value, exposure_standard, exceed_rate, judgment, has_report, measurement_date, measurement_agency, remarks)
VALUES
(N'도장공정',    N'톨루엔',     'PERSONAL', '115.4', '115.4', NULL, '50',  231, 'EXCEED_2X', 1, '2026-01-15', N'한국산업안전측정원', NULL),
(N'도장공정',    N'자일렌',     'PERSONAL', '34.2',  '34.2',  NULL, '100', 34,  'NORMAL',    1, '2026-01-15', N'한국산업안전측정원', NULL),
(N'용접공정',    N'망간',       'PERSONAL', '0.26',  '0.26',  NULL, '0.2', 130, 'EXCEED_1X', 1, '2026-02-10', N'한국산업안전측정원', NULL),
(N'조립라인A',   N'소음',       'AREA',     '82.3',  '82.3',  NULL, '90',  91,  'NORMAL',    1, '2025-11-05', N'환경안전연구소',     NULL),
(N'연마공정',    N'광물성분진', 'PERSONAL', '0.45',  '0.45',  NULL, '1.0', 45,  'NORMAL',    1, '2025-09-20', N'환경안전연구소',     NULL),
(N'열처리공정',  N'고열WBGT',   'AREA',     '29.8',  '29.8',  NULL, '28',  106, 'EXCEED_1X', 1, '2025-12-01', N'한국산업안전측정원', NULL);

-- ===== Dummy Data: tb_wem_improvement (초과·개선 3건) =====
INSERT INTO tb_wem_improvement (process_name, factor_name, measured_value, exposure_standard, exceed_rate, exceed_level, department, measurement_date, measurement_agency, deadline, remaining_days, improvement_plan, status, completion_date, remarks)
VALUES
(N'도장공정',    N'톨루엔',   '115.4', '50',  231, 'EXCEED_2X', N'제조1팀',  '2026-01-15', N'한국산업안전측정원', '2026-04-24', 12, N'국소배기장치 설치 및 환기시설 개선', 'PLANNED',     NULL,          NULL),
(N'용접공정',    N'망간',     '0.26',  '0.2', 130, 'EXCEED_1X', N'제조2팀',  '2026-02-10', N'한국산업안전측정원', '2026-05-20', 38, N'용접 흄 포집장치 보강',              'IN_PROGRESS', NULL,          NULL),
(N'열처리공정',  N'고열WBGT', '29.8',  '28',  106, 'EXCEED_1X', N'열처리팀', '2025-12-01', N'한국산업안전측정원', '2026-05-27', 45, N'냉방설비 증설 및 휴식공간 마련',     'IN_PROGRESS', NULL,          NULL);
