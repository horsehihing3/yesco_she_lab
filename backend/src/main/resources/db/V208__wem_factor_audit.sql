-- V208: tb_wem_factor 에 작성자/수정자 audit 컬럼 추가
IF OBJECT_ID('tb_wem_factor', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_wem_factor') AND name = 'created_by_user_id')
        ALTER TABLE tb_wem_factor ADD created_by_user_id BIGINT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_wem_factor') AND name = 'created_by_name')
        ALTER TABLE tb_wem_factor ADD created_by_name NVARCHAR(100) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_wem_factor') AND name = 'modified_by_user_id')
        ALTER TABLE tb_wem_factor ADD modified_by_user_id BIGINT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_wem_factor') AND name = 'modified_by_name')
        ALTER TABLE tb_wem_factor ADD modified_by_name NVARCHAR(100) NULL;
END
GO
