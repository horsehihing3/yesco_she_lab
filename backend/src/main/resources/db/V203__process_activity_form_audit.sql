-- V203: tb_process_activity_form 에 작성자/수정자 컬럼 추가
-- idempotent

IF OBJECT_ID('tb_process_activity_form', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_process_activity_form') AND name = 'created_by_user_id')
        ALTER TABLE tb_process_activity_form ADD created_by_user_id BIGINT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_process_activity_form') AND name = 'created_by_name')
        ALTER TABLE tb_process_activity_form ADD created_by_name NVARCHAR(100) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_process_activity_form') AND name = 'modified_by_user_id')
        ALTER TABLE tb_process_activity_form ADD modified_by_user_id BIGINT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_process_activity_form') AND name = 'modified_by_name')
        ALTER TABLE tb_process_activity_form ADD modified_by_name NVARCHAR(100) NULL;
END
GO
