-- V133: tb_ehs_budget_expense 의 vendor(거래처), plan_id(연결계획) 컬럼 제거
-- 입력 폼/상세 화면에서 두 항목 모두 제거하기로 결정. 더미데이터도 새 스키마에 맞게 재생성.

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_ehs_budget_expense', 'U') IS NOT NULL
BEGIN
    DECLARE @df sysname;
    DECLARE @sql NVARCHAR(MAX);
    DECLARE @cols TABLE (n NVARCHAR(50));
    INSERT INTO @cols VALUES (N'vendor'), (N'plan_id');

    DECLARE @col NVARCHAR(50);
    DECLARE cur CURSOR FOR SELECT n FROM @cols;
    OPEN cur;
    FETCH NEXT FROM cur INTO @col;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @df = NULL;
        SELECT @df = dc.name
          FROM sys.default_constraints dc
          INNER JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
         WHERE dc.parent_object_id = OBJECT_ID('tb_ehs_budget_expense') AND c.name = @col;
        IF @df IS NOT NULL
        BEGIN
            SET @sql = N'ALTER TABLE tb_ehs_budget_expense DROP CONSTRAINT ' + QUOTENAME(@df);
            EXEC(@sql);
        END

        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_ehs_budget_expense') AND name = @col)
        BEGIN
            SET @sql = N'ALTER TABLE tb_ehs_budget_expense DROP COLUMN ' + QUOTENAME(@col);
            EXEC(@sql);
        END
        FETCH NEXT FROM cur INTO @col;
    END
    CLOSE cur;
    DEALLOCATE cur;
END
GO

-- 더미데이터 재생성 (2026년 데이터만 wipe 후 다시 삽입)
IF OBJECT_ID('tb_ehs_budget_expense', 'U') IS NOT NULL
BEGIN
    DELETE FROM tb_ehs_budget_expense WHERE budget_year = 2026;

    INSERT INTO tb_ehs_budget_expense (budget_year, category, item_name, amount, expense_date, department, note, created_at, modified_at)
    VALUES
    (2026, 'PPE',         N'안전모 50개',           420000,  '2026-01-12', N'노경지원팀', NULL, GETDATE(), GETDATE()),
    (2026, 'TRAINING',    N'신규자 안전교육',       180000,  '2026-02-05', N'안전보건팀', NULL, GETDATE(), GETDATE()),
    (2026, 'HEALTH',      N'특수건강진단 1차',     3800000,  '2026-03-18', N'노경지원팀', N'1분기', GETDATE(), GETDATE()),
    (2026, 'ENV_MEASURE', N'작업환경측정 상반기',  1950000,  '2026-05-22', N'환경관리팀', NULL, GETDATE(), GETDATE()),
    (2026, 'SAFETY',      N'안전난간 공사',        2100000,  '2026-04-08', N'안전보건팀', NULL, GETDATE(), GETDATE()),
    (2026, 'PPE',         N'방진마스크 100개',      380000,  '2026-06-01', N'노경지원팀', NULL, GETDATE(), GETDATE());
END
GO
