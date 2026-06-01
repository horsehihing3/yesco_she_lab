-- V145: 위험성 평가 결재 흐름 분리 (계획 결재 / 완료 결재) + 더미데이터 백필
--   기존 단일 approver_name/approver_mail 은 보존, 신규 plan_/completion_ 컬럼 추가.
--   status: draft / submitted / approved / completion_submitted / completed / rejected

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_risk_assessment', 'U') IS NULL
    RETURN;
GO

-- ===== 1) 신규 컬럼 추가 =====
IF COL_LENGTH('tb_risk_assessment', 'plan_approver_user_id') IS NULL
    ALTER TABLE tb_risk_assessment ADD plan_approver_user_id BIGINT NULL;
IF COL_LENGTH('tb_risk_assessment', 'plan_approver_team') IS NULL
    ALTER TABLE tb_risk_assessment ADD plan_approver_team NVARCHAR(100) NULL;
IF COL_LENGTH('tb_risk_assessment', 'plan_approver_position') IS NULL
    ALTER TABLE tb_risk_assessment ADD plan_approver_position NVARCHAR(50) NULL;
IF COL_LENGTH('tb_risk_assessment', 'plan_approver_name') IS NULL
    ALTER TABLE tb_risk_assessment ADD plan_approver_name NVARCHAR(100) NULL;
IF COL_LENGTH('tb_risk_assessment', 'plan_approved_at') IS NULL
    ALTER TABLE tb_risk_assessment ADD plan_approved_at DATETIME2 NULL;
IF COL_LENGTH('tb_risk_assessment', 'plan_approved_by') IS NULL
    ALTER TABLE tb_risk_assessment ADD plan_approved_by NVARCHAR(100) NULL;

IF COL_LENGTH('tb_risk_assessment', 'completion_approver_user_id') IS NULL
    ALTER TABLE tb_risk_assessment ADD completion_approver_user_id BIGINT NULL;
IF COL_LENGTH('tb_risk_assessment', 'completion_approver_team') IS NULL
    ALTER TABLE tb_risk_assessment ADD completion_approver_team NVARCHAR(100) NULL;
IF COL_LENGTH('tb_risk_assessment', 'completion_approver_position') IS NULL
    ALTER TABLE tb_risk_assessment ADD completion_approver_position NVARCHAR(50) NULL;
IF COL_LENGTH('tb_risk_assessment', 'completion_approver_name') IS NULL
    ALTER TABLE tb_risk_assessment ADD completion_approver_name NVARCHAR(100) NULL;
IF COL_LENGTH('tb_risk_assessment', 'completion_approved_at') IS NULL
    ALTER TABLE tb_risk_assessment ADD completion_approved_at DATETIME2 NULL;
IF COL_LENGTH('tb_risk_assessment', 'completion_approved_by') IS NULL
    ALTER TABLE tb_risk_assessment ADD completion_approved_by NVARCHAR(100) NULL;
GO

-- ===== 2) 옛 approver_name → plan_approver_name 1회 백필 =====
IF COL_LENGTH('tb_risk_assessment', 'approver_name') IS NOT NULL
   AND COL_LENGTH('tb_risk_assessment', 'plan_approver_name') IS NOT NULL
BEGIN
    EXEC(N'
        UPDATE tb_risk_assessment
           SET plan_approver_name = COALESCE(plan_approver_name, approver_name)
         WHERE approver_name IS NOT NULL AND plan_approver_name IS NULL
    ');
END
GO

-- ===== 3) 더미 결재선 백필 =====
UPDATE tb_risk_assessment
   SET plan_approver_team       = COALESCE(NULLIF(plan_approver_team, N''),       N'안전보건팀'),
       plan_approver_position   = COALESCE(NULLIF(plan_approver_position, N''),   N'팀장'),
       plan_approver_name       = COALESCE(NULLIF(plan_approver_name, N''),       N'홍성기'),
       completion_approver_team     = COALESCE(NULLIF(completion_approver_team, N''),     N'EHS팀'),
       completion_approver_position = COALESCE(NULLIF(completion_approver_position, N''), N'팀장'),
       completion_approver_name     = COALESCE(NULLIF(completion_approver_name, N''),     N'박상민'),
       modified_at = GETDATE();
GO
