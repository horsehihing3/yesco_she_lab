-- ===== Code Group: EHS_BUDGET_CATEGORY (예산 분류) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'EHS_BUDGET_CATEGORY')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('EHS_BUDGET_CATEGORY', N'예산 분류', N'EHS 예산 분류 코드', 1, 1100, GETDATE(), GETDATE());
END;

DECLARE @ehsBudgetCategoryGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'EHS_BUDGET_CATEGORY');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @ehsBudgetCategoryGroupId AND code = 'SAFETY')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@ehsBudgetCategoryGroupId, 'SAFETY',      'SAFETY',      N'안전시설',     'Safety Facility',         N'安全设施',     1, 1, GETDATE(), GETDATE()),
    (@ehsBudgetCategoryGroupId, 'PPE',         'PPE',         N'보호구',       'PPE',                     N'防护用品',     1, 2, GETDATE(), GETDATE()),
    (@ehsBudgetCategoryGroupId, 'TRAINING',    'TRAINING',    N'교육훈련',     'Training',                N'教育培训',     1, 3, GETDATE(), GETDATE()),
    (@ehsBudgetCategoryGroupId, 'HEALTH',      'HEALTH',      N'건강검진',     'Health Checkup',          N'健康检查',     1, 4, GETDATE(), GETDATE()),
    (@ehsBudgetCategoryGroupId, 'ENV_MEASURE', 'ENV_MEASURE', N'환경측정',     'Environmental Measure',   N'环境测量',     1, 5, GETDATE(), GETDATE()),
    (@ehsBudgetCategoryGroupId, 'EMERGENCY',   'EMERGENCY',   N'비상대응',     'Emergency Response',      N'应急响应',     1, 6, GETDATE(), GETDATE()),
    (@ehsBudgetCategoryGroupId, 'FACILITY',    'FACILITY',    N'시설·설비',    'Facility & Equipment',    N'设施·设备',    1, 7, GETDATE(), GETDATE()),
    (@ehsBudgetCategoryGroupId, 'ETC',         'ETC',         N'기타',         'Other',                   N'其他',         1, 8, GETDATE(), GETDATE());
END;

-- ===== Table: tb_ehs_budget_plan (예산 계획) =====
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_ehs_budget_plan' AND xtype='U')
BEGIN
CREATE TABLE tb_ehs_budget_plan (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    budget_year INT NOT NULL DEFAULT 2026,
    category NVARCHAR(50) NOT NULL,
    item_name NVARCHAR(500) NOT NULL,
    q1_amount BIGINT DEFAULT 0,
    q2_amount BIGINT DEFAULT 0,
    q3_amount BIGINT DEFAULT 0,
    q4_amount BIGINT DEFAULT 0,
    note NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- ===== Table: tb_ehs_budget_expense (실지출) =====
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tb_ehs_budget_expense' AND xtype='U')
BEGIN
CREATE TABLE tb_ehs_budget_expense (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    budget_year INT NOT NULL DEFAULT 2026,
    category NVARCHAR(50) NOT NULL,
    plan_id BIGINT,
    item_name NVARCHAR(500) NOT NULL,
    amount BIGINT NOT NULL DEFAULT 0,
    expense_date DATE,
    vendor NVARCHAR(200),
    note NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    modified_at DATETIME2 DEFAULT GETDATE()
);
END;

-- ===== Dummy Data: Plans (6 records) =====
INSERT INTO tb_ehs_budget_plan (budget_year, category, item_name, q1_amount, q2_amount, q3_amount, q4_amount, note)
VALUES
(2026, 'SAFETY',      N'안전시설 개선 및 설치', 1000000, 2000000, 1500000, 500000, N'안전난간, 방호장치 등'),
(2026, 'PPE',         N'보호구 구매',            800000,  800000,  800000,  600000, N'안전모, 안전화, 방진마스크'),
(2026, 'TRAINING',    N'안전보건교육',           500000,  500000,  500000,  500000, N'정기·특별교육'),
(2026, 'HEALTH',      N'특수건강진단',          4000000,       0, 4000000,       0, N'상·하반기 각 1회'),
(2026, 'ENV_MEASURE', N'작업환경측정',          2000000,       0, 2000000,       0, N'반기 1회'),
(2026, 'EMERGENCY',   N'비상대응 훈련·장비',    500000,  300000,  500000,  200000, N'훈련비+장비유지');

-- ===== Dummy Data: Expenses (6 records) =====
INSERT INTO tb_ehs_budget_expense (budget_year, category, plan_id, item_name, amount, expense_date, vendor, note)
VALUES
(2026, 'PPE',         (SELECT TOP 1 id FROM tb_ehs_budget_plan WHERE budget_year = 2026 AND category = 'PPE'         ORDER BY id), N'안전모 50개',           420000,  '2026-01-12', N'안전용품(주)',          NULL),
(2026, 'TRAINING',    (SELECT TOP 1 id FROM tb_ehs_budget_plan WHERE budget_year = 2026 AND category = 'TRAINING'    ORDER BY id), N'신규자 안전교육',       180000,  '2026-02-05', N'한국산업안전교육원',    NULL),
(2026, 'HEALTH',      (SELECT TOP 1 id FROM tb_ehs_budget_plan WHERE budget_year = 2026 AND category = 'HEALTH'      ORDER BY id), N'특수건강진단 1차',     3800000,  '2026-03-18', N'인하대병원',            N'1분기'),
(2026, 'ENV_MEASURE', (SELECT TOP 1 id FROM tb_ehs_budget_plan WHERE budget_year = 2026 AND category = 'ENV_MEASURE' ORDER BY id), N'작업환경측정 상반기',  1950000,  '2026-05-22', N'환경측정(주)',          NULL),
(2026, 'SAFETY',      (SELECT TOP 1 id FROM tb_ehs_budget_plan WHERE budget_year = 2026 AND category = 'SAFETY'      ORDER BY id), N'안전난간 공사',        2100000,  '2026-04-08', N'(주)안전시공',          NULL),
(2026, 'PPE',         (SELECT TOP 1 id FROM tb_ehs_budget_plan WHERE budget_year = 2026 AND category = 'PPE'         ORDER BY id), N'방진마스크 100개',      380000,  '2026-06-01', N'안전용품(주)',          NULL);
