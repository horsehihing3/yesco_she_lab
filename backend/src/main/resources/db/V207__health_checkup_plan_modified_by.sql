-- V207: tb_health_checkup_plan 에 수정자 컬럼 추가
IF OBJECT_ID('tb_health_checkup_plan', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_health_checkup_plan') AND name = 'modified_by_user_id')
        ALTER TABLE tb_health_checkup_plan ADD modified_by_user_id BIGINT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_health_checkup_plan') AND name = 'modified_by_name')
        ALTER TABLE tb_health_checkup_plan ADD modified_by_name NVARCHAR(100) NULL;
END
GO
