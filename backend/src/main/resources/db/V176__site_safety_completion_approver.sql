-- V176: 현장/협력 업체 안전 관리 — 완료 승인자 컬럼 추가
--   계획 승인자(plan_approver_*) 와 별도로 완료 승인자(completion_approver_*) 를 보관
--   기존 V175 PARTNER 더미에 두 승인자 값 백필

SET NOCOUNT ON;
GO

IF COL_LENGTH('tb_site_safety_plan', 'completion_approver_user_id') IS NULL
BEGIN
    ALTER TABLE tb_site_safety_plan ADD
        completion_approver_user_id  BIGINT        NULL,
        completion_approver_team     NVARCHAR(100) NULL,
        completion_approver_position NVARCHAR(100) NULL,
        completion_approver_name     NVARCHAR(100) NULL,
        completion_approved_at       DATETIME2     NULL,
        completion_approved_by       NVARCHAR(50)  NULL;
END;
GO

-- 기존 PARTNER 더미에 계획/완료 승인자 백필 — 미값일 때만 채움
UPDATE tb_site_safety_plan
SET
    plan_approver_name       = COALESCE(plan_approver_name,       N'이안전'),
    plan_approver_team       = COALESCE(plan_approver_team,       N'안전관리팀'),
    plan_approver_position   = COALESCE(plan_approver_position,   N'팀장'),
    completion_approver_name     = COALESCE(completion_approver_name,     N'박점검'),
    completion_approver_team     = COALESCE(completion_approver_team,     N'환경안전팀'),
    completion_approver_position = COALESCE(completion_approver_position, N'대리')
WHERE plan_type = 'PARTNER';
GO
