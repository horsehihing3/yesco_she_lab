-- V143: 비상 대응 계획 결재 흐름 분리 + 훈련 일정 도입
--   - approved/approved_by/approved_at(단일 결재) 외 plan_approver_*, completion_approver_* 추가
--   - emergency_grade / drill_cycle / last_reviewed / next_review 는 더 이상 UI 에서 사용하지 않음 (DB 보존)
--   - training_start_date / training_end_date 컬럼 추가 (훈련 자동생성 시 scheduled_date 로 사용)
--   - status 컬럼 추가 (DRAFT / PENDING_APPROVAL / APPROVED / DONE)

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_emergency_plan', 'U') IS NULL
    RETURN;
GO

-- ===== 1) 신규 컬럼 추가 =====
IF COL_LENGTH('tb_emergency_plan', 'training_start_date') IS NULL
    ALTER TABLE tb_emergency_plan ADD training_start_date DATE NULL;
IF COL_LENGTH('tb_emergency_plan', 'training_end_date') IS NULL
    ALTER TABLE tb_emergency_plan ADD training_end_date DATE NULL;

IF COL_LENGTH('tb_emergency_plan', 'status') IS NULL
    ALTER TABLE tb_emergency_plan ADD status NVARCHAR(40) NULL;

IF COL_LENGTH('tb_emergency_plan', 'writer_user_id') IS NULL
    ALTER TABLE tb_emergency_plan ADD writer_user_id BIGINT NULL;
IF COL_LENGTH('tb_emergency_plan', 'writer_team') IS NULL
    ALTER TABLE tb_emergency_plan ADD writer_team NVARCHAR(100) NULL;
IF COL_LENGTH('tb_emergency_plan', 'writer_position') IS NULL
    ALTER TABLE tb_emergency_plan ADD writer_position NVARCHAR(50) NULL;
IF COL_LENGTH('tb_emergency_plan', 'writer_name') IS NULL
    ALTER TABLE tb_emergency_plan ADD writer_name NVARCHAR(100) NULL;

IF COL_LENGTH('tb_emergency_plan', 'plan_approver_user_id') IS NULL
    ALTER TABLE tb_emergency_plan ADD plan_approver_user_id BIGINT NULL;
IF COL_LENGTH('tb_emergency_plan', 'plan_approver_team') IS NULL
    ALTER TABLE tb_emergency_plan ADD plan_approver_team NVARCHAR(100) NULL;
IF COL_LENGTH('tb_emergency_plan', 'plan_approver_position') IS NULL
    ALTER TABLE tb_emergency_plan ADD plan_approver_position NVARCHAR(50) NULL;
IF COL_LENGTH('tb_emergency_plan', 'plan_approver_name') IS NULL
    ALTER TABLE tb_emergency_plan ADD plan_approver_name NVARCHAR(100) NULL;
IF COL_LENGTH('tb_emergency_plan', 'plan_approved_at') IS NULL
    ALTER TABLE tb_emergency_plan ADD plan_approved_at DATETIME2 NULL;
IF COL_LENGTH('tb_emergency_plan', 'plan_approved_by') IS NULL
    ALTER TABLE tb_emergency_plan ADD plan_approved_by NVARCHAR(100) NULL;

IF COL_LENGTH('tb_emergency_plan', 'completion_approver_user_id') IS NULL
    ALTER TABLE tb_emergency_plan ADD completion_approver_user_id BIGINT NULL;
IF COL_LENGTH('tb_emergency_plan', 'completion_approver_team') IS NULL
    ALTER TABLE tb_emergency_plan ADD completion_approver_team NVARCHAR(100) NULL;
IF COL_LENGTH('tb_emergency_plan', 'completion_approver_position') IS NULL
    ALTER TABLE tb_emergency_plan ADD completion_approver_position NVARCHAR(50) NULL;
IF COL_LENGTH('tb_emergency_plan', 'completion_approver_name') IS NULL
    ALTER TABLE tb_emergency_plan ADD completion_approver_name NVARCHAR(100) NULL;
IF COL_LENGTH('tb_emergency_plan', 'completion_approved_at') IS NULL
    ALTER TABLE tb_emergency_plan ADD completion_approved_at DATETIME2 NULL;
IF COL_LENGTH('tb_emergency_plan', 'completion_approved_by') IS NULL
    ALTER TABLE tb_emergency_plan ADD completion_approved_by NVARCHAR(100) NULL;
GO

-- ===== 2) 기존 approved/approved_at/by 데이터 → completion_approved_* 1회 백필 =====
IF COL_LENGTH('tb_emergency_plan', 'approved_at') IS NOT NULL
   AND COL_LENGTH('tb_emergency_plan', 'completion_approved_at') IS NOT NULL
BEGIN
    EXEC(N'
        UPDATE tb_emergency_plan
           SET completion_approved_at = COALESCE(completion_approved_at, approved_at),
               completion_approved_by = COALESCE(completion_approved_by, approved_by)
         WHERE approved_at IS NOT NULL AND completion_approved_at IS NULL
    ');
END
GO

-- ===== 3) status 백필 (기존 approved=1 → DONE, 그 외 DRAFT) =====
UPDATE tb_emergency_plan
   SET status = CASE WHEN approved = 1 THEN N'DONE' ELSE N'DRAFT' END
 WHERE status IS NULL OR LTRIM(RTRIM(status)) = N'';
GO

-- ===== 4) training_start_date / end_date 백필 (last_reviewed → start, next_review → end) =====
IF COL_LENGTH('tb_emergency_plan', 'last_reviewed') IS NOT NULL
BEGIN
    EXEC(N'
        UPDATE tb_emergency_plan
           SET training_start_date = COALESCE(training_start_date, last_reviewed)
         WHERE last_reviewed IS NOT NULL AND training_start_date IS NULL
    ');
END
GO
IF COL_LENGTH('tb_emergency_plan', 'next_review') IS NOT NULL
BEGIN
    EXEC(N'
        UPDATE tb_emergency_plan
           SET training_end_date = COALESCE(training_end_date, next_review)
         WHERE next_review IS NOT NULL AND training_end_date IS NULL
    ');
END
GO

-- ===== 5) 더미데이터: 승인자 + 작성자 + 훈련 일정 기본값 =====
UPDATE tb_emergency_plan
   SET writer_team     = COALESCE(NULLIF(writer_team, N''),     N'안전보건팀'),
       writer_position = COALESCE(NULLIF(writer_position, N''), N'대리'),
       writer_name     = COALESCE(NULLIF(writer_name, N''),     N'김민수'),
       plan_approver_team     = COALESCE(NULLIF(plan_approver_team, N''),     N'안전보건팀'),
       plan_approver_position = COALESCE(NULLIF(plan_approver_position, N''), N'팀장'),
       plan_approver_name     = COALESCE(NULLIF(plan_approver_name, N''),     N'홍성기'),
       completion_approver_team     = COALESCE(NULLIF(completion_approver_team, N''),     N'EHS팀'),
       completion_approver_position = COALESCE(NULLIF(completion_approver_position, N''), N'팀장'),
       completion_approver_name     = COALESCE(NULLIF(completion_approver_name, N''),     N'박상민'),
       training_start_date = COALESCE(training_start_date, DATEADD(DAY,  7, CAST(GETDATE() AS DATE))),
       training_end_date   = COALESCE(training_end_date,   DATEADD(DAY, 14, CAST(GETDATE() AS DATE))),
       modified_at = GETDATE()
 WHERE deleted = 0;
GO

-- ===== 6) 옛 컬럼은 보존 (호환성) — 추후 별도 마이그레이션에서 drop. =====
