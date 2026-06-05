-- ============================================================
-- V197: 시정 조치(Corrective) 기능 폐기 — 관련 테이블 삭제
--   - tb_audit_corrective         (내부 감사 시정 조치)
--   - tb_legal_compliance_corrective (법규 대응 시정 조치)
-- 부적합 사항(finding)의 status 컬럼은 그대로 유지하여 처리 상태만 추적.
-- ============================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_audit_corrective', 'U') IS NOT NULL
BEGIN
    DROP TABLE tb_audit_corrective;
END
GO

IF OBJECT_ID('tb_legal_compliance_corrective', 'U') IS NOT NULL
BEGIN
    DROP TABLE tb_legal_compliance_corrective;
END
GO
