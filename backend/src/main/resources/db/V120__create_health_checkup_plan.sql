-- V120: 통합 검진계획 도메인 (슬라이드 7 건강검진 + 슬라이드 8 직업병 공통)
-- checkup_type 으로 일반(GENERAL) / 특수(SPECIAL) / 직업병(OCCUPATIONAL) 구분

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_health_checkup_plan' AND xtype='U')
BEGIN
CREATE TABLE tb_health_checkup_plan (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    plan_year INT NOT NULL,
    checkup_type NVARCHAR(20) NOT NULL,        -- GENERAL / SPECIAL / OCCUPATIONAL
    plan_name NVARCHAR(200) NOT NULL,
    target_dept NVARCHAR(200),
    target_count INT DEFAULT 0,
    completed_count INT DEFAULT 0,
    hazard_factors NVARCHAR(500),              -- 유해인자 (특수/직업병만)
    hospital NVARCHAR(200),
    plan_start_date DATE,
    plan_end_date DATE,
    status NVARCHAR(20) DEFAULT 'PLANNED',     -- PLANNED / IN_PROGRESS / COMPLETED / CANCELLED
    notes NVARCHAR(MAX),
    created_by NVARCHAR(100),
    created_by_name NVARCHAR(100),
    created_by_dept NVARCHAR(100),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_health_checkup_plan_year_type')
CREATE INDEX IX_health_checkup_plan_year_type ON tb_health_checkup_plan(plan_year DESC, checkup_type);

-- ===== Code Groups =====

-- HEALTH_CHECKUP_TYPE
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'HEALTH_CHECKUP_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('HEALTH_CHECKUP_TYPE', N'건강검진 종류', N'일반/특수/직업병 검진 종류 코드', 1, 2500, GETDATE(), GETDATE());
END;

DECLARE @hcTypeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'HEALTH_CHECKUP_TYPE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @hcTypeId AND code = 'GENERAL')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@hcTypeId, 'GENERAL',      'GENERAL',      N'일반검진',   'General',      N'一般体检', 1, 1, GETDATE(), GETDATE()),
    (@hcTypeId, 'SPECIAL',      'SPECIAL',      N'특수검진',   'Special',      N'特殊体检', 1, 2, GETDATE(), GETDATE()),
    (@hcTypeId, 'OCCUPATIONAL', 'OCCUPATIONAL', N'직업병검진', 'Occupational', N'职业病体检', 1, 3, GETDATE(), GETDATE());
END;

-- HEALTH_CHECKUP_PLAN_STATUS
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'HEALTH_CHECKUP_PLAN_STATUS')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('HEALTH_CHECKUP_PLAN_STATUS', N'검진계획 상태', N'검진계획 진행 상태 코드', 1, 2510, GETDATE(), GETDATE());
END;

DECLARE @hcPlanStatusId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'HEALTH_CHECKUP_PLAN_STATUS');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @hcPlanStatusId AND code = 'PLANNED')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@hcPlanStatusId, 'PLANNED',     'PLANNED',     N'계획',   'Planned',     N'已计划', 1, 1, GETDATE(), GETDATE()),
    (@hcPlanStatusId, 'IN_PROGRESS', 'IN_PROGRESS', N'진행중', 'In Progress', N'进行中', 1, 2, GETDATE(), GETDATE()),
    (@hcPlanStatusId, 'COMPLETED',   'COMPLETED',   N'완료',   'Completed',   N'已完成', 1, 3, GETDATE(), GETDATE()),
    (@hcPlanStatusId, 'CANCELLED',   'CANCELLED',   N'취소',   'Cancelled',   N'已取消', 1, 4, GETDATE(), GETDATE());
END;

-- ===== Dummy Data =====

IF NOT EXISTS (SELECT * FROM tb_health_checkup_plan WHERE plan_name = N'2026년 상반기 일반건강검진')
BEGIN
    INSERT INTO tb_health_checkup_plan
    (plan_year, checkup_type, plan_name, target_dept, target_count, completed_count, hazard_factors, hospital, plan_start_date, plan_end_date, status, notes, created_by, created_by_name, created_by_dept)
    VALUES
    (2026, 'GENERAL',      N'2026년 상반기 일반건강검진', N'전사',           320, 285, NULL,                    N'삼성서울병원',     '2026-03-01', '2026-05-31', 'IN_PROGRESS', N'전 직원 대상',                'com4in', N'관리자', N'EHS팀'),
    (2026, 'GENERAL',      N'2026년 하반기 일반건강검진', N'전사',           320,   0, NULL,                    N'서울아산병원',     '2026-09-01', '2026-11-30', 'PLANNED',     N'하반기 채용자 포함',          'com4in', N'관리자', N'EHS팀'),
    (2026, 'SPECIAL',      N'2026년 도장공정 특수검진',   N'생산본부 도장공정', 96,  78, N'유기용제, 분진',       N'한국산업의학연구원', '2026-04-01', '2026-04-30', 'IN_PROGRESS', N'도장공정 노출자',             'com4in', N'관리자', N'EHS팀'),
    (2026, 'SPECIAL',      N'2026년 용접공정 특수검진',   N'생산본부 용접공정', 72,   0, N'금속흄, 자외선',       N'한국산업의학연구원', '2026-05-15', '2026-06-15', 'PLANNED',     N'용접공 전원',                 'com4in', N'관리자', N'EHS팀'),
    (2026, 'OCCUPATIONAL', N'2026년 직업병 정밀검진',     N'고위험군 18명',  18,   0, N'소음, 분진, 화학물질', N'근로복지공단 부속의원', '2026-06-01', '2026-07-31', 'PLANNED',     N'D1/D2 판정자 대상',           'com4in', N'관리자', N'EHS팀'),
    (2025, 'GENERAL',      N'2025년 하반기 일반건강검진', N'전사',           305, 305, NULL,                    N'삼성서울병원',     '2025-09-01', '2025-11-30', 'COMPLETED',   N'완료',                        'com4in', N'관리자', N'EHS팀');
END;
