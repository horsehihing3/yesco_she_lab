-- V55: 법규 준수 체크리스트 워크플로우 (스키마)

-- 1. 평가 계획에 승인 + 체크리스트 연결
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_compliance_plan' AND COLUMN_NAME='checklist_template_id')
    ALTER TABLE tb_compliance_plan ADD checklist_template_id BIGINT NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_compliance_plan' AND COLUMN_NAME='approved')
    ALTER TABLE tb_compliance_plan ADD approved BIT DEFAULT 0;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_compliance_plan' AND COLUMN_NAME='approved_by')
    ALTER TABLE tb_compliance_plan ADD approved_by NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_compliance_plan' AND COLUMN_NAME='approved_at')
    ALTER TABLE tb_compliance_plan ADD approved_at DATETIME2 NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_compliance_plan' AND COLUMN_NAME='deleted')
    ALTER TABLE tb_compliance_plan ADD deleted BIT DEFAULT 0;

-- 2. 준수평가에 plan 연결 + 체크리스트 카운트 + 수정자
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_compliance_assessment' AND COLUMN_NAME='plan_id')
    ALTER TABLE tb_compliance_assessment ADD plan_id BIGINT NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_compliance_assessment' AND COLUMN_NAME='total_checklist')
    ALTER TABLE tb_compliance_assessment ADD total_checklist INT DEFAULT 0;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_compliance_assessment' AND COLUMN_NAME='completed_checklist')
    ALTER TABLE tb_compliance_assessment ADD completed_checklist INT DEFAULT 0;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_compliance_assessment' AND COLUMN_NAME='finding_count')
    ALTER TABLE tb_compliance_assessment ADD finding_count INT DEFAULT 0;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_compliance_assessment' AND COLUMN_NAME='modified_by')
    ALTER TABLE tb_compliance_assessment ADD modified_by NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_compliance_assessment' AND COLUMN_NAME='status')
    ALTER TABLE tb_compliance_assessment ADD status NVARCHAR(20) DEFAULT 'IN_PROGRESS';
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_compliance_assessment' AND COLUMN_NAME='deleted')
    ALTER TABLE tb_compliance_assessment ADD deleted BIT DEFAULT 0;

-- 3. 준수평가 변경이력
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_compliance_log')
CREATE TABLE tb_compliance_log (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    assessment_id BIGINT NOT NULL,
    action NVARCHAR(30) NOT NULL,
    changed_by NVARCHAR(50) NULL,
    detail NVARCHAR(MAX) NULL,
    total_count INT NULL,
    pass_count INT NULL,
    fail_count INT NULL,
    na_count INT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_compliance_log_assessment FOREIGN KEY (assessment_id) REFERENCES tb_compliance_assessment(id)
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_compliance_log_assessment_id')
CREATE INDEX IX_compliance_log_assessment_id ON tb_compliance_log(assessment_id, created_at DESC);

-- 4. 준수평가 변경이력 항목
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_compliance_log_item')
CREATE TABLE tb_compliance_log_item (
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
    CONSTRAINT FK_compliance_log_item_log FOREIGN KEY (log_id) REFERENCES tb_compliance_log(id)
);
