-- V219: tb_emergency_plan writer_* → created_by_* 표준 패턴 전환
-- created_by_* 컬럼 추가 후 기존 writer_* 데이터 복사 (writer_* 컬럼은 유지)

IF OBJECT_ID('tb_emergency_plan', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('tb_emergency_plan', 'created_by_user_id') IS NULL
        ALTER TABLE tb_emergency_plan ADD created_by_user_id BIGINT NULL;
    IF COL_LENGTH('tb_emergency_plan', 'created_by_name') IS NULL
        ALTER TABLE tb_emergency_plan ADD created_by_name NVARCHAR(100) NULL;
    IF COL_LENGTH('tb_emergency_plan', 'created_by_team') IS NULL
        ALTER TABLE tb_emergency_plan ADD created_by_team NVARCHAR(100) NULL;
    IF COL_LENGTH('tb_emergency_plan', 'created_by_position') IS NULL
        ALTER TABLE tb_emergency_plan ADD created_by_position NVARCHAR(50) NULL;
END

UPDATE tb_emergency_plan
SET
    created_by_user_id  = writer_user_id,
    created_by_name     = writer_name,
    created_by_team     = writer_team,
    created_by_position = writer_position
WHERE created_by_user_id IS NULL AND writer_user_id IS NOT NULL;
