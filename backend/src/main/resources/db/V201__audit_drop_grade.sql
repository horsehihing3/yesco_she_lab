-- V201: tb_audit.grade 컬럼 삭제 (실무에서 사용하지 않음)
-- idempotent

IF OBJECT_ID('tb_audit', 'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_audit') AND name = 'grade')
BEGIN
    -- DEFAULT 제약조건 있으면 먼저 제거
    DECLARE @cn SYSNAME;
    SELECT @cn = dc.name FROM sys.default_constraints dc
        JOIN sys.columns c ON c.default_object_id = dc.object_id
        WHERE c.object_id = OBJECT_ID('tb_audit') AND c.name = 'grade';
    IF @cn IS NOT NULL EXEC('ALTER TABLE tb_audit DROP CONSTRAINT ' + @cn);

    ALTER TABLE tb_audit DROP COLUMN grade;
END
GO
