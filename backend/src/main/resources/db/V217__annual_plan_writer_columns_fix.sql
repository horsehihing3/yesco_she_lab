-- V217: tb_ehs_annual_plan writer_* 컬럼 누락 수정
-- V114 마이그레이션이 정상 적용되지 않아 writer_* 컬럼이 없는 경우를 위한 idempotent fix

IF OBJECT_ID('tb_ehs_annual_plan', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('tb_ehs_annual_plan', 'writer_user_id') IS NULL
        ALTER TABLE tb_ehs_annual_plan ADD writer_user_id BIGINT NULL;
    IF COL_LENGTH('tb_ehs_annual_plan', 'writer_team') IS NULL
        ALTER TABLE tb_ehs_annual_plan ADD writer_team NVARCHAR(100) NULL;
    IF COL_LENGTH('tb_ehs_annual_plan', 'writer_position') IS NULL
        ALTER TABLE tb_ehs_annual_plan ADD writer_position NVARCHAR(50) NULL;
    IF COL_LENGTH('tb_ehs_annual_plan', 'writer_name') IS NULL
        ALTER TABLE tb_ehs_annual_plan ADD writer_name NVARCHAR(100) NULL;
END
