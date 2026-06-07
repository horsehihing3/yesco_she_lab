-- V199: tb_ehs_annual_plan 에 수정자 컬럼 추가
-- modified_by_user_id (BIGINT), modified_by_name (NVARCHAR(100))
-- idempotent — 이미 있으면 스킵

IF OBJECT_ID('tb_ehs_annual_plan', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_ehs_annual_plan') AND name = 'modified_by_user_id')
        ALTER TABLE tb_ehs_annual_plan ADD modified_by_user_id BIGINT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_ehs_annual_plan') AND name = 'modified_by_name')
        ALTER TABLE tb_ehs_annual_plan ADD modified_by_name NVARCHAR(100) NULL;
END
GO
