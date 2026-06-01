-- V114: 연간 계획 구조 변경
--   - 시작일/종료일 → 개정일자(revised_date) 단일화
--   - 담당부서/담당자 → 작성자(writer_*)/승인자(approver_*)로 대체
--   - 작성일자 = 기존 created_at 사용 (별도 컬럼 추가하지 않음)

IF OBJECT_ID('tb_ehs_annual_plan', 'U') IS NULL
    RETURN;

-- 컬럼 추가
IF COL_LENGTH('tb_ehs_annual_plan', 'revised_date') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD revised_date DATE NULL;

IF COL_LENGTH('tb_ehs_annual_plan', 'writer_user_id') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD writer_user_id BIGINT NULL;
IF COL_LENGTH('tb_ehs_annual_plan', 'writer_team') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD writer_team NVARCHAR(100) NULL;
IF COL_LENGTH('tb_ehs_annual_plan', 'writer_position') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD writer_position NVARCHAR(50) NULL;
IF COL_LENGTH('tb_ehs_annual_plan', 'writer_name') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD writer_name NVARCHAR(100) NULL;

IF COL_LENGTH('tb_ehs_annual_plan', 'approver_user_id') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD approver_user_id BIGINT NULL;
IF COL_LENGTH('tb_ehs_annual_plan', 'approver_team') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD approver_team NVARCHAR(100) NULL;
IF COL_LENGTH('tb_ehs_annual_plan', 'approver_position') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD approver_position NVARCHAR(50) NULL;
IF COL_LENGTH('tb_ehs_annual_plan', 'approver_name') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD approver_name NVARCHAR(100) NULL;

-- 기존 컬럼 제거 (default constraint 안전하게 정리)
DECLARE @sql NVARCHAR(MAX);

DECLARE @drop_cols TABLE (col_name SYSNAME);
INSERT INTO @drop_cols VALUES (N'start_date'), (N'end_date'), (N'department'), (N'manager_name');

DECLARE @c SYSNAME;
DECLARE col_cur CURSOR LOCAL FAST_FORWARD FOR SELECT col_name FROM @drop_cols;
OPEN col_cur;
FETCH NEXT FROM col_cur INTO @c;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF COL_LENGTH('tb_ehs_annual_plan', @c) IS NOT NULL
    BEGIN
        DECLARE @df SYSNAME;
        SELECT @df = dc.name
          FROM sys.default_constraints dc
          INNER JOIN sys.columns sc ON sc.default_object_id = dc.object_id
         WHERE dc.parent_object_id = OBJECT_ID('tb_ehs_annual_plan')
           AND sc.name = @c;
        IF @df IS NOT NULL
        BEGIN
            SET @sql = N'ALTER TABLE tb_ehs_annual_plan DROP CONSTRAINT [' + @df + N']';
            EXEC sp_executesql @sql;
        END
        SET @sql = N'ALTER TABLE tb_ehs_annual_plan DROP COLUMN [' + @c + N']';
        EXEC sp_executesql @sql;
    END
    FETCH NEXT FROM col_cur INTO @c;
END
CLOSE col_cur;
DEALLOCATE col_cur;
