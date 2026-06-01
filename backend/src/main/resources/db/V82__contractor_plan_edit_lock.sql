-- V82: tb_contractor_plan 편집 잠금 컬럼 추가
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_contractor_plan') AND name = 'editing_user_id')
    ALTER TABLE tb_contractor_plan ADD editing_user_id BIGINT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_contractor_plan') AND name = 'editing_user_name')
    ALTER TABLE tb_contractor_plan ADD editing_user_name NVARCHAR(100) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_contractor_plan') AND name = 'editing_started_at')
    ALTER TABLE tb_contractor_plan ADD editing_started_at DATETIME2 NULL;
