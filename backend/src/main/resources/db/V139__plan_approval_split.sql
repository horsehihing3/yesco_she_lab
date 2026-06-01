-- V139: 연간 계획 결재 흐름 분리
--   - 단일 approver_* 컬럼 → plan_approver_* + completion_approver_* 분리
--   - approved_at/approved_by → plan_approved_at/by + completion_approved_at/by
--   - revised_date 컬럼은 더 이상 UI 에서 사용하지 않음 (DB 보존, DTO 에서 제외)

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_ehs_annual_plan', 'U') IS NULL
    RETURN;
GO

-- ===== 1) 컬럼 신규 추가 =====
IF COL_LENGTH('tb_ehs_annual_plan', 'plan_approver_user_id') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD plan_approver_user_id BIGINT NULL;
IF COL_LENGTH('tb_ehs_annual_plan', 'plan_approver_team') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD plan_approver_team NVARCHAR(100) NULL;
IF COL_LENGTH('tb_ehs_annual_plan', 'plan_approver_position') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD plan_approver_position NVARCHAR(50) NULL;
IF COL_LENGTH('tb_ehs_annual_plan', 'plan_approver_name') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD plan_approver_name NVARCHAR(100) NULL;

IF COL_LENGTH('tb_ehs_annual_plan', 'completion_approver_user_id') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD completion_approver_user_id BIGINT NULL;
IF COL_LENGTH('tb_ehs_annual_plan', 'completion_approver_team') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD completion_approver_team NVARCHAR(100) NULL;
IF COL_LENGTH('tb_ehs_annual_plan', 'completion_approver_position') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD completion_approver_position NVARCHAR(50) NULL;
IF COL_LENGTH('tb_ehs_annual_plan', 'completion_approver_name') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD completion_approver_name NVARCHAR(100) NULL;

IF COL_LENGTH('tb_ehs_annual_plan', 'plan_approved_at') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD plan_approved_at DATETIME2 NULL;
IF COL_LENGTH('tb_ehs_annual_plan', 'plan_approved_by') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD plan_approved_by NVARCHAR(100) NULL;

IF COL_LENGTH('tb_ehs_annual_plan', 'completion_approved_at') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD completion_approved_at DATETIME2 NULL;
IF COL_LENGTH('tb_ehs_annual_plan', 'completion_approved_by') IS NULL
    ALTER TABLE tb_ehs_annual_plan ADD completion_approved_by NVARCHAR(100) NULL;
GO

-- ===== 2) 기존 approver_* 데이터를 plan_approver_* 로 이관 (1회) =====
IF COL_LENGTH('tb_ehs_annual_plan', 'approver_name') IS NOT NULL
   AND COL_LENGTH('tb_ehs_annual_plan', 'plan_approver_name') IS NOT NULL
BEGIN
    EXEC(N'
        UPDATE tb_ehs_annual_plan
           SET plan_approver_user_id  = COALESCE(plan_approver_user_id,  approver_user_id),
               plan_approver_team     = COALESCE(plan_approver_team,     approver_team),
               plan_approver_position = COALESCE(plan_approver_position, approver_position),
               plan_approver_name     = COALESCE(plan_approver_name,     approver_name)
         WHERE approver_name IS NOT NULL
    ');
END
GO

IF COL_LENGTH('tb_ehs_annual_plan', 'approved_at') IS NOT NULL
   AND COL_LENGTH('tb_ehs_annual_plan', 'plan_approved_at') IS NOT NULL
BEGIN
    EXEC(N'
        UPDATE tb_ehs_annual_plan
           SET plan_approved_at = COALESCE(plan_approved_at, approved_at),
               plan_approved_by = COALESCE(plan_approved_by, approved_by)
         WHERE approved_at IS NOT NULL
    ');
END
GO

-- ===== 3) 더미데이터 추가 채우기 (기존 approver 가 plan_approver 가 됐으니 completion_approver 만 셋업) =====
UPDATE tb_ehs_annual_plan
   SET completion_approver_team     = COALESCE(completion_approver_team,     N'노경지원팀'),
       completion_approver_position = COALESCE(completion_approver_position, N'팀장'),
       completion_approver_name     = COALESCE(completion_approver_name,     N'홍성기')
 WHERE plan_approver_name IS NOT NULL;
GO

-- ===== 4) 옛 컬럼은 유지 (호환성). 추후 필요 시 별도 마이그레이션에서 drop. =====
