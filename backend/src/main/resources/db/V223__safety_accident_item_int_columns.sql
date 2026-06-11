-- 보건안전 재해발생 정보 항목: 아차사고/사망재해/휴업재해 컬럼을 BIT → INT로 변경 (건수 입력)
-- BIT 컬럼에 걸린 시스템 생성 DEFAULT 제약을 먼저 DROP한 뒤 ALTER COLUMN 수행

DECLARE @sql NVARCHAR(MAX) = N'';

SELECT @sql = @sql + N'ALTER TABLE tb_safety_accident_item DROP CONSTRAINT [' + dc.name + N']; '
FROM sys.default_constraints dc
JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
WHERE dc.parent_object_id = OBJECT_ID('tb_safety_accident_item')
  AND c.name IN ('near_miss','fatal_accident','leave_over_1month','leave_under_1month','no_leave');

IF LEN(@sql) > 0
    EXEC sp_executesql @sql;
GO

ALTER TABLE tb_safety_accident_item ALTER COLUMN near_miss INT NULL;
GO
ALTER TABLE tb_safety_accident_item ALTER COLUMN fatal_accident INT NULL;
GO
ALTER TABLE tb_safety_accident_item ALTER COLUMN leave_over_1month INT NULL;
GO
ALTER TABLE tb_safety_accident_item ALTER COLUMN leave_under_1month INT NULL;
GO
ALTER TABLE tb_safety_accident_item ALTER COLUMN no_leave INT NULL;
GO
