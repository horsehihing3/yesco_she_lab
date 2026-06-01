-- V140: 위험성 평가 활동공정 목록에서 중분류(middle_category) 컬럼 제거
-- (위험성 평가 계획 탭 등록/수정 화면에서 중분류 항목 삭제)

IF OBJECT_ID('tb_risk_activity_process') IS NOT NULL
BEGIN
    DECLARE @df_name sysname;
    DECLARE @sql NVARCHAR(MAX);

    -- middle_category default constraint 제거
    SELECT @df_name = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('tb_risk_activity_process') AND c.name = 'middle_category';
    IF @df_name IS NOT NULL
    BEGIN
        SET @sql = 'ALTER TABLE tb_risk_activity_process DROP CONSTRAINT ' + @df_name;
        EXEC sp_executesql @sql;
    END

    -- 컬럼 제거
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_activity_process') AND name = 'middle_category')
        EXEC('ALTER TABLE tb_risk_activity_process DROP COLUMN middle_category');
END
