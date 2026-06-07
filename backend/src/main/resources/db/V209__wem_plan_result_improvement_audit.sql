-- V209: tb_wem_plan / tb_wem_result / tb_wem_improvement 에 audit 컬럼 추가
DECLARE @tbl NVARCHAR(60), @col NVARCHAR(60), @sql NVARCHAR(MAX);

DECLARE tcur CURSOR FOR
SELECT t.t, c.c FROM
  (VALUES ('tb_wem_plan'),('tb_wem_result'),('tb_wem_improvement')) AS t(t)
  CROSS JOIN
  (VALUES ('created_by_user_id'),('created_by_name'),('modified_by_user_id'),('modified_by_name')) AS c(c);

OPEN tcur;
FETCH NEXT FROM tcur INTO @tbl, @col;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF OBJECT_ID(@tbl, 'U') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(@tbl) AND name = @col)
    BEGIN
        SET @sql = 'ALTER TABLE ' + @tbl + ' ADD ' + @col +
            CASE WHEN @col LIKE '%user_id' THEN ' BIGINT NULL' ELSE ' NVARCHAR(100) NULL' END;
        EXEC sp_executesql @sql;
    END
    FETCH NEXT FROM tcur INTO @tbl, @col;
END
CLOSE tcur;
DEALLOCATE tcur;
GO
