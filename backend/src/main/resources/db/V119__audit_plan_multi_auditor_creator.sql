-- V119: 감사 계획에 다중 감사담당자(CSV) + 작성자 정보 컬럼 추가
--   - auditor_name 폭을 NVARCHAR(500) 으로 확장(콤마 구분 다중 지정)
--   - created_by_user_id / created_by_name 추가(자동 채움)

IF OBJECT_ID('tb_audit_plan', 'U') IS NULL
    RETURN;

-- 컬럼 폭 확장
IF EXISTS (SELECT 1 FROM sys.columns
           WHERE object_id = OBJECT_ID('tb_audit_plan')
             AND name = 'auditor_name'
             AND max_length / 2 < 500)  -- NVARCHAR 는 max_length 가 byte 단위(2배)
BEGIN
    ALTER TABLE tb_audit_plan ALTER COLUMN auditor_name NVARCHAR(500) NULL;
END;

-- 작성자 정보
IF COL_LENGTH('tb_audit_plan', 'created_by_user_id') IS NULL
    ALTER TABLE tb_audit_plan ADD created_by_user_id BIGINT NULL;
IF COL_LENGTH('tb_audit_plan', 'created_by_name') IS NULL
    ALTER TABLE tb_audit_plan ADD created_by_name NVARCHAR(50) NULL;
