-- V142: tb_risk_assessment 에서 author_company(소속사) 컬럼 제거
-- (위험성 평가 등록/수정 화면에서 소속사 항목 삭제)

IF OBJECT_ID('tb_risk_assessment') IS NOT NULL
BEGIN
    DECLARE @df_name sysname;
    DECLARE @sql NVARCHAR(MAX);

    SELECT @df_name = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('tb_risk_assessment') AND c.name = 'author_company';
    IF @df_name IS NOT NULL
    BEGIN
        SET @sql = 'ALTER TABLE tb_risk_assessment DROP CONSTRAINT ' + @df_name;
        EXEC sp_executesql @sql;
    END

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment') AND name = 'author_company')
        EXEC('ALTER TABLE tb_risk_assessment DROP COLUMN author_company');
END
