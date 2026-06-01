-- V128: tb_audit_corrective.completion_rate 컬럼 제거
-- UI 에서 입력란을 제거했으므로 DB 컬럼도 정리.

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_audit_corrective') AND name = 'completion_rate')
BEGIN
    -- DEFAULT 제약이 있으면 먼저 삭제
    DECLARE @defName NVARCHAR(200);
    SELECT @defName = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = OBJECT_ID('tb_audit_corrective') AND c.name = 'completion_rate';
    IF @defName IS NOT NULL
        EXEC('ALTER TABLE tb_audit_corrective DROP CONSTRAINT ' + @defName);

    ALTER TABLE tb_audit_corrective DROP COLUMN completion_rate;
END;
