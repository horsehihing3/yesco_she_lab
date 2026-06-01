-- V44: 감사 로그 통계 컬럼 + 항목별 이력 테이블
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_audit_log' AND COLUMN_NAME='total_count')
    ALTER TABLE tb_audit_log ADD total_count INT NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_audit_log' AND COLUMN_NAME='pass_count')
    ALTER TABLE tb_audit_log ADD pass_count INT NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_audit_log' AND COLUMN_NAME='fail_count')
    ALTER TABLE tb_audit_log ADD fail_count INT NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_audit_log' AND COLUMN_NAME='na_count')
    ALTER TABLE tb_audit_log ADD na_count INT NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_audit_log_item')
CREATE TABLE tb_audit_log_item (
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
    CONSTRAINT FK_audit_log_item_log FOREIGN KEY (log_id) REFERENCES tb_audit_log(id)
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_audit_log_item_log_id')
CREATE INDEX IX_audit_log_item_log_id ON tb_audit_log_item(log_id);
