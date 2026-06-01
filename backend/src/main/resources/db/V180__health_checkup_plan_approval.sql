-- V180: 건강검진 계획 — 결재 워크플로우 도입
--   1) 계획 승인자 / 완료 승인자 / 작성자 컬럼 추가
--   2) PENDING_APPROVAL / REJECTED 상태 코드 추가
--   3) reject_reason 컬럼 추가
--   첨부파일은 tb_file (entity_type='health_checkup_plan', entity_id=<plan.id>) 로 연결

SET NOCOUNT ON;
GO

IF COL_LENGTH('tb_health_checkup_plan', 'plan_approver_user_id') IS NULL
BEGIN
    ALTER TABLE tb_health_checkup_plan ADD
        plan_approver_user_id        BIGINT        NULL,
        plan_approver_team           NVARCHAR(100) NULL,
        plan_approver_position       NVARCHAR(100) NULL,
        plan_approver_name           NVARCHAR(100) NULL,
        plan_approved_at             DATETIME2     NULL,
        plan_approved_by             NVARCHAR(50)  NULL,
        completion_approver_user_id  BIGINT        NULL,
        completion_approver_team     NVARCHAR(100) NULL,
        completion_approver_position NVARCHAR(100) NULL,
        completion_approver_name     NVARCHAR(100) NULL,
        completion_approved_at       DATETIME2     NULL,
        completion_approved_by       NVARCHAR(50)  NULL,
        writer                       NVARCHAR(100) NULL,
        reject_reason                NVARCHAR(500) NULL;
END;
GO

-- HEALTH_CHECKUP_PLAN_STATUS: PENDING_APPROVAL / REJECTED 추가
IF EXISTS (SELECT 1 FROM tb_code_group WHERE group_code = 'HEALTH_CHECKUP_PLAN_STATUS')
BEGIN
    DECLARE @grpId BIGINT = (SELECT id FROM tb_code_group WHERE group_code = 'HEALTH_CHECKUP_PLAN_STATUS');

    IF NOT EXISTS (SELECT 1 FROM tb_code_detail WHERE group_id = @grpId AND code = 'PENDING_APPROVAL')
    BEGIN
        INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
        VALUES (@grpId, 'PENDING_APPROVAL', 'PENDING_APPROVAL', N'결재대기', 'Pending Approval', N'待审批', 1, 15, GETDATE(), GETDATE());
    END;

    IF NOT EXISTS (SELECT 1 FROM tb_code_detail WHERE group_id = @grpId AND code = 'REJECTED')
    BEGIN
        INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at)
        VALUES (@grpId, 'REJECTED', 'REJECTED', N'반려', 'Rejected', N'已驳回', 1, 35, GETDATE(), GETDATE());
    END;
END;
GO

-- 기존 PLANNED 더미 일부를 결재 흐름 데이터로 백필 (체험용)
UPDATE tb_health_checkup_plan
SET plan_approver_name = N'이안전', plan_approver_team = N'안전관리팀', plan_approver_position = N'팀장',
    completion_approver_name = N'박점검', completion_approver_team = N'환경안전팀', completion_approver_position = N'대리',
    writer = N'관리자'
WHERE plan_approver_name IS NULL;
GO
