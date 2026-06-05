-- ============================================================
-- V192: tb_site_safety_plan — 완료 승인자 사전 지정 컬럼 복구
--   V187에서 DROP됐으나 관리 탭 폼에서 여전히 사용 중이므로 재추가
--   완료 결재 실행 기록(completion_approved_at/by)은 복구 안 함
-- ============================================================

SET NOCOUNT ON;
GO

IF COL_LENGTH('tb_site_safety_plan', 'completion_approver_user_id') IS NULL
    ALTER TABLE tb_site_safety_plan ADD completion_approver_user_id BIGINT NULL;
GO
IF COL_LENGTH('tb_site_safety_plan', 'completion_approver_team') IS NULL
    ALTER TABLE tb_site_safety_plan ADD completion_approver_team NVARCHAR(200) NULL;
GO
IF COL_LENGTH('tb_site_safety_plan', 'completion_approver_position') IS NULL
    ALTER TABLE tb_site_safety_plan ADD completion_approver_position NVARCHAR(200) NULL;
GO
IF COL_LENGTH('tb_site_safety_plan', 'completion_approver_name') IS NULL
    ALTER TABLE tb_site_safety_plan ADD completion_approver_name NVARCHAR(200) NULL;
GO
