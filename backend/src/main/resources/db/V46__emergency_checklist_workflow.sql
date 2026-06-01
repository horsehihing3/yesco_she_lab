-- V46: 비상 대응 체크리스트 워크플로우 (스키마 변경)

-- 1. 비상 대응 계획에 체크리스트 연결
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_emergency_plan' AND COLUMN_NAME='checklist_template_id')
    ALTER TABLE tb_emergency_plan ADD checklist_template_id BIGINT NULL;

-- 2. 비상 훈련에 체크리스트 카운트 + 수정자
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_emergency_drill' AND COLUMN_NAME='total_checklist')
    ALTER TABLE tb_emergency_drill ADD total_checklist INT DEFAULT 0;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_emergency_drill' AND COLUMN_NAME='completed_checklist')
    ALTER TABLE tb_emergency_drill ADD completed_checklist INT DEFAULT 0;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_emergency_drill' AND COLUMN_NAME='finding_count')
    ALTER TABLE tb_emergency_drill ADD finding_count INT DEFAULT 0;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_emergency_drill' AND COLUMN_NAME='modified_by')
    ALTER TABLE tb_emergency_drill ADD modified_by NVARCHAR(50) NULL;

-- 3. 비상 훈련 변경이력 테이블
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_drill_log')
CREATE TABLE tb_drill_log (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    drill_id BIGINT NOT NULL,
    action NVARCHAR(30) NOT NULL,
    changed_by NVARCHAR(50) NULL,
    detail NVARCHAR(MAX) NULL,
    total_count INT NULL,
    pass_count INT NULL,
    fail_count INT NULL,
    na_count INT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_drill_log_drill FOREIGN KEY (drill_id) REFERENCES tb_emergency_drill(id)
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_drill_log_drill_id')
CREATE INDEX IX_drill_log_drill_id ON tb_drill_log(drill_id, created_at DESC);

-- 4. 비상 훈련 변경이력 항목 테이블
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_drill_log_item')
CREATE TABLE tb_drill_log_item (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    log_id BIGINT NOT NULL,
    category_name NVARCHAR(200) NULL,
    item_no INT NULL,
    classification NVARCHAR(20) NULL,
    check_item NVARCHAR(500) NULL,
    legal_basis NVARCHAR(200) NULL,
    check_result NVARCHAR(20) NULL,
    finding NVARCHAR(MAX) NULL,
    action_deadline NVARCHAR(20) NULL,
    action_complete BIT DEFAULT 0,
    CONSTRAINT FK_drill_log_item_log FOREIGN KEY (log_id) REFERENCES tb_drill_log(id)
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_drill_log_item_log_id')
CREATE INDEX IX_drill_log_item_log_id ON tb_drill_log_item(log_id);
