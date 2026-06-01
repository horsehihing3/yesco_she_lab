-- V141: 감사 결재 흐름 분리
--   tb_audit_plan : 단일 approved_* → plan_approver_* (계획 승인) 로 의미 정리 + 컬럼 추가
--   tb_audit      : completion_approver_* (완료 승인) + completion_approved_at/by 컬럼 신규 추가
--   각 모듈에서 지정된 승인자 또는 admin 만 승인/반려/완료 가능 (권한 체크는 백엔드 서비스에서)

SET NOCOUNT ON;
GO

-- ========== tb_audit_plan : 계획 승인자 컬럼 추가 + 옛 approved_* 데이터 백필 ==========
IF OBJECT_ID('tb_audit_plan', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('tb_audit_plan', 'plan_approver_user_id') IS NULL
        ALTER TABLE tb_audit_plan ADD plan_approver_user_id BIGINT NULL;
    IF COL_LENGTH('tb_audit_plan', 'plan_approver_team') IS NULL
        ALTER TABLE tb_audit_plan ADD plan_approver_team NVARCHAR(100) NULL;
    IF COL_LENGTH('tb_audit_plan', 'plan_approver_position') IS NULL
        ALTER TABLE tb_audit_plan ADD plan_approver_position NVARCHAR(50) NULL;
    IF COL_LENGTH('tb_audit_plan', 'plan_approver_name') IS NULL
        ALTER TABLE tb_audit_plan ADD plan_approver_name NVARCHAR(100) NULL;
    IF COL_LENGTH('tb_audit_plan', 'plan_approved_at') IS NULL
        ALTER TABLE tb_audit_plan ADD plan_approved_at DATETIME2 NULL;
    IF COL_LENGTH('tb_audit_plan', 'plan_approved_by') IS NULL
        ALTER TABLE tb_audit_plan ADD plan_approved_by NVARCHAR(100) NULL;
END
GO

-- 옛 approved_at/by → plan_approved_at/by 1회 백필
IF COL_LENGTH('tb_audit_plan', 'approved_at') IS NOT NULL
   AND COL_LENGTH('tb_audit_plan', 'plan_approved_at') IS NOT NULL
BEGIN
    EXEC(N'
        UPDATE tb_audit_plan
           SET plan_approved_at = COALESCE(plan_approved_at, approved_at),
               plan_approved_by = COALESCE(plan_approved_by, approved_by)
         WHERE approved_at IS NOT NULL AND plan_approved_at IS NULL
    ');
END
GO

-- ========== tb_audit : 완료 승인자 컬럼 추가 ==========
IF OBJECT_ID('tb_audit', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('tb_audit', 'completion_approver_user_id') IS NULL
        ALTER TABLE tb_audit ADD completion_approver_user_id BIGINT NULL;
    IF COL_LENGTH('tb_audit', 'completion_approver_team') IS NULL
        ALTER TABLE tb_audit ADD completion_approver_team NVARCHAR(100) NULL;
    IF COL_LENGTH('tb_audit', 'completion_approver_position') IS NULL
        ALTER TABLE tb_audit ADD completion_approver_position NVARCHAR(50) NULL;
    IF COL_LENGTH('tb_audit', 'completion_approver_name') IS NULL
        ALTER TABLE tb_audit ADD completion_approver_name NVARCHAR(100) NULL;
    IF COL_LENGTH('tb_audit', 'completion_approved_at') IS NULL
        ALTER TABLE tb_audit ADD completion_approved_at DATETIME2 NULL;
    IF COL_LENGTH('tb_audit', 'completion_approved_by') IS NULL
        ALTER TABLE tb_audit ADD completion_approved_by NVARCHAR(100) NULL;
END
GO

-- ========== 더미데이터 백필 ==========
IF OBJECT_ID('tb_audit_plan', 'U') IS NOT NULL
   AND COL_LENGTH('tb_audit_plan', 'plan_approver_name') IS NOT NULL
BEGIN
    UPDATE tb_audit_plan
       SET plan_approver_team     = COALESCE(NULLIF(plan_approver_team, N''),     N'안전보건팀'),
           plan_approver_position = COALESCE(NULLIF(plan_approver_position, N''), N'팀장'),
           plan_approver_name     = COALESCE(NULLIF(plan_approver_name, N''),     N'홍성기'),
           modified_at = GETDATE()
     WHERE plan_approver_name IS NULL OR LTRIM(RTRIM(plan_approver_name)) = N'';
END
GO

IF OBJECT_ID('tb_audit', 'U') IS NOT NULL
   AND COL_LENGTH('tb_audit', 'completion_approver_name') IS NOT NULL
BEGIN
    UPDATE tb_audit
       SET completion_approver_team     = COALESCE(NULLIF(completion_approver_team, N''),     N'EHS팀'),
           completion_approver_position = COALESCE(NULLIF(completion_approver_position, N''), N'팀장'),
           completion_approver_name     = COALESCE(NULLIF(completion_approver_name, N''),     N'박상민'),
           modified_at = GETDATE()
     WHERE completion_approver_name IS NULL OR LTRIM(RTRIM(completion_approver_name)) = N'';
END
GO
