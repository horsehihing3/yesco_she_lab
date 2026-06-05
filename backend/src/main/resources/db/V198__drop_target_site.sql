-- ============================================================
-- V198: 대상 현장(target_site) 컬럼 폐기 — 감사·법규 대응 4개 테이블에서 제거
--   - tb_audit_plan
--   - tb_audit
--   - tb_legal_compliance_plan
--   - tb_legal_compliance_exec
-- ============================================================

SET NOCOUNT ON;
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_audit_plan') AND name = 'target_site')
BEGIN
    ALTER TABLE tb_audit_plan DROP COLUMN target_site;
END
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_audit') AND name = 'target_site')
BEGIN
    ALTER TABLE tb_audit DROP COLUMN target_site;
END
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_legal_compliance_plan') AND name = 'target_site')
BEGIN
    ALTER TABLE tb_legal_compliance_plan DROP COLUMN target_site;
END
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tb_legal_compliance_exec') AND name = 'target_site')
BEGIN
    ALTER TABLE tb_legal_compliance_exec DROP COLUMN target_site;
END
GO
