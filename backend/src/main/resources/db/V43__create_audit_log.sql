-- V43: 감사 실시 변경 이력 테이블
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_audit_log')
CREATE TABLE tb_audit_log (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    audit_id BIGINT NOT NULL,
    action NVARCHAR(30) NOT NULL,
    changed_by NVARCHAR(50) NULL,
    detail NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_audit_log_audit FOREIGN KEY (audit_id) REFERENCES tb_audit(id)
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_audit_log_audit_id')
CREATE INDEX IX_audit_log_audit_id ON tb_audit_log(audit_id, created_at DESC);
