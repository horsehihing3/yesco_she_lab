-- V41: 감사 계획 승인 컬럼 추가
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_audit_plan' AND COLUMN_NAME='approved')
    ALTER TABLE tb_audit_plan ADD approved BIT DEFAULT 0;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_audit_plan' AND COLUMN_NAME='approved_by')
    ALTER TABLE tb_audit_plan ADD approved_by NVARCHAR(50) NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_audit_plan' AND COLUMN_NAME='approved_at')
    ALTER TABLE tb_audit_plan ADD approved_at DATETIME NULL;

-- 더미데이터: 첫 번째 계획 승인 처리 (감사 실시에 표시되도록)
EXEC('
UPDATE tb_audit_plan SET approved = 1, approved_by = N''admin'', approved_at = GETDATE() WHERE plan_id = ''AP-2026-001'';
');
