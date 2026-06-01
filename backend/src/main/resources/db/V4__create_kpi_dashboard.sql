-- ===== Code Group: KPI_TYPE (KPI 지표 유형) =====
IF NOT EXISTS (SELECT * FROM tb_code_group WHERE group_code = 'KPI_TYPE')
BEGIN
    INSERT INTO tb_code_group (group_code, group_name, description, is_active, sort_order, created_at, modified_at)
    VALUES ('KPI_TYPE', N'KPI 지표 유형', N'EHS KPI 지표 유형 코드', 1, 400, GETDATE(), GETDATE());
END;

DECLARE @kpiTypeId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'KPI_TYPE');

IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @kpiTypeId AND code = 'ACCIDENT_RATE')
BEGIN
    INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
    VALUES
    (@kpiTypeId, 'ACCIDENT_RATE',    'ACCIDENT_RATE',    N'재해율',       'Accident Rate',       N'灾害率',     1, 1, GETDATE(), GETDATE()),
    (@kpiTypeId, 'FREQUENCY_RATE',   'FREQUENCY_RATE',   N'도수율',       'Frequency Rate',      N'频度率',     1, 2, GETDATE(), GETDATE()),
    (@kpiTypeId, 'SEVERITY_RATE',    'SEVERITY_RATE',    N'강도율',       'Severity Rate',       N'强度率',     1, 3, GETDATE(), GETDATE()),
    (@kpiTypeId, 'NEAR_MISS_RATE',   'NEAR_MISS_RATE',   N'아차사고 발굴율', 'Near Miss Rate',   N'险肇事故发掘率', 1, 4, GETDATE(), GETDATE()),
    (@kpiTypeId, 'TRAINING_RATE',    'TRAINING_RATE',    N'교육 이수율',   'Training Completion', N'培训完成率', 1, 5, GETDATE(), GETDATE()),
    (@kpiTypeId, 'INSPECTION_RATE',  'INSPECTION_RATE',  N'점검 완료율',   'Inspection Rate',     N'检查完成率', 1, 6, GETDATE(), GETDATE()),
    (@kpiTypeId, 'PPE_COMPLIANCE',   'PPE_COMPLIANCE',   N'보호구 착용률', 'PPE Compliance',      N'防护用品佩戴率', 1, 7, GETDATE(), GETDATE()),
    (@kpiTypeId, 'ENV_COMPLIANCE',   'ENV_COMPLIANCE',   N'환경법규 준수율', 'Env. Compliance',   N'环境法规遵守率', 1, 8, GETDATE(), GETDATE());
END;

-- ===== Table: tb_kpi_record =====
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_kpi_record')
BEGIN
    CREATE TABLE tb_kpi_record (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        kpi_type        NVARCHAR(30) NOT NULL,
        record_year     INT NOT NULL,
        record_month    INT NOT NULL,
        target_value    DECIMAL(10,2),
        actual_value    DECIMAL(10,2),
        unit            NVARCHAR(10) DEFAULT '%',
        department      NVARCHAR(100),
        notes           NVARCHAR(500),
        deleted         BIT NOT NULL DEFAULT 0,
        created_at      DATETIME NOT NULL DEFAULT GETDATE(),
        modified_at     DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

DELETE FROM tb_kpi_record;

INSERT INTO tb_kpi_record (kpi_type, record_year, record_month, target_value, actual_value, unit, department, notes) VALUES
('ACCIDENT_RATE',   2026, 1, 0.00, 0.00, '%', N'전체', NULL),
('ACCIDENT_RATE',   2026, 2, 0.00, 0.00, '%', N'전체', NULL),
('ACCIDENT_RATE',   2026, 3, 0.00, 0.12, '%', N'전체', N'경미 재해 1건 발생'),
('FREQUENCY_RATE',  2026, 1, 0.00, 0.00, N'건/백만시간', N'전체', NULL),
('FREQUENCY_RATE',  2026, 2, 0.00, 0.00, N'건/백만시간', N'전체', NULL),
('FREQUENCY_RATE',  2026, 3, 0.00, 1.25, N'건/백만시간', N'전체', N'근로손실 1건'),
('SEVERITY_RATE',   2026, 1, 0.00, 0.00, N'일/천시간', N'전체', NULL),
('SEVERITY_RATE',   2026, 2, 0.00, 0.00, N'일/천시간', N'전체', NULL),
('SEVERITY_RATE',   2026, 3, 0.00, 0.05, N'일/천시간', N'전체', N'3일 근로손실'),
('NEAR_MISS_RATE',  2026, 1, 5.00, 3.00, N'건', N'전체', NULL),
('NEAR_MISS_RATE',  2026, 2, 5.00, 7.00, N'건', N'전체', N'목표 초과 달성'),
('NEAR_MISS_RATE',  2026, 3, 5.00, 8.00, N'건', N'전체', N'안전 의식 향상'),
('TRAINING_RATE',   2026, 1, 95.00, 92.00, '%', N'전체', NULL),
('TRAINING_RATE',   2026, 2, 95.00, 96.00, '%', N'전체', NULL),
('TRAINING_RATE',   2026, 3, 95.00, 98.50, '%', N'전체', N'전원 이수 근접'),
('INSPECTION_RATE', 2026, 1, 100.00, 95.00, '%', N'전체', NULL),
('INSPECTION_RATE', 2026, 2, 100.00, 100.00, '%', N'전체', NULL),
('INSPECTION_RATE', 2026, 3, 100.00, 97.00, '%', N'전체', N'설비팀 1건 미완료'),
('PPE_COMPLIANCE',  2026, 1, 95.00, 91.00, '%', N'전체', NULL),
('PPE_COMPLIANCE',  2026, 2, 95.00, 93.50, '%', N'전체', NULL),
('PPE_COMPLIANCE',  2026, 3, 95.00, 94.20, '%', N'전체', N'착용률 지속 개선'),
('ENV_COMPLIANCE',  2026, 1, 100.00, 100.00, '%', N'전체', NULL),
('ENV_COMPLIANCE',  2026, 2, 100.00, 100.00, '%', N'전체', NULL),
('ENV_COMPLIANCE',  2026, 3, 100.00, 98.00, '%', N'전체', N'수질 기준 1건 초과');
