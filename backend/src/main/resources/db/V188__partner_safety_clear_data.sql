-- ============================================================
-- V188: 협력 업체 안전 관리 — 관리/실행/조회 목록 데이터 전부 삭제
-- ============================================================

SET NOCOUNT ON;
GO

-- 실행/조회 (tb_partner_safety_execution)
IF OBJECT_ID('tb_partner_safety_execution', 'U') IS NOT NULL
BEGIN
    DELETE FROM tb_partner_safety_execution;
END
GO

-- 관리 (tb_site_safety_plan + worker, plan_type = 'PARTNER')
IF OBJECT_ID('tb_site_safety_worker', 'U') IS NOT NULL
BEGIN
    DELETE FROM tb_site_safety_worker
    WHERE plan_id IN (SELECT id FROM tb_site_safety_plan WHERE plan_type = 'PARTNER');
END
GO

IF OBJECT_ID('tb_site_safety_plan', 'U') IS NOT NULL
BEGIN
    DELETE FROM tb_site_safety_plan WHERE plan_type = 'PARTNER';
END
GO
