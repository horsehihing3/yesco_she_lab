-- V146: 협력사 계획 결재 흐름 분리 + 더미데이터 백필
--   기존 단일 approver_name 보존, plan_/completion_ 컬럼 신설.
--   status: DRAFT / PENDING_APPROVAL / APPROVED / DONE / REJECTED

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_contractor_plan', 'U') IS NULL
    RETURN;
GO

-- ===== 1) 신규 컬럼 추가 =====
IF COL_LENGTH('tb_contractor_plan', 'plan_approver_user_id') IS NULL
    ALTER TABLE tb_contractor_plan ADD plan_approver_user_id BIGINT NULL;
IF COL_LENGTH('tb_contractor_plan', 'plan_approver_team') IS NULL
    ALTER TABLE tb_contractor_plan ADD plan_approver_team NVARCHAR(100) NULL;
IF COL_LENGTH('tb_contractor_plan', 'plan_approver_position') IS NULL
    ALTER TABLE tb_contractor_plan ADD plan_approver_position NVARCHAR(50) NULL;
IF COL_LENGTH('tb_contractor_plan', 'plan_approver_name') IS NULL
    ALTER TABLE tb_contractor_plan ADD plan_approver_name NVARCHAR(100) NULL;
IF COL_LENGTH('tb_contractor_plan', 'plan_approved_at') IS NULL
    ALTER TABLE tb_contractor_plan ADD plan_approved_at DATETIME2 NULL;
IF COL_LENGTH('tb_contractor_plan', 'plan_approved_by') IS NULL
    ALTER TABLE tb_contractor_plan ADD plan_approved_by NVARCHAR(100) NULL;

IF COL_LENGTH('tb_contractor_plan', 'completion_approver_user_id') IS NULL
    ALTER TABLE tb_contractor_plan ADD completion_approver_user_id BIGINT NULL;
IF COL_LENGTH('tb_contractor_plan', 'completion_approver_team') IS NULL
    ALTER TABLE tb_contractor_plan ADD completion_approver_team NVARCHAR(100) NULL;
IF COL_LENGTH('tb_contractor_plan', 'completion_approver_position') IS NULL
    ALTER TABLE tb_contractor_plan ADD completion_approver_position NVARCHAR(50) NULL;
IF COL_LENGTH('tb_contractor_plan', 'completion_approver_name') IS NULL
    ALTER TABLE tb_contractor_plan ADD completion_approver_name NVARCHAR(100) NULL;
IF COL_LENGTH('tb_contractor_plan', 'completion_approved_at') IS NULL
    ALTER TABLE tb_contractor_plan ADD completion_approved_at DATETIME2 NULL;
IF COL_LENGTH('tb_contractor_plan', 'completion_approved_by') IS NULL
    ALTER TABLE tb_contractor_plan ADD completion_approved_by NVARCHAR(100) NULL;
GO

-- ===== 2) 옛 approver_name → plan_approver_name 1회 백필 =====
UPDATE tb_contractor_plan
   SET plan_approver_name = COALESCE(plan_approver_name, approver_name)
 WHERE approver_name IS NOT NULL AND plan_approver_name IS NULL;
GO

-- ===== 3) 옛 approved_at/by → plan_approved_* 1회 백필 =====
UPDATE tb_contractor_plan
   SET plan_approved_at = COALESCE(plan_approved_at, approved_at),
       plan_approved_by = COALESCE(plan_approved_by, approved_by)
 WHERE approved_at IS NOT NULL AND plan_approved_at IS NULL;
GO

-- ===== 4) 더미 결재선 백필 =====
UPDATE tb_contractor_plan
   SET plan_approver_team       = COALESCE(NULLIF(plan_approver_team, N''),       N'안전보건팀'),
       plan_approver_position   = COALESCE(NULLIF(plan_approver_position, N''),   N'팀장'),
       plan_approver_name       = COALESCE(NULLIF(plan_approver_name, N''),       N'홍성기'),
       completion_approver_team     = COALESCE(NULLIF(completion_approver_team, N''),     N'EHS팀'),
       completion_approver_position = COALESCE(NULLIF(completion_approver_position, N''), N'팀장'),
       completion_approver_name     = COALESCE(NULLIF(completion_approver_name, N''),     N'박상민'),
       modified_at = GETDATE()
 WHERE deleted = 0;
GO

-- ===== 5) PERMIT_STATUS 코드그룹에 신규 상태 추가 =====
DECLARE @permitStatusGroupId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'PERMIT_STATUS');

IF @permitStatusGroupId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @permitStatusGroupId AND code = 'PENDING_APPROVAL')
        INSERT INTO tb_code_detail (group_id, code, code_name_ko, code_name_en, code_name_zh, sort_order, is_active)
        VALUES (@permitStatusGroupId, 'PENDING_APPROVAL', N'계획 결재 대기', 'Plan Approval Pending', N'计划审批待批准', 15, 1);

    IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @permitStatusGroupId AND code = 'COMPLETION_PENDING')
        INSERT INTO tb_code_detail (group_id, code, code_name_ko, code_name_en, code_name_zh, sort_order, is_active)
        VALUES (@permitStatusGroupId, 'COMPLETION_PENDING', N'완료 결재 대기', 'Completion Approval Pending', N'完成审批待批准', 35, 1);

    IF NOT EXISTS (SELECT * FROM tb_code_detail WHERE group_id = @permitStatusGroupId AND code = 'DONE')
        INSERT INTO tb_code_detail (group_id, code, code_name_ko, code_name_en, code_name_zh, sort_order, is_active)
        VALUES (@permitStatusGroupId, 'DONE', N'완료', 'Done', N'已完成', 40, 1);
END
GO
