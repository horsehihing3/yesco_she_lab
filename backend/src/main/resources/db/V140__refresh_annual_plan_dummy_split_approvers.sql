-- V140: 연간 계획 더미데이터를 새 구조(2 명의 승인자)로 보강.
--   기존 더미들에 plan_approver_* / completion_approver_* 기본값 채우기.
--   description 이 비어 있으면 placeholder 채움 (필수값 검증 통과용).

SET NOCOUNT ON;
GO

IF OBJECT_ID('tb_ehs_annual_plan', 'U') IS NULL
    RETURN;
GO

UPDATE tb_ehs_annual_plan
   SET description = COALESCE(NULLIF(LTRIM(RTRIM(description)), N''),
                              N'EHS 경영시스템 운영을 위한 연간 계획')
 WHERE description IS NULL OR LTRIM(RTRIM(description)) = N'';
GO

UPDATE tb_ehs_annual_plan
   SET plan_approver_team     = COALESCE(NULLIF(plan_approver_team, N''),     N'노경지원팀'),
       plan_approver_position = COALESCE(NULLIF(plan_approver_position, N''), N'팀장'),
       plan_approver_name     = COALESCE(NULLIF(plan_approver_name, N''),     N'홍성기'),
       completion_approver_team     = COALESCE(NULLIF(completion_approver_team, N''),     N'EHS팀'),
       completion_approver_position = COALESCE(NULLIF(completion_approver_position, N''), N'팀장'),
       completion_approver_name     = COALESCE(NULLIF(completion_approver_name, N''),     N'박상민'),
       modified_at = GETDATE()
 WHERE plan_approver_name IS NULL OR completion_approver_name IS NULL
    OR LTRIM(RTRIM(plan_approver_name)) = N''
    OR LTRIM(RTRIM(completion_approver_name)) = N'';
GO
