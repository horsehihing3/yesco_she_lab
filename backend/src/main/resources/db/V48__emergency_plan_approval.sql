-- V48: 비상 대응 계획 승인 필드 추가
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_emergency_plan' AND COLUMN_NAME='approved')
    ALTER TABLE tb_emergency_plan ADD approved BIT DEFAULT 0;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_emergency_plan' AND COLUMN_NAME='approved_by')
    ALTER TABLE tb_emergency_plan ADD approved_by NVARCHAR(50) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tb_emergency_plan' AND COLUMN_NAME='approved_at')
    ALTER TABLE tb_emergency_plan ADD approved_at DATETIME2 NULL;
