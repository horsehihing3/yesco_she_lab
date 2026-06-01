-- V113: 연간 계획에서 진행률(progress_rate) 컬럼 제거
--   - 상태(status) 기반 워크플로우(작성중/승인대기/승인완료/작업완료)로 충분하여 별도 진행률 불필요

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('tb_ehs_annual_plan')
      AND name = 'progress_rate'
)
BEGIN
    DECLARE @df_name NVARCHAR(200);
    SELECT @df_name = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c
        ON c.default_object_id = dc.object_id
    WHERE dc.parent_object_id = OBJECT_ID('tb_ehs_annual_plan')
      AND c.name = 'progress_rate';

    IF @df_name IS NOT NULL
        EXEC('ALTER TABLE tb_ehs_annual_plan DROP CONSTRAINT [' + @df_name + ']');

    ALTER TABLE tb_ehs_annual_plan DROP COLUMN progress_rate;
END;
