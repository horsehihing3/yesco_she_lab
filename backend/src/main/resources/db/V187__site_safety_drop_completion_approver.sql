-- ============================================================
-- V187: tb_site_safety_plan — 완료 승인자 관련 컬럼 제거
--   완료 결재 프로세스가 폐지되어 (협력 업체 안전 관리 실행 새 흐름) 컬럼도 정리
-- ============================================================

SET NOCOUNT ON;
GO

IF COL_LENGTH('tb_site_safety_plan', 'completion_approver_user_id') IS NOT NULL
    ALTER TABLE tb_site_safety_plan DROP COLUMN completion_approver_user_id;
GO
IF COL_LENGTH('tb_site_safety_plan', 'completion_approver_team') IS NOT NULL
    ALTER TABLE tb_site_safety_plan DROP COLUMN completion_approver_team;
GO
IF COL_LENGTH('tb_site_safety_plan', 'completion_approver_position') IS NOT NULL
    ALTER TABLE tb_site_safety_plan DROP COLUMN completion_approver_position;
GO
IF COL_LENGTH('tb_site_safety_plan', 'completion_approver_name') IS NOT NULL
    ALTER TABLE tb_site_safety_plan DROP COLUMN completion_approver_name;
GO
IF COL_LENGTH('tb_site_safety_plan', 'completion_approved_at') IS NOT NULL
    ALTER TABLE tb_site_safety_plan DROP COLUMN completion_approved_at;
GO
IF COL_LENGTH('tb_site_safety_plan', 'completion_approved_by') IS NOT NULL
    ALTER TABLE tb_site_safety_plan DROP COLUMN completion_approved_by;
GO
