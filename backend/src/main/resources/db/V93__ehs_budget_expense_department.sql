-- V93: tb_ehs_budget_expense 에 department(부서) 컬럼 추가
--   실예산 사용입력 폼에 부서 선택이 필요함
--   더미데이터도 담당 부서를 함께 채워 넣는다.

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_ehs_budget_expense', 'U') IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tb_ehs_budget_expense') AND name = 'department'
)
BEGIN
    ALTER TABLE tb_ehs_budget_expense ADD department NVARCHAR(100) NULL;
END
GO

-- 기존 더미데이터에 담당 부서 채우기 (카테고리별로 합리적인 부서 지정)
IF OBJECT_ID('tb_ehs_budget_expense', 'U') IS NOT NULL
AND EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tb_ehs_budget_expense') AND name = 'department'
)
BEGIN
    UPDATE tb_ehs_budget_expense
    SET department = CASE category
                        WHEN 'SAFETY'      THEN N'안전보건팀'
                        WHEN 'PPE'         THEN N'노경지원팀'
                        WHEN 'TRAINING'    THEN N'안전보건팀'
                        WHEN 'HEALTH'      THEN N'노경지원팀'
                        WHEN 'ENV_MEASURE' THEN N'환경관리팀'
                        WHEN 'EMERGENCY'   THEN N'안전보건팀'
                        WHEN 'FACILITY'    THEN N'시설관리팀'
                        ELSE N'노경지원팀'
                     END,
        modified_at = GETDATE()
    WHERE department IS NULL OR department = N'';
END
GO
