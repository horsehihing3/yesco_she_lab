-- V151: 감사 계획/실시 양쪽에 plan_/completion_ 결재자 모두 보유
--   tb_audit_plan: completion_approver_* 컬럼 추가 (이미 plan_approver_* 보유)
--   tb_audit:      plan_approver_*, created_by_* 컬럼 추가 (이미 completion_approver_* 보유)
--   더미데이터 백필.

SET NOCOUNT ON;
GO

-- ===== tb_audit_plan: completion_approver_* 추가 =====
IF OBJECT_ID('tb_audit_plan', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('tb_audit_plan', 'completion_approver_user_id') IS NULL
        ALTER TABLE tb_audit_plan ADD completion_approver_user_id BIGINT NULL;
    IF COL_LENGTH('tb_audit_plan', 'completion_approver_team') IS NULL
        ALTER TABLE tb_audit_plan ADD completion_approver_team NVARCHAR(100) NULL;
    IF COL_LENGTH('tb_audit_plan', 'completion_approver_position') IS NULL
        ALTER TABLE tb_audit_plan ADD completion_approver_position NVARCHAR(50) NULL;
    IF COL_LENGTH('tb_audit_plan', 'completion_approver_name') IS NULL
        ALTER TABLE tb_audit_plan ADD completion_approver_name NVARCHAR(100) NULL;
    IF COL_LENGTH('tb_audit_plan', 'completion_approved_at') IS NULL
        ALTER TABLE tb_audit_plan ADD completion_approved_at DATETIME2 NULL;
    IF COL_LENGTH('tb_audit_plan', 'completion_approved_by') IS NULL
        ALTER TABLE tb_audit_plan ADD completion_approved_by NVARCHAR(100) NULL;
END
GO

-- ===== tb_audit: plan_approver_* + created_by_* 추가 =====
IF OBJECT_ID('tb_audit', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('tb_audit', 'plan_approver_user_id') IS NULL
        ALTER TABLE tb_audit ADD plan_approver_user_id BIGINT NULL;
    IF COL_LENGTH('tb_audit', 'plan_approver_team') IS NULL
        ALTER TABLE tb_audit ADD plan_approver_team NVARCHAR(100) NULL;
    IF COL_LENGTH('tb_audit', 'plan_approver_position') IS NULL
        ALTER TABLE tb_audit ADD plan_approver_position NVARCHAR(50) NULL;
    IF COL_LENGTH('tb_audit', 'plan_approver_name') IS NULL
        ALTER TABLE tb_audit ADD plan_approver_name NVARCHAR(100) NULL;
    IF COL_LENGTH('tb_audit', 'plan_approved_at') IS NULL
        ALTER TABLE tb_audit ADD plan_approved_at DATETIME2 NULL;
    IF COL_LENGTH('tb_audit', 'plan_approved_by') IS NULL
        ALTER TABLE tb_audit ADD plan_approved_by NVARCHAR(100) NULL;
    IF COL_LENGTH('tb_audit', 'created_by_user_id') IS NULL
        ALTER TABLE tb_audit ADD created_by_user_id BIGINT NULL;
    IF COL_LENGTH('tb_audit', 'created_by_name') IS NULL
        ALTER TABLE tb_audit ADD created_by_name NVARCHAR(100) NULL;
END
GO

-- ===== tb_audit_plan: completion_approver 더미 백필 (NULL/공란만) =====
UPDATE tb_audit_plan
   SET completion_approver_team     = COALESCE(NULLIF(completion_approver_team, N''),     N'EHS팀'),
       completion_approver_position = COALESCE(NULLIF(completion_approver_position, N''), N'팀장'),
       completion_approver_name     = COALESCE(NULLIF(completion_approver_name, N''),     N'박상민'),
       modified_at = GETDATE()
 WHERE deleted = 0;
GO

-- ===== tb_audit: plan_approver / created_by 더미 백필 =====
-- 1) tb_audit_plan 에서 plan_approver/created_by 복사 (plan_id 매칭)
UPDATE a
   SET a.plan_approver_user_id  = COALESCE(a.plan_approver_user_id,  p.plan_approver_user_id),
       a.plan_approver_team     = COALESCE(NULLIF(a.plan_approver_team, N''),     p.plan_approver_team),
       a.plan_approver_position = COALESCE(NULLIF(a.plan_approver_position, N''), p.plan_approver_position),
       a.plan_approver_name     = COALESCE(NULLIF(a.plan_approver_name, N''),     p.plan_approver_name),
       a.plan_approved_at       = COALESCE(a.plan_approved_at,       p.plan_approved_at),
       a.plan_approved_by       = COALESCE(NULLIF(a.plan_approved_by, N''),       p.plan_approved_by),
       a.created_by_user_id     = COALESCE(a.created_by_user_id,     p.created_by_user_id),
       a.created_by_name        = COALESCE(NULLIF(a.created_by_name, N''),        p.created_by_name)
  FROM tb_audit a
  JOIN tb_audit_plan p ON a.plan_id = p.id
 WHERE a.deleted = 0;
GO

-- 2) 여전히 NULL/공란인 경우 기본 더미값
UPDATE tb_audit
   SET plan_approver_team     = COALESCE(NULLIF(plan_approver_team, N''),     N'안전보건팀'),
       plan_approver_position = COALESCE(NULLIF(plan_approver_position, N''), N'팀장'),
       plan_approver_name     = COALESCE(NULLIF(plan_approver_name, N''),     N'홍성기'),
       created_by_name        = COALESCE(NULLIF(created_by_name, N''),        N'김민수'),
       modified_at = GETDATE()
 WHERE deleted = 0;
GO
